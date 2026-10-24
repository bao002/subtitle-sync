# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

- [ ] **Task 206: Make Agent Work Resumable After Session Interruption**
  - [ ] Add explicit resume instructions to AGENTS.md and document the recovery sequence in the token-economy workflow.
  - [ ] Stage and verify tracker updates while preserving Task 200's in-progress work.
- [ ] **Task 194 [ON HOLD]: Fix setBaseLanguage ReferenceError and Type Integrity (Version 2.0.3)**
  - [x] Sub-task 194.1: Bump version to 2.0.3 across all 5 targets and record last raw prompt in AGENTS.md.
  - [ ] Sub-task 194.2: Implement `setBaseLanguage` state callback, fix YTPlayer `loadVideoById`, fix criteria type in index.tsx, and fix missing `HelpCircle` in `AiSubtitlePunctuationTab.tsx`.
  - [ ] Sub-task 194.3: Create automated verification test `scripts/verify-set-base-language-fix.ts`, run tests, compile, lint, commit, and migrate to `docs/done.md`.

## Later Tasks

- [ ] **Task 196: Android-platform validation for web-demo share links**
  - Run `bash android-shell/gradlew assembleDebug` and `bash scripts/run-android-e2e.sh` using JDK 21, an Android SDK, `adb`, and an API 34 Google APIs emulator or physical device. The implementation and source-level checks are committed as `595732f`.
