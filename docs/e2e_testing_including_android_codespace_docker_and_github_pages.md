# E2E Testing Architecture: Android Runtime, Codespaces, Docker & GitHub Pages

This document provides a comprehensive operational and architectural reference for end-to-end (E2E) testing across the project. It details practical testing strategies for native Android runtimes, containerized execution via Docker, GitHub Codespaces workflows, artifact generation (screencasts and milestone screenshots), GitHub Pages reporting, and answers key technical questions regarding platform capabilities and Model Context Protocol (MCP) tooling.

---

## 1. Executive Summary & AI Studio Platform Trial Results

### 1.1 AI Studio Build Environment Trial
When attempting to execute containerized workflows from `./docker/*` directly inside Google AI Studio Build:

```bash
# Trial Execution:
which docker || echo "no docker"
# Output: no docker

bash ./docker/manage.sh e2e web
# Output: Docker is required but was not found in PATH. (Exit code 1)
```

**Root Cause Analysis:**
- Google AI Studio Build operates within a secure, sandboxed Linux microVM container on Google Cloud infrastructure.
- The environment has no background Docker daemon (`dockerd`), no Docker socket (`/var/run/docker.sock`), and no privileged nested virtualization capabilities.
- Consequently, `./docker/manage.sh` cannot run inside AI Studio.

**Operational Strategy for AI Studio:**
- Instead of containerized runners, AI Studio executes **native Node.js and Playwright commands** directly:
  - Instant validation: `npm run test:e2e-selectors`, `npm run test:plan-e2e-test`, `npm run test:design-play-buttons` (< 1 second).
  - Browser tests: `npx playwright test e2e/web.spec.ts` (using local headless Chromium).
- The `./docker/manage.sh` runner remains dedicated to environments with Docker support: **GitHub Codespaces (with DinD)**, **Local Developer Workstations**, and **GitHub Actions CI**.

---

## 2. Effective Android E2E Testing

### 2.1 Core Philosophy: Zero Mocking & Authentic Interception
Unlike web-only test runners that simulate mobile devices by resizing desktop browser viewports, authentic Android E2E testing exercises the **complete native Android software stack**:

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

### 2.2 Pre-Test System Navigation & Telemetry Exposure
To guarantee test authenticity and prevent synthetic runs, the automated runner navigates the system UI before launching the application:
1. **Wakeup & Keyguard Dismissal**:
   ```bash
   adb shell input keyevent KEYCODE_WAKEUP
   adb shell wm dismiss-keyguard
   adb shell settings put system accelerometer_rotation 0
   ```
2. **Launch "About Phone" System Settings**:
   ```bash
   adb shell am start -a android.settings.DEVICE_INFO_SETTINGS
   ```
3. **Capture Milestone Screenshot 1 (`step-01-about-phone.png`)**: Captures the live OS settings screen proving the test runs on real Android 14 API 34 hardware/emulator.
4. **Extract Genuine Hardware Telemetry (`android-emulator-device-info.json`)**:
   - Queries `ro.product.model`, `ro.product.manufacturer`, `ro.build.version.sdk`, `ro.product.cpu.abi`, `wm size`, `wm density`, and `dumpsys battery`.

### 2.3 Intent Dispatch Verification
Tests dispatch genuine Android intents to verify inter-process communication:
- **`ACTION_VIEW`**: Opens standard YouTube link:
  ```bash
  adb shell am start -a android.intent.action.VIEW -n com.ytviewer.app/.MainActivity -d "https://www.youtube.com/watch?v=vBURridJXZ0"
  ```
- **`ACTION_SEND`**: Dispatches text sharing from third-party apps:
  ```bash
  adb shell am start -a android.intent.action.SEND -n com.ytviewer.app/.MainActivity --es android.intent.extra.TEXT "Check out this video: https://youtu.be/kJQP7kiw5Fk"
  ```

