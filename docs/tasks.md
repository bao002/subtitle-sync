# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are moved to `docs/done.md`.

## Task 120: Web-Demo Mode Video & Subtitles URLs Input for Per-Language Subtitle Fetching (Version 1.0.24)

- [ ] Subtask 120.1: Bump version to 1.0.24 across `package.json`, `android-shell/app/build.gradle.kts` (versionCode 10024, versionName "1.0.24"), `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts`.
- [ ] Subtask 120.2: Create modular component `src/components/WebDemoUrlsInput.tsx` providing inputs for video URL and subtitle URLs (timedtext base URL or per-language subtitle URLs) with per-language fetching and parsing.
- [ ] Subtask 120.3: Integrate `WebDemoUrlsInput` into `src/routes/index.tsx` for web-demo mode (`!isAndroid`), wiring it to load the video and populate `tracks` with fetched per-language subtitles.
- [ ] Subtask 120.4: Author dedicated automated test `scripts/verify-web-demo-subtitles-urls-input.ts`, register `test:web-demo-subtitles-urls` in `package.json`, and update documentation in `docs/files.md`, `docs/reliable-subtitles-fetching.md`, and `docs/designs/DESIGN_CONTROLS_VIEW.md`.
- [ ] Subtask 120.5: Execute dedicated verification test, confirm clean compilation (`compile_applet`) and zero-error linting (`lint_applet`), commit progress, and migrate Task 120 to `docs/done.md`.
