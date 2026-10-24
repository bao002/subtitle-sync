# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

- [ ] **Task 194 [ON HOLD]: Fix setBaseLanguage ReferenceError and Type Integrity (Version 2.0.3)**
  - [x] Sub-task 194.1: Bump version to 2.0.3 across all 5 targets and record last raw prompt in AGENTS.md.
  - [ ] Sub-task 194.2: Implement `setBaseLanguage` state callback, fix YTPlayer `loadVideoById`, fix criteria type in index.tsx, and fix missing `HelpCircle` in `AiSubtitlePunctuationTab.tsx`.
  - [ ] Sub-task 194.3: Create automated verification test `scripts/verify-set-base-language-fix.ts`, run tests, compile, lint, commit, and migrate to `docs/done.md`.

- [ ] **Task 199: Keep Default Subtitle Track Out of TTS**
  - [ ] Show fetched default subtitles in the language table without automatically speaking that track.
- [ ] **Task 200: Mark YouTube-Translated Subtitle Tracks**
  - [ ] Add a visible translation-origin icon next to tracks fetched as YouTube translations.
- [ ] **Task 201: Clean Angle Brackets Before Display and Speech**
  - [ ] Remove `<` and `>` before subtitles render or enter TTS and add regression tests.
- [ ] **Task 202: Make Advanced Parser Confirmation Inline**
  - [ ] Replace the parser confirmation popup with an inline comparison-friendly control in advanced mode.
- [ ] **Task 203: Move Favorite Subtitle Visibility Beside the Video**
  - [ ] Place favorite-language visibility selection beside the video rather than inside Languages.
- [ ] **Task 204: Separate Language Selection from Per-Language Settings**
  - [ ] Place language selection and per-language TTS rate/ratio controls in distinct sections.
- [ ] **Task 205: Edit Per-Language Settings In Place**
  - [ ] Remove duplicated customization data and make each displayed language setup directly editable in a space-efficient layout.

---

## Later Tasks

- [ ] **Task 196: Android-platform validation for web-demo share links**
  - Run `bash android-shell/gradlew assembleDebug` and `bash scripts/run-android-e2e.sh` using JDK 21, an Android SDK, `adb`, and an API 34 Google APIs emulator or physical device. The implementation and source-level checks are committed as `595732f`.
