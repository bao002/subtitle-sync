# Current Subtask

## Subtask 69.1: Hide Subtitles Table View During Loading/Error States and Render Only When Legitimate JSON3 Subtitles Are Fetched

- Update `src/routes/index.tsx` so the subtitles table view (`panelId === "subtitles"`) does not waste space rendering loading placeholders ("Loading subtitles…", "Waiting for subtitles…") or error states.
- Enforce `hasLegitimateSubtitles` so the subtitles table view accordion section is only rendered when legitimate JSON3 subtitles are fetched with non-empty cues (`rows.length > 0` and `cols.length > 0`).
- Update `cols` calculation and individual cell rendering in `SubtitleRow` so no column or cell wastes space with loading or error placeholders.
- Create dedicated verification test `scripts/verify-subtitles-table-legitimate-json3-only.ts` and register `npm run test:subtitles-table-legitimate-only` in `package.json`.
- Document in `docs/files.md`, run verification tests, compile applet (`compile_applet`), lint applet (`lint_applet`), commit changes, and attempt push.
