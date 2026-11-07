# Component Design: Language Goals (`docs/component_design/language_goals.md`)

## 1. Executive Summary & Purpose

The **Learning Goals** component governs language selection, translation reference source, narration frequency, sentence playback ordering, and speech exclusions during synchronized multi-language video playback.

This design document establishes the component layout, element splitting, and interaction patterns for:
1. **Translation Source & Default Language**: Setting the primary source language from successfully fetched tracks, adhering strictly to the constraint that **no secondary language tag is defined or presented**.
2. **Favorite Languages Management**: Selecting approved learning languages and adding new ones in-place from the supported language catalog.
3. **Split Element by Ingredient Types (Each Ingredient Type Contains All Languages)**:
   Instead of grouping by language with 4 sub-controls, the element is structured into **4 distinct top-level ingredient sections**. Each ingredient section groups and displays controls for **all languages**, and **only the Order section contains the video-player bar precedence**:
   - **Ingredient Section 1: Order of Playing (together with the video-playing precedence bar)**: Reorders language playback sequence (`Earlier` / `Later`) and integrates the in-between `VideoPlaybackPrecedenceBar` indicating exact video playback position relative to spoken tracks.
   - **Ingredient Section 2: TTS-Play Ratio (slider control with plus/minus buttons on 2 edges)**: Lists all active languages, each with a continuous range slider flanked by minus `[-]` and plus `[+]` boundary buttons, proportion readout `1:{ratio}`, and preset buttons.
   - **Ingredient Section 3: Blacklisted (sentence mute vs word TTS)**: Lists all active languages with a dedicated toggle to skip sentence TTS while allowing word TTS per language.
   - **Ingredient Section 4: Sentence or Word (granularity & strategy)**: Lists all active languages with controls to switch between sentence-level and word-level TTS (with Longest vs Random pick strategy).

---

## 2. Element Architecture & Behavioral Constraints

### Element 1: Default Translation Source
- **Role**: Designates the primary base subtitle track from which translations originate and against which parallel alignment is synchronized.
- **Acquisition Restriction**: The default language can ONLY be selected from languages whose subtitles have already been fetched and validated (`fetchedSubtitleLanguages`).
- **Tagging Constraint**:
  - **Permitted**: Primary / Default Source badge (`Default Source (1x)`).
  - **Strictly Prohibited**: Defining or presenting a `Secondary` tag. Non-default languages are simply target learning tracks without redundant or deprecatory "secondary" labeling.

### Element 2: Favorite Languages List & Add Language Control
- **Approved Learning Languages**: Clickable badges for all saved favorites allowing instantaneous toggling on/off for active video study.
- **In-Place Add Language Control**: Search and filter input paired with an interactive datalist and suggestion chips to add catalog languages directly to favorites and approve them for video learning.

---

## 3. Four Ingredient Type Sections Architecture

Each of the 4 ingredient types forms its own dedicated container/card containing controls for **all active languages**:

```
+===================================================================================================+
| 1. Order of Playing (with Video-Playing Precedence Bar)                                           |
|   [Film Bar: Position 0]                                                                          |
|   - English (en) [Default Source (1x)]   [▲ Earlier] [🎬 Place Video Here] [▼ Later]              |
|   [Film Bar: Position 1 (Video Plays Here)]                                                       |
|   - Hebrew (he)                          [▲ Earlier] [🎬 Place Video Here] [▼ Later]              |
|   - Spanish (es)                         [▲ Earlier] [🎬 Place Video Here] [▼ Later]              |
+===================================================================================================+
| 2. TTS-Play Ratio (Slider with +/- buttons on 2 edges)                                            |
|   - English (en):  [-] =======[ Thumb ]======= [+]  1:1   [1] [2] [3] [4] [5] [7] [10] [15] [20]  |
|   - Hebrew (he):   [-] =======[ Thumb ]======= [+]  1:3   [1] [2] [3] [4] [5] [7] [10] [15] [20]  |
|   - Spanish (es):  [-] =======[ Thumb ]======= [+]  1:5   [1] [2] [3] [4] [5] [7] [10] [15] [20]  |
+===================================================================================================+
| 3. Blacklisted (Choose language to skip sentence TTS, allow word TTS)                              |
|   - English (en):  [🔊 Whitelisted]                                                               |
|   - Hebrew (he):   [🚫 Blacklisted (Skip sentence, allow word)]                                   |
|   - Spanish (es):  [🔊 Whitelisted]                                                               |
+===================================================================================================+
| 4. Sentence or Word (Granularity & Strategy)                                                      |
|   - English (en):  [Mode: Sentence]                                                               |
|   - Hebrew (he):   [Mode: Word]  [Strategy: Longest | Random]                                     |
|   - Spanish (es):  [Mode: Sentence]                                                               |
+===================================================================================================+
```

