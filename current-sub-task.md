# Current Subtask (`current-sub-task.md`)

## Active Subtask: Subtask 144.1 - Deprecate Screencast Generation in Android Emulator E2E Suite
- **Task**: Task 144 - Android Emulator E2E: Caption Detection & Text Exposure, Deprecate Screencast Generation (Version 1.0.46)
- **Status**: [IN PROGRESS]
- **Focus**:
  - In `scripts/run-android-e2e.sh`:
    - Deprecate / remove background `adb shell screenrecord` invocation and SIGINT `pkill screenrecord` video capture.
    - Remove ffmpeg screencast fallback and video validation.
  - In `scripts/android-e2e-assert.sh`:
    - Remove screencast video artifact assertions (do not require `android-emulator-video.mp4`).
    - Focus assertions on authentic caption detection, HTTP 200 timedtext response, and exposed subtitle text.
  - In `.github/workflows/emulation.yml`:
    - Deprecate video artifact uploads and screencast references.
  - In documentation (`docs/android.md`, `docs/fix-android-e2e-test-and-video-product.md`):
    - Document deprecation of screencast generation in favor of direct live caption text detection and exposure.
