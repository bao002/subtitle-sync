# Fix Android E2E Test & Video Product Strategy (`docs/fix-android-e2e-test-and-video-product.md`)

This specification establishes the minimal reboot strategy for Android Emulator E2E testing, GitHub Pages reporting, and visual test products.

---

## 1. Context & Core Problem

Recent automated runs generated complex GitHub Pages reports containing multiple sprawling test suites (Cypress E2E web tests, Mochawesome dashboards, multi-faceted Playwright suites, timing lab verifications, etc.) which resulted in **mostly failing tests**. 

Attempting to fix multiple interconnected, fragile web and emulation suites simultaneously burns token budgets, obscures the core verification goals, and clutters CI/CD reporting with failure cascades.

---

## 2. Decision: Minimalist Reboot Strategy

To restore clarity and guarantee a green, deterministic pipeline:
1. **Minimize GitHub Pages reporting to 1 single, most simple report**:
   - The report focuses exclusively on **1 most simple E2E test running on the Android Emulator**.
   - The test validates the primary core feature of the native application:
     > **The application can be shared a YouTube video** (via Android intents `ACTION_VIEW` browser URL and `ACTION_SEND` YouTube app share text).
2. **Quarantine all other E2E tests and legacy report generators**:
   - All complex, deprecated, and failing E2E test suites (Cypress suites, web Playwright suites, legacy multi-step report templates) are moved into a designated quarantine directory: `quarentined/`.
   - Isolating these files allows a fresh, unencumbered attempt to make the single Android emulation test pass cleanly.
3. **Phased release plan**:
   - **Phase 1 (Current)**: Start small and minimalistic. Focus 100% on making the Android emulation video share test pass, verifying the screen recording, screenshots, and Logcat telemetry.
   - **Phase 2 (Subsequent)**: After achieving a verified successful result on the Android emulator and a green report on GitHub Pages, quarantined files will be released from `quarentined/` one-by-one and fixed systematically.

---

## 3. The 3 Authentic Test Products

The single minimal Android E2E execution is designed to produce 3 authentic, concrete artifacts:

| Product | Artifact File | Purpose & Verification Standard |
| :--- | :--- | :--- |
| **1. Android Logs** | `android-emulator-logcat.txt` | Filtered ADB Logcat capturing app boot (`[APP_READY]`), shared video intent interception (`Received shared link from Android intent` / `[SHARED_LINK_DISPATCH]`), and subtitle network telemetry. |
| **2. Screencast Video** | `android-emulator-video.mp4` | Live MP4 screen recording captured via `adb shell screenrecord` on the Android emulator (API 34 Google APIs), demonstrating app launch, intent dispatch, and UI rendering of the shared video. |
| **3. Screenshot Images** | `android-emulator-screenshot.png` | Native full-resolution screen capture (`adb shell screencap`) proving the shared YouTube video ID is received and active in the UI header and player view. |

---

## 4. Minimal README Architecture

The repository's top-level `README.md` is simplified to remove outdated, multi-table dashboards, sprawling specifications, and non-working links. Instead, `README.md` focuses cleanly on:
1. **Project identity & single core feature**: Android application for synchronized subtitles and speech, accepting shared YouTube videos.
2. **Live Android E2E Test Report Link**: A prominent, direct working link to the single GitHub Pages report hosted at:
   `https://<owner>.github.io/<repo>/android-emulator-report.html` (and `/android/index.html`).
3. **Working Install & Run Instructions**: The single `update.apk.sh` curl command for installing the debug APK.
4. **Current Status Notice**: A concise note stating that secondary suites are quarantined under `quarentined/` while focusing on Android emulator parity.

---

## 5. Minimal Single Android E2E Share Test Spec

The active Android E2E test suite (`e2e/emulation.spec.ts` and `scripts/android-e2e-assert.sh`) verifies the core video share contract:
1. **Application launch**: App loads smoothly into the WebView without error screens (`"This page didn't load"`).
2. **Share Intent Reception (`ACTION_VIEW`)**: App receives a YouTube browser URL (`https://www.youtube.com/watch?v=dQw4w9WgXcQ`), extracts video ID `dQw4w9WgXcQ`, and updates the UI header.
3. **Share Intent Reception (`ACTION_SEND`)**: App receives share text from the official YouTube app (`"Check out this video: https://youtu.be/kJQP7kiw5Fk"`), extracts video ID `kJQP7kiw5Fk`, and switches the active video.
4. **Artifact capture**: Screencast video finalized, full-resolution screenshot captured, and Logcat dumped to `android-emulator-logcat.txt`.
