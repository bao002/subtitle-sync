# Self-Verification Protocol & Operational Guide (`self-verification.md`)

This document defines the mandatory, automated self-verification protocol for the repository. Grounded in [`AGENTS.md`](../AGENTS.md), [`tokens.md`](./tokens.md), and [`android.md`](./android.md), this protocol ensures:
1. **All automated tests are passing** (unit tests, dedicated verification suites, and end-to-end runs).
2. **Authentic screencast artifacts are captured, verified, and properly linked from the README** (including exact video URL, file size in bytes/MB, badges, and GitHub Pages reports).
3. **All sanity checks and self-verifications are executed and passed** (repository hygiene, strict JSON3 response validation, zero synthetic fixtures on Android, clean compilation, zero ESLint errors, and Markdown link integrity).

---

## 1. Quick Verification Command Matrix

Run these commands in order to execute the full self-verification sequence:

| Verification Scope | Command | Expected Outcome |
| :--- | :--- | :--- |
| **Comprehensive Screencast & Actions** | `npm run test:screencast-availability` | Verifies README links, GitHub Actions workflows, screencast video capture lifecycle, GitHub Pages video presentation, and latest commit run. |
| **README & Documentation Links** | `npm run test:readme-links` | Asserts all relative links resolve, workflow badges point to valid workflows, and report URLs exist. |
| **Markdown Cross-Reference Integrity** | `npm run test:md` | Asserts zero broken relative links across all `.md` files. |
| **Architectural Contracts Audit** | `npm run test:doc-contracts` | Asserts presence and integrity of all 9 modular design contracts in `docs/`. |
| **Repository Hygiene Audit** | `npm run test:hygiene` | Asserts zero build binaries, video files, or synthetic report generators in `main`. |
| **Strict JSON3 Caption Validation** | `npm run test:strict-json3-validation` | Asserts non-JSON, HTML, or empty subtitle responses are rejected, prevented from caching, and evicted on read. |
| **Valid JSON Cache Guard** | `npm run test:valid-json-cache` | Asserts caching gates only admit authentic JSON3 payloads with cues > 0. |
| **No Android Fixture Fallbacks** | `npm run test:accordion-video-id-and-no-android-fixtures` | Asserts Android never uses fake fixture fallbacks and only uses authentic intercepted timedtext. |
| **Android Local Assets Architecture** | `npm run test:local-assets` | Asserts 100% offline, local asset execution without remote URLs. |
| **Android E2E Specification & Timing** | `npm run test:android-e2e-spec` | Asserts screenrecord timing, graceful SIGINT container finalization, and HTML5 video player markup. |
| **Code Modularity & Single-File Limits**| `npm run test:code-modularity` | Asserts component decomposition into `src/components/` and no monolithic files. |
| **Token Economy & Task Staging** | `npm run test:tokens-economy` | Asserts compliance with `tokens.md`, `current-sub-task.md`, and `docs/tasks.md`. |
| **Done Tasks & Hotfix Holding Pattern**| `npm run test:hotfix-workflow` | Asserts task migration to `docs/done.md` and hotfix suspension protocol. |
| **Application Compilation Gate** | `npm run build` | Zero build errors; bundles assets and synchronizes Android assets. |
| **Code Linter Gate** | `npm run lint` | Zero ESLint warnings or errors. |
| **README Status & AI Error Prompt Sync** | `npm run test:readme-error-indicator` | Asserts dynamic CI status indicator, broken link detector, and copy-pasteable AI error prompt in `README.md`. |
| **Self-Verification Protocol Test** | `npm run test:self-verification` | Asserts `self-verification.md` exists and covers all testing, screencast, and sanity requirements. |

---

## 2. Pillar 1: Ensuring All Tests Are Passing

### 2.1 The Verification Hierarchy
The application maintains three testing layers:

