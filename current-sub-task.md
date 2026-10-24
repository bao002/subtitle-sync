# Current Subtask (`current-sub-task.md`)

- **Status**: Completed and archived.
- **Completed Task**: Task 229 — Replace duplicate language columns and prefer complete fetched subtitle tracks.
- **Verification**: `npm run test:subtitle-language-columns`, `npm run test:on-demand-translation`, `npm run test:v2-version-bump`, `npm run test:md`, `npm run lint`, and `npm run build` passed.
- **Known unrelated test issue**: `npm run test:subtitles-table-visibility` still fails at its pre-existing `align()` row-text assertion (`Hello world` expected, combined row returned) before reaching the column assertions.
- **Next Action**: Remaining items are deferred platform validations in `docs/tasks.md`.