### 2.4 Authentic Caption Interception in WebView
- `MainActivity.kt` intercepts live HTTP requests via `WebViewClient.shouldInterceptRequest`.
- Captures genuine YouTube `youtube.com/api/timedtext` queries with live session headers, cookies (`PREF`, `YSC`, `VISITOR_INFO1_LIVE`), and `SAPISIDHASH` authorization signatures.
- **Strict Zero-Fixture Rule**: Android runtime never loads offline fixtures; all captions originate from real network traffic or explicit user-provided links.

### 2.5 Pure Android OS System Smoke Flow Option (No Application Execution)
When validating CI emulator boot stability, hardware acceleration, or screencast generation without executing the repository application, two flow options are available on GitHub CI:

1. **Standalone Workflow (`.github/workflows/android-system-smoke.yml`)**:
   - Boots the official Android 14 API 34 Google APIs system image on a GitHub Actions `macos-14` runner.
   - Bypasses web bundling, Gradle compilation, and APK installation entirely.
   - Navigates the pure Android operating system: dismisses keyguard, captures the initial Home screen (`android-system-home.png`), opens the app drawer, launches Android Settings "About Phone" (`android-system-settings.png`), and navigates back to Home.
   - Records a dedicated 30-to-60 second system screencast (`android-system-screencast.mp4`) finalized with graceful SIGINT (`pkill -2 -f screenrecord`).
   - Packages pure system artifacts (`android-system-artifacts`: screencast MP4, home screenshot PNG, settings screenshot PNG, hardware telemetry JSON, logcat TXT).

2. **Configurable Option in `.github/workflows/emulation.yml`**:
   - `workflow_dispatch` input `flow_mode`:
     - `app-e2e` (default): Executes complete end-to-end unmocked application testing.
     - `system-smoke`: Skips APK installation and runs the pure Android OS system exploration with screenshot and screencast capture.

### 2.6 Alternative Android CI Flow Options Worth Evaluating
Based on runner infrastructure, platform capabilities, and caching technologies, here are the top 5 additional Android flow options worth evaluating:

1. **Flow Option 1: Linux Runner with KVM Acceleration (`ubuntu-latest` / Ubuntu Larger Runner with `x86_64`)**
   - **Mechanism**: Executes `reactivecircus/android-emulator-runner@v2` on Linux (`runs-on: ubuntu-latest` or GitHub 4-core larger runners) with `/dev/kvm` hardware virtualization and `arch: x86_64`.
   - **Why it's worth trying**:
     - *Queue Latency*: Linux runners spin up in 1–3 seconds compared to 30–90 seconds for macOS runners.
     - *Billing/Minutes Efficiency*: Standard public repositories receive 1x runner consumption on Linux vs 10x multiplier on macOS.
     - *Stability*: x86_64 Google APIs system images are highly mature and widely pre-cached in package registries.
   - **Trade-offs**: Standard free 2-core Ubuntu VMs may experience KVM contention without dedicated larger runner tiers.

2. **Flow Option 2: Containerized Android Emulator in Docker on CI (`budtmo/docker-android` / `redroid`)**
   - **Mechanism**: Runs an official Docker-in-Docker container with `--device /dev/kvm` on an Ubuntu host.
   - **Why it's worth trying**:
     - *Docker Parity*: Unifies CI execution with the repository's `./docker/` infrastructure and local developer workflows.
     - *Built-In Web Viewer & Recorder*: Includes automated noVNC web streaming and background video recording without shell trap signals.
   - **Trade-offs**: Docker image download overhead (~3GB–5GB image pull).

3. **Flow Option 3: AVD Snapshot Caching Flow (`actions/cache` for 15s Warm Boots)**
   - **Mechanism**: Uses `actions/cache@v4` to cache the initialized AVD directory (`~/.android/avd/*`). Boot flags pass `-snapshot-name default_boot`.
   - **Why it's worth trying**:
     - *Blazing Fast*: Bypasses the 2-4 minute cold boot sequence; boots the system image in ~10–15 seconds on warm runs.
     - *Cost Reduction*: Drastically cuts macOS CI execution times.
   - **Trade-offs**: Requires strict cache key invalidation on API level, system image hash, and build-tools versions to prevent corrupted snapshot loads.

