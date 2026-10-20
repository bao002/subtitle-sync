# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.









## Task 144: Android Emulator E2E — Caption Detection & Text Exposure, Deprecate Screencast Generation (Version 1.0.51) [IN PROGRESS]

### Objective:
Fix the Android Emulator E2E suite to detect authentic caption requests upon enabling CC on the YouTube video, extract and expose the subtitle text directly in the test execution output and telemetry (no mock or fixtures), and deprecate screencast video generation.

### Subtasks:
- [ ] **Subtask 144.1**: Deprecate screencast video generation (`screenrecord`, ffmpeg synthesis, video artifacts) in `scripts/run-android-e2e.sh`, `scripts/android-e2e-assert.sh`, `.github/workflows/emulation.yml`, and documentation.
- [ ] **Subtask 144.2**: Update Android E2E execution to enable captions on the real YouTube video and detect authentic timedtext network responses without fixtures or mocks.
- [ ] **Subtask 144.3**: Expose the intercepted caption text in logcat, test runner output, and telemetry summary.
- [ ] **Subtask 144.4**: Version bump to 1.0.51 across all 5 targets, author dedicated verification script (`scripts/verify-emulator-captions-detection.ts`), verify compilation, lint, and migrate to `docs/done.md`.

---

## Later Tasks

The following tasks were requested for "later" by the user and are stored here to be processed upon completion of active prompt tasks:

- **Later Task 2: Client-side video metadata extraction**: If possible client-side only, get video description, title, default subtitles, and all other free info.


