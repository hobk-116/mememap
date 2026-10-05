"""Run each browser check against its own disposable fixture (never live data).

Set MEMEMAP_NODE, NODE_PATH and MEMEMAP_TEST_BROWSER when not on PATH.
Optional arguments select check_*.cjs files; without arguments run all checks.
"""
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[1]


def main():
    checks = sys.argv[1:] or [p.name for p in sorted((ROOT / 'tests').glob('check_*.cjs'))]
    failed = False
    for check in checks:
        if Path(check).name != check or not check.startswith('check_') or not check.endswith('.cjs'):
            raise SystemExit('Expected a check_*.cjs filename in tests/.')
        with tempfile.TemporaryFile(mode='w+') as log:
            fixture = subprocess.Popen([sys.executable, 'tests/serve_fixture.py'], cwd=ROOT,
                stdout=subprocess.PIPE, stderr=log, text=True)
            try:
                url = fixture.stdout.readline().strip()
                if not url.startswith('http://127.0.0.1:'):
                    log.seek(0)
                    raise RuntimeError('Fixture did not start: ' + log.read())
                print(check, flush=True)
                result = subprocess.run([os.environ.get('MEMEMAP_NODE', 'node'), 'tests/' + check, url],
                    cwd=ROOT, timeout=120)
                failed |= result.returncode != 0
            finally:
                if fixture.poll() is None:
                    fixture.send_signal(signal.SIGINT)
                    try:
                        fixture.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        fixture.kill()
                        fixture.wait()
                fixture.stdout.close()
    return int(failed)


if __name__ == '__main__':
    raise SystemExit(main())
