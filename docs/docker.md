# Docker Test Runbook

Use Docker for Playwright E2E in Codespaces or hosts where browser system libraries are not installed. The repository wrapper is [docker/manage.sh](../docker/manage.sh); detailed runner behavior is documented in [Docker E2E](docker-e2e.md).

## Preflight

```bash
docker info --format '{{.ServerVersion}}'
./docker/manage.sh --help
```

If `docker info` fails, the daemon is unavailable; fix or enable the Docker service before retrying. Do not install browser OS packages into the Codespace just to run Playwright when the project Docker image is available.

## Common commands

```bash
./docker/manage.sh build
./docker/manage.sh e2e web
./docker/manage.sh e2e emulation
./docker/manage.sh e2e all
./docker/manage.sh e2e web --grep 'state-machine action logs' --retries=0
```

The wrapper builds the project-pinned Playwright image, runs the matching npm E2E script, and writes ignored artifacts under `docker/artifacts/`. `emulation` is a browser device profile, not an Android emulator.

## Recorded Docker trial: 2026-10-26

- Docker server `29.8.0-1` was available.
- The focused diagnostics test passed in `mcr.microsoft.com/playwright:v1.64.1-noble` with host networking and the workspace mounted into the container:

```bash
docker run --rm --network host \
  -v "$PWD:/workspaces/subtitle-sync" \
  -w /workspaces/subtitle-sync \
  mcr.microsoft.com/playwright:v1.64.1-noble \
  npx playwright test e2e/web.spec.ts --project=web -g "state-machine action logs"
```

- Result: 1 test passed, including opening the Actions panel and reading the copied clipboard report. The direct command confirmed the cause was host Chromium's missing system libraries, not the application. Prefer `./docker/manage.sh` for routine runs; the direct command is a recorded diagnostic fallback.
- Keep the Playwright image version aligned with `@playwright/test` and the Dockerfile. After changing Playwright dependencies, rebuild with `./docker/manage.sh --no-cache build` before interpreting browser-version failures.

Do not run `./docker/manage.sh clean` unless you intend to delete the local Docker E2E artifacts and Compose resources.
