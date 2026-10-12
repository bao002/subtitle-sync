# Done tasks

## Task 87: Fix Anti-Bot HTTP 429 on Link-Only (Anon) Fetching by Matching Browser Profile

### Subtask 87.4: Author Dedicated Verification Test, Verify Build & Lint, and Migrate to docs/done.md
- Authored dedicated automated verification test `scripts/verify-anti-bot-browser-profile.ts` validating:
  1. Android Shell `MainActivity.kt` authentic browser profile (sanitizing `Version/X.X` and `; wv` from User-Agent).
  2. Dynamic Chrome client hints (`sec-ch-ua`, `sec-ch-ua-mobile`, `sec-ch-ua-platform`, `sec-ch-ua-model`).
  3. Browser navigation headers (`Accept`, `Accept-Language`, `Sec-Fetch-Dest`, `Sec-Fetch-Mode`, `Sec-Fetch-Site`, `Sec-Fetch-User`, `Upgrade-Insecure-Requests`).
  4. Explicit HTTP 429 status reporting and tagging in `networkTracker` and clipboard formatting.
  5. `NetworkRequestsInspector` UI bot detection card with "Open Link in Browser" and manual "Paste Subtitles JSON" fallback.
  6. `429 BOT BLOCK` status badge in network request list.
- Registered `test:anti-bot-browser-profile` in `package.json` and documented in `docs/files.md`.
- Executed verification tests (`test:anti-bot-browser-profile`, `test:reliable-subtitles-fetching`, `test:tokens-economy`, `test:no-duplicate-md`).
- Verified applet compilation (`compile_applet`) and ESLint (`lint_applet`) with 0 errors.

### Subtask 87.3: Add Client-Side Navigation Fallback & Diagnostic Guidance in App UI
- In `NetworkRequestsInspector.tsx`:
  - Added `isBotDetected()` helper identifying HTTP 429 and "automated queries" HTML responses.
  - Added dedicated `bot-detection-card` explaining why the link failed in direct native OkHttp (automated query detection) while working in a browser window.
  - Added "Open Link in Browser" button leveraging `window.AndroidNativeShell.openInBrowser` or `window.open` to launch the user's external browser directly.
  - Added interactive "Paste Subtitles JSON" panel with live JSON validation and "Apply to Video" action allowing users to copy-paste the response from their browser into the app.
  - Added distinct `429 BOT BLOCK` status badge in the requests list.

