# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

### Task 184: Add No More Tasks "go on" Rule to AGENTS.md & Implement Dedicated Verification

- [ ] **Subtask 184.1**: Record user prompt verbatim in `AGENTS.md` under `## Last raw prompt`, and bump application version to `1.0.98` (`versionCode = 10098`) across all targets (`package.json`, `android-shell/app/build.gradle.kts`, `src/utils/apkUpdater.ts`, `src/utils/appSettings.ts`, `src/config/appConfig.ts`).
- [ ] **Subtask 184.2**: Add the new rule directive into `AGENTS.md` under `## Work tracking`: in case no more tasks left, if prompt is "go on", just summarize that there are no more tasks without showing anything else.
- [ ] **Subtask 184.3**: Create dedicated automated test `scripts/verify-no-more-tasks-go-on-rule.ts`, add it to `scripts/verify-agents-all.ts`, add script to `package.json`, and register in `docs/files.md`.
- [ ] **Subtask 184.4**: Run dedicated verification tests (`npm run test:no-more-tasks-go-on`, `npm run test:agents-size-budget`, `npm run test:agents-all`, `verify-agents-last-prompt-rule.ts`, `verify-agents-version-rule.ts`, `verify-dev-server-stability.ts`), verify compilation (`compile_applet`), run linter (`lint_applet`), and migrate Task 184 to `docs/done.md`.

---

## Later Tasks

_(No pending later tasks currently in queue)_
