# Android Emulator End-to-End Testing & Verification Specification (`e2e-android.md`)

This document defines the comprehensive architecture for end-to-end (E2E) testing on real Android runtimes (Android 14 API 34 Google APIs emulator or physical hardware) **without mocking, synthetic stubs, or fixture fallbacks**. It establishes the protocol for pre-test system navigation, device telemetry exposure, milestone screenshot capture, and authentic feature validation.

---

## 1. Core Testing Philosophy: Zero Mocking & Authentic Runtime Execution

Unlike browser-only or headless test runners that simulate mobile environments through viewport resizing and synthetic network mocks, Android E2E testing in this repository exercises the **complete native Android software stack**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   Android OS / System Image (API 34)                   │
├────────────────────────────────────────────────────────────────────────┤
│  System Settings & "About Phone" Telemetry                             │
│  WindowManager (Display Density, Adaptive Coordinates, Orientations)   │
│  ActivityManager & Intent Dispatch (ACTION_VIEW, ACTION_SEND)          │
│  Native Audio System & TTS Engine (android.speech.tts.TextToSpeech)    │
│  MediaSession & Notification Service (BackgroundAudioService)          │
├────────────────────────────────────────────────────────────────────────┤
│             Android Native Shell (com.ytviewer.app)                    │
│  WebViewAssetLoader (appassets.androidplatform.net)                    │
│  shouldInterceptRequest (Real timedtext HTTP session capture)          │
│  JavascriptBridge (window.AndroidNativeShell)                          │
├────────────────────────────────────────────────────────────────────────┤
│             Production Web Client (Vite Single Page App)               │
│  React UI, Subtitles Table, Video Swiper, Multi-Track Audio            │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Principles:
1. **Zero Fixture Fallbacks on Android**: Android tests never load static JSON files from `public/fixtures/`. Subtitles must originate exclusively from genuine YouTube timedtext network interception via `WebViewClient.shouldInterceptRequest`.
2. **Authentic Session Headers**: Subtitle requests preserve genuine session cookies (`PREF`, `YSC`, `VISITOR_INFO1_LIVE`), SAPISIDHASH tokens, and `Referer: https://www.youtube.com/`.
3. **No Synthetic Report Generators**: Reports are rendered dynamically from real test outputs (Logcat dumps, MP4 screencast recording, and full-resolution screenshot captures).

---

## 2. Pre-Test Android Emulator Navigation: Exposing "About Phone" & Developer Details

To guarantee 100% test authenticity and eliminate any possibility of fabricated test runs, the E2E runner executes **system-level navigation on the emulator before launching the application**:

### 2.1 Navigation Sequence:
1. **Device Wakeup & Keyguard Dismissal**:
   - `adb shell input keyevent KEYCODE_WAKEUP`
   - `adb shell wm dismiss-keyguard`
   - `adb shell settings put system accelerometer_rotation 0`
2. **Home Screen Navigation**:
   - `adb shell input keyevent KEYCODE_HOME`
   - Wait 1.5 seconds for launcher animations to settle.
3. **System Settings & About Phone Launch**:
   - Dispatches system intent:
     ```bash
     adb shell am start -a android.settings.DEVICE_INFO_SETTINGS
     ```
     *(Fallback if device info settings intent is unavailable: `adb shell am start -a android.settings.SETTINGS` followed by scrolling to About emulated device).*
4. **Milestone Screenshot Capture (Step 1)**:
   - Captures the live Android Settings screen showing:
     - Device name / model (`sdk_gphone64_x86_64` or physical device name)
     - Android version (`14`)
     - Android security update / API level (`34`)
     - Build number & Kernel version
     - Uptime and hardware specifications
   - Saved as `public/screenshots/step-01-about-phone.png`.
5. **System Properties Extraction (`getprop`)**:
   - Extracts genuine hardware telemetry into `android-emulator-device-info.json`:
     - `ro.product.manufacturer`: e.g. `Google`
     - `ro.product.model`: e.g. `sdk_gphone64_x86_64`
     - `ro.build.version.release`: e.g. `14`
     - `ro.build.version.sdk`: e.g. `34`
     - `ro.product.cpu.abi`: e.g. `x86_64` or `arm64-v8a`
     - `wm size`: e.g. `1080x2400`
     - `wm density`: e.g. `420dpi`
     - `dumpsys battery`: Battery level, temperature, charging status.

