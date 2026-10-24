# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

- [ ] **Task 223: Quarantine old subtitles parser implementation, create an easy, clean new parser positioned just above the subtitles-table with live dynamic updates**
  - [ ] Subtask 223.1: Quarantine the old parser into `/quarentined/oldSubtitlesParser.ts`.
  - [ ] Subtask 223.2: Implement the new and easier parser with reliable splitting on `.` (dot) and configurable punctuation marks with interpolated timing and direct live table updates.
  - [ ] Subtask 223.3: Render the new parser controls just above the subtitles-table in `SubtitlesTablePanel.tsx` with live dynamic configuration.
  - [ ] Subtask 223.4: Bump app version to `2.0.12`, add dedicated test `scripts/verify-quarantine-and-new-parser.ts`, verify, compile, lint, commit, and migrate to `docs/done.md`.


## Later Tasks

- [ ] **Task 196: Android-platform validation for web-demo share links**
  - Run `bash android-shell/gradlew assembleDebug` and `bash scripts/run-android-e2e.sh` using JDK 21, an Android SDK, `adb`, and an API 34 Google APIs emulator or physical device. The implementation and source-level checks are committed as `595732f`.
- [ ] **Task 221: Validate authentic Android screencast on API 34**
  - On an authenticated GitHub Actions runner or a host with `adb` and an API 34 Google APIs emulator, run the updated Android E2E workflow and verify it uploads a non-empty `android-emulator-video.mp4` captured from the emulator. Confirm the MP4 is finalized after `adb shell pkill -2 -f screenrecord`; do not accept a screenshot-generated substitute. Exact CI commands: `gh workflow run emulation.yml --ref main`, `gh run watch <run-id> --exit-status`, and `gh run download <run-id> --name android-emulator-artifacts`.
  - First integrate implementation commit `7b3fd93` with remote `main` without copying or overwriting its newer README-only commit. Run 44 on `a6b45db` failed before E2E because the prior workflow boot timeout was 300 seconds; the update uses 600 seconds. Runtime validation remains blocked here because `adb`, GitHub CLI authentication, and Git credentials are unavailable.
- [ ] **Task 224: Parser abbreviation exception rules for dot splitting ("dr.", "mrs.", per-language customizations)**
  - The user should be able to tell the parser not to split when the dot is next to other words such as "dr.", "mrs." (per languages customizations).
