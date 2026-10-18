# Active Task Mirror (`docs/todo.md`)

- **Task 150: Alternative TTS Service with Lovable Speak API**: [COMPLETED]
  - **Sub-task 150.1**: [COMPLETED] Extend `src/lib/alternative-tts.ts` with Lovable Speak API support, engine selection (`"lovable"` | `"google_translate"`), voice / provider options, and robust audio stream playback.
  - **Sub-task 150.2**: [COMPLETED] Author dedicated automated test suite `scripts/verify-lovable-alternative-tts.ts` and add `test:alternative-tts` to `package.json`.
  - **Sub-task 150.3**: [COMPLETED] Update UI controls in `src/routes/index.tsx` (and `BeginnerPreferencesTab.tsx`) with engine selector, OpenAPI link, and test preview button.
  - **Sub-task 150.4**: [COMPLETED] Bump app version to 1.0.54 (10054), verify compilation, lint, commit, push, and migrate to `docs/done.md`.
