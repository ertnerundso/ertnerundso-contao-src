# Paket 1: Technikprobe OneDrive

Status: vorbereitet, noch nicht durchgeführt. Keine Zugangsdaten oder
temporären Datei-URLs in diesem Verzeichnis speichern.

## Architekturentscheidung vor dem ersten Test

Microsoft kündigt ab 01.04.2027 eine Umstellung vorausautorisierter Datei-URLs
auf Entra-authentifizierte Abrufe an. Die Ankündigung nennt auch Upload-Sitzungen.
Die bisherigen API-Seiten beschreiben teilweise noch den alten URL-Ablauf.
Deshalb beide Verhaltensweisen im tatsächlichen Tenant prüfen; auf reine
Bearer-URLs weder Streaming noch Upload dauerhaft festlegen.

Quelle, abgerufen am 30.10.2026:
[Microsoft 365 Developer Blog, 08.10.2026](https://devblogs.microsoft.com/microsoft365dev/pre-authenticated-tempauth-urls-are-retiring-move-to-microsoft-entra-id-tokens-before-april-1-2027/).

Der Bauplan verlangt gleichzeitig browserdirekte Uploads, keine Microsoft-
Zugangstokens im Browser und kein Microsoft-Kundenkonto. Ob diese Kombination
unter dem neuen Verhalten möglich bleibt, ist eine offene Gate-Frage. Falls
nicht, erhält Jan einen begründeten Änderungsvorschlag statt eines heimlichen
Wechsels auf einen Upload-Proxy oder breit berechtigte Browser-Tokens.

## Minimalrechte

1. Tenant und OneDrive Business gegenüber persönlichem OneDrive unterscheiden.
2. Prüfen, ob `Files.SelectedOperations.Selected` mit expliziter Ordnerfreigabe
   für Download, Upload-Sitzung und Delta im Tenant ausreicht. Nicht nur das
   Consent-Fenster prüfen: Zugang innerhalb des Ordners muss funktionieren,
   außerhalb muss er verweigert werden.
3. Wenn diese Kombination scheitert, Ursache und engere Alternativen
   dokumentieren. Keine pauschalen `*.ReadWrite.All`-Rechte als stillen Fallback
   vergeben. Eine abweichende Berechtigungsstrategie mit Jan abstimmen.
4. Tenant-ID, Client-ID, Drive-ID und Ordner-ID ausschließlich in der privaten
   Testkonfiguration halten; App-Secret oder Zertifikatschlüssel zusätzlich
   über Server-Secrets verwalten. Keine bestehenden MCP-Zugänge umwidmen.

[Microsoft: Selected Permissions](https://learn.microsoft.com/en-us/graph/permissions-selected-overview).

## Wiedergabe und Berechtigungen

- Testvideo: MP4/H.264, höchstens 1080p, konstante bekannte Bildrate, etwa 2 GB;
  Metadaten einschließlich genauer Größe, Dauer und Bildrate protokollieren.
  MP4-Metadaten für schnellen Start am Dateianfang; kein Transcoding im Portal.
- Zugriff nur nach nativer Contao-Anmeldung und serverseitiger Firmenprüfung.
  Der Browser übergibt eine Portal-Objekt-ID, keine beliebige Graph-URL.
- Den aktuellen direkten URL-Abruf und einen geschützten Same-Origin-
  Range-Streaming-Pfad als mögliche Alternative bewerten. Bei Proxy-Streaming
  Microsoft-Tokens ausschließlich serverseitig nutzen, Ziele begrenzen,
  Bytebereiche und Status 206/416 korrekt behandeln und nicht die gesamte
  Datei im PHP-Speicher puffern. Bandbreite, parallele Streams und Web-Timeouts
  tatsächlich messen; der CLI-Wert ist dafür kein Beleg.
- Private Antworten: `Cache-Control: private, no-store`, keine Analytics,
  `Referrer-Policy: no-referrer`; sensible URLs nicht in Logs oder Screenshots.
- Microsoft kontrolliert die Laufzeit seiner temporären Links. Ein zusätzliches
  Portal-Ablaufdatum verkürzt einen bereits ausgegebenen Microsoft-Link nicht.
  Einen solchen Link nie als unmittelbar widerrufbar bezeichnen.
- Beim Ablauftest einen kleinen Bytebereich abrufen und auf tatsächliche
  Zugriffsverweigerung warten; ein HEAD-Fehler beweist keinen abgelaufenen Link.
- Unveröffentlichte Datei, fremde Firma, nicht zugeordnetes Demo-Mitglied,
  abgelaufene Sitzung und nach Logout neu gestellter Abruf müssen scheitern.

[Microsoft: Dateiinhalt und Range-Abrufe](https://learn.microsoft.com/en-us/graph/api/driveitem-get-content?view=graph-rest-1.0).

## Wiederaufnehmbarer Upload

- Nur in einen freigegebenen Test-Unterordner von `Eingang`, mit eindeutigem
  Namen und Konfliktverhalten `fail`; vorhandene Dateien nicht ersetzen.
- Nur autorisierter Server erstellt Sitzungen. Testen, welche Browserrechte
  der Tenant heute und mit angekündigter Umstellung tatsächlich benötigt.
- Dateigröße mindestens 5 GB, sequenzielle Stücke, z. B. 10 MiB. Stückgröße
  unter 60 MiB und Vielfaches von 320 KiB; letztes Teilstück entsprechend Restgröße.
- Nach mehreren vollständig bestätigten Stücken Netzwerk unterbrechen, Seite
  neu laden, dieselbe Datei erneut auswählen. Dateidentität prüfen und
  `nextExpectedRanges` von Microsoft abrufen; nicht blind dem lokalen Offset
  vertrauen. Bereits bestätigte Bytes dürfen nicht nochmals übertragen werden.
- Status 429/5xx und `Retry-After` kontrolliert behandeln. Eine abgelaufene
  Upload-Sitzung erfordert Neustart mit verständlicher Meldung und darf nicht
  als erfolgreiche Wiederaufnahme gezählt werden.
- Endgröße und eine geeignete Inhaltsprüfung gegen die Quelle verifizieren;
  vollständigen Erfolg erst nach bestätigtem Abschluss melden. Browser darf
  nie die gesamte 5-GB-Datei in den Arbeitsspeicher einlesen.
- Sitzungstoken nicht ins Git, in Telemetrie oder Screenshots übernehmen;
  Wiederaufnahmezustand nur für den Testnutzer vorhalten und danach entfernen.
- Keine automatische Löschung aus OneDrive durch Test- oder Portalcode.
  Jan entscheidet über das anschließende Entfernen der Testdateien.

[Microsoft: Upload-Sitzungen](https://learn.microsoft.com/en-us/graph/api/driveitem-createuploadsession?view=graph-rest-1.0).

## Abnahmeprotokoll

| Prüfung | Nachweis | Ergebnis |
| --- | --- | --- |
| Minimalrechte | Zugriff im Testordner, verweigerter Zugriff außerhalb; Scopes ohne Secrets | Ausstehend |
| 2-GB-Video | Dateigröße, Codec, fps, Dauer | Ausstehend |
| Start < 3 Sekunden | Zeit vom Play-Klick bis erstem dargestellten Frame; Browser, Netz und Cachezustand; mindestens 5 kalte Starts; alle Messwerte | Ausstehend |
| Seek | Ziele bei 10, 50 und 90 Prozent, nahe Dateiende und zurück; tatsächlicher dargestellter Frame, Ladezeit und Range-Status | Ausstehend |
| Ablauf | Linkausgabe, beobachteter Zeitpunkt letzter Erfolg/erster verweigerter GET-Range; neuer autorisierter Abruf funktioniert | Ausstehend |
| Mandanten-/Login-Schutz | Nicht angemeldet, fremde Firma, Demo ohne Zuordnung, unveröffentlicht | Ausstehend |
| 5-GB-Upload | Dateigröße, Unterbrechung, bestätigter Offset, Neustart nach Reload, finale Inhaltsprüfung | Ausstehend |
| Umstellung 2027 | Tatsächlich getestetes Tenant-Verhalten für Download und Upload; Token bleibt serverseitig | Ausstehend |
| Betrieb | Web-/Proxy-Timeouts, Speicher, Bandbreite, parallele Streams, Cron-Aufruf | Ausstehend |
| Entscheidung | Go oder notwendige Planänderung mit konkretem Grund | Offen |

Erst reale Messwerte eintragen. Simulationen werden separat gekennzeichnet und
ersetzen keinen der Großdatei-Abnahmetests. Screenshots dürfen keine privaten
Inhalte, Secrets oder nutzbaren Download-/Upload-URLs zeigen.
