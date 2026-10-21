# Current Subtask (`current-sub-task.md`)

## Active Subtask: Subtask 177.1 - Add OpenRouter API Key Setting Input with LocalStorage Persistence
- **Parent Task**: Task 177: Chapter 2 - Allow Updating Settings and Setting OpenRouter-Key for the Service (and Save to LocalStorage) (Version 1.0.70)
- **Status**: [ACTIVE]
- **Target Files**:
  - `src/lib/alternative-tts.ts`
  - `src/utils/appSettings.ts`
  - `src/routes/index.tsx`
  - `src/components/beginner/tabs/BeginnerPreferencesTab.tsx`
- **Objective**: Expose an OpenRouter API key input in Alternative TTS settings across Advanced and Beginner modes, with password visibility toggle, save handler, and localStorage synchronization (`yt_openrouter_api_key` and `yt_alternative_tts_lovable_api_key_v1`), passing the key to Lovable/OpenRouter TTS requests.
