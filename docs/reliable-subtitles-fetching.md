# Reliable subtitles fetching

Scope: Android app only. The web demo shows only local fixture subtitles (`public/fixtures/L2Ryrr6txwA/*.json`) and never fetches live captions.

## Core idea

On Android the native shell watches the authentic `youtube.com/api/timedtext` request made by the embedded YouTube player, then sends it again with changed values:

- **`lang` replacement**: `lang=<target>`, with no `tlang`. This asks YouTube for a caption track uploaded in that language.
- **`tlang` addition**: keep the original `lang` and add `tlang=<target>`. This asks YouTube to machine-translate the track.

All other signed query parameters (`v`, `ei`, `expire`, `sparams`, `signature`, `key`, `caps`, `kind`, ...) are kept unchanged.

## Attempts and order

An attempt is a pair: a request style (`tlang` | `lang`) and a sending method (`session` | `anon`).

- `session` sends the captured player headers and cookies (`lastObservedHeaders`).
- `anon` sends the bare URL with no cookies and a plain mobile Chrome User-Agent. This is like pasting the link into a browser.

The default order is `tlang/session → lang/session → tlang/anon → lang/anon`. The user can reorder attempts or disable them. The order is stored on the device in `localStorage` (`yt_fetch_attempt_order_v1`).

When `promoteSuccessfulAttempt` is on, the attempt that worked moves to the front.

Rules:

- One HTTP request per attempt. The JS layer owns the loop; native code never loops internally.
- The loop stops at the first good response.
- There are no automatic retries. A failed language shows a manual "Fetch again" action.

Implementation:

- `src/lib/subtitle-fetch-plan.ts` builds the attempt list and the URL for each attempt, and runs them one by one.
- The native bridge `AndroidNativeShell.fetchTimedTextExact(url, withSession)` sends exactly one URL and returns `{status, body, sentUrl, send, error}`.

## Good response

A response is good only when all of these hold:

- HTTP 200.
- The body is non-empty JSON, not HTML.
- It is json3 with a non-empty `events` array.
- At least one event has `segs[].utf8` text.

The check is `isValidJsonSubtitleResponse`. Only good responses are cached.

## Network panel

Every attempt is recorded with:

- the exact URL sent
- the request style and sending method
- the real HTTP status
- the response size
- the error reason

Each request record on Android has actions:

- **Fetch again with session**
- **Fetch again (link only)**
- **Fetch again (via server)**: routes the request through a configurable external server/proxy endpoint.
- **Use these subtitles**: appears when a result is good. It loads the result as that language's column for the current video and caches it.

## Dynamic favorite languages ordering & fetches

- The user's list of favorite languages (`targetLanguages`) determines the exact sequential order in which subtitle tracks are discovered and requested.
- Reordering favorite languages (via priority `#1`, `#2` arrows in the selector or table chevrons) dynamically updates the fetch priority order.
- The "Fetch again" button dynamically recalculates the exact list of missing/failed favorite languages in their prioritized order. Changing the favorite languages immediately updates the languages to be fetched next without requiring video restarts.

## Server repetition for fetch requests

- A configurable server proxy option (`useFetchServer`, off by default) allows repeating fetch requests through an external HTTP proxy or server.
- The server address is configurable in advance via input fields in Attempt Order Settings and the Network Inspector, and can be updated anytime.
- When enabled, repeated requests are sent to `${serverUrl}?url=${encodedTarget}` (or replacing `{url}` in custom templates).

## Diagnosing "fails in app, works in browser"

1. Open the failed record and press **Fetch again (link only)**.
2. If the link-only fetch succeeds, the captured session headers are the problem. Move the `anon` attempts to the front.
3. If both direct attempts hit rate limits (HTTP 429), enable **Use server for repeat** and specify your server endpoint to repeat the fetch via server proxy.
4. If requests still fail, check the `expire` value. The signed URL may have expired, so play the video again to capture a fresh one.

## Subtitle fetch window rate-limiting & anti-abuse protection

To prevent YouTube API abuse, temporary IP blocks, and HTTP 429 (Too Many Requests) errors:

- **Window frame rate-limiting**: The platform enforces a strict window frame rate limiter: **never try to fetch more than 1 subtitle in a window frame of X seconds** (default `X = 5` seconds, configurable in Settings and Attempt Order Settings).
- **Serialized single-flight execution**: `SubtitleRequestQueue` enforces `Concurrency = 1`. Multiple rapid user clicks or simultaneous target language additions are enqueued into a sequential FIFO queue.
- **Timestamp pacing**: Every fetch registers `lastFetchTimestamp = Date.now()`. Before dispatching any subsequent fetch task, the coordinator calculates `elapsed = now - lastFetchTimestamp`. If `elapsed < windowFrameMs`, execution delays for the exact remaining duration before dispatching.

## Subtitle fetching strategies & configuration options

The application exposes flexible subtitle fetching strategies and granular switches in both Attempt Order Settings and Application Settings:

### 1. Available fetching strategies (`mode`)

- **Ordered Fallback (Deterministic 1→4)**: Attempts are executed strictly in the configured sequential priority order (`tlang/session` → `lang/session` → `tlang/anon` → `lang/anon`). Stops immediately upon the first good response.
- **First-Random Strategy (Anti-Bot Fingerprint)**: Randomly shuffles the active attempts on each fetch. Distributing the request signatures prevents automated scraping fingerprint detection by YouTube's edge gateways.
- **Server Alternate Mode**: Alternates request dispatch between the local Android WebView client (with session cookies) and the external server proxy, balancing traffic origins.

### 2. Granular configuration options & toggles

- **`server:alternate` (on/off)**: When enabled, interleaves direct device requests with server proxy requests.
- **`session` (yes/no)**: Enables or disables requests utilizing captured embedded player headers and cookies (`lastObservedHeaders`).
- **`anon` (yes/no)**: Enables or disables bare URL requests without session cookies (link-only mode).
- **`tlang` (on/off)**: Enables or disables machine-translation mode (`tlang=<lang>` with original video language preserved).
- **`lang` (on/off)**: Enables or disables direct track replacement mode (`lang=<lang>` without `tlang`).
- **`windowSeconds`**: Controls the anti-abuse pacing window frame (seconds, default 5s).

## Default platform behaviors

- **Auto TTS-play fetched language name**: By default when a new subtitle track is fetched, the app invokes speech synthesis to announce the name of the fetched language (`speakLanguageNameOnFetch = true`).
- **Default debug mode enabled**: Debug Mode is ON by default (`getDebugModeSetting() === true`), surfacing the real-time TTS queue, diagnostic dock, and network inspector.
- **Default parser criteria**: By default all parsing criteria options are enabled (`DEFAULT_PARSER_CRITERIA`), combining syntax sentence breaks, speech pauses, timing consensus, punctuation voting, cue chunking, anchor alignment, and window constraints.

