# Active Subtask Mirror (`docs/todo.md`)

- **Status**: [ACTIVE]
- **Active Task**: Task 359 (Prompt 126): Dedicated Learning Stage with Punchable Word Balloons Exposing Translation
  - **Subtask 359.1** [ACTIVE]: Create dedicated component `src/components/WordBalloonLearningView.tsx` with floating balloon styling, punch/pop animations, Web Audio pop sound effect, word translation exposure, score tracking, TTS pronunciation, and sentence navigation.
  - **Subtask 359.2** [PENDING]: Integrate the dedicated learning stage (Stage 5 "Word Balloons Learning" / `#stage-step-learning`) in `src/routes/index.tsx` stage stepper, and add a toggle button in `video-display-controls` to switch between Video player and Word Balloon Learning view instead of the video player.
  - **Subtask 359.3** [PENDING]: Ensure 100% parity in Beginner Mode (`BeginnerVideoTab.tsx` / `BeginnerFlowContainer.tsx`) with toggle in `video-display-controls` to view Word Balloons Learning instead of the video player.
  - **Subtask 359.4** [PENDING]: Add dedicated automated test `scripts/verify-word-balloon-learning-stage.ts` (`npm run test:word-balloon-learning`), bump version to `2.1.57` (code `20157`), compile, lint, commit, and migrate Task 359 to `docs/done.md`.
