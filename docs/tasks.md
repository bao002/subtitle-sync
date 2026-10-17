# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Task 138: Clean Subtitles Table on Video Switch & Cache/Load AI Subtitles (Version 1.0.42)
- [ ] **Subtask 138.1**: Fix subtitles table cleaning on video change: when `videoId` transitions (e.g. user enters new URL, selects another video from library, or switches videos), ensure `tracks`, `rawTracks`, `rows`, `active`, `playedTtsRecords`, `subtitlesPage`, and table display are cleanly flushed so previous video subtitles never linger in the table.
- [ ] **Subtask 138.2**: Implement caching of AI-returned subtitles: persist AI-punctuated subtitles in cache with videoId, language, model, and timestamp metadata; add UI controls in `AiSubtitlePunctuationTab.tsx` (and `src/routes/index.tsx`) to inspect, load, and re-apply cached AI subtitles on demand without re-running API calls.
- [ ] **Subtask 138.3**: Bump version to 1.0.42 across all 5 targets (`package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`), author dedicated automated test `scripts/verify-video-switch-table-reset-and-ai-cache.ts`, update `docs/files.md`, run verification, commit, push, and migrate to `docs/done.md`.
