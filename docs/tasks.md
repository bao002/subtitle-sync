# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

### Task 165 (Chapter 1): Update Integrity Checks & Link Checking Flows for Deprecated Video/Image Artifacts (Version 1.0.62) [ACTIVE]

#### Objective:
Update `scripts/update-readme.mjs`, `.github/workflows/integrity.yml`, `.github/workflows/report-video-flow.yml`, and integrity link checking tests so that generating video artifacts and static images is recognized as deprecated, ensuring CI workflows and broken-link flows do not fail or trigger false alarms when video or static image links are absent.

#### Subtasks:
- [ ] **Subtask 165.1**: Update `scripts/update-readme.mjs` to remove strict remote video 404 failure and obsolete image link checks, recognizing screencast video deprecation [ACTIVE].
- [ ] **Subtask 165.2**: Update `.github/workflows/integrity.yml` and `.github/workflows/report-video-flow.yml` to reflect that video and static image artifacts are no longer required.
- [ ] **Subtask 165.3**: Update `scripts/verify-report-video-links-and-readme-sync.ts` and related verification tests for the updated integrity specifications.
- [ ] **Subtask 165.4**: Execute dedicated verification test suite, run `compile_applet` and `lint_applet`, commit, and migrate Task 165 to `docs/done.md`.

---

### Task 166 (Chapter 2): Purge Static Images from Repository & Enforce Dedicated Emulator-Only Artifact Generation (Version 1.0.62) [PENDING]

#### Objective:
Purge all pre-baked/static image files from `public/screenshots/`, `public/assets/`, and `android-shell/` that were produced outside the dedicated GitHub Actions emulator run, and ensure that only authentic runtime artifacts generated on the real Android emulator during `emulation.yml` are preserved.

#### Subtasks:
- [ ] **Subtask 166.1**: Remove all static image files from `public/screenshots/` and `public/assets/`.
- [ ] **Subtask 166.2**: Update `scripts/android-e2e-assert.sh` to avoid polluting tracked repository directories on `main`.
- [ ] **Subtask 166.3**: Author dedicated test `scripts/verify-no-static-images-in-repo.ts`, compile, lint, commit, and migrate Task 166 to `docs/done.md`.

---

## Later Tasks

*(No remaining later tasks — all staged into active backlog)*

