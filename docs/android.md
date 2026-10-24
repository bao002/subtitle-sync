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

## 3. GitHub Actions Android Emulator Architecture & Runner Pipeline

Automated testing of the Android native shell executes within GitHub Actions using a matrix-backed virtualized Android device runner.

### Runner Environment & Hardware Virtualization

- **macOS Apple Silicon Host (`runs-on: macos-14`)**: GitHub Actions provisions macOS 14 runners powered by Apple Silicon M-series hardware. This enables native hypervisor framework acceleration (`Hypervisor.framework`) to achieve fast, fluid Android ARM64 virtualization.
- **Upstream Runner Guidance**: The [`android-emulator-runner` action](https://github.com/ReactiveCircus/android-emulator-runner) provisions the emulator and runs the supplied script; ADB `screenrecord` in this workflow produces the screencast. Its upstream documentation recommends Ubuntu larger runners with KVM when available for improved speed and cost. This workflow retains `macos-14`; switching runner classes requires confirming repository runner entitlements and validating the API 34 ARM64 image separately.
- **Android Virtual Device (AVD) Configuration**:
  - **Runner Action**: `reactivecircus/android-emulator-runner@v2`
  - **API Level**: 34 (Android 14, `api-level: 34`)
  - **Target Image**: `google_apis` (includes official Google Play Services and system libraries)
  - **CPU Architecture**: `arm64-v8a` (native execution without costly cross-architecture translation)
  - **Allocated Memory**: `2048M` RAM
  - **Boot Timeout**: `600` seconds, matching the action default after run 44 timed out with a 300-second override
  - **Headless Optimized Flags**: `-no-snapshot-save -no-window -gpu swiftshader_indirect -noaudio -no-boot-anim -camera-back none`
  - **Animation Suppression**: `disable-animations: true` (eliminates window and transition animation latency)

### Workflow Triggering & Build Handshake (`workflow_run`)

The emulator suite (`.github/workflows/emulation.yml`) is chained to execute automatically upon completion of the upstream build workflow (`.github/workflows/release-apk.yml`):

1. **Upstream Artifact Retrieval**:
   - The job inspects the triggering run and attempts to download `youtube-viewer-apks` (`YouTube-Viewer-debug.apk`) directly via `actions/download-artifact@v4` or GitHub CLI (`gh run download`).
   - If pre-built APK is verified, duplicate compilation is completely skipped (`have_apk=true`).
2. **Fallback Source Build**:
   - If triggered manually or as a pull request without an upstream run, the runner executes a clean local web build (`npm run build`), bundles web dist assets into `android-shell/app/src/main/assets/`, and compiles the debug APK via `./gradlew assembleDebug`.
3. **Automated Emulator Boot & Device Priming**:
   - Once ADB reports device connectivity (`adb devices`), the runner primes the operating system:
     - Wakes device: `adb shell input keyevent KEYCODE_WAKEUP`
     - Dismisses lockscreen: `adb shell wm dismiss-keyguard`
     - Locks portrait orientation: `adb shell settings put system accelerometer_rotation 0`
     - Clears application state: `adb shell pm clear com.ytviewer.app`
     - Installs APK: `adb install -r android-shell/app/build/outputs/apk/debug/app-debug.apk`

---

## 4. Authenticity Evidence & Telemetry Verification in Test Report

To guarantee complete authenticity and prove that tests execute on genuine Android runtimes without synthetic mocks or hardcoded data, the test suite generates 5 layers of verifiable telemetry:

### 1. Live Device Hardware Telemetry (`android-emulator-device-info.json`)

At the start of test execution, the runner extracts dynamic hardware properties directly from the running Android Linux kernel via ADB shell:

- `DEVICE_MODEL=$(adb shell getprop ro.product.model)` (e.g. `Android SDK built for arm64`)
- `DEVICE_MANUFACTURER=$(adb shell getprop ro.product.manufacturer)` (e.g. `Google`)
- `DEVICE_BRAND=$(adb shell getprop ro.product.brand)` (e.g. `google`)
- `DEVICE_API=$(adb shell getprop ro.build.version.sdk)` (e.g. `34`)
- `DEVICE_RELEASE=$(adb shell getprop ro.build.version.release)` (e.g. `14`)
- `DEVICE_ABI=$(adb shell getprop ro.product.cpu.abi)` (e.g. `arm64-v8a`)
- `DEVICE_RESOLUTION=$(adb shell wm size)` (e.g. `1080x2400`)
- `DEVICE_DENSITY=$(adb shell wm density)` (e.g. `420`)
  These real properties are stored in `android-emulator-device-info.json` and presented in the `#device-telemetry-card`.

### 2. Multi-Milestone Framebuffer Screencaps

Real PNG pixel captures are acquired directly from the virtual surface compositor via `adb shell screencap -p /sdcard/screen.png` at each verified milestone:

- **Milestone 1**: App Launch & Initialization (`step-02-app-launch.png`)
- **Milestone 2**: Live `ACTION_VIEW` Browser Link Intent (`step-03-action-view.png` / `step-share-browser-link.png`)
- **Milestone 3**: Live `ACTION_SEND` YouTube App Intent (`step-04-action-send.png` / `step-share-youtube-app-text.png`)
- **Milestone 4**: Final Full-Resolution Display State (`android-emulator-screenshot.png`)

### 3. Logcat Telemetry with Real Dialogue Caption Text Exposure

The test captures continuous logcat output into `android-emulator-logcat.txt`, asserting dynamic application signals:

- `[APP_READY]`: Confirms the web bundle loaded cleanly inside the WebView without throwing errors.
- `SHARED_LINK_DISPATCH`: Confirms the Android OS passed the YouTube URL via Intent to the WebView bridge.
- `SUBTITLE_FETCH`: Chronologically traces authentic HTTP queries to YouTube's timedtext API.
- `AUTHENTIC_CAPTIONS_EXPOSED` / `CAPTION_TEXT_EXPOSED`: Verifies genuine subtitle dialogue text intercepted directly from the network payload.

### 4. Dual-Layer Error Screen Assertion

Tests strictly fail if the app displays error states:

- **UI Dump Layer**: `adb shell uiautomator dump /sdcard/window_dump.xml` inspected to verify zero error text ("This page didn't load", "Something went wrong on our end").
- **Logcat Layer**: Logcat inspected to verify zero `APP_BOOT_ERROR`, `FATAL EXCEPTION`, or `WebView error loading https://appassets`.

### 5. Native Network Interception & Anti-Bot Cookie Preservation

- Proves native `WebViewClient.shouldInterceptRequest` captured session cookies (`PREF`, `YSC`, `VISITOR_INFO1_LIVE`).
- Verifies User-Agent sanitization (removing `; wv`) to match Mobile Chrome signatures.

---

## 5. Screencast Video Recording & Authentic Live Caption Text Exposure

`reactivecircus/android-emulator-runner@v2` creates and boots the configured emulator, then executes the provided `script`; it does not record video itself. The Android GitHub Actions E2E script captures the actual emulator display with Android's `screenrecord`, finalizes the recording, and pulls the resulting MP4. The Android E2E pipeline never generates a video from a still screenshot.

CI treats a missing or empty MP4 as a recording failure. Screenshots, device telemetry, and live caption evidence continue to be collected independently for diagnostics.

```
       [Initialize Runner]
                 │
                 ▼
  adb shell settings put system accelerometer_rotation 0
  adb shell input keyevent KEYCODE_WAKEUP
  adb shell wm dismiss-keyguard
                 │
                 ▼
     [Execute E2E Test Scenarios]
     - Launch MainActivity with Target Video URL
     - Wait for [APP_READY] (Assert NO error screens)
     - Capture Milestone Step 2 (App Launch) screenshot
     - Enable CC / trigger playback on real YouTube video
     - Intercept authentic default captions & fetch favorite languages
     - Assert AUTHENTIC_CAPTIONS_EXPOSED & extract authentic_captions_exposed.txt
     - Output real dialogue text to console and test telemetry
     - Test tlang/lang fallback
     - Test YouTube Share Intents (ACTION_VIEW & ACTION_SEND)
     - Capture Milestone Step 3-5 screenshots
                 │
                 ▼
  Stage authentic screenshots, logcat, and caption text into gh-pages-staging/ (NOT committed to main branch!)
```

### Milestone Telemetry Guidelines:

1. **Authentic Screenshots & Text Evidence Over Heavy Videos**: Capture authentic full-resolution screenshots at each key milestone (boot, share intent, captions discovery) using `adb shell screencap -p`.
2. **Authentic Live Caption Text Exposure (Zero Mocks / Fixtures)**: Real dialogue text from the live YouTube timedtext stream is extracted and logged to logcat with `AUTHENTIC_CAPTIONS_EXPOSED lang=<lang> cues=<count> sample="<text>"` and saved to `/sdcard/Android/data/com.ytviewer.app/files/authentic_captions_exposed.txt`.
3. **Record the Real Emulator Display**: The GitHub Actions E2E workflow starts `adb shell screenrecord --time-limit 180 --bit-rate 4000000 /sdcard/android-emulator-video.mp4` before launching the app.
4. **Finalize Before Pulling**: Stop the recorder gracefully with `adb shell pkill -2 -f screenrecord`, wait for it to finish writing the MP4 container, then pull the file using `adb pull`. A missing or empty recording fails the E2E step; no screenshot-to-video fallback is allowed.
5. **Orientation and Wake Locking**:
   - Disable auto-rotation: `adb shell settings put system accelerometer_rotation 0`.
   - Dismiss lock screen: `adb shell input keyevent KEYCODE_WAKEUP && adb shell wm dismiss-keyguard`.
6. **Adaptive Coordinate Scaling**:
   - Query screen dimensions: `adb shell wm size` (e.g. `1080x2400`).
   - Calculate relative touch coordinates: Player center at 50% width and 22% height (`ADAPTIVE_TAP_X=$(( DEV_W * 50 / 100 ))`, `ADAPTIVE_TAP_Y=$(( DEV_H * 22 / 100 ))`).

### 5.1 Video Availability Timeline and Lifecycle

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

## 6. Expected E2E Report Structure on GitHub Pages

The E2E test produces a rich, interactive report deployed to GitHub Pages at:

- **`https://<owner>.github.io/<repo>/android/`** (or `android-emulator-report.html`)

### Key Components of the Report:

| Section                           | UI Element                                         | Contents & Purpose                                                                                                                                                                                                                                                                                                                                                                                                                             |
| :-------------------------------- | :------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Header & Outcome Badge**        | `#report-outcome-badge`                            | Visual indicator showing `Outcome: Verified` (green) or `Outcome: Failed` (red).                                                                                                                                                                                                                                                                                                                                                               |
| **Cross-Report Navigation**       | Navigation Links                                   | Links to Mochawesome Test Report (`mochawesome.html`), Playwright Web Report (`playwright/index.html`), and Live Web Demo (`index.html`).                                                                                                                                                                                                                                                                                                      |
| **Hardware & Telemetry Card**     | `#device-telemetry-card`                           | Live telemetry parsed from `android-emulator-device-info.json`: Device Model, Manufacturer, Android Version & SDK, ABI architecture, Display Resolution, Density (DPI), Serial, and Battery/Network Health.                                                                                                                                                                                                                                    |
| **Step-by-Step Workflow**         | `.step-grid`                                       | 5 visual step cards with milestone screenshots: <br>1. _Default Subtitles Detection_ (`step1-default-subtitles-detected.png`)<br>2. _Favorite Languages Fetch_ (`step2-favorite-languages-fetch.png`)<br>3. _YouTube API tlang/lang Fallback_ (`step3-youtube-api-tlang-lang-fallback.png`)<br>4. _Network Panel Inspection_ (`step4-network-panel-inspection.png`)<br>5. _Subtitles View Inspection_ (`step5-subtitles-view-inspection.png`). |
| **Screencast Video Presentation** | `<video controls autoplay muted loop playsinline>` | Embedded HTML5 video player streaming `./screenshots/android-emulator-video.mp4` with fallback messaging and download link.                                                                                                                                                                                                                                                                                                                    |
| **Primary Captured Screenshot**   | `<img>`                                            | Full-resolution screenshot (`./screenshots/android-emulator-screenshot.png`) captured at test conclusion.                                                                                                                                                                                                                                                                                                                                      |
| **Logcat Telemetry Card**         | `<pre>`                                            | Filtered live logcat snippet displaying chronological `SUBTITLE_FETCH` lines and download link for full logcat.                                                                                                                                                                                                                                                                                                                                |

---

## 7. Error Screen Detection & Strict Test Failure

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

## 8. Repository Hygiene & Ephemeral Staging

To maintain clean repository hygiene:

1. **Never Commit Video or Build Outputs to `main`**:
   - `android-emulator-video.mp4`, `android-emulator-screenshot.png`, `android-emulator-logcat.txt`, and `android-emulator-device-info.json` are strictly `.gitignore`d on the `main` branch.
   - Build outputs (`dist/`, APK binaries, and screen captures) are ephemeral.
2. **Artifact Preservation via Actions**:
   - GitHub Actions workflow (`.github/workflows/emulation.yml`) bundles test artifacts into `android-emulator-artifacts` via `actions/upload-artifact@v4` with a 14-day retention.
3. **Deployment to `gh-pages` Branch Only**:
   - Artifacts are copied to `gh-pages-staging/` during workflow execution.
   - The `peaceiris/actions-gh-pages@v4` action pushes the staged directory strictly to the orphaned `gh-pages` branch, keeping the `main` branch pristine.
4. **Automated Status Reflection in `README.md`**:
   - Once `emulation.yml` concludes, `.github/workflows/update-readme.yml` triggers via `workflow_run`.
   - If tests pass and the screencast video artifact is verified on GitHub Pages, the README dynamically reflects the `ALL VERIFIED` status with verified links to the HTML report, MP4 screencast video, and screenshot.
   - If tests fail, or if the report at `android-emulator-report.html` contains broken video links (e.g. `android-emulator-video.mp4` returns HTTP 404), the README automatically switches to `FAILED`, flags `Android Emulator Screencast & Report Video Flow`, marks the missing asset, and embeds a copy-pasteable AI fix prompt for 1-click reproduction. See [`docs/operations/ACTIONS.md`](./operations/ACTIONS.md) for complete details.

---

## 9. Execution Commands

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
