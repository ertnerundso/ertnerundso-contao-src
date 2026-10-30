# Kundenportal: natives Contao-Grundgerüst

Dieses Paket setzt die technische Grundlage des Kundenportal-Bauplans um.
Es ist **kein fertiger Frame.io-Ersatz**. Die OneDrive-Technikprobe ist weiterhin
ein offenes Freigabe-Gate. Stufe 2 wird nicht vor dem Pilot umgesetzt.

## Implementiert

- Eigenes Contao-6-Bundle mit Manager-Plugin und neun `tl_portal_*`-Tabellen.
- Firmenzuordnung und Rolle an nativen Mitgliedern; jede Kundenfirma hat eine
  eigene Mitgliedergruppe. Eine gemeinsame Basisgruppe allein genügt nicht.
- Native, ausschließlich für Backend-Administratoren erreichbare DCA-Verwaltung.
  Freigabe- und Ereignistabellen sind dort nicht editierbar oder löschbar.
- Wiederverwendbare Firmenprüfung aus aktueller Datenbank-Zuordnung, Mitglieds-
  status und Gruppe. Keine Übernahme einer `firma_id` aus Browser-Eingaben.
- Übersicht, Projekt-/Phasenliste, Prüf- und Abgabenliste sowie Teamansicht mit
  echten, serverseitig gefilterten Daten. Leere Zustände, Projektsuche, Cmd/Strg+K,
  mobile Navigation und zugängliche Bedienelemente.
- Natives CMS-Inhaltselement `customer_portal`, modernes Fragment und Adapter
  für die derzeit verwendeten `default`-Layouts. Beide nutzen dasselbe Template
  und dieselbe Berechtigungsprüfung. Eigenes natives `fe_customer_portal`-Layout.
- Private Seiten-/Fehlerantworten mit `no-store`, Indexierungs- und Frame-Schutz.
  Eigenes Portal-Layout ohne Tracking; Tracking-Ausschluss im Website-Template
  auch für bestehende Login-/Kundenbereich-Seiten.
- Vorhandene Schriften, Buttons, Karten, Farben und Abstände aus dem Repository.
  `css/portal.css` ergänzt ausschließlich Anordnung und Abstände und wird nicht
  in `site.css` aufgenommen. Die CSS-Prüfung kontrolliert die gesonderte Einbindung
  und weiterhin die gleichen Eigentums-, Token- und Breakpoint-Regeln.

## Noch nicht implementiert oder abgenommen

- OneDrive-App, Rechte, Delta-Abgleich, Streaming, Download und Upload.
- Kommentare, Zeichnungen, PDF-/Video-Player, Vergleich, Wasserzeichen und Marker.
- Freigabe-Transaktionen und Korrekturrunden; die Tabellen sind nur das Schema.
- Automatische Phasenvorlagen, Version-freischalten-Workflow, Einladungen.
- E-Mail-Bündelung, ES-Ereignisfeed und der reale Kundenpilot.
- Magic-Link-Login, Prüfung/Einrichtung der 30-Tage-Sitzungen und 2FA-Vorgaben.
- „Neue Abgaben“-Zähler mit persönlichem Gelesen-Status. Der vorhandene Prüfzähler
  zählt veröffentlichte Prüfversionen, noch nicht fachlich deduplizierte Freigaben.

Die UI bietet hierfür keine funktionierenden Aktionen vor. Bei Prüfversionen
und Abgaben wird die noch ausstehende Medienanbindung ausdrücklich genannt.
Es gibt keine öffentlichen Dateilinks und keine Microsoft-Tokens im Browser.

## Reguläre Installation nach Abnahme

1. Eigenen Build aus dem geprüften Branch erstellen. Das Paket unter
   `/packages/customer-portal` in das Contao-Image kopieren und im Composer-
   Projekt einen lokalen `path`-Repository-Eintrag dafür ergänzen.
2. `composer require ertnerundso/contao-customer-portal-bundle:@dev` im Build
   ausführen. Der Manager registriert das Bundle und dessen Routen regulär.
   Das Live-Vendor-Verzeichnis wird derzeit von einem persistenten Volume
   überlagert: hierfür einen geprüften, versionierten Vendor-Stand verwenden;
   ein Image-Neubau allein aktualisiert ein bestehendes Volume nicht.
3. Native Datenbanksicherung anlegen; `contao:migrate --dry-run` prüfen, danach
   die geprüfte Schema-Erweiterung ausführen. Kein `--with-deletes` nötig.
4. `assets:install public` ausführen. `css/portal.css` neben die vorhandenen
   Release-CSS-Dateien legen; bestehende CSS-Dateien nicht ersetzen.
   `PORTAL_WEBSITE_ASSET_BASE` bezeichnet das bestehende Website-Release,
   standardmäßig `/files/site/releases/polish-20261022`.