```text
[ Layer 1: Dedicated Verification Suites (TypeScript via tsx) ]
   ├── test:self-verification, test:screencast-availability, test:readme-links
   ├── test:hygiene, test:doc-contracts, test:strict-json3-validation
   └── test:android-e2e-spec, test:tokens-economy, test:hotfix-workflow
            │
            ▼
[ Layer 2: Client Web & Unit Verification ]
   ├── test:client-spa (zero SSR dependencies)
   ├── test:hydration (deterministic state)
   └── npm run test:e2e:web (Playwright web suite)
            │
            ▼
[ Layer 3: Android Native Runtime E2E ]
   ├── scripts/run-android-e2e.sh (real device/emulator boot, screenrecord, assertions)
   └── scripts/android-e2e-assert.sh (logcat timedtext inspection, error screen detection)
```

### 2.2 Criteria for "Passing"
A test is verified as passing ONLY when:
1. The process exits with code `0`.
2. All assertions execute dynamically against genuine source code or runtime state (no hardcoded truthy stubs).
3. No unhandled promise rejections, timeouts, or suppressed exceptions occur.
4. For Android E2E: App boots without "This page didn't load" (`APP_BOOT_ERROR`), intercepts authentic `youtube.com/api/timedtext` requests, and successfully retrieves target subtitle tracks.

---

## 3. Pillar 2: Screencast Video Capture, Packaging & README Linkage

### 3.1 Screencast Capture Lifecycle
Per `AGENTS.md` and `android.md`, the screencast video capture must strictly adhere to the following lifecycle:

1. **Pre-Launch Start**:
   `adb shell screenrecord --time-limit 180 --bit-rate 4000000 /sdcard/android-emulator-video.mp4 &`
   Recording MUST start *before* launching `MainActivity` to capture app boot and subtitle discovery.
2. **Graceful Container Finalization (SIGINT)**:
   Video files require a finalized `moov` atom header. Never kill screenrecord with `SIGKILL` (`kill -9`). Instead, send `SIGINT`:
   `adb shell "kill -2 \$(pidof screenrecord 2>/dev/null) 2>/dev/null || pkill -2 screenrecord 2>/dev/null || true"`
   Allow a 3-second sleep buffer to flush the container header to storage.
3. **Resilient Pulling (`set +e`)**:
   Pull the recording via `adb pull /sdcard/android-emulator-video.mp4 ./android-emulator-video.mp4`.
   In `.github/workflows/emulation.yml`, this executes in a dedicated step `Finalize Screencast Recording and Pull Video` with `if: always()` and `set +e` to ensure the pull executes even if a test assertion fails.
4. **Byte Verification**:
   Verify the video is non-empty using cross-platform `wc -c` (must be > 100,000 bytes).
5. **Artifact Upload & GitHub Pages Staging**:
   - Stored ephemerally as workflow artifact: `android-emulator-artifacts`.
   - Staged to `gh-pages-staging/screenshots/android-emulator-video.mp4` and deployed to `gh-pages` branch using `peaceiris/actions-gh-pages@v4` with `keep_files: true`.

### 3.2 README.md Linking Verification Checklist
The `README.md` must link to the screencast artifact and reports:

- [x] **Direct Table Row in GitHub Pages Links**:
  Must contain `🎬 **Android Emulator Screencast Video**`.
- [x] **Direct Video URL**:
  `https://<owner>.github.io/<repo>/screenshots/android-emulator-video.mp4`.
- [x] **Explicit File Size**:
  Must document exact bytes and human-readable megabytes (e.g., `6,724,502 bytes / 6.41 MB`).
- [x] **Automated Synchronization**:
  `scripts/update-readme.mjs` runs in CI workflows to synchronize the exact video size whenever a new recording is produced.
- [x] **Android Emulator Report**:
  Link to `https://<owner>.github.io/<repo>/android-emulator-report.html` embedding the HTML5 `<video controls autoplay muted loop playsinline>` player.

Run `npm run test:screencast-availability` to verify all screencast links and workflow steps in a single automated command.

---

## 4. Pillar 3: Sanity Checks & Self-Verifications

Before declaring any task or prompt complete, all 6 sanity checks must be passed:

