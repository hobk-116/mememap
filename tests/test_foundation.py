"""Service and migration contracts that future community work must preserve."""
import base64
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from mememap.app import Application
from mememap.config import Settings
from mememap.errors import RequestError
from mememap import migrations
from mememap.regions import Bounds


class FoundationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='mememap-foundation-')
        self.root = Path(self.temp.name)
        self.app = Application(Settings(ROOT, self.root / 'test.sqlite3', self.root / 'uploads'))
        self.app.initialize()

    def tearDown(self):
        self.temp.cleanup()

    def account(self, name, admin=False):
        _, token = self.app.auth.register({'name': name, 'username': name, 'password': 'test-password-123'})
        if admin:
            with self.app.database.connect() as db:
                db.execute('UPDATE users SET is_admin=1 WHERE username=?', (name,))
        return self.app.auth.current_user(token), token

    def pin(self, user, **kwargs):
        return self.app.pins.create_pin({'lat': 20.9893, 'lng': 105.7953, 'title': 'Fixture', **kwargs}, user)['pin']

    def image(self):
        return 'data:image/webp;base64,' + base64.b64encode((ROOT / 'assets/default-profile-picture.webp').read_bytes()).decode()

    def test_services_auth_stats_and_existing_region_scopes(self):
        owner, token = self.account('owner')
        voter, _ = self.account('voter')
        admin, _ = self.account('moderator', admin=True)
        first = self.pin(owner)
        second = self.pin(owner, lat=21.5, lng=106.0)
        self.app.pins.vote(str(first['id']), {'value': 1}, voter)
        self.app.pins.vote(str(first['id']), {'value': 1}, admin)
        self.app.pins.vote(str(second['id']), {'value': -1}, voter)
        profile = self.app.profiles.me(owner)['user']
        self.assertEqual((profile['meme_count'], profile['aura']), (2, 1))
        self.assertEqual(self.app.profiles.get('OWNER', voter)['user']['aura'], 1)
        leaders = self.app.pins.get_leaderboard(owner, 'hanoi')['leaders']
        self.assertEqual((leaders[0]['pin_count'], leaders[0]['aura']), (1, 2))
        self.app.moderation.change(admin, 'pins', first['id'], {'action': 'hide', 'reason': 'test'})
        profile = self.app.profiles.me(owner)['user']
        self.assertEqual((profile['meme_count'], profile['aura']), (1, -1))
        with self.assertRaises(RequestError) as denied:
            self.app.pins.create_pin({'lat': 20.99, 'lng': 105.8, 'title': 'Anonymous'}, None)
        self.assertEqual(denied.exception.code, 'authentication_required')
        self.app.auth.logout(token)
        self.assertIsNone(self.app.auth.current_user(token))

    def test_two_applications_have_independent_accounts_and_uploads(self):
        owner, token = self.account('owner')
        pin = self.pin(owner, image=self.image())
        other = Application(Settings(ROOT, self.root / 'other.sqlite3', self.root / 'other-uploads'))
        other.initialize()
        self.assertIsNone(other.auth.current_user(token))
        self.assertTrue(self.app.images.path(pin['image']).exists())
        self.assertFalse(other.images.path(pin['image']).exists())
        with other.database.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM users').fetchone()[0], 0)

    def test_image_database_failure_cleans_new_file_and_preserves_old_avatar(self):
        owner, _ = self.account('owner')
        old = self.app.profiles.set_profile_avatar({'image': self.image()}, owner)['avatar']
        with self.app.database.connect() as db:
            db.execute("CREATE TRIGGER fail_avatar BEFORE UPDATE OF avatar_path ON users BEGIN SELECT RAISE(ABORT, 'test'); END")
            db.execute("CREATE TRIGGER fail_pin BEFORE INSERT ON pins BEGIN SELECT RAISE(ABORT, 'test'); END")
        with self.assertRaises(RequestError) as error:
            self.app.profiles.set_profile_avatar({'image': self.image()}, owner)
        self.assertEqual(error.exception.code, 'avatar_storage_failed')
        self.assertEqual(list(self.app.images.profiles.iterdir()), [self.app.images.path(old)])
        with self.assertRaises(RequestError) as error:
            self.pin(owner, image=self.image())
        self.assertEqual(error.exception.code, 'pin_storage_failed')
        self.assertEqual(list(self.app.images.memes.iterdir()), [])
        self.assertEqual(self.app.profiles.me(owner)['user']['avatar'], old)

    def test_migration_failure_rolls_back_schema_and_can_retry_shared_legacy_media(self):
        owner, _ = self.account('owner')
        pin = self.pin(owner)
        name = 'a' * 32 + '.webp'
        source = self.app.images.root / name
        content = (ROOT / 'assets/default-profile-picture.webp').read_bytes()
        source.write_bytes(content)
        with self.app.database.connect() as db:
            db.execute('UPDATE users SET avatar_path=? WHERE id=?', ('/uploads/' + name, owner['id']))
            db.execute('UPDATE pins SET image_data=? WHERE id=?', ('/uploads/' + name, pin['id']))
            db.execute('DELETE FROM schema_migrations WHERE version=3')
        def fail(db):
            db.execute('CREATE TABLE interrupted_change (id INTEGER)')
            raise RuntimeError('simulated interruption')
        with patch.object(migrations, 'MIGRATIONS', (*migrations.MIGRATIONS, (4, 'failure', fail))):
            with self.assertRaisesRegex(RuntimeError, 'simulated interruption'):
                self.app.initialize()
        with self.app.database.connect() as db:
            self.assertIsNone(db.execute("SELECT name FROM sqlite_master WHERE name='interrupted_change'").fetchone())
            self.assertEqual(db.execute('SELECT COUNT(*) FROM schema_migrations').fetchone()[0], 2)
            self.assertEqual(db.execute('SELECT image_data FROM pins WHERE id=?', (pin['id'],)).fetchone()[0], '/uploads/' + name)
        self.assertEqual(source.read_bytes(), content)
        self.app.initialize()
        self.assertFalse(source.exists())
        self.assertEqual((self.app.images.memes / name).read_bytes(), content)
        self.assertEqual((self.app.images.profiles / name).read_bytes(), content)
        with self.app.database.connect() as db:
            snapshot = [tuple(row) for row in db.execute('SELECT * FROM schema_migrations')]
        self.app.initialize()
        with self.app.database.connect() as db:
            self.assertEqual(snapshot, [tuple(row) for row in db.execute('SELECT * FROM schema_migrations')])
            self.assertEqual(list(db.execute('PRAGMA foreign_key_check')), [])

    def test_populated_preledger_database_preserves_audit_votes_sessions_and_images(self):
        owner, token = self.account('owner')
        admin, _ = self.account('moderator', admin=True)
        pin = self.pin(owner, image=self.image())
        self.app.pins.vote(str(pin['id']), {'value': 1}, admin)
        self.app.moderation.change(admin, 'pins', pin['id'], {'action': 'hide', 'reason': 'Preserve history'})
        with self.app.database.connect() as db:
            db.execute('DROP TABLE schema_migrations')
            tables = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
            before = {table: [tuple(r) for r in db.execute(f'SELECT * FROM {table}')] for table in tables}
        image = self.app.images.path(pin['image']).read_bytes()
        self.app.initialize()
        with self.app.database.connect() as db:
            after = {table: [tuple(r) for r in db.execute(f'SELECT * FROM {table}')] for table in tables}
            self.assertEqual(before, after)
            with self.assertRaises(sqlite3.IntegrityError):
                db.execute("UPDATE admin_audit SET reason='changed'")
        self.assertEqual(self.app.images.path(pin['image']).read_bytes(), image)
        self.assertEqual(self.app.auth.current_user(token)['id'], owner['id'])

    def test_legacy_media_conflict_preserves_both_files_and_database(self):
        owner, _ = self.account('owner')
        pin = self.pin(owner)
        name = 'b' * 32 + '.webp'
        source = self.app.images.root / name
        destination = self.app.images.memes / name
        source.write_bytes(b'original')
        destination.write_bytes(b'conflicting')
        with self.app.database.connect() as db:
            db.execute('UPDATE pins SET image_data=? WHERE id=?', ('/uploads/' + name, pin['id']))
            db.execute('DELETE FROM schema_migrations WHERE version=3')
        with self.assertRaisesRegex(RuntimeError, 'Conflicting legacy image'):
            self.app.initialize()
        self.assertEqual(source.read_bytes(), b'original')
        self.assertEqual(destination.read_bytes(), b'conflicting')
        with self.app.database.connect() as db:
            self.assertEqual(db.execute('SELECT image_data FROM pins WHERE id=?', (pin['id'],)).fetchone()[0], '/uploads/' + name)
            self.assertEqual(db.execute('SELECT COUNT(*) FROM schema_migrations').fetchone()[0], 2)

    def test_future_schema_is_rejected(self):
        with self.app.database.connect() as db:
            db.execute("INSERT INTO schema_migrations VALUES (999, 'future', 1)")
        with self.assertRaisesRegex(RuntimeError, 'newer'):
            self.app.initialize()

    def test_region_bounds_include_edges_but_exclude_nonfinite_coordinates(self):
        bounds = self.app.regions.posting
        self.assertTrue(bounds.contains(bounds.south, bounds.west))
        self.assertTrue(bounds.contains(bounds.north, bounds.east))
        for lat, lng in [(float('nan'), 105.8), (float('inf'), 105.8), (20.9, float('-inf')), (0, 0)]:
            self.assertFalse(bounds.contains(lat, lng))
        # Replacing the scope is an application configuration operation, not an HTTP dependency.
        self.app.regions.posting = Bounds(0, 1, 0, 1)
        owner, _ = self.account('owner')
        self.assertEqual(self.app.regions.map_config()['bounds'], [[0, 0], [1, 1]])
        self.assertEqual(self.pin(owner, lat=.5, lng=.5)['lat'], .5)
        with self.assertRaises(RequestError) as error:
            self.pin(owner)
        self.assertEqual(error.exception.code, 'outside_map_bounds')


if __name__ == '__main__':
    unittest.main()
