import fs from "fs";
import path from "path";
import assert from "assert";
import {
  isSubtitleRowMatchingCriteria,
  filterSubtitleRowsByCriteria,
} from "../src/utils/componentOptimizationService";
import type { SubtitleRow } from "../src/types/subtitles";

console.log("=== Testing Learning Goals Rollback & Row-Criteria Parity ===");

// 1. Verify src/routes/index.tsx does NOT use LearningGoalAccordion
const routesIndexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const routesIndexContent = fs.readFileSync(routesIndexPath, "utf-8");

assert.ok(
  !routesIndexContent.includes("<LearningGoalAccordion"),
  "src/routes/index.tsx should not use <LearningGoalAccordion",
);
assert.ok(
  !routesIndexContent.includes("LearningGoalAccordion"),
  "src/routes/index.tsx should not import or reference LearningGoalAccordion",
);
assert.ok(
  routesIndexContent.includes('id="stage-2-default-source-lang-container"'),
  "src/routes/index.tsx must contain open #stage-2-default-source-lang-container",
);
assert.ok(
  routesIndexContent.includes('id="stage-2-approved-languages-container"'),
  "src/routes/index.tsx must contain open #stage-2-approved-languages-container",
);
assert.ok(
  routesIndexContent.includes('id="stage-2-narration-ratios-container"'),
  "src/routes/index.tsx must contain open #stage-2-narration-ratios-container",
);
assert.ok(
  routesIndexContent.includes('id="stage-2-ingredient-row-criteria-section"'),
  "src/routes/index.tsx must contain category #stage-2-ingredient-row-criteria-section",
);
assert.ok(
  routesIndexContent.includes("data-testid=\"stage-2-ingredient-row-criteria-section\""),
  "src/routes/index.tsx must have data-testid for row criteria section",
);
console.log("✓ Advanced Mode (src/routes/index.tsx) verified: accordions rolled back, open categories restored with row-criteria");

// 2. Verify src/components/beginner/tabs/BeginnerPreferencesTab.tsx does NOT use LearningGoalAccordion
const beginnerTabPath = path.resolve(
  process.cwd(),
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
const beginnerTabContent = fs.readFileSync(beginnerTabPath, "utf-8");

assert.ok(
  !beginnerTabContent.includes("<LearningGoalAccordion"),
  "BeginnerPreferencesTab.tsx should not use <LearningGoalAccordion",
);
assert.ok(
  !beginnerTabContent.includes("LearningGoalAccordion"),
  "BeginnerPreferencesTab.tsx should not import or reference LearningGoalAccordion",
);
assert.ok(
  beginnerTabContent.includes('id="beginner-favorite-languages-section"'),
  "BeginnerPreferencesTab.tsx must contain open #beginner-favorite-languages-section",
);
assert.ok(
  beginnerTabContent.includes('id="beginner-narration-ratios-section"'),
  "BeginnerPreferencesTab.tsx must contain open #beginner-narration-ratios-section",
);
assert.ok(
  beginnerTabContent.includes('id="beginner-row-criteria-section"'),
  "BeginnerPreferencesTab.tsx must contain category #beginner-row-criteria-section",
);
console.log("✓ Beginner Mode (BeginnerPreferencesTab.tsx) verified: accordions rolled back, open categories restored with row-criteria");

// 3. Verify LearningGoalsFiltersPanel supports per-language word limitation
const filtersPanelPath = path.resolve(
  process.cwd(),
  "src/components/shared/LearningGoalsFiltersPanel.tsx",
);
const filtersPanelContent = fs.readFileSync(filtersPanelPath, "utf-8");
assert.ok(
  filtersPanelContent.includes("languageMaxWords"),
  "LearningGoalsFiltersPanel must support per-language max word limitation via languageMaxWords",
);
console.log("✓ LearningGoalsFiltersPanel has per-language max words limitation controls");

// 4. Functional test of max words limitation filter per language
const testRows: SubtitleRow[] = [
  {
    id: "1",
    index: 0,
    startTime: 0,
    endTime: 2,
    texts: {
      en: "Short sentence.",
      es: "Frase muy larga con muchas palabras para probar el límite.",
    },
  },
  {
    id: "2",
    index: 1,
    startTime: 2,
    endTime: 4,
    texts: {
      en: "This is a much longer English sentence containing quite a few words.",
      es: "Frase corta.",
    },
  },
  {
    id: "3",
    index: 2,
    startTime: 4,
    endTime: 6,
    texts: {
      en: "Just two words",
      es: "Solo dos",
    },
  },
];

// Test with global max words: 5 (English row 2 has 12 words, row 1 has 2 words, row 3 has 3 words)
const filteredGlobal = filterSubtitleRowsByCriteria(testRows, {
  maxWords: 5,
  baseLanguage: "en",
});
assert.strictEqual(filteredGlobal.length, 2, "Should keep 2 rows matching <= 5 words in en");
assert.strictEqual(filteredGlobal[0].id, "1");
assert.strictEqual(filteredGlobal[1].id, "3");

// Test with per-language limit on Spanish (es max words: 4)
// Row 1 Spanish has 10 words -> rejected
// Row 2 Spanish has 2 words -> passed
// Row 3 Spanish has 2 words -> passed
const filteredEs = filterSubtitleRowsByCriteria(testRows, {
  maxWords: 20, // generous global
  maxWordsPerLang: { es: 4 },
  baseLanguage: "en",
});
assert.strictEqual(filteredEs.length, 2, "Should filter out Spanish sentence exceeding 4 words");
assert.strictEqual(filteredEs[0].id, "2");
assert.strictEqual(filteredEs[1].id, "3");

// Test combination: English <= 5 words AND Spanish <= 4 words
// Row 1: en passes (2 words), es fails (10 words) -> REJECT
// Row 2: en fails (12 words), es passes (2 words) -> REJECT
// Row 3: en passes (3 words), es passes (2 words) -> PASS
const filteredCombo = filterSubtitleRowsByCriteria(testRows, {
  maxWords: 5,
  maxWordsPerLang: { es: 4 },
  baseLanguage: "en",
});
assert.strictEqual(filteredCombo.length, 1, "Only row 3 satisfies both constraints");
assert.strictEqual(filteredCombo[0].id, "3");

console.log("✓ Subtitle row criteria filtering by per-language max words limitation works accurately!");
console.log("All Learning Goals Rollback & Row-Criteria tests passed successfully!");
