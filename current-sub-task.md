## Active Subtask: Subtask 147.1 - Resolve Recursive Re-render Cycle in src/routes/index.tsx
- **Task**: Task 147 - Hotfix: Maximum Update Depth Exceeded (Version 1.0.50)
- **Status**: [IN PROGRESS]
- **Target**: Guard `baseLanguage` and favorite language rules synchronization in `src/routes/index.tsx` so setState is only invoked when `baseLanguage` or favorite list actually changes value. Eliminate re-triggering loops between `favoriteLanguages`, `targetLanguages`, `spoken`, and `shown`. Bump version to 1.0.50 / 10050.
