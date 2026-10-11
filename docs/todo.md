# Current Subtask

## Subtask 71.3: Provide Interactive Timing vs Punctuation Splitting Lab & Learning Interface

- Build modular component `src/components/ParserTimingLab.tsx` and integrate into the Parser accordion panel in `src/routes/index.tsx`.
- Provide live visual metrics comparing pure punctuation vs timing-enhanced splitting (sentence counts, average duration, run-on prevention count, parallel sync ratio).
- Allow users to toggle and experiment with timing features live (speech pauses, majority consensus, context windows) to observe immediate effect on subtitle splitting.
- Expose an interactive educational "Learn How Timing Eliminates Splitting Issues" modal/guide directly in the UI with interactive explanations and diagrams from `parser.md`.
- Create dedicated verification test `scripts/verify-parser-timing-lab.ts` and register `npm run test:parser-timing-lab` in `package.json`.
- Document in `docs/files.md`, run verification tests, compile applet (`compile_applet`), lint applet (`lint_applet`), and commit.