---

## 3. Milestone Screenshots Pipeline Along the Test

Authentic visual proof is captured at every critical transition in the testing lifecycle:

| Step # | Milestone Identifier | Screenshot File | What It Proves |
| :--- | :--- | :--- | :--- |
| **Step 1** | **System & Device Details** | `step-01-about-phone.png` | Verifies real Android 14 API 34 runtime environment, system settings, and hardware telemetry. |
| **Step 2** | **Clean Native App Startup** | `step-02-app-launch.png` | Proves clean APK boot, local asset hydration (`appassets.androidplatform.net`), and zero error screens ("This page didn't load"). |
| **Step 3** | **Live Browser Link Share** | `step-03-action-view.png` | Proves `ACTION_VIEW` intent dispatch parses browser YouTube URL and switches active video to `dQw4w9WgXcQ`. |
| **Step 4** | **Live App Text Share** | `step-04-action-send.png` | Proves `ACTION_SEND` intent dispatch extracts shortlink from share text and switches active video to `kJQP7kiw5Fk`. |
| **Step 5** | **Live TimedText Subtitles** | `step-05-captions-subtitles.png` | Proves authentic network interception, JSON3 structural parsing, and active subtitle highlighting in the table. |
| **Final** | **Primary Telemetry Capture** | `android-emulator-screenshot.png` | Full-resolution screenshot linked from `README.md` and embedded in `android-emulator-report.html`. |

---

## 4. Comprehensive 10-Point Test Matrix Without Mocking

The table below details everything testable on an unmocked Android emulator:

```text
 1. System Telemetry & About Phone  ──► Verified via Settings intent & getprop
 2. Local Asset Hydration (Assets)  ──► Verified via appassets.androidplatform.net
 3. Intent Handling (ACTION_VIEW)   ──► Verified via am start -a android.intent.action.VIEW
 4. Intent Handling (ACTION_SEND)   ──► Verified via am start -a android.intent.action.SEND
 5. TimedText Interception (API)    ──► Verified via shouldInterceptRequest in WebView
 6. Target Language Fallback        ──► Verified via tlang parameterization vs lang code
 7. Native Text-to-Speech (TTS)     ──► Verified via android.speech.tts.TextToSpeech
 8. Background Audio & Notification ──► Verified via BackgroundAudioService & MediaSession
 9. Version Discrepancy & In-App OTA──► Verified via getInstalledAppInfo vs package.json
10. Hardware Keys & Back Navigation ──► Verified via KEYCODE_BACK and gesture coordinate swipes
```

### Detailed Breakdown:

### 4.1 Native Application Startup & Local Asset Hydration
- **Mechanism**: The Android native shell intercepts `https://appassets.androidplatform.net/` through `androidx.webkit.WebViewAssetLoader`.
- **Validation**:
  - The web application must boot in `< 45` seconds without throwing `APP_BOOT_ERROR`.
  - Must not render TanStack Router error boundaries, React crash screens, or "This page didn't load".
  - Logcat must emit `[APP_READY]` upon successful React DOM hydration.

### 4.2 Real Android Intent Handling (`ACTION_VIEW` & `ACTION_SEND`)
- **Mechanism**: `MainActivity.kt` implements `handleIntent(intent)` in both `onCreate` and `onNewIntent`.
- **Validation**:
  - `ACTION_VIEW`: Dispatches standard YouTube URL (`https://www.youtube.com/watch?v=dQw4w9WgXcQ`). Logcat must confirm `[SHARED_LINK_DISPATCH] dQw4w9WgXcQ`.
  - `ACTION_SEND`: Dispatches plain text share (`Check out this video: https://youtu.be/kJQP7kiw5Fk?si=123`). Logcat must confirm `[SHARED_LINK_DISPATCH] kJQP7kiw5Fk`.

