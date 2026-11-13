"""Backend regression checks using disposable data, never the real database."""
import base64
import http.client
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor

REPO = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('mememap_server', REPO / 'server.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='mememap-tests-')
        root = Path(cls.temp.name)
        settings = server.Settings(REPO, root / 'test.sqlite3', root / 'uploads')
        cls.httpd = server.create_server(settings, ('127.0.0.1', 0))
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join()
        cls.temp.cleanup()

    def call(self, method, path, payload=None, cookie=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.httpd.server_port)
        headers = {'Content-Type': 'application/json'}
        if cookie:
            headers['Cookie'] = cookie
        connection.request(method, path, json.dumps(payload) if payload is not None else None, headers)
        response = connection.getresponse()
        body = response.read()
        result = (response.status, response.getheaders(), body)
        connection.close()
        return result

    def account(self, username):
        status, headers, body = self.call('POST', '/api/register', {'name': username, 'username': username, 'password': 'test-password-123'})
        self.assertEqual(status, 201, body)
        return dict(headers)['Set-Cookie'].split(';')[0]

    def test_assets_and_route_permissions(self):
        for path in server.STATIC_ASSETS:
            status, headers, body = self.call('GET', path)
            self.assertEqual(status, 200, path)
            self.assertTrue(body)
            self.assertEqual(dict(headers)['Content-Type'], server.STATIC_ASSETS[path])
            self.assertEqual(sum(key == 'Cache-Control' for key, _ in headers), 1)
        self.assertEqual(self.call('GET', '/assets/../server.py')[0], 404)
        self.assertEqual(self.call('GET', '/api/pins')[0], 401)
        self.assertEqual(self.call('GET', '/api/map-config')[0], 401)
        self.assertEqual(self.call('GET', '/landing.html')[0], 303)
        self.assertFalse(json.loads(self.call('GET', '/api/me')[2])['authenticated'])

    def test_auth_profile_avatar_and_logout(self):
        cookie = self.account('profile_test')
        config = json.loads(self.call('GET', '/api/map-config', cookie=cookie)[2])
        self.assertEqual(config['bounds'], [[20.09, 104.83], [21.89, 106.76]])
        self.assertEqual(config['style'], 'https://tiles.openfreemap.org/styles/liberty')
        self.assertEqual(config['zoom'], 18)
        self.assertIn('{z}/{x}/{y}', config['tiles']['url'])
        self.assertEqual(self.call('POST', '/api/login', {'username': 'PROFILE_TEST', 'password': 'test-password-123'})[0], 200)
        self.assertEqual(self.call('POST', '/api/login', {'username': 'profile_test', 'password': 'wrong'})[0], 401)
        self.assertEqual(self.call('POST', '/api/register', {'name': 'Other', 'username': 'PROFILE_TEST', 'password': 'test-password-123'})[0], 409)
        image = 'data:image/webp;base64,' + base64.b64encode((REPO / 'assets/default-profile-picture.webp').read_bytes()).decode()
        status, _, body = self.call('POST', '/api/profile/avatar', {'image': image}, cookie)
        self.assertEqual(status, 200, body)
        avatar = json.loads(body)['avatar']
        self.assertTrue(avatar.startswith('/uploads/profiles/'))
        self.assertEqual(self.call('GET', avatar, cookie=cookie)[0], 200)
        self.assertEqual(self.call('GET', avatar)[0], 404)
        self.assertEqual(self.call('POST', '/api/profile/avatar', {'image': 'not an image'}, cookie)[0], 400)
        profile = json.loads(self.call('GET', '/api/profiles/profile_test', cookie=cookie)[2])['user']
        self.assertEqual(profile['avatar'], avatar)
        self.assertTrue(profile['is_self'])
        self.assertEqual(self.call('POST', '/api/logout', {}, cookie)[0], 200)
        self.assertFalse(json.loads(self.call('GET', '/api/me', cookie=cookie)[2])['authenticated'])

    def test_concurrent_asset_loads(self):
        assets = list(server.STATIC_ASSETS)
        barrier = threading.Barrier(len(assets))

        def load(path):
            barrier.wait(timeout=10)
            connection = http.client.HTTPConnection('127.0.0.1', self.httpd.server_port, timeout=10)
            try:
                connection.request('GET', path)
                response = connection.getresponse()
                return path, response.status, response.read()
            finally:
                connection.close()

        # Repeat the initial page's parallel asset burst, using no external services.
        with ThreadPoolExecutor(max_workers=len(assets)) as pool:
            for _ in range(3):
                for path, status, body in pool.map(load, assets):
                    self.assertEqual(status, 200, path)
                    self.assertEqual(body, (REPO / path.lstrip('/')).read_bytes(), path)

    def test_pins_votes_leaderboard_and_admin_delete(self):
        author = self.account('author_test')
        viewer = self.account('viewer_test')
        status, _, body = self.call('POST', '/api/pins', {'lat': 20.9893, 'lng': 105.7953, 'title': 'Regression pin', 'story': 'test'}, author)
        self.assertEqual(status, 201, body)
        pin = json.loads(body)['pin']
        vote_path = f"/api/pins/{pin['id']}/vote"
        self.assertEqual(self.call('POST', vote_path, {'value': 1}, author)[0], 403)
        self.assertEqual(self.call('POST', vote_path, {'value': 1.5}, viewer)[0], 400)
        for value, expected in [(1, 1), (1, 0), (-1, -1), (1, 1)]:
            self.assertEqual(json.loads(self.call('POST', vote_path, {'value': value}, viewer)[2])['pin']['aura'], expected)
        board = json.loads(self.call('GET', '/api/leaderboard?city=hanoi', cookie=viewer)[2])['leaders']
        self.assertEqual(board[0]['username'], 'author_test')
        self.assertEqual(board[0]['aura'], 1)
        self.assertEqual(self.call('GET', '/api/leaderboard?city=unsupported', cookie=viewer)[0], 400)
        self.assertEqual(self.call('POST', '/api/pins', {'lat': 0, 'lng': 0, 'title': 'Outside'}, author)[0], 400)
        self.assertEqual(self.call('DELETE', f"/api/pins/{pin['id']}", cookie=author)[0], 403)
        with self.httpd.application.database.connect() as db:
            db.execute("UPDATE users SET is_admin=1 WHERE username='viewer_test'")
        self.assertEqual(self.call('DELETE', f"/api/pins/{pin['id']}", cookie=viewer)[0], 200)
        with self.httpd.application.database.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM pin_votes WHERE pin_id=?', (pin['id'],)).fetchone()[0], 0)

    def test_image_contract_and_connection_cleanup(self):
        png = (REPO / 'assets/default-profile-picture.png').read_bytes()
        encoded = server.decode_upload('data:image/png;base64,' + base64.b64encode(png).decode(), 'invalid_image', 'image_too_large')
        self.assertEqual(encoded[8:12], b'WEBP')
        with self.assertRaises(server.InvalidImage):
            server.decode_upload('data:image/webp;base64,' + base64.b64encode(b'RIFF1234WEBPinvalid').decode(), 'invalid_image', 'image_too_large')
        animated = b'RIFF' + (22).to_bytes(4, 'little') + b'WEBPVP8X' + (10).to_bytes(4, 'little') + b'\x02' + bytes(9)
        with self.assertRaises(server.InvalidImage):
            server.decode_upload('data:image/webp;base64,' + base64.b64encode(animated).decode(), 'invalid_image', 'image_too_large')
        with self.httpd.application.database.connect() as db:
            db.execute('SELECT 1')
        with self.assertRaises(sqlite3.ProgrammingError):
            db.execute('SELECT 1')

    def test_concurrent_votes_are_serialized(self):
        author = self.account('concurrent_author')
        voter = self.account('concurrent_voter')
        pin = json.loads(self.call('POST', '/api/pins', {'lat': 20.9893, 'lng': 105.7953, 'title': 'Concurrent vote'}, author)[2])['pin']
        path = f"/api/pins/{pin['id']}/vote"
        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(lambda _: self.call('POST', path, {'value': 1}, voter), range(2)))
        self.assertEqual([response[0] for response in responses], [200, 200])
        with self.httpd.application.database.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM pin_votes WHERE pin_id=?', (pin['id'],)).fetchone()[0], 0)


if __name__ == '__main__':
    unittest.main()
