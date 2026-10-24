# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

- [ ] **Task 207: Reconcile backlog state with verified subtitle integrity fixes**
  - [ ] Sub-task 207.1: Refresh `docs/suggestions.md` with the current status of Tasks 194 and 197–206, and note that stale hold states should be reconciled instead of reopened.
  - [ ] Sub-task 207.2: Verify the live code reflects the resolved `setBaseLanguage` fix, the `loadVideoById` guard, and the `HelpCircle` import fix before closing the backlog gap.
  - [ ] Sub-task 207.3: Commit the tracker/docs update and push the branch once the backlog and task mirrors are synchronized.

## Later Tasks

- [ ] **Task 196: Android-platform validation for web-demo share links**
  - Run `bash android-shell/gradlew assembleDebug` and `bash scripts/run-android-e2e.sh` using JDK 21, an Android SDK, `adb`, and an API 34 Google APIs emulator or physical device. The implementation and source-level checks are committed as `595732f`.
