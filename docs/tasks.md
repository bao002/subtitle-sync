# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are moved to `docs/done.md`.

## Task 126: Provide Per-Language Subtitle URL Input via Language Button & Clean Top Bar of Redundant Drawer (Version 1.0.29)
- [ ] Subtask 126.1: Bump version to 1.0.29 across `package.json`, `android-shell/app/build.gradle.kts` (versionCode 10029, versionName "1.0.29"), `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts`.
- [ ] Subtask 126.2: Author modular `src/components/LanguageSubtitleUrlModal.tsx` component allowing users to input and fetch a subtitle URL for any specific language, validating via `isValidJsonSubtitleResponse` and updating tracks.
- [ ] Subtask 126.3: In `src/routes/index.tsx`, add an accessible Subtitle URL action button on each language in the Languages panel table, opening the per-language subtitle URL input modal.
- [ ] Subtask 126.4: In `src/components/WebDemoUrlsInput.tsx`, clean the top bar so the redundant drawer is hidden/removed while maintaining accessibility via the language button.
- [ ] Subtask 126.5: Author dedicated test `scripts/verify-language-button-subtitle-url.ts`, update `docs/files.md`, run full test suite, compile (`compile_applet`), and lint (`lint_applet`).
- [ ] Subtask 126.6: Git checkpoint, attempt push, and migrate Task 126 to `docs/done.md`.
