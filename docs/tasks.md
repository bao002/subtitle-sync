# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

### Task 167: Version 1.0.63 Bump & AGENTS.md Chars Removal Order Mandate [ACTIVE]

#### Objective:
Bump version to `1.0.63` across all 5 targets, update `AGENTS.md` with the new raw prompt, and codify the rule that special characters removal accordion must be present in Advanced mode and appear before the parser in both modes.

#### Subtasks:
- [ ] **Subtask 167.1**: Update version to `1.0.63` in `package.json`, `android-shell/app/build.gradle.kts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`, and `src/config/appConfig.ts` [ACTIVE].
- [ ] **Subtask 167.2**: Update `AGENTS.md` with latest raw prompt and add explicit accordion ordering rule (Stage 3 Chars Removal must appear before Stage 4 Parser in both Beginner and Advanced modes).
- [ ] **Subtask 167.3**: Verify version parity and prompt rules via automated tests, commit, and migrate to `docs/done.md`.

---

### Task 168: Implement Chars Removal Accordion in Advanced Mode & Reorder Before Parser in Both Modes [PENDING]

#### Objective:
1. Reorder `BeginnerParsingTab.tsx` so the Character Removal & Rename Rules section appears before Sentence Splitting (Parser).
2. Add `charsRemoval` panel ID and theme in `src/config/accordionThemes.ts` placed immediately before `parser`.
3. Create `src/components/SpecialCharactersRemovalPanel.tsx` and integrate it into `src/routes/index.tsx` as an interactive accordion panel before `parser`.

#### Subtasks:
- [ ] **Subtask 168.1**: Reorder `src/components/beginner/tabs/BeginnerParsingTab.tsx` so Chars Removal section appears before Parser section.
- [ ] **Subtask 168.2**: Update `src/config/accordionThemes.ts` with `charsRemoval` panel placed immediately before `parser`.
- [ ] **Subtask 168.3**: Author `src/components/SpecialCharactersRemovalPanel.tsx` and integrate into `src/routes/index.tsx` with shared sanitization state.
- [ ] **Subtask 168.4**: Commit and migrate Task 168 to `docs/done.md`.

---

### Task 169: Dedicated Automated Verification Tests & Audit Gate [PENDING]

#### Objective:
Author and execute dedicated test suite asserting presence of chars removal accordion in advanced mode, order before parser in both modes, compile, lint, commit, and migrate to `docs/done.md`.

#### Subtasks:
- [ ] **Subtask 169.1**: Author `scripts/verify-chars-removal-accordion-order.ts` asserting accordion presence and ordering.
- [ ] **Subtask 169.2**: Run full test suite, verify compilation (`compile_applet`), linting (`lint_applet`), commit, and finalize prompt audit.

## Later Tasks

*(No remaining later tasks — all staged into active backlog)*

