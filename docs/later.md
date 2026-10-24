# Tasks

## Pending Later Tasks

The following tasks are deferred for later execution after all active tasks are complete:

- [ ] **Task 196: Android-platform validation for web-demo share links**
  - Run `bash android-shell/gradlew assembleDebug` and `bash scripts/run-android-e2e.sh` using JDK 21, an Android SDK, `adb`, and an API 34 Google APIs emulator or physical device.
  - The implementation and source-level checks are committed as `595732f`; validate the Android build and real-device share flow on a platform with the required tools.
- [ ] **Task 221: Validate authentic Android screencast on API 34**
  - On an authenticated GitHub Actions runner or a host with `adb` and an API 34 Google APIs emulator, run the updated Android E2E workflow and verify it uploads a non-empty `android-emulator-video.mp4` captured from the emulator. Confirm the MP4 is finalized after `adb shell pkill -2 -f screenrecord`; do not accept a screenshot-generated substitute.
  - Exact CI commands: `gh workflow run emulation.yml --ref main`, `gh run watch <run-id> --exit-status`, and `gh run download <run-id> --name android-emulator-artifacts`.
  - First integrate implementation commit `7b3fd93` with remote `main` without copying or overwriting its newer README-only commit.
- [ ] **Task 224: Parser abbreviation exception rules for dot splitting ("dr.", "mrs.", per-language customizations)**
  - The user should be able to tell the parser not to split when the dot is next to other words such as "dr.", "mrs." (per languages customizations).
- [ ] **Task 228: Validate playback lifecycle on Android API 34**
  - Run `bash android-shell/gradlew assembleDebug && bash scripts/run-android-e2e.sh && bash scripts/android-e2e-assert.sh` on a host with JDK 21, Android SDK, `adb`, and an API 34 Google APIs emulator or device.
  - Confirm playback does not restart repeatedly during play-state updates. Runtime validation is blocked in this Codespace because `adb` is unavailable.
