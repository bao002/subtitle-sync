# Current Subtask (`current-sub-task.md`)

- **Active Subtask**: Hotfix: Fix Android APK build reliability & display Version ID, Commit ID, and Version Description on each version (`android-shell/app/build.gradle.kts`, `.github/workflows/release-apk.yml`, `.github/workflows/emulation.yml`, `src/components/ApkReleaseModal.tsx`, `src/components/ApkReleasesFooter.tsx`, `src/routes/index.tsx`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`, `package.json`).
- **Parent Task**: Hotfix: Android Build APK & Comprehensive Version/Commit Display
- **Objective**: Fix Android APK build timeout and asset execution failure in GitHub Actions, bump version to 1.0.59, and ensure Version ID, Commit ID, and Version Description are clearly and consistently displayed on each version across the header, release modal, footer, and GitHub release artifacts.
- **Suspended Task [ON HOLD]**:
  - Subtask 159.1: Fix theme colors in Beginner mode (`BeginnerFlowContainer.tsx`, `BeginnerTabNav.tsx`, `BeginnerVideoTab.tsx`, `BeginnerPreferencesTab.tsx`, `BeginnerParsingTab.tsx`, `BeginnerPlayerTab.tsx`) replacing hardcoded slate colors with semantic theme tokens (`bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`).
  - Resumption notes: Resume Task 159 immediately after Hotfix is verified, compiled, linted, committed, and logged in `docs/done.md`.
