# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

- [ ] **Hotfix: Android APK Build Reliability & Version/Commit/Description Display on Each Version**
  - [ ] Hotfix.1: Fix Android build workflow timeout and asset execution failure (`android-shell/app/build.gradle.kts`, `.github/workflows/release-apk.yml`, `.github/workflows/emulation.yml`), adding safe error ignoring on asset build and extending timeouts.
  - [ ] Hotfix.2: Bump application version to 1.0.59 (versionCode 10059) across `package.json`, `android-shell/app/build.gradle.kts`, `src/utils/apkUpdater.ts`, `src/config/appConfig.ts`, and `src/utils/appSettings.ts`.
  - [ ] Hotfix.3: Ensure Version ID, Commit ID, and Version Description are clearly and consistently displayed on each version in `ApkReleaseModal.tsx`, `ApkReleasesFooter.tsx`, `src/routes/index.tsx`, and `.github/workflows/release-apk.yml`.
  - [ ] Hotfix.4: Implement dedicated verification test `scripts/verify-android-build-hotfix-and-version-details.ts`, verify app compilation and linting, commit, and migrate to `docs/done.md`.

- [ ] **Task 159: Theme Colors Fix (Beginner Mode & Blue Theme Coherence) [ON HOLD - Pending Hotfix]**
  - [ ] Subtask 159.1: Fix theme colors application in Beginner mode (`src/components/beginner/BeginnerFlowContainer.tsx` and child components) so the active theme is properly applied.
  - [ ] Subtask 159.2: Fix blue theme in `src/config/accordionThemes.ts` and UI views so it does not mix light mode with blue mode (ensuring consistent blue palette).
  - [ ] Subtask 159.3: Add and run dedicated verification test `scripts/verify-theme-colors-consistency.ts`, verify compilation, lint, commit, push, and migrate to `docs/done.md`.

- [ ] **Task 160: Android Emulator GitHub Actions Execution & Telemetry Evidence Docs**
  - [ ] Subtask 160.1: Expand `docs/android.md` defining how GitHub Actions utilizes the Android emulator runner to test the app.
  - [ ] Subtask 160.2: Document the specific evidence presented in the report proving the app was genuinely tested on a real Android device/emulator (system telemetry, live adb screencap screenshots, logcat tags, native network calls).
  - [ ] Subtask 160.3: Add and run dedicated verification test `scripts/verify-android-emulator-docs-evidence.ts`, verify compilation, lint, commit, push, and migrate to `docs/done.md`.

---

## Later Tasks

The following tasks were requested for "later" by the user and are stored here to be processed upon confirmation:

*(No pending later tasks currently in queue)*