### Sanity Check 1: Repository Hygiene
- **Rule**: No video recordings (`.mp4`), device screenshots (`.png`), logcat dumps, or build outputs (`dist/`, `.apk`) may ever be committed to the `main` branch.
- **Verification**: `npm run test:hygiene`
- **Enforcement**: Build outputs and video recordings remain strictly in ephemeral CI artifacts or staged to the orphaned `gh-pages` branch.

### Sanity Check 2: Strict JSON3 Caption Validation & Anti-Bot Architecture
- **Rule**: Subtitle HTTP responses must be 200 OK, non-empty, and conform strictly to YouTube `json3` (`events` array, `tStartMs`, `dDurationMs`, `segs[].utf8`). HTML error responses, XML, or empty cue arrays (`events: []`) must never be cached and must be evicted if encountered.
- **Verification**:
  - `npm run test:strict-json3-validation`
  - `npm run test:valid-json-cache`
  - `npm run test:no-cache-empty-non-json`
  - `npm run test:html-guard-caching`

### Sanity Check 3: Zero Synthetic Fixtures on Android
- **Rule**: On Android, subtitle fetching must be 100% authentic via intercepted timedtext requests and native `OkHttpClient` replay. Android must never fall back to mock fixtures or synthetic subtitle generators.
- **Verification**: `npm run test:accordion-video-id-and-no-android-fixtures` and `npm run test:local-assets`.

### Sanity Check 4: Documentation & Markdown Link Resolution
- **Rule**: Zero dead relative links in `README.md` or any documentation file. All 9 architectural contracts (`ACTIONS.md`, `LIBRARY.md`, `DESIGN_*.md`, `SCHEMA_TIMEDTEXT.md`, `DEBUG.md`) must be present in `docs/`.
- **Verification**: `npm run test:readme-links`, `npm run test:md`, and `npm run test:doc-contracts`.

### Sanity Check 5: Code Modularity & Decomposed Components
- **Rule**: Never overload single monolithic files (e.g. `src/routes/index.tsx`). Structurally distinct UI components must reside in `src/components/`, and state/hooks in `src/hooks/` or `src/utils/`.
- **Verification**: `npm run test:code-modularity` and `npm run test:index-decomposition`.

### Sanity Check 6: Build & Lint Zero-Defect Gate
- **Rule**: The entire project must compile cleanly and pass ESLint with 0 errors.
- **Verification**:
  - `npm run build` (or `compile_applet`)
  - `npm run lint` (or `lint_applet`)

### Sanity Check 7: Automated README CI Status & Broken Link Synchronizer
- **Rule**: `README.md` must contain dynamic status indicator anchors (`<!-- CI_STATUS_INDICATOR_START -->` / `<!-- CI_STATUS_INDICATOR_END -->`). If any upstream workflow fails or broken links/workflows are discovered, it must automatically format an alert and a copy-pasteable AI error prompt block with exact diagnostic lines.
- **Verification**:
  - `npm run test:readme-error-indicator`
  - `npm run test:readme-links`
  - See full architectural specification in [`docs/operations/ACTIONS.md`](./operations/ACTIONS.md).

---

## 5. Pillar 4: Task Tracking & Prompt Completion Audit

In accordance with `tokens.md` and `AGENTS.md`:

1. **Pre-Action Documentation Update**:
   Before writing code or tests, activate `tokens.md`, stage tasks in `docs/tasks.md`, and record the active subtask in `current-sub-task.md` and `docs/todo.md`.
2. **Incremental Checkpoints**:
   Execute atomic changes, run the dedicated test, commit to Git (`git commit`), and attempt `git push`.
3. **Migration to `docs/done.md`**:
   Document the completed feature, test command, and diff scope in `docs/done.md`, and mark complete `[x]` in `docs/tasks.md`.
4. **Completion Audit Gate**:
   Verify that EVERY planned task for the prompt is marked `[x]` in `docs/tasks.md` and recorded in `docs/done.md`. Never leave prompt tasks abandoned or half-implemented.
