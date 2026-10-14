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
| **`update-readme.yml`** | Workflow completion (`workflow_run`), Push to `main`, Manual | Scans broken links, extracts CI status, updates README with AI prompt. | `README.md` dynamic indicator & AI fix prompt   |
| **`integrity.yml`**   | Push to `main`, PRs              | Validates report schemas, no duplicate docs, and markdown links.       | Integrity test logs & validation matrices       |

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

### 2.6 README Fork Identity & CI Status Synchronization (`update-readme.yml`)

- **Objective**: Keeps `README.md` dynamically synchronized with the latest CI execution health, broken link scan results, and copy-pasteable AI fix prompts.
- **Workflow File**: `.github/workflows/update-readme.yml`
- **Trigger**: Automatic on `workflow_run` (fires upon completion of `emulation.yml`, `web.yml`, `release-apk.yml`, `integrity.yml`, or `error-reporting.yml`), push to `main`/`master`, and manual dispatch.
- **Key Steps**:
  1. Detects upstream workflow conclusion; if failed, exports `CI_STATUS="failure"`, `FAILED_WORKFLOW`, `FAILED_STEP`, and `ERROR_MESSAGE`.
  2. Runs `npm run test:readme-links` to actively validate all internal relative targets and workflow badge paths.
  3. Executes `node scripts/update-readme.mjs` to scan for broken links, calculate authentic video sizes, and generate the status indicator.
  4. Injects either the `ALL VERIFIED` banner or the `FAILED` alert with an enclosed AI fix prompt into `README.md`.
  5. Uses `git diff --exit-code README.md` to commit and push changes back to the repository branch using `[skip ci]`.

### 2.7 Documentation & Schema Integrity Pipeline (`integrity.yml`)

- **Objective**: Enforces repository architectural contracts, ensuring no duplicate Markdown files exist outside `docs/*.md`, all internal links resolve, and test fixture schemas conform strictly to requirements.
- **Workflow File**: `.github/workflows/integrity.yml`
- **Key Steps**:
  1. Validates no duplicate Markdown files exist (`npm run test:no-duplicate-md`).
  2. Validates all cross-document markdown links (`npm run test:md-links`).
  3. Asserts report and fixture schema compliance (`npm run test:caption-formats`).

### 2.8 Report Video Flow Pipeline (`report-video-flow.yml`)

- **Objective**: Dedicated pipeline monitoring and auditing the availability of screencast video assets (`android-emulator-video.mp4`) in live GitHub Pages reports (`android-emulator-report.html`), automatically reflecting broken video links or HTTP 404 responses directly onto `README.md` with copy-pasteable AI fix prompts.
- **Workflow File**: `.github/workflows/report-video-flow.yml`
- **Trigger Events**:
  - `schedule`: Runs every 6 hours (`0 */6 * * *`) for background health monitoring.
  - `workflow_run`: Runs upon completion of `emulation.yml`, `deploy-demo.yml`, and `integrity.yml`.
  - `push`: Runs on pushes to `main` and `master`.
  - `workflow_dispatch`: Enables immediate manual trigger from GitHub UI.
- **Key Operations**:
  1. Installs dependencies and runs dedicated test suite `npm run test:report-video-links`.
  2. Runs `scripts/update-readme.mjs` with `CHECK_REMOTE_VIDEO="true"`, verifying remote GitHub Pages assets against HTTP 404 responses.
  3. If video assets are missing or broken, flags CI status as `failure`, titles the failure as `Android Emulator Screencast & Report Video Flow`, and inserts actionable AI fix prompt into `README.md`.
  4. Commits and pushes any status updates with `[skip ci]`.
  5. Automatically dispatches the `emulation.yml` workflow (`gh workflow run emulation.yml`) to record and publish the screencast video to the `gh-pages` branch, self-healing the missing asset.

---

## 3. Test Failure Diagnostics & CI Log Triage

