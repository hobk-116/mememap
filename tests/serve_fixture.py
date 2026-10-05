"""Temporary browser-test server. Never uses the project's real user data."""
import secrets
import threading
import time
from test_server import ServerTests, server

ServerTests.setUpClass()
with ServerTests.httpd.application.database.connect() as db:
    for username, admin in [('browser_admin', 1), ('browser_other', 0)]:
        salt = secrets.token_bytes(16)
        db.execute('INSERT INTO users(name,email,username,avatar_path,is_admin,password_hash,password_salt,created_at) VALUES (?,?,?,?,?,?,?,?)',
            (username, username+'@test.invalid', username, '/assets/default-profile-picture.webp', admin,
             server.password_digest('browser-test-123', salt), salt, int(time.time())))
    owner = db.execute("SELECT id FROM users WHERE username='browser_other'").fetchone()['id']
    db.execute('INSERT INTO pins(user_id,lat,lng,title,story,created_at) VALUES (?,?,?,?,?,?)',
        (owner, 20.9893, 105.7953, 'Fixture pin', 'Browser regression fixture', int(time.time())))
print(f'http://127.0.0.1:{ServerTests.httpd.server_port}', flush=True)
try:
    threading.Event().wait()
except KeyboardInterrupt:
    pass
finally:
    ServerTests.tearDownClass()