5. Eigenes natives Seitenlayout mit `type=default`, Template `fe_customer_portal`
   und deaktivierter Skript-Kombination erstellen; Artikel-Modul-ID im Layout
   ist Contao-intern `0`. Keine Änderung der öffentlichen Seitenlayouts.
6. Eine native Seite unter `/kundenbereich` schützen, Caching vollständig
   ausschalten, aus Index/Sitemap nehmen und das Inhaltselement
   „Kundenportal“ einsetzen. Das Element verweigert öffentliche Alias-Pfade und
   ungeschützte bzw. cachebare Seiten. Das Seitenlayout lädt seine Styles über
   die native Asset-Verwaltung genau einmal, ohne Marketing-Skripte.
7. Firmen aktivieren, jeweils eine eigene Gruppe zuordnen und dem Mitglied
   `firma_id`, Firmen-Gruppe und Rolle geben. Für den bisherigen Einstieg ggf.
   zusätzlich die bestehende Basisgruppe zuweisen. Demo-Konten ohne Firma bleiben
   ausgeschlossen. Niemals eine echte Firma dem gemeinsamen Demo-Konto zuordnen.
8. Tenant-/Browserprüfungen wiederholen. Ohne erfolgreiche OneDrive-Abnahme noch
   keinen realen Review-/Freigabeprozess oder Kundenpilot starten.

Die Installation wurde nicht auf Live ausgeführt. Vor einem Rollout sind
Composer-Auflösung im endgültigen Image und die Produktionskonfiguration separat
zu prüfen. Die bestehende Login-/Passwort-Reset-Einrichtung wird weiterverwendet;
ein funktionierender SMTP-Transport wird nicht vorausgesetzt oder behauptet.

## Isoliertes Labor

Das Labor läuft auf dem vorhandenen Host mit eigener Datenbank, eigenem App-
Verzeichnis und einem internen Docker-Netz. Keine Live-Volumen werden eingebunden;
lediglich eine separate Kopie der PHP-Abhängigkeiten dient als Testlaufzeit.
MCP, OneDrive, Mailversand und Live-Inhalte werden nicht übernommen.

`tests/provision-lab.py` verweigert vorhandene App-Verzeichnisse. Es erstellt
Zufalls-Secrets außerhalb von Git. Nach `docker compose up -d` im Labor
`composer dump-autoload` ausführen. Der Labor-Loader registriert den Manager-
Plugin explizit in seiner separaten Vendor-Kopie; das ist ausschließlich der
Testaufbau und ersetzt nicht die reguläre Composer-Installation oben.

Danach ausschließlich im Labor `contao:migrate --no-backup --no-interaction`
und `PORTAL_LAB_MODE=1 php /portal-package/tests/seed-lab.php` ausführen.
Die Seed-Datei akzeptiert nur die leere Datenbank `portal`, erstellt native
Testmitglieder und CMS-Datensätze sowie zwei künstliche Kundenfirmen. Sie ist
kein Production-Seeder und überschreibt keine vorhandenen Konten.

Zugangsdaten liegen mit Modus `0600` unter `var/portal-lab-credentials.json`
außerhalb des Webroots. Der Browserzugang erfolgt ausschließlich per lokalem
SSH-Tunnel. HTTP ist nur innerhalb dieses verschlüsselten Labortunnels zulässig;
das spätere Kundenportal benötigt HTTPS.

Die Testumgebung darf keine echten OneDrive-/Kundendaten erhalten. Sie ist nicht
der in Paket 1 geforderte öffentliche HTTPS-Medien-Test und belegt keine
Streaming-Leistung oder Microsoft-Integration.

## Prüfungen

- `php /portal-package/tests/run.php`: 32 Doctrine-/SQLite-Prüfungen zu Firmen,
  Rollen, IDs, falschen Verknüpfungen, Archivierung und Veröffentlichungsgrenzen.
- `tests/browser.mjs`: echter Contao-Login, Firmen A/B, Demo-Ausschluss, native
  CMS-Einbindung, API, Suche, Navigation, Desktop/Mobil, privates Caching,
  keine Analytics, Logout und natives Backend. Zugangsdaten ausschließlich aus
  `PORTAL_TEST_CREDENTIALS`; Screenshots/Ergebnisse nach `PORTAL_TEST_OUTPUT`.
- `npm run check:css`, `npm run check:js`, PHP-Lint und Twig-Lint.

Keine Großdatei-, E-Mail-, Resolve-, Freigabe- oder Pilot-Abnahme aus diesen
Prüfungen ableiten. Diese gehören zu den folgenden Paketen.
