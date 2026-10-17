# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Task 134: Multi-Batch AI Subtitle Punctuation, Robust Free Tier Rate-Limit Handling & Solely-Punctuation Translation Integration (v1.0.39)

- [x] **Subtask 134.1**: Version 1.0.39 Bump across 5 version targets (`package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`).
- [x] **Subtask 134.2**: Implement multi-batch chunking, progress reporting, and exponential backoff retry in `src/utils/openRouterAiService.ts`.
- [x] **Subtask 134.3**: Integrate solely-punctuation alignment & sentence boundary lookahead segmentation in `src/utils/onDemandTranslationManager.ts` and `src/components/AiSubtitlePunctuationTab.tsx`.
- [x] **Subtask 134.4**: Add quick-select model presets, latency display, and abort cancellation in `src/components/AiSubtitlePunctuationTab.tsx`.
- [ ] **Subtask 134.5**: Author dedicated verification script `scripts/verify-ai-punctuation-pipeline.ts`, register in `package.json` and `docs/files.md`.
- [ ] **Subtask 134.6**: Run tests, verify clean compilation (`compile_applet`) and linting (`lint_applet`), checkpoint, and migrate Task 134 to `docs/done.md`.
