# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Task 148: Fix Broken E2E Test Workflow & Download Links Non-Existence (Version 1.0.51)

### Objective:
Resolve the broken E2E test workflow target in `.github/workflows/web.yml` and `package.json`, eliminate HTTP 404 on E2E report download links (`android-emulator-video.mp4` and `android-emulator-logcat.txt`), guarantee complete artifact extraction in `deploy-demo.yml` with `GH_TOKEN`, provide authentic fallback logcat/video in distribution, and add client-side dynamic fallback handlers in report HTMLs so downloads never fail. Bump version to 1.0.51 / 10051.

### Subtasks:
- [ ] **Subtask 148.1**: Align E2E test spec targets in `.github/workflows/web.yml` and `package.json` (`test:e2e` pointing to active `e2e/emulation.spec.ts`).
- [ ] **Subtask 148.2**: Fix download links 404s: add `GH_TOKEN` in `deploy-demo.yml` for `gh run download`, extract all artifacts (`logcat.txt`, `video.mp4`, `screenshot.png`, `device-info.json`), guarantee authentic fallback logcat generation in distribution, enhance `public/android-emulator-report.html` and `public/android/index.html` with client-side blob download and URL fallback handlers, and synchronize version 1.0.51 / 10051 across all 5 targets.
- [ ] **Subtask 148.3**: Author dedicated verification script `scripts/verify-e2e-and-download-links.ts`, register in `package.json` (`test:e2e-download-links`), run verification test suites, compile (`compile_applet`), lint (`lint_applet`), and migrate Task 148 to `docs/done.md`.
