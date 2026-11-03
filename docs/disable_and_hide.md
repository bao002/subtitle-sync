# Fast vs. Slow Mode: Non-Obligatory Elements Matrix (`docs/disable_and_hide.md`)

This document defines the architecture, classification, and runtime behavior of **Fast Mode** (default) versus **Slow Mode** in the application.

---

## 1. Executive Summary

- **Fast Mode (Default)**: By default, the application runs in Fast Mode (`performanceMode: "fast"`). All elements and background routines that are **not obligatory** for the core function of the application are **disabled and hidden**.
- **Slow Mode**: Enables all auxiliary developer tooling, simulation labs, debuggers, multi-video swipers, network inspectors, and telemetry panels.
- **Global & Granular Controls in Settings**:
  - **"Disable All"**: Instantly hides and disables all non-obligatory elements (reverting to pure Fast Mode).
  - **"Enable All"**: Instantly unhides and enables all non-obligatory elements (switching to Slow Mode).
  - **Granular Toggles**: Users can customize individual element visibility/functionality at any time.
  - **Parity**: Controls are available with 100% feature and visual parity in both **Advanced Mode** (under Settings accordion) and **Beginner Mode** (under Preferences tab).

---

## 2. Core Obligatory Elements vs. Non-Obligatory Elements

### Core Obligatory Elements (Always Active & Visible)
The primary function of the application is to load videos, intercept/fetch subtitles, parse them into sentences, align multi-language translations, and coordinate playback with TTS. The following core elements are **obligatory** and remain active in all modes:

1. **Video Input & URL Loading**: YouTube URL/ID loading and shared link handling.
2. **Video Player**: Native / Web YouTube player iframe and core playback coordination.
3. **Subtitles Parsing & Pipeline**: Sentence splitting, punctuation parsing, and character removal.
4. **Learning Goals & Language Selection**: Selection of base, default subtitles, and target immersion languages.
5. **Parallel Subtitles Table**: Synchronized rows, sentence highlighting, and play/listen buttons.
6. **TTS Audio Synthesis**: Audio synthesis for active subtitle sentences.
7. **Primary Playback Controls**: Essential video play, pause, seek, rate, and volume controls.

---

### Non-Obligatory Elements Matrix (Hidden & Disabled by Default in Fast Mode)

| Element ID | Name & Description | Component / File | Default in Fast Mode | Default in Slow Mode |
| :--- | :--- | :--- | :--- | :--- |
| `network_inspector` | **Network Requests Inspector**: Low-level HTTP requests and intercepted timedtext query telemetry. | `src/components/NetworkRequestsInspector.tsx` | **Hidden & Disabled** | Visible |
| `state_machine_logs` | **State Machine Action Logs Inspector**: Internal player state machine transition logs and action recorder. | `src/components/StateMachineActionLogsInspector.tsx` | **Hidden & Disabled** | Visible |
| `tts_debugger` | **External TTS Debugger Panel**: API request/response audit logs, latencies, and payload inspector. | `src/components/ExternalTtsDebuggerPanel.tsx` | **Hidden & Disabled** | Visible |
| `timing_lab` | **Parser Timing Lab**: Millisecond-level word timing and artificial cue interpolation simulation workbench. | `src/components/ParserTimingLab.tsx` | **Hidden & Disabled** | Visible |
| `experimental_fetch` | **Experimental Subtitle Fetch Panel**: Secondary experimental fetch retry configurations. | `src/components/ExperimentalSubtitleFetchPanel.tsx` | **Hidden & Disabled** | Visible |
| `multi_video_swiper` | **Multi-Video Instances Swiper**: Multi-video concurrent player synchronization lab. | `src/components/VideoInstancesSwiper.tsx` | **Hidden & Disabled** | Visible |
| `audio_track_sections` | **Audio Track Time Sections Debugger**: Audio section slicing and buffer telemetry. | `src/components/LanguageVideoPlayerPanel.tsx` | **Hidden & Disabled** | Visible |
| `winner_promotion` | **Winner Promotion Analytics**: Race resolution reports for timedtext fallback winners. | `src/components/WinnerPromotionReportModal.tsx` | **Hidden & Disabled** | Visible |
| `default_subtitles_stats` | **Dense Punctuation Statistics Breakdown**: Verbose comma/period distribution tables in default subtitles bar. | `src/components/SwitchableDefaultSubtitlesBar.tsx` | **Hidden & Disabled** | Visible |
| `floating_pause_button` | **Floating Draggable Pause Button**: Mouse/touch viewport overlay button. | `src/components/FloatingDraggablePauseButton.tsx` | **Hidden & Disabled** | Visible |
| `critical_captions_alert` | **Critical Captions Alert Banner**: Non-blocking warning banner when captions fail. | `src/components/CriticalCaptionsAlert.tsx` | **Hidden & Disabled** | Visible |
| `settings_backup` | **Settings Backup Modal Launcher**: JSON export/import launcher modal. | `src/components/SettingsBackupModal.tsx` | **Hidden & Disabled** | Visible |

---

## 3. Storage Schema & API

All mode preferences are persisted to `localStorage` under standard versioned keys:

- **Mode Key**: `yt_performance_mode_v1` (`"fast"` | `"slow"`, default: `"fast"`).
- **Element Customizations Key**: `yt_disabled_elements_v1` (JSON string array of disabled element IDs, or map `{ [elementId]: boolean }`).
- **Helpers**:
  - `getPerformanceMode(): "fast" | "slow"` (returns `"fast"` by default).
  - `setPerformanceMode(mode: "fast" | "slow"): void`.
  - `isElementEnabled(elementId: string): boolean`.
  - `setElementEnabled(elementId: string, enabled: boolean): void`.
  - `disableAllNonObligatoryElements(): void` (switches to Fast Mode and disables all).
  - `enableAllNonObligatoryElements(): void` (switches to Slow Mode and enables all).
  - `NON_OBLIGATORY_ELEMENTS`: Catalog array describing each element, label, and category.

---

## 4. User Interface Architecture

### Settings Accordion (Advanced Mode) & Preferences Tab (Beginner Mode)
Both modes include a dedicated **Performance Mode: Fast vs. Slow** card:
1. **Mode Switch**: Two-state toggle / button group (`Fast (Default)` vs `Slow`).
2. **Batch Action Buttons**:
   - `[Disable All (Fast)]` button: Disables all non-obligatory elements in one click.
   - `[Enable All (Slow)]` button: Enables all non-obligatory elements in one click.
3. **Element Checklist**: Expandable list of all 12 non-obligatory elements with individual toggle switches.
