# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

- [ ] **Task 309 (Prompt 79): Ensure All GitHub Actions Are Passing**
  - Subtask 309.1: Add header active video ID identifier (`data-testid="header-active-video-id"`) in `src/routes/index.tsx` so `e2e/emulation.spec.ts` passes reliably in Playwright E2E suite (`web.yml`).
  - Subtask 309.2: Verify full Playwright E2E suite (`e2e/emulation.spec.ts` and `e2e/web.spec.ts`) passes 100% under `npx playwright test --project=web`.
  - Subtask 309.3: Verify all 10 GitHub Actions workflows (`web.yml`, `emulation.yml`, `deploy-demo.yml`, `release-apk.yml`, `integrity.yml`, `version-sync.yml`, `update-readme.yml`, `error-reporting.yml`, `report-video-flow.yml`, `android-system-smoke.yml`) and their underlying scripts pass.
  - Subtask 309.4: Implement dedicated automated test `scripts/verify-all-github-actions-pass.ts`, bump version to `2.1.9`, run `sync-version`, compile (`compile_applet`), lint (`lint_applet`), commit, and migrate Task 309 to `docs/done.md`.




- [ ] **Task 304: Ensure GitHub Actions Work Correctly & E2E Tests Recognize Application Crashes**
  - Subtask 304.1: Fix GitHub Actions workflows alignment in `scripts/verify-workflows-alignment.ts` (include `version-sync.yml`) and ensure `web.yml` properly executes Playwright test suite for web and emulation specs.
  - Subtask 304.2: Update E2E test framework (`e2e/web.spec.ts` and `e2e/emulation.spec.ts`) with crash recognition listeners (`pageerror`, `router-error-component`, and crash diagnostic capture) so tests fail immediately with actionable crash logs when an app crash occurs, and add a dedicated test verifying that application crashes are detected.
  - Subtask 304.3: Fix the E2E web specs in `e2e/web.spec.ts` to align with current stage filtering (Stage 4 Settings navigation, Beginner Mode mode setup) so that all 10 E2E tests pass cleanly without timing out or failing.
  - Subtask 304.4: Dedicated verification test `scripts/verify-github-actions-and-e2e-crash-detection.ts`, version bump to v2.1.4, compile, lint, commit, and migrate Task 304 to `docs/done.md`.

- [ ] **Task 302 (Prompt 66 - Chapter 5): Auto-Fetching Subtitles - Request & Response in Log Viewer**
  - Subtask 302.1: Enhance subtitle fetch logging to capture and display full request details and response payloads (HTTP status, cues count, byte size) in the Stage 0 log viewer.
  - Subtask 302.2: Dedicated automated test script `scripts/verify-subtitle-fetch-log-viewer-req-res.ts` (`npm run test:subtitle-fetch-log-viewer-req-res`).
  - Subtask 302.3: Version bump, compile, lint, commit, migrate Task 302 to `docs/done.md`.

- [ ] **Task 303 (Prompt 66 - Chapter 6): TTS Service Audio Test & Log Viewer Integration**
  - Subtask 303.1: Resolve TTS network request issues on "hello world" test playback.
  - Subtask 303.2: Add "Fetch & Play Audio" button with options to speak multiple test sentences in configured languages, logging network request/response to log viewer.
  - Subtask 303.3: Dedicated automated test script `scripts/verify-tts-audio-test-and-log-viewer.ts` (`npm run test:tts-audio-test-and-log-viewer`).
  - Subtask 303.4: Version bump, compile, lint, commit, migrate Task 303 to `docs/done.md`.

- [ ] **Task 288: Slow / Fast Mode (Hide & Disable Non-Obligatory Elements by Default, docs/disable_and_hide.md, Disable-All/Enable-All in Settings)**
  - Subtask 288.1: Document obligatory vs non-obligatory elements matrix and mode controls in `docs/disable_and_hide.md`.
  - Subtask 288.2: Implement performance mode state manager `src/utils/performanceModeManager.ts` (Fast Mode by default, disable-all / enable-all helpers, element-level flags, localStorage persistence).
  - Subtask 288.3: Integrate Fast / Slow mode and "Disable All" / "Enable All" controls in Settings across both Advanced Mode and Beginner Mode, and apply conditional rendering to hide/disable non-obligatory elements in Fast mode.
  - Subtask 288.4: Dedicated automated verification script `scripts/verify-slow-fast-mode.ts` (`npm run test:slow-fast-mode`).
  - Subtask 288.5: Bump version across single-source version files, compile (`compile_applet`), lint (`lint_applet`), and migrate Task 288 to `docs/done.md`.

