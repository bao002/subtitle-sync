# YouTube Subtitle & Speech Flow Viewer

[![Release APK](https://github.com/mostuf25561/subtitle-sync/actions/workflows/release-apk.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/release-apk.yml)
[![Web E2E](https://github.com/mostuf25561/subtitle-sync/actions/workflows/web.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/web.yml)
[![Android Emulation](https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml)
[![Deploy Demo](https://github.com/mostuf25561/subtitle-sync/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/deploy-demo.yml)
[![Integrity](https://github.com/mostuf25561/subtitle-sync/actions/workflows/integrity.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/integrity.yml)
[![Update README](https://github.com/mostuf25561/subtitle-sync/actions/workflows/update-readme.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/update-readme.yml)
[![Report Video Flow](https://github.com/mostuf25561/subtitle-sync/actions/workflows/report-video-flow.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/report-video-flow.yml)

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

## 📱 Live Android Emulator Verification Report

The application can be shared a YouTube video directly through Android share intents, auto-fetching timedtext caption tracks and streaming speech.

1. **Android Emulator Report**: [Open Android Emulator Report](https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html)
2. **Android Emulator Screencast Video**: ⚠️ [**Missing Asset / HTTP 404**](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-video.mp4) (screencast video missing from gh-pages branch — size: 0 bytes — see README CI status)
3. **Android Emulator Screenshot**: [View UI Capture](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png)

Secondary and legacy Cypress test suites are preserved under the [quarentined/](./quarentined/) directory.

## 🌐 GitHub Pages Links

| Artifact / Report | Link | Description |
| :--- | :--- | :--- |
| 🌐 **Live Web Demo** | [**Open Web Demo**](https://mostuf25561.github.io/subtitle-sync/) | Interactive web build running subtitle synchronization and TTS playback. |
| 🧪 **Mochawesome E2E Test Report** | [**Open Mochawesome Report**](https://mostuf25561.github.io/subtitle-sync/mochawesome.html) | HTML test execution report for automated E2E test runs. |
| 🎭 **Playwright E2E Test Report** | [**Open Playwright Report**](https://mostuf25561.github.io/subtitle-sync/playwright/index.html) | Comprehensive Playwright test report with traces, video, and snapshots. |
| 📱 **Android Emulator E2E Report** | [**Open Android Emulator Report**](https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html) | Authentic Android device & emulator execution report on API 34. |
| 📸 **Android Emulator Screenshot** | [**View Latest Emulator Screenshot**](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png) | High-resolution capture of application running on Android Emulator. |
| 🎬 **Android Emulator Screencast Video**               | ⚠️ [**Broken Link / Missing Asset (HTTP 404)**](https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html) | Screencast video (android-emulator-video.mp4 returned HTTP 404 on GitHub Pages). Run [emulation.yml](https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml) to record and deploy. |

## 📲 Installation via CLI

Install or update the latest Android APK release directly to your connected device or emulator via:

```bash
curl -sSL https://raw.githubusercontent.com/mostuf25561/subtitle-sync/main/update.apk.sh | bash
```

Or execute locally:
```bash
./update.apk.sh
```

You can also browse all APK releases directly on [GitHub Releases](https://github.com/mostuf25561/subtitle-sync/releases).


## 📚 Architectural Documentation Contracts

| Contract | Document | Scope |
| :--- | :--- | :--- |
| Actions Operational Standards | [docs/operations/ACTIONS.md](./docs/operations/ACTIONS.md) | GitHub Actions CI/CD workflows and synchronization |
| Library Specification | [docs/specifications/LIBRARY.md](./docs/specifications/LIBRARY.md) | Multi-video library and persistent storage |
| Subtitle Views Design | [docs/designs/DESIGN_SUBTITLE_VIEWS.md](./docs/designs/DESIGN_SUBTITLE_VIEWS.md) | Synchronized subtitle table & highlight UI |
| Languages View Design | [docs/designs/DESIGN_VIEW_LANGS.md](./docs/designs/DESIGN_VIEW_LANGS.md) | Multi-language selection and dynamic toggle |
| Controls View Design | [docs/designs/DESIGN_CONTROLS_VIEW.md](./docs/designs/DESIGN_CONTROLS_VIEW.md) | Playback controls and floating pause |
| Player Provider Architecture | [docs/designs/DESIGN_PLAYER_PROVIDER.md](./docs/designs/DESIGN_PLAYER_PROVIDER.md) | Independent YouTube iframe coordination |
| State Coordinator Design | [docs/designs/DESIGN_STATE_COORDINATOR.md](./docs/designs/DESIGN_STATE_COORDINATOR.md) | Cross-component reactive state synchronization |
| TimedText Schema Specification | [docs/specifications/SCHEMA_TIMEDTEXT.md](./docs/specifications/SCHEMA_TIMEDTEXT.md) | YouTube TimedText JSON3 schema contracts |
| Debug Operations Protocol | [docs/operations/DEBUG.md](./docs/operations/DEBUG.md) | Telemetry, log buffers, and diagnostics |

## 📖 Additional Architecture & Operations Documentation

- [Reliable Subtitles Fetching](./docs/reliable-subtitles-fetching.md): Fetch modes, fallback hierarchy, anti-bot mechanisms.
- [Caption Parser Specifications](./docs/parser.md): TimedText JSON3 parser specifications, syntax validation, timing rules.
- [Self-Verification Protocol](./docs/self-verification.md): Automated verification checklist, E2E test commands, report links.
- [Android Shell & E2E Testing](./docs/android.md): Android WebView architecture, native timedtext interception, OkHttp proxy.
- [Android Emulator E2E Guide](./docs/e2e-android.md): Device settings, About Phone navigation, milestone screenshot capture.
- [Token Economy Architecture](./docs/tokens.md): Task decomposition protocol, staging rules, and atomic execution.
- [Repository File Inventory](./docs/files.md): Documented directory map and file responsibilities.
- [YouTube Integration Guidelines](./docs/youtube.md): YouTube iframe player parameters, caption events, and rate-limiting.
- [Auto-Retry Protocol](./docs/auto-retry.md): Resilient retry delays, network jitter, backoff strategy.
- [Cache Architecture](./docs/cache.md): Memory and persistent subtitle cache, eviction rules.
- [Active Tasks Backlog](./docs/tasks.md): Pending and upcoming tasks.
- [Todo Active Mirror](./docs/todo.md): Current staged sub-task.
- [Completed Tasks Archive](./docs/done.md): Historical log of completed and verified tasks.
- [Versioning Guidelines](./docs/versioning.md): Multi-file version bump standards.
- [Agent Operating Instructions](./AGENTS.md): Development lifecycle and quality gates.
