# Subtitle Sync

[![Build & Release Android APK](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/release-apk.yml/badge.svg)](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/release-apk.yml)
[![Web E2E Tests](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/web.yml/badge.svg)](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/web.yml)
[![Android Emulator E2E Tests](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/emulation.yml/badge.svg)](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/emulation.yml)
[![Publish Web Demo to GitHub Pages](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/deploy-demo.yml)
[![Report Integrity Verification](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/integrity.yml/badge.svg)](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/integrity.yml)
[![Update README Links & Status](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/update-readme.yml/badge.svg)](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/update-readme.yml)
[![Android Emulator Screencast & Report Video Flow](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/report-video-flow.yml/badge.svg)](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/report-video-flow.yml)

A high-performance YouTube subtitle synchronizer, multi-language parallel viewer, and language learning player with synchronized WebSpeech TTS narration, interactive Video Playground, and authentic Android native timedtext interception.

<!-- CI_STATUS_INDICATOR_START -->
## 🚨 Latest CI Build & Test Status: FAILED

> ⚠️ **Automated Failure / Broken Links Detected**: `Android Emulator Screencast & Report Video Flow` (1 broken link found)
>
> If screencasts, logs, or reports are missing, copy the diagnostic block below and paste it directly into your AI Assistant prompt to reproduce and resolve the failure immediately:

```markdown
# AI FIX PROMPT: CI Failure in Android Emulator Screencast & Report Video Flow
- **Repository**: ofershaham1-cyber/subtitle-sync
- **Workflow / Checker**: Android Emulator Screencast & Report Video Flow
- **Failing Step**: Broken Video Link Detection in android-emulator-report.html
- **Report URL**: https://ofershaham1-cyber.github.io/subtitle-sync/android-emulator-report.html
- **Run URL**: https://github.com/ofershaham1-cyber/subtitle-sync/actions/runs/38667838720

### Failure Log & Diagnosis:
Report at android-emulator-report.html contains broken video link (screencast video missing or HTTP 404).

### 🔗 Broken Links Detected:
- `[Report Screencast Video: android-emulator-video.mp4](https://ofershaham1-cyber.github.io/subtitle-sync/screenshots/android-emulator-video.mp4)` -> HTTP 404 on GitHub Pages (Report at https://ofershaham1-cyber.github.io/subtitle-sync/android-emulator-report.html has broken video source; android-emulator-video.mp4 returned HTTP 404) (`public/android-emulator-report.html -> <video controls> (screencast video missing / 404)`)

### Instructions for AI Assistant:
1. Examine the root cause, broken link(s), and diagnostic details above.
2. If the screencast video link returned 404 in android-emulator-report.html, trigger the 'Android Emulator E2E Tests' workflow (emulation.yml) to record and publish android-emulator-video.mp4 to GitHub Pages.
3. Fix broken target paths, restore missing files, or fix failing application code with targeted edits.
4. Verify that `npm run test:readme-links` and all automated test suites pass cleanly.
```
<!-- CI_STATUS_INDICATOR_END -->

---

## 🌐 GitHub Pages Links

| Resource | Direct Link | Description |
| :--- | :--- | :--- |
| 📊 **Mochawesome Test Report** | [**Open Mochawesome Report**](https://ofershaham1-cyber.github.io/subtitle-sync/mochawesome.html) | Cypress E2E test execution report with granular test breakdowns. |
| 🎭 **Playwright Test Report** | [**Open Playwright Report**](https://ofershaham1-cyber.github.io/subtitle-sync/playwright/index.html) | Playwright web and mobile emulation E2E suite report. |
| 📱 **Android Emulator Report** | [**Open Android Emulator Report**](https://ofershaham1-cyber.github.io/subtitle-sync/android-emulator-report.html) | Full system telemetry, milestone flow cards, and live logcat audit. |
| 📸 **Android Emulator Screenshot** | [**View Latest Emulator Screenshot**](https://ofershaham1-cyber.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png) | High-resolution capture of authentic Android emulator test runtime. |
| 🎬 **Android Emulator Screencast Video**               | ⚠️ [**Broken Link / Missing Asset (HTTP 404)**](https://ofershaham1-cyber.github.io/subtitle-sync/android-emulator-report.html) | Screencast video (android-emulator-video.mp4 returned HTTP 404 on GitHub Pages). Run [emulation.yml](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/emulation.yml) to record and deploy. |

---

## 📱 Live Android Emulator Verification Report

The Android E2E suite verifies genuine application execution without fixtures on Android 14 API 34:
1. **Device Telemetry**: Verified on real emulator runtimes via `scripts/run-android-e2e.sh` and `scripts/android-e2e-assert.sh`.
2. **Android Emulator Screencast Video**: ⚠️ [**Missing Asset / HTTP 404**](https://ofershaham1-cyber.github.io/subtitle-sync/screenshots/android-emulator-video.mp4) (screencast video missing from gh-pages branch — size: 0 bytes — see README CI status).
3. **CI Workflows**: Real-time CI workflows tracked via [.github/workflows/web.yml](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/web.yml) and [.github/workflows/emulation.yml](https://github.com/ofershaham1-cyber/subtitle-sync/actions/workflows/emulation.yml).
4. **Quarantine Reference**: Cypress emulator suite quarantined at [quarentined/cypress/e2e/emulation.cy.ts](./quarentined/cypress/e2e/emulation.cy.ts).

---

## 🛠️ CLI APK Installation & Update

Install and update the Android application directly on connected devices or emulators using provided shell scripts:
- **Direct Installation**: [`./install-apk.sh`](./install-apk.sh) installs the debug APK via ADB.
- **In-Place Update**: [`./update.apk.sh`](./update.apk.sh) updates to the latest release build.

---

## 📚 Architectural Documentation Contracts

The core architectural contracts, design specifications, and operational manuals are maintained under `docs/`:

1. [Actions & CI Operations](./docs/operations/ACTIONS.md) - Workflows, GitHub Pages reports, artifact retention, and zero-cron policy.
2. [Subtitle Library Specification](./docs/specifications/LIBRARY.md) - Local catalog, storage schemas, and video metadata contracts.
3. [Subtitle Views Architecture](./docs/designs/DESIGN_SUBTITLE_VIEWS.md) - Parallel multi-language grid, highlight rendering, and virtual scrolling.
4. [Language Selection Architecture](./docs/designs/DESIGN_VIEW_LANGS.md) - Dual track toggles, favorite languages defaults, and translation modes.
5. [Controls View Design](./docs/designs/DESIGN_CONTROLS_VIEW.md) - Navigation bar, playback controls, speed selector, and timestamp handoff.
6. [Player Provider Architecture](./docs/designs/DESIGN_PLAYER_PROVIDER.md) - Dual player abstraction, YouTube iframe messaging, and state synchronization.
7. [State Coordinator Design](./docs/designs/DESIGN_STATE_COORDINATOR.md) - Reactive synchronization between video playback, speech synthesis, and cue scroll.
8. [Timedtext Schema Specification](./docs/specifications/SCHEMA_TIMEDTEXT.md) - YouTube json3 schema, cue parser, and validation criteria.
9. [Debug Operations Manual](./docs/operations/DEBUG.md) - Telemetry logging, raw JSON export, and diagnostics.
