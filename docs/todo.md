# Active Task Mirror (`docs/todo.md`)

## Subtask 107.1: Enhance `scripts/update-readme.mjs` and report link validation to detect broken video links in `android-emulator-report.html` and report them dynamically on `README.md`

- Inspect report HTML files (`public/android-emulator-report.html` and `public/android/index.html`) for referenced video screencast assets.
- Detect missing or broken video sources (e.g. `./screenshots/android-emulator-video.mp4` when no video artifact exists or remote video returns 404).
- Ensure that if broken video links are detected, `scripts/update-readme.mjs` automatically sets CI status to `failure`, lists the broken video link in the failure breakdown, and formats a copy-pasteable AI fix prompt in `README.md`.
