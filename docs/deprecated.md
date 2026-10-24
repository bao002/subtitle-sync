# Deprecated Features

## Manual base-language selection on the Beginner video tab

- **Deprecated:** Selecting a default/base subtitle language by clicking a detected track in the first Beginner Mode tab.
- **Replacement:** The app selects English when an English track is available; otherwise it selects the first detected subtitle track. Downstream tabs unlock after a detected base track is available.
- **Compatibility:** Previously persisted `beginnerSelectedBaseLang` values are ignored and removed from loaded settings. The old setting is no longer written.
- **Reason:** Avoid making users choose a default language before using the Beginner workflow.
- **Deprecated:** 2026-10-24.