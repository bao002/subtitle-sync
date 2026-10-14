# YouTube Subtitle & Speech Flow Viewer

[![Build & Release Android APK](https://github.com/mostuf2556/subtitle-sync/actions/workflows/release-apk.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/release-apk.yml)
[![Web E2E Tests](https://github.com/mostuf2556/subtitle-sync/actions/workflows/web.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/web.yml)
[![Android Emulator E2E Tests](https://github.com/mostuf2556/subtitle-sync/actions/workflows/emulation.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/emulation.yml)
[![Deploy GitHub Pages & Demo](https://github.com/mostuf2556/subtitle-sync/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/deploy-demo.yml)
[![Repository Integrity & Link Verification](https://github.com/mostuf2556/subtitle-sync/actions/workflows/integrity.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/integrity.yml)
[![Report Video Flow & Screencast Integrity](https://github.com/mostuf2556/subtitle-sync/actions/workflows/report-video-flow.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/report-video-flow.yml)
[![Automated Error Reporting](https://github.com/mostuf2556/subtitle-sync/actions/workflows/error-reporting.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/error-reporting.yml)
[![Update README Metadata](https://github.com/mostuf2556/subtitle-sync/actions/workflows/update-readme.yml/badge.svg)](https://github.com/mostuf2556/subtitle-sync/actions/workflows/update-readme.yml)

<!-- CI_STATUS_INDICATOR_START -->

## 🚦 Latest CI Build & Test Status: ALL VERIFIED

- **Android Emulator E2E Tests**: [Verified (Android 14 API 34)](https://mostuf2556.github.io/subtitle-sync/android-emulator-report.html)
- **Android Emulator Screencast Video**: [Download MP4 (6.41 MB)](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-video.mp4)
- **Screenshot Image**: [View UI Capture](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png)
- **Workflow Runs**: [GitHub Actions Dashboard](https://github.com/mostuf2556/subtitle-sync/actions)

<!-- CI_STATUS_INDICATOR_END -->

---

## 🚀 One-Line Android Installation (ADB CLI)

Install and launch the latest YouTube Subtitle Viewer Android build directly onto any connected Android emulator or physical device with one command:

```bash
curl -sSL https://raw.githubusercontent.com/mostuf2556/subtitle-sync/main/update.apk.sh | bash
```

### What this command does:

1. **Locates ADB**: Automatically detects `adb` across Windows (Git Bash / MSYS2 / CMD), macOS, and Linux.
2. **Downloads APK**: Streams the latest debug APK from the GitHub release to the local downloads folder.
3. **Installs onto Device**: Executes `adb install -r -d -t` targeting package `com.ytviewer.app` with proper Android permissions.
4. **Launches App**: Starts `MainActivity` with authentic caption interception and local asset hosting.

---

## 🌐 GitHub Pages Links

Continuous integration deployments and reports on GitHub Pages:

- **Web Companion App**: [**Open Web Companion App**](https://mostuf2556.github.io/subtitle-sync/)
- **Mochawesome Report**: [**Open Mochawesome Report**](https://mostuf2556.github.io/subtitle-sync/mochawesome.html)
- **Playwright Report**: [**Open Playwright Report**](https://mostuf2556.github.io/subtitle-sync/playwright/index.html)
- **Android Emulator Report**: [**Open Android Emulator Report**](https://mostuf2556.github.io/subtitle-sync/android-emulator-report.html)
- **Emulator Screenshot**: [**View Latest Emulator Screenshot**](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png)
- **Emulator Screencast Video**: [**View/Download MP4 Screencast (6.41 MB)**](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-video.mp4)
- **Web CI Workflow**: [Web E2E Pipeline](https://github.com/mostuf2556/subtitle-sync/actions/workflows/web.yml)
- **Android CI Workflow**: [Android Emulation Pipeline](https://github.com/mostuf2556/subtitle-sync/actions/workflows/emulation.yml)

---

## 📱 Live Android Emulator Verification Report

All continuous integration runs validate authentic end-to-end functionality on Android 14 (API 34) Google APIs emulators:

| Artifact / Presentation Card             | Live Link                                                                                                                       | Description                                                                                                          |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------- |
| 🌐 **Live Web Demo Application**         | [**Open Web Companion App**](https://mostuf2556.github.io/subtitle-sync/)                                                       | Deployed production client SPA on GitHub Pages.                                                                      |
| 📊 **Android Emulator E2E Report**       | [**View Full Verification Report**](https://mostuf2556.github.io/subtitle-sync/android-emulator-report.html)                    | Complete hardware telemetry, execution badges, logs, and video.                                                      |
| 🧪 **Mochawesome Test Dashboard**        | [**View Mochawesome Report**](https://mostuf2556.github.io/subtitle-sync/cypress/reports/mochawesome.html)                      | Granular browser test specs, execution timings, and pass/fail cards.                                                 |
| 🎭 **Playwright E2E Report**             | [**View Playwright Report**](https://mostuf2556.github.io/subtitle-sync/playwright/)                                            | Multi-browser headless verification suites and traces.                                                               |
| 🎬 **Android Emulator Screencast Video** | [**View/Download MP4 Screencast (6.41 MB)**](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-video.mp4) | Full authentic screen recording from Android Emulator E2E run (API 34 Google APIs, size: 6,724,502 bytes / 6.41 MB). |
| 📸 **Android Emulator Screenshot**       | [**View Authentic Screenshot**](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png)         | High-resolution frame captured during native subtitle playback.                                                      |

### Key Verification Artifacts:

1. **Android Emulator Report**: [View `android-emulator-report.html`](https://mostuf2556.github.io/subtitle-sync/android-emulator-report.html)
2. **Android Emulator Screencast Video**: [Download `android-emulator-video.mp4`](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-video.mp4) (6.41 MB MP4 recording)
3. **Android Emulator Screenshot**: [View `android-emulator-screenshot.png`](https://mostuf2556.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png)
4. **Mochawesome E2E Dashboard**: [Open Mochawesome Report](https://mostuf2556.github.io/subtitle-sync/cypress/reports/mochawesome.html)
5. **Playwright Test Report**: [Open Playwright Report](https://mostuf2556.github.io/subtitle-sync/playwright/)

---

## 📚 Architectural Contracts & Documentation

Comprehensive system specifications, contracts, and operational guides:

| Document                                                                        | Path                                                                                                             | Scope |
| :------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------- | :---- |
| **[`ACTIONS.md`](./docs/operations/ACTIONS.md)**                                | CI/CD pipelines, automated testing, release packaging, and GitHub Pages deployment.                              |
| **[`LIBRARY.md`](./docs/specifications/LIBRARY.md)**                            | Video library specifications, storage persistence, and schema definitions.                                       |
| **[`DESIGN_SUBTITLE_VIEWS.md`](./docs/designs/DESIGN_SUBTITLE_VIEWS.md)**       | Architectural design for multi-language subtitle presentation views.                                             |
| **[`DESIGN_VIEW_LANGS.md`](./docs/designs/DESIGN_VIEW_LANGS.md)**               | Multi-track language selector and subtitle synchronization design.                                               |
| **[`DESIGN_CONTROLS_VIEW.md`](./docs/designs/DESIGN_CONTROLS_VIEW.md)**         | Playback control interface, auto-scroll, and speed coordination.                                                 |
| **[`DESIGN_PLAYER_PROVIDER.md`](./docs/designs/DESIGN_PLAYER_PROVIDER.md)**     | Embedded YouTube player bridge and event lifecycle management.                                                   |
| **[`DESIGN_STATE_COORDINATOR.md`](./docs/designs/DESIGN_STATE_COORDINATOR.md)** | Central reactive state orchestration between WebView and React SPA.                                              |
| **[`SCHEMA_TIMEDTEXT.md`](./docs/specifications/SCHEMA_TIMEDTEXT.md)**          | Timedtext payload schemas, JSON3 formatting, and cue structure.                                                  |
| **[`DEBUG.md`](./docs/operations/DEBUG.md)**                                    | Diagnostic log viewer, network interception, 200-char response preview, and AI troubleshooting prompt generator. |
| **[`tokens.md`](./docs/tokens.md)**                                             | Token economy flow, task decomposition protocol, and operational checklists.                                     |
| **[`android.md`](./docs/android.md)**                                           | Android shell architecture, WebView interception, and native bridge specs.                                       |
| **[`parser.md`](./docs/parser.md)**                                             | Accumulative subtitle parser, timing algorithms, and BiDi normalization.                                         |
| **[`self-verification.md`](./docs/self-verification.md)**                       | Verification matrices, sanity check protocols, and CI integrity standards.                                       |
| **[`reliable-subtitles-fetching.md`](./docs/reliable-subtitles-fetching.md)**   | Anti-bot fetch strategies, attempt order, pacing, and fallback rules.                                            |
| **[`files.md`](./docs/files.md)**                                               | Complete repository file inventory, responsibilities, and dependency graph.                                      |
| **[`e2e-android.md`](./docs/e2e-android.md)**                                   | Android emulator E2E testing methodology, milestone screenshots, and About Phone navigation.                     |

---
