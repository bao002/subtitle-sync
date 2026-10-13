# Active Task Mirror (`docs/todo.md`)

## Current Status: Prompt Tasks Completed (Task 95 Done)

All prompt requirements for Task 95 (Winner Promotion Report Persistence across all past videos, `docs/cache.md` Subtitle Caching Specification, Shared Video Library Persistence fix, and Subtitle Cache Hydration) have been completed, verified with dedicated test `test:cache-and-winner-promotion`, compiled, linted, and logged in `docs/done.md`.

## Next Pending Backlog Task: Subtask 54.2

- **Subtask 54.2**: Adaptive Device Interaction, Live Intent Assertions & Multi-Scenario Video Capture:
  - Add adaptive coordinate scaling based on device display resolution for gestures and taps.
  - Implement real device live intent dispatch (`ACTION_VIEW` and `ACTION_SEND`) with verification of UI response in `scripts/android-e2e-assert.sh`.
  - Ensure video screencast recording and screenshot generation dynamically handle physical device screens and rotation gracefully.
  - Update `e2e/emulation.spec.ts` and Cypress emulation tests to reflect physical device and emulator parity.
