# Journal API for n8n

These endpoints create, edit and publish Contao Journal news on the live site. They use the installed `webwerkwien/contao-ai-core-bundle` commands, so Contao versions and audit logging remain intact. There is no delete or unpublish endpoint.

## Request

`POST https://ertnerundso.com/_automation/journal`

Headers: `Authorization: Bearer <server token>` and `Content-Type: application/json`.

```json
{
  "locale": "de",
  "headline": "Beispielüberschrift",
  "teaser": "Kurze Zusammenfassung.",
  "body": "Erster Absatz.\n\nZweiter Absatz.",
  "date": "2026-10-07"
}
```

`date` is optional. `locale` selects the existing Journal (DE) or Journal (EN) archive. The response contains the news ID and always has `published: false`.

`PATCH https://ertnerundso.com/_automation/journal/{id}` accepts one or more of `headline`, `teaser`, and `body`. Body updates are refused if the article no longer has exactly one API-created text element. Published articles are always refused. Plain text is HTML-escaped and blank lines create paragraphs; raw HTML is not accepted.

`POST https://ertnerundso.com/_automation/journal/{id}/publish` publishes an existing Journal draft. It requires a **separate publish bearer token** and exactly this JSON body:

```json
{"confirm":true}
```

The response reports `published: true`. A retry for an already published article returns `already_published: true`. The endpoint refuses records outside the two Journal archives, empty or invisible content, incomplete metadata and manually scheduled articles. n8n should call this only after its own review/quality checks; publication takes effect immediately on the live site.

The draft token lives only on the server in `/opt/ertnerundso-contao-live/journal-api-token`. The separate publish token lives in `/opt/ertnerundso-contao-live/journal-api-publish-token`. Store them as separate n8n credentials, never in this public repository or directly in workflow JSON. Old staging tokens are not valid on the live endpoint.

## Live integration

The live Docker Compose override mounts the three source files into Contao and mounts both tokens read-only under `/run/secrets/`. Composer autoload maps `App\\` to `journal-api/`; after deployment, refresh the Composer autoloader and clear the Contao cache. A dedicated Traefik router rate-limits `/_automation/journal`; bearer authentication remains in this controller. The former staging address redirects to `https://ertnerundso.com` and its Contao containers are stopped, not deleted.

The live archive IDs are 3 (DE) and 4 (EN). Update `services.php` if those archives are ever recreated. The API intentionally does not accept HTML, images or arbitrary Contao fields.
