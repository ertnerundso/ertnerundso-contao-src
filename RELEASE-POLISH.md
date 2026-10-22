# Website-Feinschliff: Release und Abnahme

22.10.2026. Featurebranch `codex/website-polish-20261022`. Bisher ausschließlich getrennte, private Vorschau; keine Live- oder Main-Änderung.

## Zusammengehöriges Paket

- Haupttemplate vom tatsächlichen Live-Stand abgeglichen. Lokale versionierte Release-Assets statt abweichender GitHub-/Legacy-Pfade; Menüzustand erhalten. Skiplink mit Fokus in dieselbe Seite. Bestehende Sprachpaare und drei explizite neue Leistungs-Sprachpaare.
- Zentrale News-H1 und Einleitung für beide Journal- und Projektarchive; Karten H3. Native Übersichtsgruppen auf Readerseiten per Templatevariante ausgelassen, statt nur per CSS verborgen.
- Additives natives Nachrichtenfeld `eoTopic`, übersetzte Labels; Kategorie unabhängig vom Titel. Native Hervorhebung statt positionsabhängigem Sonderlayout.
- Journalmodule ohne 18er-Limit, neueste Beiträge zuerst; Startseite vier neueste freigegebene Beiträge. Related-Regel bleibt dynamisch im jeweiligen Archiv.
- Isolierte Vorschau mit Formularsimulation, deaktiviertem Kalender und ausgeschlossenen eigenen Analytics-Ereignissen. Live-Integrationen bleiben erhalten. Kontaktintention erkennt native DE-/EN-Pfade mit und ohne Slash.
- Storyboard-CTA gibt den gewählten Kontext an die Kontaktseite weiter; editierbare Nachricht wird nur bei leerem Feld vorbelegt. Umfang und Lieferzeiten bleiben ohne Inhaberangaben unversprochen.

## CMS-Synchronisierung und Rollback

Die folgenden Datensatzänderungen sind erforderlich und liegen im privaten, überprüften Migrationsplan außerhalb dieses öffentlichen Repositorys. Kein Datenbankdump oder Zugangsschlüssel gehört in Git.

1. Vorher vollständiges Offserver-Backup von Datenbank, App, Deployment und Images; Restore in getrennte Instanz geprüft.
2. DCA/Sprachdateien installieren; Schema-Dry-run darf ausschließlich `tl_news.eoTopic VARCHAR(16) DEFAULT 'visuals' NOT NULL` hinzufügen. Mit geprüftem Hash nativ migrieren; keine DROP-Anweisungen.
3. Neue Templates und komplettes CSS/JS-Release gemeinsam bereitstellen. 66 validierte doppelte Intro-CE unsichtbar setzen, nicht löschen. Modulregeln, Kategorien und Featured-Werte gemäß Preflight setzen.
4. 444 echte Bulletpunkte strukturell in Listen überführen; zwei eindeutige Montageabläufe als OL mit je sechs Schritten. Wortlaut/Inline-Markup erhalten. 18 EN-Overview-Titel, zwei abgeschnittene Headlines, vier Teaser/Beschreibungen und zwei unbelegte Zahlenabsätze gezielt korrigieren. Sechs Showreel-Nutzenüberschriften H3.
5. Zehn bestehende Übersichtsgruppen erhalten `content_element/element_group/overview_only`. Vier Storyboardlinks und zwei neue native Kontext-CE mit `content_element/text/storyboard_context`. Cobot als zusätzliche optimierte WebP-Datei registrieren und beide Sprach-CE zuweisen; PNG-Original bleibt erhalten.
6. 22 neue native Kontextverweise auf vorhandene Projekte. Sechs Leistungsseiten und sechs Projektstory-Vorlagen bleiben unveröffentlicht; keine öffentlichen Links auf diese Entwürfe. Testartikel niemals übernehmen.

Neuanlagen bei einer späteren Übertragung nach Produktions-IDs auflösen; Stage-IDs nicht blind kopieren. Vor jedem Update aktuelle Ausgangswerte mit dem Preflight abgleichen. Keine ganze Stage-Datenbank über inzwischen redigierte Live-Inhalte schreiben. Bei Teilfehler keine weiteren Massenänderungen; vollständiges Paket oder native Datensatzversionen gezielt zurücknehmen.

## Nachweise und offene Grenzen

Lokale CSS-/JS-Prüfung und JS-Build bestanden. Breiter Fixturelauf: 144 Tests bestanden, anschließend gezielte Regression für die letzten Kontakt-/Semantikänderungen. Zusätzlich zehn Offline-Migrationstests und sechs CMS-Workflowzustände mit einem 19. Testartikel geprüft; der Test ist zurückgenommen.

Unabhängige Vorschauprüfung: 77/77 Bestandsseiten HTTP200, 66 Reader mit genau einer H1; 92 lokale Ressourcen erreichbar und Releasehashes abgeglichen. 22 Kontextverweise, zehn Projektziele, zwölf gesperrte Draft-Routen und vier Listen ohne Draftleaks geprüft. Der Cobot ist von 2.017.556 Bytes PNG auf 31.324 Bytes WebP/1600px vorbereitet; dies ist keine gemessene Core-Web-Vitals-Zusage.

Noch separat erforderlich: tatsächliche Bedienung mit Jans Redaktionskonto; Storyboardumfang/Projektunterlagen/Originalmedien; kontrollierte GTM-Netzwerk- und Widerrufsabnahme; echte Zustellung/Buchung nur mit ausdrücklich vereinbartem Testverfahren. Keine allgemeine Barrierefreiheits-, Rechts- oder Sicherheitsfreigabe aus diesen Stichproben ableiten. Miniaturstadt-Alias und pauschales HTML-Caching bleiben bis zur Bestands-/Messprüfung unverändert.

Die bestehende GTM-Version wurde privat zusätzlich exportiert. Änderungen dort bleiben ein separater unveröffentlichter Entwurf; keine Produktivveröffentlichung aus diesem PR ableiten.
