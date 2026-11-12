import { readFileSync } from "fs";
import { resolve } from "path";
import {
  getFavoriteLanguages,
  setFavoriteLanguages,
  getUserLearningLanguages,
  setUserLearningLanguages,
  FAVORITE_LANGUAGES_KEY,
} from "../src/utils/appSettings";
import {
  filterSubtitleRowsByCriteria,
  isSubtitleRowMatchingCriteria,
} from "../src/utils/newSubtitlesParser";
import type { Row } from "../src/lib/subtitles";

/**
 * Dedicated automated verification test for Hotfix (Prompt 160):
 * Fix duplicate React key error ("pt-BR").
 */
function runUniqueLanguageKeysVerification() {
  console.log("=== Verifying Hotfix (Prompt 160): Unique Language Keys & Deduplication ===");

  // Mock localStorage for headless Node environment
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
  (globalThis as unknown as { localStorage: typeof mockLocalStorage }).localStorage = mockLocalStorage;
  (globalThis as unknown as { window: unknown }).window = {};

  // 1. Verify appSettings.ts deduplication behavior
  console.log("1. Testing getFavoriteLanguages & setFavoriteLanguages deduplication...");
  // Inject duplicate raw array with duplicate 'pt-BR' into localStorage
  mockLocalStorage.setItem(FAVORITE_LANGUAGES_KEY, JSON.stringify(["en", "es", "pt-BR", "pt-BR", "he", "pt-BR"]));
  const favs = getFavoriteLanguages();
  console.log("Retrieved favorite languages from raw duplicate storage:", favs);
  const ptBrCount = favs.filter((c) => c === "pt-BR").length;
  if (ptBrCount !== 1) {
    throw new Error(`FAIL: getFavoriteLanguages returned ${ptBrCount} instances of 'pt-BR'! Expected strictly 1.`);
  }

  // Test setFavoriteLanguages with duplicate array
  setFavoriteLanguages(["ar", "pt-BR", "ru", "pt-BR", "ar"]);
  const savedFavs = getFavoriteLanguages();
  console.log("Retrieved favorite languages after setting duplicates:", savedFavs);
  if (savedFavs.length !== 3 || savedFavs.filter((c) => c === "pt-BR").length !== 1) {
    throw new Error(`FAIL: setFavoriteLanguages did not deduplicate input! Result: ${JSON.stringify(savedFavs)}`);
  }

  // 2. Testing user learning languages deduplication
  console.log("2. Testing user learning languages deduplication...");
  setUserLearningLanguages(["en", "pt-BR", "pt-BR", "fr"]);
  const learning = getUserLearningLanguages();
  if (learning.filter((c) => c === "pt-BR").length !== 1) {
    throw new Error(`FAIL: getUserLearningLanguages returned duplicates: ${JSON.stringify(learning)}`);
  }

  // 3. Static verification of LearningGoalsFiltersPanel deduplication
  console.log("3. Verifying LearningGoalsFiltersPanel.tsx deduplication logic...");
  const panelPath = resolve(process.cwd(), "src/components/shared/LearningGoalsFiltersPanel.tsx");
  const panelContent = readFileSync(panelPath, "utf8");
  if (!panelContent.includes("uniqueLearningLanguages")) {
    throw new Error("FAIL: LearningGoalsFiltersPanel.tsx does not define uniqueLearningLanguages!");
  }
  if (!panelContent.includes("uniqueLearningLanguages.map")) {
    throw new Error("FAIL: LearningGoalsFiltersPanel.tsx does not map over uniqueLearningLanguages!");
  }
  console.log("PASS: LearningGoalsFiltersPanel.tsx safely deduplicates learningLanguages!");

  // 4. Static verification of BeginnerFavoriteLanguageSelector deduplication
  console.log("4. Verifying BeginnerFavoriteLanguageSelector.tsx deduplication logic...");
  const beginnerSelectorPath = resolve(process.cwd(), "src/components/beginner/BeginnerFavoriteLanguageSelector.tsx");
  const beginnerSelectorContent = readFileSync(beginnerSelectorPath, "utf8");
  if (!beginnerSelectorContent.includes("new Set")) {
    throw new Error("FAIL: BeginnerFavoriteLanguageSelector.tsx does not use new Set for deduplication!");
  }
  console.log("PASS: BeginnerFavoriteLanguageSelector.tsx safely deduplicates languages!");

  // 5. Static verification of GlobalFavoriteLanguagesPanel deduplication
  console.log("5. Verifying GlobalFavoriteLanguagesPanel.tsx deduplication logic...");
  const globalFavPath = resolve(process.cwd(), "src/components/GlobalFavoriteLanguagesPanel.tsx");
  const globalFavContent = readFileSync(globalFavPath, "utf8");
  if (!globalFavContent.includes("Array.from(new Set(favoriteLanguages))")) {
    throw new Error("FAIL: GlobalFavoriteLanguagesPanel.tsx does not use Array.from(new Set(favoriteLanguages))!");
  }
  console.log("PASS: GlobalFavoriteLanguagesPanel.tsx safely deduplicates favoriteLanguages!");

  // 6. Static verification of src/routes/index.tsx deduplication
  console.log("6. Verifying src/routes/index.tsx language deduplication...");
  const indexPath = resolve(process.cwd(), "src/routes/index.tsx");
  const indexContent = readFileSync(indexPath, "utf8");
  if (!indexContent.includes("const uniqueFavs = Array.from(new Set(newFavs));")) {
    throw new Error("FAIL: src/routes/index.tsx does not deduplicate newFavs in handleUpdateFavoriteLanguages!");
  }
  if (!indexContent.includes("const deduplicatedTargetLangs = Array.from(new Set(newTargetLangs));")) {
    throw new Error("FAIL: src/routes/index.tsx does not deduplicate newTargetLangs in handleTargetLanguagesChange!");
  }
  console.log("PASS: src/routes/index.tsx deduplicates target and favorite languages!");

  // 7. Verify SubtitleRow and SubtitlesTablePanel compound keys
  console.log("7. Verifying SubtitleRow and SubtitlesTablePanel compound keys...");
  const subRowPath = resolve(process.cwd(), "src/components/SubtitleRow.tsx");
  const subRowContent = readFileSync(subRowPath, "utf8");
  if (!subRowContent.includes("key={`${l.code}-${colIdx}`}")) {
    throw new Error("FAIL: SubtitleRow.tsx does not use unique compound key for cells!");
  }

  const tablePanelPath = resolve(process.cwd(), "src/components/SubtitlesTablePanel.tsx");
  const tablePanelContent = readFileSync(tablePanelPath, "utf8");
  if (!tablePanelContent.includes("key={`${l.code}-${idx}`}")) {
    throw new Error("FAIL: SubtitlesTablePanel.tsx does not use unique compound key for table header columns!");
  }
  if (!tablePanelContent.includes("key={`${col.code}-${colIdx}`}")) {
    throw new Error("FAIL: SubtitlesTablePanel.tsx does not use unique compound key for single language cards!");
  }
  console.log("PASS: Table and Row components enforce strictly unique keys!");

  // 8. Verify canonicalizeLangCode, orderedLangs deduplication & compound key in index.tsx
  console.log("8. Verifying orderedLangs deduplication and compound keys in index.tsx...");
  if (!indexContent.includes("function canonicalizeLangCode(")) {
    throw new Error("FAIL: src/routes/index.tsx does not define canonicalizeLangCode!");
  }
  if (!indexContent.includes("const seenCodes = new Set<string>();")) {
    throw new Error("FAIL: src/routes/index.tsx does not deduplicate orderedLangs with seenCodes!");
  }
  if (!indexContent.includes("<Fragment key={`${lang.code}-${index}`}>")) {
    throw new Error("FAIL: src/routes/index.tsx does not use compound key on orderedLangs Fragment!");
  }

  // 9. Verify LanguageBoxesSelector sortedCatalog deduplication and compound keys
  console.log("9. Verifying LanguageBoxesSelector sortedCatalog deduplication...");
  const boxesPath = resolve(process.cwd(), "src/components/LanguageBoxesSelector.tsx");
  const boxesContent = readFileSync(boxesPath, "utf8");
  if (!boxesContent.includes("const seenCodes = new Set<string>();")) {
    throw new Error("FAIL: LanguageBoxesSelector.tsx does not deduplicate sortedCatalog!");
  }
  if (!boxesContent.includes("key={`${lang.code}-${idx}`}")) {
    throw new Error("FAIL: LanguageBoxesSelector.tsx does not use compound key!");
  }

  // 10. Verify per-language row criteria helpers in newSubtitlesParser.ts
  console.log("10. Verifying isSubtitleRowMatchingCriteria & filterSubtitleRowsByCriteria...");
  const sampleRows: Row[] = [
    { start: 0, end: 1000, texts: { en: "Hello world.", "pt-BR": "Olá mundo." } },
    { start: 1000, end: 2000, texts: { en: "One two.", "pt-BR": "Um dois três quatro cinco." } },
  ];
  const filtered = filterSubtitleRowsByCriteria(sampleRows, "en", 10, false, { "pt-BR": 3 });
  if (filtered.length !== 1 || filtered[0]?.texts.en !== "Hello world.") {
    throw new Error("FAIL: filterSubtitleRowsByCriteria did not filter by per-language pt-BR max words!");
  }
  if (!isSubtitleRowMatchingCriteria(sampleRows[0]!, "en", 10, false, { "pt-BR": 3 })) {
    throw new Error("FAIL: isSubtitleRowMatchingCriteria rejected a valid row!");
  }

  console.log("SUCCESS: All Hotfix (Prompt 160/176) duplicate React key & module resolution checks passed 100%!");
}

try {
  runUniqueLanguageKeysVerification();
} catch (err: unknown) {
  console.error((err as Error).message);
  process.exit(1);
}
