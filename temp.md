# Ephemeral Scratchpad (temp.md)

## Diagnosis of "Maximum update depth exceeded"
1. In `src/routes/index.tsx`:
```typescript
  useEffect(() => {
    if (baseLanguage) {
      const rules = applyVideoSharingFavoriteLanguageRules(baseLanguage, {
        currentFavorites: favoriteLanguages,
        isAndroid,
        persist: true,
      });
      setFavoriteLanguagesState(rules.orderedFavorites);
      setTargetLanguages(rules.orderedFavorites);
      setLanguageOrder((prev) => ...);
      setShown((prev) => ...);
      setSpoken(rules.spokenLanguages);
      rules.orderedFavorites.forEach((l) => processedDefaultFavsRef.current.add(l));
    }
  }, [baseLanguage, favoriteLanguages, isAndroid]);
```
Every time this runs:
- `setFavoriteLanguagesState(rules.orderedFavorites)` creates a new reference.
- `favoriteLanguages` changes -> effect triggers again -> calls `setFavoriteLanguagesState` -> infinite loop!
- Also `lastAppliedBaseLanguageRef` was missing: it should only run when `baseLanguage` changes, or if the current favorites don't match `rules.orderedFavorites`!

2. Fix:
- Add `lastAppliedBaseLanguageRef = useRef<string>("")`
- Compare `rules.orderedFavorites` with current state / only update states if the arrays differ (e.g. `!arraysEqual(rules.orderedFavorites, favoriteLanguages)`).
- Also remove `favoriteLanguages` from the dependency array of this effect, or use ref `favoriteLanguagesRef.current` to read current favorites so that modifying favorites doesn't recursively re-trigger this effect.
- Same for `spoken`: only call `setSpoken` if `!arraysEqual(rules.spokenLanguages, spoken)`.
- Same for `targetLanguages`: only update if different.
- Same for `shown`: only update if different.
