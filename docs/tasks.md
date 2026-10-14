# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are moved to `docs/done.md`.

## Task 113: Subtitle Fetch Pacing, Strategy Options, Auto-TTS Language Name, Default Debug Mode & All Parser Criteria
- [ ] Subtask 113.1: Update app version to 1.0.19 across `package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts`.
- [ ] Subtask 113.2: Enable Debug Mode by default in `src/utils/appSettings.ts` and `src/routes/index.tsx`, update `scripts/verify-debug-mode-toggle.ts`.
- [ ] Subtask 113.3: Set default parsing criteria to check all options (combining all categories: syntax, timing, alignment) in `src/routes/index.tsx` and `src/lib/subtitles.ts`.
- [ ] Subtask 113.4: Add setting & implementation to TTS-play language name when a new subtitle is fetched (`speakLanguageNameOnFetch` default `true`).
- [ ] Subtask 113.5: Implement subtitle fetch window rate-limiting (never >1 fetch in window frame of X seconds, default 5s) and strategy options (random, server-alternate, session, tlang/lang toggles) with explanation in `docs/reliable-subtitles-fetching.md` and `src/components/AttemptOrderSettings.tsx`.
- [ ] Subtask 113.6: Author dedicated automated test `scripts/verify-fetch-strategy-and-defaults.ts`, run verification, compile_applet, lint_applet, git checkpoint, and migrate to `docs/done.md`.
