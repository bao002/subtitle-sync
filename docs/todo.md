# Active Subtask Mirror (`docs/todo.md`)

- **Status**: [ACTIVE]
- **Active Task**: Task 356 (Prompt 121): Fix Learning Goals View Disappearing Sometimes
  - **Subtask 356.1**: Remove restrictive stage conditions in `src/routes/index.tsx` so `#stage-2-learning-goals-card` is permanently visible whenever the Languages panel is viewed or opened.
  - **Subtask 356.2**: Verify Beginner Mode learning goals parity and persistence across playback states.
  - **Subtask 356.3**: Implement dedicated automated test script `scripts/verify-learning-goals-persistent-visibility.ts`, bump version to `2.1.53`, sync version, compile, lint, commit, and migrate to `docs/done.md`.
