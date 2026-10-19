# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.







## Task 149: Parser Option Difference Confirmation & Preview (Version 1.0.50)

### Objective:
Implement a confirmation option and interactive preview diff dialog for parser settings changes: calculate and highlight the actual difference between current and proposed alignment divisions, show the number of changed records, allow stepping through changed records with [Next] and [Previous] buttons, and provide [Confirm & Apply] and [Cancel] controls.

### Subtasks:
- [ ] **Subtask 149.1**: Version bump to 1.0.50 across all 5 targets (`package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`).
- [ ] **Subtask 149.2**: Implement `src/utils/parserDiffHelper.ts` to compute detailed diffs between current and proposed subtitle alignments with changed record indices and text/timing highlights.
- [ ] **Subtask 149.3**: Create `src/components/ParserDiffConfirmationModal.tsx` displaying changed record counters, before/after diff cards, [Previous] / [Next] navigation buttons, [Confirm & Apply], and [Cancel].
- [ ] **Subtask 149.4**: Integrate confirmation option toggle and preview modal flow in `src/routes/index.tsx`.
- [ ] **Subtask 149.5**: Author dedicated automated test `scripts/verify-parser-diff-confirmation.ts` validating diff detection, next/prev stepping, diff highlight format, confirmation, and cancellation.
- [ ] **Subtask 149.6**: Verify compilation, lint, and migrate to `docs/done.md`.

---

## Task 144: Android Emulator E2E — Caption Detection & Text Exposure, Deprecate Screencast Generation (Version 1.0.46) [PENDING]

### Objective:
Fix the Android Emulator E2E suite to detect authentic caption requests upon enabling CC on the YouTube video, extract and expose the subtitle text directly in the test execution output and telemetry (no mock or fixtures), and deprecate screencast video generation.

### Subtasks:
- [ ] **Subtask 144.1**: Deprecate screencast video generation (`screenrecord`, ffmpeg synthesis, video artifacts) in `scripts/run-android-e2e.sh`, `scripts/android-e2e-assert.sh`, `.github/workflows/emulation.yml`, and documentation.
- [ ] **Subtask 144.2**: Update Android E2E execution to enable captions on the real YouTube video and detect authentic timedtext network responses without fixtures or mocks.
- [ ] **Subtask 144.3**: Expose the intercepted caption text in logcat, test runner output, and telemetry summary.
- [ ] **Subtask 144.4**: Author dedicated verification script (`scripts/verify-emulator-captions-detection.ts`), verify compilation, lint, commit & push, and migrate to `docs/done.md`.

---

## Later Tasks

The following tasks were requested for "later" by the user and are stored here to be processed upon completion of active prompt tasks:

- **Later Task 2: Client-side video metadata extraction**: If possible client-side only, get video description, title, default subtitles, and all other free info.


