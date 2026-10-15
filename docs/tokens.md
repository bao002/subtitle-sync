# Token Economy Architecture & Task Decomposition Protocol (tokens.md)

This document establishes the mandatory operational flow for maximizing token usage efficiency across all prompts and automated agent execution cycles.

---

## 1. The Token Economy Problem: Why Big Tasks Fail

In large codebases and complex full-stack applications, processing broad or monolithic tasks directly in a single sprawling execution pass leads to critical failure modes:

1. **Context Bloat & Token Exhaustion**: Loading massive files, long terminal outputs, and multiple unrelated modules simultaneously rapidly burns model context windows and output token allocations.
2. **Abrupt Execution Termination**: When token budgets run dry mid-turn, unfinished edits, half-written test suites, and uncommitted changes leave the repository in a broken, non-compiling state.
3. **Compound Regression Cascades**: Modifying multiple distinct subsystems concurrently makes failure diagnosis expensive in token costs, requiring deep diff re-reads.
4. **Waste of Prior Token Expenditure**: If a long chain of tool invocations does not checkpoint incremental progress into git commits and task logs, any subsequent error wipes out the utility of all previously spent tokens.

---

## 2. The Core Principle: Granular Decomposition Maximizes Token Efficiency

> **Golden Rule**: **Always break every user prompt into small, isolated sub-tasks and stage `current-sub-task.md` on every step.**

By isolating execution into focused atomic sub-tasks:

- **Token Input is Minimized**: The model only loads and reads the precise files relevant to the active sub-task.
- **Token Output is Bounded**: Code edits are short, targeted, and verified immediately.
- **Progress is Checkpointed**: Completed sub-tasks are committed to Git and logged in `docs/done.md`, preventing token loss if later tasks encounter issues.
- **Context Stays Crisp**: Hallucination and drift are eliminated because each step has a single, verifiable goal.

---

## 3. Mandatory Task Management File Protocol

To guarantee token economy, the agent must activate and maintain the following files on **every single prompt**:

| File                        | Purpose                                                                                                                                            | Retention               |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------- |
| `docs/tokens.md`            | Protocol specification defining the token economy and task decomposition rules.                                                                    | Permanent specification |
| `docs/tasks.md`             | Master backlog of active, pending, and upcoming numbered tasks and sub-tasks across the project. Completed items are migrated to `docs/done.md`.   | Active backlog          |
| `current-sub-task.md`       | **Strictly focused staging of the single sub-task currently being executed.** Updated on every single step.                                        | Active state indicator  |
| `temp.md`                   | **Ephemeral scratchpad** for drafting file edits, temporary checklists, raw diffs, or intermediate calculations. Avoids cluttering permanent docs. | Ephemeral / Scratchpad  |
| `docs/todo.md`              | High-level active sub-task synchronization mirror.                                                                                                 | Single active task      |
| `docs/done.md`              | Permanent verified changelog and archive of all completed tasks and sub-tasks.                                                                     | Permanent archive / log |
| `docs/self-verification.md` | Comprehensive self-verification protocol for automated test execution, screencast linking in README, and full sanity check audits.                 | Permanent specification |

---

## 4. Step-by-Step Prompt Execution Flow

On **every prompt**, the agent MUST execute the following sequence:

```
[Prompt Received]
       │
       ▼
1. Process tokens.md protocol
       │
       ▼
2. Decompose prompt into numbered sub-tasks in docs/tasks.md
       │
       ▼
3. Stage single active sub-task in current-sub-task.md (and docs/todo.md)
   (Use temp.md for draft notes / diff prep)
       │
       ▼
4. Implement atomic changes for ONLY the active sub-task
       │
       ▼
5. Run dedicated test & compile verification (compile_applet, lint_applet)
       │
       ▼
6. Git commit checkpoint (preserving token investments) & attempt git push
       │
       ▼
7. Move completed tasks/sub-tasks to docs/done.md (clean tasks.md)
       │
       ▼
   More sub-tasks? ──► [YES] ──► Advance current-sub-task.md
       │
      [NO]
       │
       ▼
8. Clean up temp.md & finalize prompt response
```

### Detailed Steps:

1. **Activate Token Economy on Prompt Entry**:
   - Never begin source edits immediately upon receiving a prompt.
   - Acknowledge and adhere to `tokens.md`.
