# Current Subtask

No active subtask. Most recently completed: **Task 65: Remove Language Video Player Accordion, Harmonize Accordion VideoIDs & Remove Android Subtitle Fixtures**.

### Verification Summary:
- **Language Video Player Accordion Removal**: Verified with `npm run test:language-player-accordion` and `npm run test:accordion-colors` passing with 0 errors. Removed from `PANELS`, `ACCORDION_THEMES`, `openPanels`, and the UI.
- **Harmonized Accordion VideoIDs**: Verified with `npm run test:accordion-video-id-and-no-android-fixtures`. All accordion elements receive `videoId={videoId}` and render `data-video-id={videoId}` on the `<details>` elements. Subtitles and columns handle all video IDs uniformly.
- **No Subtitle Fixtures in Android Application**: Removed asset fixture loading (`fixtures/$videoId/en.json`, `fixtures/L2Ryrr6txwA/en.json`) from `MainActivity.kt`. Removed fake synthetic subtitle generators (`generateDefaultSubtitlesJson` and `generateTranslatedFallbackJson`) from `MainActivity.kt`. Removed `JSON3_RAW_MAP` fallback from `fetchFavoriteLanguageSubtitles` in `src/routes/index.tsx`.
- **Parity & Tests**: `npm run test:commit-25131f0-parity`, `npm run test:android-loading`, `npm run test:android-run-parity`, `npm run test:native-captions`, and `npm run test:youtube-share-intent` all pass with 0 errors.
- **Compilation & Linting**: `compile_applet`, `npm run build`, and `lint_applet` pass with 0 errors and 0 warnings.
