

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
- **Run URL**: https://github.com/ofershaham1-cyber/subtitle-sync/actions/runs/38666204546

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
