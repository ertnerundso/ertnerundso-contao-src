# Vorabcheck vom 30.10.2026

## Tatsächlich geprüft

| Bereich | Feststellung | Konsequenz |
| --- | --- | --- |
| GitHub | Zugriff auf `ertnerundso/ertnerundso-contao-src`, Standardbranch `main`, Schreibrecht vorhanden | Separater PR möglich |
| Ausgangsstand | `48da2c206599128e412116f1852e5ec35e45c75d` | Arbeit in eigenem Worktree; bestehender Website-Checkout bleibt unverändert |
| Live-System | Contao Managed Edition 6.0.1, PHP 8.4.26, Docker | Native Bundle-Integration grundsätzlich vorbereitet; noch keine Kompatibilitätsabnahme eines Portal-Bundles |
| PHP CLI | `max_execution_time=0`, `memory_limit=512M` | Belegt ausschließlich CLI-Werte, keine Aussage über Web-/Proxy-Timeouts |
| Bestehender Login | Rollout-Dokumentation vorhanden: `/kundenlogin`, geschützter `/kundenbereich`, native Mitglieder | Weiterverwenden; kein weiterer Login-Bau nötig |
| Demo | Gemeinsame Basisgruppe, keine Firmenzuordnung | Darf später keine echten Projekte sehen |
| Mail | Live-Container hat keinen `MAILER_DSN` in seiner Umgebungsvariablenliste; letzter Login-Rollout nennt offenen Mailtransport | Mailversand nicht abgenommen; Anbieter und Absender fehlen |
| Microsoft | Keine Graph-/Azure-/OneDrive-/Microsoft-/Tenant-Schlüsselnamen in den Live-Container-Umgebungsvariablen gefunden | Keine funktionsfähige OneDrive-Verbindung nachgewiesen; keine umfassende Secret-Suche durchgeführt |
| Testumgebungen | Zwei vorhandene isolierte Contao-Stacks ohne veröffentlichte Hostports und ohne Traefik-Labels | Nicht mit Live-Netz verbunden; kein Nachweis bereinigter Daten oder einer für diesen Auftrag verfügbaren Browser-Route |
| Cron | In geprüfter `/etc/crontab`, `/etc/cron.d/` und Root-Crontab kein passender Contao-/Portal-Eintrag gefunden | Ein vorhandener App-interner Scheduler wurde damit nicht ausgeschlossen; dedizierten Test-Cron noch nachweisen |
| Design | Im Website-Checkout keine DESIGN.md / VOICE.md gefunden | Jans Dateien und Figma-Referenz erfragen; keine Ersatzwerte erfinden |

Es wurden keine Datenbankeinträge, Container, Proxy-Routen, Kundendateien,
CSS-Dateien oder Live-Templates geändert. Secrets wurden nicht ausgegeben.

## Vor Paket 1 noch erforderlich

1. Microsoft-365-App, gewählter Authentifizierungsweg und ausdrücklich gewährte
   Rechte auf den Portal-Testordner; Zugangsdaten über sicheren Serverpfad oder
   Secret-Verwaltung, nicht im Chat oder Repository.
2. Freigegebener OneDrive-Testordner mit ausreichend freiem Kontingent sowie
   ein unkritisches 2-GB-Prüfvideo und eine 5-GB-Upload-Testdatei. Keine NDA-Dateien
   als allgemeine Testdaten und keine vorhandenen Dateien überschreiben.
3. Dedizierte Nicht-Live-Testumgebung mit eigener Datenbank, eigenen Volumes,
   unkritischen Testfirmen und einer abgesicherten HTTPS-Browser-Route. Die
   vorhandenen Labore werden nicht ungeprüft übernommen. Externe Mailzustellung
   ist dort zu deaktivieren. Live-Secrets und echte Kundenbestände nicht kopieren.

Repository-Zugang und Hosting-Version sind bereits geklärt. Die übrigen
Voraussetzungen gelten erst mit tatsächlichem Nachweis als erfüllt.

## Ergebnisse, die ausdrücklich noch fehlen

- Kein 2-GB-Video abgespielt; Startzeit und Range-/Seek-Verhalten nicht gemessen.
- Keine 5-GB-Datei hochgeladen; Wiederaufnahme nicht getestet.
- Kein Download-Linkablauf im Tenant beobachtet.
- Keine Microsoft-App registriert oder Berechtigung erteilt.
- Kein Portal-Bundle, keine Portal-Tabellen, keine neue Oberfläche erstellt.
- Kein Pilot, kein E-Mail-Versand und keine ES-Synchronisation getestet.

Paket 1 steht daher auf **wartet auf Voraussetzungen**, nicht auf bestanden.
