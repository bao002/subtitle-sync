# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

### Task 171: Integrate Lovable Speak API (tts2.lovable.app/api/public/openapi.json) as Alternative TTS Option (Version 1.0.65) [ACTIVE]

#### Objective:
Integrate `https://tts2.lovable.app/api/public/openapi.json` as the primary alternative TTS option alongside Google Translate fallback, exposing provider ("google", "lovable", "openrouter"), voices, and OpenAPI link in both Advanced and Beginner modes.

#### Subtasks:
- [ ] **Subtask 171.1**: Enhance `src/lib/alternative-tts.ts` with full OpenAPI 3.1.0 parameter support, voices catalog, provider selection, and API key forwarding [ACTIVE].
- [ ] **Subtask 171.2**: Update UI in `src/routes/index.tsx` and `BeginnerPreferencesTab.tsx` with Lovable TTS engine, provider/voice selectors, OpenAPI link, and test button.
- [ ] **Subtask 171.3**: Bump version to `1.0.65` across all 5 targets, author `scripts/verify-lovable-tts2-openapi.ts`, compile, lint, commit, and migrate to `docs/done.md`.

## Later Tasks

*(No remaining later tasks — all staged into active backlog)*






