<?php
declare(strict_types=1);

// Ausschließlich künstliche Daten in der eigenen, leeren Portal-Testdatenbank.
require '/var/www/html/vendor/autoload.php';

use Contao\ManagerBundle\Console\ContaoApplication;
use Contao\ManagerBundle\HttpKernel\ContaoKernel;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;

umask(0077);
try {
if (getenv('PORTAL_LAB_MODE') !== '1') { throw new RuntimeException('Nur im expliziten Portal-Labor erlaubt.'); }
$kernel = ContaoKernel::fromInput('/var/www/html', new ArrayInput(['--env' => 'prod']));
$kernel->boot();
$db = $kernel->getContainer()->get('database_connection');
if ($db->getDatabase() !== 'portal' || $db->fetchOne('SELECT COUNT(*) FROM tl_member') || $db->fetchOne('SELECT COUNT(*) FROM tl_page')) {
    throw new RuntimeException('Erwartet wird eine leere Portal-Testdatenbank.');
}
$app = new ContaoApplication($kernel);
$app->setAutoExit(false);
function native(string $command, array $args = [], ?string $stdin = null): array {
    global $app;
    $input = new ArrayInput(['command' => $command, '--env' => 'prod', '--no-interaction' => true] + $args);
    if ($stdin !== null) { $stream = fopen('php://memory', 'r+'); fwrite($stream, $stdin."\n"); rewind($stream); $input->setStream($stream); }
    $output = new BufferedOutput();
    $code = $app->run($input, $output);
    $raw = trim($output->fetch());
    $json = json_decode($raw, true);
    if (!$json) { foreach (array_reverse(explode("\n", $raw)) as $line) { $r = json_decode($line, true); if (is_array($r) && isset($r['status'])) { $json = $r; break; } } }
    if ($code || (isset($json['status']) && $json['status'] !== 'ok')) {
        // Keine Argumente oder Roh-Ausgaben protokollieren: sie könnten Zugangsdaten enthalten.
        $detail = ($stdin !== null || isset($args['--password'])) ? (string) $code : mb_substr($raw, 0, 800);
        throw new RuntimeException('Native Testeinrichtung fehlgeschlagen: '.$command.' / '.$detail);
    }
    return $json ?: [];
}
function fields(array $values): array { return array_map(static fn($k, $v) => $k.'='.(is_array($v) ? json_encode($v) : (string) $v), array_keys($values), array_values($values)); }

$credentials = ['accounts' => []];
$credentials['accounts']['admin'] = ['username' => 'portal-lab', 'password' => bin2hex(random_bytes(16))];
native('contao:user:create', ['--username' => 'portal-lab', '--name' => 'Portal Testadministration', '--email' => 'portal-admin@example.invalid', '--password' => $credentials['accounts']['admin']['password'], '--language' => 'de', '--admin' => true]);
$groups = [];
foreach (['A', 'B', 'Basis'] as $company) {
    $groups[$company] = (int) native('contao:member-group:create', ['--name' => 'Portal-Labor / '.$company, '--operator' => 'portal-lab'])['id'];
}
$now = time();
foreach (['A' => 'Musterkunde Alpha', 'B' => 'Interne Testfirma Beta'] as $key => $name) {
    $db->insert('tl_portal_firma', ['name' => $name, 'mitgliedergruppe' => $groups[$key], 'aktiv' => '1', 'tstamp' => $now]);
    $companyId = (int) $db->lastInsertId();
    $db->insert('tl_portal_projekt', ['firma_id' => $companyId, 'titel' => $key === 'A' ? 'Produktfilm · Testprojekt' : 'Geheimprojekt Beta', 'vorlage' => 'animation', 'korrekturlaeufe_inklusive' => 1, 'tstamp' => $now]);
    $projectId = (int) $db->lastInsertId();
    foreach (['Storyboard', 'Wireframe-Renderings', 'Low-Res-Renderings', 'Finales Rendering', 'Postproduktion', 'Übergabe'] as $index => $phase) {
        $db->insert('tl_portal_phase', ['firma_id' => $companyId, 'projekt_id' => $projectId, 'name' => $phase, 'reihenfolge' => $index, 'status' => $index === 0 ? 'pruefung' : 'arbeit', 'tstamp' => $now]);
        if ($index === 0) {
            $db->insert('tl_portal_version', ['firma_id' => $companyId, 'phase_id' => (int) $db->lastInsertId(), 'nummer' => 1, 'dateiname' => 'Storyboard · Entwurf 01.pdf', 'typ' => 'pdf', 'freigeschaltet_am' => $now, 'onedrive_item_id' => 'LAB-NO-REAL-FILE', 'tstamp' => $now]);
        }
    }
    $db->insert('tl_portal_ereignis', ['firma_id' => $companyId, 'projekt_id' => $projectId, 'art' => 'version', 'zeitpunkt' => $now, 'tstamp' => $now]);
    $username = 'portal-'.strtolower($key);
    $credentials['accounts'][$key] = ['username' => $username, 'password' => bin2hex(random_bytes(16)), 'companyId' => $companyId, 'projectId' => $projectId];
    native('contao:member:create', ['--username' => $username, '--firstname' => 'Test', '--lastname' => $name, '--email' => $username.'@example.invalid', '--password-stdin' => true, '--operator' => 'portal-lab', '--set' => fields(['groups' => [$groups[$key]], 'firma_id' => $companyId, 'rolle' => $key === 'A' ? 'entscheider' : 'mitleser'])], $credentials['accounts'][$key]['password']);
}
$credentials['accounts']['unmapped'] = ['username' => 'portal-ohne-firma', 'password' => bin2hex(random_bytes(16))];
native('contao:member:create', ['--username' => 'portal-ohne-firma', '--firstname' => 'Demo', '--lastname' => 'Ohne Firma', '--email' => 'portal-demo@example.invalid', '--password-stdin' => true, '--operator' => 'portal-lab', '--set' => fields(['groups' => [$groups['Basis']]])], $credentials['accounts']['unmapped']['password']);

$theme = (int) native('contao:theme:create', ['--name' => 'Portal-Labor', '--author' => 'ERTNER&SO', '--operator' => 'portal-lab'])['id'];
$articleModule = 0; // Contao verwendet im Seitenlayout die feste Modul-ID 0 für Artikel.
$layout = (int) native('contao:layout:create', ['--pid' => $theme, '--name' => 'Portal-Labor', '--template' => 'fe_page', '--operator' => 'portal-lab', '--set' => fields(['type' => 'default', 'modules' => [['mod' => $articleModule, 'col' => 'main', 'enable' => 1]], 'rows' => '1rw', 'cols' => '1cl'])])['id'];
$root = (int) native('contao:page:create', ['--title' => 'Portal-Labor', '--type' => 'root', '--pid' => 0, '--alias' => 'portal-lab', '--language' => 'de', '--set' => fields(['fallback' => 1, 'dns' => '127.0.0.1', 'useSSL' => '', 'includeLayout' => 1, 'layout' => $layout, 'urlSuffix' => '', 'dateFormat' => 'd.m.Y', 'timeFormat' => 'H:i', 'datimFormat' => 'd.m.Y H:i', 'adminEmail' => 'portal-admin@example.invalid']), '--operator' => 'portal-lab'])['id'];
$login = (int) native('contao:page:create', ['--title' => 'Kundenlogin', '--pid' => $root, '--alias' => 'kundenlogin', '--operator' => 'portal-lab'])['id'];
$area = (int) native('contao:page:create', ['--title' => 'Kundenbereich', '--pid' => $root, '--alias' => 'kundenbereich', '--operator' => 'portal-lab', '--set' => fields(['protected' => 1, 'groups' => array_values($groups)])])['id'];
$loginModule = (int) native('contao:module:create', ['--pid' => $theme, '--name' => 'Kundenportal / Login', '--type' => 'login', '--operator' => 'portal-lab', '--set' => fields(['jumpTo' => $area, 'autologin' => '', 'redirectBack' => ''])])['id'];
$logoutModule = (int) native('contao:module:create', ['--pid' => $theme, '--name' => 'Kundenportal / Logout', '--type' => 'login', '--operator' => 'portal-lab', '--set' => fields(['jumpTo' => $login, 'autologin' => ''])])['id'];
foreach ([$login => $loginModule, $area => $logoutModule] as $page => $module) {
    $article = (int) native('contao:article:create', ['--title' => 'Kundenzugang', '--pid' => $page, '--operator' => 'portal-lab', '--set' => ['published=1']])['id'];
    native('contao:content:create', ['--type' => 'module', '--pid' => $article, '--ptable' => 'tl_article', '--operator' => 'portal-lab', '--set' => ['module='.$module]]);
    if ($page === $area) { native('contao:content:create', ['--type' => 'text', '--pid' => $article, '--ptable' => 'tl_article', '--operator' => 'portal-lab', '--set' => ['text=<p><a href="/kundenbereich/portal">Zum Kundenportal</a></p>']]); }
    if ($page === $area) { native('contao:content:create', ['--type' => 'customer_portal', '--pid' => $article, '--ptable' => 'tl_article', '--operator' => 'portal-lab', '--set' => ['sorting=384']]); }
}
foreach ([$root, $login, $area] as $page) { native('contao:page:publish', ['id' => $page, '--operator' => 'portal-lab']); }
file_put_contents('/var/www/html/var/portal-lab-credentials.json', json_encode($credentials, JSON_PRETTY_PRINT));
echo json_encode(['status' => 'ok', 'companies' => 2, 'members' => 3, 'credentials' => 'private server file; not logged'])."\n";
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage()."\n");
    exit(1);
}
