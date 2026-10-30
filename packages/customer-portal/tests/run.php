<?php
declare(strict_types=1);

// Läuft gegen dieselben Doctrine-Abhängigkeiten wie Contao, ohne Live-Datenbank.
require '/var/www/html/vendor/autoload.php';

use Doctrine\DBAL\DriverManager;
use Ertnerundso\CustomerPortal\Repository\PortalRepository;
use Ertnerundso\CustomerPortal\Security\Tenant;
use Ertnerundso\CustomerPortal\Security\TenantContext;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

$checks = [];
function check(string $name, bool $result): void {
    global $checks;
    if (!$result) { throw new RuntimeException('Fehlgeschlagen: '.$name); }
    $checks[] = $name;
}
$now = time();
$member = ['firma_id' => 1, 'mitgliedergruppe' => 4, 'groups' => serialize([4]), 'rolle' => 'entscheider', 'login' => '1', 'disable' => '', 'start' => 0, 'stop' => 0];
check('Entscheider mit Firmen-Gruppe zugelassen', TenantContext::allows($member, $now));
check('Native Integer-Flags unterstützt', TenantContext::allows(array_replace($member, ['login' => 1, 'disable' => 0]), $now));
check('Native Integer-Sperre unterstützt', !TenantContext::allows(array_replace($member, ['disable' => 1]), $now));
foreach ([['firma_id', 0], ['groups', serialize([1])], ['rolle', 'admin'], ['disable', '1'], ['login', ''], ['start', $now + 60], ['stop', $now - 1], ['groups', 'unlesbar'], ['group_disable', 1], ['group_start', $now + 60], ['group_stop', $now - 1]] as [$key, $value]) {
    check('Zugriff verweigert: '.$key.' / '.(string) $value, !TenantContext::allows(array_replace($member, [$key => $value]), $now));
}
check('Mitleser ohne Freigaberecht', !(new Tenant(1, 1, 'A', 'A', 'mitleser'))->canApprove());
check('Entscheider mit Freigaberecht', (new Tenant(1, 1, 'A', 'A', 'entscheider'))->canApprove());