Whenever diagnosing or rectifying test failures across automated CI pipelines:

- **Reference Architecture**: Inspect and compare solutions against baseline reference repository [https://github.com/mostuf2556/Youtubenet6](https://github.com/mostuf2556/Youtubenet6).
- **Active CI Workflows**:
  - **APK Release Pipeline**: [https://github.com/mostuf25561/subtitle-sync/actions/workflows/release-apk.yml](https://github.com/mostuf25561/subtitle-sync/actions/workflows/release-apk.yml)
  - **Web E2E Pipeline**: [https://github.com/mostuf25561/subtitle-sync/actions/workflows/web.yml](https://github.com/mostuf25561/subtitle-sync/actions/workflows/web.yml)
  - **Android Emulation Pipeline**: [https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml](https://github.com/mostuf25561/subtitle-sync/actions/workflows/emulation.yml)
  - **Report & Document Integrity**: [https://github.com/mostuf25561/subtitle-sync/actions/workflows/integrity.yml](https://github.com/mostuf25561/subtitle-sync/actions/workflows/integrity.yml)
  - **README CI Status Sync**: [https://github.com/mostuf25561/subtitle-sync/actions/workflows/update-readme.yml](https://github.com/mostuf25561/subtitle-sync/actions/workflows/update-readme.yml)
  - **Report Video Flow**: [https://github.com/mostuf25561/subtitle-sync/actions/workflows/report-video-flow.yml](https://github.com/mostuf25561/subtitle-sync/actions/workflows/report-video-flow.yml)

---

## 4. End-to-End Pipeline: From GitHub Actions & GitHub Pages to README.md Broken Test and Link Summary

This section details the automated end-to-end telemetry loop that links GitHub Actions workflow execution and GitHub Pages deployments directly to the dynamic CI status indicator and AI error reproduction prompts in `README.md`.

### 4.1 The Complete Telemetry & Status Feedback Loop

```text
[ Developer / CI Trigger ] (Push to main / Pull Request)
          │
          ├──────────────────────────────────────────────────────┐
          ▼                                                      ▼
[ Primary Workflows Execution ]                       [ Web / Integrity Tests ]
  - .github/workflows/emulation.yml                     - .github/workflows/web.yml
  - .github/workflows/release-apk.yml                   - .github/workflows/integrity.yml
          │                                                      │
          ▼                                                      │
[ Artifact Production & GitHub Pages Deployment ]                │
  - Runs adb screenrecord -> android-emulator-video.mp4          │
  - Captures milestone screenshots -> step1..5.png               │
  - Deploys ./gh-pages-staging to orphaned `gh-pages` branch    │
  - Publishes live report: /android-emulator-report.html         │
          │                                                      │
          └──────────────────────────┬───────────────────────────┘
                                     │ (Workflow completion triggers: workflow_run)
                                     ▼
                  [ .github/workflows/update-readme.yml ]
                                     │
                 1. Captures upstream conclusion & failure logs
                 2. Scans README.md for broken relative links & badges
                 3. Inspects video size and artifact availability
                 4. Invokes scripts/update-readme.mjs
                                     │
                                     ▼
                [ Dynamic README.md Injection & Synchronization ]
                     <!-- CI_STATUS_INDICATOR_START -->
                     ├── IF SUCCESS & ZERO BROKEN LINKS:
                     │   └── 🚦 Status: ALL VERIFIED (with verified links to report & video)
                     └── IF FAILED OR BROKEN LINKS FOUND:
                         └── 🚨 Status: FAILED (Alert subtitle, failed step & run URL)
                             └── 📋 Markdown AI Fix Prompt block (1-click copy-pasteable)
                     <!-- CI_STATUS_INDICATOR_END -->
                                     │
                                     ▼
                        [ Automated Git Commit & Push ]
                git commit -m "chore(docs): synchronize README... [skip ci]"
                Pushed back to repository branch (Maintains 100% ground truth)
```

### 4.2 Why Reports or Screencast Links May Initially Seem Broken

A common source of confusion in new forks, freshly cloned repositories, or newly opened pull requests is why links in `README.md` (e.g. to `android-emulator-video.mp4` or screenshots) might return 404 or appear missing:

1. **Separation of Branches (`main` vs `gh-pages`)**:
   - In accordance with the strict repository hygiene rules in `AGENTS.md`, large binary media files (`android-emulator-video.mp4`, full logcats, screenshots) are **never** committed to the `main` branch.
   - Instead, these assets are published exclusively by the GitHub Actions runner to the orphaned `gh-pages` branch.
2. **Asynchronous Generation Timing**:
   - The authentic screencast video is recorded during the live execution of `emulation.yml` on a macOS runner running an Android 14 (API 34) emulator. This workflow takes several minutes.
   - Before the initial `emulation.yml` run completes successfully and pushes to `gh-pages`, the requested media files do not yet exist on the GitHub Pages CDN.
3. **Resilient Report Fallback**:
   - The HTML report (`public/android-emulator-report.html`) implements client-side error handling: if the video file is not yet deployed or encounters a network error, an informative warning card is displayed explaining that the artifact is pending CI finalization, rather than crashing the page.

### 4.3 Automated Broken Link & Target Scanner (`scanReadmeBrokenLinks`)

During execution of `scripts/update-readme.mjs` (both locally and in CI), the script performs an exhaustive AST and regex scan across `README.md`:

- **Relative Link Validation**: Extracts all markdown links (`[text](target)`) and resolves them against the repository root. If a target file does not exist locally (e.g. broken path, deleted doc, or moved asset), it is flagged as broken with its exact line number.
- **Workflow Badge Validation**: Extracts all references to GitHub Actions workflows (`actions/workflows/<name>.yml`) and checks that the corresponding `.github/workflows/<name>.yml` definition exists in the repository.
- **Exit Status Escalation**: If one or more broken links are identified, the script automatically overrides `ciStatus = "failure"`, sets `failedWorkflow = "README Link Integrity & Documentation Check"`, and includes each broken link target and reason in the error report.

### 4.3.1 Dedicated Report Video Link Verification (`scanReportVideoIntegrity`)

When checking the live GitHub Pages report (such as `https://<owner>.github.io/<repo>/android-emulator-report.html`), video links may return HTTP 404 if `emulation.yml` has not completed or failed to deploy `screenshots/android-emulator-video.mp4` to `gh-pages`:

1. **Active Probing**: Both `scripts/update-readme.mjs` (via `fetch` with timeout) and the dedicated test `npm run test:report-video-links` probe `https://<owner>.github.io/<repo>/screenshots/android-emulator-video.mp4`.
2. **Detection & Failure Flagging**:
   - If the video asset is not found on disk or returns HTTP 404 on GitHub Pages, `scanReportVideoIntegrity` flags the broken link.
   - `ciStatus` is automatically escalated to `"failure"`.
   - `failedWorkflow` is set to `"Android Emulator Screencast & Report Video Flow"`.
   - `failedStep` is set to `"Report Video Link Verification (android-emulator-video.mp4 returned HTTP 404)"`.
3. **Dynamic Reflection in `README.md`**:
   - The status indicator switches to `## 🚨 Latest CI Build & Test Status: FAILED`.
   - The broken video link is explicitly documented under `### 🔗 Broken Links Detected:` with the exact URL and report reference.
   - A copy-pasteable `# AI FIX PROMPT: CI Failure in Android Emulator Screencast & Report Video Flow` is generated with full instructions to trigger `emulation.yml` to record and deploy the authentic screencast.
   - The Verified Test Products table and lists in `README.md` switch from displaying a verified download to `⚠️ Missing Asset / HTTP 404`.
4. **Client-Side Report Fallback**:
   - Both `public/android-emulator-report.html` and `public/android/index.html` register active JavaScript error listeners on child `<source>` tags and `<video id="screencast-video-player">`.
   - When a 404 or network error occurs, the report dynamically displays `#video-broken-banner` alerting the user that the video link is broken and directing them to `README.md` for the automated AI fix prompt.

### 4.4 Dynamic Status Indicators in `README.md`

The status section is delimited by comment anchors:
```markdown
<!-- CI_STATUS_INDICATOR_START -->
... dynamic content ...
<!-- CI_STATUS_INDICATOR_END -->
```

#### State A: All CI Pipelines Passing & Zero Broken Links
When all upstream workflows succeed and zero broken links are detected:
```markdown
<!-- CI_STATUS_INDICATOR_START -->
## 🚦 Latest CI Build & Test Status: ALL VERIFIED

- **Android Emulator E2E Tests**: [Verified (Android 14 API 34)](https://<owner>.github.io/<repo>/android-emulator-report.html)
- **Android Emulator Screencast Video**: [Download MP4 (6.41 MB)](https://<owner>.github.io/<repo>/screenshots/android-emulator-video.mp4)
- **Screenshot Image**: [View UI Capture](https://<owner>.github.io/<repo>/screenshots/android-emulator-screenshot.png)
- **Workflow Runs**: [GitHub Actions Dashboard](https://github.com/<owner>/<repo>/actions)
<!-- CI_STATUS_INDICATOR_END -->
```

#### State B: CI Failure or Broken Links Detected
When an upstream pipeline fails or a broken link is discovered:
```markdown
<!-- CI_STATUS_INDICATOR_START -->
## 🚨 Latest CI Build & Test Status: FAILED

> ⚠️ **Automated Failure / Broken Links Detected**: `Android Emulator E2E Tests` (Step: `Run Android E2E Runner`)
>
> If screencasts, logs, or reports are missing, copy the diagnostic block below and paste it directly into your AI Assistant prompt to reproduce and resolve the failure immediately:

```markdown
# AI FIX PROMPT: CI Failure in Android Emulator E2E Tests
- **Repository**: owner/repo
- **Workflow / Checker**: Android Emulator E2E Tests
- **Failing Step**: Run Android E2E Runner
- **Run URL**: https://github.com/owner/repo/actions/runs/123456789

### Failure Log & Diagnosis:
Workflow 'Android Emulator E2E Tests' concluded with status 'failure'.

### Instructions for AI Assistant:
1. Examine the root cause, broken link(s), and diagnostic details above.
2. Fix broken target paths, restore missing files, or fix failing application code with targeted edits.
3. Verify that `npm run test:readme-links` and all automated test suites pass cleanly.
```
<!-- CI_STATUS_INDICATOR_END -->
```

### 4.5 Copy-Pasteable AI Error Prompt Block

The embedded AI fix prompt inside the `README.md` status section provides developers and AI coding agents with immediate, zero-friction debugging:

1. **Context Preservation**: Supplies the exact repository name, failing workflow, step name, and direct link to the GitHub Actions run log.
2. **Targeted Broken Link Diagnosis**: If broken links exist, outputs every broken link with its file location, target path, and reason.
3. **Actionable Remediation Commands**: Gives the exact command to run locally (`npm run test:readme-links`, `npm run test:android`, etc.) to reproduce and verify the fix.

### 4.6 Automated Commit & Loop-Prevention Protocol

To prevent infinite workflow recursion:
1. `update-readme.yml` checks `git diff --exit-code README.md`. If no changes occurred, the job terminates cleanly without creating empty commits.
2. If changes are detected, it commits with user `github-actions[bot]` and message:
   `chore(docs): synchronize README.md repository identity and CI status for <owner>/<repo>`.
3. The commit includes standard `[skip ci]` directives where necessary to ensure that updating `README.md` does not redundantly re-trigger the primary test suites.
