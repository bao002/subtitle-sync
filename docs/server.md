# Server (Android-only proxy)

Defaults: `src/config/server.json` → `server_address` (base, e.g. `https://<lovable-address>/api`), `is_enabled` (default `false`). Device settings (localStorage) override them.

## Client
- Toggle: Playback → Attempt order → "Use server for repeating fetch requests" (Android only; web demo stays fixture-only).
- Request: `GET <server_address>/proxy?url=<encoded timedtext URL>` — anonymous, URL only (no cookies/headers).
- Response passes the same json3 validation gate before caching.

## Planned endpoints (`<lovable-address>/api`)
| Endpoint | Purpose | Status |
|---|---|---|
| `/api/proxy?url=` | Anonymous GET of youtube.com/api/timedtext only (host allow-list) | pending backend |
| `/api/health` | `{ ok, uptime: "2h 5m 3s" }` | pending backend |
| `/api/openrouter` | OpenRouter chat passthrough (needs `OPENROUTER_API_KEY` secret) | pending |
| `/api/youtube?id=` | Title, description, caption track list | nice-to-have |

Backend needs Lovable Cloud (this app is a static SPA); not enabled yet.
