# Current Subtask (`current-sub-task.md`)

- **Task**: 242 - Consolidate Codespaces, Docker, and E2E guidance
- **Subtask**: 242.2 - Reusable experiment summaries
- **Status**: [IN PROGRESS]
- **Hypothesis**: The previous browser test failure was environmental, not app behavior: host Chromium lacked system libraries, while the matching official Playwright container passed the same E2E check.
- **Focused check**: `npm run test:md` after adding the three docs, plus targeted command/path checks against `docker/manage.sh` and the documented successful Docker E2E invocation.
- **Next Action**: Add Codespaces, Docker, and general E2E runbooks summarizing observed failures, causes, proven resolutions, and Android tooling limits.
