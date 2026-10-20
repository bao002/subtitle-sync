# Current Subtask (`current-sub-task.md`)

## Active Subtask: Subtask 153.3 - Deprecate Screencast Video Generation
- **Parent Task**: Task 153 - Android Emulator E2E — Caption Detection & Text Exposure, Deprecate Screencast Generation (Version 1.0.53)
- **Status**: [ACTIVE]
- **Target Files**:
  - `scripts/run-android-e2e.sh`
  - `scripts/android-e2e-assert.sh`
  - `.github/workflows/emulation.yml`
  - `public/android-emulator-report.html`
  - `public/android/index.html`
  - `docs/android.md`
- **Verification**: Deprecate device screencast recording (`screenrecord`), video artifacts, and ffmpeg transcoding in favor of authentic subtitle text detection, logcat telemetry, and screenshot milestones.
