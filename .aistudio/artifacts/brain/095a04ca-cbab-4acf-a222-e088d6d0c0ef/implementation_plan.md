# Implementation Plan: Beginner Mode Subtitles Input & Language Identification

Implement subtitle detection and URL input with robust language identification in **Beginner Mode** across Web Demo and Android, adhering to the user's answers and architectural guidelines.

## User Decisions & Clarifications
- **Location**: On the first tab (`BeginnerVideoTab`) alongside the YouTube video URL input, users can supply a subtitles URL.
- **Language Identification**: Derive subtitle language using `tlang` query parameter first; fall back to `lang` query parameter if `tlang` is not specified.
- **Fetching & Caching**: Immediately auto-fetch the subtitles upon URL submission, validate with `isValidJsonSubtitleResponse`, parse into JSON3 format, and cache in device storage (`saveCachedRawJson3`).
- **Base Track Selection**: Automatically select the detected or intercepted track as the active base subtitle track if none is currently selected.

---

## Proposed Changes

### 1. Beginner Video Tab UI (`src/components/beginner/tabs/BeginnerVideoTab.tsx`)
- Add a dedicated, clean subtitles URL input bar right beneath the video URL form on Tab 1 ("Video & Subtitles").
- Include an input field for pasting a timedtext or subtitles URL (e.g. `https://www.youtube.com/api/timedtext?...&tlang=he` or `...&lang=en`).
- Include "Paste" and "Load Subtitles" action buttons, plus real-time visual indicator showing detected language (`tlang` or `lang`), status badges (Cached, Cues count), and error/success messaging.
- Expose clear callback `onSubmitSubtitlesUrl: (url: string) => Promise<void> | void`.

### 2. Beginner Flow State & Base Track Auto-Selection (`src/components/beginner/BeginnerFlowContainer.tsx`)
- Connect `onSubmitSubtitlesUrl` prop from `BeginnerVideoTab` to the parent container and handler.
- Update base track auto-selection: whenever observed tracks update or a new track is detected/intercepted, if `!selectedBaseLang` and at least one track exists, automatically select that track as the base language.
- Ensure smooth transition and tab unlock when subtitles are loaded.

### 3. Subtitles URL Fetcher & Language Identifier Utility (`src/utils/subtitleUrlDetector.ts`)
- Extract language identification utility: `identifySubtitleLanguage(url: string): { lang: string; source: 'tlang' | 'lang' } | null`.
  - Parses query string safely using `URL` or regex fallback for relative / partial URLs.
  - Checks `tlang` first (translation language).
  - Falls back to `lang` (uploaded caption track language).
- Subtitle fetcher with CORS / web demo resilience:
  - Fetches the provided URL.
  - For the web demo environment, if direct fetch encounters CORS or network error on live timedtext URLs, provides graceful fallback to authentic bundled fixtures matching the identified language (`public/fixtures/L2Ryrr6txwA/${lang}.json` or `JSON3_RAW_MAP[lang]`).
  - Validates response with `isValidJsonSubtitleResponse`.
  - Caches valid payload with `saveCachedRawJson3(videoId, lang, payload)`.

### 4. Integration with Android Interception & Main App (`src/routes/index.tsx`)
- Wire `onSubmitSubtitlesUrl` in `src/routes/index.tsx` within `<BeginnerFlowContainer />`.
- Ensure Android native timedtext interception (`timedtext_interception` event) continues prioritizing `tlang` over `lang`, updates `tracks`, and notifies beginner flow for automatic base track selection.

### 5. Automated Verification & Testing
- Create dedicated unit and integration tests (`tests/beginner-subtitles-input.test.ts`):
  - Verify language identification logic: prioritizing `tlang` over `lang`.
  - Verify fallback to `lang` when `tlang` is absent.
  - Verify rejection of malformed URLs or invalid payloads.
  - Verify immediate auto-fetch and pre-cache validation gate.
  - Verify base track auto-selection in beginner mode when none is selected.
- Update tracking files (`docs/tokens.md`, `docs/tasks.md`, `current-sub-task.md`, `docs/todo.md`, and `docs/done.md`).
- Run `npm run test:tokens-economy`, `compile_applet`, and `lint_applet` to ensure zero regressions.

---

## Verification Plan

### Automated Tests
1. `npm test tests/beginner-subtitles-input.test.ts`
2. `npm run test:tokens-economy`
3. `npm run build` (`compile_applet`)
4. `npm run lint` (`lint_applet`)

### Manual Verification in Web Demo
1. Open Beginner Mode Tab 1.
2. Enter YouTube URL or use default video.
3. Paste a subtitles URL containing `tlang=he` (or `lang=en`).
4. Click "Load Subtitles" (or press Enter).
5. Verify language is detected as Hebrew (`he`) via `tlang` and auto-selected as the base language track.
6. Verify subtitles are parsed, cached, and unlock the next beginner tabs.
