# Current Subtask (`current-sub-task.md`)

- **Status**: [IN_PROGRESS]
- **Active Task**: Task 270: Remote Speak API Token Authentication (`spk_...`) & Upstream Provider Key Separation
- **Sub-task**: Sub-task 270.1: Classify Speak API Personal Bearer Tokens (`spk_...`, `tts_...`) vs Upstream Provider Keys (`sk_...`, `sk-or-...`) in `src/lib/alternative-tts.ts`, send `Authorization: Bearer <token>` header, and prevent injecting `spk_...` into `body.api_key`.
- **Validation**: Dedicated automated test `scripts/verify-spk-token-auth-and-tts3.ts`, `npm run lint`, and `compile_applet`.
