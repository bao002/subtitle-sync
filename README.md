# Subtitle Sync

[![Release APK](https://github.com/mostuf25561/subtitle-sync/actions/workflows/release-apk.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/release-apk.yml)
[![Web Tests](https://github.com/mostuf25561/subtitle-sync/actions/workflows/web.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/web.yml)
[![Android Emulation](https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml)
[![Deploy Demo](https://github.com/mostuf25561/subtitle-sync/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/deploy-demo.yml)
[![Report Video Flow](https://github.com/mostuf25561/subtitle-sync/actions/workflows/report-video-flow.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/report-video-flow.yml)
[![Report Integrity](https://github.com/mostuf25561/subtitle-sync/actions/workflows/integrity.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/integrity.yml)

<!-- CI_STATUS_INDICATOR_START -->
## 🚨 Latest CI Build & Test Status: FAILED

> ⚠️ **Automated Failure / Broken Links Detected**: `Android Emulator Screencast & Report Video Flow` (1 broken link found)
>
> If screencasts, logs, or reports are missing, copy the diagnostic block below and paste it directly into your AI Assistant prompt to reproduce and resolve the failure immediately:

```markdown
# AI FIX PROMPT: CI Failure in Android Emulator Screencast & Report Video Flow
- **Repository**: mostuf25561/subtitle-sync
- **Workflow / Checker**: Android Emulator Screencast & Report Video Flow
- **Failing Step**: Broken Video Link Detection in android-emulator-report.html
- **Report URL**: https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html
- **Run URL**: https://github.com/mostuf25561/subtitle-sync/actions/workflows/report-video-flow.yml

### Failure Log & Diagnosis:
Report at android-emulator-report.html contains broken video link (screencast video missing or HTTP 404).

### 🔗 Broken Links Detected:
- `[Report Screencast Video: android-emulator-video.mp4](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-video.mp4)` -> HTTP 404 on GitHub Pages (Report at https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html has broken video source; android-emulator-video.mp4 returned HTTP 404) (`public/android-emulator-report.html -> <video controls> (screencast video missing / 404)`)

### Instructions for AI Assistant:
1. Examine the root cause, broken link(s), and diagnostic details above.
2. If the screencast video link returned 404 in android-emulator-report.html, trigger the 'Android Emulator E2E Tests' workflow (emulation.yml) to record and publish android-emulator-video.mp4 to GitHub Pages.
3. Fix broken target paths, restore missing files, or fix failing application code with targeted edits.
4. Verify that `npm run test:readme-links` and all automated test suites pass cleanly.
```
<!-- CI_STATUS_INDICATOR_END -->

---

## 📱 Live Android Emulator Verification Report

Automated End-to-End (E2E) testing executes on Android 14 (API 34) Google APIs emulators to validate WebView runtime execution, native caption interception, and video playback.

| Artifact | Link | Description |
| :--- | :--- | :--- |
| 📊 **Android Emulator Report** | [**Open Android Emulator Report**](https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html) | Interactive telemetry report and step-by-step verification milestones. |
| 📸 **Android Emulator Screenshot** | [**View Latest Emulator Screenshot**](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png) | High-resolution capture from the Android emulator run. |
| 🎬 **Android Emulator Screencast Video**               | ⚠️ [**Broken Link / Missing Asset (HTTP 404)**](https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html) | Screencast video (android-emulator-video.mp4 returned HTTP 404 on GitHub Pages). Run [emulation.yml](https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml) to record and deploy. |

### Verification Milestones & Media

1. **Android Emulator Screenshot**: [View Latest Emulator Screenshot](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png)
2. **Android Emulator Screencast Video**: ⚠️ [**Missing Asset / HTTP 404**](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-video.mp4) (screencast video missing from gh-pages branch — size: 0 bytes — see README CI status)

---

## 🌐 GitHub Pages Links

All test dashboards, interactive web demonstrations, and E2E execution reports are published to GitHub Pages:

- **Web Demo**: [https://mostuf25561.github.io/subtitle-sync/](https://mostuf25561.github.io/subtitle-sync/)
- **Mochawesome Report**: [**Open Mochawesome Report**](https://mostuf25561.github.io/subtitle-sync/mochawesome.html)
- **Playwright Report**: [**Open Playwright Report**](https://mostuf25561.github.io/subtitle-sync/playwright/index.html)
- **Android Emulator Report**: [**Open Android Emulator Report**](https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html)
- **Screenshot Asset**: [**View Latest Emulator Screenshot**](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png)
- **Screencast Video**: [**View/Download MP4 Screencast (6.41 MB)**](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-video.mp4)

---

## ⚡ Quick Start & Android CLI Installation

Install or update the Android APK directly on a connected device or emulator:

```bash
# One-line download and installation via update.apk.sh
curl -sSL https://raw.githubusercontent.com/mostuf25561/subtitle-sync/main/update.apk.sh | bash
```

Alternatively, install using `adb` directly:

```bash
adb install -r android-shell/app/build/outputs/apk/release/app-release.apk
```

For all releases and APK download artifacts, visit [All Releases](https://github.com/mostuf2556/subtitle-sync/releases).

---

## 📚 Architectural Documentation & Design Contracts

This repository maintains strict specifications and design contracts governed by zero-duplicate policies under `docs/`:

### Core Documentation Contracts
- [`docs/operations/ACTIONS.md`](./docs/operations/ACTIONS.md) — CI/CD pipelines, status badges, and automated reporting.
- [`docs/specifications/LIBRARY.md`](./docs/specifications/LIBRARY.md) — Local fixture library specifications.
- [`docs/designs/DESIGN_SUBTITLE_VIEWS.md`](./docs/designs/DESIGN_SUBTITLE_VIEWS.md) — Subtitle presentation view contracts.
- [`docs/designs/DESIGN_VIEW_LANGS.md`](./docs/designs/DESIGN_VIEW_LANGS.md) — Language selection component contracts.
- [`docs/designs/DESIGN_CONTROLS_VIEW.md`](./docs/designs/DESIGN_CONTROLS_VIEW.md) — Playback transport and control view contracts.
- [`docs/designs/DESIGN_PLAYER_PROVIDER.md`](./docs/designs/DESIGN_PLAYER_PROVIDER.md) — Vendor-agnostic media player abstraction contracts.
- [`docs/designs/DESIGN_STATE_COORDINATOR.md`](./docs/designs/DESIGN_STATE_COORDINATOR.md) — State machine and timing coordination contracts.
- [`docs/specifications/SCHEMA_TIMEDTEXT.md`](./docs/specifications/SCHEMA_TIMEDTEXT.md) — YouTube JSON3 TimedText schema specifications.
- [`docs/operations/DEBUG.md`](./docs/operations/DEBUG.md) — Diagnostic runbook, logging buffer, and network tracking.

### Additional Specifications
- [`docs/tokens.md`](./docs/tokens.md) — Token economy flow and prompt decomposition protocol.
- [`docs/android.md`](./docs/android.md) — Android architecture and E2E emulation runbook.
- [`docs/parser.md`](./docs/parser.md) — Millisecond subtitle parsing, timing math, and punctuation splitting.
- [`docs/self-verification.md`](./docs/self-verification.md) — Self-verification protocol and sanity audit suite.
- [`docs/reliable-subtitles-fetching.md`](./docs/reliable-subtitles-fetching.md) — Subtitle fetching fallback order, session vs link modes.
- [`docs/cache.md`](./docs/cache.md) — Multi-tier subtitle caching and validation gates.
- [`docs/auto-retry.md`](./docs/auto-retry.md) — Anti-bot pacing, retry backoff, and serialization.
- [`docs/files.md`](./docs/files.md) — Master codebase inventory catalog.
