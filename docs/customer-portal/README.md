# Kundenportal ERTNER&SO

Stand: 30.10.2026. Grundlage ist Jans „Bauplan Kundenportal ERTNER&SO“ vom
gleichen Tag. Dieses Verzeichnis dokumentiert den Vorabcheck und die Umsetzung
in getrennten Arbeitspaketen. Es enthält noch kein implementiertes Portal.

## Verbindlicher Rahmen

- Eigenes natives Contao-Bundle in diesem Repository, eingebettet auf
  ertnerundso.com. Bestehende Mitglieder und Login-Module weiterverwenden.
- Contao-Datenbank ist führend. Kundendateien bleiben in OneDrive.
- Kein Frame.io oder anderer Review-Dienst, kein Chat, keine KI-Funktionen,
  keine Rechnungserstellung, kein Live-Stundenzähler.
- Bestehendes CSS und Designsystem verwenden. Keine Ersatzpalette und keine
  parallelen Komponenten erfinden. DESIGN.md und VOICE.md stehen noch aus.
- Deutsche Sie-Form; eine primäre Aktion je Ansicht; mobile und per Tastatur
  bedienbare Oberfläche; keine Analyse-Skripte im geschützten Bereich.
- Pro Paket eigener Branch und PR mit Prüfergebnissen und, bei sichtbaren
  Änderungen, Screenshots. Jan nimmt ab und führt zusammen. Kein automatischer
  Merge und kein Live-Deployment aus diesem Vorabcheck.

## Reihenfolge und Freigabestufen

| Paket | Ergebnis | Abnahme |
| --- | --- | --- |
| 1 | OneDrive-Technikprobe | 2-GB-Video, Start < 3 Sekunden, Seek, Linkablauf, 5-GB-Upload mit Wiederaufnahme; reales Ergebnis schriftlich |
| 2 | Bundle, Tabellen, Rollen, geschützte Navigation | Firma A erhält weder Daten noch Dateizugriff von Firma B, auch mit erratenen IDs |
| 3 | Native Backend-Verwaltung und Delta-Abgleich | Projekt in < 2 Minuten; neue Dateien zunächst nur im Backend sichtbar |
| 4 | Übersicht, Projekte und Abgaben | Ausschließlich eigene Daten, korrekte Wartezustände und Zähler |
| 5 | Video-Kommentare und Timeline | Zeitpunkte, Bereiche, tatsächliche Bildrate, Frame-Schritt; Sprung auf höchstens einen Frame genau |
| 6 | Bild- und PDF-Prüfung | Position und PDF-Seite nach Neuladen unverändert |
| 7 | Vektorzeichnungen | Freihand, Pfeil, Rechteck, Text und Farbe; relative Koordinaten 0–1, Größenwechsel getestet |
| 8 | Antworten, Status, Vergleich und Wasserzeichen | Versionen synchron; Vorschau-Einblendung endet nach Freigabe |
| 9 | Freigaben, Korrekturrunden und Resolve-Export | Kontingent und Mehraufwand bestätigt; unveränderlicher Freigabenachweis; Marker im richtigen Frame |
| 10 | Gebündelte Benachrichtigungen | Maximal eine Mail je Projekt und Stunde, Empfänger und Fehlerverhalten geprüft |
| 11 | ES-Ereignisfeed und Pilot | Nachholen nach Offline-Zeit; ein echtes Projekt vollständig durchlaufen |

**Paket 1 ist ein technisches Stop/Go-Gate.** Vor seinem belegten Abschluss
werden die übrigen Pakete nicht umgesetzt. Ein lokaler Mock oder eine kleine
Testdatei gilt nicht als bestandener Streaming-/Großdatei-Test.

Stufe 2 beginnt erst nach dem Pilot: Datenanfragen und direkter Upload ab 10 GB,
BlockSuite/Yjs nach Paketprüfung, Markenkoffer, sevdesk-PDFs, Abnahme-PDF,
Referenzfreigaben, Terminbuchung, Gast-Links und vollständige Suche. In Stufe 1
sucht die Navigation nur über bereits vorhandene Projekte und Kommentare;
Dokumente werden erst mit Stufe 2 durchsuchbar. Stufe 3 wird erst danach geplant.