4. **Flow Option 4: AOSP Lightweight Headless System Flow (`target: default`)**
   - **Mechanism**: Uses standard AOSP system image (`target: default`) rather than `google_apis`.
   - **Why it's worth trying**:
     - *Minimal Memory Footprint*: AOSP images require ~1GB RAM instead of 2GB+, booting faster with lower CPU demands.
     - *Zero Play Services Overhead*: Ideal for validating pure WebView rendering and core OS features without Google background service syncs.
   - **Trade-offs**: Lacks Google Play Services and Google APIs if testing proprietary Google components.

5. **Flow Option 5: Remote Cloud Device Farm Matrix Dispatch (Firebase Test Lab / AWS Device Farm)**
   - **Mechanism**: Uses GitHub Actions to build the APK and invoke `gcloud firebase test android run` to execute on real physical devices (e.g., Pixel 8, Samsung Galaxy).
   - **Why it's worth trying**:
     - *100% Genuine Physical Hardware*: Validates physical display panels, authentic vendor WebView engines, and hardware codecs with zero emulator detection.
     - *Automated Artifacts*: Generates multi-angle videos, performance telemetry, and monkey logs out of the box.
   - **Trade-offs**: Requires Google Cloud project credentials, service account secrets, and consumes external cloud credits.

---

## 3. Producing Screencast and Image Artifacts

### 3.1 Android Emulator Screencast Recording
Android provides the native `screenrecord` utility. Achieving an uncorrupted, playable MP4 requires graceful process termination:

```bash
# 1. Start recording in background with explicit bitrate and limit
adb shell screenrecord --time-limit 180 --bit-rate 4000000 /sdcard/android-emulator-video.mp4 >/tmp/screenrecord.log 2>&1 &
RECORD_PID=$!

# 2. Execute test steps...
# ...

# 3. Graceful termination with SIGINT (CRITICAL: writes the MP4 'moov' atom index)
adb shell pkill -2 -f screenrecord
wait "$RECORD_PID" 2>/dev/null || true
sleep 3

# 4. Pull finalized video artifact
adb pull /sdcard/android-emulator-video.mp4 ./android-emulator-video.mp4
```

> **Why SIGINT (`-2`) is mandatory:** Killing `screenrecord` with `SIGKILL` (`-9`) or terminating the shell abruptly prevents Android from writing the MP4 container's header metadata (`moov` atom). Without the `moov` atom, the video file is corrupted and cannot be played or streamed.

### 3.2 Playwright Browser Screencasts
For web-based E2E tests, Playwright records full video screencasts automatically:
```bash
# Enable video recording via environment variable
PLAYWRIGHT_VIDEO=on ./docker/manage.sh e2e web --grep "shared subtitles link" --retries=0
```
- In `playwright.config.ts`, `video: process.env.PLAYWRIGHT_VIDEO === "on" ? "on" : "off"` instructs Chromium to capture `.webm` video files into `test-results/`.
- Mounted volume in `docker/compose.yml` ensures videos are preserved in `docker/artifacts/test-results/`.

### 3.3 Milestone Screenshots Pipeline
Screenshots are captured at key milestones along the test path:
- `step-01-about-phone.png`: System settings and device telemetry.
- `step-02-app-launch.png`: Clean native boot, asset loading via `appassets.androidplatform.net`.
- `step-03-action-view.png`: Response to `ACTION_VIEW` video URL.
- `step-04-action-send.png`: Response to `ACTION_SEND` shared text snippet.
- `step-05-captions-subtitles.png`: Authentic timedtext received, parsed, and highlighted.

### 3.4 Clean Repository Hygiene
- **Strict Zero Static Images / Videos Policy on `main`**: Binary videos and screenshots are NEVER committed to the Git source branch.
- Artifacts are uploaded to GitHub Actions workflow artifacts (retention 14 days) and staged to the orphaned `gh-pages` branch for web viewing.

---

## 4. GitHub Pages Report & Telemetry Dashboard [Later Enhancements]

### 4.1 How Reports are Hosted on GitHub Pages
GitHub Pages serves static web assets directly from the `gh-pages` branch or native GitHub Pages deployment. The CI pipeline compiles reports and stages them:

