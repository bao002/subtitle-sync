# Token Economy Architecture & Task Decomposition Protocol (tokens.md)

This document establishes the lightweight, high-efficiency operational protocol for maximizing token usage efficiency across all prompts and automated agent execution cycles without heavy processing overhead.

---

### Current Prompt Routing

- Prompt 162 (Resume Backlog - Learning Goals Row-Criteria Per Language - Subtask 387.2):
  - Task 387 [ACTIVE]: Chapter 2 (from Prompt 154) - Learning Goals Row-Criteria Per Language. Update `LearningGoalsFiltersPanel.tsx` to provide per-language row-criteria controls with reset options and active status, integrate per-language row-criteria into translation and TTS processing in `src/routes/index.tsx`, verify with dedicated test `scripts/verify-learning-goals-row-criteria-per-language.ts`.
- Prompt 161 (Hotfix: Fix Vite Reload, Module Import & Syntax Errors):
  - Hotfix [COMPLETED & VERIFIED]: Diagnosed Vite client reload logs caused by rapid multi-module invalidations, restarted dev server to clean module cache, audited HTTP 200 transforms across all 17 target components, optimized `AGENTS.md` size to 20,550 bytes (< 21,000 bytes budget) with 21/21 contract checks passing, added dedicated test `scripts/verify-vite-reload-and-modules-hotfix.ts`, bumped version to 2.1.86.
- Prompt 160 (Hotfix: Fix Duplicate React Key Error for "pt-BR"):
  - Hotfix [COMPLETED & VERIFIED]: Deduplicated `targetLanguages`, `favoriteLanguages`, and `learningLanguages` in `src/routes/index.tsx`, `LearningGoalsFiltersPanel.tsx`, `appSettings.ts`, `BeginnerFavoriteLanguageSelector.tsx`, and `GlobalFavoriteLanguagesPanel.tsx`, added dedicated test `scripts/verify-unique-language-keys.ts`, bumped version to 2.1.85.
- Prompt 159 (Hotfix: Fix Syntax Error in src/routes/index.tsx - Missing Closing Tag for <div>):
  - Hotfix [COMPLETED & VERIFIED]: Fixed unclosed `<div id="stage-2-language-ratios-container">` in `src/routes/index.tsx`, fixed `isAudioTrackMode: audioTrackMode` in state provider registration, added `return fallback;` to `getEffectiveLanguageMaxWords`, bumped version to 2.1.84.
- Prompt 158 (Resume Backlog - Learning Goals Folded Accordions & Row-Criteria Per Language):
  - Task 386 [COMPLETED & VERIFIED]: Chapter 1 (from Prompt 154) - Learning Goals Folded Accordions with Timeout (`LearningGoalAccordion` with `defaultOpen={false}`, 10s auto-fold hourglass indicator, pin toggle, 100% parity across Advanced and Beginner modes).
  - Task 387 [ACTIVE]: Chapter 2 (from Prompt 154) - Learning Goals Row-Criteria Per Language (max words limit, complete sentence punctuation filter per language, reset options, 100% parity across modes).
  - Task 388 [PENDING]: Chapter 3 (from Prompt 154) - Subtitles Table View Visible Global Row-Criteria with Default Language Filtering.
- Prompt 157 (Bug Report / Diagnostic Error Log: Register State Provider, Prioritize Errors & Cap Reproduction Sequence):
  - Hotfix [COMPLETED & VERIFIED]: Fixed `[State provider not registered]` by registering live app state provider in `src/routes/index.tsx`, prioritized active errors at `## 0. Active Errors & Failures` at top of diagnostic report in `src/utils/logBuffer.ts`, capped reproduction sequence to prevent clipboard truncation (>65KB), mirrored network requests into `logBuffer`, bumped version to 2.1.82.
- Prompt 156 (Replace Word Balloons Stage with Subtitles Sentence & Word Learning Game):
  - Task 390 [COMPLETED & VERIFIED]: Replace Word Balloons Stage with interactive Subtitles Sentence & Word Learning Game (Sentence Builder, Word Match, Missing Word, and Word Discovery) driven by current subtitles, with zero video distraction.
- Prompt 155 (Hotfix: Vite Reload Failure & Undeclared Identifiers in index.tsx):
  - Hotfix [COMPLETED & VERIFIED]: Resolved undeclared identifiers `isPlaying` and `handlePause` in `src/routes/index.tsx`, verified dev server transforms, clean module imports, bumped version to 2.1.80.
