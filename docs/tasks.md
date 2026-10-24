# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

- [ ] **Task 212: Deprecate beginner default-language selection**
  - Remove default-language selection from the first beginner tab and record the deprecated behavior in `docs/deprecated.md`.
  - Add focused regression coverage and verify beginner-mode behavior.

## Later Tasks

- [ ] **Task 196: Android-platform validation for web-demo share links**
  - Run `bash android-shell/gradlew assembleDebug` and `bash scripts/run-android-e2e.sh` using JDK 21, an Android SDK, `adb`, and an API 34 Google APIs emulator or physical device. The implementation and source-level checks are committed as `595732f`.
