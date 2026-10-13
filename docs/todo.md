# Active Task Mirror (`docs/todo.md`)

- **Subtask 103.5**: Author dedicated automated test suite (`scripts/verify-versioning-discrepancy-implementation.ts`), run all suites, compile (`compile_applet`), lint (`lint_applet`), and migrate Task 103 to `docs/done.md`.
  - **Status**: ACTIVE
  - **Objective**: Author `scripts/verify-versioning-discrepancy-implementation.ts` validating:
    1. `MainActivity.kt` contains `clearOtaCacheOnApkUpgrade`, zero-cache headers, and `clearOtaCache` bridge method.
    2. `src/types.ts` contains `clearOtaCache` on `AndroidNativeShell`.
    3. `src/utils/apkUpdater.ts` exports `VersionComparison`, `checkVersionDiscrepancy`, and `clearOtaCacheAndReload`.
    4. `src/components/ApkReleaseModal.tsx` contains dual-version display, discrepancy warning banner, and `clear-ota-cache-btn`.
    5. Register `test:versioning-discrepancy-implementation` in `package.json` and `docs/files.md`.
    6. Verify all test suites, compile, lint, and migrate Task 103 to `docs/done.md`.
