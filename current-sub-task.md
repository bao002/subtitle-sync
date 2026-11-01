# Current Subtask (`current-sub-task.md`)

- **Status**: [IN_PROGRESS]
- **Active Task**: Task 266: Provide in-place control to extend the list of favorite languages within Stage 2 Learning Goals card
- **Active Subtask**: 266.1 - Implement favorite language extension in `#stage-2-learning-goals-card`, bump app version to 2.0.67, and verify with dedicated test suite
- **Target Files**:
  - `src/routes/index.tsx`
  - `package.json`
  - `android-shell/app/build.gradle.kts`
  - `src/config/appConfig.ts`
  - `src/utils/apkUpdater.ts`
  - `src/utils/appSettings.ts`
  - `scripts/verify-stage-2-extend-favorite-languages.ts`
- **Validation**: `npm run test:stage-2-extend-favorite-languages`, `compile_applet`, `lint_applet`
