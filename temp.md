# Scratchpad: Task 93 Error Reporting & AI Reproduction Fix Engine

## Goals:
1. `scripts/generate-error-report.ts`:
   - Runs a command (or reads a log file / error context).
   - Generates `error.log`.
   - Content of `error.log`:
     - Executive summary of the failure.
     - Environment metadata: Node version, OS, git commit, dirty working tree.
     - Minimal Reproduction Steps (exact commands to run: e.g. `npm run test:xyz`).
     - Error telemetry: Stderr, stdout tails, exit code, stack traces.
     - Root-cause diagnosis & suggested fix heuristics (e.g. ESLint prettier format, missing dependency, failing assertion).
     - Standardized AI Studio Prompt block (`### AI Studio Diagnostic Fix Prompt`) ready to be copy-pasted into the chat prompt to fix the issue.
2. `.github/workflows/error-reporting.yml`:
   - Runs on push, pull_request, workflow_dispatch, and workflow_run.
   - Runs verification steps: lint, build, core tests.
   - If any step fails:
     - Automatically invokes `scripts/generate-error-report.ts`.
     - Appends `error.log` to `$GITHUB_STEP_SUMMARY`.
     - Uploads `error.log` as a build artifact via `actions/upload-artifact@v4`.
