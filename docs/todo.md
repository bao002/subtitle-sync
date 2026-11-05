# Active Subtask Mirror (`docs/todo.md`)

- **Status**: [IN_PROGRESS]
- **Active Task**: Task 308 (Prompt 77): Remove Direct Google TTS Client Option Across Entire App
- **Sub-task**: 308.1 - Update `src/lib/alternative-tts.ts` to remove client direct Google TTS URL construction (`GOOGLE_TRANSLATE_TTS_ENDPOINT`, `buildGoogleTranslateTtsUrl`), set `AlternativeTtsEngine` strictly to `"lovable"`, eliminate `"google_translate"` / `"google-tts-directly"` client service options, update fallback order types to remove direct client google fallback, and route remote audio strictly through Lovable Speak API (tts3.lovable.app).
- **Validation**: `compile_applet`, `lint_applet`, dedicated test `scripts/verify-remove-direct-google-tts-client-option.ts`.



