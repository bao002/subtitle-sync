# Android Emulator E2E Verification & Video Product Reboot Plan

## Overview & Core Objective

Restart Android end-to-end verification with a clean, minimalist focus:

- **Core Tested Feature**: The application can be shared a YouTube video via Android native intents (`ACTION_VIEW` for browser URLs and `ACTION_SEND` for official YouTube app text shares).
- **Single Minimal Report**: Host a simple, single-purpose GitHub Pages report replacing complex, failing multi-dashboard reports.
- **Three Authentic Test Products**:
  1. **Android logs**: Filtered Logcat (`android-emulator-logcat.txt`) recording app boot, intent interception, and subtitle events.
  2. **Screencast video**: Screen recording (`android-emulator-video.mp4`) captured on the Android 14 (API 34) emulator.
  3. **Images**: Native screenshot captures (`android-emulator-screenshot.png`) proving the shared video ID renders in the UI.

---

## Architecture & Implementation Steps

### 1. Quarantine Isolation (`quarentined/`)

- All failing and complex legacy E2E suites are sequestered in `quarentined/`:
  - `quarentined/cypress/`: Cypress E2E test specs and Mochawesome report configurations.
  - `quarentined/e2e/`: Playwright browser and app specs (`app.spec.ts`, `web.spec.ts`, and `emulation.legacy.spec.ts`).
  - `quarentined/reports/`: Legacy complex report pages.
- Allows a fresh attempt to focus 100% on making the Android emulation test pass cleanly.

### 2. Single Minimal Android E2E Spec (`e2e/emulation.spec.ts`)

- Proves that the application can receive a shared YouTube video without crash or error screen.
- Milestone 1: Tests `ACTION_VIEW` browser link (`https://www.youtube.com/watch?v=dQw4w9WgXcQ`), verifying video ID `dQw4w9WgXcQ`.
- Milestone 2: Tests `ACTION_SEND` YouTube app share text (`https://youtu.be/kJQP7kiw5Fk`), verifying video ID `kJQP7kiw5Fk`.

### 3. Emulator & Device Assertion Script (`scripts/android-e2e-assert.sh`)

- Waits for clean app startup and `[APP_READY]` signal.
- Dispatches live `ACTION_VIEW` and `ACTION_SEND` intents via ADB.
- Captures step screenshots and dumps Logcat telemetry to `android-emulator-logcat.txt`.

### 4. Minimal GitHub Pages Report (`public/android-emulator-report.html` & `public/android/index.html`)

- Displays verified execution status badge.
- Embedded HTML5 video player streaming the authentic MP4 screencast.
- Captured screenshot preview with direct download link.
- Filtered Logcat viewer with full log file download.

### 5. Simplified README (`README.md`)

- Deprecates cluttered tables in favor of a direct working link to the live GitHub Pages report.
- Features clear links to the 3 products, the single-command APK installation script, and a notice explaining quarantined secondary suites.

### 6. Automated Test Suite (`scripts/verify-quarantine-and-minimal-share-e2e.ts`)

- Automated verification asserting all 6 criteria: strategy doc, quarantine isolation, minimal E2E spec, assertion runner, report templates, and README.md.