- Prompt 154 (Disable Readme Flow, Learning Goals Folded Accordions with Timeout, Per-Language Row-Criteria, Subtitles Table Global Row-Criteria Default Lang Filter, Word Balloons Stage Video Removal):
  - Task 385 [COMPLETED & VERIFIED]: Chapter 0 - Disable GitHub Actions Readme Workflow (`update-readme.yml`).
  - Task 386 [ACTIVE]: Chapter 1 - Learning Goals Folded Accordions with Timeout (`AccordionSection`).
  - Task 387 [PENDING]: Chapter 2 - Learning Goals Row-Criteria Per Language.
  - Task 388 [PENDING]: Chapter 3 - Subtitles Table View Visible Global Row-Criteria with Default Language Filtering.
  - Task 389 [SUPERSEDED by Task 390]: Chapter 4 - Word Balloons Stage Video Removal.
- Prompt 153 (Hotfix: Fix Maximum Update Depth Exceeded in React Components):
  - Hotfix [COMPLETED & VERIFIED]: Fixed recursive `useEffect` / `setState` triggering "Maximum update depth exceeded" in `src/routes/index.tsx`.
- Prompt 152 (Fix GitHub Actions Demo Website Deployment):
  - Task 384 [COMPLETED & VERIFIED]: Fixed concurrency in `deploy-demo.yml` (`cancel-in-progress: false`, scoped by event_name), removed APK release trigger, restored minimalist README, bumped version to 2.1.78.
- Resumed Active Backlog: Task 380 [PENDING], Task 381 [PENDING], Task 372 [PENDING] in [`docs/tasks.md`](tasks.md).



---

## 1. The Token Economy Problem: Why Big Tasks Fail

In complex full-stack applications, processing broad or monolithic tasks directly in a single sprawling execution pass leads to critical failure modes:

1. **Context Bloat & Token Exhaustion**: Loading massive files, long task histories, and sprawling outputs rapidly burns context windows.
2. **Abrupt Execution Termination**: Running out of tokens mid-turn leaves unfinished edits and a broken repository.
3. **Compound Regression Cascades**: Changing multiple distinct subsystems simultaneously makes diagnosis expensive in tokens.
4. **Waste of Prior Token Expenditure**: Without incremental git commits and task checkpoints, any subsequent failure wipes out prior progress.

---

## 2. The Core Principle: Granular Decomposition Maximizes Token Efficiency

Current task state is maintained in `current-sub-task.md`; this protocol contains no task history.

> **Golden Rule**: **Always break every user prompt into small, isolated sub-tasks and stage `current-sub-task.md` on every step.**

- **Token Input is Minimized**: Load only files strictly relevant to the active sub-task.
- **Token Output is Bounded**: Code edits are targeted and verified immediately.
- **Progress is Checkpointed**: Completed sub-tasks are committed to Git and logged in `docs/done.md`.
- **Context Stays Crisp**: Each step maintains a single, verifiable goal.
- **Validation is Discriminating**: Stage one falsifiable behavior hypothesis and the cheapest focused check alongside each active sub-task.
- **Experiments are Reusable**: Record environment, exact command, observed failure or result, resolution, and limitations in the relevant runbook.
- **Rules & Configuration Economy**: Keep top-level instruction files like `AGENTS.md` lean (< 20KB) to prevent platform rule truncation and wasted context window tokens. Detailed optimization guidelines live in [`docs/suggestions.md`](suggestions.md).

---

## 3. Mandatory Task Management File Protocol

To guarantee token economy without heavy processing, maintain the following files on **every single prompt**:

| File                        | Purpose                                                                                                                                            | Retention               |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------- |
| `docs/tokens.md`            | Protocol specification defining the token economy and task decomposition rules.                                                                    | Permanent specification |
| `docs/tasks.md`             | Master backlog of active, pending, and upcoming numbered tasks and sub-tasks across the project. Completed items are migrated to `docs/done.md`.   | Active backlog          |
| `docs/tasks-index.md`       | High-level index of project milestones and links to backlog & completed archives.                                                                  | Permanent index         |
| `current-sub-task.md`       | **Strictly focused staging of the single sub-task currently being executed.** Updated on every single step.                                        | Active state indicator  |
| `temp.md`                   | **Ephemeral scratchpad** for drafting file edits, temporary checklists, raw diffs, or intermediate calculations. Avoids cluttering permanent docs. | Ephemeral / Scratchpad  |
| `docs/todo.md`              | High-level active sub-task synchronization mirror.                                                                                                 | Single active task      |
| `docs/done.md`              | Permanent verified changelog and archive of all completed tasks and sub-tasks.                                                                     | Permanent archive / log |
| `docs/self-verification.md` | Comprehensive self-verification protocol for automated test execution, screencast linking in README, and full sanity check audits.                 | Permanent specification |
| `docs/suggestions.md`       | Ranked optimization steps, feasibility analysis, and rule size monitoring guidelines for instruction files.                                        | Permanent specification |

---

## 4. Step-by-Step Prompt Execution Flow