```text
gh-pages/
├── index.html                           # Live Web Demo Single Page Application
├── android-emulator-report.html         # Rich HTML E2E Test Report with status badge
├── android/
│   └── index.html                       # Mirror for /android path
├── screenshots/
│   ├── step-01-about-phone.png          # Milestone screenshot 1
│   ├── step-02-app-launch.png           # Milestone screenshot 2
│   ├── step-03-action-view.png          # Milestone screenshot 3
│   ├── step-04-action-send.png          # Milestone screenshot 4
│   ├── step-05-captions-subtitles.png   # Milestone screenshot 5
│   ├── android-emulator-screenshot.png  # Final full-screen telemetry capture
│   ├── android-emulator-video.mp4       # Screencast video recording
│   ├── android-emulator-logcat.txt      # Full timestamped logcat telemetry
│   └── android-emulator-device-info.json# Device hardware specifications
└── playwright/                          # Playwright HTML report and traces
```

### 4.2 Media Embedding & Download Links
The generated HTML report embeds HTML5 video and direct download links:
```html
<video controls autoplay muted loop playsinline width="100%">
  <source src="./screenshots/android-emulator-video.mp4" type="video/mp4">
</video>
<p><a href="./screenshots/android-emulator-video.mp4" download>Download Raw MP4 Screencast</a></p>
<p><a href="./screenshots/android-emulator-logcat.txt" download>Download Full Logcat File</a></p>
```

### 4.3 Fallback Mechanism Guaranteeing HTTP 200
In `.github/workflows/deploy-demo.yml`, if an authentic emulator video was not produced during a quick push, a fallback video is generated using `ffmpeg -loop 1 -i <screenshot> -t 5 ...` so all public links on GitHub Pages resolve with HTTP 200 rather than HTTP 404.

### 4.4 Future Enhancements (Planned "[Later]")
1. **Interactive Multi-Run Dashboard**: Historical run timeline comparing boot times, caption fetch latency, and memory consumption across commits.
2. **Video Scrubbing & Assertion Sync**: Synchronizing video playback timestamps with individual test assertions so clicking an assertion seeks the video to that moment.

---

## 5. E2E Alternatives Comparison Matrix

| Validation Layer | Runtime Environment | Fidelity | Speed | Resource Overhead | Bot-Detection Resilience | Key Capabilities & Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Native Android Emulator (API 34)** | macOS-14 runner or host with KVM/ADB | **100% Native** | Medium (~5-10 min) | High (2GB RAM, hardware acceleration) | **High** (genuine Android WebView & authentic cookies) | **Best for real app validation.** Tests native APK, intents, timedtext interception, native TTS, background playback. |
| **Docker-Based Playwright E2E** | Linux host or Codespace with Docker | **High Web Fidelity** | Fast (~1-2 min) | Low (isolated Playwright container) | **Medium** (clean browser profile, needs signed timedtext) | **Best for web regressions.** Pinned browser versions, zero host OS library issues, records video screencasts. |
| **Browser Viewport Emulation (`--project=emulation`)** | Local machine or CI | **Layout Fidelity** | Very Fast (<30 sec) | Minimal | **Low** | Tests responsive mobile CSS and touch events in desktop Chromium. Does NOT run Android OS. |
| **Cloud Device Farms (Firebase Test Lab, Sauce Labs)** | Remote cloud hardware | **High Native** | Slow (~10-15 min) | External dependency & cost | **High** | Tests on real physical Samsung/Pixel hardware. High cost and complex network tunnels. |
| **Quarantined Synthetic Mocks** | Node.js test runner | **Low (Synthetic)** | Instant (<1 sec) | Minimal | **None (Fails against real API)** | Quarantined in repo. Useful for offline unit unit testing of algorithms; cannot validate live YouTube traffic. |

---

## 6. Benefits of Using Docker for E2E Testing

