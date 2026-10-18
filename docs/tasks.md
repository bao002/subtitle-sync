# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Task 146: Video Link Sharing Favorite Language Rules (Version 1.0.48) - Chapter 2

### Objective:
Implement and enforce the 4 required rules upon sharing a video link with the app:
a. Add the default/detected language at the bottom of the favorite language list.
b. Remove any tts-play checkbox selection and select only the language at the top.
c. Store the updated order in localStorage.
d. Allow multi-selection.

### Subtasks:
- [ ] **Subtask 146.1**: Update shared video handler (`onNewIntent` / `onNativeSharedLinkReceived` / query params / video link submit) in `src/routes/index.tsx` to apply the favorite language rules: add detected language at bottom, reset `spoken` TTS checkbox to only top language, persist order to localStorage, and allow multi-selection.
- [ ] **Subtask 146.2**: Author dedicated verification script `scripts/verify-video-sharing-favorite-rules.ts`, register in `package.json` (`test:video-sharing-favorite-rules`) and `docs/files.md`.
- [ ] **Subtask 146.3**: Run automated test, compile (`compile_applet`), lint (`lint_applet`), commit, and migrate Task 146 to `docs/done.md`.


