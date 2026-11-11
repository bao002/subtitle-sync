/**
 * Dedicated automated verification test for Learning Goals Row-Criteria Per Language
 * Covers Task 387:
 *  1. Unit tests for storage & preference accessors in playback-preferences.ts
 *  2. Verification of UI components (LearningGoalsFiltersPanel, BeginnerPreferencesTab, BeginnerFlowContainer)
 *  3. Verification of Advanced/Beginner parity and reset-all functionality
 *  4. Verification of routes/index.tsx translation and TTS eligibility integration
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

// Mock localStorage for node environment
const storage: Record<string, string> = {};
if (typeof globalThis.localStorage === "undefined") {
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, val: string) => {
      storage[key] = String(val);
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      for (const k in storage) delete storage[k];
    },
  };
}

async function runTests() {
  console.log("=== Testing Task 387: Learning Goals Row-Criteria Per Language ===");

  const {
    getLearningGoalsLanguageMaxWords,
    setLearningGoalsLanguageMaxWords,
    saveLearningGoalsLanguageMaxWords,
    saveAllLearningGoalsLanguageMaxWords,
    getEffectiveLanguageMaxWords,
    getLearningGoalsLanguageSkipIncomplete,
    setLearningGoalsLanguageSkipIncomplete,
    saveLearningGoalsLanguageSkipIncomplete,
    saveAllLearningGoalsLanguageSkipIncomplete,
    getEffectiveLanguageSkipIncomplete,
  } = await import("../src/lib/playback-preferences");

  // Step 1: Storage & preference accessors
  console.log("-> 1. Testing playback-preferences per-language storage accessors...");
  localStorage.clear();

  // Initially empty
  assert.deepEqual(getLearningGoalsLanguageMaxWords(), {});
  assert.deepEqual(getLearningGoalsLanguageSkipIncomplete(), {});

  // Effective values fall back to global when no per-language override exists
  assert.equal(getEffectiveLanguageMaxWords("es", null, 10), 10);
  assert.equal(getEffectiveLanguageMaxWords("he", null, 5), 5);
  assert.equal(getEffectiveLanguageSkipIncomplete("es", null, false), false);
  assert.equal(getEffectiveLanguageSkipIncomplete("he", null, true), true);

  // Also test with explicit in-memory langMap passed
  assert.equal(getEffectiveLanguageMaxWords("es", { es: 8 }, 10), 8);
  assert.equal(getEffectiveLanguageSkipIncomplete("es", { es: true }, false), true);

  // Set individual override
  const updatedMaxWords = saveLearningGoalsLanguageMaxWords("es", 6);
  assert.equal(updatedMaxWords["es"], 6);
  assert.equal(getEffectiveLanguageMaxWords("es", null, 10), 6);
  assert.equal(getEffectiveLanguageMaxWords("he", null, 10), 10); // Other languages still inherit global

  const updatedSkip = saveLearningGoalsLanguageSkipIncomplete("es", true);
  assert.equal(updatedSkip["es"], true);
  assert.equal(getEffectiveLanguageSkipIncomplete("es", null, false), true);
  assert.equal(getEffectiveLanguageSkipIncomplete("he", null, false), false); // Other languages still inherit global

  // Remove individual override by passing undefined
  const clearedMaxWords = saveLearningGoalsLanguageMaxWords("es", undefined);
  assert.equal(clearedMaxWords["es"], undefined);
  assert.equal(getEffectiveLanguageMaxWords("es", null, 10), 10);

  // Set multiple overrides and test saveAll / reset
  saveLearningGoalsLanguageMaxWords("es", 7);
  saveLearningGoalsLanguageMaxWords("he", 4);
  saveLearningGoalsLanguageSkipIncomplete("es", true);
  saveLearningGoalsLanguageSkipIncomplete("he", true);
  assert.equal(getEffectiveLanguageMaxWords("es", null, 10), 7);
  assert.equal(getEffectiveLanguageMaxWords("he", null, 10), 4);
  assert.equal(getEffectiveLanguageSkipIncomplete("es", null, false), true);
  assert.equal(getEffectiveLanguageSkipIncomplete("he", null, false), true);

  // Reset all
  saveAllLearningGoalsLanguageMaxWords({});
  saveAllLearningGoalsLanguageSkipIncomplete({});
  assert.deepEqual(getLearningGoalsLanguageMaxWords(), {});
  assert.deepEqual(getLearningGoalsLanguageSkipIncomplete(), {});
  assert.equal(getEffectiveLanguageMaxWords("es", null, 10), 10);
  assert.equal(getEffectiveLanguageMaxWords("he", null, 10), 10);
  assert.equal(getEffectiveLanguageSkipIncomplete("es", null, false), false);
  assert.equal(getEffectiveLanguageSkipIncomplete("he", null, false), false);

  console.log("✓ playback-preferences storage tests passed.");

  // Step 2: Component source code inspection
  console.log("-> 2. Verifying LearningGoalsFiltersPanel.tsx markup & controls...");
  const panelPath = path.resolve(process.cwd(), "src/components/shared/LearningGoalsFiltersPanel.tsx");
  const panelContent = fs.readFileSync(panelPath, "utf-8");

  assert.ok(
    panelContent.includes("data-testid=\"learning-goals-active-overrides-count\""),
    "LearningGoalsFiltersPanel must contain active overrides count badge testid",
  );
  assert.ok(
    panelContent.includes("data-testid=\"learning-goals-reset-all-lang-criteria-btn\""),
    "LearningGoalsFiltersPanel must contain Reset All criteria button testid",
  );
  assert.ok(
    panelContent.includes("data-testid={`learning-goals-lang-active-status-${lang.code}`}"),
    "LearningGoalsFiltersPanel must contain per-language active status testid",
  );
  assert.ok(
    panelContent.includes("data-testid={`learning-goals-lang-reset-${lang.code}`}"),
    "LearningGoalsFiltersPanel must contain per-language reset button testid",
  );
  assert.ok(
    panelContent.includes("data-testid={`learning-goals-lang-max-words-input-${lang.code}`}"),
    "LearningGoalsFiltersPanel must contain per-language max-words input testid",
  );
  assert.ok(
    panelContent.includes("data-testid={`learning-goals-lang-complete-switch-${lang.code}`}"),
    "LearningGoalsFiltersPanel must contain per-language complete-switch toggle testid",
  );
  console.log("✓ LearningGoalsFiltersPanel.tsx markup verified.");

  // Step 3: Beginner Mode Parity
  console.log("-> 3. Verifying Beginner Mode component parity...");
  const beginnerTabPath = path.resolve(
    process.cwd(),
    "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
  );
  const beginnerTabContent = fs.readFileSync(beginnerTabPath, "utf-8");
  assert.ok(
    beginnerTabContent.includes("languageSkipIncomplete"),
    "BeginnerPreferencesTab must support languageSkipIncomplete",
  );
  assert.ok(
    beginnerTabContent.includes("onResetAllLanguageCriteria"),
    "BeginnerPreferencesTab must support onResetAllLanguageCriteria",
  );

  const beginnerContainerPath = path.resolve(
    process.cwd(),
    "src/components/beginner/BeginnerFlowContainer.tsx",
  );
  const beginnerContainerContent = fs.readFileSync(beginnerContainerPath, "utf-8");
  assert.ok(
    beginnerContainerContent.includes("languageSkipIncomplete"),
    "BeginnerFlowContainer must accept and forward languageSkipIncomplete",
  );
  assert.ok(
    beginnerContainerContent.includes("onResetAllLanguageCriteria"),
    "BeginnerFlowContainer must accept and forward onResetAllLanguageCriteria",
  );
  console.log("✓ Beginner Mode parity verified.");

  // Step 4: Index route integration (Advanced & Beginner mode parity)
  console.log("-> 4. Verifying src/routes/index.tsx wiring...");
  const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
  const indexContent = fs.readFileSync(indexPath, "utf-8");

  assert.ok(
    indexContent.includes("handleResetAllLanguageCriteria"),
    "src/routes/index.tsx must define handleResetAllLanguageCriteria",
  );
  assert.ok(
    indexContent.includes("onResetAllLanguageCriteria={handleResetAllLanguageCriteria}"),
    "src/routes/index.tsx must wire onResetAllLanguageCriteria to both Advanced and Beginner modes",
  );
  assert.ok(
    indexContent.includes("languageMaxWordsRef.current"),
    "src/routes/index.tsx must reference languageMaxWordsRef for playback & translation checks",
  );
  assert.ok(
    indexContent.includes("languageSkipIncompleteRef.current"),
    "src/routes/index.tsx must reference languageSkipIncompleteRef for playback & translation checks",
  );
  console.log("✓ src/routes/index.tsx wiring verified.");

  // Step 5: Storybook story check
  console.log("-> 5. Verifying Storybook stories...");
  const storyPath = path.resolve(
    process.cwd(),
    "src/components/shared/LearningGoalsFiltersPanel.stories.tsx",
  );
  const storyContent = fs.readFileSync(storyPath, "utf-8");
  assert.ok(
    storyContent.includes("PerLanguageRowCriteria"),
    "LearningGoalsFiltersPanel.stories.tsx must include PerLanguageRowCriteria story",
  );
  console.log("✓ Storybook stories verified.");

  console.log("=== All Task 387 Verification Checks Passed Successfully! ===");
}

runTests().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
