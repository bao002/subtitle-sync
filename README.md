# YouTube Subtitle Learning Platform (`subtitle-sync`)

[![Build & Release Android APK](https://github.com/mostuf25563/subtitle-sync/actions/workflows/release-apk.yml/badge.svg)](https://github.com/mostuf25563/subtitle-sync/actions/workflows/release-apk.yml)
[![Web E2E Tests](https://github.com/mostuf25563/subtitle-sync/actions/workflows/web.yml/badge.svg)](https://github.com/mostuf25563/subtitle-sync/actions/workflows/web.yml)
[![Android Emulator E2E Tests](https://github.com/mostuf25563/subtitle-sync/actions/workflows/emulation.yml/badge.svg)](https://github.com/mostuf25563/subtitle-sync/actions/workflows/emulation.yml)
[![Deploy Demo to GitHub Pages](https://github.com/mostuf25563/subtitle-sync/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/mostuf25563/subtitle-sync/actions/workflows/deploy-demo.yml)
[![Android Emulator Screencast & Report Video Flow](https://github.com/mostuf25563/subtitle-sync/actions/workflows/report-video-flow.yml/badge.svg)](https://github.com/mostuf25563/subtitle-sync/actions/workflows/report-video-flow.yml)

<!-- CI_STATUS_INDICATOR_START -->
## 🚨 Latest CI Build & Test Status: FAILED

> ⚠️ **Automated Failure / Broken Links Detected**: `Android Emulator Screencast & Report Video Flow` (1 broken link found)
>
> If screencasts, logs, or reports are missing, copy the diagnostic block below and paste it directly into your AI Assistant prompt to reproduce and resolve the failure immediately:

```markdown
# AI FIX PROMPT: CI Failure in Android Emulator Screencast & Report Video Flow
- **Repository**: mostuf25563/subtitle-sync
- **Workflow / Checker**: Android Emulator Screencast & Report Video Flow
- **Failing Step**: Broken Video Link Detection in android-emulator-report.html
- **Report URL**: https://mostuf25563.github.io/subtitle-sync/android-emulator-report.html
- **Run URL**: https://github.com/mostuf25563/subtitle-sync/actions/runs/38508762373

### Failure Log & Diagnosis:
Report at android-emulator-report.html contains broken video link (screencast video missing or HTTP 404).

### 🔗 Broken Links Detected:
- `[Report Screencast Video: android-emulator-video.mp4](https://mostuf25563.github.io/subtitle-sync/screenshots/android-emulator-video.mp4)` -> HTTP 404 on GitHub Pages (Report at https://mostuf25563.github.io/subtitle-sync/android-emulator-report.html has broken video source; android-emulator-video.mp4 returned HTTP 404) (`public/android-emulator-report.html -> <video controls> (screencast video missing / 404)`)

### Instructions for AI Assistant:
1. Examine the root cause, broken link(s), and diagnostic details above.
2. If the screencast video link returned 404 in android-emulator-report.html, trigger the 'Android Emulator E2E Tests' workflow (emulation.yml) to record and publish android-emulator-video.mp4 to GitHub Pages.
3. Fix broken target paths, restore missing files, or fix failing application code with targeted edits.
4. Verify that `npm run test:readme-links` and all automated test suites pass cleanly.
```
<!-- CI_STATUS_INDICATOR_END -->

---

## 🌐 GitHub Pages Links

| Resource | Target Link | Description |
| :--- | :--- | :--- |
| 🚀 **Live Web App Demo** | [https://mostuf25563.github.io/subtitle-sync/](https://mostuf25563.github.io/subtitle-sync/) | Production React SPA demo running on GitHub Pages |
| 📊 **Mochawesome Test Report** | [**Open Mochawesome Report**](https://mostuf25563.github.io/subtitle-sync/mochawesome.html) | Mochawesome HTML E2E test report |
| 🎭 **Playwright Test Report** | [**Open Playwright Report**](https://mostuf25563.github.io/subtitle-sync/playwright/index.html) | Playwright HTML test report |
| 📱 **Android Emulator Report** | [**Open Android Emulator Report**](https://mostuf25563.github.io/subtitle-sync/android-emulator-report.html) | Android Emulator verification report |
| 📸 **Android Emulator Screenshot** | [**View Latest Emulator Screenshot**](https://mostuf25563.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png) | Latest full-resolution emulator screenshot |
| 🎬 **Android Emulator Screencast Video**               | ⚠️ [**Broken Link / Missing Asset (HTTP 404)**](https://mostuf25563.github.io/subtitle-sync/android-emulator-report.html) | Screencast video (android-emulator-video.mp4 returned HTTP 404 on GitHub Pages). Run [emulation.yml](https://github.com/mostuf25563/subtitle-sync/actions/workflows/emulation.yml) to record and deploy. |

---

## 📱 Live Android Emulator Verification Report

- **Core Tested Feature**: The application can be shared a YouTube video via Android native intents (`ACTION_VIEW` for browser URLs and `ACTION_SEND` for YouTube app shares).
- **Interactive Report**: [Android Emulator Report](https://mostuf25563.github.io/subtitle-sync/android-emulator-report.html)
- **UI Screen Capture**: [Screenshot Image](https://mostuf25563.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png)
- **Screencast Video**: 🎬 **Android Emulator Screencast Video**: [Download / Stream MP4 (6.41 MB)](https://mostuf25563.github.io/subtitle-sync/screenshots/android-emulator-video.mp4) (6,724,502 bytes / HTTP 404 fallback handling)

> **Notice on Quarantined Suites**: Legacy browser suites and secondary dashboard generators have been moved to [`quarentined/`](quarentined/) to keep active CI focused on authentic Android runtime verification.

---

## 🚀 Quick Install (Android APK)

Install directly to an attached Android device or running emulator using [`install-apk.sh`](install-apk.sh) or [`update.apk.sh`](update.apk.sh):

```bash
curl -sL https://raw.githubusercontent.com/mostuf25563/subtitle-sync/main/install-apk.sh | bash
```

Alternatively, run [`update.apk.sh`](update.apk.sh) directly to install or update the debug APK. All binary downloads and past version releases are available on the [Releases](https://github.com/mostuf25563/subtitle-sync/releases) page.

---

## 📚 Architectural & Technical Documentation

- [`AGENTS.md`](AGENTS.md) — Agent lifecycle, task management, git sync rules, and development standards.
- [`docs/tokens.md`](docs/tokens.md) — Mandatory token economy architecture and step staging protocol.
- [`docs/android.md`](docs/android.md) — Native Android shell, WebView bridge, and timedtext interception.
- [`docs/parser.md`](docs/parser.md) — Accumulative subtitle parser, cue timing, and punctuation rules.
- [`docs/self-verification.md`](docs/self-verification.md) — Automated self-verification suites and sanity check audits.
- [`docs/operations/ACTIONS.md`](docs/operations/ACTIONS.md) — CI/CD pipelines, README generation by GitHub Actions, and git sync exclusion.
- [`docs/files.md`](docs/files.md) — Complete repository file catalog and architecture inventory.
- [`docs/cache.md`](docs/cache.md) — Multi-tier subtitle caching and winner promotion mechanism.
- [`docs/youtube.md`](docs/youtube.md) — YouTube API integration, iframe lifecycle, and server deprecation.
- [`docs/server.md`](docs/server.md) — Express backend server architecture and static asset serving.