1. **Host Dependency Isolation**:
   - Modern browsers like Chromium require dozens of shared Linux C-libraries (`libatk-1.0.so.0`, `libatk-bridge-2.0.so.0`, `libgbm.so.1`, `libasound.so.2`).
   - Running Playwright on bare hosts or standard Codespaces frequently fails due to missing OS packages.
   - The project Docker image (`mcr.microsoft.com/playwright:v1.64.1-noble`) includes every required system library out of the box.

2. **Exact Version Pinning**:
   - The Docker image tag is explicitly pinned to `@playwright/test` version `1.64.1`.
   - Prevents subtle browser version mismatches between developer machines, PR checks, and release workflows.

3. **Reproducible Clean Slate**:
   - Every test runs in a pristine container environment without stale browser profiles, cached service workers, or lingering cookies.

4. **Isolated Artifact Storage**:
   - Volume mounts (`./docker/artifacts:/workspace/artifacts`) keep all generated videos, traces, and screenshots neatly sequestered and git-ignored.

5. **Configurable Networking**:
   - Supports both container bridge networking and host networking (`E2E_NETWORK_MODE=host`) to seamlessly reach local dev servers or forward authenticated session proxies.

---

## 7. Recommended Codespace Template for Android Development

### 7.1 The Codespace Dilemma for Android
- **GitHub Codespaces VMs** default to Linux containers on Azure hosts.
- **Limitation**: Standard 2-core and 4-core GitHub Codespaces do **NOT** have hardware virtualization (`/dev/kvm`) enabled.
- Running an Android Emulator without KVM relies on software CPU emulation, which is exceedingly slow (often 20+ minutes just to boot Android, causing test timeouts).

### 7.2 Recommended DevContainer Configuration
For building the Android APK, running web Playwright E2E, and managing the project in Codespaces, use a custom `.devcontainer/devcontainer.json`:

```json
{
  "name": "Android & Web Full-Stack DevContainer",
  "image": "mcr.microsoft.com/devcontainers/universal:latest",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {
      "version": "latest",
      "enableNonRootDocker": "true"
    },
    "ghcr.io/devcontainers/features/java:1": {
      "version": "17",
      "installGradle": "true"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "vscjava.vscode-java-pack",
        "ms-playwright.playwright",
        "dbaeumer.vscode-eslint"
      ]
    }
  },
  "postCreateCommand": "npm install && npx playwright install --with-deps chromium"
}
```

### 7.3 Optimal Hybrid Workflow
1. **In GitHub Codespaces**:
   - Develop React web application, edit Kotlin native shell code.
   - Compile Android APK debug builds via `cd android-shell && ./gradlew assembleDebug`.
   - Run containerized Playwright E2E tests via `./docker/manage.sh e2e web`.
2. **In GitHub Actions CI / Local Workstation**:
   - Execute unmocked Android Emulator tests on GitHub Actions using `runs-on: macos-14` (Apple Silicon M1/M2 runners have native hardware hypervisor support).
   - Or run locally on physical Android hardware connected via USB with `adb`.

---

## 8. Answers to Specific Technical Questions

### Q1: Can Docker for Android be used to run E2E testing?
**Answer: Yes, but with strict hardware virtualization prerequisites.**
- Solutions like `budtmo/docker-android` or `redroid` package the Android OS inside Docker containers.
- However, they **strictly require `/dev/kvm` (Kernel-based Virtual Machine)** mounted from the host (`--device /dev/kvm`).
- **Where it works**: On local Linux workstations with KVM enabled, or on bare-metal cloud servers.
- **Where it fails**: Inside Google AI Studio, standard GitHub Codespaces, or standard Docker-in-Docker CI containers where nested virtualization is disabled.
- **Why this repo uses macOS-14 runners instead**: In GitHub Actions, `runs-on: macos-14` provides native Apple Silicon hardware acceleration without requiring complex nested KVM Docker containers.