2. **Decompose into Atomic Sub-tasks**:
   - Break the user prompt into numbered, verifiable sub-tasks in `docs/tasks.md`.
3. **Stage `current-sub-task.md` & `temp.md`**:
   - Update `current-sub-task.md` with the active sub-task title, description, and concrete action items.
   - Use `temp.md` as a scratchpad for intermediate notes if needed.
4. **Execute Atomic Edits**:
   - Modify only the files required for the current sub-task. Never perform opportunistic refactoring outside the sub-task scope.
5. **Verify with Dedicated Test**:
   - Run the dedicated test script, `compile_applet`, and `lint_applet`.
6. **Checkpoint Progress via Git**:
   - Run `git commit` to permanently preserve the work.
   - Attempt `git push` to synchronize remote branch and editor state.
7. **Complete, Move to done.md and Cycle**:
   - Move the completed subtask/task completely out of `current-sub-task.md`, `docs/todo.md`, and `docs/tasks.md` into `docs/done.md`.
   - Ensure the entry in `docs/done.md` records the accomplished feature, dedicated test command, and file scope.
   - Do not leave completed items lingering in `docs/tasks.md`; keep `docs/tasks.md` strictly as the active backlog of pending and upcoming items.
   - If further subtasks remain, advance `current-sub-task.md` to the next sub-task.
8. **Prompt Completion Audit Gate**:
   - Before completing the prompt turn, verify that EVERY task and subtask broken down in `docs/tasks.md` for this prompt has been fully implemented, tested with a dedicated test, marked complete `[x]`, and recorded in `docs/done.md`.
   - No task may remain abandoned or unfinished without explicit documentation.

---

## 5. Hotfix Workflow: Keeping Active Tasks on Hold

When an urgent issue, broken build, regression, or failing CI workflow is discovered during or between regular task executions:

```
[Regular Sub-task in Progress]
              │
              ▼ (Urgent issue / broken CI / regression discovered)
1. SUSPEND ACTIVE TASK:
   - Mark current subtask as [ON HOLD] in current-sub-task.md
   - Stash/preserve in-progress working state
              │
              ▼
2. STAGE HOTFIX:
   - Add "Hotfix: <issue>" to docs/tasks.md
   - Stage hotfix as active in current-sub-task.md and docs/todo.md
              │
              ▼
3. EXECUTE & VERIFY HOTFIX:
   - Minimal targeted fix
   - Dedicated verification test
   - compile_applet and lint_applet
              │
              ▼
4. COMMIT & LOG HOTFIX:
   - Dedicated git commit: "fix(hotfix): <description>"
   - Move hotfix directly out of current-sub-task.md, docs/todo.md, and docs/tasks.md into docs/done.md under ### Hotfix: <issue>
              │
              ▼
5. RESUME SUSPENDED TASK:
   - Restore held subtask to active status in current-sub-task.md
   - Resume execution until completed and moved to docs/done.md
```

### Hotfix Rules:

- **Never Mix Hotfixes with Feature Work**: Hotfixes must be executed in strict isolation to prevent compound bugs.
- **The Suspended Task Remains on Hold**: Do not abandon or delete the suspended task. It must resume immediately after the hotfix is verified and logged.
- **Hotfix Audit**: The hotfix must be documented in `docs/done.md` with its dedicated test validation.

---

## 6. Token Optimization Guidelines

- **Smart Read-Before-Write**: Never view entire files when viewing a 50-line section is sufficient. Use range parameters (`StartLine`, `EndLine`).
- **One Sub-Task at a Time**: Never combine multiple feature changes into one unverified step.
- **Fail Fast, Fix Fast**: If a test fails, diagnose the immediate cause within the active sub-task rather than restarting or rewriting unrelated modules.
- **Precedence**: This efficient token-saving workflow using `tokens.md`, `current-sub-task.md`, and `temp.md` governs agent task execution across all prompts.

---

## 7. Active Prompt Execution Log: Hotfix Completed & Task 107 Resumed

- **Hotfix: Fix apkUpdater.ts logger arguments and resolve Vite stale export errors** [COMPLETED & MIGRATED TO docs/done.md]:
  - Step 1: Fixed `logInfo` and `logError` parameter count and typing in `src/utils/apkUpdater.ts`.
  - Step 2: Validated exports in `src/lib/playback-preferences.ts` and `src/utils/apkUpdater.ts`.
  - Step 3: Restarted dev server to refresh Vite's module graph.
  - Step 4: Authored dedicated test `scripts/verify-hotfix-dev-exports-and-logger.ts` and verified with `npm run test:hotfix-dev-exports`.
  - Step 5: Verified clean `compile_applet` and `lint_applet`.
  - Step 6: Logged completion in `docs/done.md` and resumed active backlog.

