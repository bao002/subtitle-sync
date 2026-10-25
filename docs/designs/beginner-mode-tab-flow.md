# Beginner-Mode Tab-Based Flow Architecture & Design Specification

## Overview

This specification defines the alternative **Beginner-Mode** workflow for the Android shell and web demo. It has exactly two flows: General Preferences and Daily Video.

- **General Preferences**: Set playback order, TTS voice and speed, subtitle-overlay default, and favorite languages.
- **Daily Video**: Use the video, quick favorite-language selector, and parallel subtitles table together. Adjust parser settings at the top of the table; adjust overlay visibility and size directly below the video. Caption discovery details remain secondary.

The product design standard distinguishes occasional new-user preference setup from daily viewing. See [`../design.md`](../design.md): the repeat-use destination is the video plus subtitles-table view, with frequent language selection and parsing feedback close to that view.

## Mode Switching & Layout Harmony

- **Mode Switcher Toggle**: Situated in the header navigation bar (`[Beginner Mode / Advanced Studio]`).
  - Saved to `localStorage` under `app_workflow_mode: "beginner" | "expert"` so the preference persists across sessions and shared intents.
  - In Beginner Mode, complex debug panels, manual raw network injectors, and multi-drawer accordions are kept out of the two everyday flows.
  - Experimental tools and diagnostics are separate from Advanced mode and require the `debug=true` URL parameter.
  - The clean original web-demo layout and styling are preserved without regression.

## Tab-Based Workflow

### Flow 1: General Preferences (`#tab-playback-voice`)

- Choose narration order, TTS speed and voice, subtitle overlay default, and favorite languages.
- These preferences are available before selecting a video or subtitle track.
- Google remains the default TTS service.

### Flow 2: Daily Video (`#tab-video-captions`)

- **YouTube URL Input**: Clean single-row URL bar supporting standard and mobile YouTube URLs, auto-populated on Android `ACTION_SEND`/`ACTION_VIEW` share intents.
- **Library Quick Link**: One-click jump/modal to the stored video library (`VideoLibraryPanel`) to quickly re-open previously cached videos.
- **Daily Viewing**: Show the video, favorite target-language quick selector, and parallel subtitles table in one view.
- **Overlay Controls**: Place an enable/disable toggle and subtitle-size minus/plus controls directly below the video.
- **Live Parser Controls**: Keep sentence-splitting settings at the top of the subtitles-table view.
- **Special Characters Removal**: Keep the Stage 3 sanitization accordion immediately before the shared parser controls, matching the processing order.
- **Caption Discovery Details**:
  - Keep the caption-interception prompt and observed tracks in a secondary collapsible section.
  - Displays real-time intercepted subtitle tracks captured by Android native timedtext interception or web demo fixtures/proxies.
  - Live status indicator (cached in `subtitleCache` / IndexedDB / localStorage).
  - Track selection radio / button: User selects which intercepted track serves as the **Base Subtitle** (e.g., English, Hebrew, etc.).

## Verification & Test Plan

1. **Browser E2E**: Verify the two flows, daily-view content order, parser placement, overlay toggle persistence across flows, and subtitle-size controls.
2. **Source Verification**: Run `npm run test:beginner-mode-two-flows` and `npm run test:video-display-controls`.
3. **App Compilation**: Verify `npm run build` succeeds.
4. **Lint Verification**: Verify `npm run lint` passes.
