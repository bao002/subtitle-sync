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
