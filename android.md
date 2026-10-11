# Android Device & Emulator E2E Testing, Screencast Video & GitHub Pages Architecture (android.md)

This specification defines the complete end-to-end (E2E) testing lifecycle for the native Android application (`com.ytviewer.app`), detailing authentic runtime execution, automated video screencast recording via ADB, artifact staging, and presentation on GitHub Pages.

---

## 1. Architectural Overview & Parity Mandate

The Android shell (`android-shell/`) wraps the web application in an Android WebView with native hardware acceleration, transparent TLS decompression, and background audio support.

### Parity with Web Architecture
- **Identical Logic**: The React SPA bundled into `android-shell/app/src/main/assets/` runs the identical routing, parsing, alignment, and TTS state engine as the web version.
- **No Synthetic Fixtures**: Subtitle requests must never rely on mocked, synthetic, or hardcoded fixture JSONs on Android. Subtitles are discovered dynamically via genuine YouTube player network traffic.
- **Authentic Verification**: Automated tests must run against real Android runtimes (physical hardware or API 34 Google APIs emulators) and assert genuine operating system events, logcat telemetry, and display rendering.

---

## 2. Real Native Subtitle Interception & Anti-Bot Strategy

```
[Embedded YouTube Player in WebView]
                 │
                 ▼ (Issues timedtext GET)
[MainActivity WebViewClient shouldInterceptRequest]
                 │
                 ├─► 1. Captures Session Headers (Cookies: PREF, YSC, VISITOR_INFO1_LIVE; SAPISIDHASH)
                 ├─► 2. Sanitizes User-Agent (strips "; wv" to match Mobile Chrome)
                 ├─► 3. Extracts Authentic URL parameters (v, expire, sparams, signature, key)
                 │
                 ▼
[Native OkHttpClient & Mode Fallback]
                 │
                 ├─► Primary Mode (e.g. tlang translation: ?lang=en&tlang=he)
                 │     │
                 │     └─► Fails? (4xx, 5xx, or non-JSON3)
                 │            │
                 │            ▼
                 └─► Fallback Mode (e.g. direct track: ?lang=he)
```

1. **WebView Session Interception**: `MainActivity.kt` intercepts requests matching `youtube.com/api/timedtext`. It stores session headers in `lastObservedHeaders`.
2. **User-Agent Sanitization**: The WebView User-Agent is sanitized by removing `; wv`, preventing YouTube from detecting an automated embedded WebView.
3. **Dual Fallback Strategy**:
   - **`tlang` Parameterization**: Preserves the original audio track in `lang` and sets `tlang` for machine translation.
   - **`lang` Code Replacement**: Replaces `lang` with the target language code for native tracks.
   - If one mode fails or returns non-JSON3, the runner automatically falls back to the alternate mode.
4. **Strict JSON3 Validation**: Every response must be HTTP 200 and parse into a valid `json3` structure with non-empty `events` and non-empty `utf8` segments. Non-JSON3 responses (XML, HTML error pages, plain text) are strictly rejected.

---

## 3. How to Make the Video / Screencast of E2E Scenarios

Video proof of the E2E test running on the Android emulator is required to guarantee authentic execution and visual correctness.

```
       [Initialize Runner]
                 │
                 ▼
  adb shell settings put system accelerometer_rotation 0
  adb shell input keyevent KEYCODE_WAKEUP
  adb shell wm dismiss-keyguard
                 │
                 ▼
  adb shell screenrecord --time-limit 180 --bit-rate 4000000 /sdcard/android-emulator-video.mp4 &
  RECORDING_PID=$!
                 │
                 ▼
     [Execute E2E Test Scenarios]
     - Launch MainActivity with Target Video URL
     - Wait for [APP_READY] (Assert NO error screens)
     - Tap YouTube player to trigger playback
     - Intercept default captions & fetch favorite languages
     - Test tlang/lang fallback
     - Test YouTube Share Intents (ACTION_VIEW & ACTION_SEND)
                 │
                 ▼
  [Finalize Video Container via SIGINT]
  adb shell pkill -2 -f screenrecord
  wait $RECORDING_PID
  sleep 3
                 │
                 ▼
  adb pull /sdcard/android-emulator-video.mp4 ./android-emulator-video.mp4
                 │
                 ▼
  Stage into gh-pages-staging/screenshots/ (NOT committed to main branch!)
```

### Video Recording Guidelines:
1. **Start Before App Launch**: Start `screenrecord` before launching `MainActivity` so that the video captures the complete application boot sequence, asset hydration, and caption initialization.
2. **Bitrate and Resolution**: Use `--bit-rate 4000000` (4 Mbps) and `--time-limit 180` to produce high-definition, compact MP4 files suitable for web streaming.
3. **Clean Container Finalization**:
   - `screenrecord` requires a clean `SIGINT` (signal 2) to write the MP4 file header (`moov` atom).
   - Abruptly terminating ADB or pulling while `screenrecord` is writing corrupts the video.
   - Always run `adb shell "kill -2 \$(pidof screenrecord 2>/dev/null) 2>/dev/null || pkill -2 screenrecord 2>/dev/null || true"`, wait 3 seconds, and then pull via `adb pull`.
4. **Orientation and Wake Locking**:
   - Disable auto-rotation: `adb shell settings put system accelerometer_rotation 0`.
   - Dismiss lock screen: `adb shell input keyevent KEYCODE_WAKEUP && adb shell wm dismiss-keyguard`.
5. **Adaptive Coordinate Scaling**:
   - Query screen dimensions: `adb shell wm size` (e.g. `1080x2400`).
   - Calculate relative touch coordinates: Player center at 50% width and 22% height (`ADAPTIVE_TAP_X=$(( DEV_W * 50 / 100 ))`, `ADAPTIVE_TAP_Y=$(( DEV_H * 22 / 100 ))`).

