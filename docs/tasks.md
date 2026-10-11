# Tasks

## Task 53: Android E2E YouTube Share Intent Verification, Screencast Video Recording & GitHub Pages Presentation

- [x] **Subtask 53.1: Android E2E YouTube Link Share Testing (Browser & Official YouTube App)**:
  - Implement E2E tests validating that YouTube links shared from either:
    1. A web browser (via `ACTION_VIEW` with `youtube.com/watch?v=...`, `youtu.be/...`, or shorts).
    2. The official YouTube app (via `ACTION_SEND` with plain text or prefixed text like `"Check out this video on YouTube: ..."`).
  - Assert that `MainActivity.kt` and WebView bridge (`window.onNativeSharedLinkReceived`) cleanly switch to the shared video, reset state, and initiate caption discovery without crashing or reloading the entire webview session.
  - Add test coverage in `e2e/emulation.spec.ts` and `cypress/e2e/emulation.cy.ts`.
  - Create dedicated verification suite `scripts/verify-android-share-e2e.ts`, register `npm run test:android-share-e2e` in `package.json`, and update `docs/files.md`.

- [x] **Subtask 53.2: Emulator Screencast Video Recording, Artifact Staging & Report Presentation**:
  - Configure Android emulator workflow (`.github/workflows/emulation.yml`) and runner script (`scripts/run-android-e2e.sh`) to record a video screencast of the E2E test running on the emulator via `adb shell screenrecord`.
  - Pull and stage `android-emulator-video.mp4` as a workflow artifact and onto the `gh-pages` branch (`screenshots/android-emulator-video.mp4`), keeping the video ephemeral and ignored on the `main` branch as required by AGENTS.md.
  - Update `public/android-emulator-report.html` to embed and present the screencast video player (`<video controls autoplay muted loop>`) alongside the test steps, captured screenshots, Mochawesome report, Playwright report, and logcat telemetry.
  - Create dedicated verification suite `scripts/verify-emulator-screencast-report.ts`, register in `package.json`, and update `docs/files.md`.

## Task 54: Improve Android Device & Emulator E2E Testing Suite

- [x] **Subtask 54.1: Robust Device Environment, Lifecycle Management & Telemetry**:
  - Add explicit device serial selection (`adb -s <serial>`) to ensure stability across both physical hardware devices and emulators.
  - Implement screen wake, keyguard dismissal (`wm dismiss-keyguard`), device orientation locking, and battery/network health checks before test execution.
  - Collect rich hardware and system telemetry (Manufacturer, Model, Android Version, API Level, Display Resolution, Density, Architecture) and include it in the test summary and `public/android-emulator-report.html`.
  - Add dedicated verification suite `scripts/verify-android-device-e2e-suite.ts` and register `test:android-device-e2e` in `package.json`.

- [ ] **Subtask 54.2: Adaptive Device Interaction, Live Intent Assertions & Multi-Scenario Video Capture**:
  - Add adaptive coordinate scaling based on device display resolution for gestures and taps.
  - Implement real device live intent dispatch (`ACTION_VIEW` and `ACTION_SEND`) with verification of UI response in `scripts/android-e2e-assert.sh`.
  - Ensure video screencast recording and screenshot generation dynamically handle physical device screens and rotation gracefully.
  - Update `e2e/emulation.spec.ts` and Cypress emulation tests to reflect physical device and emulator parity.

## Task 55: Accordion Color Standardization, Auto-TTS Subtitle Fetching, Touch-Friendly Language Selection & Multi-Language Video Player

- [x] **Subtask 55.1: Constant Theme Colors per Accordion Type**:
  - Create `src/config/accordionThemes.ts` defining distinct constant color themes (borders, summary backgrounds, badges, and tags) for each accordion section (`player`, `playback`, `parser`, `languages`, `language-player`, `subtitles`, `library`).
  - Update `AccordionSection` to apply `data-accordion-type`, `data-accordion-color`, `data-testid="accordion-bar-{id}"`, and colored header bars.
  - Implement dedicated test `scripts/verify-accordion-colors.ts` and register `npm run test:accordion-colors`.

