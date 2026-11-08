import assert from "node:assert/strict";
import {
  saveRatioComposition,
  getStoredRatioCompositions,
  deleteRatioComposition,
  getActiveRatioCompositionId,
  setActiveRatioCompositionId,
  BUILT_IN_COMPOSITIONS,
} from "../src/utils/ratioCompositionsManager.js";

// Mock localStorage for node environment
const storage: Record<string, string> = {};
(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
  },
};

console.log("Starting verification of learning profile save and switch...");

// 1. Verify built-in presets are available
const initialComps = getStoredRatioCompositions();
assert.ok(initialComps.length >= 4, "Should have at least 4 built-in presets");
assert.equal(initialComps[0].id, "builtin_equal_1_1");

// 2. Save a new custom learning profile with full configuration
const customProfileName = "My Advanced Immersion Profile";
const ratios = { default: 2, en: 1, he: 2, it: 3, ru: 1 };
const profileConfig = {
  maxWordsPerSentence: 8,
  skipIncompleteSentences: true,
  sectionOrder: "tts-first" as const,
  rates: { it: 0.7, en: 0.9, he: 0.8, ru: 0.6 },
  ttsLanguageOrders: { it: 1, en: 2, he: 3, ru: 4 },
};

const saved = saveRatioComposition(customProfileName, ratios, profileConfig);

assert.ok(saved.id.startsWith("custom_"), "Custom profile ID should start with custom_");
assert.equal(saved.name, customProfileName);
assert.equal(saved.maxWordsPerSentence, 8);
assert.equal(saved.skipIncompleteSentences, true);
assert.equal(saved.sectionOrder, "tts-first");
assert.deepEqual(saved.rates, { it: 0.7, en: 0.9, he: 0.8, ru: 0.6 });
assert.deepEqual(saved.ttsLanguageOrders, { it: 1, en: 2, he: 3, ru: 4 });
assert.equal(saved.isBuiltIn, false);

// 3. Verify retrieved compositions includes the new profile
const updatedComps = getStoredRatioCompositions();
const found = updatedComps.find((c) => c.id === saved.id);
assert.ok(found, "Saved custom profile should be retrievable from storage");
assert.equal(found?.maxWordsPerSentence, 8);
assert.equal(found?.skipIncompleteSentences, true);
assert.equal(found?.sectionOrder, "tts-first");

// 4. Verify active profile selection
assert.equal(getActiveRatioCompositionId(), saved.id);
setActiveRatioCompositionId("builtin_equal_1_1");
assert.equal(getActiveRatioCompositionId(), "builtin_equal_1_1");

// 5. Verify deleting custom profile
const deleted = deleteRatioComposition(saved.id);
assert.equal(deleted, true);
const remainingComps = getStoredRatioCompositions();
assert.ok(!remainingComps.some((c) => c.id === saved.id), "Deleted profile should no longer exist");

console.log("All learning profile save and switch tests PASSED successfully!");