### 3.1 Video Availability Timeline and Lifecycle

Understanding when and where the screencast video becomes available:

1. **Why the video is not in git `main`**:
   - Heavy video binary artifacts (`*.mp4`) are strictly excluded from the `main` git branch via `.gitignore` to preserve git performance and avoid repository bloat.
2. **When the video is generated**:
   - The video is created dynamically during automated CI execution in `.github/workflows/emulation.yml` running on macOS runners with hardware virtualization and Android API 34 Google APIs emulators.
3. **Where the video is published**:
   - **GitHub Actions Workflow Artifact**: Downloadable directly under `android-emulator-artifacts` on the completed run summary page for 14 days.
   - **GitHub Pages (`gh-pages` branch)**: Deployed to `./screenshots/android-emulator-video.mp4` and `./android/android-emulator-video.mp4`.
4. **Immediate Visibility & Pending State**:
   - When viewing the test report on GitHub Pages before the CI emulator run completes, the HTML5 player provides multi-path source fallbacks (`./screenshots/android-emulator-video.mp4`, `./android-emulator-video.mp4`, `../screenshots/android-emulator-video.mp4`) alongside an informative lifecycle status message until the build workflow finishes.
   - When running locally via `bash scripts/run-android-e2e.sh`, the pulled video is automatically mirrored to `public/screenshots/`, `public/android/screenshots/`, and `public/android/` for immediate local review.

---

## 4. Expected E2E Report Structure on GitHub Pages

The E2E test produces a rich, interactive report deployed to GitHub Pages at:
- **`https://<owner>.github.io/<repo>/android/`** (or `android-emulator-report.html`)

### Key Components of the Report:

| Section | UI Element | Contents & Purpose |
| :--- | :--- | :--- |
| **Header & Outcome Badge** | `#report-outcome-badge` | Visual indicator showing `Outcome: Verified` (green) or `Outcome: Failed` (red). |
| **Cross-Report Navigation** | Navigation Links | Links to Mochawesome Test Report (`mochawesome.html`), Playwright Web Report (`playwright/index.html`), and Live Web Demo (`index.html`). |
| **Hardware & Telemetry Card** | `#device-telemetry-card` | Live telemetry parsed from `android-emulator-device-info.json`: Device Model, Manufacturer, Android Version & SDK, ABI architecture, Display Resolution, Density (DPI), Serial, and Battery/Network Health. |
| **Step-by-Step Workflow** | `.step-grid` | 5 visual step cards with milestone screenshots: <br>1. *Default Subtitles Detection* (`step1-default-subtitles-detected.png`)<br>2. *Favorite Languages Fetch* (`step2-favorite-languages-fetch.png`)<br>3. *YouTube API tlang/lang Fallback* (`step3-youtube-api-tlang-lang-fallback.png`)<br>4. *Network Panel Inspection* (`step4-network-panel-inspection.png`)<br>5. *Subtitles View Inspection* (`step5-subtitles-view-inspection.png`). |
| **Screencast Video Presentation** | `<video controls autoplay muted loop playsinline>` | Embedded HTML5 video player streaming `./screenshots/android-emulator-video.mp4` with fallback messaging and download link. |
| **Primary Captured Screenshot** | `<img>` | Full-resolution screenshot (`./screenshots/android-emulator-screenshot.png`) captured at test conclusion. |
| **Logcat Telemetry Card** | `<pre>` | Filtered live logcat snippet displaying chronological `SUBTITLE_FETCH` lines and download link for full logcat. |

---

## 5. Error Screen Detection & Strict Test Failure

The runner and assertion script must **strictly fail** if the Android app displays any web or runtime error screen:

1. **Forbidden Error Signatures**:
   - `"This page didn't load"`
   - `"Something went wrong on our end"`
   - `APP_BOOT_ERROR`
   - `tanstack_root_error_component`
   - `router-error-component`
   - `FATAL EXCEPTION`
2. **Dual-Layer Verification**:
   - **Logcat Layer**: `adb logcat -d` checked for boot errors, WebView asset failures, and console errors.
   - **UI Hierarchy Layer**: `uiautomator dump /sdcard/window_dump.xml` inspected to verify that no error message text is displayed to the user.

---

## 6. Repository Hygiene & Ephemeral Staging

To maintain clean repository hygiene:

1. **Never Commit Video or Build Outputs to `main`**:
   - `android-emulator-video.mp4`, `android-emulator-screenshot.png`, `android-emulator-logcat.txt`, and `android-emulator-device-info.json` are strictly `.gitignore`d on the `main` branch.
   - Build outputs (`dist/`, APK binaries, and screen captures) are ephemeral.
2. **Artifact Preservation via Actions**:
   - GitHub Actions workflow (`.github/workflows/emulation.yml`) bundles test artifacts into `android-emulator-artifacts` via `actions/upload-artifact@v4` with a 14-day retention.
3. **Deployment to `gh-pages` Branch Only**:
   - Artifacts are copied to `gh-pages-staging/` during workflow execution.
   - The `peaceiris/actions-gh-pages@v4` action pushes the staged directory strictly to the orphaned `gh-pages` branch, keeping the `main` branch pristine.

---

## 7. Execution Commands

- **Run Full Android E2E Suite Locally**:
  ```bash
  npm run test:android
  # or directly:
  bash scripts/run-android-e2e.sh
  ```
- **Run Live Device Assertion**:
  ```bash
  bash scripts/android-e2e-assert.sh
  ```
- **Run Adaptive Hardware Telemetry Verification**:
  ```bash
  npm run test:android-device-e2e
  ```
- **Verify Android Specification Compliance**:
  ```bash
  npm run test:android-e2e-spec
  ```
