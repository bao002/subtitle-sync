# Beginner-Mode Tab-Based Flow Architecture & Design Specification

## Overview

This specification defines the alternative **Beginner-Mode** tab-based workflow for the Android shell and web demo. First-time users begin with their occasional preferences, then reach the daily video-and-subtitles-table view. Optional parsing and synchronized-player steps remain available.

1. Set playback order, TTS voice and speed, subtitle overlay preference, and favorite languages.
2. Enter / share a YouTube video URL, access video history, and use the video-plus-table view.
3. Observe intercepted YouTube captions, trigger local caching, and choose the baseline subtitle track.
4. Optionally customize subtitle parsing and sentence splitting, then use the synchronized player.

The product design standard distinguishes occasional new-user preference setup from daily viewing. See [`../design.md`](../design.md): the repeat-use destination is the video plus subtitles-table view, with frequent language selection and parsing feedback close to that view.

## Mode Switching & Layout Harmony

- **Mode Switcher Toggle**: Situated in the header navigation bar (`[Beginner Mode / Advanced Studio]`).
  - Saved to `localStorage` under `app_workflow_mode: "beginner" | "expert"` so the preference persists across sessions and shared intents.
  - In Beginner Mode, complex debug panels, manual raw network injectors, and multi-drawer accordions are streamlined into four ordered steps.
  - Experimental tools and diagnostics are separate from Advanced mode and require the `debug=true` URL parameter.
  - The clean original web-demo layout and styling are preserved without regression.

## Tab-Based Workflow

### Tab 1: Voice & Playback Preferences (`#tab-playback-voice`)

- Choose narration order, TTS speed and voice, subtitle overlay default, and favorite languages.
- These preferences are available before selecting a video or subtitle track.
- Google remains the default TTS service.

### Tab 2: Daily Video & Captions (`#tab-video-captions`)

- **YouTube URL Input**: Clean single-row URL bar supporting standard and mobile YouTube URLs, auto-populated on Android `ACTION_SEND`/`ACTION_VIEW` share intents.
- **Library Quick Link**: One-click jump/modal to the stored video library (`VideoLibraryPanel`) to quickly re-open previously cached videos.
- **Daily Viewing**: Keep the video and subtitles-table view available without requiring parsing or player setup.
- **Caption Interception Prompt**: Clear instruction banner guiding the user:
  > _"Please start playback and enable captions (CC) in the player below to discover authentic subtitle tracks."_
- **Observed Subtitles List**:
  - Displays real-time intercepted subtitle tracks captured by Android native timedtext interception or web demo fixtures/proxies.
  - Live status indicator (cached in `subtitleCache` / IndexedDB / localStorage).
  - Track selection radio / button: User selects which intercepted track serves as the **Base Subtitle** (e.g., English, Hebrew, etc.).
- **Unlock Gate**:
  - Preferences and daily viewing remain available without a selected base track.
  - Parsing and synchronized-player steps remain disabled until a valid base subtitle track with > 0 cues is chosen.
  - Once unlocked, users can freely navigate between tabs without resetting state or losing selections.

### Tab 3: Subtitle Parsing & Punctuation Rules (`#tab-subtitle-parsing`)

- **Language Order**: Drag/reorder or priority toggle between Base language and Target translation languages.
- **TTS Speed Slider**: Paced playback rate adjustment (0.5x to 2.0x, step 0.1x) with live voice test audition.
- **TTS Voice Selector**: System and browser-available speech synthesis voices filtered by target language.
- **Subtitles Ratio**: Visual size and layout ratio slider (primary vs secondary subtitle sizing).
- **Favorite Languages Selector**: Quick-chips for common languages (EN, HE, ES, FR, AR, etc.) + "Add language" picker.
- **On-Demand Adjustment**: Changes take effect immediately on active playback without requiring player re-initialization.

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
