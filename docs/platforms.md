# AI Studio Platform & E2E Testing Strategy (`docs/platforms.md`)

## 1. Executive Summary & Context

This document outlines the operational and architectural testing strategy within the Google AI Studio Build platform, detailing how to execute end-to-end (E2E) tests with maximum efficiency, zero wasted configuration, and minimal session setup effort.

---

## 2. Platform Architecture: Docker Support Analysis

### Short Answer: **Docker daemon is NOT supported inside AI Studio.**

### Technical Explanation

The AI Studio Build environment operates inside a secured, sandboxed Linux container microVM on Google Cloud infrastructure. Because this runtime is already an isolated container:

1. **No Docker Daemon (`dockerd`)**: There is no running Docker daemon or background container manager. Docker daemon is NOT supported in this sandbox.
2. **No Docker Socket (`/var/run/docker.sock`)**: Container creation socket privileges are restricted for multi-tenant cloud security.
3. **No Nested Virtualization / Privileged Mode**: The container cannot launch nested containers via `docker run` or `docker compose`.
4. Running `which docker` outputs `no docker binary`.

### What This Means for Existing Docker Scripts

The repository includes containerized E2E scripts such as `./docker/manage.sh` and `docker/compose.yml`. These scripts are designed for **external environments** (e.g., local developer machines, GitHub Codespaces with Docker-in-Docker, or CI pipelines). Within AI Studio, containerized commands must not be called. Instead, AI Studio utilizes native Node.js and Playwright execution directly.

---

## 3. "Config Once, Run with Minimal Setup" E2E Strategy

To ensure every new session can run tests with minimal effort, the project adheres to a **Config Once, Fast Execution** architecture.

### 3.1. Persistent vs. Ephemeral Environment Model

| Asset                                                       | Persistence                               | Effort Required on Next Session                                                                      |
| :---------------------------------------------------------- | :---------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **Source Code & Tests** (`src/`, `e2e/`, `scripts/`)        | **100% Persistent**                       | **Zero.** Tracked in workspace; available immediately.                                               |
| **Test Fixtures** (`public/fixtures/L2Ryrr6txwA/`)          | **100% Persistent**                       | **Zero.** Local subtitle JSONs and approved fixtures remain in place.                                |
| **Configurations** (`playwright.config.ts`, `package.json`) | **100% Persistent**                       | **Zero.** Test configurations, base URLs (`http://localhost:3000`), and timeouts are pre-configured. |
| **Node Modules** (`node_modules/`)                          | Persistent across session wakeups         | Minimal. Pre-installed; updated only when package dependencies change.                               |
| **Playwright Browsers** (`~/.cache/ms-playwright`)          | Ephemeral if workspace container rebuilds | Low. If chromium binary is missing, run `npx playwright install chromium` once.                      |

---

## 4. Two-Step Minimal Effort Execution Protocol

When starting a fresh AI Studio session, follow this streamlined two-step verification protocol:

### Step 1: Rapid Script-Level Verification (Sub-Second Feedback)

Run the dedicated TypeScript test runner without launching a browser. This validates DOM structure, test-ids, data attributes, and business logic instantly:

```bash
# Verify E2E selectors and element addressability:
npm run test:e2e-selectors

# Verify E2E test plan for TTS ratio:
npm run test:plan-e2e-test

# Verify all play/pause/listen button identifiers:
npm run test:design-play-buttons
```

- **Setup required**: Zero.
- **Execution time**: < 1 second.

---

### Step 2: Headless Playwright Execution (Real Browser Testing)

When real browser interaction, iframe video simulation, or synthesized speech interception is required:

1. **Verify or install Chromium binary** (only needed once per environment rebuild):

   ```bash
   npx playwright install chromium
   ```

   _(Effort: ~15 seconds to download lightweight headless Chromium)_

2. **Execute targeted test suite against local dev server**:
   The dev server runs automatically on port 3000. `playwright.config.ts` is configured to target `http://localhost:3000` directly.

   ```bash
   # Run only the TTS ratio E2E test suite:
   npx playwright test e2e/web.spec.ts -g "tts-ratio"

   # Run with single browser and zero retries for fastest run:
   npx playwright test e2e/web.spec.ts --project=web -g "tts-ratio" --retries=0
   ```

---

## 5. Platform Capabilities & Trade-Off Matrix

| Platform                                       | Role & Best Use                                                                  | Docker Daemon?                      | ADB / Android Emulator?                 | Playwright Execution Method                          |
| :--------------------------------------------- | :------------------------------------------------------------------------------- | :---------------------------------- | :-------------------------------------- | :--------------------------------------------------- |
| **Google AI Studio (AI Studio Build Sandbox)** | Primary rapid development, code modification, UI building, fast logic validation | ❌ Not available (no Docker daemon) | ❌ Not available (no KVM/ADB)           | **Native Headless Chromium** (`npx playwright test`) |
| **GitHub Codespaces**                          | Secondary full VM development with device emulation                              | ✅ Supported (DinD)                 | ⚠️ Requires nested virtualization       | `./docker/manage.sh e2e web` or native Node          |
| **Local Developer Machine**                    | Full-stack Android APK compilation & device testing                              | ✅ Supported                        | ✅ Physical device & Emulator API 34    | Docker Compose or Native CLI                         |
| **GitHub Actions CI**                          | Automated PR verification & release APK builds                                   | ✅ Supported                        | ✅ API 34 Google APIs headless emulator | CI Matrix (`.github/workflows/*.yml`)                |

---

## 6. Troubleshooting Common Platform Issues & Key Takeaways

1. **Never attempt to run Docker commands in AI Studio**: Use native `npx playwright` or `tsx scripts/verify-*.ts`.
2. **Prioritize targeted script checks first**: They provide immediate validation without browser startup latency.
3. **If Playwright reports missing browser executable**: Execute `npx playwright install chromium` once.
4. **Dev server is always at `localhost:3000`**: No custom proxy or port forwarding is required.
