# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

### Task 177: Chapter 2 - Allow Updating Settings and Setting OpenRouter-Key for the Service (and Save to LocalStorage) (Version 1.0.70) [ACTIVE]

#### Objective:
Expose settings input for OpenRouter API key in both Advanced Mode and Beginner Mode alternative TTS cards, synchronize persistence in localStorage (`yt_openrouter_api_key` and `yt_alternative_tts_lovable_api_key_v1`), and use it when calling the service.

#### Subtasks:
- [ ] **Subtask 177.1**: Add OpenRouter API key setting input with show/hide password toggle, save button, and localStorage sync in Advanced and Beginner modes [ACTIVE].
- [ ] **Subtask 177.2**: Bump version to 1.0.70 across 5 targets, author dedicated test `scripts/verify-openrouter-key-settings.ts`, update `docs/files.md`, compile, lint, commit, and migrate Task 177 to `docs/done.md`.

### Task 178: Chapter 3 - Fall Back to Server's OpenRouter API Key Based on .env Settings (Version 1.0.71) [PENDING]

#### Objective:
When user has not provided a custom OpenRouter API key, automatically fall back to the server's key configured in `.env` (`VITE_OPENROUTER_API_KEY` / `OPENROUTER_API_KEY`). Create `.env.example` template and indicate server-key status in UI.

#### Subtasks:
- [ ] **Subtask 178.1**: Implement `getEffectiveOpenRouterApiKey()`, fall back to server `.env` settings, create `.env.example`, and display server-key status in settings UI.
- [ ] **Subtask 178.2**: Bump version to 1.0.71 across 5 targets, author dedicated test `scripts/verify-server-openrouter-env-key.ts`, update `docs/files.md`, compile, lint, commit, and migrate Task 178 to `docs/done.md`.

## Later Tasks

_(No remaining later tasks — all staged tasks into active backlog)_
