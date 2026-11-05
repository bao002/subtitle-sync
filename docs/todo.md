# Active Subtask Mirror (`docs/todo.md`)

- **Status**: [IN_PROGRESS]
- **Active Task**: Task 312 (Prompt 82): Remove Non-Working Alternating Fetch Plan Technique
- **Sub-task**: 312.1 - Remove `server_alternate` mode and alternating plan references from `src/lib/subtitle-fetch-plan.ts`, updating `FetchStrategyMode` to `"ordered" | "random"`, and cleaning up `DEFAULT_FETCH_STRATEGY_CONFIG`.
- **Validation**: `scripts/verify-auto-fetching-debug-experimental-stuff.ts`, `compile_applet`, `lint_applet`.
