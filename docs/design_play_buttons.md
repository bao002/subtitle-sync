# Design Specification: Play, Pause & Listen Buttons Architecture (`docs/design_play_buttons.md`)

## 1. Executive Summary & Problem Context

In a complex video learning and bilingual narration application, several distinct user actions share visual elements resembling "Play", "Pause", or "Speaker/Listen":

1. Controlling video playback transport (starting or pausing video streaming).
2. Coordinating speech synthesis (speaking sentences between video sections or on-demand).
3. Pausing the entire environment for configuration ("Pause for Setup", halting autoscroll, video, and speech).
4. Testing audio synthesis services (verifying TTS credentials and voices).
5. Loading a new video URL from an input field.
6. Triggering background subtitle retry loops.
7. System-level background media control in the Android top notification shade.

Without explicit behavioral specifications and dedicated identifiers, users and automated test suites face ambiguity when seeing a "Play" or "Pause" button. This document clarifies the exact purpose, user experience flow, state-machine transitions, and dedicated `data-testid` attribute for every play/pause/listen button across the application.

---

## 2. Master Catalog of Play, Pause, and Listen Controls

The table below catalogs every button with a Play, Pause, or Audio icon, its dedicated unique `data-testid`, its location, and what clicking it does:

| Control Name                                    | Location / Component                                      | Unique `data-testid`                                     | Displayed Icon / Label                | Primary Action on Click                                                                                                     |
| :---------------------------------------------- | :-------------------------------------------------------- | :------------------------------------------------------- | :------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------- |
| **Main Playback Transport Bar**                 | `src/components/VideoPlaybackControls.tsx`                | `player-control-play-pause`                              | `Play` ("Play") / `Pause` ("Pause")   | Starts or pauses video playback and the synchronized TTS playback session. Hotkey: Spacebar.                                |
| **Video Viewport Center Overlay**               | `src/routes/index.tsx` (over player container)            | `video-overlay-play-pause-btn`                           | Circular `Play` / `Pause` overlay     | Toggles video playback directly on the video viewport. Visible when paused, hovered, or paused for speech.                  |
| **Beginner Toolbar Play/Pause**                 | `src/components/beginner/tabs/BeginnerPlayerTab.tsx`      | `btn-player-play-pause`                                  | `Play` ("Play") / `Pause` ("Pause")   | Toggles video playback and speech coordination in Beginner Daily Video view.                                                |
| **Floating Draggable Pause Trigger**            | `src/components/FloatingDraggablePauseButton.tsx`         | `floating-pause-button`                                  | `Play` / `Pause` / `ScrollText`       | Opens the floating draggable quick-controls menu popover.                                                                   |
| **Pause for Setup Option**                      | `src/components/FloatingDraggablePauseButton.tsx`         | `menu-option-setup-pause`                                | `Pause` (active) / `Play` (inactive)  | Freezes video playback, text-to-speech voice synthesis, and auto-scrolling to allow friction-free settings configuration.   |
| **Subtitle Row Pronunciation (Cell)**           | `src/components/SubtitleRow.tsx`                          | `btn-speak-cell-${actualIndex}-${langCode}`              | `Volume2` (small speaker icon)        | Pronounces that specific sentence in that language column on-demand via TTS without altering video playback.                |
| **Beginner Row Pronunciation**                  | `src/components/beginner/tabs/BeginnerPlayerTab.tsx`      | `btn-speak-cue-${idx}`                                   | `Volume2` (ghost button)              | Pronounces that individual cue's translated text on demand via TTS.                                                         |
| **Beginner Speak Current Cue**                  | `src/components/beginner/tabs/BeginnerPlayerTab.tsx`      | `btn-player-speak-current`                               | `Volume2` ("Speak Cue" / "Speaking…") | Pronounces the currently active subtitle cue in the selected target language.                                               |
| **Alternative TTS Test (Advanced)**             | `src/routes/index.tsx` (TTS Preferences)                  | `test-alternative-tts-btn`                               | `Play` ("▶ Test Alternative TTS")     | Synthesizes and plays a short test sample ("Hello world") to verify Lovable Speak API or Google Translate TTS connectivity. |
| **Alternative TTS Test (Beginner)**             | `src/components/beginner/tabs/BeginnerPreferencesTab.tsx` | `btn-test-alternative-tts`                               | `Play` ("▶ Test Alternative TTS")     | Synthesizes and plays a short test sample in Beginner General Preferences to verify alternative TTS.                        |
| **Video Library Card Play**                     | `src/components/VideoLibraryPanel.tsx`                    | `library-video-card-play-btn-${videoId}`                 | Circular `Play` on thumbnail          | Switches active video to this library item and loads authentic or cached subtitles.                                         |
| **Load Video (Advanced Form)**                  | `src/routes/index.tsx`                                    | `play-video-button`                                      | Button text: "Load video"             | Parses YouTube URL or ID from input, switches player, and starts subtitle fetch.                                            |
| **Load Video (Beginner Form)**                  | `src/components/beginner/tabs/BeginnerVideoTab.tsx`       | `btn-load-video`                                         | `Play` ("Load Video")                 | Validates pasted YouTube URL and loads video into the beginner player container.                                            |
| **Subtitle Auto-Retry Pause/Resume (Floating)** | `src/components/FloatingSubtitleRetryIndicator.tsx`       | `floating-retry-pause-btn` / `floating-retry-resume-btn` | `Pause` (fetching) / `Play` (paused)  | Pauses or resumes background timedtext retry attempts for pending languages.                                                |
| **Subtitle Auto-Retry Pause/Resume (Tab)**      | `src/components/NotificationsStatusTab.tsx`               | `tab-retry-toggle-btn`                                   | `Pause` (active) / `Play` (paused)    | Pauses or resumes subtitle fetch retry queue in the network alerts tab.                                                     |
| **Android System Notification 1-Click Pause**   | `BackgroundAudioService.kt` (Android native)              | Action 1 in media notification                           | System Play / Pause action icon       | Single-click kill session: halts native Android TTS immediately and pauses video playback.                                  |

