# Active Task Mirror (`docs/todo.md`)

## Active Subtask: Subtask 179.1 - Align Web Speech Fallback Speed Clamping in `src/lib/alternative-tts.ts`
- **Task**: Task 179 - Harmonize Native TTS Speech Rate Bounds (0.3 - 1.5) & Clean Up Residual Speed State (Version 1.0.72)
- **Status**: [IN PROGRESS]
- **Target Changes**:
  - Update `fallbackToWebSpeech()` in `src/lib/alternative-tts.ts` to clamp `u.rate` to `Math.max(0.3, Math.min(1.5, rate || 0.5))` aligning with native settings.
  - Subtask 179.2: Clean up unused residual `lovableTtsSpeedState` in `src/routes/index.tsx` and `src/components/beginner/tabs/BeginnerPreferencesTab.tsx`.
  - Subtask 179.3: Version 1.0.72 bump, AGENTS.md raw prompt update, dedicated test suite `scripts/verify-native-tts-speed-alignment.ts`, verification, and migration to `docs/done.md`.
