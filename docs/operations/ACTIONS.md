# GitHub Actions Workflows & CI/CD Pipelines (`ACTIONS.md`)

This document details the automated GitHub Actions CI/CD workflows, build pipelines, and artifact deployment architectures for the YouTube Subtitle Learning Platform.

---

## 1. Overview of Automated Pipelines

The repository maintains four dedicated GitHub Actions workflows to guarantee test coverage, release automation, and continuous live demonstration across Web and Android platforms:

| Workflow File         | Trigger Events                   | Primary Responsibilities                                              | Target Artifacts                                |
| :-------------------- | :------------------------------- | :-------------------------------------------------------------------- | :---------------------------------------------- |
| **`release-apk.yml`** | Tag push (`v*`), Manual dispatch | Compiles Android native debug APK and packages web bundle.            | `YouTube-Viewer-debug.apk`, `web-dist.zip`      |
| **`web.yml`**         | Push to `main`, PRs              | Runs web companion end-to-end tests across Playwright and Cypress.    | Playwright trace, Mochawesome HTML reports      |
| **`emulation.yml`**   | Push to `main`, PRs              | Runs Android emulator instrumentation and WebView interception tests. | `android-emulator-report.html`, logcat captures |
| **`deploy-demo.yml`** | Push to `main` (auto)            | Builds production web demo and deploys to GitHub Pages (`gh-pages`).  | GitHub Pages web app and test dashboards        |
| **`error-reporting.yml`** | Workflow completion, Push, PR, Manual | Catches build/lint/test errors, produces `error.log` and AI fix prompt. | `error.log`, GitHub Step Summary diagnostic      |

---

## 2. Workflow Specifications

### 2.1 Release APK & Web Bundle (`release-apk.yml`)

- **Objective**: Generates release-ready binary artifacts whenever a version tag (`vX.Y.Z`) is pushed to the repository.
- **Key Steps**:
  1. Sets up JDK 17 and Android SDK environment.
  2. Runs Gradle build (`./gradlew assembleDebug`) in `android-shell/`.
  3. Builds production web client via `npm run build`.
  4. Archives the compiled web assets into `web-dist.zip` for OTA hot-updates.
  5. Attaches both `YouTube-Viewer-debug.apk` and `web-dist.zip` to the newly created GitHub Release.
- **Update Channel**: Consumed by `update.apk.sh` (ADB CLI installer) and `src/utils/apkUpdater.ts` (in-app OTA hot-updater).

### 2.2 Web Companion E2E Suite (`web.yml`)

- **Objective**: Automated browser validation in headless Linux CI environments.
- **Key Steps**:
  1. Checks out repository and configures Node.js 20.
  2. Installs dependencies (`npm ci`).
  3. Validates subtitle fixture schema (`npm run test:caption-formats`).
  4. Validates markdown link cross-references (`npm run test:md`).
  5. Executes Playwright test suite (`npm run test:e2e:web`).
  6. Executes Cypress test suite (`npm run test:cy:web`).
  7. Publishes test artifacts to GitHub Actions run summaries.

### 2.3 Android Emulator Suite (`emulation.yml`)

- **Objective**: Runs unmocked Android WebView network interception and hardware TTS synchronization on an Android emulator (API 34).
- **Key Steps**:
  1. Initializes KVM hardware-accelerated Android emulator.
  2. Boots Android 14 (API 34) Google APIs system image.
  3. Installs debug APK onto the emulator via ADB.
  4. Runs `scripts/run-android-e2e.sh` to assert:
     - `shouldInterceptRequest` captures live YouTube timedtext API requests.
     - Dynamic `tlang` modification fetches translated cues without timing drift.
     - Native TTS audio coordination completes with zero playback overlap.
  5. Generates `android-emulator-report.html` and captures logcat streams.

### 2.4 GitHub Pages Deployment (`deploy-demo.yml`)

- **Objective**: Continuously publishes the latest static companion app and test artifacts to GitHub Pages (`gh-pages` branch).
- **Target URL**: `https://mostuf25561.github.io/subtitle-sync/`
- **Prerequisites**: Ensure GitHub Pages is enabled in repository settings: **Settings > Pages > Build and deployment > Source: Deploy from a branch (`gh-pages` / `/root`)**.
- **Key Steps**:
  1. Compiles production web bundle (`npm run build`).
  2. Deploys `./dist` to `gh-pages` branch via `peaceiris/actions-gh-pages@v4` with `keep_files: true`.
  3. Stages and retains authentic emulator screenshots in `screenshots/android-emulator-screenshot.png`.

### 2.5 Automated Error Reporting & AI Reproduction Fix Engine (`error-reporting.yml`)

- **Objective**: Intercepts CI pipeline failures, compiles system telemetry, generates exact reproduction steps, and produces `error.log` with an AI diagnostic fix prompt.
- **Workflow File**: `.github/workflows/error-reporting.yml`
- **Trigger**: Automatic on `workflow_run` (after any primary workflow completes), push/pull request to main, and manual dispatch.
- **Output Artifacts**:
  - `error.log`: Downloadable artifact containing root-cause analysis, reproduction command, stack trace, and AI prompt block.
  - GitHub Step Summary: Instant markdown report rendered directly on the GitHub Actions workflow run summary page.
- **CLI Alternative**: Can be triggered locally or in scripts via `npm run report:error` (`npx tsx scripts/generate-error-report.ts`).

---

## 3. Test Failure Diagnostics & CI Log Triage

Whenever diagnosing or rectifying test failures across automated CI pipelines:

- **Reference Architecture**: Inspect and compare solutions against baseline reference repository [https://github.com/mostuf2556/Youtubenet6](https://github.com/mostuf2556/Youtubenet6).
- **Active CI Workflows**:
  - **APK Release Pipeline**: [https://github.com/mostuf25561/subtitle-sync/actions/workflows/release-apk.yml](https://github.com/mostuf25561/subtitle-sync/actions/workflows/release-apk.yml)
  - **Web E2E Pipeline**: [https://github.com/mostuf25561/subtitle-sync/actions/workflows/web.yml](https://github.com/mostuf25561/subtitle-sync/actions/workflows/web.yml)
  - **Android Emulation Pipeline**: [https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml](https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml)
  - **Report & Document Integrity**: [https://github.com/mostuf25561/subtitle-sync/actions/workflows/integrity.yml](https://github.com/mostuf25561/subtitle-sync/actions/workflows/integrity.yml)
