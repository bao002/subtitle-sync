# Languages Selection Flow & TTS Audio Engine Architecture (`docs/languages-selection-flow.md`)

This document defines the complete operational specification and lifecycle for language selection, favorite languages management, per-video selection persistence, enabled languages presentation, and the Text-to-Speech (TTS) engine including voice selection, speed rate calibration, and the alternative TTS service.

---

## 1. Dual Persistence Hierarchy: Global Favorites vs. Per-Video Selection

The application manages language preferences using a two-tier persistence model:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Global Favorite Languages                                │
│    - Configured in Settings                                 │
│    - Persisted in localStorage (`learningLanguages` /       │
│      `yt_favorite_languages`)                               │
│    - Represents the user's default preferred study tongues  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Fallback / Initial Seed
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Per-Video Target Languages                               │
│    - Stored in localStorage per Video ID                    │
│      (`yt_video_settings_<videoId>`)                        │
│    - Preserves specific customization for each loaded video  │
│    - Independent track ordering & active spoken selection   │
└─────────────────────────────────────────────────────────────┘
```

### Video Loading Lifecycle Rules:
1. **Initial Video Load**: When a video with ID `videoId` is loaded:
   - Check `yt_video_settings_<videoId>` for saved language settings.
   - **Saved Settings Exist**: Restore the exact target languages and ordering specifically saved for this video.
   - **No Saved Settings Exist**: Seed the video's active target languages using the global **Favorite Languages** configured in Settings.
2. **User Modifies Languages for Active Video**:
   - When the user selects, deselects, or re-orders target languages while viewing a video, the change is immediately saved to `yt_video_settings_<videoId>`.
   - Global favorites remain intact unless explicitly modified in Settings.
3. **Reset to Favorites**:
   - The user can click "Reset to Favorites" to re-align the active video's target languages with the current global favorites list.

---

## 2. Enabled Languages & Favorites Presentation

The UI clearly visualizes the status of all languages:
- **Favorite Languages**: Indicated with a star (⭐) or "Favorite" badge in settings, selector grids, and headers.
- **Current Video Selection**: Languages currently staged for playback, timedtext caption fetching, and parallel alignment for this video.
- **Enabled Languages Status Bar**:
  - Highlights the count and list of active languages enabled for this video.
  - Distinctly delineates which enabled languages are part of the global favorites list and which are specific additions.
  - Provides quick action chips to toggle languages on/off and reset to defaults.

---

## 3. Text-to-Speech (TTS) Voice Selection Architecture

The Web Speech API voice selection flow is hardened against browser-specific timing issues, duplicate enumerations, and locale code disparities:

### 3.1. Asynchronous Voice Enumeration & Caching
1. **Dual Event Hooking**: Both `window.speechSynthesis.onvoiceschanged = refresh` and `window.speechSynthesis.addEventListener("voiceschanged", refresh)` are bound to guarantee voice population across Chromium, WebKit, Gecko, and Android WebView.
2. **Module-Level Voice Cache**: Loaded voices are cached in a persistent reference (`cachedVoices`) so `speak()` calls retain synchronous access to voice objects even before component re-renders complete.
3. **Periodic Recovery**: An initial check plus delayed recovery timers (e.g., 250ms and 1000ms) ensure voices are detected when browser voice synthesis engines initialize lazily.

### 3.2. ISO-639 Code Alias Normalization
Android, Java, and Chromium environments frequently utilize legacy or alternate BCP-47 / ISO-639 codes. The matcher normalizes:
- **Hebrew**: `he` ↔ `iw` (e.g., matching `iw-IL` voice to `he-IL` subtitles).
- **Indonesian**: `id` ↔ `in` (e.g., matching `in-ID` voice to `id-ID` subtitles).
- **Yiddish**: `yi` ↔ `ji`.
- **Chinese**: `zh-CN` / `zh-TW` matching with language prefix fallbacks.

### 3.3. Utterance Voice Assignment & Language Synchronization
When configuring `SpeechSynthesisUtterance`:
```typescript
const u = new SpeechSynthesisUtterance(text);
u.rate = rate; // 0.3 to 1.5 (default 0.5)
if (chosenVoice) {
  u.voice = chosenVoice;
  // Crucial: Align utterance language with the chosen voice locale
  // to prevent Chromium/WebKit from rejecting or overriding the voice
  u.lang = chosenVoice.lang || lang;
} else {
  u.lang = lang;
}
```

### 3.4. Persistence
User voice selections are stored per language code in `localStorage` under `yt_tts_voice_selections_v1` and restored automatically on startup.

---

## 4. TTS Speed Rate Configuration

1. **Range**: `0.3` to `1.5` (calibrated with `step={0.1}`).
2. **Default**: `0.5` (previously `1.0`; defaulted to `0.5` for clear language learning comprehension and accessible pronunciation pacing).
3. **Granular Control**: Adjustable per language in the TTS settings drawer, with real-time numeric badge indicator (`0.5×`).

---

## 5. Alternative TTS Service (Google Translate TTS)

For environments with missing voice engines, broken Web Speech implementations, or when a consistent external audio stream is desired:

### 5.1. Service Endpoint
```
https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl={lang}&q={text}
```

### 5.2. Operational Modes & Settings Configuration
- **Settings Toggle**: `useAlternativeTtsService` (boolean, **OFF by default**).
- **Fallback Mode**: When enabled, the alternative service acts as an automatic fallback if native Web Speech fails, rejects the utterance, or has no voices available.
- **Alternative Primary Option**: Can also be selected as the primary synthesis engine when enabled in Settings.

### 5.3. Audio Stream Management
- Executed using an HTML5 `Audio` element with dynamic playback rate scaling (`audio.playbackRate = rate`).
- Clean lifecycle management: cancels preceding streams, unbinds event listeners upon early termination/seek, and reports playback completion.

---

## 6. Verification and Automated Testing

All behaviors are covered by dedicated automated test suites in `scripts/`:
- `scripts/verify-language-selection-and-tts-flow.ts`:
  - Validates default rate 0.5 and range 0.3-1.5.
  - Validates alternative TTS URL builder, default OFF toggle, and fallback mechanics.
  - Validates ISO-639 alias normalization (Hebrew `he`/`iw`, Indonesian `id`/`in`).
  - Validates per-video language persistence with global favorite languages fallback.
  - Validates voice caching and utterance language synchronization.
