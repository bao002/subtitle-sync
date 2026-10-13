# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are moved to `docs/done.md`.

## Task 54: Improve Android Device & Emulator E2E Testing Suite



- [ ] **Subtask 54.2: Adaptive Device Interaction, Live Intent Assertions & Multi-Scenario Video Capture**:
  - Add adaptive coordinate scaling based on device display resolution for gestures and taps.
  - Implement real device live intent dispatch (`ACTION_VIEW` and `ACTION_SEND`) with verification of UI response in `scripts/android-e2e-assert.sh`.
  - Ensure video screencast recording and screenshot generation dynamically handle physical device screens and rotation gracefully.
  - Update `e2e/emulation.spec.ts` and Cypress emulation tests to reflect physical device and emulator parity.

## Task 59: Compact UI, Pin Toggles, Video Subtitle Scoping, Library Cache Controls & Clean Language Removal

- [ ] 59.1 Compact per-language settings (rate/voice) and fix voice selection.
- [ ] 59.2 Accordions auto-fold after a timeout unless pinned.
- [ ] 59.3 Subtitles always belong to the current video (no fixture/stale captions on Android or other videos).
- [ ] 59.4 Remove the iframe player option.
- [ ] 59.5 Library record: "Clear cache" and "Fetch from scratch" buttons.
- [ ] 59.6 Removing a favorite language removes all related instances (columns, speech, players, cached state).
