# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

- [ ] **Task 179: Harmonize Native TTS Speech Rate Bounds (0.3 - 1.5) & Clean Up Residual Speed State (Version 1.0.72)**
  - [ ] **Subtask 179.1**: Align Web Speech fallback in `src/lib/alternative-tts.ts` to clamp rates between 0.3 and 1.5 (default 0.5), perfectly matching native application settings.
  - [ ] **Subtask 179.2**: Clean up unused residual `lovableTtsSpeedState` in `src/routes/index.tsx` and `src/components/beginner/tabs/BeginnerPreferencesTab.tsx`.
  - [ ] **Subtask 179.3**: Bump app version to 1.0.72 across 5 targets, record latest raw prompt in `AGENTS.md`, author dedicated test `scripts/verify-native-tts-speed-alignment.ts`, compile, lint, and migrate to `docs/done.md`.

---

## Later Tasks

*(No remaining later tasks — all active prompt tasks staged)*
