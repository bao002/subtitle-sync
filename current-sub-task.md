# Current Subtask (`current-sub-task.md`)

- **Active Subtask**: Sub-task 196.2: Android build and real-device E2E validation.
- **Status**: BLOCKED.
- **Target**: Run `./gradlew assembleDebug` and `scripts/run-android-e2e.sh` with an Android SDK and API 34 emulator/device available.
- **Completed locally**: Share regression tests, version parity, web build, and lint.
- **Blocker**: `adb` is not installed and Gradle cannot locate an Android SDK (`ANDROID_HOME`/`sdk.dir`).
