"""Moderation regressions against disposable SQLite databases and upload folders."""
import base64
import http.client
import importlib.util
import json
from pathlib import Path
from datetime import datetime, timezone
import sqlite3
import tempfile
import threading
import time
import unittest
from urllib.parse import urlencode


REPO = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('mememap_admin_server', REPO / 'server.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


def disposable_settings(root):
    return server.Settings(REPO, root / 'admin-test.sqlite3', root / 'uploads')


class QuietHandler(server.MemeMapHandler):
    def log_message(self, *_args):
        pass


class MigrationTests(unittest.TestCase):
    def test_legacy_records_survive_repeated_startup(self):
        with tempfile.TemporaryDirectory(prefix='mememap-migration-tests-') as temporary:
            app = server.Application(disposable_settings(Path(temporary)))
            with sqlite3.connect(app.settings.db_path) as db:
                db.executescript('''
                    CREATE TABLE users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
                        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                        password_hash BLOB NOT NULL, password_salt BLOB NOT NULL,
                        created_at INTEGER NOT NULL
                    );
                    CREATE TABLE pins (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        lat REAL NOT NULL, lng REAL NOT NULL, title TEXT NOT NULL,
                        story TEXT NOT NULL DEFAULT '', image_data TEXT, created_at INTEGER NOT NULL
                    );
                    CREATE TABLE pin_votes (
                        pin_id INTEGER NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        value INTEGER NOT NULL CHECK(value IN (-1, 1)), PRIMARY KEY(pin_id, user_id)
                    );
                    INSERT INTO users VALUES (1, 'Legacy Author', 'legacy@example.org', X'0102', X'0304', 1700000000);
                    INSERT INTO users VALUES (2, 'Legacy Voter', 'voter@example.org', X'0506', X'0708', 1700000001);
                    INSERT INTO pins VALUES (7, 1, 20.9893, 105.7953, 'Keep this meme', 'Original text', NULL, 1700000002);
                    INSERT INTO pin_votes VALUES (7, 2, 1);
                ''')
            app.initialize()
            with app.database.connect() as db:
                tables = [row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
                first = {table: [tuple(row) for row in db.execute(f'SELECT * FROM {table}')] for table in tables}
            app.initialize()
            with app.database.connect() as db:
                second = {table: [tuple(row) for row in db.execute(f'SELECT * FROM {table}')] for table in tables}
                self.assertEqual(first, second)
                self.assertEqual(db.execute('SELECT title, story, created_at FROM pins WHERE id=7').fetchone()[:],
                                 ('Keep this meme', 'Original text', 1700000002))
                self.assertEqual(db.execute('SELECT value FROM pin_votes WHERE pin_id=7 AND user_id=2').fetchone()[0], 1)
                user = db.execute('SELECT * FROM users WHERE id=1').fetchone()
                self.assertEqual(user['password_hash'], b'\x01\x02')
                self.assertEqual(user['password_salt'], b'\x03\x04')
                self.assertEqual(user['avatar_path'], '/assets/default-profile-picture.png')
                self.assertEqual(user['is_admin'], 0)
                self.assertEqual(list(db.execute('PRAGMA foreign_key_check')), [])


class AdminTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='mememap-admin-tests-')
        self.httpd = server.create_server(disposable_settings(Path(self.temp.name)), ('127.0.0.1', 0), QuietHandler)
        self.app = self.httpd.application
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        self.admin = self.account('moderator', admin=True)
        self.author = self.account('author')
        self.viewer = self.account('viewer')

    def tearDown(self):
        self.httpd.shutdown()
        self.httpd.server_close()
        self.thread.join()
        self.temp.cleanup()

    def call(self, method, path, payload=None, cookie=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.httpd.server_port, timeout=10)
        headers = {'Content-Type': 'application/json'}
        if cookie:
            headers['Cookie'] = cookie
        connection.request(method, path, json.dumps(payload) if payload is not None else None, headers)
        response = connection.getresponse()
        result = response.status, dict(response.getheaders()), response.read()
        connection.close()
        return result

    def request(self, method, path, payload=None, cookie=None, status=200):
        actual, _headers, body = self.call(method, path, payload, cookie)
        self.assertEqual(actual, status, f'{method} {path}: {body!r}')
        return json.loads(body)

    def account(self, username, admin=False):
        status, headers, body = self.call('POST', '/api/register', {
            'name': username.title(), 'username': username, 'password': 'admin-tests-password-123',
        })
        self.assertEqual(status, 201, body)
        if admin:
            with self.app.database.connect() as db:
                db.execute('UPDATE users SET is_admin=1 WHERE username=?', (username,))
        return headers['Set-Cookie'].split(';')[0]

    def user_id(self, username):
        with self.app.database.connect() as db:
            return db.execute('SELECT id FROM users WHERE username=?', (username,)).fetchone()[0]

    def pin(self, title='Admin regression meme', image=False, cookie=None):
        data = {'lat': 20.9893, 'lng': 105.7953, 'title': title, 'story': 'A local test meme'}
        if image:
            encoded = base64.b64encode((REPO / 'assets/default-profile-picture.webp').read_bytes()).decode()
            data['image'] = 'data:image/webp;base64,' + encoded
        return self.request('POST', '/api/pins', data, cookie or self.author, 201)['pin']

    def moderate(self, pin_id, action, reason='Reviewed by test moderator'):
        return self.request('POST', f'/api/admin/pins/{pin_id}/moderate',
                            {'action': action, 'reason': reason}, self.admin)['pin']

    def audit(self, **filters):
        return self.request('GET', '/api/admin/audit?' + urlencode(filters), cookie=self.admin)

    def test_admin_routes_require_server_side_role(self):
        pin = self.pin()
        routes = [
            ('GET', '/api/admin/overview', None),
            ('GET', '/api/admin/pins', None),
            ('GET', '/api/admin/reports', None),
            ('GET', '/api/admin/users', None),
            ('GET', '/api/admin/audit', None),
            ('POST', f"/api/admin/pins/{pin['id']}/moderate", {'action': 'hide', 'reason': 'Review'}),
            ('POST', f"/api/admin/reports/{pin['id']}", {'action': 'dismiss', 'reason': 'Review'}),
            ('POST', f"/api/admin/users/{self.user_id('author')}/restrictions",
             {'scope': 'both', 'action': 'restrict', 'duration_hours': 1, 'reason': 'Review'}),
            ('DELETE', f"/api/pins/{pin['id']}", {'reason': 'Review'}),
        ]
        for method, path, data in routes:
            with self.subTest(path=path):
                self.request(method, path, data, status=401)
                self.request(method, path, data, self.viewer, 403)
        self.assertTrue(self.request('GET', '/api/me', cookie=self.admin)['user']['is_admin'])
        with self.app.database.connect() as db:
            db.execute("UPDATE users SET is_admin=0 WHERE username='moderator'")
        self.request('GET', '/api/admin/pins', cookie=self.admin, status=403)
        self.assertEqual(len(self.request('GET', '/api/pins', cookie=self.author)['pins']), 1)

    def test_hide_restore_controls_feed_totals_votes_and_media(self):
        pin = self.pin(image=True)
        pin_id = pin['id']
        vote_path = f'/api/pins/{pin_id}/vote'
        self.request('POST', vote_path, {'value': 1}, self.viewer)
        status, headers, _body = self.call('GET', pin['image'], cookie=self.viewer)
        self.assertEqual(status, 200)
        self.assertNotIn('immutable', headers.get('Cache-Control', ''))
        self.request('POST', f'/api/admin/pins/{pin_id}/moderate', {'action': 'hide', 'reason': ''}, self.admin, 400)
        hidden = self.moderate(pin_id, 'hide', 'Remove until reviewed')
        self.assertTrue(hidden['is_hidden'])
        self.assertEqual(hidden['hidden_reason'], 'Remove until reviewed')
        for cookie in (self.admin, self.author, self.viewer):
            self.assertEqual(self.request('GET', '/api/pins', cookie=cookie)['pins'], [])
        for path in ('/api/me', '/api/profiles/author'):
            user = self.request('GET', path, cookie=self.author)['user']
            self.assertEqual((user['meme_count'], user['aura']), (0, 0))
        self.assertEqual(self.request('GET', '/api/leaderboard?city=hanoi', cookie=self.viewer)['leaders'], [])
        self.request('POST', vote_path, {'value': -1}, self.viewer, 404)
        for cookie in (None, self.author, self.viewer):
            self.assertEqual(self.call('GET', pin['image'], cookie=cookie)[0], 404)
        self.assertEqual(self.call('GET', pin['image'], cookie=self.admin)[0], 200)
        hidden_list = self.request('GET', '/api/admin/pins?status=hidden', cookie=self.admin)
        self.assertEqual([row['id'] for row in hidden_list['pins']], [pin_id])
        restored = self.moderate(pin_id, 'restore', 'Review complete')
        self.assertFalse(restored['is_hidden'])
        self.assertEqual(restored['aura'], 1)
        self.assertEqual(self.call('GET', pin['image'], cookie=self.viewer)[0], 200)
        profile = self.request('GET', '/api/profiles/author', cookie=self.viewer)['user']
        self.assertEqual((profile['meme_count'], profile['aura']), (1, 1))
        entries = self.audit(target_type='pin', target_id=pin_id)['entries']
        self.assertEqual({row['action'] for row in entries}, {'hide_pin', 'restore_pin'})

    def test_reports_group_review_resolve_and_survive_deletion(self):
        pin = self.pin(image=True)
        pin_id = pin['id']
        another = self.account('second_reporter')
        path = f'/api/pins/{pin_id}/reports'
        self.request('POST', path, {'reason': 'spam'}, status=401)
        self.request('POST', path, {'reason': 'unsupported'}, self.viewer, 400)
        self.request('POST', path, {'reason': 'other', 'detail': ''}, self.viewer, 400)
        self.request('POST', path, {'reason': 'spam', 'detail': 'Repeated meme'}, self.viewer, 201)
        self.request('POST', path, {'reason': 'spam'}, self.viewer, 409)
        self.request('POST', path, {'reason': 'misleading'}, another, 201)
        group = self.request('GET', '/api/admin/reports?status=pending', cookie=self.admin)['reports'][0]
        self.assertEqual(group['report_count'], 2)
        self.assertEqual(set(group['reasons']), {'spam', 'misleading'})
        self.assertEqual({row['username'] for row in group['reports']}, {'viewer', 'second_reporter'})
        decision = f'/api/admin/reports/{pin_id}'
        self.assertEqual(self.request('POST', decision, {'action': 'review'}, self.admin)['affected'], 2)
        self.assertEqual(self.request('GET', '/api/admin/reports?status=pending', cookie=self.admin)['total'], 0)
        self.assertEqual(self.request('GET', '/api/admin/reports?status=reviewing', cookie=self.admin)['total'], 1)
        self.request('POST', decision, {'action': 'dismiss', 'reason': ''}, self.admin, 400)
        self.request('POST', decision, {'action': 'dismiss', 'reason': 'No violation'}, self.admin)
        resolved = self.request('GET', '/api/admin/reports?status=resolved', cookie=self.admin)['reports'][0]
        self.assertTrue(all(row['resolution'] == 'dismiss' for row in resolved['reports']))
        self.assertEqual(len(self.request('GET', '/api/pins', cookie=self.viewer)['pins']), 1)
        self.request('POST', path, {'reason': 'other', 'detail': 'New evidence'}, self.viewer, 201)
        self.request('POST', decision, {'action': 'hide', 'reason': 'Confirmed violation'}, self.admin)
        self.assertEqual(self.request('GET', '/api/pins', cookie=self.viewer)['pins'], [])
        self.request('DELETE', f'/api/pins/{pin_id}', {'reason': 'Permanent removal'}, self.admin)
        self.assertEqual(self.call('GET', pin['image'], cookie=self.admin)[0], 404)
        resolved = self.request('GET', '/api/admin/reports?status=resolved', cookie=self.admin)['reports'][0]
        self.assertTrue(resolved['pin_deleted'])
        self.assertEqual(resolved['title'], pin['title'])
        self.assertEqual(resolved['report_count'], 3)
        entries = self.audit(target_type='pin', target_id=pin_id, actor='moderator')['entries']
        self.assertTrue({'review_reports', 'dismiss_reports', 'hide_pin', 'resolve_reports', 'delete_pin'}
                        <= {row['action'] for row in entries})
        self.assertTrue(all(row['target_label'] == pin['title'] for row in entries))
        self.assertEqual(next(row for row in entries if row['action'] == 'delete_pin')['reason'], 'Permanent removal')

    def test_scoped_restrictions_expire_and_protect_administrators(self):
        pin = self.pin(cookie=self.viewer)
        author_id = self.user_id('author')
        path = f'/api/admin/users/{author_id}/restrictions'
        payload = {'scope': 'post', 'action': 'restrict', 'duration_hours': 1, 'reason': 'Posting spam'}
        self.request('POST', path, {**payload, 'duration_hours': 2}, self.admin, 400)
        self.request('POST', path, {**payload, 'reason': ''}, self.admin, 400)
        user = self.request('POST', path, payload, self.admin)['user']
        self.assertGreater(user['post_restricted_until'], int(time.time()))
        self.assertIsNone(user['vote_restricted_until'])
        create = {'lat': 20.9893, 'lng': 105.7953, 'title': 'Restricted attempt'}
        error = self.request('POST', '/api/pins', create, self.author, 403)
        self.assertEqual(error['error'], 'post_restricted')
        self.assertEqual(error['reason'], 'Posting spam')
        self.assertGreater(error['until'], int(time.time()))
        vote = f"/api/pins/{pin['id']}/vote"
        self.request('POST', vote, {'value': 1}, self.author)
        self.request('POST', path, {'scope': 'post', 'action': 'lift', 'reason': 'Reviewed'}, self.admin)
        self.request('POST', '/api/pins', create, self.author, 201)
        self.request('POST', path, {**payload, 'scope': 'vote'}, self.admin)
        self.assertEqual(self.request('POST', vote, {'value': -1}, self.author, 403)['error'], 'vote_restricted')
        self.request('POST', '/api/pins', create, self.author, 201)
        with self.app.database.connect() as db:
            db.execute('UPDATE users SET vote_restricted_until=? WHERE id=?', (int(time.time()) - 1, author_id))
        self.request('POST', vote, {'value': -1}, self.author)
        self.assertEqual(self.request('GET', '/api/admin/users?status=restricted', cookie=self.admin)['total'], 0)
        self.request('POST', path, {**payload, 'scope': 'both'}, self.admin)
        self.request('POST', vote, {'value': 1}, self.author, 403)
        self.request('POST', '/api/pins', create, self.author, 403)
        self.request('POST', path, {'scope': 'both', 'action': 'lift', 'reason': 'Resolved'}, self.admin)
        second_admin = self.account('other_admin', admin=True)
        self.assertTrue(second_admin)
        for username in ('moderator', 'other_admin'):
            error = self.request('POST', f'/api/admin/users/{self.user_id(username)}/restrictions', payload, self.admin, 403)
            self.assertEqual(error['error'], 'protected_admin')
        entries = self.audit(target_type='user', target_id=author_id)['entries']
        self.assertTrue({'restrict_post', 'lift_post', 'restrict_vote', 'lift_vote'} <= {row['action'] for row in entries})

    def test_filters_pagination_and_literal_search(self):
        pin = self.pin(title='Needle_100%', image=True)
        self.moderate(pin['id'], 'hide')
        author_id = self.user_id('author')
        old = 1700000000
        with self.app.database.connect() as db:
            db.execute('UPDATE pins SET created_at=? WHERE id=?', (old, pin['id']))
            db.executemany('INSERT INTO pins(user_id,lat,lng,title,story,created_at) VALUES (?,20.9893,105.7953,?,?,?)',
                           [(author_id, f'Pagination meme {i}', '', old + 86400 + i) for i in range(23)])
        first = self.request('GET', '/api/admin/pins?sort=oldest', cookie=self.admin)
        second = self.request('GET', '/api/admin/pins?sort=oldest&page=2', cookie=self.admin)
        self.assertEqual((first['total'], first['pages'], len(first['pins']), len(second['pins'])), (24, 2, 20, 4))
        self.assertFalse({row['id'] for row in first['pins']} & {row['id'] for row in second['pins']})
        for filters in ({'status': 'hidden'}, {'image': 'yes'}, {'q': 'Needle_100%'}, {'q': '%'}):
            results = self.request('GET', '/api/admin/pins?' + urlencode(filters), cookie=self.admin)
            self.assertEqual([row['id'] for row in results['pins']], [pin['id']])
        self.assertEqual(self.request('GET', '/api/admin/pins?status=visible&image=no&q=%40author', cookie=self.admin)['total'], 23)
        day = datetime.fromtimestamp(old, timezone.utc).strftime('%Y-%m-%d')
        filtered = self.request('GET', f'/api/admin/pins?since={day}&until={day}', cookie=self.admin)
        self.assertEqual(filtered['total'], 1)
        for query in ('page=0', 'status=invalid', 'image=maybe', 'sort=invalid', 'since=2026-99-01',
                      'since=2026-02-02&until=2026-02-01'):
            self.request('GET', '/api/admin/pins?' + query, cookie=self.admin, status=400)
        self.assertEqual(self.request('GET', '/api/admin/users?q=%40author', cookie=self.admin)['users'][0]['username'], 'author')

    def test_overview_windows_alerts_and_no_automatic_moderation(self):
        pin = self.pin(image=True)
        earlier = self.pin(title='Older meme')
        now = int(time.time())
        with self.app.database.connect() as db:
            db.execute('UPDATE pins SET created_at=? WHERE id=?', (now - 8 * 86400, earlier['id']))
        day = self.request('GET', '/api/admin/overview?days=1', cookie=self.admin)
        month = self.request('GET', '/api/admin/overview?days=30', cookie=self.admin)
        self.assertEqual(day['stats']['new_pins'], 1)
        self.assertEqual(month['stats']['new_pins'], 2)
        self.assertEqual(day['stats']['new_users'], 3)
        self.assertEqual(day['stats']['image_bytes'], self.app.images.path(pin['image']).stat().st_size)
        self.assertEqual(day['alerts'], [])
        self.request('GET', '/api/admin/overview?days=2', cookie=self.admin, status=400)
        for _ in range(4):
            self.pin()
        vote = f"/api/pins/{pin['id']}/vote"
        for _ in range(20):
            self.request('POST', vote, {'value': 1}, self.viewer)
        self.request('POST', f"/api/pins/{pin['id']}/reports", {'reason': 'spam'}, self.viewer, 201)
        overview = self.request('GET', '/api/admin/overview', cookie=self.admin)
        self.assertEqual(overview['stats']['pending_reports'], 1)
        self.assertTrue({'posting_burst', 'duplicate_content', 'vote_burst'} <= {row['kind'] for row in overview['alerts']})
        admin_pins = self.request('GET', '/api/admin/pins', cookie=self.admin)['pins']
        self.assertTrue(any('duplicate_content' in row['signals'] for row in admin_pins))
        admin_users = self.request('GET', '/api/admin/users', cookie=self.admin)['users']
        self.assertTrue(any('vote_burst' in row['signals'] for row in admin_users))
        self.assertEqual(len(self.request('GET', '/api/pins', cookie=self.viewer)['pins']), 6)
        self.assertEqual(self.request('GET', '/api/admin/users?status=restricted', cookie=self.admin)['total'], 0)
        self.assertEqual(self.audit()['total'], 0)

    def test_action_and_audit_are_one_transaction(self):
        pin = self.pin()
        with self.app.database.connect() as db:
            db.execute("CREATE TRIGGER fixture_audit_failure BEFORE INSERT ON admin_audit BEGIN SELECT RAISE(ABORT, 'test storage failure'); END")
        self.request('POST', f"/api/admin/pins/{pin['id']}/moderate",
                     {'action': 'hide', 'reason': 'Should roll back'}, self.admin, 500)
        with self.app.database.connect() as db:
            self.assertEqual(db.execute('SELECT is_hidden FROM pins WHERE id=?', (pin['id'],)).fetchone()[0], 0)
            self.assertEqual(db.execute('SELECT COUNT(*) FROM admin_audit').fetchone()[0], 0)
            db.execute('DROP TRIGGER fixture_audit_failure')
        self.moderate(pin['id'], 'hide')
        with self.assertRaises(sqlite3.IntegrityError), self.app.database.connect() as db:
            db.execute('DELETE FROM admin_audit')
        self.assertEqual(self.audit()['total'], 1)

    def test_user_date_filters_and_oversized_route_ids(self):
        with self.app.database.connect() as db:
            db.execute("UPDATE users SET created_at=1 WHERE username='author'")
        users = self.request('GET', '/api/admin/users?since=2020-01-01', cookie=self.admin)['users']
        self.assertNotIn('author', {row['username'] for row in users})
        old = self.request('GET', '/api/admin/users?until=1970-01-01', cookie=self.admin)['users']
        self.assertEqual([row['username'] for row in old], ['author'])
        self.request('GET', '/api/admin/users?since=2026-02-31', cookie=self.admin, status=400)
        huge = '9' * 80
        self.request('POST', f'/api/admin/pins/{huge}/moderate', {'action':'hide','reason':'test'}, self.admin, 404)
        self.request('POST', f'/api/pins/{huge}/reports', {'reason':'spam'}, self.viewer, 404)
        self.request('DELETE', f'/api/pins/{huge}', cookie=self.admin, status=404)


if __name__ == '__main__':
    unittest.main()
