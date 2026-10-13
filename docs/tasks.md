# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are moved to `docs/done.md`.

## Task 107: Dedicated GitHub Actions Flow for Report Video Links Verification & README Error Sync

- [ ] **Subtask 107.1: Enhance `scripts/update-readme.mjs` and report link validation to detect broken video links in `android-emulator-report.html` and report them dynamically on `README.md`**:
  - Scan `public/android-emulator-report.html` and `public/android/index.html` for `<source src="...">` video links and download buttons.
  - Check local candidate locations and, when evaluating GitHub Pages URLs, detect broken or pending video screencast assets.
  - Automatically flag broken video links in `scanReadmeBrokenLinks` / report diagnostics, setting CI status to `failure` and generating a copy-pasteable AI fix prompt in `README.md`.
- [ ] **Subtask 107.2: Enhance `android-emulator-report.html` & `android/index.html` player resilience and update GitHub Actions workflows**:
  - Add client-side video error handling with alert card linking to README.md diagnostic section.
  - Update `.github/workflows/update-readme.yml` and `integrity.yml` to run dedicated report video and asset validation.
- [ ] **Subtask 107.3: Add dedicated test script, update documentation, and perform verification**:
  - Create `scripts/verify-report-video-links-and-readme-sync.ts` and add `npm run test:report-video-links`.
  - Update `docs/operations/ACTIONS.md`, `docs/android.md`, `docs/self-verification.md`, and `docs/files.md`.
  - Run all tests, lint, compile, git commit, push, and migrate Task 107 to `docs/done.md`.
