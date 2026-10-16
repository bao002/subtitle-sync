# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Task 131: On-Demand Translation Ahead (X=10 sentences) via Google Translate API (Version 1.0.36)
- [ ] Subtask 131.1: Version bump to 1.0.36 across all 5 targets (`package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`).
- [ ] Subtask 131.2: Add on-demand translation configuration in `src/utils/appSettings.ts` (`enableOnDemandTranslation`, `onDemandTranslationSentencesAhead = 10`).
- [ ] Subtask 131.3: Create `src/utils/onDemandTranslationManager.ts` with user-specified `translateWithGoogle`, caching, and lookahead translation coordination.
- [ ] Subtask 131.4: Integrate on-demand translation in `src/routes/index.tsx` so until YouTube timedtext arrives, next X=10 sentences ahead are pre-translated for target languages.
- [ ] Subtask 131.5: Author dedicated automated test `scripts/verify-on-demand-translation.ts`, register in `package.json` and `docs/files.md`, run tests, compile and lint.
- [ ] Subtask 131.6: Migrate completed tasks to `docs/done.md` and clean backlog.

