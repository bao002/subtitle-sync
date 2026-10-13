# YouTube Subtitle & Speech Flow Viewer

[![Build & Release Android APK](https://github.com/mostuf2556/subtitle-sync/actions/workflows/release-apk.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/release-apk.yml)
[![Web E2E Tests](https://github.com/mostuf2556/subtitle-sync/actions/workflows/web.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/web.yml)
[![Android Emulator E2E Tests](https://github.com/mostuf2556/subtitle-sync/actions/workflows/emulation.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/emulation.yml)
[![Publish Web Demo](https://github.com/mostuf2556/subtitle-sync/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/deploy-demo.yml)

An Android native shell application for YouTube learning with synchronized multi-language subtitles and speech flow.

> **Status Notice (Minimalist Reboot)**:
> All legacy/complex E2E test suites and secondary report dashboards have been **quarantined under `quarentined/`** (detailed in [`docs/fix-android-e2e-test-and-video-product.md`](./docs/fix-android-e2e-test-and-video-product.md)).
> Current focus is 100% on verifying the core native feature on the Android Emulator with a single, clean report.

---

## 📱 Live Android Emulator Verification Report

Access the primary, working verification report proving the core feature on Android 14 (API 34):

👉 [**Open Android Emulator E2E Report**](https://mostuf2556.github.io/subtitle-sync/android-emulator-report.html) (or [**/android/**](https://mostuf2556.github.io/subtitle-sync/android/))

### 🎯 Feature Under Test:
- **The application can be shared a YouTube video** via standard Android native intents:
  - `ACTION_VIEW`: Direct YouTube browser URL sharing
  - `ACTION_SEND`: Share text from the official YouTube app

### 📦 Verified Test Products:
1. **Android Logs**: [Download `android-emulator-logcat.txt`](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-logcat.txt) (or live logcat audit)
2. **Screencast Video**: [Download `android-emulator-video.mp4`](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-video.mp4) (authentic screen recording)
3. **Screenshot Images**: [View `android-emulator-screenshot.png`](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png) (full-resolution UI capture)

---

## 📲 Install Android APK via Single Command

To download and install the latest `YouTube-Viewer-debug.apk` onto any connected Android device or emulator via ADB without cloning the repository:

```bash
curl -fsSL https://raw.githubusercontent.com/mostuf2556/subtitle-sync/main/update.apk.sh | bash -s -- "https://github.com/mostuf2556/subtitle-sync/releases/latest/download/YouTube-Viewer-debug.apk"
```

---

## 📁 Repository Documentation & Quarantined Assets

- **Master Documentation & Files Catalog**: [`docs/files.md`](./docs/files.md) (comprehensive directory explaining every doc in `docs/` and all codebase files)
- **Strategy Specification**: [`docs/fix-android-e2e-test-and-video-product.md`](./docs/fix-android-e2e-test-and-video-product.md)
- **Agent Instructions**: [`AGENTS.md`](./AGENTS.md)
- **Android Architecture**: [`docs/android.md`](./docs/android.md)
- **Token Economy**: [`docs/tokens.md`](./docs/tokens.md)
- **Subtitle Parser**: [`docs/parser.md`](./docs/parser.md)
- **Self Verification**: [`docs/self-verification.md`](./docs/self-verification.md)
- **Task Backlog**: [`docs/tasks.md`](./docs/tasks.md)
- **Completed Log**: [`docs/done.md`](./docs/done.md)
- **Project Roadmap**: [`docs/roadmap.md`](./docs/roadmap.md)



*(Legacy web reports like [mochawesome.html](https://mostuf2556.github.io/subtitle-sync/mochawesome.html) and [playwright](https://mostuf2556.github.io/subtitle-sync/playwright/index.html) are deprecated and quarantined in `quarentined/`.)*
