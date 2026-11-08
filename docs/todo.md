# Active Subtask Mirror (`docs/todo.md`)

- **Status**: [PENDING]
- **Active Task**: Task 312 (Prompt 82): Remove Non-Working Alternating Fetch Plan Technique
  - **Subtask 312.1**: Remove `server_alternate` mode and alternating plan references from `src/lib/subtitle-fetch-plan.ts`, updating `FetchStrategyMode` to `"ordered" | "random"`, and cleaning up `DEFAULT_FETCH_STRATEGY_CONFIG`.
  - **Subtask 312.2**: Update `src/components/FloatingSubtitleRetryIndicator.tsx` to cycle only between `random` and `ordered` modes, removing `server_alternate` option and tooltip.
  - **Subtask 312.3**: Update `src/components/AttemptOrderSettings.tsx` to remove `server_alternate` from strategy select dropdown and remove obsolete `useServerAlternate` checkbox.
  - **Subtask 312.4**: Update test suite, bump version, compile, lint, commit, and migrate Task 312 to `docs/done.md`.
