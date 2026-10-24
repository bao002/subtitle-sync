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

The web suite starts Vite inside the container. The emulation suite runs the
Playwright emulation project; it does not require a physical Android device.

To run the web suite against a deployed site instead of the container's local
Vite server:

```bash
PLAYWRIGHT_BASE_URL=https://example.com/app/ ./docker/manage.sh e2e web
```

`./docker/manage.sh build` only builds the image. `./docker/manage.sh shell`
opens a shell in it, and `./docker/manage.sh clean` removes local Docker test
artifacts and Compose resources.
