# Deprecated Features

## Manual base-language selection on the Beginner video tab

- **Deprecated:** Selecting a default/base subtitle language by clicking a detected track in the first Beginner Mode tab.
- **Replacement:** The app selects English when an English track is available; otherwise it selects the first detected subtitle track. Downstream tabs unlock after a detected base track is available.
- **Compatibility:** Previously persisted `beginnerSelectedBaseLang` values are ignored and removed from loaded settings. The old setting is no longer written.
- **Reason:** Avoid making users choose a default language before using the Beginner workflow.
- **Deprecated:** 2026-10-24.

## Beginner Mode (Deprecated Workflow)

- **Deprecated:** Guided Beginner Mode workflow (`workflowMode === "beginner"`).
- **Replacement:** Unified progressive pipeline in Advanced Mode (Stage 0: Fetched Subtitles -> Stage 1: Learning Goals & Default Language -> Stage 2: Parallel Subtitles Table -> Stage 3: Synchronized Video & Subtitles Playback -> Stage 4: Settings).
- **Compatibility:** The application defaults to Advanced Mode (`"expert"`). Explicit URL parameter `?mode=beginner` remains available for backward compatibility with existing tests, labelled with a visible `[Deprecated]` status banner, with an immediate 1-click option to navigate to Advanced Studio.
- **Reason:** User request to deprecate beginner mode in favor of the unified staged progressive workflow architecture.
- **UI Visibility:** Deprecated components (header mode toggle button `header-mode-toggle`, mode switcher header button `btn-mode-beginner`, and beginner mode flow container) are hidden from the UI with utility styling (`hidden`) per user request (Prompt 88).
- **Deprecated:** 2026-11-05 (Prompt 85).


