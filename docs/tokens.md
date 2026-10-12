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

| File | Purpose | Retention |
| :--- | :--- | :--- |
| `docs/tokens.md` | Protocol specification defining the token economy and task decomposition rules. | Permanent specification |
| `docs/tasks.md` | Master backlog of active, pending, and upcoming numbered tasks and sub-tasks across the project. Completed items are migrated to `docs/done.md`. | Active backlog |
| `current-sub-task.md` | **Strictly focused staging of the single sub-task currently being executed.** Updated on every single step. | Active state indicator |
| `temp.md` | **Ephemeral scratchpad** for drafting file edits, temporary checklists, raw diffs, or intermediate calculations. Avoids cluttering permanent docs. | Ephemeral / Scratchpad |
| `docs/todo.md` | High-level active sub-task synchronization mirror. | Single active task |
| `docs/done.md` | Permanent verified changelog and archive of all completed tasks and sub-tasks. | Permanent archive / log |
| `docs/self-verification.md` | Comprehensive self-verification protocol for automated test execution, screencast linking in README, and full sanity check audits. | Permanent specification |

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
