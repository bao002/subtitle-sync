# Tasks

## Task 32: Fix YouTube link sharing to Android app

- [x] **Subtask 32.1: Fix Android intent handling & WebView URL query propagation for shared YouTube links**: Diagnose and fix why sharing a YouTube URL/intent to Android keeps showing the default video. Ensure MainActivity intent filters, extras (`Intent.EXTRA_TEXT`), query parameter extraction (`v=` or `youtu.be/` video ID), and WebView local asset URL generation (`index.html?v=...`) reliably update React app state and switch to the shared video. Add dedicated verification test.

## Task 31: Update AGENTS.md — after git commit, try using git push

- [x] **Subtask 31.1: Update AGENTS.md with git push instruction and verify git push attempt handling**: Update AGENTS.md under Work tracking to specify that after performing a git commit, attempt `git push` (handling failure gracefully if no remote or credentials configured). Add dedicated test to verify this rule and workflow integrity.

## Task 30: Validate default video subtitles for Android and the Demo Web App in E2E testing

- [x] **Subtask 30.1: Implement Default Video Subtitles E2E Verification for Android and Demo Web App**:
  - Implement comprehensive E2E validation script `scripts/verify-default-video-subtitles-e2e.ts` verifying:
    1. Demo Web App default video (`L2Ryrr6txwA`) JSON3 subtitles across all supported languages (`en`, `he`, `it`, `es`, `ar`, `ru`), checking event validity, millisecond timing monotonicity, non-empty cue text, alignment across favorite languages (`he`, `it`, `en`), and UI rendering readiness.
    2. Android default video configuration (`DEFAULT_VIDEO_ID` / `DEFAULT_VIDEO_URL`), checking native timedtext URL interception, `tlang` target language translation derivation, and logcat assertion patterns.
  - Update `scripts/android-e2e-assert.sh` and `scripts/run-android-e2e.sh` to explicitly verify and report that default video subtitles are OK for both Android and the demo web app.
  - Register `npm run test:default-subtitles-e2e` in `package.json`, update `docs/files.md`, rebuild Android bundle assets, commit changes and tests, and run verification.

## Task 29: Streamline subtitle timing to default base language & ensure GitHub Pages screenshot availability

- [x] **Subtask 29.1: Remove "Timing from" selector and lock subtitle alignment timing to the default base language**: Remove the manual "Timing from" `<select>` from the grouping/parser UI in `src/routes/index.tsx`. Automatically derive timing base language (`baseLanguage`) from the default subtitle track (on Android from intercepted primary timedtext `lang`, and on Web demo from the primary track `"he"` / first track in `tracks`). Add dedicated test `scripts/verify-default-timing-base.ts`.
- [x] **Subtask 29.2: Bundle authentic emulator screenshot into static assets, document GitHub Pages activation, and extend response body size to 200 characters**: Bundle authentic emulator screenshot into `public/screenshots/android-emulator-screenshot.png` and `public/assets/android-emulator-screenshot.png`. Extend response body preview limit to 200 characters in `networkTracker.ts`, `NetworkRequestsInspector.tsx`, and `verify-network-inspector.ts`. Document GitHub Pages activation instructions in `README.md` and `docs/operations/ACTIONS.md`. Update `verify-readme-links.ts`, rebuild Android assets, and verify all test suites.

## Task 28: Fix README broken links and GitHub Actions workflow resilience

- [x] **Subtask 28.1: Import architectural specification and design contracts from `mostuf2556/Youtubenet6` and fix Markdown link checker**: Import the 9 missing architectural specification and design contract documents into `docs/operations/`, `docs/specifications/`, and `docs/designs/` matching `mostuf2556/Youtubenet6`. Fix the markdown link regex parser in `scripts/verify-md-links.ts` so inline code spans in link text are properly validated. Update `docs/files.md` inventory. Verify with `npm run test:md` ensuring 0 broken relative links.
- [x] **Subtask 28.2: Ensure GitHub Actions workflow resilience and add dedicated README links verification suite**: Add `npm run test:md` and `npm run test:readme-links` to `.github/workflows/integrity.yml` to prevent link rot in CI. Create dedicated test `scripts/verify-readme-links.ts` validating all links, badges, and documentation cross-references in `README.md`. Document GitHub Pages configuration in `ACTIONS.md` and `README.md`. Rebuild android bundle assets, execute all test suites, compile, and lint.

