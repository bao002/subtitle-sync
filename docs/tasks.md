# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are moved to `docs/done.md`.

## Task 116: Dedicated "Playground" Top Tab with Independent YouTube Player for Uninhibited Subtitle Switching & Interception (Version 1.0.21)
- [/] Subtask 116.1: Update app version to 1.0.21 across `package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts`.
- [ ] Subtask 116.2: Create `src/components/VideoPlayground.tsx` providing an independent, stable YouTube player environment free from external pause/seek/TTS controls, with real-time detected subtitle stream telemetry, cue preview, and 1-click import actions.
- [ ] Subtask 116.3: Integrate top tabs in `src/routes/index.tsx` (Viewer vs Playground), pausing background timers and TTS loops when on Playground, and wiring detected captions into the central catalog.
- [ ] Subtask 116.4: Author dedicated automated test `scripts/verify-video-playground-tab.ts` and register `test:playground-tab` script in `package.json`.
- [ ] Subtask 116.5: Update documentation in `docs/files.md`, `docs/designs/DESIGN_CONTROLS_VIEW.md`, `docs/designs/DESIGN_PLAYER_PROVIDER.md`, and `docs/operations/DEBUG.md`.
- [ ] Subtask 116.6: Run test suites, compile_applet, lint_applet, commit checkpoint, and migrate Task 116 to `docs/done.md`.
