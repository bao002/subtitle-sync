# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

- [ ] **Task 197: Compact help-icon refinement for parser info blocks and Android-safe review UI**
  - Replace verbose inline explanatory text with compact help icons for parser controls and related info/detail sections.
  - Keep Android review flow inline and free of blocking popups while preserving the parser diff confirmation flow.
  - Validate with the focused parser-help and inline-review scripts.

## Later Tasks

- [ ] **Task 196: Android-platform validation for web-demo share links**
  - Run `bash android-shell/gradlew assembleDebug` and `bash scripts/run-android-e2e.sh` using JDK 21, an Android SDK, `adb`, and an API 34 Google APIs emulator or physical device. The implementation and source-level checks are committed as `595732f`.
