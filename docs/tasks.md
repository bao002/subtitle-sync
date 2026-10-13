# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are moved to `docs/done.md`.

## Task 103: Implement Versioning Discrepancy Architecture & Recovery Mechanisms According to `docs/versioning.md`

- [x] **Subtask 103.1**: Stage Task 103 in Tracking Documentation (`tokens.md`, `tasks.md`, `current-sub-task.md`, `todo.md`, `temp.md`).
- [x] **Subtask 103.2**: Implement native Android safeguards in `MainActivity.kt` (automatic OTA cache invalidation on APK upgrade via `last_run_version_code`, zero-cache headers for local assets, and `clearOtaCache` bridge method).
- [x] **Subtask 103.3**: Implement web-side discrepancy architecture in `src/utils/apkUpdater.ts` & `src/types.ts` (`VersionComparison`, `checkVersionDiscrepancy()`, `clearOtaCacheAndReload()`, bridge typing).
- [x] **Subtask 103.4**: Implement UI dual-version presentation and in-app cache reset controls in `ApkReleaseModal.tsx`.
- [ ] **Subtask 103.5**: Author dedicated automated test suite (`scripts/verify-versioning-discrepancy-implementation.ts`), run all suites, compile (`compile_applet`), lint (`lint_applet`), and migrate Task 103 to `docs/done.md`.
