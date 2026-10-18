# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Task 147: Hotfix: Maximum Update Depth Exceeded in React useEffect Loop (Version 1.0.50)

### Objective:
Resolve the React "Maximum update depth exceeded" infinite render loop error in `src/routes/index.tsx` by eliminating recursive setState triggers in `baseLanguage` and favorite languages synchronization effects.

### Subtasks:
- [ ] **Subtask 147.1**: Guard `baseLanguage` favorite language rules synchronization in `src/routes/index.tsx` with ref tracking / value equality checks to prevent re-entrant setState calls, and bump app version to 1.0.50 / 10050.
- [ ] **Subtask 147.2**: Author dedicated verification script `scripts/verify-hotfix-maximum-update-depth.ts`, register in `package.json` (`test:hotfix-max-update-depth`) and catalog in `docs/files.md`.
- [ ] **Subtask 147.3**: Run verification test suites, compile (`compile_applet`), lint (`lint_applet`), and migrate Task 147 to `docs/done.md`.
