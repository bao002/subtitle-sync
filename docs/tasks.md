# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.











## Task 151: Floating Draggable Dropdown Menu with Auto-Scroll & Setup-Pause (Version 1.0.51)

### Objective:
Make the floating draggable button a dropdown menu with both "Setup Pause" and "Auto-Scroll (Enable/Disable)" options. Explain each option clearly with descriptive help text upon clicking or inspecting. Wire the Auto-Scroll toggle directly to the active auto-scroll / auto-focus state.

### Subtasks:
- [ ] **Subtask 151.1**: Update `src/components/FloatingDraggablePauseButton.tsx` to support dropdown action menu mode with both Setup Pause and Auto-Scroll toggles, status badges, and expandable/visible descriptive explanations for each option.
- [ ] **Subtask 151.2**: Wire `isAutoScrollEnabled` and `onToggleAutoScroll` into `FloatingDraggablePauseButton` from `src/routes/index.tsx`.
- [ ] **Subtask 151.3**: Author dedicated automated test `scripts/verify-floating-dropdown-menu.ts`, verify compilation, lint, git commit, and migrate to `docs/done.md`.

---

## Later Tasks

The following tasks were requested for "later" by the user and are stored here to be processed upon completion of active prompt tasks:

- **Later Task 2: Client-side video metadata extraction**: If possible client-side only, get video description, title, default subtitles, and all other free info.
- **Later Task 3: Android Emulator E2E — Caption Detection & Text Exposure, Deprecate Screencast Generation**: Try to fix the E2E test on the Android emulator but deprecate the screencast generation. Detect the captions after enabling it on the youtube-video and expose the text. Do not use mock or fixtures.