---

## 3. Deep-Dive Specification for Each Control

### 3.1. Main Playback Transport Bar (`player-control-play-pause`)

- **Location**: In `VideoPlaybackControls.tsx`, centered on the primary playback controls bar beneath the video.
- **Unique TestId**: `data-testid="player-control-play-pause"`
- **Visual Design**: High-contrast, large touch-friendly button. Shows green/accent `Play` icon when paused; shows secondary `Pause` icon when playing or when temporarily paused for speech narration.
- **Detailed Behavior on Click**:
  1. If currently playing:
     - Pauses YouTube video playback via `player.current?.pauseVideo()`.
     - Updates `isVideoPlaying` state to `false`.
     - Immediately halts any active speech synthesis via `cancelSpeech()`.
     - Resets `speakingLang` to `null` and `speakingRow` to `-1`.
     - Sets coordinator `busy.current = false`.
  2. If currently paused:
     - Starts YouTube video playback via `player.current?.playVideo()`.
     - Updates `isVideoPlaying` state to `true`.
     - Dispatches playback state update to native Android shell via `syncMediaMetadata`.
- **Keyboard Shortcut**: `Space` bar triggers the same toggle when focus is outside text inputs.

---

### 3.2. Video Viewport Center Overlay (`video-overlay-play-pause-btn`)

- **Location**: Directly centered over the YouTube iframe container in `src/routes/index.tsx`.
- **Unique TestId**: `data-testid="video-overlay-play-pause-btn"`
- **Visual Design**: 64×64px (or 80×80px on desktop) circular translucent black badge with white `Play` or `Pause` icon and subtle backdrop blur.
- **Visibility Trigger**:
  - Automatically visible when video is paused (`!isVideoPlaying`).
  - Automatically visible when video is paused waiting for speech synthesis (`Boolean(speakingLang)`).
  - Briefly visible on hover or mobile tap (`isPlayerHovered`).
  - Fades to 0 opacity during active video playback to prevent obstructing video content.
- **Detailed Behavior on Click**: Calls `handleTogglePlay()`, matching the behavior of `player-control-play-pause`.

---

### 3.3. Beginner Mode Toolbar Play/Pause (`btn-player-play-pause`)