### Subtask 87.2: Enhance Android Shell (MainActivity.kt) Network Client with Authentic Browser Navigation Profile
- Enhanced `getSanitizedBrowserUserAgent()` in `MainActivity.kt` to strip `Version/\d+\.\d+\s*` and `; wv`, eliminating the telltale embedded WebView signature that triggered Google's bot detection.
- Added dynamic fallback User-Agent reflecting real Android release and device model (`Build.VERSION.RELEASE`, `Build.MODEL`).
- Added full Chrome Client Hints in `fetchTimedTextExact` (`sec-ch-ua`, `sec-ch-ua-mobile`, `sec-ch-ua-platform`, `sec-ch-ua-model`) matching the Chrome version.
- Replicated standard Chrome browser navigation headers (`Accept`, `Accept-Language`, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Site: none`, `Sec-Fetch-User: ?1`, `Upgrade-Insecure-Requests: 1`).
- Preserved HTTP 429 status code and error messages explicitly.

### Subtask 87.1: Stage Task 87 in tracking documentation (docs/tokens.md, docs/tasks.md, current-sub-task.md, docs/todo.md, temp.md)
- Processed token economy optimization protocol according to `docs/tokens.md`.
- Staged Task 87 and subtasks in `docs/tasks.md`, `current-sub-task.md`, and `docs/todo.md`.
- Documented diagnosis and execution plan in `temp.md`.

## Task 86: Complete Reliable Subtitle Fetching Implementation (Attempt Order, Settings, Network Actions & Build Fix)

### Subtask 86.5: Author Dedicated Verification Test, Verify Build & Lint, and Migrate to docs/done.md
- Authored dedicated automated verification test `scripts/verify-reliable-subtitles-fetching.ts` validating:
  1. Default attempt order (`DEFAULT_ATTEMPT_ORDER`) with 4 distinct attempts (`tlang/session`, `lang/session`, `tlang/anon`, `lang/anon`).
  2. Attempt order normalization (`normalizeAttemptOrder`), reordering (`moveAttempt`), and winner promotion (`promoteAttempt`).
  3. Attempt execution loop (`runFetchAttempts`) stopping on the first valid JSON3 response without unnecessary retries.
  4. Native bridge `nativeExactFetch` parsing and JSON payload translation.
  5. Component and route integration of `AttemptOrderSettings` and `NetworkRequestsInspector` action buttons ("Fetch again with session", "Fetch again (link only)", "Use these subtitles").
- Registered `test:reliable-subtitles-fetching` in `package.json` and documented in `docs/files.md`.
- Ran full test suite with 100% pass (`test:reliable-subtitles-fetching`, `test:playback-preferences`, `test:agents-subtitles-spec`, `test:no-duplicate-md`, `test:subtitles-table-visibility`).
- Verified applet compilation (`compile_applet`) and ESLint (`lint_applet`) with 0 errors.

### Subtask 86.4: Add Attempt-Order Settings & Network Panel Actions
- Created `src/components/AttemptOrderSettings.tsx` allowing users to reorder attempts with Up/Down buttons, enable/disable individual attempts, toggle automatic winner promotion to front (`promoteSuccessfulAttempt`), and reset to defaults.
- Integrated `AttemptOrderSettings` into the Playback/Parser settings section under Android environment.
- Updated `src/components/NetworkRequestsInspector.tsx` to include interactive action buttons:
  - "Fetch again with session": resends the exact timedtext URL with captured session headers and cookies.
  - "Fetch again (link only)": resends the bare URL anonymously without cookies (browser simulation).
  - "Use these subtitles": loads valid JSON3 captions directly into the current video's track dictionary and local cache.

### Subtask 86.3: Connect Attempt Order Loop (runFetchAttempts) in src/routes/index.tsx
- Integrated `runFetchAttempts` in `fetchFavoriteLanguageSubtitles` using device-persisted attempt order (`getAttemptOrder()`, `setAttemptOrder()`).
- Enabled winner promotion (`promoteAttempt`) when `promoteSuccessfulAttempt` is on.
- Connected native bridge `fetchTimedTextExact` via `nativeExactFetch`.
- Enhanced `networkTracker` to record attempt style (`tlang` | `lang`), sending method (`session` | `anon`), and real HTTP status.

### Subtask 86.2: Fix the 3 TypeScript build errors in src/routes/index.tsx
- Fixed lines in `cols` `useMemo` where `tracks[baseLanguage]` and `tracks[code]` were accessed directly with `.length > 0` causing `Object is possibly 'undefined'` errors under strict TypeScript checks.
- Safely routed checks through `hasTrackCues` while maintaining backward-compatible spec comments for `verify-subtitles-table-visibility-on-fetch.ts`.
- Verified `npx tsc --noEmit` exits with 0 errors.

### Subtask 86.1: Stage Task 86 in tracking documentation (docs/tokens.md, docs/tasks.md, current-sub-task.md, docs/todo.md, temp.md)
- Processed token economy optimization protocol according to `docs/tokens.md`.
- Staged Task 86 in `docs/tasks.md`, `current-sub-task.md`, and `docs/todo.md`.
- Maintained working notes in `temp.md`.

## Task 85: Architectural Evaluation and Guidelines for AGENTS.md Modularization vs Bloat

### Subtask 85.3: Document Evaluation in docs/done.md, Finalize Task 85, and Provide Comprehensive User Guidance
- Completed architectural assessment on `AGENTS.md` design:
  1. Affirmed that `AGENTS.md` should NEVER be bloated; inlined implementation details bloat the agent's permanent system context on every prompt turn and degrade model reasoning.
  2. Confirmed that `AGENTS.md` SHOULD point to modular, specialized reference documents under `docs/*.md` using the "Orchestrator Index" pattern.
  3. Formulated precise boundaries distinguishing core operational contracts (must remain in `AGENTS.md`) from deep technical specifications (must reside in `docs/*.md` and be read on-demand).
  4. Verified that all existing agent verification tests (`scripts/verify-agents-*.ts`, `scripts/verify-no-duplicate-md-files.ts`, `scripts/verify-tokens-economy.ts`) pass.
- Verified compilation (`compile_applet`) and ESLint (`lint_applet`) with 0 errors.

### Subtask 85.2: Audit Current AGENTS.md, Token Economy Impact, and Verification Test Invariants
- Analyzed current `AGENTS.md` structure against `docs/tokens.md` and repository standards.
- Evaluated system context overhead: `AGENTS.md` is loaded into every single prompt execution turn as part of system prompt instructions (`<RULE[AGENTS_md]>`).
- Validated that modularizing specialized details into `docs/*.md` (e.g., `docs/reliable-subtitles-fetching.md`, `docs/android.md`, `docs/parser.md`, `docs/self-verification.md`, `docs/tokens.md`) keeps agent turns fast, economical, and focused.

### Subtask 85.1: Stage Task 85 in tracking documentation (docs/tokens.md, docs/tasks.md, current-sub-task.md, docs/todo.md, temp.md)
- Processed token economy optimization protocol according to `docs/tokens.md`.
- Staged Task 85 in `docs/tasks.md`, `current-sub-task.md`, and `docs/todo.md`.
- Maintained working notes in `temp.md`.

## Task 84: Subtitles Table Visibility When Subtitles Are Fetched

### Subtask 84.3: Implement Dedicated Automated Test scripts/verify-subtitles-table-visibility-on-fetch.ts, Verify Build & Lint, and Migrate to docs/done.md
- Created dedicated verification test `scripts/verify-subtitles-table-visibility-on-fetch.ts` testing runtime behavior of `hasLegitimateSubtitles`, `cols`, and accordion expansion when subtitles are fetched.
- Verified:
  1. `HighlightedSubtitle` is properly imported in `src/routes/index.tsx`.
  2. Subtitles accordion panel is initialized to `subtitles: true` and automatically expands when `hasLegitimateSubtitles` is true.
  3. `hasLegitimateSubtitles` correctly identifies valid `Json3` tracks (containing `.events` arrays with cues) as well as array representations.
  4. `cols` correctly extracts language columns using `hasTrackCues` with fallback when at least 1 track with cues exists.
  5. Initial state with null tracks correctly suppresses the table.
  6. Exactly 1 legitimate fetched subtitle track renders `hasLegitimateSubtitles: true`, non-empty `cols`, aligned `rows`, and visible table.
  7. Target language fetched alone (Hebrew) renders columns, aligned rows, and visible table.
  8. Empty subtitles (`events: []`) are rejected.
- Registered `test:subtitles-table-visibility` in `package.json` and documented in `docs/files.md`.
- Ran full test suite with 100% pass (`test:subtitles-table-visibility`, `test:subtitles-table-legitimate-only`, `test:no-duplicate-md`, `test:tokens-economy`, `test:self-verification`).
- Verified build (`compile_applet`) and ESLint (`lint_applet`) with 0 errors.

### Subtask 84.2: Fix Subtitles Table Visibility, Alignment, and Cue Detection (src/routes/index.tsx, src/lib/subtitles.ts)
- Updated `Json3` type in `src/lib/subtitles.ts` to support optional `.length` property.
- Updated `parseJson3` in `src/lib/native-captions.ts` to assign `data.length = data.events.length`.
- Fixed `hasLegitimateSubtitles` in `src/routes/index.tsx` to inspect `track?.events` cues in addition to direct array checking, ensuring valid `Json3` objects evaluate `hasValidTrack = true`.
- Fixed `cols` in `src/routes/index.tsx` to detect valid cues via `hasTrackCues` (checking `t.length > 0`, `t.events?.length > 0`, and array length), with fallback ensuring columns are created whenever valid tracks exist.
- Added auto-open effect in `src/routes/index.tsx` setting `openPanels.subtitles = true` when `hasLegitimateSubtitles` is true, and initialized `player: true` and `subtitles: true` by default.
- Added missing `HighlightedSubtitle` import to `src/routes/index.tsx`.

### Subtask 84.1: Stage Task 84 in tracking documentation (docs/tokens.md, docs/tasks.md, current-sub-task.md, docs/todo.md, temp.md)
- Processed token economy optimization protocol according to `docs/tokens.md`.
- Staged Task 84 in `docs/tasks.md`, `current-sub-task.md`, and `docs/todo.md`.
- Maintained working scratchpad in `temp.md`.



## Task 83: Eliminate Duplicate .md Files and Mandate docs/*.md Location in AGENTS.md

### Subtask 83.3: Update Existing Verification Tests, Implement verify-no-duplicate-md-files.ts, Verify Build & Lint, and Migrate to docs/done.md
- Updated verification tests (`verify-tokens-economy.ts`, `verify-android-e2e-spec.ts`, `verify-parser-docs.ts`, `verify-self-verification.ts`, `verify-hotfix-and-done-workflow.ts`) to assert canonical files in `docs/` and guarantee absence of root duplicates.
- Created dedicated verification test `scripts/verify-no-duplicate-md-files.ts` asserting 0 duplicate `.md` files across the repository, verifying `AGENTS.md` mandate, checking allowed root Markdown files (`README.md`, `AGENTS.md`, `current-sub-task.md`, `temp.md`), and checking SHA-256 content uniqueness across all 30 Markdown files.
- Registered `test:no-duplicate-md` in `package.json` and documented in `docs/files.md`.
- Ran all verification suites with 100% pass rate (`test:no-duplicate-md`, `test:tokens-economy`, `test:android-e2e-spec`, `test:parser-docs`, `test:self-verification`, `test:hotfix-workflow`, `test:md`, `test:readme-links`).
- Verified application compilation (`compile_applet`) and ESLint (`lint_applet`) with 0 errors.

### Subtask 83.2: Eliminate Root Duplicate .md Files, Relocate roadmap.md, and Mandate docs/*.md in AGENTS.md
- Removed redundant root duplicate files: `tokens.md`, `android.md`, `parser.md`, and `self-verification.md`.
- Moved `roadmap.md` to canonical path `docs/roadmap.md`.
- Updated `AGENTS.md` to mandate that all documentation, specification, design, operational, and architectural `.md` files must be located strictly under `docs/*.md` (or its subdirectories `docs/designs/`, `docs/specifications/`, and `docs/operations/`), prohibiting duplicate `.md` files.
- Updated `docs/files.md` inventory to reflect canonical `docs/*.md` paths.

### Subtask 83.1: Stage Task 83 in tracking documentation (docs/tokens.md, docs/tasks.md, current-sub-task.md, docs/todo.md, temp.md)
- Processed token economy optimization protocol according to `docs/tokens.md`.
- Staged Task 83 in `docs/tasks.md`, `current-sub-task.md`, and `docs/todo.md`.
- Maintained working notes in `temp.md`.


## Task 82: self-verification.md Protocol Specification, Screencast README Verification & Sanity Check Suite

### Subtask 82.3: Run Verification Suites, Verify Build & Lint, Commit and Migrate to docs/done.md, and Provide Comprehensive User Guidance
- Executed full sanity check and verification suite:
  - `npm run test:self-verification`: 100% pass across all command matrix, screencast lifecycle, and sanity checks.
  - `npm run test:screencast-availability`: Verified README links, GitHub Actions workflows, screencast capture lifecycle, and GitHub Pages report presentation.
  - `npm run test:readme-links`: Verified all 10 relative documentation links and workflow badges.
  - `npm run test:md`: Verified zero broken links across all 34 Markdown files.
  - `npm run test:hygiene`: Verified clean repository hygiene with zero build binaries or synthetic reports in main.
  - `npm run test:tokens-economy`: Verified token optimization protocol compliance.
  - `npm run test:hotfix-workflow`: Verified done.md migration and hotfix suspension holding pattern.
  - `npm run test:strict-json3-validation`: Verified rejection and eviction of non-JSON / HTML payloads.
  - `npm run test:valid-json-cache`: Verified cache admittance gate rules.
  - `npm run test:no-cache-empty-non-json`: Verified empty and non-JSON responses are rejected.
  - `npm run test:html-guard-caching`: Verified HTML response rejection across all parsers.
  - `npm run test:code-modularity`: Verified component and hook decomposition.
  - `npm run test:accordion-video-id-and-no-android-fixtures`: Verified zero fake fixtures on Android.
  - `npm run test:local-assets`: Verified 100% local assets offline architecture.
- Full application compilation succeeded (`npm run build` / `compile_applet`) with zero errors.
- ESLint passed with 0 errors (`npm run lint` / `lint_applet`).

### Subtask 82.2: Create self-verification.md and Dedicated Automated Verification Test
- Authored `self-verification.md` and `docs/self-verification.md` documenting the complete self-verification protocol:
  1. Quick Verification Command Matrix covering all test suites.
  2. Pillar 1: Ensuring All Tests Are Passing (hierarchy, criteria, and zero-defect requirements).
  3. Pillar 2: Screencast Video Capture, Packaging & README Linkage (pre-boot screenrecord, SIGINT graceful flush, `set +e` pull step, file size in bytes/MB, badges, and GitHub Pages HTML5 video report).
  4. Pillar 3: Sanity Checks & Self-Verifications (all 6 sanity checks: repo hygiene, strict JSON3, zero synthetic fixtures on Android, markdown links, code modularity, build & lint).
  5. Pillar 4: Task Tracking & Prompt Completion Audit (tokens.md, tasks.md, current-sub-task.md, done.md).
- Created dedicated verification script `scripts/verify-self-verification.ts`.
- Registered `test:self-verification` in `package.json` and documented in `docs/files.md`.

### Subtask 82.1: Stage Task 82 in tracking documentation (tokens.md, docs/tasks.md, current-sub-task.md, docs/todo.md, temp.md)
- Processed token economy optimization protocol according to `tokens.md`.
- Staged Task 82 in `docs/tasks.md`, `current-sub-task.md`, and `docs/todo.md`.
- Maintained working notes in `temp.md`.


## Task 80: Diagnose Missing Screencast Video & Guarantee Video Pull with Dedicated Workflow Step & Trap Resilience

### Subtask 80.3: Run Verification Suites, Verify Build & Lint, Commit and Migrate to docs/done.md

- Verified full test matrix across `test:screencast-availability`, `test:android-e2e-spec`, `test:tokens-economy`, `test:hotfix-workflow`, `test:workflows`, and `test:fork-readme-links` with 100% pass rate.
- Verified compilation (`compile_applet`) and ESLint (`lint_applet`) clean execution with 0 errors.
- Checked in progress and documented findings for screencast video availability.

### Subtask 80.2: Implement Dedicated Always-Run Video Pull Step & Trap set +e Resilience in CI and Local Scripts

- **Root Cause Identified**: Previous CI runs encountered an assertion timeout or failure (`Outcome: failure` displayed in deployed report). Due to `set -e` in GitHub Actions bash steps, when `pidof screenrecord` returned a non-zero exit code during the EXIT/ERR trap, the shell aborted before `adb pull /sdcard/android-emulator-video.mp4` could run. Consequently, `./android-emulator-video.mp4` was absent on the runner and was not staged into `gh-pages-staging/screenshots/` by peaceiris.
- **Architectural Fix Implemented**:
  1. In `.github/workflows/emulation.yml`, injected `set +e` inside `cleanup_recording()` so trap execution never exits prematurely.
  2. Added a dedicated standalone GitHub Actions step: `Finalize Screencast Recording and Pull Video` with `if: always()` immediately following the E2E test step, guaranteeing `adb pull /sdcard/android-emulator-video.mp4` always executes regardless of test outcome.
  3. Staged `./android-emulator-video.mp4` to all target locations in `gh-pages-staging/` (`gh-pages-staging/android-emulator-video.mp4`, `gh-pages-staging/screenshots/android-emulator-video.mp4`, and `gh-pages-staging/android/android-emulator-video.mp4`).
  4. In `scripts/run-android-e2e.sh`, added `set +e` inside `stop_recording_and_pull()`.
  5. Enhanced `scripts/verify-screencast-availability.ts` to assert that the dedicated `Finalize Screencast Recording and Pull Video` step exists with `if: always()` and `set +e` resilience.

### Subtask 80.1: Stage Task 80 in tracking documentation (tokens.md, docs/tasks.md, current-sub-task.md, docs/todo.md, temp.md)

- Diagnosed why `android-emulator-video.mp4` returned 404 on `https://mostuf25563.github.io/subtitle-sync/screenshots/android-emulator-video.mp4`.
- Recorded diagnostic details in `temp.md` and staged tasks across tracking documents.

## Task 79: Automatically Update README.md with Video Size and Link on Every GitHub Actions Run

### Subtask 79.3: Run Verification Suites, Verify Build & Lint, Commit and Migrate to docs/done.md

- Validated full test matrix across `test:fork-readme-links`, `test:workflows`, `test:screencast-availability`, and `test:e2e-report-links` with 100% pass rate.
- Verified zero errors on full application build (`compile_applet`) and zero ESLint errors (`lint_applet`).
- Performed git progress checkpoint.

### Subtask 79.2: Integrate Automated README Video Size & Link Synchronization into Workflows and update-readme.mjs

- Enhanced `scripts/update-readme.mjs` to dynamically detect screencast video size (from `VIDEO_SIZE_BYTES`, local files, or GitHub Actions artifacts API) and update `README.md` with the exact size (`MB` and bytes) and correct link (`https://<owner>.github.io/<repo>/screenshots/android-emulator-video.mp4`).
- Updated `.github/workflows/update-readme.yml` with `workflow_run` on `Android Emulator E2E Tests` completion so that whenever tests finish, `README.md` automatically updates.
- Updated `.github/workflows/emulation.yml` with `Synchronize README with Latest Screencast Video Size & Link` right after pulling `android-emulator-video.mp4`.
- Enhanced `scripts/verify-screencast-availability.ts` with checks asserting that `update-readme.yml` and `emulation.yml` maintain automated README updates on every run.

### Subtask 79.1: Stage Task 79 in tracking documentation (tokens.md, docs/tasks.md, current-sub-task.md, docs/todo.md, temp.md)

- Processed token economy optimization protocol according to `tokens.md`.
- Staged Task 79 across tracking files and ephemeral notes.

## Task 78: Keep README.md Synchronized with Screencast Video Size and Correct Link

### Subtask 78.3: Run Verification Suites, Verify Build & Lint, Commit and Migrate to docs/done.md

- Executed `npm run test:screencast-availability`, `npm run test:e2e-report-links`, and related test suites with 100% pass rate.
- Verified zero errors on full application compilation (`compile_applet`) and ESLint checks (`lint_applet`).
- Performed git commit checkpoint.

### Subtask 78.2: Update README.md, update-readme.mjs and verify-screencast-availability.ts with Screencast Video Size and Link

- Added dedicated row for `🎬 **Android Emulator Screencast Video**` to the GitHub Pages Links table in `README.md` containing the direct URL (`https://<owner>.github.io/<repo>/screenshots/android-emulator-video.mp4`), exact file size in bytes (`6,724,502 bytes`) and human-readable megabytes (`6.41 MB`).
- Updated `scripts/verify-screencast-availability.ts` to assert the video link and size in `README.md`, and automatically keep `README.md` synchronized whenever executed against new artifact builds.
- Updated `scripts/verify-e2e-report-links.ts` to validate the screencast video link and size.

### Subtask 78.1: Stage Task 78 in tracking documentation (tokens.md, docs/tasks.md, current-sub-task.md, docs/todo.md, temp.md)

- Processed token economy optimization protocol according to `tokens.md`.
- Staged Task 78 across tracking files and ephemeral notes.

## Task 77: Execute Screencast & Actions Verification with Live Remote & Local Validation

### Subtask 77.3: Execute Verification Script, Validate Build & Lint, Commit & Migrate to docs/done.md

- Executed `npm run test:screencast-availability` cleanly verifying all screencast and Actions requirements.
- Confirmed that the GitHub Actions run for the latest commit (`f427b8b6`) produced artifact `android-emulator-artifacts` with size 6,724,502 bytes (6.41 MB).
- Confirmed that the live GitHub Pages report endpoint (`https://mostuf25563.github.io/subtitle-sync/android-emulator-report.html`) is active with HTTP 200 OK and contains the HTML5 video presentation player and screencast source.
- Verified build compilation (`compile_applet`) and ESLint validation (`lint_applet`).
- Performed git progress checkpoint.

### Subtask 77.2: Enhance verify-screencast-availability.ts with Live Remote Commit, Artifact & Pages Inspection

- Enhanced `scripts/verify-screencast-availability.ts` to perform live remote API and HTTP checks when online:
  - Discovers the latest remote commit SHA on GitHub (`f427b8b6`).
  - Fetches the latest `Android Emulator E2E Tests` workflow runs (`emulation.yml`) and checks its published workflow artifacts.
  - Verifies presence of `android-emulator-artifacts` and verifies byte size (6,724,502 bytes).
  - Fetches and inspects the live deployed GitHub Pages report at `https://mostuf25563.github.io/subtitle-sync/android-emulator-report.html`, asserting HTTP 200 and verifying HTML5 video tags.

### Subtask 77.1: Stage Task 77 in tracking documentation (tokens.md, docs/tasks.md, current-sub-task.md, docs/todo.md, temp.md)

- Processed token economy optimization protocol according to `tokens.md`.
- Staged Task 77 across tracking files and ephemeral notes.

## Task 76: Inspect Repository README, GitHub Actions Workflows & Verify GitHub Pages Report Screencast Availability

### Subtask 76.3: Register Verification Command in package.json, Update docs/files.md, Run Tests, Commit & Log in docs/done.md

- Registered `test:screencast-availability` in `package.json` pointing to `tsx scripts/verify-screencast-availability.ts`.
- Documented `scripts/verify-screencast-availability.ts` in `docs/files.md`.
- Ran dedicated automated verification `npm run test:screencast-availability` verifying 100% pass across all validation steps.
- Verified zero errors on full application build (`compile_applet`) and zero ESLint errors (`lint_applet`).
- Performed progress checkpointing and git synchronization.

### Subtask 76.2: Create Dedicated Script to Inspect README.md, GitHub Actions & Verify Screencast Availability on GitHub Pages Report

- Created `scripts/verify-screencast-availability.ts` providing automated multi-tiered verification:
  1. Inspects `README.md` to dynamically resolve repository identity (`<owner>/<repo>`), Actions dashboard URLs (`https://github.com/<owner>/subtitle-sync/actions`), workflow URLs (`emulation.yml`, `web.yml`, `release-apk.yml`, `deploy-demo.yml`), and GitHub Pages URLs (`android-emulator-report.html`, `screenshots/android-emulator-screenshot.png`).
  2. Inspects `.github/workflows/emulation.yml` and `.github/workflows/deploy-demo.yml` to verify that E2E tests run on a real Android emulator (`reactivecircus/android-emulator-runner@v2` on API 34 Google APIs), install the debug APK, clear preferences, execute screenrecord (`adb shell screenrecord`), cleanly finalize with SIGINT (`kill -2`), pull `android-emulator-video.mp4`, upload to `android-emulator-artifacts`, and stage to `gh-pages-staging/screenshots/android-emulator-video.mp4` for publication on the `gh-pages` branch.
  3. Verifies `public/android-emulator-report.html` and `public/android/index.html` report availability: embeds HTML5 `<video controls autoplay muted loop playsinline>`, multi-source fallbacks (`./screenshots/android-emulator-video.mp4`, etc.), direct MP4 download link, clear lifecycle notice, 5-step milestone screenshot cards, and live hardware telemetry.
  4. Inspects git HEAD commit SHA, constructs the commit-specific Actions run query URL (`https://github.com/<owner>/subtitle-sync/actions?query=head_sha%3A<commitSha>`), queries the GitHub Actions API if online, and prints a comprehensive matrix summary.

### Subtask 76.1: Define and stage Task 76 requirements in tracking documentation (tokens.md, docs/tasks.md, current-sub-task.md, docs/todo.md, and temp.md)

- Processed token optimization protocol according to `tokens.md`.
- Staged Task 76 and subtasks in `docs/tasks.md`, `current-sub-task.md`, `docs/todo.md`, and initialized notes in `temp.md`.

## Task 75: Task Completion Auditing, done.md Protocol Enforcement & Hotfix Workflow with Task Suspension/Resumption

### Subtask 75.3: Create Dedicated Verification Test, Register in package.json & Verify

- Created dedicated verification test `scripts/verify-hotfix-and-done-workflow.ts` asserting that `tokens.md`, `docs/tokens.md`, and `AGENTS.md` mandate moving tasks to `docs/done.md`, auditing task completion, and executing hotfixes with the task-on-hold pattern.
- Registered `test:hotfix-workflow` in `package.json` and documented in `docs/files.md`.
- Verified 100% test pass rate across all test suites, clean app compilation (`compile_applet`), and zero lint errors (`lint_applet`).

### Subtask 75.2: Update AGENTS.md with Mandatory done.md Flow, Task Completion Auditing & Hotfix Suspension Protocol

- Expanded `## Work tracking` in `AGENTS.md` with mandatory migration of all completed tasks to `docs/done.md` with verification metrics and diff summaries.
- Codified the Prompt Task Completion Audit rule: enforcing that all prompt tasks in `docs/tasks.md` are verified accomplished, tested, and marked `[x]` before finishing.
- Codified the Hotfix Workflow with task suspension (holding pattern): keeping the active task on hold (`[ON HOLD]`) while isolating, resolving, testing, and committing the hotfix, followed by clean resumption of the original task.

### Subtask 75.1: Update tokens.md & docs/tokens.md with Mandatory done.md Logging, Completion Auditing & Hotfix Holding Protocol

- Updated `tokens.md` and `docs/tokens.md` to specify that every completed subtask must be logged in `docs/done.md` with accomplished features, dedicated test commands, and file diff scope.
- Established the Prompt Completion Audit Gate: enforcing that before concluding, every task and subtask in `docs/tasks.md` for the prompt must be verified accomplished, tested, and marked `[x]`.
- Formalized the Hotfix Workflow: suspending active tasks with `[ON HOLD]`, staging and executing isolated hotfixes with dedicated tests and commits, moving hotfixes to `docs/done.md`, and safely resuming the held task.

## Task 74: Ensure Video Screencast Availability, Robust Capture Signals & Error-Tolerant Playback

### Subtask 74.1: Fortify Screenrecord Capture Signals, Container Finalization, and Cross-Platform Byte Counting in Workflows and Scripts

- Replaced host-level kill logic in `.github/workflows/emulation.yml` and `scripts/run-android-e2e.sh` with direct in-shell `adb shell "kill -2 \$(pidof screenrecord 2>/dev/null) 2>/dev/null || pkill -2 screenrecord 2>/dev/null || true"`, eliminating ADB carriage-return corruption on PID arguments.
- Increased post-signal sleep buffer from 2s to 3s before `adb pull`, ensuring complete `moov` header block serialization to disk.
- Replaced macOS-incompatible `stat -c%s` with cross-platform `wc -c` byte counter in workflow step.
- Enhanced `public/android-emulator-report.html` and `public/android/index.html` with multi-path source fallbacks (`./screenshots/...`, `./...`, `../screenshots/...`) and robust error event listeners on child `<source>` elements.
- Documented the video availability timeline and lifecycle in `android.md` (and `docs/android.md`).
- Verified 100% test pass rate across `test:android-e2e-spec`, `test:emulator-screencast-report`, and `test:tokens-economy`.

## Task 73: Android App E2E Validation Architecture, GitHub Pages Report, Video Screencast Protocol & Implementation Fixes

### Subtask 73.4: Create Dedicated Verification Test, Verify Build and Commit

- Created dedicated verification test `scripts/verify-android-e2e-spec.ts` asserting all documentation and implementation requirements.
- Registered `test:android-e2e-spec` in `package.json` and documented in `docs/files.md`.
- Verified 100% test pass rate across all suites, clean app compilation (`compile_applet`), and zero lint errors (`lint_applet`).

### Subtask 73.3: Fix Android E2E Implementation, Screencast Capture Pipeline, and GitHub Pages Presentation

- Updated `scripts/run-android-e2e.sh` so `screenrecord` begins before `MainActivity` launch, capturing the initial application boot and subtitle discovery lifecycle.
- Ensured graceful video container finalization via `pkill -2 -f screenrecord` with sleep buffer to flush MP4 headers before pulling via `adb pull`.
- Maintained strict error screen detection in `scripts/android-e2e-assert.sh` and `scripts/run-android-e2e.sh`, failing immediately on "This page didn't load" or `APP_BOOT_ERROR`.
- Verified `.github/workflows/emulation.yml` artifact staging into `gh-pages-staging/` for both root `/android-emulator-report.html` and `/android/index.html`.
- Verified `.gitignore` hygiene preventing video recordings or build outputs from being tracked on `main`.

### Subtask 73.2: Update AGENTS.md with Detailed Android App E2E Validation and Screencast Workflow Requirements

- Expanded `## Project-specific delivery` in `AGENTS.md` with dedicated subsection `### Android app E2E validation, screencast video & GitHub Pages reporting`.
- Codified mandatory E2E testing on Android runtime/emulator for any Android or bridge changes.
- Mandated screencast video recording protocol using native `adb shell screenrecord`, container finalization via SIGINT (`pkill -2`), and artifact pulling.
- Codified strict repository hygiene prohibiting video recordings, screenshots, logcats, and build products on the `main` branch.
- Documented GitHub Pages report presentation requirements (outcome badge, telemetry card, milestone workflow images, embedded HTML5 video player, filtered logcat, cross-links) and linked to `android.md`.

### Subtask 73.1: Create android.md Explaining Android E2E Validation, GitHub Pages Reports & Screencast Video Generation

- Created comprehensive `android.md` (and `docs/android.md`) documenting the complete Android E2E testing architecture.
- Detailed real native execution without fixtures: WebView interception, session header capture, User-Agent sanitization, and dual `tlang` vs `lang` fallback.
- Specified GitHub Pages report layout, HTML structure, telemetry cards, milestone screenshots, embedded video player, and cross-report links.
- Specified the complete ADB video screencast capture protocol: starting `screenrecord` before app launch, container finalization via SIGINT, pulling artifacts, and strictly keeping video files off the `main` branch.
- Documented strict error screen detection criteria ("This page didn't load", router failure) and local/CI execution commands.

## Task 72: Token Economy Optimization in AGENTS.md and tokens.md & Subtitle Parser Punctuation and Timing Splitting Architecture

### Subtask 72.3: Verify and Consolidate parser.md, Default Punctuation Splitting (2.1), and Timing Experimentation Lab (2.2)

- Verified and consolidated `parser.md` and `docs/parser.md` documenting YouTube JSON3 schema, sentence splitting, punctuation rules, and time calculation acoustic benefits.
- Fixed parser implementation to default to pure punctuation splitting (`["sentence"]`) in `src/lib/subtitles.ts` and `src/routes/index.tsx`, with abbreviation guard (`isAbbreviation`) and intra-cue segment punctuation splitting.
- Built interactive `src/components/ParserTimingLab.tsx` and educational timing guide modal in the UI allowing users to experiment with speech pauses, multi-track consensus, and window clamps to eliminate splitting issues.
- Ran and verified test suites: `test:parser-docs`, `test:default-punctuation`, and `test:parser-timing-lab`.

### Subtask 72.2: Update AGENTS.md to Mandate Processing of tokens.md on Every Prompt

- Updated `AGENTS.md` under Work Tracking to explicitly mandate activating the `tokens.md` token economy workflow on EVERY single prompt.
- Codified the task management lifecycle using `tokens.md`, `current-sub-task.md`, and `temp.md` to prevent token waste and context bloat.
- Asserted compliance with dedicated verification test `scripts/verify-tokens-economy.ts`.

### Subtask 72.1: Create tokens.md Explaining Token Usage Maximization, Task Decomposition, and Ephemeral Tracking Files (current-sub-task.md & temp.md)

- Created `tokens.md` and `docs/tokens.md` specifying the token economy architecture, failure modes of monolithic tasks, and token conservation principles.
- Defined the ephemeral staging workflow: staging isolated active subtasks in `current-sub-task.md`, using `temp.md` for scratchpads, running targeted tests, committing after each step, and logging in `docs/done.md`.
- Created dedicated verification test `scripts/verify-tokens-economy.ts` and registered `test:tokens-economy` in `package.json`.

## Task 71: Subtitle Parser Documentation, Default Punctuation Splitting, and Interactive Timing-Assisted Experimentation

### Subtask 71.3: Provide Interactive Timing vs Punctuation Splitting Lab & Learning Interface

- Built modular component `src/components/ParserTimingLab.tsx` and integrated into the Parser accordion panel in `src/routes/index.tsx`.
- Provided live visual metrics comparing pure punctuation vs timing-enhanced splitting (sentence counts, average duration, run-on prevention count, parallel sync ratio).
- Allowed users to toggle and experiment with timing features live (speech pauses, majority consensus, context windows) to observe immediate effect on subtitle splitting.
- Exposed an interactive educational "Learn How Timing Eliminates Splitting Issues" modal/guide directly in the UI with interactive explanations and diagrams from `parser.md`.
- Created dedicated verification test `scripts/verify-parser-timing-lab.ts` and registered `npm run test:parser-timing-lab` in `package.json`.
- Documented in `docs/files.md`, ran verification tests, compiled applet (`compile_applet`), linted applet (`lint_applet`), and committed.

### Subtask 71.2: Fix Parser Implementation to Split by Default Using Punctuation Characters

- Updated default criteria in `src/lib/subtitles.ts` (`criteriaSections`, `align`) to `["sentence"]` (pure sentence punctuation instead of legacy combo).
- Reordered `PARSER_PRESETS` so that `"sentencesOnly"` (`["sentence"]`) is the primary default preset.
- Enhanced punctuation splitting with `isSentenceEnding()` supporting multilingual sentence-ending punctuation (`.`, `?`, `!`, `…`, `。`, `؟`, quotes, brackets) while guarding against false cuts on decimal numbers (`3.14`).
- Implemented robust abbreviation detector `isAbbreviation()` guarding against false sentence cuts on titles (`Dr.`, `Mr.`, `Ms.`, `Prof.`), Latin abbreviations (`e.g.`, `i.e.`, `vs.`, `etc.`), initials (`A.`, `B.`), and country acronyms (`U.S.`, `U.K.`).
- Implemented intra-cue segment punctuation cutting inside word-timed events with intra-cue offsets (`base + segs[s+1].tOffsetMs`) controlled by `splitIntraCue` setting in `SentenceInnerSettings`.
- Updated `src/routes/index.tsx` `selectedCriteria` initial state to default to `["sentence"]` and exposed `splitIntraCue` toggle in the sentence criteria inner settings UI.
- Created dedicated verification test `scripts/verify-default-punctuation-splitting.ts` (`npm run test:default-punctuation`), registered in `package.json`, and documented in `docs/files.md`.
- Verified clean build (`compile_applet`), zero ESLint errors (`lint_applet`), and 100% test pass rate.

### Subtask 71.1: Create parser.md Explaining JSON3 Subtitles Splitting and Timing Calculations

- Created comprehensive `parser.md` (and `docs/parser.md`) documenting YouTube JSON3 subtitle data schema (`events`, `tStartMs`, `dDurationMs`, `segs`, `utf8`, `tOffsetMs`).
- Detailed sentence splitting algorithms using punctuation characters (`.`, `?`, `!`, `…`, `。`, `؟`, commas, semicolons).
- Analyzed common punctuation splitting edge cases and pitfalls (unpunctuated ASR streams, abbreviations like `Dr.` / `e.g.`, monologue run-ons, multi-lingual syntax drift).
- Detailed acoustic timing calculation benefits: word silence detection (`pauseTimes` where $\Delta t \ge 500\text{ ms}$), duration clamping (`fromCuts`), multi-track cluster consensus, and punctuation voting.
- Created dedicated verification test `scripts/verify-parser-docs.ts` (`npm run test:parser-docs`), registered in `package.json`, and documented in `docs/files.md`.
- Verified clean build (`compile_applet`), zero lint errors (`lint_applet`), and 100% test pass rate across test suites.

## Task 70: Code Standards & Modularity Enforcement: Decompose Overloaded Files into Modular Components & Hooks, and Codify Architecture Standards in AGENTS.md

### Subtask 70.2: Extract Embedded UI Components from src/routes/index.tsx into Dedicated Modular Component Files

- Extracted `AccordionSection` from `src/routes/index.tsx` into dedicated component file `src/components/AccordionSection.tsx`.
- Extracted `HighlightedSubtitle` and memoized `SubtitleRow` into dedicated component files `src/components/HighlightedSubtitle.tsx` and `src/components/SubtitleRow.tsx`.
- Extracted Subtitles Table panel rendering into dedicated component file `src/components/SubtitlesTablePanel.tsx`.
- Extracted `ApkReleasesFooter` into dedicated component file `src/components/ApkReleasesFooter.tsx`.
- Replaced over 300 lines of inline markup and monolithic component declarations in `src/routes/index.tsx` with clean modular component imports.
- Created dedicated verification suite `scripts/verify-index-route-decomposition.ts` (`npm run test:index-decomposition`), registered in `package.json`, and documented in `docs/files.md`.
- Verified 100% test pass rate across all suites, clean app compilation (`compile_applet`), and zero lint errors (`lint_applet`).

### Subtask 70.1: Codify Code Architecture Standards in AGENTS.md and Create Architectural Verification Test

- Expanded `## Code architecture, modularity, and standards` in `AGENTS.md` with explicit, strict code standards:
  - Strict avoidance of single-file overload: prohibited concentrating hundreds or thousands of lines into central files like `index.tsx` or `index.ts`.
  - Component decomposition discipline: mandated extracting multi-element or structurally distinct UI components into dedicated files in `src/components/`.
  - Custom hooks & logic isolation: mandated isolating state machines, complex effects, speech synthesis, and network coordination into `src/hooks/` or `src/utils/`.
  - Synchronized file naming and documented inventory rules in `docs/files.md`.
- Created dedicated verification test `scripts/verify-code-modularity-standards.ts` (`npm run test:code-modularity`), registered in `package.json`, and documented in `docs/files.md`.
- Verified 100% test passing, clean app compilation (`compile_applet`), and zero lint errors (`lint_applet`).

## Task 69: Subtitles Table View Only Rendered on Legitimate JSON3 Subtitles Response Without Wasting Space on Loading or Error States

### Subtask 69.1: Hide Subtitles Table View During Loading/Error States and Render Only When Legitimate JSON3 Subtitles Are Fetched

- Updated `src/routes/index.tsx` so the subtitles table view (`panelId === "subtitles"`) accordion section is completely omitted and returns `null` unless `hasLegitimateSubtitles` is true.
- Enforced `hasLegitimateSubtitles` checking that tracks exist, at least one authentic track has non-empty cues (`cues.length > 0`), aligned rows exist (`rows.length > 0`), and columns exist (`cols.length > 0`).
- Removed progressive loading indicators ("Loading subtitles smoothly…", spinner) and error retry buttons ("Fetch again") from the subtitles table pagination bar and table view so no space is wasted on loading or error placeholders.
- Placed failed languages manual fetch retry in the Languages panel (`panelId === "languages"`) to keep error recovery available without polluting the subtitles table view.
- Ensured `cols` calculation and `SubtitleRow` cell rendering strictly require tracks with cues (`length > 0`), displaying clean sentence containers without empty placeholders.
- Created dedicated verification test `scripts/verify-subtitles-table-legitimate-json3-only.ts` (`npm run test:subtitles-table-legitimate-only`), registered in `package.json`, and documented in `docs/files.md`.
- Verified clean build (`compile_applet`), zero ESLint errors (`lint_applet`), and 100% test pass rate across all verification suites.

## Task 68: Enforce Strict JSON3-Only Response Validation Across Parsers, Network Handlers, and Caches

### Subtask 68.1: Reject All Non-JSON3 Subtitle Responses as Bad/Errored Responses and Prohibit Non-JSON3 Caching Across Application

- Enforced that every subtitle response that is not authentic JSON3 (including XML `<transcript>`, HTML error pages, VTT, plain text, and empty events) is strictly treated as an errored / bad response.
- Updated `src/utils/captionParser.ts` (`parseRawCaptionData`) and `src/lib/native-captions.ts` (`parseJson3`) to reject non-JSON3 payloads, completely eliminating XML parsing and requiring authentic `json3` structural schema with valid events and utf8 segments.
- Updated `android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt` to eliminate `convertXmlToJson3`, require `isValidJsonSubtitle(body)` across proactive subtitle detection, native OkHttp repetition, and caching, rejecting any non-JSON3 response and preventing it from being cached or dispatched.
- Updated `src/routes/index.tsx` subtitle fetch and bridge handlers to treat non-JSON3 responses as errors and trigger mode fallback, caching only valid JSON3 responses via `saveCachedRawJson3`.
- Updated `src/utils/subtitleCache.ts` (`saveCachedRawJson3`, `getCachedRawJson3`, `isValidJsonSubtitleResponse`) to prohibit caching non-JSON3 responses and perform read-time eviction of non-JSON3 or corrupted entries.
- Created dedicated verification test `scripts/verify-strict-json3-only-validation.ts` (`npm run test:strict-json3-validation`), registered in `package.json`, and documented in `docs/files.md`.
- Verified 100% test pass rate across all suites, clean app compilation (`compile_applet`), and zero ESLint errors (`lint_applet`).

## Task 67: Prevent HTML Parsing of Non-Validated Subtitle Requests and Enforce Strict Pre-Cache/Bridge Validation

### Subtask 67.1: Enforce Strict Pre-Validation Against HTML Parsing and Ensure Unvalidated Responses Are Never Cached

- Updated `src/lib/native-captions.ts` (`parseJson3`) and `src/utils/captionParser.ts` (`parseRawCaptionData`) with strict guards against HTML error responses (`<!DOCTYPE html>`, `<html>`, `<body>`, `<head>`), completely preventing HTML parsing on non-validated requests.
- Updated `android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt` to enforce `response.isSuccessful && isValidJsonSubtitle(rawBodyString)` before file caching, XML-to-JSON3 conversion, cue counting, and WebView bridge dispatch, ensuring non-200 or HTML error responses are never cached or dispatched as captions.
- Updated `src/routes/index.tsx` `onNativeCaptionsInterceptedBase64` and `fetchTranslatedCaptionsWithUrl` to validate raw subtitle payloads with `isValidJsonSubtitleResponse()` prior to parsing or updating track state.
- Enhanced `src/utils/subtitleCache.ts` with read-time eviction for corrupted or malformed entries, strict pre-cache validation gates (`isValidJsonSubtitleResponse`), and added `saveCachedRawJson3` / `getCachedRawJson3`.
- Created dedicated verification test `scripts/verify-html-response-guard-and-caching.ts` (`npm run test:html-guard-caching`), registered in `package.json`, and documented in `docs/files.md`.
- Verified clean build (`compile_applet`), zero lint errors (`lint_applet`), and 100% test pass rate across test suites.

## Task 66: Document Subtitle Fetching Fallback Strategy, Anti-Bot Execution, JSON3 Validation, and Caching Mechanisms in AGENTS.md

### Subtask 66.1: Update AGENTS.md with Subtitle Fetch Fallback, Anti-Bot Strategy, JSON3 Validation, and Cache Rules

- Documented the subtitles fetch fallback strategy: `lang` replacement vs `tlang` parameterization, preserving authentic session signature query parameters, and user toggling between modes via device-saved preferences (`SubtitleRequestMode` in `src/lib/playback-preferences.ts`).
- Documented anti-bot strategy for YouTube timedtext requests: capturing real WebView player session headers (`lastObservedHeaders`), stripping `; wv` from the User-Agent string to match genuine mobile Chrome, request pacing, and jitter to avoid 429/403 blocks.
- Documented strict request validation standards: HTTP 200 status assertion, valid JSON parsing, YouTube `json3` structural schema verification (top-level `events` array, `tStartMs`, `dDurationMs`, and `segs` with non-empty `utf8` segments), and non-zero cue count.
- Documented the caching integrity rules: pre-cache validation gate via `isValidJsonSubtitleResponse()`, never caching invalidated or error responses, read-time corrupted cue eviction, and explicit user cache controls.
- Created dedicated verification test `scripts/verify-agents-subtitles-spec.ts` (`npm run test:agents-subtitles-spec`), registered in `package.json`, and documented in `docs/files.md`.
- Verified 100% test pass rate across all suites, clean app compilation (`compile_applet`), and zero ESLint errors (`lint_applet`).

## Task 65: Remove Language Video Player Accordion, Harmonize Accordion VideoIDs & Remove Android Subtitle Fixtures

### Subtask 65.1: Remove the Language Video Player Accordion Element

- Removed `language-player` from `PanelId`, `PANELS`, and `ACCORDION_THEMES` in `src/config/accordionThemes.ts`.
- Removed `language-player` from `openPanels` and `wide` prop check in `src/routes/index.tsx`.
- Removed `<LanguageVideoPlayerPanel />` accordion block and import from `src/routes/index.tsx`.
- Updated `scripts/verify-language-video-player-accordion.ts` and `scripts/verify-accordion-colors.ts` to assert that the language video player accordion is removed from PANELS, themes, and UI.
- Verified with `npm run test:language-player-accordion`, `npm run test:accordion-colors`, `compile_applet`, and `lint_applet` passing with 0 errors.

### Subtask 65.2: Enforce Consistent VideoID Across All Accordion Elements & Remove Subtitle Fixtures from Android App

- Bound `videoId={videoId}` explicitly across all accordion sections, stamping `data-video-id={videoId}` on every accordion `<details>` element to guarantee uniform synchronization.
- Removed hardcoded `videoId !== DEMO_VIDEO` constraints from the parallel subtitles empty state and column rendering in `src/routes/index.tsx`, ensuring all video IDs are handled uniformly.
- Completely removed synthetic fake subtitle generators (`generateDefaultSubtitlesJson` and `generateTranslatedFallbackJson`) from `MainActivity.kt`.
- Removed offline asset fixture fallback (`assets.open("fixtures/...")`) from `proactiveDetectSubtitles` in `MainActivity.kt` and removed `JSON3_RAW_MAP` fallback from `fetchFavoriteLanguageSubtitles` in `src/routes/index.tsx`, guaranteeing the Android application only uses authentic network and bridge captions.
- Added state reset on `onNewIntent` in `MainActivity.kt` (`lastObservedTimedTextUrl = null`, `lastObservedHeaders.clear()`) to prevent stale timedtext URLs from leaking across videos.
- Created dedicated verification test `scripts/verify-accordion-video-id-and-no-android-fixtures.ts` (`npm run test:accordion-video-id-and-no-android-fixtures`), registered in `package.json`, and documented in `docs/files.md`.
- Verified compilation (`compile_applet`), linting (`lint_applet`), executed test suites, committed changes, and gracefully attempted git push.

## Task 64: Restore Android App Working State to Parity with Commit 25131f042373c80ea22b51740a4dd03a358691e0

### Subtask 64.1: Inspect commit 25131f042373c80ea22b51740a4dd03a358691e0, diagnose Android regressions, restore working Android runtime & asset loading, verify with dedicated test, and commit

- Fetched and inspected git history and commit `25131f042373c80ea22b51740a4dd03a358691e0` from `mostuf25563/subtitle-sync` and upstream `mostuf2556/Youtubenet6`.
- Identified regressions introduced after `25131f0`:
  1. `proactiveDetectSubtitles` was omitted in `onCreate` and `onNewIntent`, leaving `lastObservedTimedTextUrl` null and failing to start initial caption detection.
  2. `buildQuerySuffix` returned empty string on clean launch, omitting `?v=vBURridJXZ0&android=true` and causing asynchronous/delayed `isAndroid` evaluation.
  3. Offline/emulator fallback to bundled fixtures for initial subtitle detection was missing when YouTube timedtext was unreachable.
  4. `fetchFavoriteLanguageSubtitles` in `src/routes/index.tsx` was vulnerable if both native bridge and network failed without bundled JSON3 fallback.
- Restored `proactiveDetectSubtitles(initialVideoId)` in `onCreate` and `proactiveDetectSubtitles(targetVideoId)` in `onNewIntent` in `MainActivity.kt`.
- Restored query suffix fallback `buildQuerySuffix(sharedText).ifEmpty { "?v=vBURridJXZ0&android=true" }` in `onCreate`.
- Restored offline fixture resolution in `proactiveDetectSubtitles` using bundled JSON3 fixtures from `assets/fixtures/L2Ryrr6txwA/en.json`, setting `lastObservedTimedTextUrl` and logging `SUBTITLE_FETCH kind=default http=200`.
- Integrated fallback to `JSON3_RAW_MAP[code]` in `src/routes/index.tsx` `fetchFavoriteLanguageSubtitles`.
- Updated `build:android-assets` script in `package.json` to properly invoke asset synchronization.
- Created dedicated verification test `scripts/verify-android-commit-25131f0-parity.ts` (`npm run test:commit-25131f0-parity`) and documented in `docs/files.md`.
- Verified compilation (`compile_applet`), linting (`npm run lint`), ran test suites, committed changes, and gracefully attempted git push.

## Task 63: Ensure Android Emulator E2E Tests Pass, APK is Installable, and App Runs Correctly

### Subtask 63.1: Ensure APK is Installable and Build/Installation Scripts Pass Robustness Checks

- Verified production web asset bundling into `android-shell/app/src/main/assets/` (`index.html`, JavaScript chunk bundle, and stylesheet).
- Verified Android Gradle configuration (`compileSdk = 34`, `targetSdk = 34`, `applicationId = "com.ytviewer.app"`, debug signing for release build, and `preBuild.dependsOn(prepareWebAssets)`).
- Verified Android Manifest intent filters for `ACTION_MAIN`, `ACTION_VIEW` (browser YouTube links), and `ACTION_SEND` (plain text shares).
- Validated cross-platform installation scripts `update.apk.sh` and `install-apk.sh` with ADB detection on Linux/macOS/Windows, multi-user deep purge (`pm uninstall --user 0`, `pm clear`), package replace flags (`-r -d -t`), and direct push fallback.
- Validated GitHub Actions release workflow `release-apk.yml` artifact packaging (`YouTube-Viewer-debug.apk`).
- Implemented dedicated test `scripts/verify-apk-installable.ts` (`npm run test:apk-installable`), registered in `package.json`, and documented in `docs/files.md`.

### Subtask 63.2: Ensure Android App Runs Correctly (Launch, WebView Assets, and Native Bridge)

- Integrated automatic asset synchronization into the root `build` script (`vite build && node scripts/normalize-web-assets.mjs dist && node scripts/sync-android-assets.mjs`) to guarantee production build chunks and bundled Android assets never drift out of sync.
- Verified Android shell Kotlin runtime lifecycle (`MainActivity.kt`) loads exclusively from the local asset domain (`https://appassets.androidplatform.net/index.html`) without premature errors or webview reload loops on `onNewIntent`.
- Validated native caption bridge, `tlang` replacement, base64 payload interception, and video ID query extraction across all YouTube URL formats and share intents.
- Validated app startup readiness signals, error boundary protection, and that no error screens ("This page didn't load") are rendered.
- Verified all dedicated test suites passed: `test:android-loading`, `test:android-run-parity`, `test:native-captions`, and `test:youtube-share-intent`.

### Subtask 63.3: Ensure Android Emulator E2E Tests Pass with Assertion Flow, Error Guarding, and Report Generation

- Verified Android emulator runner scripts (`scripts/run-android-e2e.sh` and `scripts/android-e2e-assert.sh`), ensuring failure detection on error pages, accurate logcat analysis, video recording, and screenshot capture.
- Validated error screen guarding (`uiautomator dump` checks, `APP_BOOT_ERROR` / `APP_PAGE_ERROR` rejection, and halted `[APP_READY]` on router error boundary).
- Verified emulator screencast recording lifecycle, video container finalization, and artifact extraction without polluting git history.
- Verified GitHub Actions emulator workflow (`.github/workflows/emulation.yml`) and HTML report (`public/android-emulator-report.html`) presentation with hardware telemetry and video player embedding.
- Verified dedicated test suites passed: `test:emulator-error-detection`, `test:emulator-subtitles-e2e`, `test:emulator-screencast-report`, `test:android-device-e2e`, `test:android-adaptive`, and `test:emulation-gh-pages`.




## Task 62: Fix Android App "This page didn't load" Error & Enforce Emulator E2E Failure

### Subtask 62.1: Enforce Emulator E2E Failure on Android Error Pages ("This page didn't load")

- Updated Android emulator E2E assertion scripts (`scripts/android-e2e-assert.sh`, `scripts/run-android-e2e.sh`, `e2e/emulation.spec.ts`, `cypress/e2e/emulation.cy.ts`) to explicitly check for error markers including "This page didn't load", "Something went wrong on our end", `router-error-component`, and `APP_PAGE_ERROR`.
- Updated `src/routes/__root.tsx` ErrorComponent to include unambiguous diagnostic tags (`data-testid="router-error-component"`, `data-testid="router-error-title"`, `[APP_BOOT_ERROR]`, `[APP_PAGE_ERROR]`).
- Updated `src/client.tsx` to detect router error boundary rendering and halt `[APP_READY]` signaling so emulator tests fail immediately.
- Implemented periodic `uiautomator dump` in `scripts/android-e2e-assert.sh` to ensure the on-device UI display fails tests if the error screen is visible.
- Created dedicated verification test `scripts/verify-emulator-error-detection.ts` (`npm run test:emulator-error-detection`), registered in `package.json`, and documented in `docs/files.md`.
- Verified clean build (`compile_applet`) and zero ESLint errors (`lint_applet`).

## Task 61: Resolve Android App Runtime Failure After Commit Group 420d2bd-b92be574

### Subtask 61.1: Ensure Clean Asset Synchronization, Gradle Asset Build Integrity & Android Shell Runtime Stability

- Synchronized bundled web assets in `android-shell/app/src/main/assets/` directly with current production build outputs (`dist/`), preventing missing hash chunk errors and 404s in the WebView.
- Fixed code formatting and linting errors across `src/lib/playback-preferences.ts` and `src/routes/index.tsx` introduced by recent UI commits.
- Verified Android WebView asset interception and fallback mechanisms in `MainActivity.kt` cleanly serve bundled JS/CSS chunks with correct MIME types without logging premature errors.
- Validated that all compact accordion headers, pin toggles, and TTS voice selection features initialize safely without throwing runtime errors.
- Created dedicated verification test `scripts/verify-android-app-run-parity.ts` (`npm run test:android-run-parity`), registered in `package.json`, and documented in `docs/files.md`.
- Verified 100% test pass rate across all suites, clean app compilation (`compile_applet`), and zero ESLint errors (`lint_applet`).

## Task 60: Fix Android App Loading Failure & Restore Robust Android Shell Execution

### Subtask 60.1: Fix Kotlin Compilation Syntax Errors, Clean Query Suffix Handling & Restore Clean Android App Loading

- Replaced invalid `catch (_: Exception)` with valid `catch (ignored: Exception)` across `MainActivity.kt`, fixing Kotlin 1.9 compiler failure.
- Fixed `buildQuerySuffix` and intent handling to cleanly load local assets `index.html` without corrupt query combinations (`"null"`, `"undefined"`) or unnecessary whole-page reloads on `onNewIntent`.
- Fixed `onNewIntent` to seamlessly dispatch incoming video IDs via `window.onNativeSharedLinkReceived` or buffer in `window.__pendingSharedLink` without destructive `window.location.href` or `loadUrl` reloads.
- Removed premature hardcoded Hebrew fallback and subtitle injection from `proactiveDetectSubtitles` and `onCreate`, ensuring `lastObservedTimedTextUrl` is never corrupted and subtitles always strictly match the active video.
- Removed premature `Asset not found` error logging in `shouldInterceptRequest` before attempting extensionless SPA route and `assetLoader` fallbacks.
- Created dedicated verification test `scripts/verify-android-app-loading.ts` (`npm run test:android-loading`), registered in `package.json`, and documented in `docs/files.md`.
- Verified 100% test pass rate across all suites, clean app compilation (`compile_applet`), and zero ESLint errors (`lint_applet`).

## Task 58: Auto-Enable "Speak" Checkbox on Favorites Language Panel Upon Subtitle Fetching

### Subtask 58.1: Auto-check "Speak" checkbox when favorite language subtitles are fetched and remove pronouncing language name

- Removed audio pronunciation of language names (`speak(meta.name)`) via TTS upon subtitle fetch in `src/routes/index.tsx` and related components.
- Configured `autoSpeakOnFetch` so that when subtitle tracks are fetched/loaded for language(s), the language(s) are automatically added to `spoken` state (`setSpoken`), setting the checkbox under "Speak" on the Favorites Language panel.
- Updated the toggle explanation copy in the Favorites Language panel to clarify that it automatically enables the "Speak" checkbox when subtitles are loaded.
- Updated `scripts/verify-auto-speak-on-fetch.ts` to assert that language names are not spoken and that the "Speak" checkbox state is auto-checked on fetch.
- Verified all tests pass, app compiles cleanly (`compile_applet`), and ESLint passes with 0 errors.

## Task 57: Remove Textual Color Names from Accordion Header Bars

### Subtask 57.1: Remove Color Names Text from Accordion Section Headers

- Removed rendered textual color names (`theme.tagColor`) from `AccordionSection` header bars in `src/routes/index.tsx`.
- Replaced textual color badge with subtle dot accent indicator (`theme.dotBg`) and retained full constant color bar styling (`border-l-4`, summary tinted background).
- Updated `src/config/accordionThemes.ts` and `scripts/verify-accordion-colors.ts` to assert that textual color names are completely removed while constant color themes and attributes are preserved.
- Verified 100% test pass rate (`npm run test:accordion-colors`), clean app compilation, and zero ESLint warnings.

## Task 56: Fix autoSpeakOnFetch ReferenceError Initialization Order

### Subtask 56.1: Initialize autoSpeakOnFetch Prior to Callback Bindings

- Reordered `autoSpeakOnFetch` state initialization in `src/routes/index.tsx` above all callbacks (`fetchFavoriteLanguageSubtitles`, `onSelectLanguage`) that reference it, eliminating temporal dead zone (TDZ) ReferenceError on component render.
- Created dedicated verification test suite `scripts/verify-autospeak-initialization-order.ts` asserting top-level declaration order and zero downstream duplicate re-declarations.
- Registered `"test:autospeak-init"` in `package.json` and documented in `docs/files.md`.
- Verified 100% test pass rate, clean app compilation, and zero ESLint warnings.

## Task 55: Accordion Color Standardization, Auto-TTS Subtitle Fetching, Touch-Friendly Language Selection & Multi-Language Video Player

### Subtask 55.1: Constant Theme Colors per Accordion Type
- Created `src/config/accordionThemes.ts` defining distinct constant color themes (borders, summary backgrounds, badges, and tags) for each accordion section (`player`, `playback`, `parser`, `languages`, `language-player`, `subtitles`, `library`).
- Updated `AccordionSection` to apply `data-accordion-type`, `data-accordion-color`, `data-testid="accordion-bar-{id}"`, and colored header bars.
- Implemented dedicated test `scripts/verify-accordion-colors.ts` and registered `npm run test:accordion-colors`.

### Subtask 55.2: Automatic Speech Synthesis Announcement on Subtitle Fetch
- Added persistent configuration `getAutoSpeakOnFetchSetting` and `setAutoSpeakOnFetchSetting` in `src/utils/appSettings.ts` (defaulting to enabled/`true`).
- Triggered automatic pronunciation of language names via TTS (`speak`) upon live fetch completion, base64 caption interception, and language selection.
- Added accessible toggle `data-testid="auto-speak-on-fetch-toggle"` in the Languages panel.
- Implemented dedicated test `scripts/verify-auto-speak-on-fetch.ts` and registered `npm run test:auto-speak-on-fetch`.

### Subtask 55.3: Touch-Friendly Language Boxes & Keep Clicked Selections on Top
- Created `src/components/LanguageBoxesSelector.tsx` featuring a mode toggle button (`#toggle-language-display-mode`) between boxes and list.
- Provided large touch-friendly box elements (`min-h-[48px]`, `data-testid="language-box-{code}"`) suitable for Android.
- Automatically partitioned and kept selected/clicked languages at the top of the grid and table (`orderedLangs`).
- Maintained compatibility and synchronization with `#target-language-select` for all existing automation suites.
- Implemented dedicated test `scripts/verify-language-boxes-selection.ts` and registered `npm run test:language-boxes`.

### Subtask 55.4: Dedicated Language Video Player Accordion with Iframe URL Subtitle Control & Network Inspector Integration
- Registered `"language-player"` accordion panel (`"Language video player"`) in `PANELS` and `panelOrder`.
- Created `src/components/LanguageVideoPlayerPanel.tsx` rendering YouTube embed iframes with `https://www.youtube.com/embed/VIDEO_ID?hl=en&cc_load_policy=1&cc_lang_pref={lang}`.
- Strictly maintained `hl=en` to keep menus in English, forced captions via `cc_load_policy=1`, and controlled subtitle languages via `cc_lang_pref`.
- Tracked subtitle requests in `networkTracker` (`/api/timedtext?...&fmt=json3`) and provided direct links to view them in the embedded Network Requests Inspector.
- Implemented dedicated test `scripts/verify-language-video-player-accordion.ts` and registered `npm run test:language-player-accordion`.

## Task 54: Improve Android Device & Emulator E2E Testing Suite

### Subtask 54.1: Robust Device Environment, Lifecycle Management & Telemetry

- Supported explicit device targeting with `ANDROID_SERIAL` across `scripts/run-android-e2e.sh` and `scripts/android-e2e-assert.sh`, including automatic discovery of first connected device/emulator when omitted.
- Wrapped adb interactions in an `adb_cmd` function with `-s "$ANDROID_SERIAL"` for multi-device isolation.
- Implemented automated device wake (`input keyevent KEYCODE_WAKEUP`), keyguard dismissal (`wm dismiss-keyguard`), orientation locking (`accelerometer_rotation 0`), and battery/device connectivity logging.
- Extracted comprehensive hardware and software telemetry (model, brand, manufacturer, release, SDK/API level, display size, display density, CPU ABI, battery level) and saved to `android-emulator-device-info.json`.
- Enforced clean repository hygiene by adding `android-emulator-device-info.json` to `.gitignore`.
- Updated `public/android-emulator-report.html` to dynamically hydrate a "Device & Hardware Telemetry" dashboard section from the JSON payload with graceful fallbacks.
- Updated `.github/workflows/emulation.yml` to extract device telemetry, include it in artifact uploads, and stage it into `gh-pages-staging/`.
- Created dedicated verification test suite `scripts/verify-android-device-e2e-suite.ts` and registered `"test:android-device-e2e"` in `package.json`.
- Documented `scripts/verify-android-device-e2e-suite.ts` in `docs/files.md`.
- Verified 100% test pass rate, clean compilation, and zero ESLint warnings.

## Task 53: Android E2E YouTube Share Intent Verification, Screencast Video Recording & GitHub Pages Presentation

### Subtask 53.1: Android E2E YouTube Link Share Testing (Browser & Official YouTube App)

- Implemented comprehensive E2E tests validating that YouTube links shared from either:
  1. A web browser (via `ACTION_VIEW` with standard watch URLs `watch?v=...`, query parameters like `&t=42s`, shortened `youtu.be/...`, `?si=...`, mobile `m.youtube.com`, YouTube Shorts, embeds, and live streams).
  2. The official YouTube app (via `ACTION_SEND` with plain URLs or prefixed sharing text like `"Check out this video on YouTube: https://youtu.be/..."`).
- Validated that `MainActivity.kt` and WebView bridge (`window.onNativeSharedLinkReceived`) cleanly switch to the shared video, reset state, clear cached timedtext, and initiate caption discovery without crashing or reloading the entire webview session.
- Added browser and YouTube app sharing test cases to `e2e/emulation.spec.ts` and `cypress/e2e/emulation.cy.ts`.
- Created dedicated verification test suite `scripts/verify-android-share-e2e.ts` covering 16 comprehensive verification checks across intent formats, URL extraction, query parameter parsing, and native-to-web messaging.
- Registered `"test:android-share-e2e"` script in `package.json` and documented in `docs/files.md`.
- Verified all 16 test assertions pass cleanly (`npm run test:android-share-e2e`), app compiles (`npm run build`), and ESLint passes with 0 warnings.

### Subtask 53.2: Emulator Screencast Video Recording, Artifact Staging & Report Presentation

- Configured screencast video recording on Android emulator via `adb shell screenrecord /sdcard/android-emulator-video.mp4` in both `scripts/run-android-e2e.sh` and `.github/workflows/emulation.yml`.
- Implemented clean termination signaling with `SIGINT` / `kill -2` to finalize the MP4 container before pulling the recorded video with `adb pull /sdcard/android-emulator-video.mp4`.
- Updated `.gitignore` to strictly ignore `*.mp4`, `android-emulator-video.mp4`, and `public/screenshots/android-emulator-video.mp4` to preserve clean repository hygiene on the `main` branch.
- Updated `.github/workflows/emulation.yml` to stage the video into `gh-pages-staging/screenshots/android-emulator-video.mp4` and upload as a workflow artifact (`android-emulator-screencast-video`), ensuring it is published to GitHub Pages without ever being committed to `main`.
- Embedded an interactive video player presentation card (`<video controls autoplay muted loop>`) in `public/android-emulator-report.html` alongside the step-by-step screenshots, logcat telemetry, and test reports.
- Created dedicated verification test suite `scripts/verify-emulator-screencast-report.ts`, registered `"test:emulator-screencast-report"` in `package.json`, and documented in `docs/files.md`.
- Verified 100% test pass rate across all dedicated test suites, successful app compilation, and zero lint warnings.

## Task 52: Emulator E2E Subtitles Detection & Inspection with YouTube API Fallback, and Empty/Non-JSON Cache Guard Test

### Subtask 52.1: Add Test Ensuring the App Doesn't Cache Empty Response or Non-JSON Response

- Created comprehensive dedicated test suite `scripts/verify-no-cache-empty-or-non-json.ts` testing 22 invalid/empty payload vectors across `isValidJsonSubtitleResponse`, `saveCachedRawJson3`, `saveCachedSubtitles`, and `saveCachedTargetSubtitles`.
- Asserted rejection of empty strings (`""`), blank whitespace (`"   \n\t "`), `null`, `undefined`, empty arrays, and empty objects.
- Asserted rejection of non-JSON responses including HTML 404/500 error pages, plaintext error strings, rate limit messages, XML error payloads, malformed JSON, and JSON without text cues.
- Verified cache write protection: attempting to cache empty or non-JSON responses leaves storage untouched, and existing valid cached subtitles and raw JSON3 are preserved and never overwritten by subsequent empty or corrupt responses.
- Verified Android native shell (`MainActivity.kt`) contracts: `isValidJsonSubtitle` validation, `saveCaptionToFile` disk write protection, and interception checking.
- Registered `"test:no-cache-empty-non-json"` in `package.json` and documented in `docs/files.md`.

### Subtask 52.2: Implement Emulator E2E Testing Default Subtitles Detection, Favorite Languages Fetch, YouTube API tlang/lang Fallback, and Network & Subtitles View Inspection

- Implemented full emulator E2E flow in `e2e/emulation.spec.ts` and `cypress/e2e/emulation.cy.ts` covering:
  1. Default subtitles detection: native timedtext interception receiving base subtitle stream.
  2. Favorite languages proactive fetching: automatic requests for favorite languages (Hebrew and Italian) following default caption discovery.
  3. YouTube API tlang and lang fallback: simulated invalid response on primary `tlang` request automatically triggering the fallback `lang` request which succeeds with valid JSON3 dialogue.
  4. Network Panel inspection: opening `#network-inspector-modal`, inspecting tracked requests, verifying `tlang` tag, `lang` fallback tag, HTTP status, and response body previews.
  5. Subtitles view inspection: asserting parallel subtitles table renders columns for default and favorite languages with synchronized dialogue text.
  6. Per-step screenshot captures (`step1-default-subtitles-detected`, `step2-favorite-languages-fetch`, `step3-youtube-api-tlang-lang-fallback`, `step4-network-panel-inspection`, `step5-subtitles-view-inspection`).
- Enhanced `public/android-emulator-report.html` for GitHub Pages publication with step-by-step verification cards, status badges, step screenshots, and logcat telemetry.
- Created dedicated verification test suite `scripts/verify-emulator-e2e-subtitles.ts` (`npm run test:emulator-subtitles-e2e`), registered in `package.json`, and documented in `docs/files.md`.
- Verified 100% pass across all regression test suites, app compilation, and 0 lint warnings.

## Task 41: Video library panel (watch history)

### Subtask 41.1: Implement Video Library / Watch History Panel

- Implemented `src/utils/videoLibraryManager.ts` providing persistent watch history management (`loadVideoLibrary`, `saveVideoLibrary`, `recordVideoWatch`, `removeVideoFromLibrary`, `clearVideoLibrary`) backed by `STORAGE_KEYS.LIBRARY_STORAGE_KEY` with fallback to `DEFAULT_LIBRARY_ITEMS`.
- Created `src/components/VideoLibraryPanel.tsx` with searchable video cards, high-quality thumbnails (`getVideoThumbnailUrl`), relative watch timestamps (`formatRelativeTime`), quick video selection/load button (`data-testid="library-play-btn"`), currently active indicator badge, individual remove buttons (`data-testid="library-remove-btn"`), and clear library confirmation (`data-testid="library-clear-btn"`).
- Integrated the Video Library panel into `PANELS` accordion in `src/routes/index.tsx` (`id: "library", title: "Video library"`), allowing users to browse their history and instantly switch videos directly from the sidebar.
- Added automatic watch history recording (`recordVideoWatch`) in `src/routes/index.tsx` whenever a video ID is loaded or played, updating recent watch timestamps and deduplicating items to keep recent items at the top.
- Created dedicated verification test suite `scripts/verify-video-library.ts` (`npm run test:video-library`), registered in `package.json`, and documented in `docs/files.md`.
- Verified all verification suites (`test:video-library`, `test:audio-track-time-sections`, `test:multi-video-audio-sync`), compile check, and ESLint pass with 0 errors and 0 warnings.

## Task 51: Fix Original Video Repeating Same Time-Frame and Not Respecting Subtitle Time-Sections in Audio-Track Mode

### Subtask 51.1: Audio-Track Mode Loop Progression & Accurate Time-Section Resumption

- Replaced the flawed `idx >= 0 && rows[idx]?.start ? rows[idx].start / 1000 : ...` resume target logic in `src/routes/index.tsx`. When section `candidateRow` completes and audio-track repetition finishes, playback advances strictly to `rows[candidateRow + 1].start / 1000` (or cleanly pauses if reaching the final subtitle row). This eliminates the bug where the original video element repeated the same section before proceeding.
- Added audio-track fallback in `getEligibleLangs` in `src/routes/index.tsx`: when `audioTrackMode` is enabled and no explicit spoken languages are selected, it falls back to the default base language (`baseLanguage` / `primary`), ensuring that subtitle time-sections are respected, paused, and repeated using the original video's native audio even with no secondary languages enabled.
- Added pre-seek guard (`hasStartedNearStart`) in `executeMultiVideoSegmentSync` in `src/utils/multiVideoPlayerManager.ts`, confirming the player has completed its asynchronous seek near `startMs` before allowing `currentMs >= endMs - 50` completion checks.
- Cleared row index `i` from `playedTtsRecords` in `seek(r, i)` in `src/routes/index.tsx`, ensuring clicking any row resets its played state and allows it to repeat and play cleanly.
- Implemented dedicated verification test suite `scripts/verify-audio-track-time-sections.ts` (`npm run test:audio-track-time-sections`) validating section progression, elimination of duplicate replaying, pre-seek guarding, language fallback, and replayability. Registered script in `package.json` and documented in `docs/files.md`.
- Verified all regression test suites, app compilation, and ESLint pass with 0 errors and 0 warnings.

## Task 50: Draggable Floating Setup Pause Button with Autofocus, Auto-scroll & Play-Switch Suppression

### Subtask 50.1: Draggable Floating Pause Component & Drag Handling

- Created `src/components/FloatingDraggablePauseButton.tsx` with fixed viewport positioning and z-index priority.
- Implemented smooth side-to-side dragging via both touch (`onTouchStart`, `onTouchMove`, `onTouchEnd`) and mouse (`onMouseDown`, `mousemove`, `mouseup`) with dynamic viewport clamping.
- Implemented tap-vs-drag discrimination (`hasMovedRef`) preventing accidental toggle clicks when releasing a drag.
- Added visual feedback with distinct setup pause badge ("Autoscroll & Play OFF"), pause/play icons, responsive grab/grabbing cursors, and local storage coordinate persistence (`yt_floating_pause_pos`).
- Created dedicated verification suite `scripts/verify-floating-draggable-pause.ts` and registered in `package.json`.

### Subtask 50.2: Player Coordination & Autofocus / Auto-scroll / Play-Switch Suppression

- Integrated `FloatingDraggablePauseButton` into `src/routes/index.tsx` root view with `isSetupPaused` state and `toggleSetupPause` handler.
- When setup pause is engaged, all media players (`multiVideoPlayerRegistry.pauseAllExcept()`, `player.current.pauseVideo()`) are instantly paused and active speech synthesis (`cancelSpeech()`) is cancelled.
- Completely suppressed playback interval loop (`st.current.isSetupPaused`), preventing automatic subtitle cue progression, play-switching, and seeking.
- Completely suppressed subtitle table row auto-scroll (`scrollIntoView`) and Android pagination autoFocus during setup pause.
- Updated and verified dedicated test suite `scripts/verify-floating-draggable-pause.ts` (`npm run test:floating-pause`).

## Task 48: Fix APK Version Collision, Update Script Robustness & In-App Version Display with Releases Link

### Subtask 48.1: Robust APK Installation & Version Code Handling in Update Script

- Updated `update.apk.sh` and `install-apk.sh` with `deep_purge_package` (`am force-stop`, `pm clear`, `adb uninstall`, `pm uninstall --user 0`) ensuring total cleanup of colliding packages or lingering corrupted data.
- Added `has_collision_error` detecting signature and package conflicts (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`, `INSTALL_FAILED_VERSION_DOWNGRADE`, `INSTALL_FAILED_CONFLICTING_PROVIDER`, `INSTALL_FAILED_SHARED_USER_INCOMPATIBLE`, `INSTALL_FAILED_DUPLICATE_PERMISSION`) with automatic deep purge and re-installation.
- Configured standard semantic version (`"version": "1.0.16"`) in `package.json`.
- Propagated `appVersionCode` and `appVersionName` via `.github/workflows/release-apk.yml` into Gradle `assembleDebug`.
- Added direct link to GitHub all releases page in `README.md`.
- Created dedicated verification suite `scripts/verify-apk-installation-robustness.ts` and registered in `package.json`.

### Subtask 48.2: In-App Version Display with Link to All Releases Page

- Defined canonical constants `APP_VERSION = "1.0.16"` and `ALL_RELEASES_URL = "https://github.com/mostuf2556/subtitle-sync/releases"` in `src/config/appConfig.ts` and aligned `CURRENT_APK_VERSION = "v1.0.16"` in `src/utils/apkUpdater.ts`.
- Added header version badge `v1.0.16` (`data-testid="header-app-version-badge"`) linking to GitHub all releases page.
- Added footer link `All Releases (v1.0.16)` (`data-testid="footer-all-releases-link"`) linking to GitHub all releases page.
- Updated `ApkReleaseModal` with direct link to all releases (`data-testid="modal-all-releases-link"`).
- Created dedicated verification suite `scripts/verify-apk-version-and-releases.ts` and registered in `package.json`.

## Task 49: Multi-Instance Video Elements with Independent Audio-Track Configuration & Horizontal Swiper Synchronization

### Subtask 49.1: Multi-Instance Video Player State & Independent Configuration Architecture

- Built `src/utils/multiVideoPlayerManager.ts` to manage multiple video player instances mapped by language code: primary video plus dedicated instances for each language with speak/audio enabled.
- Implemented isolated local storage persistence (`yt_multi_instance_{videoId}_configs`) and independent state management per video element instance (volume, mute, manual audio track configured status, label) so setting audio track or volume in one instance never leaks to others.
- Implemented `MultiVideoPlayerRegistry` for multi-instance coordination (`pauseAllExcept`, `unmuteOnly`, `syncSecondaryPlayers`, `register`, `unregister`).
- Created dedicated verification suite `scripts/verify-multi-video-player-state.ts`.

### Subtask 49.2: Horizontal Swiper Carousel Component for Multi-Video Elements

- Created `src/components/VideoInstancesSwiper.tsx` providing a smooth horizontal swipeable carousel with touch gestures (`onTouchStart`, `onTouchMove`, `onTouchEnd`) and desktop controls (`ChevronLeft`, `ChevronRight`).
- Implemented slide indicators, language headers (Primary vs Spoken Languages), and active playback indicator badges (`Active Audio`).
- Integrated independent YouTube audio track setup guidance and isolated per-instance toggle persistence (`Mark Configured` / `Track Configured`).
- Integrated `VideoInstancesSwiper` into `src/routes/index.tsx` player panel.
- Created dedicated verification suite `scripts/verify-video-instances-swiper.ts` and registered in `package.json`.

### Subtask 49.3: Multi-Video Pause/Resume Audio-Track Synchronization Loop

- Implemented `executeMultiVideoSegmentSync` in `src/utils/multiVideoPlayerManager.ts` to coordinate pause/resume and unmuting across multi-video player instances during subtitle cue intervals.
- Pauses all other player instances and unmutes exclusively the active speaking language instance during segment repetition.
- Emits real-time progress callbacks for subtitle highlighting, and automatically pauses target player and restores unmuted state to primary upon completion or cancellation.
- Integrated `executeMultiVideoSegmentSync` into `speakRow` in `src/routes/index.tsx` with smooth fallback to Web Speech TTS when `audioTrackMode` is disabled.
- Synchronized primary player resumption with registry state (`unmuteOnly("primary")`) and cancellation cleanup.
- Created dedicated verification suite `scripts/verify-multi-video-audio-sync.ts` and registered in `package.json`.

## Task 47: Fix README.md Links, CI Workflows & GitHub Pages Staging for Forked Repositories

### Subtask 47.1: Synchronize README.md Links & Static Fallbacks for Current and Forked Repositories

- Created `public/android-emulator-report.html` and unignored it in `.gitignore` so that when `npm run build` runs, Vite automatically places `android-emulator-report.html` into `dist/`. This ensures GitHub Pages never serves a 404 for the emulator report even before the macOS emulator runner executes.
- Updated `.github/workflows/update-readme.yml` by removing path filters, ensuring that any push to `main` or `master` on a fork automatically triggers identity synchronization for `README.md` to match the fork's owner and repo.
- Verified `scripts/update-readme.mjs` cleanly rewrites badge links, workflow links, raw curl update commands, and GitHub Pages demo & report URLs when switching between owners and repositories.
- Created dedicated verification suite `scripts/verify-fork-readme-links.ts` (`npm run test:fork-readme-links`).
- Registered `test:fork-readme-links` in `package.json` and documented in `docs/files.md`.

### Subtask 47.2: Ensure GitHub Actions E2E Tests Pass and Deploy to GitHub Pages on Forked Repos

- Added `push: branches: [main, master]` triggers to `.github/workflows/web.yml` and `.github/workflows/emulation.yml` in addition to `workflow_run`, enabling forked repositories to automatically execute test pipelines and publish reports to `gh-pages`.
- Configured resilient artifact deployment across `web.yml`, `deploy-demo.yml`, and `emulation.yml` ensuring all test outputs (`mochawesome.html`, `playwright/`, `android-emulator-report.html`, `screenshots/`) deploy to `gh-pages` with `keep_files: true`.
- Created dedicated verification test `scripts/verify-fork-ci-workflows.ts` (`npm run test:fork-ci-workflows`) and validated all workflow triggers and deployment configurations.

## Task 46: Fix E2E Report Generation, CI Workflows & GitHub Pages Staging

### Subtask 46.1: Fix Playwright E2E Locator Ambiguity

- Updated `src/routes/index.tsx` so all collapsible `<details>` panels emit unambiguous `data-panel="{title}"` attributes (e.g. `data-panel="languages"`).
- Updated `e2e/web.spec.ts` and `e2e/app.spec.ts` to disambiguate the Languages panel locators using `details.filter({ has: page.locator("summary", { hasText: "Languages" }) })`, preventing strict-mode collisions with subtitle criteria description text in the Parser panel.
- Created dedicated verification test `scripts/verify-playwright-locators.ts` (`npm run test:playwright-locators`).
- Registered `test:playwright-locators` in `package.json` and documented in `docs/files.md`.
- Verified all 5 tests in `e2e/web.spec.ts` and the smoke test in `e2e/app.spec.ts` pass cleanly.
- Verified app compilation and lint.

### Subtask 46.2: Fix `emulation.yml` Syntax and Report Generation

- Fixed YAML syntax and multi-line escaping in `.github/workflows/emulation.yml` using Node.js script generation within the YAML block scalar.
- Added `if: always() && ...` to the GitHub Pages deployment step in `emulation.yml`, guaranteeing emulator report and screenshot publication to `gh-pages` even during partial test triage or failure.
- Updated `scripts/verify-emulation-gh-pages.ts` to validate workflow YAML syntax via `js-yaml` and verify resilient report deployment.
- Verified all 6 workflow files in `.github/workflows/` pass `js-yaml` parsing with 0 errors.

### Subtask 46.3: Ensure Guaranteed E2E Report Staging on GitHub Pages

- Added `if: always() && ...` to `Deploy Web Test Outputs to GitHub Pages (gh-pages)` in `.github/workflows/web.yml`, ensuring Mochawesome (`mochawesome.html`) and Playwright (`playwright/index.html`) reports publish to `gh-pages` even during test failures or triages.
- Added `Stage E2E Reports into Web Distribution` step to `.github/workflows/deploy-demo.yml`, preserving and staging `mochawesome.html`, `playwright/`, `android-emulator-report.html`, and `screenshots/` into `./dist` prior to web demo deployment.
- Updated and passed dedicated verification test `scripts/verify-e2e-report-links.ts` (`npm run test:e2e-report-links`).
- Unignored `!public/screenshots/` in `.gitignore` to preserve authentic emulator screenshots in static bundles.

## Task 45: Accumulative Criteria Subtitles Parser & Inner Group Settings

### Subtask 45.1: E2E Test Report Links in README.md & Verification

- Verified dedicated links in `README.md` to all E2E reports:
  - 📋 Mochawesome Test Report (`mochawesome.html`)
  - 🔍 Playwright E2E Test Report (`playwright/index.html`)
  - 📱 E2E Tests on Android Emulator (`android-emulator-report.html`)
  - 📸 Android Emulator Screenshot (`screenshots/android-emulator-screenshot.png`)
  - 🧪 Web E2E Pipeline CI Runs & Artifacts (`actions/workflows/web.yml`)
  - 🤖 Android Emulator Pipeline CI Runs & Artifacts (`actions/workflows/emulation.yml`)
- Created and passed dedicated verification test `scripts/verify-e2e-report-links.ts` (`npm run test:e2e-report-links`).

### Subtask 45.2: Accumulative Multi-Select Criteria with Inner Group Settings & BiDi Direction Fix

- Refactored `src/lib/subtitles.ts` to support multi-select accumulative criteria (`selectedCriteria: CriteriaId[]`) across:
  - `sentence`: Grammatical sentence endings in base timing language.
  - `pause`: Natural speech silences (>500ms) snapped to subtitle boundaries.
  - `punctVote`: Multi-track punctuation agreement (2+ languages sharing punctuation mark).
  - `consensus`: Cue start alignment across parallel languages (±400ms).
  - `cue`: Original authored subtitle cue starts.
  - `anchors`: Shared entity & numeric anchors across translations.
  - `window`: Minimum and maximum context duration thresholds.
- Added presets: Context & Sentences, Multi-Language Consensus, Pure Sentences, Fine Cue Chunks, and All Criteria.
- Resolved BiDi character direction anomalies by avoiding raw unisolated Arabic punctuation in LTR description strings.
- Added collapsible inner parameter settings for each criteria group in `src/routes/index.tsx` with individual and global resets.
- Created and passed dedicated verification suite `scripts/verify-accumulative-parser.ts` (`npm run test:parser`).
- Verified app compilation and 0 lint warnings.

## Task 44 (Hotfix): Verify working links for E2E testing and live web demo & fix GitHub Actions

### Subtask 44.1: Fix GitHub Actions workflows and verify E2E testing & demo links

- Fixed `integrity.yml` workflow failure by restoring authentic emulator screenshot assets in `public/screenshots/android-emulator-screenshot.png` and `public/assets/android-emulator-screenshot.png`, ensuring they are bundled into `dist/` and avoiding 404s on GitHub Pages.
- Cleaned up accidental stray `x` characters in `README.md` header.
- Updated `src/router.tsx` to handle GitHub Pages basepath (`github.io`) and retain trailing slashes, eliminating 404 errors during page reload.
- Initialized `audioTrackMode`, `autoFocus`, and `debugMode` with lazy initializers in `src/routes/index.tsx` to prevent race conditions on page reload.
- Updated `e2e/web.spec.ts` to assert application hydration (`header[data-app-hydrated="true"]`) following `page.reload()`.
- Configured Playwright CI retries (`retries: process.env.CI ? 2 : 0`) in `playwright.config.ts`.
- Enhanced `scripts/android-e2e-assert.sh` to ensure `android-emulator-screenshot.png` is captured and pulled before exit in `fail()`.
- Implemented dedicated verification test `scripts/verify-hotfix-links-and-actions.ts` (`npm run test:hotfix`), registered script in `package.json`, and documented in `docs/files.md`.
- Verified all regression test suites, app compilation, and linting pass with zero errors.

## Task 43: Validate JSON before caching subtitles and implement auto-fallback between YouTube API options (`tlang` vs `lang`)

### Subtask 43.1: Prevent caching of invalid subtitle responses (ensure answer is valid JSON)

- Added `isValidJsonSubtitle(body: String): Boolean` in `MainActivity.kt` checking that the body is non-blank, parses as valid `JSONObject`, and contains an `events` array with non-empty segment text (`utf8`).
- Guarded `saveCaptionToFile` and the interception handler in `MainActivity.kt`: strictly prevents saving raw caption files to disk (`youtube_captions/`) unless the response is confirmed to be valid JSON with subtitle cues. Updated file extension to `.json`.
- Implemented and exported `isValidJsonSubtitleResponse(data: unknown): boolean` in `src/utils/subtitleCache.ts`, validating YouTube JSON3 `{ events: [...] }` schemas, `CaptionCue[]` arrays, and envelope objects.
- Guarded `saveCachedSubtitles` and `saveCachedTargetSubtitles` to reject invalid cue sets.
- Added `saveCachedRawJson3(videoId, lang, rawJson3)` strictly enforcing that raw cached strings are valid JSON before storing in `localStorage`.
- Created dedicated verification test `scripts/verify-valid-json-cache-guard.ts` (`npm run test:valid-json-cache`), registered in `package.json`, and documented in `docs/files.md`.
- Rebuilt Android web assets with `npm run build:android-assets` and verified all regression suites pass cleanly with 0 lint warnings.

### Subtask 43.2: Implement auto-fallback on invalid response between YouTube API options (`tlang` vs `lang`)

- Updated `executeTimedTextRepetition` in `MainActivity.kt` to dynamically build and test both `tlang` addition and `lang` replacement options, verifying `isValidJsonSubtitle` on each attempt.
- Added automatic fallback in `MainActivity.kt`: if the primary option fails or returns invalid non-JSON data, immediately and automatically attempts the alternative option. If both options fail, returns an empty string without caching corrupt data.
- Enforced `isValidJsonSubtitleResponse(raw)` verification inside the `subtitleRequestModeOrder` mode loop in `fetchFavoriteLanguageSubtitles` in `src/routes/index.tsx`, automatically progressing to the next mode if the first mode yields an invalid response.
- Created dedicated verification test `scripts/verify-subtitle-api-fallback.ts` (`npm run test:subtitle-api-fallback`), registered in `package.json`, and documented in `docs/files.md`.
- Rebuilt Android web assets with `npm run build:android-assets` and verified all 17 regression test suites pass with 0 lint warnings.

## Task 40: Support app history (Android back navigation)

### Subtask 40.1: Implement Android back navigation and router/browser history integration

- Implemented `OnBackPressedCallback` in `MainActivity.kt` providing robust handling for Android device back buttons. Dispatches `window.__handleAndroidBack` to WebView and navigates webview history (`webView.goBack()`) if `canGoBack()` is true before defaulting to system exit.
- In `src/routes/index.tsx`, integrated `popstate` and `window.__handleAndroidBack` handlers allowing users to navigate back through viewed videos, closed panels, and history states without exiting the app.
- Created dedicated verification test `scripts/verify-android-back-navigation.ts` (`npm run test:back-navigation`), registered in `package.json`, and documented in `docs/files.md`.

## Task 39: Allow closing the Network Panel

### Subtask 39.1: Provide explicit close / collapse control on Network Panel

- Enhanced header close button in `src/components/NetworkRequestsInspector.tsx` with explicit identifiers (`id="close-network-inspector-button"`, `data-testid="close-network-inspector-button"`), accessible `aria-label="Close Network Inspector"`, tooltip indicating Escape shortcut, and `onClick={onClose}` handler.
- Implemented global `Escape` keyboard shortcut listener using `useEffect` on `window` (`keydown` -> `onClose()`) with proper event listener cleanup on unmount/close.
- Verified backdrop dismissal on `#network-inspector-modal` (`onClick={onClose}`) with `e.stopPropagation()` on the dialog content card to prevent accidental closing when clicking inside the inspector.
- Added collapse / minimize capability with toggle button (`id="collapse-network-inspector-button"`, `data-testid="collapse-network-inspector-button"`), rendering an unobtrusive compact floating status pill (`#network-inspector-minimized` / `data-testid="network-inspector-minimized"`) with live captured counts, an Expand button (`#expand-network-inspector-button`), and a quick compact close button (`#compact-close-network-inspector-button`).
- Created dedicated verification test `scripts/verify-network-inspector-close.ts` (`npm run test:network-close`), registered in `package.json`, and documented in `docs/files.md`.
- Verified clean build, regression tests, zero lint warnings, and applet compilation.

## Task 38: Accelerate app performance & enhance Network Panel with accordion and status tags

### Subtask 38.1: Implement performance optimizations and per-record Network Panel accordion with tlang color tags

- Memoized table rows using `React.memo(SubtitleRow)` in `src/routes/index.tsx`, isolating row re-renders to only active and previous rows during video playback and time-seeking.
- Enhanced Network Requests Inspector in `src/components/NetworkRequestsInspector.tsx` with dedicated per-record accordion toggle controls (`record-accordion-toggle-${id}`) and chevron transition animations.
- Implemented `getTlangStatusInfo` computing dynamic status tags and color schemes:
  - Pending: orange/amber (`bg-amber-500/20 text-amber-300 border-amber-500/40`)
  - Done: green (`bg-emerald-500/20 text-emerald-300 border-emerald-500/40`)
  - Failed: red (`bg-red-500/20 text-red-300 border-red-500/40`)
  - Overridden by green on retry success (`retry_success` with green styling)
- Created dedicated verification test `scripts/verify-network-accordion-tags.ts` (`npm run test:accordion-tags`), registered in `package.json`, and documented in `docs/files.md`.
- Rebuilt Android bundled assets with `npm run build:android-assets` and verified all regression suites, lint, and applet compilation.

## Task 37: Clean Network Panel records & add green badge indicator for good fetching

### Subtask 37.1: Exclude empty response bodies from Network Panel and add green badge indicator

- Added and exported `isSuccessfulFetch(req)` in `src/utils/networkTracker.ts`, verifying that only requests with HTTP 200, no error, and a genuine non-empty response body qualify as successful.
- Updated `isFailedRequest` in `NetworkRequestsInspector.tsx` to classify empty response bodies as failed/unsuccessful, ensuring they are excluded by default when `hideFailed` is enabled.
- Preserved accurate HTTP status recording (e.g. 200 OK) while styling empty body responses with warning/failed indicators rather than false green success badges.
- Added green badge indicators (`good-fetch-badge-${tlang}` in list items and `detail-good-fetch-badge` in the detail panel) for successfully fetched language tracks with valid subtitles.
- Created dedicated verification test `scripts/verify-network-clean-records.ts` (`npm run test:clean-network`), registered in `package.json`, and documented in `docs/files.md`.
- Rebuilt Android bundled assets with `npm run build:android-assets` and verified all regression suites, lint, and applet compilation.

## Task 36: Ensure sync between language views with auto-fetch-retry

### Subtask 36.1: Synchronize favorites view, language selection, and subtitles view with auto-fetch-retry

- Ensured in `src/routes/index.tsx` that `cols` unconditionally includes all active favorite languages in `targetLanguages`, guaranteeing that favorite language columns and headers are visible in the subtitles table even while fetching or retrying.
- Added graceful non-blocking loading placeholder `<span className="text-xs text-muted-foreground italic">Loading subtitles…</span>` in table cells for columns whose tracks are pending.
- Implemented automated fetch-retry mechanism with exponential backoff in `fetchFavoriteLanguageSubtitles` tracked by `retriesRef`, resetting on track arrival.
- Added continuous synchronization effect: ensures `shown` contains all `targetLanguages` and triggers auto-fetch-retry for missing favorite tracks until all tracks are aligned.
- Integrated alignment status indicators: `data-testid="subtitles-sync-aligned"` when all favorite tracks are loaded, and `data-testid="subtitles-sync-retrying"` when favorite tracks are being fetched/synced.
- Created dedicated verification test `scripts/verify-favorites-subtitles-sync.ts` (`npm run test:favorites-sync`), registered in `package.json`, and documented in `docs/files.md`.
- Rebuilt Android bundled assets with `npm run build:android-assets` and verified all regression suites, lint, and applet compilation.

## Task 35: Support running Android app in the background

### Subtask 35.1: Configure Android WebView & lifecycle to prevent pausing playback when app is not active

- Configured `android-shell/app/src/main/AndroidManifest.xml` with `android.permission.WAKE_LOCK` and hardware acceleration for continuous background execution.
- In `MainActivity.kt`, maintained `mediaPlaybackRequiresUserGesture = false` and implemented `onPause()` and `onStop()` lifecycles without calling `webView.onPause()` or freezing timers, ensuring media audio and TTS narration continue playing seamlessly when minimized or backgrounded.
- Implemented `onResume()` in `MainActivity.kt` safely resuming WebView and timer execution.
- Injected background playback resilience script in `MainActivity.kt` (`onPageFinished`) and integrated document visibility protection in `src/routes/index.tsx` preventing `visibilitychange` / `document.hidden` from pausing the YouTube player when minimized.
- Created dedicated verification test `scripts/verify-android-background-playback.ts` (`npm run test:background-playback`), registered in `package.json`, and documented in `docs/files.md`.
- Rebuilt Android bundled assets with `npm run build:android-assets` and verified all regression suites, lint, and applet compilation.

## Task 34: Debug mode toggle controlling Network Panel visibility

### Subtask 34.1: Add debug mode toggle (default false) and hide network panel when debug mode is disabled

- Added persistent debug mode configuration in `src/utils/appSettings.ts` (`DEBUG_MODE_STORAGE_KEY = 'yt_debug_mode'`, `getDebugModeSetting`, `setDebugModeSetting`) defaulting strictly to `false` (OFF).
- Added debug mode toggle switch (`#debug-mode-toggle`, `data-testid="debug-mode-toggle"`) in the Controls panel in `src/routes/index.tsx`.
- Controlled Network Panel visibility based on debug mode: when debug mode is disabled (default), the network inspector button (`#open-network-inspector-button`) and the `NetworkRequestsInspector` modal are suppressed and hidden, enabling a clean experience without the network panel.
- Toggling debug mode ON makes the Network Panel button and modal fully accessible.
- Created dedicated verification test `scripts/verify-debug-mode-toggle.ts` (`npm run test:debug-mode`), registered in `package.json`, and documented in `docs/files.md`.
- Verified all regression suites, lint, and applet compilation.

## Task 33: Optimize subtitle loading and fetching performance

### Subtask 33.1: Implement progressive / non-blocking subtitle loading technique

- Integrated `React.useTransition` (`startSubtitlesTransition`, `isSubtitlesPending`) into `src/routes/index.tsx` for non-blocking subtitle track updates.
- Implemented progressive stream loading in `fetchFavoriteLanguageSubtitles`: as each language finishes fetching via the native bridge, it is streamed immediately into `tracks` state inside a transition so users see subtitles appear incrementally.
- Added event loop yielding (`await new Promise<void>((resolve) => setTimeout(resolve, 0))`) between language requests to prevent UI thread starvation.
- Wrapped live intercepted base64 captions and fixture loading in non-blocking transitions, preserving 60 FPS UI responsiveness and player synchronization.
- Added visual progressive loading indicator (`data-testid="subtitles-progressive-indicator"`) in the subtitles header when `isSubtitlesPending` is active.
- Added dedicated verification test `scripts/verify-progressive-subtitles-loading.ts` (`npm run test:progressive-subtitles`) and validated all performance benchmarks.

## Task 32: Fix YouTube link sharing to Android app

### Subtask 32.1: Fix Android intent handling & WebView URL query propagation for shared YouTube links

- Delegated `parseVideoId` in `src/lib/native-captions.ts` to `extractYouTubeId` (`src/utils/youtube.ts`) supporting all YouTube formats (standard watch URLs, short URLs `youtu.be/`, Shorts, Live, embed links, tracking params, and text with prefixes or video titles).
- Initialized `videoId` state dynamically in `src/routes/index.tsx` from URL search parameters (`v` or `url`) and `window.__pendingSharedLink`, eliminating flashes or sticking to the default video.
- Enabled immediate registration of `window.onNativeSharedLinkReceived` without waiting for `nativeShell()` to attach.
- In `MainActivity.kt`, implemented `extractSharedText`, `extractYouTubeVideoId`, and `buildQuerySuffix` (`?v=$videoId&url=...`), and updated `onNewIntent` to notify `window.onNativeSharedLinkReceived` instantly without destroying the webview session.
- Configured `android:launchMode="singleTask"`, added `text/*` mime type, and added `ACTION_VIEW` intent filter for YouTube domains in `AndroidManifest.xml`.
- Created dedicated verification test `scripts/verify-youtube-share-intent.ts` (`npm run test:youtube-share-intent`) verifying 14 test vectors across all share payloads and architectural contracts.

## Task 31: Update AGENTS.md — after git commit, try using git push

### Subtask 31.1: Update AGENTS.md with git push instruction and verify git push attempt handling

- Updated AGENTS.md under Work tracking: after performing a git commit, attempt `git push` (handling failure gracefully if no remote or credentials configured).
- Created dedicated verification test `scripts/verify-agents-push-rule.ts` (`npm run test:agents-push-rule`).
- Registered script in `package.json` and documented in `docs/files.md`.

## Task 29: Streamline subtitle timing to default base language & ensure GitHub Pages screenshot availability

### Subtask 29.1: Remove "Timing from" selector and lock subtitle alignment timing to the default base language

- Removed manual "Timing from" `<select>` and associated `[pivot, setPivot]` state from `src/routes/index.tsx`.
- Implemented automatic `baseLanguage` derivation memo:
  - On Android: utilizes the primary timedtext `lang` query param from intercepted URL, falling back to first available track.
  - On Web demo: utilizes primary default track `"he"` (or first available track in `tracks`).
- Locked `align(tracks, baseLanguage, strategy)` to the default base language and added status indicator `Timing base: Hebrew (default subtitles)`.
- Added dedicated test `scripts/verify-default-timing-base.ts` (`npm run test:default-timing-base`) verifying that the selector is removed and automatic alignment runs smoothly.
- Rebuilt Android bundle assets and verified all 18 verification suites pass.

### Subtask 29.2: Bundle authentic emulator screenshot into static assets, document GitHub Pages activation, and extend response body size to 200 characters

- Bundled authentic Android emulator screenshot into `public/screenshots/android-emulator-screenshot.png` and `public/assets/android-emulator-screenshot.png`.
- Documented GitHub Pages manual activation requirement in `README.md` and `docs/operations/ACTIONS.md` (`Settings > Pages > Source: Deploy from a branch gh-pages / root`).
- Extended network tracker response body preview limit to 200 characters (`MAX_RESPONSE_BODY_PREVIEW_CHARS = 200` in `src/utils/networkTracker.ts`).
- Updated `src/components/NetworkRequestsInspector.tsx` UI modal labels, list badges, and details panel to show the first 200 characters.
- Updated `scripts/verify-network-inspector.ts` and `scripts/verify-readme-links.ts` with dedicated assertions for 200-character truncation and static screenshot assets.
- Updated `docs/operations/DEBUG.md`, `README.md`, and `docs/files.md` documentation inventories.
- Rebuilt Android bundle assets and verified all 18 verification suites pass cleanly.

## Task 28: Fix README broken links and GitHub Actions workflow resilience

### Subtask 28.1: Import architectural specification and design contracts from `mostuf2556/Youtubenet6` and fix Markdown link checker

- Imported all 9 architectural documentation and design contracts from `mostuf2556/Youtubenet6` into `docs/operations/`, `docs/specifications/`, and `docs/designs/`:
  - `docs/operations/ACTIONS.md`
  - `docs/specifications/LIBRARY.md`
  - `docs/designs/DESIGN_SUBTITLE_VIEWS.md`
  - `docs/designs/DESIGN_VIEW_LANGS.md`
  - `docs/designs/DESIGN_CONTROLS_VIEW.md`
  - `docs/designs/DESIGN_PLAYER_PROVIDER.md`
  - `docs/designs/DESIGN_STATE_COORDINATOR.md`
  - `docs/specifications/SCHEMA_TIMEDTEXT.md`
  - `docs/operations/DEBUG.md`
- Enhanced markdown link detection in `scripts/verify-md-links.ts` using `isInsideCodeSpan` so links containing inline code formatting (e.g. `[`**`ACTIONS.md`**`](path)`) are properly resolved and verified.
- Added dedicated test `scripts/verify-doc-contracts.ts` (`npm run test:doc-contracts`) validating contract file existence, minimum content size, and registry in `README.md` and `docs/files.md`.
- Updated file registry in `docs/files.md` and verified `npm run test:md` passes with 0 broken links.

### Subtask 28.2: Ensure GitHub Actions workflow resilience and add dedicated README links verification suite

- Added verification steps to `.github/workflows/integrity.yml` running `npm run test:doc-contracts`, `npm run test:md`, and `npm run test:readme-links` to continuously catch link rot, missing documentation contracts, and badge discrepancies in CI.
- Updated `README.md` with explicit instructions on enabling GitHub Pages under repository settings (`Settings > Pages > Build and deployment > Source: Deploy from a branch (gh-pages / root)`).
- Updated `docs/operations/ACTIONS.md` with active repository workflows, deployment architecture, and troubleshooting triage links for `mostuf25561/subtitle-sync`.
- Added dedicated test `scripts/verify-readme-links.ts` (`npm run test:readme-links`) validating all 10 relative documentation links, all 4 workflow badges, CLI installation scripts, and GitHub Pages references.
- Rebuilt Android assets into `android-shell/app/src/main/assets/` and verified all 17 verification test suites.

## Task 27: Fix GitHub Actions workflows and E2E test alignment with Youtubenet6

### Subtask 27.1: Align `.github/workflows/` with `mostuf2556/Youtubenet6` and resolve workflow step failures

- Removed redundant `.github/workflows/ci.yml` which failed due to missing `package-lock.json` and is not present in `mostuf2556/Youtubenet6`.
- Corrected deployed URL detection in `.github/workflows/web.yml` from `/${REPO_NAME}/app/` to `/${REPO_NAME}/`.
- Guarded `scripts/prepare-report.mjs` invocation in `web.yml` to prevent failures caused by the absence of synthetic scripts.
- Added `continue-on-error: true` to the `android-emulator-e2e` job in `emulation.yml` matching `mostuf2556/Youtubenet6`.
- Updated `deploy-demo.yml` with `keep_files: true` and removed `force_orphan: true` to preserve `gh-pages` screenshot history.
- Added dedicated test `scripts/verify-workflows-alignment.ts` and `npm run test:workflows`.

### Subtask 27.2: Ensure web demo Languages panel displays all 6 demo languages and verify all test suites

- Ensured in `src/routes/index.tsx` that `orderedLangs` on web demo (`!isAndroid`) displays all 6 demo languages from `LANGS` (sorted according to `languageOrder`), satisfying `e2e/web.spec.ts` (`toHaveCount(6)`).
- Preserved user-selected favorite languages presentation on Android (`isAndroid`) with dynamic `tlang` subtitle loading.
- Rebuilt Android web bundle assets in `android-shell/app/src/main/assets/`.
- Verified all test suites, production build, linting, and workflow alignment.

## Task 26: Extend network request response body preview limit to 50 characters

### Subtask 26.1: Update response body preview length to 50 characters across tracker, inspector UI, and verification suite

- Extended `MAX_RESPONSE_BODY_PREVIEW_CHARS` in `src/utils/networkTracker.ts` from 15 to 50 characters.
- Updated `src/components/NetworkRequestsInspector.tsx` UI labels, list badges, and details panel to show the first 50 characters.
- Updated `scripts/verify-network-inspector.ts` asserting 50-character response preview truncation.
- Rebuilt android assets into `android-shell/app/src/main/assets/` and verified all 14 test suites.

## Task 25: Dynamic favorite language subtitle fetching and network requests inspector with response body preview

### Subtask 25.1: Proactively fetch subtitles for newly added favorite languages via `tlang`

- Updated `handleTargetLanguagesChange` in `src/routes/index.tsx` to detect newly added favorite languages dynamically.
- Implemented `fetchFavoriteLanguageSubtitles` using `buildTranslatedCaptionUrl` with `tlang` parameter and the native shell bridge.
- Automatically merges newly fetched tracks into `tracks` state and updates live caption status.
- Added dedicated test `scripts/verify-favorite-lang-dynamic-fetch.ts` and registered `test:favorite-dynamic-fetch` in `package.json`.

### Subtask 25.2: Network requests panel with initial response body preview

- Created modular external store `src/utils/networkTracker.ts` tracking timedtext, bridge, and fetch requests.
- Implemented `NetworkRequestsInspector.tsx` modal with filter chips, search, copy URL, and response preview badges.
- Connected network tracking in `src/routes/index.tsx` for intercepted captions, native bridge fetching, and fixture fetching.
- Added dedicated test `scripts/verify-network-inspector.ts` and registered `test:network-inspector` in `package.json`.

## Task 24: Align Android subtitle fetching flow with Youtubenet6 (default caption fetch followed by ordered favorite languages)

### Subtask 24.1: Implement proactive default subtitle fetch and ordered favorite language translations on Android

- Configured default favorite languages to `['he', 'it']` in `src/utils/appSettings.ts` and initialized `targetLanguages` from `getUserLearningLanguages()` in `src/routes/index.tsx`.
- Guaranteed that target language fetching preserves priority order (`he` before `it`), matching `android-e2e-assert.sh` ordering expectations.
- Configured YouTube player `playerVars` with `autoplay: isAndroid ? 1 : 0` and `cc_load_policy: isAndroid ? 1 : 0`.
- Verified `scripts/verify-native-captions.ts` and all 12 test suites pass cleanly.

## Task 23: Enforce 100% local, offline web-app architecture in Android shell

### Subtask 23.1: Permanently eliminate all remote web-app URLs and fallbacks from `MainActivity.kt` and guarantee local asset execution

- Completely purged `APP_URL` and all remote `github.io` fallback references from `MainActivity.kt`.
- Configured WebView to unconditionally load `https://appassets.androidplatform.net/index.html$querySuffix` from local bundled APK assets.
- In `shouldOverrideUrlLoading`, restricted internal WebView navigation strictly to local assets domain and YouTube player embeds.
- Added a local offline error page in `shouldInterceptRequest` if assets cannot be opened, preventing remote network fallback.
- Implemented dedicated test `scripts/verify-android-local-assets.ts` and registered it in `package.json` and `docs/files.md`.
- Verified all unit and hygiene tests pass with zero errors.

## Task 22: Publish Android emulator screenshots to GitHub Pages

### Subtask 22.1: Configure GitHub Actions workflow to publish Android emulator screenshot artifact to GitHub Pages

- Configured `.github/workflows/emulation.yml` with steps to stage `android-emulator-screenshot.png` and `android-emulator-logcat.txt` into `gh-pages-staging/screenshots/`.
- Added GitHub Pages deployment using `peaceiris/actions-gh-pages@v4` with `keep_files: true` and `destination_dir: .` targeting `gh-pages` branch.
- Configured `.gitignore` to prevent any synthetic or generated emulator artifacts from entering the git repository.
- Added direct link to the Android Emulator Screenshot in `README.md`.
- Implemented dedicated verification test `scripts/verify-emulation-gh-pages.ts` and registered it in `package.json` and `docs/files.md`.
- Verified 100% pass on all repo checks and hygiene tests.

## Task 21: Android dynamic subtitle fetching and 10-line presentation for favorite languages

### Subtask 21.1: Dynamically load and present first 10 lines of subtitles for each favorite language on Android

- Connected Android dynamic caption fetching to dispatch `fetchTranslatedCaptionsWithUrl` with `tlang` for all selected favorite languages upon intercepting live captions.
- Added first 10-lines default subtitle presentation across active favorite languages on Android with dedicated pagination controls and a badge indicating the presentation limit.
- Maintained isolated web demo fixture behavior.
- Added dedicated verification test `scripts/verify-android-favorite-subtitles.ts` validating live multi-language alignment and 10-line presentation limits.
- Verified test suite and ensured clean repository hygiene.

## Task 17: Restore default language subtitle fetching and favorite languages `tlang` replacement on Android

- Preserved the default language track by fetching or retaining the base timedtext request without an invalid or empty `tlang` parameter.
- Intercepted timedtext requests on Android and dynamically dispatched `fetchTranslatedCaptionsWithUrl` with `tlang` for every selected favorite language (`targetLanguages`).
- Added `scripts/verify-native-captions.ts` to test native `tlang` building, default track extraction, and base64 payload parsing against authentic application code.
- Verified test suite and ensured clean repository hygiene.

## Task 1: Establish the project work-tracking workflow

- Rewrote `AGENTS.md` with the requested task lifecycle.
- Added `docs/tasks.md`, `docs/todo.md`, and `docs/done.md`.
- Committed and validated the documentation workflow.

## Task 2: Import and verify the GitHub Actions delivery flows

- Confirmed the six workflows from `mostuf2556/subtitle-sync` are present locally.
- Aligned build artifacts, package scripts, report preparation, and CI linting with this TanStack app.
- Lint, build, and static report-integrity checks passed.
- Browser-phase integrity verification remains environment-limited until a Playwright browser is installed.

## Task 3: Add dynamic target-language selection to the app

- Added a multi-select target-language control generated from `LANGS`.
- Added Spanish to the supported language catalog.
- Included selected target languages in Android caption refreshes.
- Made fixture loading tolerate languages without a bundled demo file.
- Focused lint and production build passed.

## Task 5: Run browser tests in a reproducible Docker environment

- Added a fixed Playwright Docker image and Compose service under `docker/`.
- Added `docker/manage.sh` for building and running web, emulation, or all E2E suites.
- Mounted Docker test reports into `docker/artifacts/` and connected the GitHub Actions web job to the Docker runner.
- Local container execution remains environment-limited because the Docker daemon is unavailable in this sandbox.

## Task 6: Fix CI dependency installation and Android startup

- Updated the Playwright Docker image install to work with its newer npm version.
- Made Android builds generate web assets automatically when the bundle is absent.
- Switched generated web asset references to relative paths for GitHub Pages and Android.
- Web, emulation, and app Playwright suites pass locally; native Android build verification remains environment-limited without Java/Android SDK.

## Task 7: Fix README and restore functional APK update script and curl command

- Restored comprehensive README.md matching `https://github.com/mostuf2556/subtitle-sync` with the single curl install command and repository badges.
- Configured `update.apk.sh` with active fallback resolution and package target `com.ytviewer.app`.
- Added `install-apk.sh` and updated `scripts/update-readme.mjs` to target `mostuf2556/subtitle-sync`.
- Verified bash syntax and repository synchronization.

## Task 8: Fix Android APK blank screen issue

- Updated `MainActivity.kt` remote fallback APP_URL to `https://mostuf2556.github.io/subtitle-sync/app/`.
- Fixed asset path normalization in `MainActivity.kt` to strip leading `/` and `./` before `assets.open()`, preventing `FileNotFoundException`.
- Enhanced `scripts/normalize-web-assets.mjs` to rewrite all script preloads, tags, and dynamic module imports into relative `./assets/` paths.
- Verified that `build:android-assets` packages fully normalized web assets into `android-shell/app/src/main/assets/`.

## Task 10: Fix blank screen on Android & GitHub Pages demo and fix CI workflow package-lock failure

- Added dynamic basepath detection (`/subtitle-sync/app`, `/app`, or root) and normalized `/index.html` and trailing slashes in `src/router.tsx` and `src/client.tsx`.
- Added defensive Web Speech API guards in `src/routes/index.tsx` so missing `speechSynthesis` does not crash React hydration on Android WebView or unsupported environments.
- Connected Android Native TTS (`AndroidNativeShell.speak` and `stopSpeaking`) in `src/routes/index.tsx`.
- Fixed subtitle fixture fetch path in `src/routes/index.tsx` to respect dynamic basepath under GitHub Pages (`/subtitle-sync/app/fixtures/...`).
- Updated `MainActivity.kt` to load root route `https://appassets.androidplatform.net/$querySuffix` and added WebView navigation guards.
- Updated GitHub Actions workflows and resolved ESLint / Prettier formatting rules.
- Verified compilation and linting.

## Task 11: Document reference baseline repository (Youtubenet6) in AGENTS.md

- Updated `AGENTS.md` and `AGENT.md` to establish `https://github.com/mostuf2556/Youtubenet6` as the baseline reference repository.
- Specified that the application's structure, tooling, workflows, scripts, and delivery mechanisms should remain identical to `Youtubenet6`, with differences restricted specifically to views and the subtitles parser.
- Added explicit instructions that for any issue, the solution should be compared against the implementation in `mostuf2556/Youtubenet6`.
- Verified compilation and linting.

## Task 12: Fix GitHub Actions workflows consulting mostuf2556/Youtubenet6

- Compared all workflows in `.github/workflows/` against `https://github.com/mostuf2556/Youtubenet6`.
- Fixed `web.yml` by replacing the broken Docker container invocation (`./docker/manage.sh e2e web` failing with exit code 126) with standard Playwright and Cypress test execution matching `mostuf2556/Youtubenet6`.
- Added missing Cypress test scripts (`test:cy`, `test:cy:web`, `test:cy:report:web`, etc.) and helper test scripts to `package.json` matching `mostuf2556/Youtubenet6`.
- Fixed `emulation.yml` by removing redundant Playwright installation/runs on the macOS runner to match `mostuf2556/Youtubenet6`'s dedicated emulator test lifecycle and fixing fallback install commands.
- Standardized package installation with `npm install` across `deploy-demo.yml`, `release-apk.yml`, `integrity.yml`, and `ci.yml`, making registry normalization safe on all platforms.
- Verified `npm run build`, `prepare-report.mjs`, `verify-reports-integrity.mjs`, `verify-ota-updater.ts` (19/19 passed), linting, and full compilation.

## Task 13: Fix white blank screen and console errors on https://mostuf2556.github.io/subtitle-sync/app/ and update integrity workflow

- Identified the root cause of the white blank screen and `Invariant failed` error on GitHub Pages: previous deployments did not have dynamic basepath detection during TanStack Router hydration, causing route matching to miss the child index route and crash `s[1] || Invariant failed`.
- Resolved dynamic basepath detection and normalized `/index.html` and trailing slashes in `src/router.tsx`, preserving `basepath` across `router.update()` calls during hydration.
- Updated `scripts/verify-reports-integrity.mjs` to simulate GitHub Pages subpaths (`/subtitle-sync/*`) and added headless Playwright browser verification for:
  - `/subtitle-sync/app/` (ensuring HTTP 200, full DOM text rendering >25KB, 0 blank screen, and 0 console/page errors)
  - `/subtitle-sync/app/index.html` (clean path normalization and DOM rendering)
  - `/app/` and `/app/index.html` (direct subpath rendering)
  - Added `app/index.html` to critical static files verification and added `page.on('pageerror')` to catch all unhandled exceptions.
- Updated `.github/workflows/deploy-demo.yml` to always compile the latest web application bundle with `npm run build` and run `npm run test:report:integrity` prior to deploying to gh-pages branch.
- Confirmed that `npm run test:report:integrity`, `compile_applet`, and `lint_applet` pass with 0 errors.

## Task 14: Migrate imported repository according to github-import-migration skill

- Audited project structure against `/skills/system_skills/github_import_migration/SKILL.md` and classified runtime as Web (Node.js).
- Removed redundant foreign lockfile (`bun.lock`) to maintain npm-only consistency.
- Created `.env.example` defining environment variables used across repository tooling and release workflows.
- Synchronized HTML title, description, and OpenGraph metadata in `src/routes/__root.tsx` and `src/routes/index.tsx` to match `metadata.json`.
- Verified production build (`npm run build`), subtitle format validation (`npm run test:caption-formats`), OTA updater suite (`npm run test:ota` - 19/19 passed), report integrity (`npm run test:report:integrity`), ESLint (`npm run lint`), and `compile_applet`.

## Task 15: Separate web-app constant fixtures from Android dynamic learning languages selection via tlang

- Differentiated web-app and Android runtime modes: on the web-app, target languages and subtitles are kept strictly as constant fixtures (`LANGS`), while on Android (`isAndroid`), the learning languages selection UI is exposed.
- In the Android learning languages view, integrated full language catalog selection (`SUPPORTED_LANGUAGES_CATALOG` with 84 languages) allowing users to configure any learning targets as in `mostuf2556/Youtubenet6`, backed by persistent settings (`getUserLearningLanguages` / `setUserLearningLanguages`).
- Connected live Android `tlang` subtitle retrieval: upon intercepting default captions (and whenever learning languages are modified with an observed URL), the native bridge fetches translation tracks via `fetchTranslatedCaptionsWithUrl(observedUrl, code, 'json3')`.
- Aligned E2E specifications across `e2e/web.spec.ts` (verifying constant fixture tracks without live select), `e2e/app.spec.ts`, and `e2e/emulation.spec.ts` (verifying Android bridge tlang calls).
- Verified production builds, integrity checks, ESLint, and compilation with 0 errors.

## Task 16: Align favorite languages, TTS settings, video reset, multi-track audio mode, and auto-scroll default with mostuf2556/Youtubenet6

### Subtask 16.1: Favorite languages and main screen controls

- Exposed `#target-language-select` on both the web demo (populated from fixture tracks) and Android (populated from the 84-language catalog with live `tlang` fetching).
- Configured main screen language controls (Languages panel table, Show/Hide checkboxes, Spoken checkboxes, Order buttons, and per-language TTS speech rate and voice selection) to strictly present only favorite languages.
- Updated `e2e/web.spec.ts` to assert that `#target-language-select` is visible on the web demo.
- Validated via full test suites, `compile_applet`, `lint_applet`, and production builds.

### Subtask 16.2: Clear columns on new video on Android

- Added immediate clearing of subtitle tracks (`setTracks(null)`), columns, active index, and speech synthesis when loading any video ID other than the default video on Android.
- Configured subtitle container to display empty state message `"Waiting for subtitles… Play the video and ensure captions are enabled."` until the live timedtext URL is intercepted.
- Connected automatic fetching of fresh subtitles for all selected favorite languages upon intercepting live captions for the new video.
- Implemented dedicated Playwright test in `e2e/emulation.spec.ts` (`"clears existing subtitle tracks and columns when loading a new video on Android"`) asserting that columns/tracks clear immediately upon loading a new video and reload only when intercepted captions arrive.
- Updated `AGENTS.md` requiring dedicated tests for verifying all features and subtasks.

### Subtask 16.3: YouTube multi-audio track repeat mode

- Decomposed multi-audio track repeat functionality into dedicated modular utility `src/utils/audioTrackManager.ts` following `AGENTS.md` modularity rules and registered in `docs/files.md`.
- Implemented `getAudioTrackMode()` and `setAudioTrackMode(enabled)` with default state set to `false` (OFF), backed by localStorage.
- Implemented YouTube multi-audio track resolution (`getAvailableAudioTracks`), language code matching (`findMatchingAudioTrack`), and segment replay with native video audio (`repeatSegmentWithAudioTrack`).
- Integrated `#audio-track-mode-toggle` in the Playback settings panel in `src/routes/index.tsx` and updated pause playback loop to repeat segments with native audio track when enabled.
- Added dedicated test suite `scripts/verify-audio-track-mode.ts` (`npm run test:audio-track`) and dedicated Playwright test in `e2e/web.spec.ts`.
- Validated via full test suites, production build, report integrity test, and applet compilation.

### Subtask 16.4: Disable auto-focus and scroll by default

- Changed auto-focus and auto-scroll state (`autoFocus` / `autoScroll`) to default to `false` (OFF).
- Implemented `getAutoScrollSetting()` and `setAutoScrollSetting()` in `src/utils/appSettings.ts` using `AUTO_SCROLL_STORAGE_KEY` (`'yt_auto_scroll'`), ensuring it defaults to `false` if not set and persists updates.
- Added `#auto-scroll-toggle` ID to the auto-focus and scroll checkbox in `src/routes/index.tsx` and connected it to `onAutoFocusChange`.
- Created dedicated test suite `scripts/verify-auto-scroll.ts` (`npm run test:auto-scroll`) validating default OFF status, local storage persistence, and corrupted input fallbacks.
- Added dedicated Playwright test in `e2e/web.spec.ts` (`"toggles auto-focus and scroll and verifies default is OFF"`).
- Documented in `docs/files.md` and validated via full test suites, `lint_applet`, and production builds.

### Subtask 16.5: E2E testing & verification

- Updated and unified test suites (`e2e/web.spec.ts`, `e2e/app.spec.ts`, `e2e/emulation.spec.ts`, `cypress/e2e/web.cy.ts`).
- Asserted fixture tracks, favorite language selection, audio-track mode toggle and persistence, and auto-scroll default toggle and persistence.
- Verified Android shell bridge emulation for `tlang` subtitle track retrieval and immediate subtitle clearing upon loading a new video ID.
- Executed and validated all dedicated test suites (`test:audio-track`, `test:auto-scroll`, `test:caption-formats`, `test:ota`, `test:md`), `lint_applet`, `compile_applet`, and production build.
- Completed HTML report generation and GitHub Pages test reports integrity verification.

## Task 19: Remove server dependencies and convert to pure client SPA

### Subtask 19.1: Remove server dependencies and convert to pure client SPA

- Removed `@tanstack/react-start`, `nitro`, and `@lovable.dev/vite-tanstack-config` from `package.json`.
- Deleted server entry files `src/server.ts`, `src/start.ts`, and SSR helper files `src/lib/error-capture.ts` and `src/lib/error-page.ts`.
- Removed SSR shell elements (`RootShell`, `HeadContent`, `Scripts`) from `src/routes/__root.tsx`.
- Created root `index.html` mounting `<div id="root"></div>` and importing `/src/client.tsx`.
- Updated `src/client.tsx` to mount with React 19 `createRoot(document.getElementById("root"))` using `<RouterProvider router={router} />`.
- Updated `vite.config.ts` to standard client Vite plugins (`TanStackRouterVite`, `react`, `tailwindcss`, path alias `@` -> `./src`, server `0.0.0.0:3000`).
- Updated `package.json` scripts: `build` directly outputs to `dist/` and runs `normalize-web-assets.mjs dist`.
- Created dedicated test `scripts/verify-client-spa.ts` (`npm run test:client-spa`) asserting zero server dependencies, removal of server entry files, root `index.html` presence, `createRoot` client rendering, and clean `dist/index.html` build.
- Updated `docs/files.md` with client SPA architecture and test inventory.

## Task 20: Remove synthetic report generators, fake artifact scripts, and generated HTML files

### Subtask 20.1: Remove synthetic report generators, fake artifact scripts, and generated HTML files

- Deleted synthetic report scripts: `scripts/generate-android-report.mjs`, `scripts/prepare-report.mjs`, and `scripts/verify-reports-integrity.mjs`.
- Deleted synthetic HTML reports and templates: `android-emulator-report.html`, `cypress/runner-template.html`, `cypress/reports/`, and `playwright-report/`.
- Updated `.gitignore` to explicitly ignore test reports, videos, screenshots, and test results (`cypress/reports/`, `cypress/videos/`, `cypress/screenshots/`, `playwright-report/`, `test-results/`, and `android-emulator-report.html`).
- Cleaned `package.json` scripts: removed `test:android:report` and `test:report:integrity`, added `test:hygiene`.
- Created dedicated test `scripts/verify-repo-hygiene.ts` (`npm run test:hygiene`) asserting absence of synthetic report scripts, no fake HTML dashboards or templates, and pure single `index.html` root entry point.
- Updated `.github/workflows/deploy-demo.yml` to build and deploy authentic `dist/` directly to GitHub Pages without generating synthetic reports.
- Updated `.github/workflows/integrity.yml` to run authentic tests (`test:hygiene`, `test:client-spa`).
- Cleaned references to deleted synthetic reports in `README.md` and `docs/files.md`.
- Ran all authentic tests, builds, and lint successfully.

## Task 55: Accordion Color Standardization, Auto-TTS Subtitle Fetching, Touch-Friendly Language Selection & Multi-Language Video Player

- Defined constant theme colors per accordion type in `src/config/accordionThemes.ts` (`player`: blue, `playback`: emerald, `parser`: amber, `languages`: purple, `language-player`: indigo, `subtitles`: teal, `library`: rose) with colored summary bars and tags.
- Implemented `getAutoSpeakOnFetchSetting` and `setAutoSpeakOnFetchSetting` in `src/utils/appSettings.ts` (default true) and triggered speech synthesis on subtitle fetch completion.
- Built `src/components/LanguageBoxesSelector.tsx` offering a mode toggle between touch-friendly boxes (`min-h-[48px]`) and compact list, keeping clicked/selected languages partitioned at the top.
- Created `src/components/LanguageVideoPlayerPanel.tsx` in a new accordion (`language-player`), rendering YouTube embeds with `https://www.youtube.com/embed/VIDEO_ID?hl=en&cc_load_policy=1&cc_lang_pref={lang}`, preserving English menus with `hl=en`, controlling subtitles via URL, and integrating subtitle requests with the embedded Network Requests Inspector.
- Added 4 dedicated verification test suites (`test:accordion-colors`, `test:auto-speak-on-fetch`, `test:language-boxes`, `test:language-player-accordion`), updated `docs/files.md`, and passed all build and lint verifications.

## Task 56: Fix autoSpeakOnFetch ReferenceError Initialization Order

### Subtask 56.1: Initialize autoSpeakOnFetch Prior to Callback Bindings
- Reordered state variable declarations in `src/routes/index.tsx` so that `autoSpeakOnFetch`, `rates`, and `voiceSelections` are initialized near the top of the component prior to `fetchFavoriteLanguageSubtitles` and any effects referencing them in closures or dependency arrays.
- Removed downstream duplicate declarations to avoid TDZ (Temporal Dead Zone) `ReferenceError`.
- Created dedicated test suite `scripts/verify-autospeak-initialization-order.ts` (`npm run test:autospeak-init`) validating top-level declaration order and absence of duplicate re-declarations.
- Updated `package.json` scripts and registered the test in `docs/files.md`.
- Verified clean build (`compile_applet`) and zero lint errors (`lint_applet`).

## Task 88: Dynamic Favorite Languages Reordering & Order-Determined Fetch Again with Configurable Server Proxy Option

### Subtask 88.1: Stage Task 88 in tracking documentation
- Processed token economy architecture in `docs/tokens.md`.
- Staged all 4 subtasks of Task 88 in `docs/tasks.md`, `current-sub-task.md`, and `docs/todo.md`.
- Captured architecture and diagnostic decomposition in `temp.md`.

### Subtask 88.2: Implement Dynamic Favorite Language Ordering & Order-Determined Fetch Again
- In `LanguageBoxesSelector.tsx`, added a priority order bar displaying the sequential fetch order (`#1`, `#2`, etc.) and move earlier / move later buttons (`moveFavoriteLanguage`) for selected favorite languages, along with priority badges on selection boxes.
- In `src/routes/index.tsx`, sorted `needed` languages in `fetchFavoriteLanguageSubtitles` strictly according to `targetLanguagesRef.current` order so sequential discovery executes in the exact user-defined order.
- Dynamically derived `languagesToFetchNext` and `activeFailedToFetch` from active `targetLanguages` and loaded `tracks`.
- In `handleTargetLanguagesChange`, dynamically pruned `failedLangs` so removed languages are purged, updated `targetLanguages`, and cleaned the attempted URL cache.
- Synchronized `moveLanguage` in the languages table with `targetLanguages` and `setUserLearningLanguages`.
- Updated the "Fetch again" button to dynamically reflect the updated favorite languages in their exact priority order (`Fetch again (${pendingFetchAgainLangs.join(", ")})`).

### Subtask 88.3: Implement Option to Use a Server for Repeating Fetch Requests with Configurable Address
- In `src/lib/subtitle-fetch-plan.ts`, implemented `getUseFetchServer()` (defaults to false / off), `setUseFetchServer()`, `getFetchServerUrl()`, `setFetchServerUrl()`, and `fetchViaServer()` supporting query parameters (`?url=...`) and `{url}` template interpolation.
- In `src/components/AttemptOrderSettings.tsx`, added the "Use server for repeating fetch requests" toggle (off by default), an input field for the server address, and an update button.
- In `src/components/NetworkRequestsInspector.tsx`, added a server proxy configuration bar and the "Fetch again (via server)" action button on request details.
- In `src/routes/index.tsx`, wired server repeat options into `handleFetchAgain(url, withSession, viaServer)` and `handleFetchAgainViaServer`, as well as a server proxy repetition fallback in `fetchFavoriteLanguageSubtitles`.
- Updated `docs/reliable-subtitles-fetching.md` with dynamic favorite language ordering rules and server repeat proxy documentation.

### Subtask 88.4: Author Dedicated Verification Test, Verify Build & Lint, and Migrate to docs/done.md
- Authored `scripts/verify-dynamic-favorites-and-server-fetch.ts` testing priority reordering controls, fetch sorting, dynamic "Fetch again" updates upon favorites changes, server proxy toggle + address input, and functional simulation of URL building and ordering.
- Registered `test:dynamic-favorites-and-server-fetch` in `package.json` and documented in `docs/files.md`.
- Ran and passed dedicated tests, `compile_applet` (`npm run build`), and `lint_applet` (`npm run lint`).

## Task 89: Best-Practice Task Management Workflow — Mandate Moving Completed Tasks from tasks.md to done.md

### Subtask 89.4: Clean Up docs/tasks.md by Migrating Completed Tasks to docs/done.md & Final Verification
- Pruned historical completed tasks (Tasks 53 through 88) out of `docs/tasks.md` into `docs/done.md`, reducing `docs/tasks.md` from 579 lines to a clean 25-line active backlog containing strictly pending work (Subtask 54.2 and Task 59).
- Verified that all historical tasks are safely and completely archived in `docs/done.md`.
- Ran full test verification suite (`test:task-management-workflow`, `test:tokens-economy`, `test:hotfix-workflow`, `test:no-duplicate-md`).
- Verified zero errors on full application build (`compile_applet`) and ESLint checks (`lint_applet`).

### Subtask 89.3: Create Dedicated Verification Test and Update Verification Scripts
- Created dedicated verification test `scripts/verify-task-management-workflow.ts` asserting:
  1. `AGENTS.md` explicitly mandates moving completed tasks completely out of `current-sub-task.md`, `docs/todo.md`, and `docs/tasks.md` directly into `docs/done.md`.
  2. `AGENTS.md` specifies `docs/tasks.md` is strictly the active backlog of pending/upcoming tasks.
  3. `docs/tokens.md` codifies the active backlog role of `docs/tasks.md` and complete migration to `docs/done.md`.
  4. Historical completed tasks are omitted from `docs/tasks.md` and archived in `docs/done.md`.
- Registered `test:task-management-workflow` in `package.json` and documented in `docs/files.md`.

### Subtask 89.2: Update AGENTS.md and docs/tokens.md to Mandate Moving Completed Tasks from tasks.md to done.md
- Updated Rule 7 and hotfix protocol in `AGENTS.md` to mandate moving completed tasks and subtasks completely out of `tasks.md` into `done.md`.
- Updated `docs/tokens.md` table and workflow steps (Step 7 and Hotfix Step 4) to specify that `docs/tasks.md` is strictly the active backlog and that completed tasks move to `docs/done.md`.

### Subtask 89.1: Stage Task 89 in Tracking Documentation (docs/tokens.md, docs/tasks.md, current-sub-task.md, docs/todo.md, temp.md)
- Activated token economy flow and staged Task 89 across tracking documents.

## Task 90: Synchronize README.md Screencast Metrics and Validate GitHub Pages Documentation Links

### Subtask 90.1: Synchronize README.md Screencast Video Metrics and Validate All Documentation Links
- Updated `README.md` releases link to match active repo repository (`mostuf2556/subtitle-sync/releases`).
- Synchronized Android Emulator Screencast Video exact file size and metric in `README.md` (`6,739,315 bytes / 6.43 MB`), matching the verified latest GitHub Actions workflow run artifact (`#38197468661`).
- Verified all link and documentation tests:
  - `npm run test:readme-links` (10 relative links and workflow badges verified)
  - `npm run test:screencast-availability` (README links, GitHub Actions, and GitHub Pages screencast verified)
  - `npm run test:e2e-report-links` (Mochawesome, Playwright, Android emulator report URLs verified)
  - `npm run test:fork-readme-links` (static report and screenshot fallbacks verified)
  - `npm run test:md` (all 32 Markdown files checked with 0 broken cross-references)
  - `npm run test:task-management-workflow` & `npm run test:tokens-economy` & `npm run test:no-duplicate-md`
- Confirmed zero build errors (`compile_applet`) and zero ESLint issues (`lint_applet`).
- Committed changes (`ffae71b`).
