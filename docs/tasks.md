# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

### Task 174: Extend Lovable Speak API (OpenAPI 3.1.0) Support: POST Method, JSON/Base64 Audio, Target Language Translation, API Key, and Formats (Version 1.0.67) [ACTIVE]

#### Objective:
Fully extend support for `https://tts2.lovable.app/api/public/openapi.json` to cover all aspects of the OpenAPI 3.1.0 specification: POST method (`application/json`), format selection (`binary` vs `json` with base64 audio decoding and playback), target language translation (`target_lang`), custom OpenRouter API key forwarding (`api_key`), resilient audio playback, and complete UI parity across Advanced and Beginner modes.

#### Subtasks:
- [ ] **Subtask 174.1**: Extend `src/lib/alternative-tts.ts` with POST synthesis (`application/json`), base64 JSON response playback (`data:${mime};base64,${audio}`), target language translation (`target_lang`), API key handling, and storage helpers [ACTIVE].
- [ ] **Subtask 174.2**: Enhance Alternative TTS UI in both Advanced Mode (`src/routes/index.tsx`) and Beginner Mode (`BeginnerPreferencesTab.tsx`) with HTTP Method toggle, Format selector, OpenRouter API Key input, and Target Language options.
- [ ] **Subtask 174.3**: Bump version to 1.0.67 across all 5 targets, author `scripts/verify-extended-lovable-tts-openapi.ts`, update `docs/files.md`, run test suites, compile, lint, commit, attempt push, and migrate to `docs/done.md`.

## Later Tasks

_(No remaining later tasks — all staged into active backlog)_
