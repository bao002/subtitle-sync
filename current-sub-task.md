# Current Subtask (`current-sub-task.md`)

## Active Subtask: 113.5 Subtitle fetch window rate-limiting, strategy expansion & docs
- **Task**: Task 113 - Subtitle Fetch Pacing, Strategy Options, Auto-TTS Language Name, Default Debug Mode & All Parser Criteria
- **Target Files**:
  - `src/utils/subtitleRequestQueue.ts`: Enforce window frame rate-limiting (never >1 fetch in window frame of X seconds) tracking `lastFetchTimestamp`.
  - `src/lib/subtitle-fetch-plan.ts`: Add `FetchStrategyMode` ("ordered" | "random" | "server_alternate"), `SubtitleFetchStrategyConfig`, and `buildActiveAttemptOrder`.
  - `src/components/AttemptOrderSettings.tsx`: Add UI controls for strategy modes, server modes, session/anon toggles, and detailed explanatory cards.
  - `docs/reliable-subtitles-fetching.md`: Update documentation explaining the rate-limiting window frame and strategy configuration options.
- **Status**: [IN PROGRESS]
