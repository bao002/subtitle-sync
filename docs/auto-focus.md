# Auto-Focus and Auto-Scroll Triggers Specification (`docs/auto-focus.md`)

This document catalogs all auto-focus and auto-scroll triggers in the application and records their permanent disablement status per Prompt 54 (Chapter 2).

---

## 1. Catalog of Auto-Focus & Auto-Scroll Triggers

| ID | Category | Location | Event / Trigger Mechanism | Former Behavior | Disablement Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AF-01** | Auto-Scroll | `src/routes/index.tsx` (`useEffect` line ~4780) | Subtitle active row time update during video playback | Subtitle table automatically calculated delta and altered `panel.scrollTop`, causing viewport jumps while reading. | **DISABLED**: Auto-scroll is disabled by default (`autoFocus = false`); automatic scrolling during cue transitions is turned off. |
| **AF-02** | Auto-Scroll | `src/routes/index.tsx` (`useEffect` line ~5060) | Android active subtitle page boundary change | On Android pagination, table automatically flipped `subtitlesPage` to follow active cue. | **DISABLED**: Auto-scroll page flipping is disabled so the user maintains complete page reading stability. |
| **AF-03** | Auto-Scroll | `src/routes/index.tsx` (`handleNavigateToTtsSettings` line ~1275) | "Navigate to TTS Settings" link clicked | Triggered `el.scrollIntoView({ behavior: "smooth", block: "center" })`, moving user away from their current view. | **DISABLED**: Removed programmatic `scrollIntoView`; navigation updates settings state without forcing viewport repositioning. |
| **AF-04** | Auto-Scroll | `src/routes/index.tsx` (`handleSeekToActiveRow` line ~3991) | Video seek timestamp synchronization | Called `rowEl.scrollIntoView({ behavior: "smooth", block: "center" })` whenever seeking. | **DISABLED**: Removed automatic `scrollIntoView` on seek; video position updates without forcing table scroll. |
| **AF-05** | Auto-Scroll | `src/routes/index.tsx` (`SubtitleFetchToast` line ~9924) | Subtitles fetched notification toast action click | Executed `el.scrollIntoView({ behavior: "smooth", block: "start" })` on subtitles panel. | **DISABLED**: Replaced with clean state opening without scroll jarring. |
| **AF-06** | Auto-Focus | `src/components/LanguageBoxesSelector.tsx` (line ~124) | Language box selection toggle | Executed `btn.focus({ preventScroll: true })` inside `requestAnimationFrame`. | **DISABLED**: Removed programmatic `.focus()` call. |
| **AF-07** | Auto-Focus | `src/components/LanguageBoxesSelector.tsx` (line ~250) | "+ Select more languages" button click | Automatically stole focus to `search-language-input` via `input.focus()`. | **DISABLED**: Removed programmatic `input.focus()`; user focuses input intentionally if they wish. |
| **AF-08** | Auto-Focus | `src/components/LanguageBoxesSelector.tsx` (line ~427) | Expand subtitle URL drawer button click | Executed `btn.focus({ preventScroll: true })` inside `requestAnimationFrame`. | **DISABLED**: Removed programmatic `.focus()` call. |
| **AF-09** | Configuration | `src/utils/appSettings.ts` (`getAutoScrollSetting`) | App launch setting load | Loaded `AUTO_SCROLL_STORAGE_KEY` or defaulted to active scroll. | **DISABLED**: Defaults strictly to `false` (disabled) across sessions. |

---

## 2. Disablement Verification Protocol

All auto-focus and auto-scroll triggers have been audited and neutralized. Automated regression tests verify:
1. `getAutoScrollSetting()` defaults to `false`.
2. Programmatic `focus()` calls are completely omitted from language selectors.
3. Programmatic `scrollIntoView()` calls on playback/seek/navigation are eliminated.
4. Active cue transitions in subtitles table do not trigger automatic scrolling without explicit user consent.
