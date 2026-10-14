# Parallel Subtitles (subtitle-sync)

[![Release APK](https://github.com/mostuf25561/subtitle-sync/actions/workflows/release-apk.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/release-apk.yml)
[![Web E2E](https://github.com/mostuf25561/subtitle-sync/actions/workflows/web.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/web.yml)
[![Android Emulation](https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml)
[![Deploy Demo](https://github.com/mostuf25561/subtitle-sync/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/mostuf25561/subtitle-sync/actions/workflows/deploy-demo.yml)
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
- **Run URL**: https://github.com/mostuf25561/subtitle-sync/actions/runs/38645152494

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

1. **Android Emulator E2E Report**: [Verified (Android 14 API 34)](https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html)
2. **Android Emulator Screencast Video**: [Download `android-emulator-video.mp4`](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-video.mp4) (6.41 MB MP4 recording)
3. **Android Emulator Screenshot**: [View UI Capture](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png)

- **Web Live Demo**: [https://mostuf25561.github.io/subtitle-sync/](https://mostuf25561.github.io/subtitle-sync/)
- **Android Emulator E2E Report**: [https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html](https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html)
- **Mochawesome Test Dashboard**: [https://mostuf25561.github.io/subtitle-sync/mochawesome.html](https://mostuf25561.github.io/subtitle-sync/mochawesome.html)
- **Playwright Test Report**: [https://mostuf25561.github.io/subtitle-sync/playwright/index.html](https://mostuf25561.github.io/subtitle-sync/playwright/index.html)
- **Primary Screen Capture**: [View Screenshot](https://mostuf25561.github.io/subtitle-sync/screenshots/android-emulator-screenshot.png)

## 📥 Installation & CLI Update

To install or update the Android APK via ADB CLI:

```bash
curl -sSL https://raw.githubusercontent.com/mostuf25561/subtitle-sync/main/update.apk.sh | bash
```

See [update.apk.sh](update.apk.sh) for options and ADB commands.

## 📚 Architectural Documentation Contracts

- [GitHub Actions Workflows & CI/CD Pipelines](docs/operations/ACTIONS.md)
- [Video Library & Management](docs/specifications/LIBRARY.md)
- [Subtitle Views Architecture](docs/designs/DESIGN_SUBTITLE_VIEWS.md)
- [Languages View Architecture](docs/designs/DESIGN_VIEW_LANGS.md)
- [Playback & Controls Architecture](docs/designs/DESIGN_CONTROLS_VIEW.md)
- [Player Provider Architecture](docs/designs/DESIGN_PLAYER_PROVIDER.md)
- [State Coordinator Architecture](docs/designs/DESIGN_STATE_COORDINATOR.md)
- [TimedText Schema Specification](docs/specifications/SCHEMA_TIMEDTEXT.md)
- [Debugging & Diagnostics Guide](docs/operations/DEBUG.md)
- [Reliable Subtitles Fetching Guide](docs/reliable-subtitles-fetching.md)
- [Android Architecture Specification](docs/android.md)
- [Android Emulator E2E Protocol](docs/e2e-android.md)
- [File Inventory & Directory Structure](docs/files.md)
- [Self-Verification Protocol & Quality Gate](docs/self-verification.md)