- **Task 107**: Dedicated GitHub Actions Flow for Report Video Links Verification & README Error Sync [COMPLETED & MIGRATED TO docs/done.md]
  - Subtask 107.1: Enhance `scripts/update-readme.mjs` and report link validation to detect broken video links in `android-emulator-report.html` and report them dynamically on `README.md`. [DONE]
  - Subtask 107.2: Create dedicated workflow `.github/workflows/report-video-flow.yml` and update workflow coordination. [DONE]
  - Subtask 107.3: Add dedicated test `scripts/verify-report-video-links-and-readme-sync.ts`, update documentation in `docs/operations/ACTIONS.md` and `docs/files.md`, run verification, compile, lint, commit, push, and migrate to `docs/done.md`. [DONE]

- **Task 108**: Auto-Trigger Screencast Recording on 404 Video Detection & Artifact Recovery Pipeline [COMPLETED & MIGRATED TO docs/done.md]
  - Subtask 108.1: Update `.github/workflows/report-video-flow.yml` with automated dispatch of `emulation.yml` upon 404 detection. [DONE]
  - Subtask 108.2: Enhance `.github/workflows/deploy-demo.yml` artifact preservation to pull `android-emulator-video.mp4` from workflow artifacts. [DONE]
  - Subtask 108.3: Add automated verification test, compile, lint, commit, and migrate to `docs/done.md`. [DONE]

- **Task 110**: Enforce Rule: README.md Created by GitHub Actions, Do Not Copy When Syncing Git [COMPLETED & MIGRATED TO docs/done.md]
  - Subtask 110.1: Codify the rule in `AGENTS.md`, `docs/operations/ACTIONS.md`, `docs/self-verification.md`, and `docs/files.md`. [DONE]
  - Subtask 110.2: Author dedicated verification test `scripts/verify-readme-git-sync-rule.ts` and add `test:readme-git-sync-rule` in `package.json`. [DONE]
  - Subtask 110.3: Execute dedicated verification test, run compile_applet and lint_applet, checkpoint with commit/push, and migrate to `docs/done.md`. [DONE]

- **Task 111**: Android Emulator E2E Screenshots Along Test, Pre-Test Device Settings Navigation, and docs/e2e-android.md [COMPLETED & MIGRATED TO docs/done.md]
  - Subtask 111.1: Update app version to 1.0.17 across package.json, build.gradle.kts, appConfig.ts, apkUpdater.ts, and appSettings.ts. [DONE]
  - Subtask 111.2: Author docs/e2e-android.md detailing unmocked Android emulator testing, About Phone pre-test navigation, and milestone screenshots. [DONE]
  - Subtask 111.3: Update scripts/run-android-e2e.sh and scripts/android-e2e-assert.sh with About Phone navigation and step screenshot pipeline. [DONE]
  - Subtask 111.4: Author dedicated test scripts/verify-e2e-android-doc.ts, run verification, compile, lint, commit, push, and migrate to docs/done.md. [DONE]

- **Task 112**: Favorite Languages Default Checkbox On for Both Present in Table & TTS-Play [COMPLETED & MIGRATED TO docs/done.md]
  - Subtask 112.1: Update app version to 1.0.18 across package.json, build.gradle.kts, appConfig.ts, apkUpdater.ts, and appSettings.ts. [DONE]
  - Subtask 112.2: Implement default checkbox ON for both "present in table" (shown) and "tts-play" (spoken) for all favorite languages. [DONE]
  - Subtask 112.3: Author dedicated automated test scripts/verify-favorite-languages-default-checkboxes.ts and register npm test script. [DONE]
  - Subtask 112.4: Run verification tests, compile_applet, lint_applet, git commit checkpoint, attempt push, and migrate to docs/done.md. [DONE]

