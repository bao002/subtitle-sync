# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

- [ ] **Task 192: Pausing the Android Application Pauses Both Video and TTS-Play (Version 2.0.1)**
  - [ ] Sub-task 192.1: App version bump to 2.0.1 (versionCode 20001) across all 5 targets (`package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`).
  - [ ] Sub-task 192.2: Implement simultaneous video and TTS-play pause handling across Android Shell (`MainActivity.kt`, `BackgroundAudioService.kt`), Web Media Manager (`src/utils/backgroundMediaManager.ts`), and React components (`src/routes/index.tsx`, `src/components/VideoPlaybackControls.tsx`, `src/components/beginner/tabs/BeginnerPlayerTab.tsx`).
  - [ ] Sub-task 192.3: Implement dedicated automated verification suite `scripts/verify-pause-both-video-and-tts.ts`, run tests, compile, lint, commit, and migrate to `docs/done.md`.

---

## Later Tasks

_(No pending later tasks currently in queue)_
