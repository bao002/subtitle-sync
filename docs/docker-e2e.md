# Docker E2E runner

Run Playwright E2E tests in the official Playwright container with the browser
version pinned to the project's `@playwright/test` dependency. The container
installs exact dependencies from `package-lock.json` and writes reports to
`docker/artifacts/`, which is ignored by Git.

From the project root:

```bash
./docker/manage.sh e2e web
./docker/manage.sh e2e emulation
./docker/manage.sh e2e all
```

Video recording is off by default. To capture Playwright screencasts in
`docker/artifacts/test-results/`, set `PLAYWRIGHT_VIDEO=on` for a run:

```bash
PLAYWRIGHT_VIDEO=on ./docker/manage.sh e2e web --grep 'shared subtitles link' --retries=0
```

The shared-link playback E2E uses the real YouTube player, timedtext response,
and on-demand translation service. It requires an unexpired timedtext URL from
`E2E_SHARED_SUBTITLES_URL`; without that environment variable, this one test is
skipped. Use host networking when the Docker bridge has no external DNS/network:

```bash
E2E_NETWORK_MODE=host E2E_SHARED_SUBTITLES_URL='https://www.youtube.com/api/timedtext?...' PLAYWRIGHT_VIDEO=on ./docker/manage.sh e2e web --grep 'shared subtitles link' --retries=0
```

The test removes signed subtitle parameters from browser history immediately
after app startup. Keep the URL out of source control, screenshots, and logs.
The emulation suite runs the Playwright emulation project; it does not require
a physical Android device.

To run the web suite against a deployed site instead of the container's local
Vite server:

```bash
PLAYWRIGHT_BASE_URL=https://example.com/app/ ./docker/manage.sh e2e web
```

`./docker/manage.sh build` only builds the image. `./docker/manage.sh shell`
opens a shell in it, and `./docker/manage.sh clean` removes local Docker test
artifacts and Compose resources.
