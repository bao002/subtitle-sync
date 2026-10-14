# YouTube Subtitle & Speech Flow Viewer

[![Build & Release Android APK](https://github.com/ofer-shaham/subtitle-sync/actions/workflows/release-apk.yml/badge.svg)](https://github.com/ofer-shaham/subtitle-sync/actions/workflows/release-apk.yml)
[![Web E2E Tests](https://github.com/ofer-shaham/subtitle-sync/actions/workflows/web.yml/badge.svg)](https://github.com/ofer-shaham/subtitle-sync/actions/workflows/web.yml)
[![Android Emulator E2E Tests](https://github.com/ofer-shaham/subtitle-sync/actions/workflows/emulation.yml/badge.svg)](https://github.com/ofer-shaham/subtitle-sync/actions/workflows/emulation.yml)
[![Report Video Flow](https://github.com/ofer-shaham/subtitle-sync/actions/workflows/report-video-flow.yml/badge.svg)](https://github.com/ofer-shaham/subtitle-sync/actions/workflows/report-video-flow.yml)
[![Publish Web Demo](https://github.com/ofer-shaham/subtitle-sync/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/ofer-shaham/subtitle-sync/actions/workflows/deploy-demo.yml)

An Android native shell application for YouTube learning with synchronized multi-language subtitles and speech flow.

> **Status Notice (Minimalist Reboot)**:
> All legacy/complex E2E test suites and secondary report dashboards have been **quarantined under `quarentined/`** (detailed in [`docs/fix-android-e2e-test-and-video-product.md`](./docs/fix-android-e2e-test-and-video-product.md)).
> Current focus is 100% on verifying the core native feature on the Android Emulator with a single, clean report.

---

<!-- CI_STATUS_INDICATOR_START -->
## 🚨 Latest CI Build & Test Status: FAILED

> ⚠️ **Automated Failure / Broken Links Detected**: `Android Emulator Screencast & Report Video Flow` (1 broken link found)
>
> If screencasts, logs, or reports are missing, copy the diagnostic block below and paste it directly into your AI Assistant prompt to reproduce and resolve the failure immediately:

```markdown
# AI FIX PROMPT: CI Failure in Android Emulator Screencast & Report Video Flow
- **Repository**: ofer-shaham/subtitle-sync
- **Workflow / Checker**: Android Emulator Screencast & Report Video Flow
- **Failing Step**: Broken Video Link Detection in android-emulator-report.html
- **Report URL**: https://ofer-shaham.github.io/subtitle-sync/android-emulator-report.html
- **Run URL**: https://github.com/ofer-shaham/subtitle-sync/actions/runs/38488125906

### Failure Log & Diagnosis:
Report at android-emulator-report.html contains broken video link (screencast video missing or HTTP 404).

### 🔗 Broken Links Detected:
- `[Report Screencast Video: android-emulator-video.mp4](https://ofer-shaham.github.io/subtitle-sync/screenshots/android-emulator-video.mp4)` -> HTTP 404 on GitHub Pages (Report at https://ofer-shaham.github.io/subtitle-sync/android-emulator-report.html has broken video source; android-emulator-video.mp4 returned HTTP 404) (`public/android-emulator-report.html -> <video controls> (screencast video missing / 404)`)

### Instructions for AI Assistant:
1. Examine the root cause, broken link(s), and diagnostic details above.
2. If the screencast video link returned 404 in android-emulator-report.html, trigger the 'Android Emulator E2E Tests' workflow (emulation.yml) to record and publish android-emulator-video.mp4 to GitHub Pages.
3. Fix broken target paths, restore missing files, or fix failing application code with targeted edits.
4. Verify that `npm run test:readme-links` and all automated test suites pass cleanly.
```
<!-- CI_STATUS_INDICATOR_END -->

---

## 📱 Live Android Emulator Verification Report

Access the primary, working verification report proving the core feature on Android 14 (API 34):

👉 [**Open Android Emulator E2E Report**](https://ofer-shaham.github.io/subtitle-sync/android-emulator-report.html) (or [**/android/**](https://ofer-shaham.github.io/subtitle-sync/android/))

### 🎯 Feature Under Test:
- **The application can be shared a YouTube video** via standard Android native intents:
  - `ACTION_VIEW`: Direct YouTube browser URL sharing
  - `ACTION_SEND`: Share text from the official YouTube app

### 📦 Verified Test Products:
1. **Android Logs**: [Download `android-emulator-logcat.txt`](https://ofer-shaham.github.io/subtitle-sync/screenshots/android-emulator-logcat.txt) (or live logcat audit)
2. **Android Emulator Screencast Video**: ⚠️ [**Missing Asset / HTTP 404**](https://ofer-shaham.github.io/subtitle-sync/screenshots/android-emulator-video.mp4) (screencast video missing from gh-pages branch — see README CI status)
3. **Screenshot Images**: [View `android-emulator-screenshot.png`](https://ofer-shaham.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png) (full-resolution UI capture)

---

## 📲 Install Android APK via Single Command

To download and install the latest `YouTube-Viewer-debug.apk` onto any connected Android device or emulator via ADB without cloning the repository:

```bash
curl -fsSL https://raw.githubusercontent.com/ofer-shaham/subtitle-sync/main/update.apk.sh | bash -s -- "https://github.com/ofer-shaham/subtitle-sync/releases/latest/download/YouTube-Viewer-debug.apk"
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



*(Legacy web reports like [mochawesome.html](https://ofer-shaham.github.io/subtitle-sync/mochawesome.html) and [playwright](https://ofer-shaham.github.io/subtitle-sync/playwright/index.html) are deprecated and quarantined in `quarentined/`.)*

## Server config
Default server settings live in `src/config/server.json` (`server_address`, `is_enabled` — off by default). Details: [docs/server.md](docs/server.md).
