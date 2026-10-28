# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

- [ ] **Task 265: Refined Language Settings (Rate Dropdown 0.5-1.0, Main Settings Rate, Clickable Language Name for Primary, Remove Speech Test Button) & Version Bump (2.0.32)**
  - Subtask 265.1: Make language name clickable to set Primary in unified table, remove dedicated Primary column, and remove speech test play button.
  - Subtask 265.2: Replace speech rate slider with 0.5 to 1.0 dropdown in unified table and Beginner mode, and allow updating speech rate in main settings.
  - Subtask 265.3: Update application version across all 5 targets to `2.0.32` (versionCode `20032`).
  - Subtask 265.4: Author dedicated verification test `scripts/verify-refined-language-settings.ts`, update `scripts/verify-unified-languages-table.ts`, and register in `package.json` and `docs/files.md`.
  - Subtask 265.5: Validate with test suite, `compile_applet`, `lint_applet`, and migrate to `docs/done.md`.

## Later Tasks

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
