# YouTube Subtitle & Speech Flow Viewer

[![Build & Release Android APK](https://github.com/mostuf25561/subtitle-sync/actions/workflows/release-apk.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/release-apk.yml)
[![Web E2E Tests](https://github.com/mostuf25561/subtitle-sync/actions/workflows/web.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/web.yml)
[![Android Emulator E2E Tests](https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml)
[![Publish Web Demo](https://github.com/mostuf25561/subtitle-sync/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/deploy-demo.yml)

An Android native shell application for YouTube learning with synchronized multi-language subtitles and speech flow.

> **Status Notice (Minimalist Reboot)**:
> All legacy/complex E2E test suites and secondary report dashboards have been **quarantined under `quarentined/`** (detailed in [`docs/fix-android-e2e-test-and-video-product.md`](./docs/fix-android-e2e-test-and-video-product.md)).
> Current focus is 100% on verifying the core native feature on the Android Emulator with a single, clean report.

---

<!-- CI_STATUS_INDICATOR_START -->
## 🚨 Latest CI Build & Test Status: FAILED

> ⚠️ **Automated CI Failure Detected**: `README Link Integrity & Documentation Check` (Step: `npm run test:readme-links`)
>
> If screencasts, logs, or reports are missing, copy the diagnostic block below and paste it directly into your AI Assistant prompt to reproduce and resolve the failure immediately:

```markdown
# AI FIX PROMPT: CI Failure in README Link Integrity & Documentation Check
- **Repository**: mostuf25561/subtitle-sync
- **Workflow / Checker**: README Link Integrity & Documentation Check
- **Failing Step**: npm run test:readme-links
- **Run URL**: https://github.com/mostuf25561/subtitle-sync/actions/runs/38482472837

### Failure Log & Diagnosis:
Broken relative links or missing workflow files detected in README.md.

### Instructions for AI Assistant:
1. Examine the root cause, broken link(s), and diagnostic details above.
2. Fix broken target paths, restore missing files, or fix failing application code with targeted edits.
3. Verify that `npm run test:readme-links` and all automated test suites pass cleanly.
```
<!-- CI_STATUS_INDICATOR_END -->

---

## 📱 Live Android Emulator Verification Report

Access the primary, working verification report proving the core feature on Android 14 (API 34):

👉 [**Open Android Emulator E2E Report**](https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html) (or [**/android/**](https://mostuf25561.github.io/subtitle-sync/android/))

### 🎯 Feature Under Test:
- **The application can be shared a YouTube video** via standard Android native intents:
  - `ACTION_VIEW`: Direct YouTube browser URL sharing
  - `ACTION_SEND`: Share text from the official YouTube app

### 📦 Verified Test Products:
1. **Android Logs**: [Download `android-emulator-logcat.txt`](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-logcat.txt) (or live logcat audit)
2. **Android Emulator Screencast Video**: [Download `android-emulator-video.mp4` (6.41 MB MP4 recording)](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-video.mp4) (authentic screen recording)
3. **Screenshot Images**: [View `android-emulator-screenshot.png`](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png) (full-resolution UI capture)

---

## 📲 Install Android APK via Single Command

To download and install the latest `YouTube-Viewer-debug.apk` onto any connected Android device or emulator via ADB without cloning the repository:

```bash
curl -fsSL https://raw.githubusercontent.com/mostuf25561/subtitle-sync/main/update.apk.sh | bash -s -- "https://github.com/mostuf25561/subtitle-sync/releases/latest/download/YouTube-Viewer-debug.apk"
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



*(Legacy web reports like [mochawesome.html](https://mostuf25561.github.io/subtitle-sync/mochawesome.html) and [playwright](https://mostuf25561.github.io/subtitle-sync/playwright/index.html) are deprecated and quarantined in `quarentined/`.)*

## Server config
Default server settings live in `src/config/server.json` (`server_address`, `is_enabled` — off by default). Details: [docs/server.md](docs/server.md).