- **Location**: Top control bar of the Beginner Daily Video view (`BeginnerPlayerTab.tsx`).
- **Unique TestId**: `data-testid="btn-player-play-pause"`
- **Visual Design**: Compact button displaying `Play` (emerald) or `Pause` (amber).
- **Detailed Behavior on Click**: Forwards call to `onTogglePlay` handler in parent route, executing standard media play/pause with full TTS synchronization.

---

### 3.4. Floating Draggable Setup Pause (`floating-pause-button` & `menu-option-setup-pause`)

- **Location**: Bottom-right floating draggable controller pill (`FloatingDraggablePauseButton.tsx`).
- **Unique TestId**:
  - Pill button: `data-testid="floating-pause-button"`
  - Dropdown menu item: `data-testid="menu-option-setup-pause"`
  - Status label: `data-testid="floating-pause-status"`
- **Icon Behavior**:
  - When Setup Pause is active: Displays `Pause` icon in vibrant amber with text `"Setup Paused"`.
  - When Auto-Scroll is enabled: Displays `ScrollText` icon with text `"Auto-Scroll ON"`.
  - When normal playback: Displays `Play` icon with text `"Controls Menu"`.
- **Critical Distinction from Normal Play/Pause**:
  - Standard video pause only pauses the YouTube player.
  - **Pause for Setup** freezes THREE subsystems simultaneously:
    1. **Video playback**: Pauses the YouTube video player.
    2. **Speech synthesis**: Halts and suppresses all Text-to-Speech queues.
    3. **Table auto-scrolling**: Prevents the subtitles table from jumping or auto-scrolling to the active cue.
  - This allows the user to comfortably review transcripts, configure target languages, or tweak sentence splitting criteria without disruptive video sound, TTS voices, or UI jumping.

---

### 3.5. Subtitle Row Per-Cell Pronunciation (`btn-speak-cell-${actualIndex}-${langCode}`)

- **Location**: Inside each language cell of the parallel subtitles table (`SubtitleRow.tsx`).
- **Unique TestId**: `data-testid="btn-speak-cell-${actualIndex}-${l.code}"` (e.g. `btn-speak-cell-0-he`)
- **Visual Design**: Subtle `Volume2` speaker icon on the right edge of the subtitle cell. Appears with 40% opacity, highlighting to 100% on hover.
- **Detailed Behavior on Click**:
  - Stops event propagation (`e.stopPropagation()`) so clicking the speaker does NOT seek the video to that row.
  - Immediately speaks the single sentence text in the designated language using the configured TTS provider.
  - Does NOT alter the video play/pause state or reset other active queues.

---

### 3.6. Beginner Mode Cue Pronunciation (`btn-speak-cue-${idx}` and `btn-player-speak-current`)

- **Location**: In Beginner Daily Video (`BeginnerPlayerTab.tsx`).
- **Unique TestIds**:
  - Per-cue row: `data-testid="btn-speak-cue-${idx}"`
  - Current sentence toolbar button: `data-testid="btn-player-speak-current"`
- **Visual Design**: `Volume2` icon with emerald accent. Bounces while speech is active.
- **Detailed Behavior on Click**:
  - Speaks the cue's translated target text using Web Speech or alternative TTS.
  - Does NOT restart or advance the YouTube video.

---

### 3.7. Alternative TTS Test Audio Button (`test-alternative-tts-btn` & `btn-test-alternative-tts`)

- **Location**: In Alternative TTS settings panel (Advanced mode: `src/routes/index.tsx`; Beginner mode: `BeginnerPreferencesTab.tsx`).
- **Unique TestIds**:
  - Advanced view: `data-testid="test-alternative-tts-btn"`
  - Beginner view: `data-testid="btn-test-alternative-tts"`
- **Visual Design**: Small monospace button showing `Play` icon with label `▶ Test Alternative TTS ("Hello world")`. Displays a spinning `Loader2` indicator with `"Playing test audio…"` while fetching audio.
- **Detailed Behavior on Click**:
  - Sends a test synthesis request for `"Hello world"` to the active alternative TTS engine (Lovable Speak API `tts2.lovable.app` or Google Translate TTS proxy).
  - Plays the synthesized audio through an HTML5 `<audio>` element.
  - Verifies voice configuration, audio playback codecs, and network connectivity without interfering with the video player.

---

### 3.8. Video Library Play / Load Button (`library-video-card-play-btn-${videoId}`)

