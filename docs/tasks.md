# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Task 139: Shareable Link with Default Subtitles, OpenRouter API Key & Target Language for Translation (Version 1.0.43)
- [ ] **Subtask 139.1**: Extend `src/utils/urlStateManager.ts` to serialize and parse rich shareable state: support `sub_url` (default subtitles timedtext/fixture URL), `sub_data` (direct JSON3/cues payload), `openrouter_key` (OpenRouter API key), and `target_lang` / `tlang` (target translation language), alongside `v` (videoId).
- [ ] **Subtask 139.2**: Implement state hydration and UI sharing controls: hydrate default subtitles, store OpenRouter API key in settings (`setOpenRouterApiKeySetting`), and activate target translation language upon URL load in `src/routes/index.tsx`; build dedicated `ShareStateModal.tsx` component and UI Share button with copy-to-clipboard functionality.
- [ ] **Subtask 139.3**: Bump version to 1.0.43 across all 5 targets (`package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`), author dedicated automated test `scripts/verify-sharable-state-link.ts`, update `docs/files.md`, verify compilation and linting, and migrate to `docs/done.md`.