## Task 27: Fix GitHub Actions workflows and E2E test alignment with Youtubenet6

- [x] **Subtask 27.1: Align `.github/workflows/` with `mostuf2556/Youtubenet6` and resolve workflow step failures**: Remove redundant `.github/workflows/ci.yml`, fix deployed URL check and remove missing `prepare-report.mjs` step failure in `web.yml`, add `continue-on-error: true` to `emulation.yml` matching Youtubenet6, and ensure `deploy-demo.yml` preserves emulator screenshots on `gh-pages` via `keep_files: true`.
- [x] **Subtask 27.2: Ensure web demo Languages panel displays all 6 demo languages and verify all test suites**: In `src/routes/index.tsx`, ensure on web (`!isAndroid`) the Languages table lists all 6 demo languages so `e2e/web.spec.ts` (`toHaveCount(6)`) passes reliably. Rebuild android assets, verify all test suites, compile, and lint.

## Task 26: Extend network request response body preview limit to 50 characters

- [x] **Subtask 26.1: Update response body preview length to 50 characters across tracker, inspector UI, and verification suite**: Update `MAX_RESPONSE_BODY_PREVIEW_CHARS` in `src/utils/networkTracker.ts` to 50, update inspector labels in `NetworkRequestsInspector.tsx`, update test assertions in `scripts/verify-network-inspector.ts`, rebuild android assets, and run tests.

## Task 25: Dynamic favorite language subtitle fetching and network requests inspector with response body preview

- [x] **Subtask 25.1: Proactively fetch subtitles for newly added favorite languages via `tlang`**: In `src/routes/index.tsx`, detect when a new language is added to favorite languages. If an observed timedtext URL is available, automatically request translated subtitles for the newly added language via `buildTranslatedCaptionUrl(observedUrl, langCode, 'json3')` through the native shell / network bridge and merge into `tracks` state.
- [x] **Subtask 25.2: Network requests panel with initial response body preview**: Provide a dedicated Network Requests log/panel (matching repo2 conventions) tracking all timedtext and caption requests. For each logged request, preserve and display the response body preview. Add dedicated automated test coverage.

## Task 24: Align Android subtitle fetching flow with Youtubenet6 (default caption fetch followed by ordered favorite languages)

- [x] **Subtask 24.1: Implement proactive default subtitle fetch and ordered favorite language translations on Android**: When loading a video on Android, proactively initiate the default caption fetch via timedtext discovery / endpoint loading. Once default captions are received, immediately fetch target translations strictly for configured favorite languages in explicit priority order (`he` followed by `it`), logging `SUBTITLE_FETCH` telemetry and updating tracks.

## Task 23: Enforce 100% local, offline web-app architecture in Android shell

- [x] **Subtask 23.1: Permanently eliminate all remote web-app URLs and fallbacks from `MainActivity.kt` and guarantee local asset execution**: Purge `APP_URL` and remote `github.io` fallback logic from `MainActivity.kt`. Unconditionally load local bundled assets from `appassets.androidplatform.net`. In `shouldOverrideUrlLoading`, restrict WebView internal navigation to local app assets and embedded YouTube players. Add a local offline fallback message if assets are missing. Implement dedicated test `scripts/verify-android-local-assets.ts` and verify.

## Task 22: Publish Android emulator screenshots to GitHub Pages

- [x] **Subtask 22.1: Configure GitHub Actions workflow to publish Android emulator screenshot artifact to GitHub Pages**: Update `.github/workflows/emulation.yml` so that upon a successful Android emulator run on the default branch or workflow dispatch, the captured screenshot (`android-emulator-screenshot.png`) is published to the `gh-pages` branch under `screenshots/android-emulator-screenshot.png` without introducing synthetic files into the git source repository. Create a dedicated verification test `scripts/verify-emulation-gh-pages.ts` and verify.

## Task 21: Android dynamic subtitle fetching and 10-line presentation for favorite languages

