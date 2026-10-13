# Server (Android-only proxy)

Base: `https://fuufqctnluwhlsfvybum.supabase.co/functions/v1/api` (Lovable Cloud function `supabase/functions/api`).
Defaults: `src/config/server.json` → `server_address`, `is_enabled` (default `false`). Device settings override.

| Endpoint | Status |
|---|---|
| `/proxy?url=` — anonymous GET, only `https://*.youtube.com/api/timedtext` | live |
| `/health` — `{ ok, uptime: "2h 5m 3s" }` | live |
| `/openapi.json` — OpenAPI 3 spec | live |
| `/openrouter` (needs `OPENROUTER_API_KEY`) | pending |
| `/youtube?id=` metadata/tracks | nice-to-have |

Interactive docs (Swagger "Try it out"): `<app>/api-docs/`.
Note: unsigned timedtext URLs return 200 with empty body; use a captured signed URL.
