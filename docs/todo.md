# Active Task Mirror (`docs/todo.md`)

## Active Subtask: Subtask 180.3 - Version 1.0.73 Parity, Dedicated Test Suite & Quality Gates
- **Task**: Task 180: Enable Switching Between Alternative TTS Providers ("lovable", "google", "openrouter") in Advanced and Beginner Modes (Version 1.0.73)
- **Status**: [ACTIVE]
- **Target**:
  - Bump app version to `1.0.73` (versionCode `10073`) across all 5 targets: `package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts`.
  - Author dedicated test suite `scripts/verify-alternative-tts-providers-switching.ts` and register in `package.json` and `docs/files.md`.
  - Update `scripts/verify-env-and-lockfile-hygiene.ts` to allow version `>= 1.0.72`.
  - Run all verification test suites, `compile_applet`, `lint_applet`, commit, push, and migrate to `docs/done.md`.
