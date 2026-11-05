# Current Subtask (`current-sub-task.md`)

- **Status**: [IN_PROGRESS]
- **Active Task**: Task 307: TTS3 Service Authorization Code Input & POST Request Execution
- **Sub-task**: 307.1 - Update `TtsServiceSettingsPanel.tsx` (and `BeginnerPreferencesTab.tsx`) so choosing the TTS service "tts3.lovable.app" always displays the Authorization Code input field, accepting `Bearer spk_...` or `spk_...`.
- **Validation**: Dedicated test `scripts/verify-tts3-service-post-and-auth.ts`, Storybook stories, `compile_applet`, `lint_applet`.
