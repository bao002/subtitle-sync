# Implementation Plan: Alternative Beginner-Mode Tab-Based Flow for Android App & Web Demo

This plan outlines the architecture and execution steps for introducing an alternative **Beginner-Mode** tab-based interface for the Android application and web demo, centered on the most reliable default subtitle fetch detection workflow.

---

## User Review Required

> [!NOTE]
> Based on your clarifications:
>
> 1. **Mode Switcher**: A persistent switch in the header (`[Beginner Mode | Advanced Studio]`) allows switching modes at any time.
> 2. **Navigation**: Downstream tabs are disabled until a base subtitle track is selected. Once unlocked, users can navigate back and forth freely without resetting state.
> 3. **Parsing Presets**: The parsing tab defaults to splitting by sentence punctuation with automatic removal of speaker brackets (`[ ... ]`, `( ... )`) and arrow prefixes (`>`, `>>`).

---

## Proposed Changes

### 1. State Management & Preferences

#### [src/utils/appSettings.ts] & [src/lib/playback-preferences.ts]

- Add `appWorkflowMode: "beginner" | "expert"` to user preferences stored in `localStorage`.
- Add beginner-mode tab state tracking: active tab (`"video" | "preferences" | "parsing" | "player"`), unlocked tabs set, and selected base subtitle language.
- Add punctuation splitting settings and custom character removal rules (default: `removePunctuationChars: [">", ">>"]`, strip bracketed speaker indicators).

---

### 2. Header & Mode Switcher

#### [src/components/ModeSwitcherHeader.tsx] (New Component)

- Provides a compact, non-intrusive switch in the application header: `Beginner Mode` vs `Advanced Studio`.
- Shows a helpful indicator badge explaining the current view mode and quick access to reset or toggle.

---

### 3. Modular Beginner-Mode Tab Components

#### [src/components/beginner/BeginnerTabNav.tsx] (New Component)

- Renders the 4 step tabs with clear status indicators:
  - **Tab 1: Video & Captions** (Always enabled)
  - **Tab 2: Audio & Preferences** (Disabled until base subtitle chosen)
  - **Tab 3: Subtitle Parsing** (Disabled until base subtitle chosen)
  - **Tab 4: Synchronized Player** (Disabled until base subtitle chosen)
- Once unlocked, tabs remain freely clickable without state resets.

#### [src/components/beginner/tabs/BeginnerVideoTab.tsx] (New Component)

- Single-row YouTube URL input control (supports paste, clear, and direct loading of shared intent URLs).
- Quick link/button to the **Video Library** (`VideoLibraryPanel`) for viewing and loading saved videos.
- Embedded video preview container.
- Instructional guidance banner prompting user to enable CC in the player if no captions are intercepted yet.
- **Observed Subtitles List**:
  - Displays intercepted subtitle tracks captured by YouTube API network calls and cached in local storage.
  - Interactive radio/card selection to pick the **Base Subtitle Track** (e.g., English, Hebrew, etc.).
  - Selecting a base track with > 0 cues automatically unlocks Tabs 2, 3, and 4.

#### [src/components/beginner/tabs/BeginnerPreferencesTab.tsx] (New Component)

- **Language Order**: Toggle or reorder playback precedence (Base language vs Target languages).
- **TTS Speed Slider**: Fine-grained speed control (0.5x to 2.0x, step 0.1x) with instant preview audition.
- **TTS Voice Selector**: Select available synthesized voices per target language.
- **Subtitles Ratio**: Adjust relative font size and spacing ratios between primary and secondary subtitles.
- **Favorite Languages**: Chips for default favorites (English, Hebrew, Spanish, etc.) and an expandable dropdown to add more target languages.
- On-demand adjustment: changes update playback state reactively without reloading the video.

#### [src/components/beginner/tabs/BeginnerParsingTab.tsx] (New Component)

- **Sentence Splitting**: Default split by sentence termination marks (`.`, `?`, `!`, `,`, `;`, `:`, `\n`).
- **Punctuation Customization**: Interactive checkboxes/chips enabling users to toggle which punctuation characters trigger segment splits.
- **Character Removal & Rename**:
  - Pre-configured toggle: _Strip speaker markers and arrows_ (`>`, `>>`, speaker names).
  - Custom character removal input allowing user to add/remove specific characters (e.g. `>`).
- **Interactive Live Preview**: Shows raw cue text alongside the parsed, cleaned sentence result.

#### [src/components/beginner/tabs/BeginnerPlayerTab.tsx] (New Component)

- Clean, synchronized dual-subtitles playback table.
- Interactive cue seeking (click line to jump video position).
- Floating pause/resume controls.

#### [src/components/beginner/BeginnerFlowContainer.tsx] (New Component)

- Orchestrates tabs, state transitions, auto-unlock on base subtitle selection, and connects with existing player engines (`LanguageVideoPlayerPanel`, `captionParser`, `subtitleCache`).

---

### 4. Integration into Root View

#### [src/routes/index.tsx]

- Render `ModeSwitcherHeader`.
- Conditionally render `BeginnerFlowContainer` when mode is `"beginner"`, while preserving the existing full studio layout when mode is `"expert"`.
- Zero disruption to existing web demo components, URL query state synchronization, or Android WebView interfaces.

---

### 5. Automated Testing

#### [test/beginner-mode-tab-flow.spec.ts] (New Test Suite)

- Test 1: Beginner mode initial state has Tab 1 active and Tabs 2, 3, 4 locked.
- Test 2: Selecting an intercepted base subtitle track unlocks Tabs 2, 3, and 4.
- Test 3: Unlocked tabs allow free jumping back and forth without losing state.
- Test 4: Preferences update TTS speed, voice, ratio, and favorite languages dynamically.
- Test 5: Subtitle parsing correctly splits by punctuation and removes configured characters (`>` and `>>`).

---

## Verification Plan

### Automated Tests

- Run dedicated test suite:
  ```bash
  npx vitest run test/beginner-mode-tab-flow.spec.ts
  ```
- Run full test suite:
  ```bash
  npm run test:run
  ```
- Validate build and bundling:
  ```bash
  npm run build
  ```
- Validate linting and TypeScript hygiene:
  ```bash
  npm run lint
  ```

### Manual Verification in Web Preview

1. Open web preview; verify the **Mode Switcher** appears in the header.
2. In Beginner Mode, verify Tab 1 displays the YouTube URL input, Library link, and caption guidance.
3. Observe intercepted subtitles; select a base subtitle and verify Tabs 2, 3, and 4 unlock.
4. Navigate to Tab 2; adjust TTS speed and favorite languages.
5. Navigate to Tab 3; test character removal (verify `>` is stripped from subtitle lines).
6. Navigate to Tab 4; verify synchronized dual subtitle playback.
