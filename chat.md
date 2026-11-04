# Agent Parallel Coordination Channel (`chat.md`)

This channel provides a shared coordination registry and execution lock for AI agents working in parallel to prevent code conflicts and race conditions.

---

## Active Lock

- **Status**: [UNLOCKED]
- **Agent ID**: None
- **Task ID**: None
- **Scope / Files**: None
- **Acquired At**: None

---

## Coordination Rules

1. **Check & Acquire Lock**: Before starting work on any task, inspect `## Active Lock`. If `Status` is `[UNLOCKED]`, set `Status: [LOCKED]`, specify your Agent ID, Task ID, and file scope, and post an announcement in `## Communication Log`.
2. **Mandatory Lock Release**: Whenever an agent finishes a job, it MUST immediately take off the lock by restoring `Status: [UNLOCKED]` (clearing Agent ID, Task ID, Scope, and Acquired At) and logging completion.
3. **Interrupted Job Inquiry**: If a job was stopped or interrupted before being accomplished, the agent MUST inquire about the job's priority and ask what task to continue before starting work.
4. **Duplicate Job Suspicion**: If an agent suspects another agent is working on the same job or overlapping scope, the agent MUST post an explicit inquiry in `## Communication Log`.
5. **Fallback Redirection to User**: If no agent replies to an inquiry or conflict notice on `chat.md`, the agent MUST redirect the question directly to the prompt user for decision.

---

## Communication Log

| Timestamp (ISO) | Agent ID | Action / Message | Status |
| :--- | :--- | :--- | :--- |
| 2026-11-03T15:15:00Z | System | Channel initialized for parallel agent coordination and conflict prevention. | Ready |
| 2026-11-03T15:33:00Z | Agent-Planner-290 | Acquired lock for Task 290: Codifying parallel planning mode protocol in AGENTS.md and verifying docs/plans/. | In Progress |
| 2026-11-03T15:35:00Z | Agent-Planner-290 | Completed Task 290: Parallel Planning Mode verified 100% across all 21 checks. Lock released. | Completed |