- [x] **Subtask 55.2: Automatic Speech Synthesis Announcement on Subtitle Fetch**:
  - Add persistent configuration `getAutoSpeakOnFetchSetting` and `setAutoSpeakOnFetchSetting` in `src/utils/appSettings.ts` (defaulting to enabled/`true`).
  - Trigger automatic pronunciation of language names via TTS (`speak`) upon live fetch completion, base64 caption interception, and language selection.
  - Add accessible toggle `data-testid="auto-speak-on-fetch-toggle"` in the Languages panel.
  - Implement dedicated test `scripts/verify-auto-speak-on-fetch.ts` and register `npm run test:auto-speak-on-fetch`.

- [x] **Subtask 55.3: Touch-Friendly Language Boxes & Keep Clicked Selections on Top**:
  - Create `src/components/LanguageBoxesSelector.tsx` featuring a mode toggle button (`#toggle-language-display-mode`) between boxes and list.
  - Provide large touch-friendly box elements (`min-h-[48px]`, `data-testid="language-box-{code}"`) suitable for Android.
  - Automatically partition and keep selected/clicked languages at the top of the grid and table (`orderedLangs`).
  - Maintain compatibility and synchronization with `#target-language-select` for all existing automation suites.
  - Implement dedicated test `scripts/verify-language-boxes-selection.ts` and register `npm run test:language-boxes`.

- [x] **Subtask 55.4: Dedicated Language Video Player Accordion with Iframe URL Subtitle Control & Network Inspector Integration**:
  - Register `"language-player"` accordion panel (`"Language video player"`) in `PANELS` and `panelOrder`.
  - Create `src/components/LanguageVideoPlayerPanel.tsx` rendering YouTube embed iframes with `https://www.youtube.com/embed/VIDEO_ID?hl=en&cc_load_policy=1&cc_lang_pref={lang}`.
  - Strictly maintain `hl=en` to keep menus in English, force captions via `cc_load_policy=1`, and control subtitle languages via `cc_lang_pref`.
  - Track subtitle requests in `networkTracker` (`/api/timedtext?...&fmt=json3`) and provide direct links to view them in the embedded Network Requests Inspector.
  - Implement dedicated test `scripts/verify-language-video-player-accordion.ts` and register `npm run test:language-player-accordion`.

## Task 56: Fix autoSpeakOnFetch ReferenceError Initialization Order

- [x] **Subtask 56.1: Initialize autoSpeakOnFetch Prior to Callback Bindings**:
  - Move `autoSpeakOnFetch` state initialization above `fetchFavoriteLanguageSubtitles` and other callbacks that reference it in `src/routes/index.tsx`.
  - Ensure zero temporal dead zone (TDZ) ReferenceError on component render.
  - Create dedicated test suite `scripts/verify-autospeak-initialization-order.ts` asserting top-level declaration order and runtime evaluation.
  - Register `npm run test:autospeak-init` in `package.json` and document in `docs/files.md`.

## Task 57: Remove Textual Color Names from Accordion Header Bars

- [x] **Subtask 57.1: Remove Color Names Text from Accordion Section Headers**:
  - Remove rendered textual color names (`theme.tagColor`) from `AccordionSection` header bars in `src/routes/index.tsx`.
  - Maintain constant visual color distinction per accordion type via left border styling (`theme.borderLeft`) and tinted summary background (`theme.summaryBg`).
  - Update `src/config/accordionThemes.ts` and `scripts/verify-accordion-colors.ts` to assert that textual color names are not rendered in the UI headers while preserving constant color bar styling.
  - Run dedicated tests, verify app compilation and linting, and perform dedicated git commit.

## Task 58: Auto-Enable "Speak" Checkbox on Favorites Language Panel Upon Subtitle Fetching

