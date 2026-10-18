# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Task 144: Permanent Android Continuous Background Audio & Video Playback (Version 1.0.47)

### Objective:
Ensure the Android app supports background audio and video playback reliably and permanently (not just once) by overriding WebView window visibility reporting, acquiring proactive audio focus, and maintaining continuous foreground service and wake lock state.

### Subtasks:
- [ ] **Subtask 144.1**: Bump app version from 1.0.46 to 1.0.47 / 10047 across `package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts`.
- [ ] **Subtask 144.2**: Record verbatim prompt in `## Last raw prompt` of `AGENTS.md`.
- [ ] **Subtask 144.3**: Enhance `MainActivity.kt` with `BackgroundPlayableWebView` (overriding `onWindowVisibilityChanged` to permanently forward `View.VISIBLE` to Chromium) and auto-start `BackgroundAudioService` on initialization and playback.
- [ ] **Subtask 144.4**: Enhance `BackgroundAudioService.kt` with proactive `AudioManager` Audio Focus management (`AUDIOFOCUS_GAIN`) and media usage attributes.
- [ ] **Subtask 144.5**: Author dedicated verification script `scripts/verify-continuous-background-playback.ts`, register in `package.json` (`test:continuous-background-playback`) and `docs/files.md`.
- [ ] **Subtask 144.6**: Run automated test suite, compile (`compile_applet`), lint (`lint_applet`), commit, and migrate Task 144 to `docs/done.md`.
