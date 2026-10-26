# Codespaces Runbook

Use this page for environment checks and Codespaces-specific limits. See [Docker runs](docker.md) for the browser container workflow and [E2E test matrix](e2e.md) for suite selection.

## Quick environment check

From the repository root:

```bash
node --version
npm --version
docker info --format '{{.ServerVersion}}'
command -v adb || printf 'adb unavailable\n'
```

Start the app locally with `npm run dev`; Vite serves `http://localhost:3000/` by default. For the developer diagnostics view, use `http://localhost:3000/?debug=true`.

## Recorded Codespaces trial: 2026-10-26

- Node reported `v24.21.0`, Playwright reported `1.64.1`, and Docker reported server `29.8.0-1`.
- `adb` was not installed, so Android device/emulator E2E could not run here. Run that validation on a host with Android SDK, `adb`, JDK 21, and an API 34 Google APIs emulator, following [Android E2E](e2e-android.md).
- A direct host Playwright run initially failed because the Playwright Chromium executable was absent. `npx playwright install chromium` downloaded it, but Chromium then failed to start because the container lacked system libraries including `libatk-1.0.so.0`, `libatk-bridge-2.0.so.0`, `libgbm.so.1`, and `libasound.so.2`.
- The Codespace user was UID 1000. Do not repeat a host-browser install and assume that fixes runtime dependencies; use the repository's Docker runner instead. The same focused browser test passed in the official Playwright container; see [Docker runs](docker.md).

Keep signed subtitle URLs and credentials out of commands saved in docs, terminal transcripts, and source control. Provide secret/runtime-only values through environment variables when running the relevant test.