- [x] **Subtask 21.1: Dynamically load and present first 10 lines of subtitles for each favorite language on Android**: Ensure that in Android mode, intercepted caption base requests dynamically fetch subtitle tracks via `fetchTranslatedCaptionsWithUrl` with `tlang` for every selected favorite language, and present the first 10 lines of subtitles synchronously across each favorite language column with controls to display additional lines. Keep web demo fixtures cleanly scoped. Add dedicated verification tests, commit before execution, test, and verify.

## Task 20: Remove synthetic report generators, fake artifact scripts, and generated HTML files

- [x] **Subtask 20.1: Remove synthetic report generators, fake artifact scripts, and generated HTML files**: Delete `scripts/generate-android-report.mjs`, `scripts/prepare-report.mjs`, `scripts/verify-reports-integrity.mjs`, `android-emulator-report.html`, `cypress/runner-template.html`, and `cypress/reports/`. Clean up `package.json` scripts, update `.github/workflows/deploy-demo.yml` to deploy real `dist/`, update `docs/files.md`, and verify all authentic tests and builds pass.

## Task 19: Remove server dependencies and convert to pure client SPA

- [x] **Subtask 19.1: Remove server dependencies and convert to pure client SPA**: Remove `@tanstack/react-start`, `nitro`, `src/server.ts`, and `src/start.ts`, convert to pure client SPA with Vite (`index.html`), update build and preview scripts, update inventory in `docs/files.md`, add a dedicated test for pure client SPA architecture, commit before execution, test, and verify.

## Task 17: Restore default language subtitle fetching and favorite languages `tlang` replacement on Android

- [x] **Subtask 17.1: Restore default language subtitle fetching and favorite languages `tlang` replacement on Android**: When observing the network request for default subtitles, ensure the default language track is preserved/fetched without an invalid `tlang`, and replace `tlang` with each favorite language's code to fetch all favorite languages as implemented in `mostuf2556/Youtubenet6`. Add dedicated tests, commit before execution, test, and verify.

## Task 18: Fix SSR-Client hydration mismatch in `targetLanguages`

- [x] **Subtask 18.1: Synchronize SSR and Client initial render for `targetLanguages` and dynamic client-only state**: Ensure initial server rendering and client hydration pass share the deterministic default state without accessing client-only localStorage before mount, deferring localStorage synchronization to post-hydration. Add dedicated regression test, commit before execution, test, and verify.

## Task 16: Align favorite languages, TTS settings, video reset, multi-track audio mode, and auto-scroll default with mostuf2556/Youtubenet6

- [x] **Subtask 16.1: Favorite languages and main screen controls**: Expose favorite/desired languages selector on web demo (fixture tracks) and Android (catalog with `tlang` fetching). On the main screen, present only favorite languages for show/hide, speech toggles, ordering, and per-language TTS speech rate and voice selection.
- [x] **Subtask 16.2: Clear columns on new video on Android**: When loading a video other than the default video on Android, clear existing subtitle tracks and columns before fetching fresh subtitles for all favorite languages.
- [x] **Subtask 16.3: YouTube multi-audio track repeat mode**: Add an option to switch to "Audio-track mode" (repeating video segments with the native audio track for supported languages instead of synthesized TTS). Default this option to OFF.
- [x] **Subtask 16.4: Disable auto-focus and scroll by default**: Change "Auto-focus and scroll to current subtitle" (`autoScroll`) to default to `false` (off).
- [x] **Subtask 16.5: E2E testing & verification**: Update and verify test suites (`e2e/web.spec.ts`, `e2e/app.spec.ts`, `e2e/emulation.spec.ts`), commit before testing, and run `npm run build`, `npm run lint`, and integrity tests.

---

## Pending Later Tasks

The following tasks were requested as "later" tasks and are stored here to be processed upon user request after all active tasks are complete:

- [ ] **Later Task 1: Parser Option Difference Confirmation & Preview**: Add confirmation option to show the difference based on the new parser settings (show the actual effect by highlighting differences while allowing to press next to view the next record that changed based on those settings).
- [ ] **Later Task 2: Client-Side Video Metadata Extraction**: If possible client-side only, get video description, title, default subtitles, and all other free info without backend requirements.
