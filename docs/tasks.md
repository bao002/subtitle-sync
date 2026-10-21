# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

## Task 162: Android Emulator E2E Caption Detection & Text Exposure (Deprecate Screencast Generation) (Version 1.0.60) [ACTIVE]

### Objective:
Update Android emulator E2E testing to deprecate video screencast recording (`screenrecord`), assert real YouTube player caption detection upon CC enablement, and expose live intercepted dialogue text in test logs and reports without any mocks or fixtures.

### Subtasks:
- [ ] **Subtask 162.1**: Update Android E2E scripts (`scripts/run-android-e2e.sh`, `scripts/android-e2e-assert.sh`, `e2e/emulation.spec.ts`, `.github/workflows/emulation.yml`) to deprecate `screenrecord` video generation and assert authentic live caption detection with raw dialogue text exposure.
- [ ] **Subtask 162.2**: Update `docs/android.md` documentation to reflect screencast recording deprecation and mandatory live dialogue text logging.
- [ ] **Subtask 162.3**: Author dedicated automated test `scripts/verify-android-e2e-caption-exposure.ts`, verify compilation, lint, git commit, and migrate to `docs/done.md`.

---

## Later Tasks

*(No remaining later tasks — all staged into active backlog)*

