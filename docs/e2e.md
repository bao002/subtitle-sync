# End-to-End Test Runbook

This page selects the right validation layer and records outcomes that help avoid repeating known environment failures. Follow [Codespaces](codespace.md), [Docker](docker.md), [Docker E2E](docker-e2e.md), and [Android E2E](e2e-android.md) for runtime-specific details.

## Test selection

| Scope | Command | What it verifies |
| --- | --- | --- |
| Focused action-log behavior | `npm run test:state-machine-action-logs` | Timestamped actions, errors, and copy-all report contents. |
| Focused browser interaction | `./docker/manage.sh e2e web --grep 'state-machine action logs' --retries=0` | Opens the diagnostics view and checks clipboard copy/read-back in a real browser. |
| Web browser suite | `./docker/manage.sh e2e web` | Web workflows in the official Playwright browser container. |
| Browser emulation suite | `./docker/manage.sh e2e emulation` | Mobile viewport/browser behavior; does not exercise Android OS or native shell. |
| Android runtime | `bash android-shell/gradlew assembleDebug && bash scripts/run-android-e2e.sh && bash scripts/android-e2e-assert.sh` | Native shell/WebView behavior on a configured API 34 emulator or device. |
| Build and lint | `npm run build && npm run lint` | Production compilation and repository lint gate. |

## Trial record: 2026-10-26

- The action-log Playwright test passed in the official Playwright `1.64.1` Noble container. It opened the panel, copied the report, read it back from the clipboard, and closed the panel.
- Running that same test directly on the Codespace host first failed because no Playwright browser executable was installed. After `npx playwright install chromium`, launch failed on missing OS shared libraries such as `libatk-1.0.so.0`. The successful resolution was to run the test in the matching Playwright Docker image; see [Docker runs](docker.md). Do not diagnose this as an app failure or repeat Chromium downloads as the remedy.
- Android E2E was not run in this Codespace because `adb` was unavailable. Do not treat the browser `emulation` project as Android runtime validation.

For authentic shared-subtitle E2E, use a fresh signed timedtext URL only at runtime, follow [Docker E2E](docker-e2e.md), and do not store the signed URL in the repository or artifacts. For emulator telemetry, video recording, and Android assertion requirements, follow [Android E2E](e2e-android.md).
