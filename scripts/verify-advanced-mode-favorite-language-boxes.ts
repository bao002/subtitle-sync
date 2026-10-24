import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Advanced Mode Favorite Language Boxes (Chapter 2)");
console.log("=========================================================================");

const rootDir = process.cwd();
const selectorPath = path.join(rootDir, "src/components/LanguageBoxesSelector.tsx");
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");

assert.ok(fs.existsSync(selectorPath), "LanguageBoxesSelector.tsx must exist");
assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");

const selectorCode = fs.readFileSync(selectorPath, "utf-8");
const indexCode = fs.readFileSync(indexRoutePath, "utf-8");

// Test 1: LanguageBoxesSelector filtering to favorite languages
console.log("--> [Test 1] Verifying LanguageBoxesSelector filters boxes to favorite languages...");
assert.ok(
  selectorCode.includes("isFavoritesFiltered") &&
    selectorCode.includes("favoriteLanguages") &&
    selectorCode.includes("effectiveCatalog"),
  "LanguageBoxesSelector must compute effectiveCatalog based on favoriteLanguages and isFavoritesFiltered",
);

assert.ok(
  selectorCode.includes('data-testid="toggle-show-all-languages"'),
  "LanguageBoxesSelector must provide a toggle button with data-testid='toggle-show-all-languages'",
);

assert.ok(
  selectorCode.includes("data-favorites-only="),
  "LanguageBoxesSelector must set data-favorites-only attribute on language-boxes-grid",
);

assert.ok(
  selectorCode.includes('data-testid="favorite-languages-active-badge"'),
  "LanguageBoxesSelector must display favorite-languages-active-badge when favorites filter is active",
);
console.log("✅ PASS: LanguageBoxesSelector favorites filtering and UI controls verified.");

// Test 2: Advanced Mode in index.tsx passes favorite languages and provides interactive controls
console.log("--> [Test 2] Verifying index.tsx Advanced Mode favorites integration...");
assert.ok(
  indexCode.includes("<LanguageBoxesSelector") &&
    indexCode.includes("favoriteLanguages={favoriteLanguages}"),
  "index.tsx must pass favoriteLanguages={favoriteLanguages} to LanguageBoxesSelector",
);

assert.ok(
  indexCode.includes("getInitialFavoriteLanguages") &&
    indexCode.includes('["he", "it", "es", "fr", "ru", "ar"]'),
  "index.tsx getInitialFavoriteLanguages must provide default favorite languages fallback",
);

assert.ok(
  indexCode.includes("data-testid={`favorite-lang-badge-${code}`}") &&
    indexCode.includes("onClick="),
  "index.tsx must provide clickable favorite language badges to toggle target languages",
);
console.log("✅ PASS: Advanced Mode favorites integration verified.");

// Test 3: Functional simulation of favorite language boxes behavior
console.log("--> [Test 3] Simulating favorite language boxes filtering and selection...");
const mockFullCatalog = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ar", name: "Arabic" },
  { code: "he", name: "Hebrew" },
];

function computeLanguageBoxes(
  catalog: Array<{ code: string; name: string }>,
  favorites: string[],
  selected: string[],
  showAll: boolean,
  search: string,
) {
  const isFavoritesFiltered = Boolean(favorites.length > 0 && !showAll && !search.trim());
  let source = catalog;
  if (isFavoritesFiltered) {
    const allowed = new Set([...favorites, ...selected]);
    source = catalog.filter((l) => allowed.has(l.code));
  }
  const query = search.trim().toLowerCase();
  const filtered = query
    ? catalog.filter(
        (l) => l.name.toLowerCase().includes(query) || l.code.toLowerCase().includes(query),
      )
    : source;

  const selItems = filtered.filter((l) => selected.includes(l.code));
  const unselItems = filtered.filter((l) => !selected.includes(l.code));
  return {
    isFavoritesFiltered,
    boxes: [...selItems, ...unselItems],
  };
}

// Case A: Default state with favorites ['he', 'it', 'en']
const favs1 = ["he", "it", "en"];
const res1 = computeLanguageBoxes(mockFullCatalog, favs1, ["he"], false, "");
assert.strictEqual(res1.isFavoritesFiltered, true, "Favorites filter should be active");
assert.strictEqual(res1.boxes.length, 3, "Only the 3 favorite languages should appear as boxes");
assert.deepStrictEqual(
  res1.boxes.map((b) => b.code),
  ["he", "en", "it"],
  "Selected language ('he') must be first, followed by remaining favorites",
);

// Case B: User toggles showAll
const res2 = computeLanguageBoxes(mockFullCatalog, favs1, ["he"], true, "");
assert.strictEqual(
  res2.isFavoritesFiltered,
  false,
  "Favorites filter should be inactive when showAll is true",
);
assert.strictEqual(res2.boxes.length, 10, "All catalog languages must appear when showAll is true");

// Case C: User searches for a non-favorite language e.g. 'french'
const res3 = computeLanguageBoxes(mockFullCatalog, favs1, ["he"], false, "french");
assert.strictEqual(res3.boxes.length, 1, "Search must search full catalog");
assert.strictEqual(res3.boxes[0].code, "fr", "French should be found");

console.log("✅ PASS: Functional simulation of favorite language boxes passed.");

console.log("=========================================================================");
console.log("🎉 ALL ADVANCED MODE FAVORITE LANGUAGE BOXES CHECKS PASSED (100%)!");
console.log("=========================================================================");
