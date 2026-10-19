# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.


## Task 146: Parser Settings Reset, Library Last-Used Ordering, and Later Tasks Protocol (Version 1.0.48)

### Objective:
Implement comprehensive parser setting update logic (reset page state, stop playbacks, update subtitles layout for all cached subtitles according to new division, refresh on-demand translations), enhance Video Library to display last-used time and order strictly by user interaction timestamp, and implement the later-tasks protocol.

### Subtasks:
- [/] **Subtask 146.1**: Version bump to 1.0.48 across all 5 targets (`package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`).
- [ ] **Subtask 146.2**: AGENTS.md later tasks protocol & cataloging later tasks under `## Later Tasks` in `docs/tasks.md` and `docs/later.md`.
- [ ] **Subtask 146.3**: Video Library enhancements — show last used time on video cards and order based strictly on user interaction timestamp (most recent first).
- [ ] **Subtask 146.4**: Parser options change handling — reset page playing state, update subtitles view layout for all cached subtitles according to new division, reset and update on-demand translations.
- [ ] **Subtask 146.5**: Dedicated automated test (`scripts/verify-parser-options-reset-and-library-ordering.ts`), verify compilation, lint, and migrate to `docs/done.md`.

---

## Task 144: Android Emulator E2E — Caption Detection & Text Exposure, Deprecate Screencast Generation (Version 1.0.46) [PENDING]

### Objective:
Fix the Android Emulator E2E suite to detect authentic caption requests upon enabling CC on the YouTube video, extract and expose the subtitle text directly in the test execution output and telemetry (no mock or fixtures), and deprecate screencast video generation.

### Subtasks:
- [ ] **Subtask 144.1**: Deprecate screencast video generation (`screenrecord`, ffmpeg synthesis, video artifacts) in `scripts/run-android-e2e.sh`, `scripts/android-e2e-assert.sh`, `.github/workflows/emulation.yml`, and documentation.
- [ ] **Subtask 144.2**: Update Android E2E execution to enable captions on the real YouTube video and detect authentic timedtext network responses without fixtures or mocks.
- [ ] **Subtask 144.3**: Expose the intercepted caption text in logcat, test runner output, and telemetry summary.
- [ ] **Subtask 144.4**: Author dedicated verification script (`scripts/verify-emulator-captions-detection.ts`), verify compilation, lint, commit & push, and migrate to `docs/done.md`.

---

## Later Tasks

The following tasks were requested for "later" by the user and are stored here to be processed upon completion of active prompt tasks:

- **Later Task 1: Parser Option Difference Confirmation & Preview**: Add confirmation option to show the difference based on the new parser settings (show the actual effect by highlighting differences while allowing to press next to view the next record that changed based on those settings).
- **Later Task 2: Client-side video metadata extraction**: If possible client-side only, get video description, title, default subtitles, and all other free info.