- [x] **Subtask 58.1: Auto-check "Speak" checkbox when favorite language subtitles are fetched and remove pronouncing language name**:
  - Remove pronouncing the language's name (e.g. `speak(meta.name)`) via TTS upon subtitle fetch in `src/routes/index.tsx` and related components.
  - When `autoSpeakOnFetch` is enabled and subtitles are fetched/loaded for language(s), automatically add those languages to `spoken` state (checking the checkbox under "Speak" in the Favorites Language panel).
  - Update `scripts/verify-auto-speak-on-fetch.ts` and related tests to validate that fetching subtitles automatically sets the "Speak" checkbox without pronouncing language names.
  - Run dedicated tests, verify app compilation (`compile_applet`) and linting (`lint_applet`), and perform dedicated git commit.




## Task 59: Compact panels, auto-fold, correct per-video captions, cache controls, favorites cleanup

- [ ] 59.1 Compact per-language settings (rate/voice) and fix voice selection.
- [ ] 59.2 Accordions auto-fold after a timeout unless pinned.
- [ ] 59.3 Subtitles always belong to the current video (no fixture/stale captions on Android or other videos).
- [ ] 59.4 Remove the iframe player option.
- [ ] 59.5 Library record: "Clear cache" and "Fetch from scratch" buttons.
- [ ] 59.6 Removing a favorite language removes all related instances (columns, speech, players, cached state).

## Task 60: Fix Android App Loading Failure & Restore Robust Android Shell Execution

- [x] **Subtask 60.1: Fix Kotlin Compilation Syntax Errors, Clean Query Suffix Handling & Restore Clean Android App Loading**:
  - Replace illegal `catch (_: Exception)` syntax with valid `catch (e: Exception)` / `catch (ignored: Exception)` across `MainActivity.kt` to fix Kotlin 1.9 compiler failure.
  - Fix `buildQuerySuffix` and intent handling to cleanly load local assets `index.html` without corrupt query combinations or unnecessary whole-page reloads on `onNewIntent`.
  - Fix `onNewIntent` to prevent unintended `webView.loadUrl` reloads when `evaluateJavascript` returns null.
  - Ensure proactive subtitle detection does not overwrite `lastObservedTimedTextUrl` with hardcoded Hebrew or inject mismatched captions on video load.
  - Create dedicated verification test `scripts/verify-android-app-loading.ts` and register `npm run test:android-loading` in `package.json`.
  - Verify app compilation, linting, run tests, and perform git commit.

## Task 61: Resolve Android App Runtime Failure After Commit Group 420d2bd-b92be574

- [x] **Subtask 61.1: Ensure Clean Asset Synchronization, Gradle Asset Build Integrity & Android Shell Runtime Stability**:
  - Synchronize bundled web assets in `android-shell/app/src/main/assets/` directly with current production build outputs (`dist/`), preventing missing hash chunk errors.
  - Fix `android-shell/app/build.gradle.kts` `prepareWebAssets` task to always refresh bundled assets instead of skipping when stale `index.html` exists.
  - Verify Android WebView asset interception in `MainActivity.kt` serves bundled JS/CSS chunks reliably with correct MIME types and headers.
  - Validate that all UI features added in commit group `420d2bd-b92be574` (compact accordion headers, pin toggles, TTS voice selections) initialize safely without browser/WebView runtime errors.
  - Create dedicated verification test `scripts/verify-android-app-run-parity.ts` and register `npm run test:android-run-parity` in `package.json`.
  - Verify app compilation, linting, run tests, and perform git commit.

## Task 62: Fix Android App "This page didn't load" Error & Enforce Emulator E2E Failure