### Ingredient 1: Order of Playing & Video-Playing Precedence Bar
- **Scope**: Contains ALL active languages in their current playback sequence.
- **Video Precedence Exclusivity**: ONLY Ingredient 1 contains the video-playing precedence bar (`VideoPlaybackPrecedenceBar`) and the precedence bar placement buttons (`btn-place-video-before-${langCode}`).
- **Controls per Language**:
  - Earlier button (`ChevronUp`): moves language up in priority.
  - Video Bar button (`Film`): anchors the video precedence bar directly before this language.
  - Later button (`ChevronDown`): moves language down in priority.

### Ingredient 2: TTS-Play Ratio (All Languages)
- **Scope**: Contains ALL active languages with their narration frequency ratio controls.
- **Controls per Language**:
  - Minus button `[-]` on left edge (decrements ratio by 1, min 1).
  - Continuous/discrete range slider in the center (`min=1`, `max=20`, `step=1`).
  - Plus button `[+]` on right edge (increments ratio by 1, max 20).
  - Ratio display readout (`1:{ratio}`).
  - Accessible preset pills (`1, 2, 3, 4, 5, 7, 10, 15, 20`).

### Ingredient 3: Blacklisted (All Languages)
- **Scope**: Contains ALL active languages with their sentence mute vs word TTS controls.
- **Controls per Language**:
  - Dedicated toggle button (`stage-2-toggle-blacklist-${langCode}`).
  - Labeled `Blacklisted (Skip sentence, allow word)` or `Whitelisted (Active)`.
  - Tooltips explicitly document that sentence narration is skipped while per-word interactive speech remains permitted.

### Ingredient 4: Sentence or Word (All Languages)
- **Scope**: Contains ALL active languages with their granularity switch.
- **Controls per Language**:
  - Granularity toggle (`zero-knowledge-toggle-${langCode}`) toggling between `Mode: Sentence` and `Mode: Word`.
  - Strategy selectors (`Longest` vs `Random`) rendered when Word mode is active for that language.

---

## 4. Advanced vs Beginner Mode Parity

In accordance with the Absolute Parity Rule:
1. **Identical Rules & Pipeline**: All ratio boundaries (1:1 to 1:20), blacklist semantics (sentence mute + word speech), and video precedence positioning operate identically across both modes.
2. **Shared Preferences Store**: Synced via `localStorage` keys (`yt_tts_ratios_v1`, `yt_tts_blacklist_v1`, `yt_primary_tts_lang_v1`) and persisted per-video via `saveVideoSettings(videoId, ...)`.
3. **No Secondary Tag**: Neither mode displays any "Secondary" badge.

---

## 5. Verification & Testing Contracts

1. **Test Suite**: Dedicated script `scripts/verify-learning-goals-component-design.ts`.
2. **Structural Assertions**:
   - `docs/component_design/language_goals.md` exists and defines the 4 top-level ingredient type sections containing all languages.
   - Secondary language tag is completely omitted.
   - Video precedence bar is rendered exclusively in Ingredient 1 (Order of Playing).
   - Ingredients 2, 3, and 4 each contain all languages with their respective single control type.
