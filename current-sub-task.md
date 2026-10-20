# Current Subtask (`current-sub-task.md`)

## Active Subtask: Subtask 144.1 - Deprecate screencast video generation in Android E2E scripts & workflows
- **Parent Task**: Task 144 - Android Emulator E2E — Caption Detection & Text Exposure, Deprecate Screencast Generation (Version 1.0.51)
- **Status**: [ACTIVE]
- **Target Files**:
  - `scripts/run-android-e2e.sh`
  - `scripts/android-e2e-assert.sh`
  - `.github/workflows/emulation.yml`
  - `public/android-emulator-report.html`
- **Verification**: Ensure scripts run cleanly without spawning screenrecord, avoid synthetic or redundant video ffmpeg conversion, eliminate video artifacts requirements while keeping authentic milestone screenshots, logcat telemetry, and reporting.














=======
## Active Subtask: Subtask 151.2 - Wire isAutoScrollEnabled & onToggleAutoScroll in index.tsx
- **Parent Task**: Task 151 - Floating Draggable Dropdown Menu with Auto-Scroll & Setup-Pause (Version 1.0.51)
=======
## Active Subtask: Subtask 154.4 - Author Dedicated Test, Verify Build & Lint, Commit, and Migrate to done.md
- **Parent Task**: Task 154 - Client-Side Video Metadata Extraction & Presentation (Version 1.0.54)
 - **Status**: [ACTIVE]
- **Target Files**:
  - `scripts/verify-client-video-metadata.ts`
  - `package.json`
  - `docs/files.md`
  - `docs/done.md`
  - `docs/tasks.md`
- **Verification**: Test suite verifying client-side metadata extraction, thumbnail computation, caching in localStorage and memory, in-flight request deduplication, library item title updating, UI data-testids, compile_applet, and lint_applet.