- [x] **Subtask 62.1: Enforce Emulator E2E Failure on Android Error Pages ("This page didn't load")**:
  - Update Android emulator E2E assertion scripts (`scripts/android-e2e-assert.sh`, `scripts/run-android-e2e.sh`, `e2e/emulation.spec.ts`, `cypress/e2e/emulation.cy.ts`) to explicitly check for error texts such as "This page didn't load", "Something went wrong on our end", and "Try again".
  - Ensure the E2E test fails immediately if the webview or emulator screen shows this error screen or fails to load the real application root.
  - Create dedicated verification test `scripts/verify-emulator-error-detection.ts`, register in `package.json`, and update `docs/files.md`.
  - Verify tests, compilation, linting, and perform dedicated git commit.

- [x] **Subtask 62.2: Build and verify Android app launch and native subtitle flow**:
  - Diagnose the current Android build and local WebView asset configuration.
  - Fix build, asset synchronization, launch, WebView loading, or native bridge defects that prevent a usable Android app.
  - Add or update dedicated checks for Android APK build and the app's core launch/native subtitle behavior.
  - Verified the Android debug APK builds with fresh web assets; Android loading, asset parity, native caption bridge, YouTube share intents, and lint checks pass.
  - Local emulator E2E remains unverified: sdkmanager could not unpack the API 34 Google APIs x86_64 system image because the workspace disk quota was exceeded.
  - Committed the changes and attempted to push; GitHub rejected the workspace credentials, so the commits remain local.

## Task 64: Restore Android App Working State to Parity with Commit 25131f042373c80ea22b51740a4dd03a358691e0

- [x] **Subtask 64.1: Inspect commit 25131f042373c80ea22b51740a4dd03a358691e0, diagnose Android regressions, restore working Android runtime & asset loading, verify with dedicated test, and commit**:
  - Fetch and inspect git commit `25131f042373c80ea22b51740a4dd03a358691e0` from `mostuf25563/subtitle-sync` and `mostuf2556/Youtubenet6`.
  - Analyze diffs across `MainActivity.kt`, `AndroidManifest.xml`, WebView setup, asset loaders, React router/client entry, and subtitle fetching.
  - Fix any breaking changes, runtime errors, or asset discrepancies introduced after `25131f0` that broke the Android app.
  - Implement a dedicated verification test `scripts/verify-android-commit-25131f0-parity.ts` and register `npm run test:commit-25131f0-parity` in `package.json`.
  - Validate with `compile_applet`, `npm run lint`, execute test suites, commit changes, and attempt push.

## Task 65: Remove Language Video Player Accordion, Harmonize Accordion VideoIDs & Remove Android Subtitle Fixtures

- [x] **Subtask 65.1: Remove the Language Video Player Accordion Element**:
  - Remove `language-player` from `PANELS`, `PanelId`, and `ACCORDION_THEMES` in `src/config/accordionThemes.ts`.
  - Remove `language-player` from `openPanels`, `panelOrder`, and accordion section rendering in `src/routes/index.tsx`.
  - Remove `LanguageVideoPlayerPanel` import and accordion rendering in `src/routes/index.tsx`.
  - Update `scripts/verify-language-video-player-accordion.ts` to assert that the language video player accordion element is completely removed from accordion panels and the UI.
  - Run dedicated tests, verify app compilation (`compile_applet`), linting (`lint_applet`), and perform dedicated git commit.

- [x] **Subtask 65.2: Enforce Consistent VideoID Across All Accordion Elements & Remove Subtitle Fixtures from Android App**:
  - Ensure all accordion elements (`player`, `playback`, `parser`, `languages`, `subtitles`, `library`) strictly use and synchronize with the current active `videoId`.
  - Eliminate mismatched video ID fallbacks (such as hardcoded `L2Ryrr6txwA` / `DEMO_VIDEO` checks in `subtitles` panel or `fetchFavoriteLanguageSubtitles`).
  - Eliminate subtitle fixtures from the Android application:
    - In `MainActivity.kt`, remove asset fixture loading (`fixtures/$videoId/en.json`, `fixtures/L2Ryrr6txwA/en.json`) and synthetic fallback JSON generation (`generateTranslatedFallbackJson`). Keep clean network timedtext request execution matching `mostuf2556/Youtubenet6`.
    - In `src/routes/index.tsx`, ensure `fetchFavoriteLanguageSubtitles` on Android does not fall back to `JSON3_RAW_MAP` (fixtures).
    - Ensure subtitles belong strictly to the current active `videoId`.
  - Create dedicated verification test `scripts/verify-accordion-video-id-and-no-android-fixtures.ts`, register `npm run test:accordion-video-id-and-no-android-fixtures` in `package.json`, and document in `docs/files.md`.
  - Test thoroughly with dedicated tests, verify app compilation and linting, and perform dedicated git commit.

