# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.








 main

## Task 144: Android Emulator E2E — Caption Detection & Text Exposure, Deprecate Screencast Generation (Version 1.0.51) [IN PROGRESS]
=======



## Task 151: Floating Draggable Dropdown Menu with Auto-Scroll & Setup-Pause (Version 1.0.51)
 main

### Objective:
Make the floating draggable button a dropdown menu with both "Setup Pause" and "Auto-Scroll (Enable/Disable)" options. Explain each option clearly with descriptive help text upon clicking or inspecting. Wire the Auto-Scroll toggle directly to the active auto-scroll / auto-focus state.

### Subtasks:
- [ ] **Subtask 144.1**: Deprecate screencast video generation (`screenrecord`, ffmpeg synthesis, video artifacts) in `scripts/run-android-e2e.sh`, `scripts/android-e2e-assert.sh`, `.github/workflows/emulation.yml`, and documentation.
- [ ] **Subtask 144.2**: Update Android E2E execution to enable captions on the real YouTube video and detect authentic timedtext network responses without fixtures or mocks.
- [ ] **Subtask 144.3**: Expose the intercepted caption text in logcat, test runner output, and telemetry summary.
- [ ] **Subtask 144.4**: Version bump to 1.0.51 across all 5 targets, author dedicated verification script (`scripts/verify-emulator-captions-detection.ts`), verify compilation, lint, and migrate to `docs/done.md`.
- [ ] **Subtask 151.1**: Update `src/components/FloatingDraggablePauseButton.tsx` to support dropdown action menu mode with both Setup Pause and Auto-Scroll toggles, status badges, and expandable/visible descriptive explanations for each option.
- [ ] **Subtask 151.2**: Wire `isAutoScrollEnabled` and `onToggleAutoScroll` into `FloatingDraggablePauseButton` from `src/routes/index.tsx`.
- [ ] **Subtask 151.3**: Author dedicated automated test `scripts/verify-floating-dropdown-menu.ts`, verify compilation, lint, git commit, and migrate to `docs/done.md`.
 

---

## Later Tasks

The following tasks were requested for "later" by the user and are stored here to be processed upon completion of active prompt tasks:

- **Later Task 2: Client-side video metadata extraction**: If possible client-side only, get video description, title, default subtitles, and all other free info.
- **Later Task 3: Android Emulator E2E — Caption Detection & Text Exposure, Deprecate Screencast Generation**: Try to fix the E2E test on the Android emulator but deprecate the screencast generation. Detect the captions after enabling it on the youtube-video and expose the text. Do not use mock or fixtures.



