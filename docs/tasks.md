# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Task 153: Android Emulator E2E — Caption Detection & Text Exposure, Deprecate Screencast Generation (Version 1.0.53)

### Objective:
Update the Android Emulator E2E suite to detect authentic caption requests upon enabling CC on the YouTube video, extract and expose the subtitle text directly in test runner output and device telemetry (no mock or fixtures), and deprecate screencast video generation.

### Subtasks:
- [ ] **Subtask 153.1**: Version bump to 1.0.53 across all 5 targets (`package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`).
- [ ] **Subtask 153.2**: Expose authentic caption text in `android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt` with `AUTHENTIC_CAPTIONS_EXPOSED` logcat output.
- [ ] **Subtask 153.3**: Deprecate screencast video generation (`screenrecord`, MP4 artifacts) in `scripts/run-android-e2e.sh`, `scripts/android-e2e-assert.sh`, `.github/workflows/emulation.yml`, and documentation.
- [ ] **Subtask 153.4**: Enhance `scripts/run-android-e2e.sh` and `scripts/android-e2e-assert.sh` to actively detect authentic captions upon player interaction, extract and print exposed caption text without mock or fixtures.
- [ ] **Subtask 153.5**: Author dedicated verification script `scripts/verify-emulator-captions-detection.ts`, verify with test runner, run `compile_applet`, `lint_applet`, commit progress, and migrate to `docs/done.md`.

---

## Later Tasks

The following tasks were requested for "later" by the user and are stored here to be processed upon completion of active prompt tasks:

- **Later Task 2: Client-side video metadata extraction**: If possible client-side only, get video description, title, default subtitles, and all other free info.
