"""Einmalige, isolierte Testumgebung. Auf dem Testhost als Administrator ausführen.

Keine Live-Daten oder Live-Secrets kopieren. Kopiert lediglich PHP-Abhängigkeiten
und den öffentlichen Frontcontroller aus dem vorhandenen Contao-Image.
"""
import json
import os
from pathlib import Path
import secrets
import subprocess

ROOT = Path('/opt/ertnerundso-customer-portal-lab-20261030')
SOURCE_VENDOR = Path('/var/lib/docker/volumes/ertnerundso-contao-live_contao-vendor-own-only-20261023/_data')
APP = ROOT / 'app'
if APP.exists():
    raise SystemExit('Testumgebung existiert bereits; kein Überschreiben.')

def run(*args):
    subprocess.run(args, check=True)

for name in ['config', 'templates', 'var', 'public', 'system/config', 'files', 'assets']:
    (APP / name).mkdir(parents=True, exist_ok=True)
run('cp', '-a', str(SOURCE_VENDOR), str(APP / 'vendor'))
run('docker', 'cp', 'ertnerundso-contao-live-contao-1:/var/www/html/public/index.php', str(APP / 'public/index.php'))
(APP / 'public/.htaccess').write_text('DirectoryIndex index.php\nFallbackResource /index.php\n')
(APP / '.env').write_text('')
password = secrets.token_hex(32)
env = '\n'.join([
    'APP_ENV=prod', 'APP_DEBUG=0', 'APP_SECRET=' + secrets.token_hex(32),
    'DATABASE_URL=mysql://portal:' + password + '@db:3306/portal?serverVersion=11.4.0-MariaDB&charset=utf8mb4',
    'MAILER_DSN=null://null', 'PORTAL_WEBSITE_ASSET_BASE=/website', '',
])
(APP / '.env.local').write_text(env)
os.chmod(APP / '.env.local', 0o600)
composer = json.loads(subprocess.check_output(['docker', 'exec', 'ertnerundso-contao-live-contao-1', 'cat', '/var/www/html/composer.json']))
composer['autoload']['psr-4'] = {'Ertnerundso\\CustomerPortal\\': '/portal-package/src/'}
composer['extra']['contao-manager-plugin'] = 'Ertnerundso\\CustomerPortal\\ContaoManager\\Plugin'
composer['require'].pop('ertnerundso/contao-mcp-bundle', None)
composer.pop('scripts', None)
composer.pop('repositories', None)
(APP / 'composer.json').write_text(json.dumps(composer, indent=2))
run('docker', 'cp', 'ertnerundso-contao-live-contao-1:/var/www/html/composer.lock', str(APP / 'composer.lock'))
# Der nicht installierte MCP-Pfad darf im Labor nicht automatisch registriert werden.
installed = APP / 'vendor/composer/installed.json'
data = json.loads(installed.read_text())
data['packages'] = [p for p in data['packages'] if p['name'] != 'ertnerundso/contao-mcp-bundle']
installed.write_text(json.dumps(data))
# Nur im Labor: Manager-Registrierung ohne Composer-Updates im Live-Vendor.
# Die spätere Paketinstallation erfolgt regulär über den Composer-Pfad unten.
plugins = APP / 'vendor/contao/manager-plugin/.generated/plugins.php'
source = '\n'.join(line for line in plugins.read_text().splitlines() if 'ertnerundso/contao-mcp-bundle' not in line)
source = source.replace('return array (', 'return array (\n  "ertnerundso/contao-customer-portal-bundle" => new \\Ertnerundso\\CustomerPortal\\ContaoManager\\Plugin(),')
plugins.write_text(source)
compose = {
    'name': 'eunds-customer-portal-lab',
    'services': {
        'db': {
            'image': 'mariadb:11.4', 'restart': 'unless-stopped',
            'environment': {'MARIADB_DATABASE': 'portal', 'MARIADB_USER': 'portal', 'MARIADB_PASSWORD': password, 'MARIADB_ROOT_PASSWORD': secrets.token_hex(32)},
            'volumes': [str(ROOT / 'database') + ':/var/lib/mysql'],
            'healthcheck': {'test': ['CMD', 'healthcheck.sh', '--connect', '--innodb_initialized'], 'interval': '5s', 'timeout': '5s', 'retries': 20},
            'networks': ['portal'],
        },
        'app': {
            'image': 'ertnerundso-contao-live:own-mcp-only-20261023', 'restart': 'unless-stopped',
            'depends_on': {'db': {'condition': 'service_healthy'}},
            'volumes': [str(APP) + ':/var/www/html', str(ROOT / 'package') + ':/portal-package:ro'],
            'networks': ['portal'],
        },
    },
    'networks': {'portal': {'internal': True}},
}
(ROOT / 'compose.json').write_text(json.dumps(compose, indent=2))
os.chmod(ROOT / 'compose.json', 0o600)
run('chown', '-R', '33:33', str(APP))
print('Isoliertes Labor vorbereitet; keine Live-Daten oder Live-Zugangsdaten übernommen.')