### 4.3 Authentic YouTube TimedText Interception (`shouldInterceptRequest`)
- **Mechanism**: As the embedded YouTube player requests captions, `shouldInterceptRequest` captures the live request to `youtube.com/api/timedtext`.
- **Validation**:
  - Extracts genuine session cookies (`PREF`, `YSC`, `VISITOR_INFO1_LIVE`) and authorization signatures (`sparams`, `sig`).
  - Strict JSON3 structural validation: cues array non-empty, numeric `tStartMs` and `dDurationMs`, valid `utf8` segments.
  - Zero synthetic fixture fallback: If YouTube timedtext fails, displays graceful retry indicator rather than synthetic offline stubs.

### 4.4 Target Translation Language Switching (`tlang` vs `lang`)
- **Mechanism**: The user toggle `SubtitleRequestMode` in `src/lib/playback-preferences.ts` selects between `tlang` machine translation and `lang` direct track retrieval.
- **Validation**:
  - Sends broadcast `com.ytviewer.app.ACTION_SET_TARGET_LANG` with `--es "targetLang" "es"`.
  - Verifies that `shouldInterceptRequest` requests and receives authentic Spanish cues.

### 4.5 Native Text-to-Speech (TTS) Coordination
- **Mechanism**: Native Android `TextToSpeech` engine is invoked via `AndroidNativeShell.speak(text, lang, rate, voiceUri)`.
- **Validation**:
  - Verifies TTS engine initialization (`onInit(status == TextToSpeech.SUCCESS)`).
  - Asserts that speech playback matches the active subtitle segment without audio stutter or overlap.
  - Asserts that `stopSpeaking()` immediately terminates audio output upon pause or seek.

### 4.6 Background Audio & MediaSession Notification
- **Mechanism**: `BackgroundAudioService.kt` binds to Android `MediaSessionCompat` and posts an ongoing notification with media playback controls.
- **Validation**:
  - Proves that audio continues playing when the app is placed in the background (`input keyevent KEYCODE_HOME`).
  - Verifies media notification presence in `dumpsys notification`.

### 4.7 Hardware Keys, Gestures & Back Navigation
- **Mechanism**: Adaptive coordinate derivation based on physical/emulated display resolution (`DEV_W` x `DEV_H`).
- **Validation**:
  - Back button (`input keyevent KEYCODE_BACK`) navigates WebView history before exiting the app.
  - Swipe gestures (`input swipe`) coordinate horizontal swiping across active video instances in `VideoInstancesSwiper`.

---

## 5. Artifact Packaging & GitHub Pages Report Presentation

The E2E test execution produces three tangible, permanent artifacts:

1. **Filtered Logcat Telemetry (`android-emulator-logcat.txt`)**: Contains timestamped log lines for `APP_READY`, `SHARED_LINK_DISPATCH`, and `SUBTITLE_FETCH`.
2. **Screencast Video (`android-emulator-video.mp4`)**: High-definition video recording captured on-device with `adb shell screenrecord --time-limit 180 --bit-rate 4000000 /sdcard/android-emulator-video.mp4` and finalized with graceful SIGINT (`kill -2 $(pidof screenrecord)`).
3. **Milestone Screenshots (`public/screenshots/step-*.png`)**: Visual verification checkpoints hosted directly on GitHub Pages and embedded in `android-emulator-report.html`.

---

## 6. Verification Commands

| Scope | Command | Expected Outcome |
| :--- | :--- | :--- |
| **Android E2E Specification Audit** | `npm run test:e2e-android-doc` | Asserts existence of `docs/e2e-android.md`, covers all 10 unmocked test points, About Phone navigation, and milestone screenshot pipeline. |
| **Android Assert Runner** | `bash scripts/android-e2e-assert.sh` | Executes real emulator assertions, intent dispatches, and milestone screenshots. |
| **Full E2E Lifecycle Script** | `bash scripts/run-android-e2e.sh` | Initializes screenrecord, navigates About Phone, boots app, asserts features, pulls video, and compiles report. |
| **Self-Verification Protocol** | `npm run test:self-verification` | Asserts self-verification protocol alignment and sanity checks. |