### Q2: Can screencast artifacts be used?
**Answer: Yes, and they are actively used for verification and debugging.**
- **Playwright Screencasts (`.webm`)**: Recorded when `PLAYWRIGHT_VIDEO=on`. They capture the exact browser viewport, user interactions, and DOM responses.
- **Android Screencasts (`.mp4`)**: Recorded on-device using `adb shell screenrecord`. They capture real 60fps native application rendering, video playback, and caption alignment.
- **Use Cases**:
  1. Attached to GitHub Actions workflow artifacts (`android-emulator-artifacts`) for post-mortem debugging.
  2. Embedded into `android-emulator-report.html` on GitHub Pages for visual demonstration.
  3. Linked in release notes as tangible proof of authentic device verification.

### Q3: Can GitHub Pages reports use those Dockers?
**Answer: GitHub Pages is static hosting; Docker executes during the CI build.**
- GitHub Pages is a static file hosting service; it cannot run Docker containers, background services, or server-side databases.
- The correct workflow is:
  1. Docker runs in GitHub Actions CI (or on a build server) to execute the tests.
  2. Docker mounts an output volume (e.g. `./docker/artifacts`).
  3. The CI workflow extracts the generated HTML reports, videos, screenshots, and logs.
  4. The workflow deploys these static files to the `gh-pages` branch.
  5. GitHub Pages serves the pre-rendered reports to users worldwide.

### Q4: Can GitHub Pages reports generate video artifacts?
**Answer: GitHub Pages does NOT generate videos; CI generates videos and GitHub Pages serves them.**
- Generation of video requires CPU/GPU resources and software like `adb screenrecord`, Playwright's Chromium recorder, or `ffmpeg`.
- This generation happens inside the GitHub Actions workflow runner.
- Once generated, the video file is placed in `dist/screenshots/android-emulator-video.mp4` and published to `gh-pages`.
- GitHub Pages then acts as the CDN/host that streams and allows downloading of the video artifact.

### Q5: Any MCP (Model Context Protocol) recommended for these practices?
**Answer: Yes. The following MCP servers significantly enhance AI-assisted E2E testing:**

1. **Playwright MCP Server (`@executeautomation/playwright-mcp-server` or `puppeteer/playwright MCP`)**:
   - **Capability**: Enables the AI agent to navigate web pages, click elements, fill inputs, evaluate JavaScript, and take live screenshots in real time.
   - **Benefit**: The agent can visually interact with the web app, test UI components, and diagnose failing selectors interactively.

2. **Android ADB MCP Server (`adb-mcp` or community Android MCPs)**:
   - **Capability**: Exposes ADB commands (`adb shell input`, `adb logcat`, `adb install`, `adb shell screencap`, `adb shell screenrecord`) as structured MCP tools.
   - **Benefit**: The AI agent can inspect connected Android devices or emulators, trigger intents, check logcat streams, and capture live screenshots during task execution.

3. **Docker MCP Server**:
   - **Capability**: Allows inspection of Docker containers, images, volumes, and execution of `docker compose` commands.
   - **Benefit**: Automates container lifecycle management, image building, and test execution directly through standard tool calls.

4. **GitHub MCP Server (`@modelcontextprotocol/server-github`)**:
   - **Capability**: Interacts with the GitHub API to query workflow runs, inspect Action logs, download build artifacts, and monitor CI/CD pipelines.
   - **Benefit**: Enables the AI agent to diagnose CI failures (e.g., in `emulation.yml` or `web.yml`) and retrieve screencast artifact links autonomously.

---

## 9. Verification & Maintenance Commands

| Target | Command | Purpose |
| :--- | :--- | :--- |
| **Verify E2E Testing Guide** | `npm run test:e2e-testing-guide` | Asserts existence and comprehensive coverage of `docs/e2e_testing_including_android_codespace_docker_and_github_pages.md`. |
| **Verify Platforms Doc** | `npm run test:platforms-doc` | Asserts AI Studio platform constraints and execution strategy. |
| **Run Native E2E Selectors Test** | `npm run test:e2e-selectors` | Instant verification of DOM selectors and test-ids without browser overhead. |
| **Run Web Playwright via Docker** | `./docker/manage.sh e2e web` | Containerized Playwright run in official Noble image. |
| **Run Android E2E on Device/Emulator** | `bash scripts/run-android-e2e.sh` | Full Android lifecycle with screencast and logcat extraction. |
