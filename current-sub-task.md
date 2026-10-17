# Current Subtask (`current-sub-task.md`)

## Active Subtask: Subtask 142.3 - Exclude Default Subtitles from Spoken TTS by Default
- **Task**: Task 142 - By Default Exclude Default Subtitles from TTS-Play
- **Status**: [IN PROGRESS]
- **Focus**:
  - In `src/routes/index.tsx`:
    - Ensure `getInitialFavoriteLanguages` / `spoken` initialization excludes `baseLanguage` / default caption language by default when `getExcludeDefaultSubtitlesFromTTSSetting()` is enabled.
    - When tracks/captions are loaded or intercepted, do not auto-include `defaultLang` / `baseLanguage` in `spoken`.
    - Automatically filter out `baseLanguage` from `spoken` by default upon base language discovery.
  - In `BeginnerFlowContainer.tsx`:
    - When a base subtitle is selected, exclude it from target/favorite languages for TTS speech.
    - In `DEFAULT_APP_SETTINGS`, initialize `beginnerFavoriteLangs` without the base language.
