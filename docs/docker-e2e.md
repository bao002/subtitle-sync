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

The shared-link playback E2E uses mocked timedtext/translation responses, a
simulated YouTube player, and simulated speech synthesis so playback and
Hebrew/Italian overlay alternation remain deterministic. Its recording shows an
illustrative scene clearly labelled as simulated; it is not footage of the
actual YouTube video.

The web suite starts Vite inside the container. The emulation suite runs the
Playwright emulation project; it does not require a physical Android device.

To run the web suite against a deployed site instead of the container's local
Vite server:

```bash
PLAYWRIGHT_BASE_URL=https://example.com/app/ ./docker/manage.sh e2e web
```

The shared-subtitle playback test uses a sanitized test URL by default. To pass
an unexpired timedtext URL for a specific scenario without saving its signed
parameters in the repository, provide it only in the local command environment:

```bash
E2E_SHARED_SUBTITLES_URL='https://www.youtube.com/api/timedtext?...' ./docker/manage.sh e2e web --grep 'shared subtitles link'
```

The E2E intercepts YouTube timedtext and translation responses locally, so the
test validates share-link hydration, language selection, and playback behavior
without sending the signed URL to YouTube.

`./docker/manage.sh build` only builds the image. `./docker/manage.sh shell`
opens a shell in it, and `./docker/manage.sh clean` removes local Docker test
artifacts and Compose resources.