$db = DriverManager::getConnection(['driver' => 'pdo_sqlite', 'memory' => true]);
foreach ([
    'CREATE TABLE tl_portal_projekt (id INTEGER PRIMARY KEY, firma_id INT, titel TEXT, vorlage TEXT, korrekturlaeufe_inklusive INT, archiviert TEXT, tstamp INT)',
    'CREATE TABLE tl_portal_phase (id INTEGER PRIMARY KEY, firma_id INT, projekt_id INT, name TEXT, reihenfolge INT, status TEXT, korrekturlaeufe INT)',
    'CREATE TABLE tl_portal_version (id INTEGER PRIMARY KEY, firma_id INT, phase_id INT, nummer INT, dateiname TEXT, typ TEXT, freigeschaltet_am INT)',
    'CREATE TABLE tl_portal_abgabe (id INTEGER PRIMARY KEY, firma_id INT, projekt_id INT, dateiname TEXT, format TEXT, groesse INT, freigeschaltet_am INT)',
    'CREATE TABLE tl_portal_ereignis (id INTEGER PRIMARY KEY, firma_id INT, projekt_id INT, art TEXT, zeitpunkt INT, daten TEXT)',
    'CREATE TABLE tl_member (id INTEGER PRIMARY KEY, firma_id INT, firstname TEXT, lastname TEXT, rolle TEXT, disable TEXT, login TEXT)',
] as $sql) { $db->executeStatement($sql); }
foreach ([1, 2] as $id) {
    $db->insert('tl_portal_projekt', ['id' => $id, 'firma_id' => $id, 'titel' => 'Projekt '.($id === 1 ? 'Alpha' : 'Geheim-Beta'), 'vorlage' => 'animation', 'korrekturlaeufe_inklusive' => 1, 'archiviert' => '', 'tstamp' => $now]);
    $db->insert('tl_portal_phase', ['id' => $id, 'firma_id' => $id, 'projekt_id' => $id, 'name' => 'Konzept', 'reihenfolge' => 1, 'status' => 'pruefung', 'korrekturlaeufe' => 0]);
    $db->insert('tl_portal_version', ['id' => $id, 'firma_id' => $id, 'phase_id' => $id, 'nummer' => 1, 'dateiname' => 'Datei '.$id, 'typ' => 'video', 'freigeschaltet_am' => $now]);
    $db->insert('tl_portal_abgabe', ['id' => $id, 'firma_id' => $id, 'projekt_id' => $id, 'dateiname' => 'Abgabe '.$id, 'format' => 'MP4', 'groesse' => 500, 'freigeschaltet_am' => $now]);
    $db->insert('tl_portal_ereignis', ['id' => $id, 'firma_id' => $id, 'projekt_id' => $id, 'art' => 'version', 'zeitpunkt' => $now, 'daten' => '{"private":"NICHT AUSGEBEN"}']);
    $db->insert('tl_member', ['id' => $id, 'firma_id' => $id, 'firstname' => 'Test', 'lastname' => 'Firma '.$id, 'rolle' => 'entscheider', 'disable' => '', 'login' => '1']);
}
$repo = new PortalRepository($db);
$a = new Tenant(1, 1, 'Alpha', 'Test', 'entscheider');
$b = new Tenant(2, 2, 'Beta', 'Test', 'mitleser');
check('Nur eigene Projekte', array_column($repo->projects($a), 'id') === [1]);
check('Andere Firma sieht ihr eigenes Projekt', array_column($repo->projects($b), 'id') === [2]);
try { $repo->project($a, 2); check('Erratene fremde Projekt-ID', false); } catch (NotFoundHttpException) { check('Erratene fremde Projekt-ID verweigert', true); }
check('Suche findet keine fremden Titel', $repo->projects($a, 'Geheim') === []);
check('Suche interpretiert SQL nicht', $repo->projects($a, "' OR 1=1 --") === []);
check('Nur eigene Phasen', array_column($repo->project($a, 1)['phases'], 'id') === [1]);
check('Nur eigene Prüfversionen', array_column($repo->reviews($a), 'id') === [1]);
check('Nur eigene Abgaben', array_column($repo->deliveries($a), 'id') === [1]);
check('Nur eigenes Team', array_column($repo->team($a), 'id') === [1]);
check('Keine Ereignis-Payloads', !array_key_exists('daten', $repo->activity($a)[0]));

// Fehlerhafte Fremdschlüssel mit eigener firma_id dürfen fremde Daten nicht öffnen.
$db->insert('tl_portal_version', ['id' => 3, 'firma_id' => 1, 'phase_id' => 2, 'nummer' => 1, 'dateiname' => 'FEHLVERKNÜPFUNG', 'typ' => 'video', 'freigeschaltet_am' => $now]);
$db->insert('tl_portal_abgabe', ['id' => 3, 'firma_id' => 1, 'projekt_id' => 2, 'dateiname' => 'FEHLVERKNÜPFUNG', 'format' => 'MP4', 'groesse' => 1, 'freigeschaltet_am' => $now]);
$db->insert('tl_portal_ereignis', ['id' => 3, 'firma_id' => 1, 'projekt_id' => 2, 'art' => 'version', 'zeitpunkt' => $now]);
check('Falsche Versions-Verknüpfung verborgen', count($repo->reviews($a)) === 1);
check('Falsche Abgaben-Verknüpfung verborgen', count($repo->deliveries($a)) === 1);
check('Falsche Ereignis-Verknüpfung verborgen', count($repo->activity($a)) === 1);
$db->update('tl_portal_version', ['freigeschaltet_am' => $now + 100], ['id' => 1]);
$db->update('tl_portal_abgabe', ['freigeschaltet_am' => 0], ['id' => 1]);
check('Zukünftige Version verborgen', $repo->reviews($a) === []);
check('Unveröffentlichte Abgabe verborgen', $repo->deliveries($a) === []);
$db->update('tl_portal_projekt', ['archiviert' => '1'], ['id' => 1]);
check('Archivierte Projekte verborgen', $repo->projects($a) === [] && $repo->activity($a) === []);

echo json_encode(['passed' => count($checks), 'checks' => $checks], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
