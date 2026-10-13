# Android Background Audio Playback & Lockscreen MediaSession Controls

Enable continuous background audio playback on Android when the screen turns off or the app is minimized, integrated with Android system notifications and lockscreen transport controls (play, pause, next/prev section, seek).

## User Review & Critical Decisions

> [!IMPORTANT]
> This plan enables continuous background audio and TTS execution on Android devices via an Android Foreground Service and MediaSession API, coordinating with the existing multi-instance audio track manager and WebView bridge.

- **Confirmed Decision 1**: Focus on Android APK native background audio playback with lockscreen media controls as the immediate top-priority milestone.
- **Confirmed Decision 2**: Coordinate between YouTube player audio playback, Web Speech/Native Android TTS speech synthesis, and MediaSession lockscreen notifications.
- **Open Choice**: Media notification styling options — standard Android MediaStyle notification with playback state, chapter title, and section jumping actions.

---

## 1. Overview & Core Concept

- **What It Does**: Allows users learning languages with YouTube parallel subtitles to keep listening to the video audio and interleaved multilingual spoken translations even when their Android device screen turns off, when the app is placed in the background, or when navigating other apps.
- **Target Audience / Persona**: Language learners listening to conversational videos, lectures, and interviews on the go (commuting, walking, studying) with screen off to save battery.
- **Key Value**: Unlocks hands-free, screen-off listening without interrupting video/audio playback or speech synthesis, bringing the app to parity with premium mobile audio players.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Enabling Background Playback**:
   - The user opens the Playback Settings accordion.
   - A dedicated toggle *"Background playback & lockscreen audio"* (persisted in preferences) allows activating background media service.
   - When active, minimizing the app or turning off the screen triggers the Android Foreground Service, keeping audio streaming without pause.

2. **Lockscreen & Notification Bar Interaction**:
   - When audio is active, a persistent Android system notification appears with:
     - Video title and active target language banner.
     - Interactive controls: `[Previous Section]`, `[Play / Pause]`, `[Next Section]`, and `[Close Service]`.
     - Scrubbable progress bar bound to the video playback timestamp.
   - Tapping notification returns the user directly into the active video view.

3. **Lockscreen TTS Sentence Announcements**:
   - As the playback advances into new subtitle sections, the active spoken subtitle track is announced and the notification subtext dynamically updates to display the currently spoken parallel sentence.

### Visual Identity & Theme

- **Aesthetic Direction**: High-contrast, touch-first ergonomics adhering to `references/10_mobile_touch_apps.md`.
- **Color Palette**: Native dark slate canvas (`bg-neutral-900`), crisp status indicators, and high-visibility notification iconography.
- **Touch Target Dimensions**: Minimum 48x48px hitboxes for all mobile audio toggles, transport triggers, and floating play/pause controls.
- **Typography**: Clean display sans-serif paired with tabular monospace numerals for playback timestamps (`font-mono tabular-nums`).

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Android Foreground Service with MediaSession vs. WebView Battery Saver Exemption
- **Chosen Approach**: Dedicated `MediaSessionService` / `ForegroundService` with `FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK` in Android shell, communicating with the WebView via `AndroidNativeBridge`.
- **Why**: Android OS aggressively throttles or kills background WebViews and JavaScript timers after 10–30 seconds if no active Foreground Service with an ongoing notification is maintained.
- **Alternatives Considered**: Keeping WebView alive purely with wake locks (rejected: drains battery without system lockscreen controls and gets terminated by Android Doze).

### Decision 2: Audio Coordination between Video Player and Native TTS
- **Chosen Approach**: The native Android shell synchronizes playback state between the YouTube WebView audio track and `TextToSpeech` engine. When TTS starts speaking between sections, the MediaSession updates its playback state seamlessly.
- **Why**: Prevents Android system media session from thinking playback is paused or completed while TTS translations are actively speaking.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Android Native Shell                      │
│                                                              │
│  ┌────────────────────────┐      ┌─────────────────────────┐ │
│  │ MainActivity           │◄────►│ BackgroundAudioService  │ │
│  │ (WebView + Bridge)     │      │ (Foreground Service)    │ │
│  └───────────┬────────────┘      └────────────┬────────────┘ │
│              │                                │              │
│              ▼                                ▼              │
│  ┌────────────────────────┐      ┌─────────────────────────┐ │
│  │ AndroidNativeBridge    │      │ MediaSessionCompat      │ │
│  │ • setBackgroundEnabled │      │ • Play / Pause Actions  │ │
│  │ • updateMediaMetadata  │      │ • Skip Next / Prev      │ │
│  │ • updatePlaybackState  │      │ • System Notification   │ │
│  └───────────┬────────────┘      └────────────┬────────────┘ │
└──────────────┼────────────────────────────────┼──────────────┘
               │                                │
               ▼                                ▼
┌──────────────────────────────┐   ┌───────────────────────────┐
│ React Application (WebView)  │   │ Android System Lockscreen │
│ • multiVideoPlayerManager    │   │ • Media Notification Card │
│ • audioTrackManager          │   │ • Hardware Media Buttons  │
│ • playbackPreferences        │   │ • Bluetooth Headset Keys  │
└──────────────────────────────┘   └───────────────────────────┘
```

### Component & State Mapping

- **`BackgroundAudioService.kt`**: Android Foreground Service handling `MediaSessionCompat`, notification lifecycle, and background audio focus.
- **`MainActivity.kt`**: Exposes bridge methods `setBackgroundAudioEnabled(enabled: Boolean)`, `updateMediaNotification(title, artist, isPlaying, positionMs, durationMs)`, and dispatches `onMediaCommand(action)` into JavaScript.
- **`src/utils/backgroundMediaManager.ts`**: Web client coordination module listening to YouTube player state transitions and updating native media metadata.
- **`src/lib/playback-preferences.ts`**: Persistent setting `yt_background_audio_enabled_v1` with UI toggle in Settings.

### Verification Plan

- Dedicated automated test `scripts/verify-android-background-audio-service.ts` validating service declaration, manifest permissions (`FOREGROUND_SERVICE_MEDIA_PLAYBACK`), MediaSession bridge hooks, and preference toggles.
- Verification on Android emulator / real device validating continuous audio playback upon screen lock and minimization.
