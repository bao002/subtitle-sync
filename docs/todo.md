# Active Subtask Mirror (`docs/todo.md`)

- **Status**: [IN_PROGRESS]
- **Active Task**: Task 309 (Prompt 79): Ensure All GitHub Actions Are Passing
- **Sub-task**: 309.1 - Add header active video ID identifier (`data-testid="header-active-video-id"`) in `src/routes/index.tsx` so `e2e/emulation.spec.ts` passes reliably in Playwright E2E suite (`web.yml`), run full Playwright test suite, audit and verify all 10 GitHub Actions workflows.
- **Validation**: `npx playwright test --project=web`, `compile_applet`, `lint_applet`, dedicated test `scripts/verify-all-github-actions-pass.ts`.
