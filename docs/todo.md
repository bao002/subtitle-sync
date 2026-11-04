# Active Subtask Mirror (`docs/todo.md`)

- **Status**: [IN_PROGRESS]
- **Active Task**: Task 304: Ensure GitHub Actions Work Correctly & E2E Tests Recognize Application Crashes
- **Sub-task**: 304.1 - Fix GitHub Actions workflows alignment in `scripts/verify-workflows-alignment.ts` (include `version-sync.yml`) and ensure `web.yml` properly executes Playwright test suite for web and emulation specs.
- **Validation**: `npm run test:workflows`, dedicated test `scripts/verify-github-actions-and-e2e-crash-detection.ts`, `compile_applet`, `lint_applet`.
