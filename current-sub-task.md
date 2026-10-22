# Current Subtask (`current-sub-task.md`)

 
## Active Subtask: Subtask 180.3 - Version 1.0.73 Parity, Dedicated Test Suite & Quality Gates
- **Task**: Task 180: Enable Switching Between Alternative TTS Providers ("lovable", "google", "openrouter") in Advanced and Beginner Modes (Version 1.0.73)
- **Status**: [ACTIVE]
- **Target**:
  - Bump app version to `1.0.73` (versionCode `10073`) across all 5 targets: `package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts`.
  - Author dedicated test suite `scripts/verify-alternative-tts-providers-switching.ts` and register in `package.json` and `docs/files.md`.
  - Update `scripts/verify-env-and-lockfile-hygiene.ts` to allow version `>= 1.0.72`.
  - Run all verification test suites, `compile_applet`, `lint_applet`, commit, push, and migrate to `docs/done.md`.
=======
## Active Subtask: Subtask 179.1 - Align Web Speech Fallback Speed Clamping in `src/lib/alternative-tts.ts`
- **Task**: Task 179 - Harmonize Native TTS Speech Rate Bounds (0.3 - 1.5) & Clean Up Residual Speed State (Version 1.0.72)
- **Status**: [IN PROGRESS]
- **Target Changes**:
  - Update `fallbackToWebSpeech()` in `src/lib/alternative-tts.ts` to clamp `u.rate` to `Math.max(0.3, Math.min(1.5, rate || 0.5))` aligning with native settings.
  - Subtask 179.2: Clean up unused residual `lovableTtsSpeedState` in `src/routes/index.tsx` and `src/components/beginner/tabs/BeginnerPreferencesTab.tsx`.
  - Subtask 179.3: Version 1.0.72 bump, AGENTS.md raw prompt update, dedicated test suite `scripts/verify-native-tts-speed-alignment.ts`, verification, and migration to `docs/done.md`.
 