- **Task 113**: Subtitle Fetch Pacing, Strategy Options, Auto-TTS Language Name, Default Debug Mode & All Parser Criteria [COMPLETED & MIGRATED TO docs/done.md]
  - Subtask 113.1: Update app version to 1.0.19 across package.json, build.gradle.kts, appConfig.ts, apkUpdater.ts, and appSettings.ts. [DONE]
  - Subtask 113.2: Enable Debug Mode by default in appSettings and index.tsx, update verify-debug-mode-toggle.ts. [DONE]
  - Subtask 113.3: Set default parsing criteria to check all options (combining all categories: syntax, timing, alignment). [DONE]
  - Subtask 113.4: Add setting & implementation to TTS-play language name when a new subtitle is fetched. [DONE]
  - Subtask 113.5: Implement subtitle fetch window rate-limiting (max 1 fetch per window of X seconds) and strategy options (random, server-alternate, session, tlang/lang toggles) with documentation in docs/reliable-subtitles-fetching.md and AttemptOrderSettings. [DONE]
  - Subtask 113.6: Author dedicated automated test scripts/verify-fetch-strategy-and-defaults.ts, run compile_applet, lint_applet, git checkpoint, and migrate to docs/done.md. [DONE]

- **Task 114**: Prohibit Croned GitHub Actions from Modifying README.md, Indicate Failing Issues via Workflow Status Badges & Version Bump to 1.0.20 [COMPLETED & MIGRATED TO docs/done.md]
  - Subtask 114.1: Bump version to 1.0.20 across package.json, build.gradle.kts, appConfig.ts, apkUpdater.ts, and appSettings.ts. [DONE]
  - Subtask 114.2: Remove cron/scheduled automatic commits to README.md in report-video-flow.yml and workflows; configure check jobs to exit with failure status so workflow status badges dynamically reflect failing issues without modifying README.md. [DONE]
  - Subtask 114.3: Ensure README.md prominently features workflow status badges for real-time failure indication with zero merge conflicts. [DONE]
  - Subtask 114.4: Author dedicated automated test scripts/verify-no-cron-readme-updates.ts asserting no cron triggers commit to README and status badges reflect failures. [DONE]
  - Subtask 114.5: Update documentation in docs/operations/ACTIONS.md and docs/files.md. [DONE]
  - Subtask 114.6: Run test suite, compile_applet, lint_applet, git commit checkpoint, attempt git push, and migrate to docs/done.md. [DONE]

- **Task 115**: Continuous CI Monitoring & Real Actions Runs Health [COMPLETED & MIGRATED TO docs/done.md]
  - Subtask 115.1: Verify repository hygiene, architectural contracts & CI integrity across workflows and README.md. [DONE]
  - Subtask 115.2: Inspect and execute all verification suites: `test:doc-contracts`, `test:readme-links`, `test:no-cron-readme`, `test:e2e-report-links`, `test:report-video-links`, `test:client-spa`, and `test:hygiene`. [DONE]
  - Subtask 115.3: Verify app compilation (`compile_applet`) and linting (`lint_applet`), checkpoint progress, and migrate completed tasks to `docs/done.md`. [DONE]

- **Task 116**: Dedicated "Playground" Top Tab with Independent YouTube Player for Uninhibited Subtitle Switching & Interception (Version 1.0.21) [COMPLETED & MIGRATED TO docs/done.md]
  - Subtask 116.1: Update app version to 1.0.21 across `package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts`. [DONE]
  - Subtask 116.2: Create `src/components/VideoPlayground.tsx` providing an independent YouTube player container free from external pause/seek/TTS controls, with real-time detected subtitle stream telemetry, cue preview, and 1-click import actions. [DONE]
  - Subtask 116.3: Integrate top tabs in `src/routes/index.tsx` (Viewer vs Playground), pausing background timers and TTS loops when on Playground, and wiring detected captions into the central catalog. [DONE]
  - Subtask 116.4: Author dedicated automated test `scripts/verify-video-playground-tab.ts` and register `test:playground-tab` script in `package.json`. [DONE]
  - Subtask 116.5: Update documentation in `docs/files.md`, `docs/designs/DESIGN_CONTROLS_VIEW.md`, `docs/designs/DESIGN_PLAYER_PROVIDER.md`, and `docs/operations/DEBUG.md`. [DONE]
  - Subtask 116.6: Run test suites, compile_applet, lint_applet, commit checkpoint, and migrate Task 116 to `docs/done.md`. [DONE]

