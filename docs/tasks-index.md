# Project Tasks Index (`docs/tasks-index.md`)

This index provides a structured, high-level map of project tasks and milestones, cleanly separating task navigation from the token economy rules in `docs/tokens.md`.

---

## Active & Pending Tasks
- **Active Backlog**: See [`docs/tasks.md`](tasks.md) for the active, pending, and upcoming tasks for the current prompt.
- **Active Staging Indicator**: See [`current-sub-task.md`](../current-sub-task.md) for the single sub-task currently being executed.

---

## Completed Tasks Archive
All completed tasks with their detailed summaries, code changes, and test verification outcomes are permanently preserved in [`docs/done.md`](done.md).

### High-Level Milestone Groupings in `docs/done.md`:
1. **Core TimedText Caption Discovery & Interception (Tasks 1–40)**:
   - YouTube json3 timedtext interception, WebView bridge, OkHttp session replay, and raw subtitle acquisition.
2. **Subtitle Parsing, Phonetic Alignment & Punctuation (Tasks 41–70)**:
   - Multi-language tokenization, acoustic timing vs punctuation splitting, sentence boundary resolution, and RTL script formatting.
3. **Android Shell & Emulator E2E Suite (Tasks 71–95)**:
   - Native OkHttp client, WebView user-agent sanitization, API 34 emulator automation, and screenrecord MP4 video pipelines.
4. **Reliable Fetching, Anti-Bot & Fallback Strategies (Tasks 96–115)**:
   - Fallback sequencing (`tlang` translation vs `lang` track replacement), pacing jitter, rate limiting, and cache invalidation gates.
5. **UI Architecture, Playground & Multi-Language Viewer (Tasks 116–122)**:
   - Independent Video Playground tab, single-row web-demo input bar preservation, state isolation, and custom subtitles URLs.
6. **Token Economy Optimization & Lean Workflow (Tasks 123–Present)**:
   - Streamlined `docs/tokens.md`, zero task-dump hygiene, and lightweight agent task management.

---

## Agent Guidance
- **Token Efficiency**: Do NOT read full task histories during routine prompt preface.
- **On-Demand Context**: Only look up specific past tasks in `docs/done.md` if directly relevant to a bug investigation or requirement inquiry.
