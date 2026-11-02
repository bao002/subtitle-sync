import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getLanguageTtsRatio,
  saveTtsRatioPreference,
  getTtsRatiosPreference,
} from "../src/lib/playback-preferences";

console.log("=========================================================================");
console.log("🧪 Verifying Language Ratios in Learning Goals (Task 283 / Chapter 1)");
console.log("=========================================================================");

const root = process.cwd();

// Mock localStorage for node environment
const mockStorage: Record<string, string> = {};
(global as any).window = {
  localStorage: {
    getItem: (k: string) => mockStorage[k] || null,
    setItem: (k: string, v: string) => {
      mockStorage[k] = v;
    },
    removeItem: (k: string) => {
      delete mockStorage[k];
    },
    length: 0,
    key: () => null,
  },
};

// --------------------------------------------------------------------------
// [Test 1] Verify Stage 2 Learning Goals in src/routes/index.tsx
// --------------------------------------------------------------------------
console.log("--> [Test 1] Inspecting Stage 2 Learning Goals in index.tsx...");
const indexTsxPath = path.join(root, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// 1. Must define stage-2-learning-goals-card
assert.ok(
  indexContent.includes('id="stage-2-learning-goals-card"'),
  "index.tsx must define stage-2-learning-goals-card",
);

// 2. Must define stage-2-language-ratios-container
assert.ok(
  indexContent.includes('id="stage-2-language-ratios-container"'),
  "index.tsx must define stage-2-language-ratios-container",
);
assert.ok(
  indexContent.includes('data-testid="stage-2-language-ratios-container"'),
  "index.tsx must define testid stage-2-language-ratios-container",
);

// 3. Verify ordering: Language Ratios must come AT THE END of Stage 2 Learning Goals
// (after default source language and approved learning languages, before stage-2 action bar)
const stage2CardIndex = indexContent.indexOf('id="stage-2-learning-goals-card"');
const defaultLangIndex = indexContent.indexOf("1. Default Source Language", stage2CardIndex);
const approvedLangsIndex = indexContent.indexOf("2. Approved Learning Languages", stage2CardIndex);
const ratiosContainerIndex = indexContent.indexOf('id="stage-2-language-ratios-container"', stage2CardIndex);
const stage2ActionBarIndex = indexContent.indexOf('id="stage-2-next-button"', ratiosContainerIndex);

assert.ok(stage2CardIndex !== -1, "stage-2-learning-goals-card must be present");
assert.ok(defaultLangIndex > stage2CardIndex, "Default language comes first in Stage 2");
assert.ok(approvedLangsIndex > defaultLangIndex, "Approved learning languages comes second in Stage 2");
assert.ok(
  ratiosContainerIndex > approvedLangsIndex,
  "Language ratios must come AT THE END of Stage 2 learning goals (after approved languages)",
);
assert.ok(
  stage2ActionBarIndex > ratiosContainerIndex,
  "Stage 2 action buttons must follow language ratios at the end of the card",
);
console.log("✅ PASS: Language ratios settings are strictly positioned at the end of Stage 2 Learning Goals.");

// 4. Verify testids for ratio buttons and inputs in Stage 2
assert.ok(
  indexContent.includes('data-testid={`stage-2-ratio-row-${langCode}`}'),
  "Must render stage-2-ratio-row testid",
);
assert.ok(
  indexContent.includes('data-testid={`stage-2-ratio-btn-${langCode}-${ratioVal}`}'),
  "Must render stage-2-ratio-btn testid",
);
assert.ok(
  indexContent.includes('data-testid={`stage-2-ratio-input-${langCode}`}'),
  "Must render stage-2-ratio-input testid",
);

// --------------------------------------------------------------------------
// [Test 2] Verify Beginner Mode Learning Goals Parity
// --------------------------------------------------------------------------
console.log("--> [Test 2] Inspecting Beginner Mode Learning Goals in BeginnerPreferencesTab.tsx...");
const beginnerTabPath = path.join(
  root,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
assert.ok(fs.existsSync(beginnerTabPath), "BeginnerPreferencesTab.tsx must exist");
const beginnerContent = fs.readFileSync(beginnerTabPath, "utf8");

// Verify ordering: GlobalFavoriteLanguagesPanel (Learning Goals: Favorite Languages) comes before ratios container
const favPanelIndex = beginnerContent.indexOf("<GlobalFavoriteLanguagesPanel");
const beginnerRatiosIndex = beginnerContent.indexOf('id="beginner-learning-goals-ratios-container"');

assert.ok(favPanelIndex !== -1, "GlobalFavoriteLanguagesPanel must be present in BeginnerPreferencesTab");
assert.ok(beginnerRatiosIndex !== -1, "beginner-learning-goals-ratios-container must be present");
assert.ok(
  beginnerRatiosIndex > favPanelIndex,
  "Language ratios settings must come AT THE END of Learning Goals stage in Beginner Mode",
);
console.log("✅ PASS: Beginner Mode has full parity with ratios positioned at the end of learning goals.");

// --------------------------------------------------------------------------
// [Test 3] Verify Functional Ratio Persistence
// --------------------------------------------------------------------------
console.log("--> [Test 3] Testing ratio calculation and preference persistence...");
saveTtsRatioPreference("fr", 3);
saveTtsRatioPreference("es", 2);

const savedRatios = getTtsRatiosPreference();
assert.strictEqual(savedRatios.fr, 3, "French ratio must be saved as 3");
assert.strictEqual(savedRatios.es, 2, "Spanish ratio must be saved as 2");

const calcFrRatio = getLanguageTtsRatio(savedRatios, "fr");
assert.strictEqual(calcFrRatio, 3, "Calculated French ratio must be 3");

const calcDefaultRatio = getLanguageTtsRatio(savedRatios, "de");
assert.strictEqual(calcDefaultRatio, 1, "Unconfigured language must default to ratio 1");
console.log("✅ PASS: Ratio persistence and retrieval functions verified.");

console.log("=========================================================================");
console.log("🎉 ALL CHECKS PASSED! Task 283 (Chapter 1) verified successfully.");
console.log("=========================================================================");
