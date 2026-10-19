# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Task 145: Ensure TTS-Play Functionality & Seamless Bidirectional Mode Switching (Version 1.0.47)

### Objective:
Ensure TTS-play works reliably across both Beginner Mode and Advanced Studio, and empower users to effortlessly change between Beginner Mode and Advanced Studio with unified state and 1-click access.

### Subtasks:
- [ ] **Subtask 145.1**: Version bump to 1.0.47 across all 5 targets (`package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`).
- [ ] **Subtask 145.2**: Implement effortless bidirectional mode switching:
  - Add quick mode toggle right in the main app header and in `BeginnerTabNav` alongside `ModeSwitcherHeader`.
  - Maintain full state synchronization (`videoId`, loaded `tracks`, `currentTime`, `sectionOrder`, `rates`, `voiceSelections`, `spoken`) when toggling back and forth between modes.
- [ ] **Subtask 145.3**: Ensure robust TTS-play functionality:
  - Connect Beginner Mode preferences (`order`, `ttsSpeed`, `ttsVoice`, `favoriteLanguages`) directly to `src/routes/index.tsx` so playback narration uses the user's configured settings.
  - Add on-demand TTS speak capability to subtitle cues and rows so users can hear pronunciation at any time.
  - Verify that `spoken` languages trigger TTS speech during video playback according to the active narration order.
- [ ] **Subtask 145.4**: Author dedicated automated test (`scripts/verify-tts-play-and-mode-switching.ts`), verify compilation, lint, and migrate to `docs/done.md`.

---

## Task 144: Android Emulator E2E — Caption Detection & Text Exposure, Deprecate Screencast Generation (Version 1.0.46) [PENDING]

### Objective:
Fix the Android Emulator E2E suite to detect authentic caption requests upon enabling CC on the YouTube video, extract and expose the subtitle text directly in the test execution output and telemetry (no mock or fixtures), and deprecate screencast video generation.

### Subtasks:
- [ ] **Subtask 144.1**: Deprecate screencast video generation (`screenrecord`, ffmpeg synthesis, video artifacts) in `scripts/run-android-e2e.sh`, `scripts/android-e2e-assert.sh`, `.github/workflows/emulation.yml`, and documentation.
- [ ] **Subtask 144.2**: Update Android E2E execution to enable captions on the real YouTube video and detect authentic timedtext network responses without fixtures or mocks.
- [ ] **Subtask 144.3**: Expose the intercepted caption text in logcat, test runner output, and telemetry summary.
- [ ] **Subtask 144.4**: Author dedicated verification script (`scripts/verify-emulator-captions-detection.ts`), verify compilation, lint, commit & push, and migrate to `docs/done.md`.