## Task 66: Document Subtitle Fetching Fallback Strategy, Anti-Bot Execution, JSON3 Validation, and Caching Mechanisms in AGENTS.md

- [x] **Subtask 66.1: Update AGENTS.md with Subtitle Fetch Fallback, Anti-Bot Strategy, JSON3 Validation, and Cache Rules**:
  - Incorporate the dual subtitle fetch fallback strategy (toggling between `tlang` parameter and replacing `lang` code while preserving base URL signatures) into `AGENTS.md`.
  - Document the anti-bot strategy for YouTube timedtext requests (WebView session interception, User-Agent sanitization stripping `; wv`, mirroring authentic headers, request pacing, and avoiding automated bot blocking) in `AGENTS.md`.
  - Document strict request validation standards (HTTP 200, valid JSON parse, YouTube `json3` schema with non-empty `events` containing `tStartMs`, `dDurationMs`, and `segs` with `utf8`, and non-zero cue count) in `AGENTS.md`.
  - Document the caching integrity mandate (never cache invalidated responses, error payloads, HTML pages, or zero-cue records) in `AGENTS.md`.
  - Create dedicated verification test `scripts/verify-agents-subtitles-spec.ts` and register `npm run test:agents-subtitles-spec` in `package.json`.
  - Verify app compilation, linting, run tests, and perform git commit.

## Task 67: Prevent HTML Parsing of Non-Validated Subtitle Requests and Enforce Strict Pre-Cache/Bridge Validation

- [x] **Subtask 67.1: Enforce Strict Pre-Validation Against HTML Parsing and Ensure Unvalidated Responses Are Never Cached**:
  - Update `src/lib/native-captions.ts` (`parseJson3`) and `src/utils/captionParser.ts` (`parseRawCaptionData`) to reject HTML error responses (`<!DOCTYPE html>`, `<html>`, `<body>`, `<head>`), preventing HTML parsing on non-validated requests.
  - Update `android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt` to guard file caching, XML-to-JSON3 conversion, cue counting, and WebView bridge dispatch so non-200 or invalid/HTML responses are never cached or treated as captions.
  - Update `src/routes/index.tsx` `onNativeCaptionsInterceptedBase64` and native bridge fetch to validate with `isValidJsonSubtitleResponse()` before parsing or updating track state.
  - Update `src/utils/subtitleCache.ts` to implement read-time cache eviction for corrupted/empty records and add validated `getCachedRawJson3()`.
  - Create dedicated verification test `scripts/verify-html-response-guard-and-caching.ts` and register `npm run test:html-guard-caching` in `package.json`.
  - Verify app compilation, linting, run tests, and perform git commit.

## Task 68: Enforce Strict JSON3-Only Response Validation Across Parsers, Network Handlers, and Caches

