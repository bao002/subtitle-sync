# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are moved to `docs/done.md`.

## Task 118: Video Playground Playback Speed Controls, JSON Telemetry Export & Seamless Timestamp Handoff to Synchronized Viewer (Version 1.0.22)

- [ ] Subtask 118.1: Update app version to 1.0.22 across `package.json`, `android-shell/app/build.gradle.kts` (versionCode 10022, versionName "1.0.22"), `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts`.
- [ ] Subtask 118.2: Implement Video Playground playback speed selector (0.5x to 2.0x), raw JSON / cue telemetry clipboard export, and 1-click seamless timestamp handoff to Synchronized Viewer tab in `src/components/VideoPlayground.tsx` and `src/routes/index.tsx`.
- [ ] Subtask 118.3: Author dedicated automated test `scripts/verify-video-playground-enhancements.ts`, register `test:playground-enhancements` in `package.json`, and update architectural documentation in `docs/files.md`, `docs/designs/DESIGN_CONTROLS_VIEW.md`, and `docs/designs/DESIGN_PLAYER_PROVIDER.md`.
- [ ] Subtask 118.4: Execute test suites, verify clean compilation (`compile_applet`) and zero-error linting (`lint_applet`), commit progress via git, attempt push, and migrate Task 118 to `docs/done.md`.