## Sicherheitsregeln für die folgende Implementierung

- Jede Tabelle mit Kundendaten erhält `firma_id`, auch Phasen, Versionen,
  Kommentare, Zeichnungen, Freigaben und Abgaben. Untergeordnete Referenzen
  müssen zusätzlich zur gleichen Firma gehören.
- Ein Mitglied gehört genau einer Firma an. Server prüft Firma, zugehörige
  Mitgliedergruppe und Rolle. Die gemeinsame Basisgruppe ist keine
  Mandantenberechtigung. Nicht zugeordnete und deaktivierte Mitglieder werden
  abgewiesen; das vorhandene Demo-Mitglied sieht keine echten Daten.
- Entscheider können freigeben, Mitleser ausschließlich sehen und kommentieren.
  Keine Selbstzuordnung einer Firma oder Rolle über JSON-Eingaben.
- Jede Objekt-, Such-, Zähler-, Vorschau- und Download-Abfrage wird serverseitig
  mandantengefiltert. Verknüpfte IDs aus Requests sind nicht vertrauenswürdig.
- Zustandsänderungen benötigen native Anmeldung, CSRF-Schutz, Rollenprüfung,
  Transaktionen und Schutz vor doppelter Ausführung. Zwei gleichzeitige Klicks
  zählen keine zwei Korrekturrunden und erzeugen keine widersprüchlichen Freigaben.
- Kommentare sind keine Korrekturrunden. Erst die ausdrückliche Anforderung
  zählt einen Lauf. Nach Freigabe oder ausgeschöpftem Kontingent muss der
  Mehraufwand ausdrücklich bestätigt werden. Nur Jan darf eine Phase wieder
  öffnen; bestehende Freigaben werden nicht überschrieben.
- Abgaben und freigeschaltete Versionen sind explizite Datensätze. Die bloße
  Existenz einer OneDrive-Datei veröffentlicht nichts.
- Kundendateien niemals in öffentliche Contao-`files/`-Ordner übernehmen.
  Microsoft-Zugangstokens und App-Secrets bleiben auf dem Server.
- Freigabe, Upload und Download werden dauerhaft protokolliert. Der ES-Feed
  verwendet einen stabilen monotonen Cursor, begrenzte Seiten und mindestens
  einmalige Zustellung; ES dedupliziert anhand der Ereignis-ID. Ein Abruf darf
  Ereignisse nicht für andere Verbraucher löschen oder vor Empfang bestätigen.
- Der ES-Feed enthält nur freigegebene Metadaten, keine Kommentartexte,
  Dateiinhalte, Dokumentinhalte, Download-URLs oder Zugangstokens.
- Server führt keine Verbindung ins Heimnetz aus. ES fragt den Feed per HTTPS
  mit einem rotierbaren, gesonderten Zugriffstoken ab.
- Vorschau-Wasserzeichen sind kein Kopierschutz. Für NDA-Material benötigt Jan
  bereits eingebrannte Wasserzeichen; der Server transkodiert nicht.
- 30-Tage-Sitzungen und 2FA werden separat in Contao geprüft. Kein heimliches
  Ändern vorhandener Admin-Konten oder Abschalten bestehender Sicherheitsregeln.
- Löschfristen erst nach Jans Vorgabe; das Portal löscht niemals OneDrive-Dateien.

## Bestehende Grundlage

Der Vorabcheck verweist auf den vorhandenen nativen Login, nicht auf ein neues
Authentifizierungssystem. Der Login-Rollout dokumentiert 15 bestandene Prüfungen.
Sie wurden in diesem Vorabcheck nicht erneut ausgeführt. Passwort-Reset-Mails
sind ohne nachgewiesenen Mailtransport weiterhin kein abgenommener Teil.

Weitere Unterlagen:

- [Vorabcheck und offene Voraussetzungen](preflight-2026-10-30.md)
- [Technikprobe OneDrive](onedrive-spike.md)