- [x] **Subtask 68.1: Reject All Non-JSON3 Subtitle Responses as Bad/Errored Responses and Prohibit Non-JSON3 Caching Across Application**:
  - Enforce that any response that is not authentic JSON3 (including XML `<transcript>`, HTML error pages, VTT, plain text, or empty events) is strictly treated as an errored / bad response.
  - Update `src/utils/captionParser.ts` (`parseRawCaptionData`, `identifyCaptionFormat`) to reject non-JSON3 responses as invalid/bad responses rather than accepting XML or fallback formats for YouTube timedtext.
  - Update `android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt` to eliminate XML-to-JSON3 acceptance and treat any non-JSON3 response as a failure (`!isValidJsonSubtitle`), never caching it or dispatching it as valid captions.
  - Update `src/routes/index.tsx` subtitle fetch and bridge handlers to treat any non-JSON3 response as a fetch error and trigger fallback mode (`tlang` <-> `lang`).
  - Update `src/utils/subtitleCache.ts` to strictly prohibit caching any non-JSON3 payload and evict any non-JSON3 entry.
  - Create dedicated verification test `scripts/verify-strict-json3-only-validation.ts` and register `npm run test:strict-json3-validation` in `package.json`.
  - Run all verification tests, compile applet, lint applet, commit changes, and attempt push.

## Task 69: Subtitles Table View Only Rendered on Legitimate JSON3 Subtitles Response Without Wasting Space on Loading or Error States

- [x] **Subtask 69.1: Hide Subtitles Table View During Loading/Error States and Render Only When Legitimate JSON3 Subtitles Are Fetched**:
  - Update `src/routes/index.tsx` so the subtitles table view (`panelId === "subtitles"`) does not waste space rendering loading placeholders ("Loading subtitles…", "Waiting for subtitles…") or error states.
  - Enforce `hasLegitimateSubtitles` so the subtitles table view accordion section is only rendered when legitimate JSON3 subtitles are fetched with non-empty cues (`rows.length > 0` and `cols.length > 0`).
  - Update `cols` calculation and individual cell rendering in `SubtitleRow` so no column or cell wastes space with loading or error placeholders.
  - Create dedicated verification test `scripts/verify-subtitles-table-legitimate-json3-only.ts` and register `npm run test:subtitles-table-legitimate-only` in `package.json`.
  - Document in `docs/files.md`, run verification tests, compile applet (`compile_applet`), lint applet (`lint_applet`), commit changes, and attempt push.

## Task 70: Code Standards & Modularity Enforcement: Decompose Overloaded Files into Modular Components & Hooks, and Codify Architecture Standards in AGENTS.md

- [x] **Subtask 70.1: Codify Code Architecture Standards in AGENTS.md and Create Architectural Verification Test**:
  - Expand `## Code architecture and modularity` in `AGENTS.md` with explicit, strict code standards:
    - Strict avoidance of monolithic/overloaded files (`index.tsx`, `index.ts`, etc.).
    - Component decomposition: extracting subcomponents (`SubtitleRow`, `HighlightedSubtitle`, `AccordionSection`, footer, dialogs, panels) into separate files in `src/components/`.
    - Dedicated custom hooks: isolating complex state management, speech synthesis/TTS, subtitle streaming, and synchronization logic into dedicated custom hooks in `src/hooks/` or `src/utils/`.
    - Single responsibility and file inventory synchronization in `docs/files.md`.
  - Create dedicated verification test `scripts/verify-code-modularity-standards.ts` and register `npm run test:code-modularity` in `package.json`.
  - Document in `docs/files.md`, run tests, verify app compilation (`compile_applet`), lint applet (`lint_applet`), commit changes, and attempt push.

- [x] **Subtask 70.2: Extract Embedded UI Components from src/routes/index.tsx into Dedicated Modular Component Files**:
  - Extract `AccordionSection` to `src/components/AccordionSection.tsx`.
  - Extract `SubtitleRow` and `HighlightedSubtitle` to `src/components/SubtitleRow.tsx` and `src/components/HighlightedSubtitle.tsx`.
  - Extract `ApkReleasesFooter` to `src/components/ApkReleasesFooter.tsx`.
  - Extract Subtitles Table panel rendering to `src/components/SubtitlesTablePanel.tsx`.
  - Update `src/routes/index.tsx` to import and use the modular components, significantly reducing file overload.
  - Document new modular component files in `docs/files.md`.
  - Test thoroughly with dedicated tests, compile applet, lint applet, commit changes, and attempt push.


