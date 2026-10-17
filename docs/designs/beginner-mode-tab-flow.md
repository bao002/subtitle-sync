# Beginner-Mode Tab-Based Flow Architecture & Design Specification

## Overview

This specification defines the alternative **Beginner-Mode** tab-based workflow for the Android shell and web demo. It guides new users step-by-step through:

1. Entering / sharing a YouTube video URL and accessing video history/library.
2. Observing intercepted YouTube captions, triggering local caching of API requests & responses.
3. Choosing the baseline subtitle track to unlock downstream tabs.
4. Customizing playback order, TTS voice & speed, subtitle ratios, and favorite languages (with on-demand adjustment).
5. Configuring subtitle sentence-splitting punctuation and character replacement/removal rules (e.g., stripping `>` and `>>` speaker tags).

## Mode Switching & Layout Harmony

- **Mode Switcher Toggle**: Situated in the header navigation bar (`[Beginner Mode / Advanced Studio]`).
  - Saved to `localStorage` under `app_workflow_mode: "beginner" | "expert"` so the preference persists across sessions and shared intents.
  - In Beginner Mode, complex debug panels, manual raw network injectors, and multi-drawer accordions are streamlined into 4 clean, sequential tabs.
  - The clean original web-demo layout and styling are preserved without regression.

## Tab-Based Workflow

### Tab 1: Video & Captions Setup (`#tab-video-captions`)

- **YouTube URL Input**: Clean single-row URL bar supporting standard and mobile YouTube URLs, auto-populated on Android `ACTION_SEND`/`ACTION_VIEW` share intents.
- **Library Quick Link**: One-click jump/modal to the stored video library (`VideoLibraryPanel`) to quickly re-open previously cached videos.
- **Caption Interception Prompt**: Clear instruction banner guiding the user:
  > _"Please start playback and enable captions (CC) in the player below to discover authentic subtitle tracks."_
- **Observed Subtitles List**:
  - Displays real-time intercepted subtitle tracks captured by Android native timedtext interception or web demo fixtures/proxies.
  - Live status indicator (cached in `subtitleCache` / IndexedDB / localStorage).
  - Track selection radio / button: User selects which intercepted track serves as the **Base Subtitle** (e.g., English, Hebrew, etc.).
- **Unlock Gate**:
  - Downstream tabs (Tab 2, Tab 3, Tab 4) remain disabled (`disabled={!hasBaseSubtitleSelected}`) until a valid base subtitle track with > 0 cues is chosen.
  - Once unlocked, users can freely navigate between tabs without resetting state or losing selections.

### Tab 2: Audio & Playback Preferences (`#tab-playback-voice`)

- **Language Order**: Drag/reorder or priority toggle between Base language and Target translation languages.
- **TTS Speed Slider**: Paced playback rate adjustment (0.5x to 2.0x, step 0.1x) with live voice test audition.
- **TTS Voice Selector**: System and browser-available speech synthesis voices filtered by target language.
- **Subtitles Ratio**: Visual size and layout ratio slider (primary vs secondary subtitle sizing).
- **Favorite Languages Selector**: Quick-chips for common languages (EN, HE, ES, FR, AR, etc.) + "Add language" picker.
- **On-Demand Adjustment**: Changes take effect immediately on active playback without requiring player re-initialization.

### Tab 3: Subtitle Parsing & Punctuation Rules (`#tab-subtitle-parsing`)

- **Default Sentence Splitting**: Split cues by punctuation boundary marks (`.`, `?`, `!`, `...`, `,`, `;`, `:`, `\n`).
- **Punctuation Customization**: Checkbox/chips to enable/disable specific punctuation marks used for segment boundary splitting.
- **Character Removal & Rename Rules**:
  - Preset enabled by default: **Strip speaker brackets and arrows** (e.g., `>`, `>>`, `[Applause]`, `(Music)`).
  - Custom character replacement table: Allows users to specify characters or substrings to remove or replace (e.g. replace `>` with empty string).
- **Real-Time Diff & Preview**: Shows the raw cue text vs the cleaned and split sentence text.

### Tab 4: Synchronized Subtitle Player (`#tab-synchronized-player`)

- Dual/multi-language synchronized subtitle table and video playback.
- Interactive cue seeking, floating pause/resume controls, and bilingual line highlight.

## Verification & Test Plan

1. **Unit & Integration Tests**:
   - `test/beginner-mode-workflow.spec.ts`: Test tab locking logic, unlock on base subtitle selection, tab navigation persistence, TTS speed & voice updates, punctuation splitting, and character removal rules (verifying removal of `>` and `>>`).
2. **App Compilation**: Verify `compile_applet` / `npm run build` cleanly succeeds.
3. **Lint Verification**: Verify `lint_applet` passes without errors.
