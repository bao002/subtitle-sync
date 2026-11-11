# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

- [ ] **Task 388 (Prompt 154 - Chapter 3): Subtitles Table View Visible Global Row-Criteria with Default Language Filtering [ACTIVE]**
  - [ ] Subtask 388.1: Ensure the global Row-Criteria panel/header is visibly rendered in `SubtitlesTablePanel.tsx` in Stage 3 / Subtitles Table View.
  - [ ] Subtask 388.2: Ensure row-criteria word counting uses the default language (leftmost column / base language) and strictly filters out subtitle records exceeding X words.
  - [ ] Subtask 388.3: Verify with dedicated test `scripts/verify-subtitles-table-global-row-criteria-visible.ts`, verify compilation and linting, commit, and migrate Task 388 to `docs/done.md`.

- [ ] **Task 389 (Prompt 154 - Chapter 4): Word Balloons Stage - Remove Video Player & Deliver Pure Learning Words Game [PENDING]**
  - [ ] Subtask 389.1: Audit `WordBalloonLearningView.tsx` and stage rendering in `src/routes/index.tsx` to locate any video player elements in the Word Balloons stage.
  - [ ] Subtask 389.2: Remove the video player and video controls completely from the Word Balloons learning stage so it focuses 100% on interactive word-popping and vocabulary learning.
  - [ ] Subtask 389.3: Verify with dedicated test `scripts/verify-word-balloons-stage-no-video.ts`, verify compilation and linting, commit, and migrate Task 389 to `docs/done.md`.

- [ ] **Task 380 (Prompt 148 - Chapter 2): Strict Sequential TTS Playback & Respect Audio Playing Duration [PENDING]**
  - [ ] Subtask 380.1: Ensure `playAlternativeTtsAudio` and `speak(...)` strictly respect the full playing duration of fetched audio without premature cutoff or starting overlapping speech before completion.
  - [ ] Subtask 380.2: Implement sequential speech queue / promise chaining so concurrent speech requests wait for the active playback to complete or terminate cleanly.
  - [ ] Subtask 380.3: Add dedicated test `scripts/verify-tts-playback-duration-and-queue.ts`, verify app compilation and linting, bump version, commit, and migrate Task 380 to `docs/done.md`.

- [ ] **Task 381 (Prompt 148 - Chapter 3): OpenAPI Multi-Provider Testing, Playback & Custom Auto Provider Selection [PENDING]**
  - [ ] Subtask 381.1: In `TtsServiceSettingsPanel.tsx`, add "Generate Response" / "Test All Providers" feature that fetches audio from each provider defined in the OpenAPI spec.
  - [ ] Subtask 381.2: Allow testing/playing each generated provider audio clip directly in the UI.
  - [ ] Subtask 381.3: Allow user to select/customize which providers to include when calling `/api/public/auto` (or custom provider list) and save preference.
  - [ ] Subtask 381.4: Add dedicated test `scripts/verify-tts-openapi-multi-provider-testing.ts`, verify app compilation and linting, bump version, commit, and migrate Task 381 to `docs/done.md`.

- [ ] **Task 372 (Prompt 140 - Chapter 4): Subtitles-Table Highlight vs Filter Toggle [PENDING]**
  - [ ] Subtask 372.1: Add `criteriaMatchAction` ("filter" | "highlight") with persistent preference in playback preferences and settings.
  - [ ] Subtask 372.2: Add visual toggle button ("Filter Out" vs "Highlight Matching") to `SubtitlesTablePanel.tsx` row criteria header.
  - [ ] Subtask 372.3: In "highlight" mode, display all sentences in `SubtitlesTablePanel.tsx` while highlighting matching sentences with distinct visual styling and test IDs (`data-testid="row-criteria-highlighted"`).
  - [ ] Subtask 372.4: Ensure 100% parity across Advanced Mode and Beginner Mode.
  - [ ] Subtask 372.5: Add dedicated automated test `scripts/verify-subtitles-table-highlight-toggle.ts` (`npm run test:subtitles-highlight-toggle`), bump version, verify compile/lint, commit, and migrate Task 372 to `docs/done.md`.

## Later Tasks

- [ ] **Task 263 (Later 2): AGENTS.md - Enforce same components policy (beginner & advance mode) - only the order differ**
  - Formalize rule in AGENTS.md and codebase architecture requiring absolute UI component parity between Beginner and Advanced modes where every feature/panel is composed of identical component blocks and differs strictly in sequence/order.

- [ ] **Task 234: Capture authentic shared-video subtitle E2E**
  - Retry only from a runtime/network where the YouTube embed is permitted to play. The current Docker attempt loaded 126 authentic Hebrew caption sections and non-empty Italian on-demand translations, but YouTube displayed “Sign in to confirm you're not a bot,” so there is no authentic video playback screencast. Do not substitute mock or illustrative footage.
  - Retry with a fresh signed caption URL supplied only at runtime: `E2E_NETWORK_MODE=host E2E_SHARED_SUBTITLES_URL='<fresh signed timedtext URL>' PLAYWRIGHT_VIDEO=on ./docker/manage.sh e2e web --grep 'shared subtitles link' --retries=0`. Confirm `googlevideo.com/videoplayback` requests and inspect recorded frames before sharing; never persist the signed URL.

- [ ] **Task 196: Android-platform validation for web-demo share links**
  - Run `bash android-shell/gradlew assembleDebug` and `bash scripts/run-android-e2e.sh` using JDK 21, an Android SDK, `adb`, and an API 34 Google APIs emulator or physical device. The implementation and source-level checks are committed as `595732f`.
- [ ] **Task 221: Validate authentic Android screencast on API 34**
  - On an authenticated GitHub Actions runner or a host with `adb` and an API 34 Google APIs emulator, run the updated Android E2E workflow and verify it uploads a non-empty `android-emulator-video.mp4` captured from the emulator. Confirm the MP4 is finalized after `adb shell pkill -2 -f screenrecord`; do not accept a screenshot-generated substitute. Exact CI commands: `gh workflow run emulation.yml --ref main`, `gh run watch <run-id> --exit-status`, and `gh run download <run-id> --name android-emulator-artifacts`.
  - First integrate implementation commit `7b3fd93` with remote `main` without copying or overwriting its newer README-only commit. Run 44 on `a6b45db` failed before E2E because the prior workflow boot timeout was 300 seconds; the update uses 600 seconds. Runtime validation remains blocked here because `adb`, GitHub CLI authentication, and Git credentials are unavailable.
- [ ] **Task 228: Validate playback lifecycle on Android API 34**
  - Run `bash android-shell/gradlew assembleDebug && bash scripts/run-android-e2e.sh && bash scripts/android-e2e-assert.sh` on a host with JDK 21, Android SDK, `adb`, and an API 34 Google APIs emulator or device. Confirm playback does not restart repeatedly during play-state updates.
  - Runtime validation is blocked in this Codespace because `adb` is unavailable. The player lifecycle fix and web-demo regression are implemented and verified in commit `042b8ed` plus the current web E2E changes.
- [ ] **Later: Extend text-to-speech service support**
  - Add support for additional TTS services beyond the current Google default. Keep this separate from the new-user/daily-usage design update.
- [ ] **Later: Review control-placement category colors**
  - After the user reviews the provisional new-user, daily-usage, and experimental control backgrounds, relocate controls according to the agreed placement recommendations.
- [ ] **Later: Verify GitHub Actions and screencast artifacts**
  - Verify the relevant GitHub Actions workflows and ensure the Android screencast artifact is produced without deprecated or limiting configuration. Inspect workflow history and artifact-upload behavior when this later item is activated.