- **Location**: Overlaying thumbnail cards in the Video Library drawer (`VideoLibraryPanel.tsx`).
- **Unique TestId**: `data-testid="library-video-card-play-btn-${item.id}"` (e.g. `library-video-card-play-btn-L2Ryrr6txwA`)
- **Visual Design**: Hover/tap circular overlay with primary `Play` icon.
- **Detailed Behavior on Click**:
  - Selects the target video ID.
  - Loads the YouTube player with that video.
  - Restores cached authentic subtitles or loads approved fixtures.
  - Resets playback counters and marks the card with `data-testid="library-active-badge-${id}"`.

---

### 3.9. Load Video URL Buttons (`play-video-button` & `btn-load-video`)

- **Location**: Video input bar at the top of the page.
- **Unique TestIds**:
  - Advanced view: `data-testid="play-video-button"`
  - Beginner view: `data-testid="btn-load-video"`
- **Visual Design**: Primary button with "Load video" text and optional `Play` icon.
- **Detailed Behavior on Click**:
  - Submits the form with the user's pasted URL or ID.
  - Validates YouTube video ID syntax (`[a-zA-Z0-9_-]{11}`).
  - Clears stale tracks and begins Stage 1 subtitle acquisition.

---

### 3.10. Subtitle Auto-Retry Pause/Resume Buttons (`floating-retry-pause-btn` & `tab-retry-toggle-btn`)

- **Location**: Floating subtitle fetch toast (`FloatingSubtitleRetryIndicator.tsx`) and Network Alerts tab (`NotificationsStatusTab.tsx`).
- **Unique TestIds**:
  - `data-testid="floating-retry-pause-btn"` / `data-testid="floating-retry-resume-btn"`
  - `data-testid="tab-retry-toggle-btn"`
- **Visual Design**: Compact button toggling between `Play` (emerald) for Resume and `Pause` (amber) for Pause.
- **Detailed Behavior on Click**:
  - Toggles the `isPaused` flag of the background subtitle fetch retry manager.
  - Freezes pending retry countdown timers when paused, preventing rate-limiting (HTTP 429) during slow networks.

---

### 3.11. Android Notification Top Menu Pause-All Action (`BackgroundAudioService.kt`)

- **Location**: Android system notification shade top menu.
- **Implementation**: Native `BackgroundAudioService.kt` `handlePause()` and `handlePlay()`.
- **Visual Design**: Standard Android media session notification control with system Play/Pause glyphs.
- **Detailed Behavior on 1-Click Pause**:
  - **Halts native Android TTS**: Immediately calls `MainActivity.instance?.stopNativeTTS()`, stopping speech synthesis in mid-sentence.
  - **Dispatches pause to web layer**: Calls `MainActivity.instance?.dispatchMediaCommand("pause", 0L)`.
  - **Terminates web playback session**: Web layer receives event, invokes `multiVideoPlayerRegistry.pauseAllExcept()`, `player.current?.pauseVideo()`, `cancelSpeech()`, and resets `busy.current = false`.
  - **Guarantees no auto-resume**: Audio playback loops inspect `!busy.current` and abort immediately, ensuring the session stays dead and silent.

---

## 4. Automation & Testing Reference

When writing automated integration tests, unit verification scripts, or Playwright E2E suites:

1. **To toggle main video playback**:
   ```typescript
   await page.locator('[data-testid="player-control-play-pause"]').click();
   ```
2. **To click video overlay**:
   ```typescript
   await page.locator('[data-testid="video-overlay-play-pause-btn"]').click();
   ```
3. **To activate Pause for Setup**:
   ```typescript
   await page.locator('[data-testid="floating-pause-button"]').click();
   await page.locator('[data-testid="menu-option-setup-pause"]').click();
   ```
4. **To pronounce a specific subtitle cell**:
   ```typescript
   await page.locator('[data-testid="btn-speak-cell-0-he"]').click();
   ```
5. **To test Alternative TTS output**:
   ```typescript
   await page.locator('[data-testid="test-alternative-tts-btn"]').click();
   ```
6. **To load a video from library**:
   ```typescript
   await page.locator('[data-testid="library-video-card-play-btn-L2Ryrr6txwA"]').click();
   ```

Every play and pause button in the application is uniquely identified and distinct.