- [ ] **Task 286 (Chapter 2): Export / Import Application Settings**
  - Subtask 286.1: Implement settings backup utility `src/utils/settingsBackupManager.ts` supporting full export and import of user settings, language goals, TTS ratios, blacklist, and preferences.
  - Subtask 286.2: Add Export/Import UI modal and controls across Advanced Mode and Beginner Mode with full parity.
  - Subtask 286.3: Dedicated automated test `scripts/verify-settings-export-import.ts`.
  - Subtask 286.4: Synchronize version across all 5 files, compile, lint, commit, push, and migrate Task 286 to `docs/done.md`.


## Later Tasks

- [ ] **Task 263 (Later 2): AGENTS.md - Enforce same components policy (beginner & advance mode) - only the order differ**
  - Formalize rule in AGENTS.md and codebase architecture requiring absolute UI component parity between Beginner and Advanced modes where every feature/panel is composed of identical component blocks and differs strictly in sequence/order.

- [ ] **Task 234: Capture authentic shared-video subtitle E2E**
  - Retry only from a runtime/network where the YouTube embed is permitted to play. The current Docker attempt loaded 126 authentic Hebrew caption sections and non-empty Italian on-demand translations, but YouTube displayed “Sign in to confirm you're not a bot,” so there is no authentic video playback screencast. Do not substitute mock or illustrative footage.
  - Retry with a fresh signed caption URL supplied only at runtime: `E2E_NETWORK_MODE=host E2E_SHARED_SUBTITLES_URL='<fresh signed timedtext URL>' PLAYWRIGHT_VIDEO=on ./docker/manage.sh e2e web --grep 'shared subtitles link' --retries=0`. Confirm `googlevideo.com/videoplayback` requests and inspect recorded frames before sharing; never persist the signed URL.

- [ ] **Task 196: Android-platform validation for web-demo share links**
  - Run `bash android-shell/gradlew assembleDebug` and `bash scripts/run-android-e2e.sh` using JDK 21, an Android SDK, `adb`, and an API 34 Google APIs emulator or physical device. The implementation and source-level checks are committed as `595732f`.
- [ ] **Task 221: Validate authentic Android screencast on API 34**
  - On an authenticated GitHub Actions runner or a host with `adb` and an API 34 Google APIs emulator, run the updated Android E2E workflow and verify it uploads a non-empty `android-emulator-video.mp4` captured from the emulator. Confirm the MP4 is finalized after `adb shell pkill -2 -f screenrecord`; do not accept a screenshot-generated substitute. Exact CI commands: `gh workflow run emulation.yml --ref main`, `gh run watch <run-id> --exit-status`, and `gh run download <run-id> --name android-emulator-artifacts`.
  - First integrate implementation commit `7b3fd93` with remote `main` without copying or overwriting its newer README-only commit. Run 44 on `a6b45db` failed before E2E because the prior workflow boot timeout was 300 seconds; the update uses 600 seconds. Runtime validation remains blocked here because `adb`, GitHub CLI authentication, and Git credentials are unavailable.
- [ ] **Task 228: Validate playback lifecycle on Android API 34**
  - Run `bash android-shell/gradlew assembleDebug && bash scripts/run-android-e2e.sh && bash scripts/android-e2e-assert.sh` on a host with JDK 21, Android SDK, `adb`, and an API 34 Google APIs emulator or device. Confirm playback does not restart repeatedly during play-state updates.
  - Runtime validation is blocked in this Codespace because `adb` is unavailable. The player lifecycle fix and web-demo regression are implemented and verified in commit `042b8ed` plus the current web E2E changes.
- [ ] **Later: Extend text-to-speech service support**
  - Add support for additional TTS services beyond the current Google default. Keep this separate from the new-user/daily-usage design update.
- [ ] **Later: Review control-placement category colors**
  - After the user reviews the provisional new-user, daily-usage, and experimental control backgrounds, relocate controls according to the agreed placement recommendations.
- [ ] **Later: Verify GitHub Actions and screencast artifacts**
  - Verify the relevant GitHub Actions workflows and ensure the Android screencast artifact is produced without deprecated or limiting configuration. Inspect workflow history and artifact-upload behavior when this later item is activated.
