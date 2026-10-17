# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Task 142: By Default Exclude Default Subtitles from TTS-Play (Version 1.0.45)

### Objective:
Ensure that by default, the default subtitle track (baseLanguage / original spoken language of the video) is excluded from TTS pronunciation, so that only translation/target languages are spoken by TTS, while allowing manual opt-in.

### Subtasks:
- [ ] **Subtask 142.1**: Bump Application Version to 1.0.45 across all 5 targets (`package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`).
- [ ] **Subtask 142.2**: Add `excludeDefaultSubtitlesFromTTS` (default `true`) configuration and getters/setters in `src/utils/appSettings.ts`.
- [ ] **Subtask 142.3**: Exclude baseLanguage / default subtitles from `spoken` by default in `src/routes/index.tsx` (initialization, track loading, and caption interception) and in `BeginnerFlowContainer.tsx`.
- [ ] **Subtask 142.4**: Implement dedicated automated test (`scripts/verify-exclude-default-subtitles-tts.ts`), run compilation, lint, git commit & push, and update documentation.
