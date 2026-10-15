# Parallel Subtitles

[![Release APK](https://github.com/mostuf2556/subtitle-sync/actions/workflows/release-apk.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/release-apk.yml)
[![Web CI](https://github.com/mostuf2556/subtitle-sync/actions/workflows/web.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/web.yml)
[![Android Emulator E2E Tests](https://github.com/mostuf2556/subtitle-sync/actions/workflows/emulation.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/emulation.yml)
[![Deploy Demo to GitHub Pages](https://github.com/mostuf2556/subtitle-sync/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/deploy-demo.yml)
[![Integrity Checks](https://github.com/mostuf2556/subtitle-sync/actions/workflows/integrity.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/integrity.yml)
[![Update README](https://github.com/mostuf2556/subtitle-sync/actions/workflows/update-readme.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/update-readme.yml)
[![Report Video Flow](https://github.com/mostuf2556/subtitle-sync/actions/workflows/report-video-flow.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/report-video-flow.yml)

<!-- CI_STATUS_INDICATOR_START -->
## 🚨 Latest CI Build & Test Status: FAILED

> ⚠️ **Automated Failure / Broken Links Detected**: `Android Emulator Screencast & Report Video Flow` (1 broken link found)
>
> If screencasts, logs, or reports are missing, copy the diagnostic block below and paste it directly into your AI Assistant prompt to reproduce and resolve the failure immediately:

```markdown
# AI FIX PROMPT: CI Failure in Android Emulator Screencast & Report Video Flow
- **Repository**: mostuf2556/subtitle-sync
- **Workflow / Checker**: Android Emulator Screencast & Report Video Flow
- **Failing Step**: Broken Video Link Detection in android-emulator-report.html
- **Report URL**: https://mostuf2556.github.io/subtitle-sync/android-emulator-report.html
- **Run URL**: https://github.com/mostuf2556/subtitle-sync/actions/runs/38670090336

### Failure Log & Diagnosis:
Report at android-emulator-report.html contains broken video link (screencast video missing or HTTP 404).

### 🔗 Broken Links Detected:
- `[Report Screencast Video: android-emulator-video.mp4](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-video.mp4)` -> HTTP 404 on GitHub Pages (Report at https://mostuf2556.github.io/subtitle-sync/android-emulator-report.html has broken video source; android-emulator-video.mp4 returned HTTP 404) (`public/android-emulator-report.html -> <video controls> (screencast video missing / 404)`)

### Instructions for AI Assistant:
1. Examine the root cause, broken link(s), and diagnostic details above.
2. If the screencast video link returned 404 in android-emulator-report.html, trigger the 'Android Emulator E2E Tests' workflow (emulation.yml) to record and publish android-emulator-video.mp4 to GitHub Pages.
3. Fix broken target paths, restore missing files, or fix failing application code with targeted edits.
4. Verify that `npm run test:readme-links` and all automated test suites pass cleanly.
```
<!-- CI_STATUS_INDICATOR_END -->

## 🎯 Core Tested Feature

**The application can be shared a YouTube video** via native Android intents (`ACTION_VIEW` and `ACTION_SEND`). Users can share links from YouTube or any browser directly to the app to immediately parse and synchronize parallel JSON3 timedtext subtitles.

Secondary and complex legacy test suites are sequestered in [quarentined/](./quarentined/reports/web-index.html) to ensure isolated, deterministic end-to-end emulation.

---

## 📱 Live Android Emulator Verification Report

All verification runs produce authentic test outputs published directly to GitHub Pages:

| Artifact | Link | Description |
| :--- | :--- | :--- |
| 📋 **Mochawesome Test Report** | [mochawesome.html](https://mostuf2556.github.io/subtitle-sync/mochawesome.html) | E2E assertion breakdown |
| 🔍 **Playwright Test Report** | [playwright](https://mostuf2556.github.io/subtitle-sync/playwright/index.html) | Interactive web test trace |
| 📱 **Android Emulator Report** | [android-emulator-report.html](https://mostuf2556.github.io/subtitle-sync/android-emulator-report.html) | Authentic Android WebView verification report |
| 📸 **Android Emulator Screenshot** | [android-emulator-screenshot.png](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png) | High-resolution UI screen capture from Android Emulator E2E run |
| 🎬 **Android Emulator Screencast Video** | [View/Download MP4 Screencast (6.41 MB)](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-video.mp4) | Full authentic screen recording from Android Emulator E2E run (API 34 Google APIs, size: 6,724,502 bytes / 6.41 MB). |

### Verified Products:
1. **Android Emulator Report**: [View report](https://mostuf2556.github.io/subtitle-sync/android-emulator-report.html)
2. **Android Emulator Screencast Video**: [Download `android-emulator-video.mp4`](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-video.mp4) (6.41 MB MP4 recording)
3. **Android Emulator Screenshot**: [View screenshot](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png)

---

## 🚀 Installation & Update via CLI

Install or update the Android APK directly onto an attached device or emulator via [update.apk.sh](./update.apk.sh):

```bash
curl -sSL https://raw.githubusercontent.com/mostuf2556/subtitle-sync/main/update.apk.sh | bash
```

---

## 📚 Architectural Contracts & Documentation

- [Actions & Operational Workflows](./docs/operations/ACTIONS.md)
- [Library Specifications](./docs/specifications/LIBRARY.md)
- [Subtitle Views Contract](./docs/designs/DESIGN_SUBTITLE_VIEWS.md)
- [Language View Selection Contract](./docs/designs/DESIGN_VIEW_LANGS.md)
- [Controls View Contract](./docs/designs/DESIGN_CONTROLS_VIEW.md)
- [Player Provider Contract](./docs/designs/DESIGN_PLAYER_PROVIDER.md)
- [State Coordinator Contract](./docs/designs/DESIGN_STATE_COORDINATOR.md)
- [TimedText JSON3 Schema](./docs/specifications/SCHEMA_TIMEDTEXT.md)
- [Debugging & Diagnostics](./docs/operations/DEBUG.md)
- [Tokens Economy Protocol](./docs/tokens.md)
- [Android Shell & Interception](./docs/android.md)
- [Subtitle Parser Specification](./docs/parser.md)
- [Self-Verification Protocol](./docs/self-verification.md)
- [File Inventory](./docs/files.md)
- [Reliable Subtitle Fetching](./docs/reliable-subtitles-fetching.md)
