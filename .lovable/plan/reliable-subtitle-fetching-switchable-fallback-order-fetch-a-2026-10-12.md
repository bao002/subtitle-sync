# Reliable subtitle fetching: switchable fallback order + "fetch again" buttons

## What I found

- When the app asks the Android app for one language, the Android side quietly tries **both** request styles itself, with its own fixed order, and ignores your setting. The web side then tries both again, so one language can mean up to 4 hidden requests. The network panel only shows the address the web side asked for, not what was really sent.
- Every Android request copies the cookies and headers it caught from the YouTube player. A link that works in an outside browser but fails in the app points to those copied cookies and headers. They may be stale, or tied to the embedded player, and get blocked. The app has no way to send a plain request with just the link.
- The panel always shows status 0 and "empty response" because the real HTTP status never comes back from Android.
- Your example link has both `lang=iw` and `tlang=pt`, on an auto-generated (`kind=asr`) track. That combination is valid, so the problem is most likely how the request was sent, not the link itself.

## What you'll get

1. **One request per attempt, in an order you choose and the app remembers.** Settings gets a short ordered list of attempts. Each attempt has a request style and a sending method:
   - Request style: "Add tlang" or "Replace lang".
   - Sending method: "With session" (cookies and headers) or "Link only" (anonymous).
   - The default order is: tlang with session → lang with session → tlang link only → lang link only.
   - You can move attempts up or down, or switch one off. The order is saved on the phone.
   - The app stops at the first attempt that returns real subtitles. It never retries automatically after that, and "Fetch again" stays manual.
   - Whichever attempt worked is moved to the front next time. A switch lets you turn this off.
2. **Every attempt shows in the network panel** with:
   - the exact link that was sent
   - whether it used the session or the link only
   - the real HTTP status, response size, and a short error reason
3. **Two new buttons on each network request:**
   - "Fetch again with session": sends the same link again with the captured cookies and headers.
   - "Fetch again (link only)": sends just the link, with no cookies or extra headers, like pasting it into a browser.

   Each result appears as a new entry in the panel. When a result contains valid subtitles, a "Use these subtitles" button loads them as that language's column for the current video and saves them.
4. **Web demo stays as it is:** it shows only the sample subtitles stored with the app. It never fetches live subtitles, and the new buttons and attempt settings appear only in the Android app. On Android, the app watches the subtitle request the YouTube player makes, then sends it again with changes: `lang` swapped for a different subtitle language, or `tlang` added to get a translation.

## Technical details

- **Android:**
  - Add a bridge method `fetchTimedTextExact(url, withSession)`. It sends exactly that one URL (no rebuilding, no internal mode loop) and returns JSON `{status, body, sentUrl, sessionHeaders: [names only]}`.
  - Link-only requests use a separate OkHttp client with no cookie jar and a plain mobile Chrome User-Agent.
  - Keep `fetchTranslatedCaptionsWithUrl` for older builds, but the web side calls the new method when it exists.
  - Log `SUBTITLE_FETCH ... mode= send=session|anon http=` for the e2e reports.
- **App code (runs inside the Android app; the web demo is untouched):**
  - Add a new `src/lib/subtitle-fetch-plan.ts` that builds the ordered list of attempts from saved preferences.
  - Add `src/hooks/useFavoriteSubtitleFetch.ts`, which holds the fetch loop moved out of `index.tsx`. It runs only when the Android bridge is present.
  - Pass the final status and body to the network tracker, plus `sendMode` and `requestMode`.
  - Responses are cached only after `isValidJsonSubtitleResponse`, which already exists.
  - The refetch buttons and attempt-order settings render only when the Android bridge exists. The web demo keeps loading local sample subtitles and never fetches live ones.
- **Preferences:** extend `playback-preferences.ts` with `fetchAttemptOrder` and `promoteSuccessfulAttempt`. The existing `SubtitleRequestMode` setting moves into the new order.
- **Network panel:** add the two buttons and the "Use these subtitles" action. The panel gets an `onRefetch(record, withSession)` callback and an `onUseSubtitles(lang, json)` callback.
- **Tests:**
  - Update `scripts/verify-subtitle-api-fallback.ts` for the new order, single request per attempt, and the remembered order.
  - Add a new `scripts/verify-network-refetch-buttons.ts`.
  - Update the Android e2e log assertions for the new `send=` field.
- **Docs:**
  - First step: create `docs/reliable-subtitles-fetching.md` and link it from `AGENTS.md`. Under the repository rule, docs live in `docs/`. It covers the ordered list of attempts, sending with the session versus link only, what counts as a good response, caching, the network panel's "fetch again" buttons, and how to diagnose a fetch that fails in the app but works in a browser.
  - Update `roadmap.md`, `docs/tasks.md`, `docs/todo.md`, `docs/done.md`, `docs/files.md`, and `docs/android.md`.

## Out of scope

- Changes to how subtitles are split into sections, or to playback.