```
[Prompt Received] ──► 1. Process tokens.md (lean preface)
        │
        ▼
2. Decompose prompt into numbered sub-tasks in docs/tasks.md
        │
        ▼
3. Stage single active sub-task in current-sub-task.md & docs/todo.md (use temp.md for draft notes)
        │
        ▼
4. Implement atomic changes for ONLY the active sub-task
        │
        ▼
5. Run dedicated test & compile verification (compile_applet, lint_applet)
        │
        ▼
6. Git commit checkpoint & attempt git push
        │
        ▼
7. Move completed tasks/sub-tasks to docs/done.md (keep docs/tasks.md clean)
        │
        ▼
   More sub-tasks? ──► [YES] ──► Advance current-sub-task.md
        │ [NO]
        ▼
8. Prompt Completion Audit Gate: Verify EVERY task is complete & tested; clean temp.md
```

### Recovery After an Interrupted Session

- On resumption, read `AGENTS.md`'s `## Resume after interruption` section first, then inspect `current-sub-task.md`, `docs/todo.md`, and the active entries in `docs/tasks.md`.
- Treat `git status` and the relevant `git diff` as authoritative evidence of uncommitted work. Preserve existing edits; do not reset, overwrite, or assume they are complete.
- Record the exact next action, validation still needed, and any blockers in `current-sub-task.md` before continuing. If the active state is missing or inconsistent, reconcile it from the task backlog, scratchpad, and worktree, and explicitly note any uncertainty rather than guessing.
- Do not resume an item already marked complete in `docs/done.md`; reconcile stale backlog or mirror entries against the archived verification record before selecting the next task.
- Update `AGENTS.md`'s `## Last raw prompt` only with the exact latest user message; do not use that section as a substitute for durable task progress notes.

### Protocol Requirements:

- **Activate Token Economy on Prompt Entry**: Acknowledge `tokens.md` as an ultra-fast preface; never begin un-staged source edits.
- **Atomic Sub-tasks in Backlog**: Numbered sub-tasks belong in `docs/tasks.md`.
- **Numbered Prompt Routing**: Create one ordered backlog task per numbered user item; put explicitly deferred items only in the Later Tasks sections, and stage the earliest active item before implementation.
- **Requested Commit/Push**: When explicitly requested, commit and push only after all active tasks pass focused validation and required build/lint checks; never rewrite published history.
- **Stage `current-sub-task.md`**: Focus exclusively on the active sub-task.
- **Move to done.md and Cycle**: Move the completed subtask/task completely out of `current-sub-task.md`, `docs/todo.md`, and `docs/tasks.md` into `docs/done.md`. keep `docs/tasks.md` strictly as the active backlog of pending and upcoming items.
- **Prompt Completion Audit Gate**: Before completing any prompt, verify that EVERY task and subtask planned for the prompt has been fully implemented, tested with a dedicated test, marked complete `[x]`, and recorded in `docs/done.md`.

---

## 5. Hotfix Workflow: Keeping Active Tasks on Hold

When an unexpected defect, broken build, regression, or failing CI flow arises during active development:

1. **SUSPEND ACTIVE TASK**: Place the active task/sub-task in `current-sub-task.md` **ON HOLD** (marked `[ON HOLD]`).
2. **STAGE HOTFIX**: Create `Hotfix: <issue>` in `docs/tasks.md`, `current-sub-task.md`, and `docs/todo.md`.
3. **EXECUTE IN ISOLATION**: Implement minimal targeted fix, verify with dedicated test, compile, and lint.
4. **COMMIT & MIGRATE**: Commit checkpoint (`fix(hotfix): <description>`), attempt push, and move hotfix out of `current-sub-task.md`, `docs/todo.md`, and `docs/tasks.md` into `docs/done.md` under `### Hotfix: <issue>`.
5. **RESUME SUSPENDED TASK**: Restore held subtask to active status in `current-sub-task.md` and resume execution.

---

## 6. Token Optimization Guidelines

- **Smart Read-Before-Write**: Never view entire files when a targeted slice is sufficient.
- **One Sub-Task at a Time**: Never combine multiple unverified features.
- **Default Mode Coverage**: Follow [`AGENTS.md`](../AGENTS.md): unless explicitly scoped otherwise, apply behavior and settings changes to Beginner and Advanced modes and test both.
- **Fail Fast, Fix Fast**: Diagnose issues locally within the active subtask scope.
- **Precedence**: This lightweight workflow governs agent task execution across all prompts.

---

## 7. Zero Task Overhead & Task Index Delegation

- **No Historical Task Logs in tokens.md**: `docs/tokens.md` strictly defines the operational efficiency protocol and contains zero task logs.
- **Delegation to tasks.md & tasks-index.md**:
  - Active prompt backlog is staged exclusively in [`docs/tasks.md`](tasks.md).
  - High-level project milestones are indexed in [`docs/tasks-index.md`](tasks-index.md).
  - Permanent completed archives reside exclusively in [`docs/done.md`](done.md).
- **Fast Agent Overview**: The agent reviews this concise specification in seconds using minimal tokens before jumping into action.