- **Task 117**: Comprehensive Test Suite Audit & Fix-Testing-to-Pass (Version 1.0.21) [COMPLETED & MIGRATED TO docs/done.md]
  - Subtask 117.1: Run inventory of automated verification scripts to audit test suite status and identify any failing tests. [DONE]
  - Subtask 117.2: Apply minimal targeted fixes for identified test failures to achieve 100% test pass rate (restore complete README.md architectural structure and contracts). [DONE]
  - Subtask 117.3: Verify all relevant test suites pass, confirm clean compilation (`compile_applet`) and zero-error linting (`lint_applet`). [DONE]
  - Subtask 117.4: Commit progress via git, attempt git push, and migrate Task 117 to `docs/done.md`. [DONE]

- **Task 118**: Video Playground Playback Speed Controls, JSON Telemetry Export & Seamless Timestamp Handoff to Synchronized Viewer (Version 1.0.22) [COMPLETED & MIGRATED TO docs/done.md]
  - Subtask 118.1: Update app version to 1.0.22 across `package.json`, `android-shell/app/build.gradle.kts` (versionCode 10022, versionName "1.0.22"), `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts`. [DONE]
  - Subtask 118.2: Implement Video Playground playback speed selector (0.5x to 2.0x), raw JSON / cue telemetry clipboard export, and 1-click seamless timestamp handoff to Synchronized Viewer tab in `src/components/VideoPlayground.tsx` and `src/routes/index.tsx`. [DONE]
  - Subtask 118.3: Author dedicated automated test `scripts/verify-video-playground-enhancements.ts`, register `test:playground-enhancements` in `package.json`, and update architectural documentation in `docs/files.md`, `docs/designs/DESIGN_CONTROLS_VIEW.md`, and `docs/designs/DESIGN_PLAYER_PROVIDER.md`. [DONE]
  - Subtask 118.4: Execute test suites, verify clean compilation (`compile_applet`) and zero-error linting (`lint_applet`), commit progress via git, attempt push, and migrate Task 118 to `docs/done.md`. [DONE]

- **Task 119**: Strict Prohibition & Verification of Zero GitHub Actions Cron Jobs Across All Workflows (Version 1.0.23) [COMPLETED & MIGRATED TO docs/done.md]
  - Subtask 119.1: Update app version to 1.0.23 across `package.json`, `android-shell/app/build.gradle.kts` (versionCode 10023, versionName "1.0.23"), `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts`. [DONE]
  - Subtask 119.2: Audit all `.github/workflows/*.yml` files to confirm strictly zero `schedule:` / cron triggers, and strengthen `scripts/verify-no-cron-readme-updates.ts` to assert that zero workflows in `.github/workflows/` contain any `schedule:` or cron configurations. [DONE]
  - Subtask 119.3: Update architectural documentation in `AGENTS.md`, `docs/operations/ACTIONS.md`, and `docs/files.md` formalizing the zero-cron policy. [DONE]
  - Subtask 119.4: Run the dedicated verification test `npm run test:no-cron-readme`, verify app compilation (`compile_applet`) and zero-error linting (`lint_applet`), checkpoint via git, and migrate Task 119 to `docs/done.md`. [DONE]

- **Hotfix: Fix TDZ ReferenceError for rows in src/routes/index.tsx** [COMPLETED & MIGRATED TO docs/done.md]
  - Step 1: Relocate `handleSwitchToViewerAtTime` below `const rows = useMemo(...)` declaration in `src/routes/index.tsx`. [DONE]
  - Step 2: Author dedicated automated test `scripts/verify-hotfix-rows-initialization.ts` and register npm script. [DONE]
  - Step 3: Verify clean build (`compile_applet`), zero-error linting (`lint_applet`), commit progress, and migrate Hotfix to `docs/done.md`. [DONE]

- **Task 120**: Comprehensive Testing & Screencast Video Pipeline Verification (Version 1.0.23) [ON HOLD - AWAITING USER CONFIRMATION]
  - Subtask 120.1: [AWAITING CONFIRMATION] Audit and address broken video link detection in `android-emulator-report.html` (Run 38666582894) by coordinating emulator recording workflow dispatch. [PENDING]
  - Subtask 120.2: [AWAITING CONFIRMATION] Execute Playwright and web companion E2E test suites in dedicated isolated step. [PENDING]
  - Subtask 120.3: [AWAITING CONFIRMATION] Execute full unit and verification test suite inventory sequentially 1 sub-task at a time with dedicated checkpoints. [PENDING]









