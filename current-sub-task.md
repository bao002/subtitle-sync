# Current Subtask (`current-sub-task.md`)

- **Status**: In progress.
- **Active Task**: Task 229 — Replace on-demand language columns with fetched subtitle tracks.
- **Scope**: Keep one column per language and ensure any valid fetched track replaces on-demand data, including alias codes and late callback races.
- **Completed Hotfix**: Removed the duplicate `tracksRef` declaration that blocked compilation; lint and production build now pass.
- **Next Action**: Resume regression tests and address any failures in the feature implementation.
