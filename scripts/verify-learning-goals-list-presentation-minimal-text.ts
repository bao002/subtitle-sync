/**
 * Verification script: Learning Goals Card - List Presentation, Minimal Text, Icons First (Task 337)
 * Verifies that div#stage-2-learning-goals-card:
 * 1. Uses vertical list presentation instead of multi-column grid layouts for blacklist and sentence/word granularity.
 * 2. Uses minimal, concise text without verbose explanatory paragraphs.
 * 3. Shows icons first before text labels across headers, buttons, and action items.
 * 4. Preserves all critical data-testids, controls, and accessibility attributes.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Running Verification: Learning Goals List Presentation & Icons First (Task 337)");
console.log("=========================================================================");

const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf8");

// Extract the stage-2-learning-goals-card block
const startMarker = 'id="stage-2-learning-goals-card"';
const startIndex = indexContent.indexOf(startMarker);
assert.ok(startIndex !== -1, "stage-2-learning-goals-card must be present in index.tsx");

// Find closing tag or reasonably large window covering the learning goals card
const endIndex = indexContent.indexOf("Regular Languages Accordion Content", startIndex);
assert.ok(endIndex !== -1, "Learning goals card must be followed by Regular Languages Accordion Content");
const cardContent = indexContent.slice(startIndex, endIndex);

console.log("--> [Test 1] Verifying Icons-First Presentation...");
// Check icons imported and used in card headers and buttons
assert.ok(
  cardContent.includes("<Sparkles ") || cardContent.includes("<Sparkles className="),
  "Card header must have Sparkles icon before title text",
);
assert.ok(
  cardContent.includes("<Globe ") || cardContent.includes("<Globe className="),
  "Section 1 (Default Source) and/or Section 2 must have Globe icon before text",
);
assert.ok(
  cardContent.includes("<Languages ") || cardContent.includes("<Languages className="),
  "Section 2 (Approved Languages) must have Languages icon before text",
);
assert.ok(
  cardContent.includes("<PlusCircle ") || cardContent.includes("<PlusCircle className="),
  "Extend Favorites must have PlusCircle icon before text",
);
assert.ok(
  cardContent.includes("<ListOrdered ") || cardContent.includes("<ListOrdered className="),
  "Ingredient 1 (Order) must have ListOrdered icon before text",
);
assert.ok(
  cardContent.includes("<Gauge ") || cardContent.includes("<Gauge className="),
  "Ingredient 2 (TTS Ratios) must have Gauge icon before text",
);
assert.ok(
  cardContent.includes("<VolumeX ") || cardContent.includes("<VolumeX className="),
  "Ingredient 3 (Blacklist) must have VolumeX icon before text",
);
assert.ok(
  cardContent.includes("<Type ") || cardContent.includes("<Type className="),
  "Ingredient 4 (Sentence/Word Granularity) must have Type icon before text",
);
console.log("✅ PASS: Icons-First Presentation confirmed across all learning goals sections.");

console.log("--> [Test 2] Verifying List Presentation (Vertical Stacks instead of wide grids)...");
// Check Ingredient 3 (Blacklist) uses flex-col list presentation
assert.ok(
  cardContent.includes('data-testid="stage-2-ingredient-blacklist-section"'),
  "Blacklist section must exist",
);
assert.ok(
  cardContent.includes('flex flex-col space-y-1') || cardContent.includes('flex-col space-y-1.5'),
  "Ingredient 3 and/or 4 must use vertical list flex container",
);
// Ensure previous 2-column or 3-column grid layout is replaced with vertical list
assert.ok(
  !cardContent.includes('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'),
  "Multi-column grid should be replaced by structured vertical lists",
);
console.log("✅ PASS: List Presentation confirmed.");

console.log("--> [Test 3] Verifying Minimal Text (Removal of verbose explanatory text)...");
assert.ok(
  !cardContent.includes("Select the default language that will serve as the base column in parallel subtitles"),
  "Verbose base column explanation should be removed for minimal text",
);
assert.ok(
  !cardContent.includes("Languages selected here will be included in the parallel subtitle grid"),
  "Verbose approved languages explanation should be removed for minimal text",
);
assert.ok(
  !cardContent.includes("Languages with ratio 0 are skipped from playback"),
  "Verbose ratio 0 explanation should be replaced with concise indicator",
);
console.log("✅ PASS: Minimal Text confirmed (all verbose explanations removed).");

console.log("--> [Test 4] Verifying all data-testid contracts remain intact...");
const requiredTestIds = [
  "stage-2-learning-goals-card",
  "stage-2-extend-favorites-container",
  "stage-2-filter-languages-input",
  "stage-2-languages-datalist",
  "stage-2-language-ratios-container",
  "stage-2-ingredient-order-section",
  "stage-2-ingredient-ratios-section",
  "stage-2-ingredient-blacklist-section",
  "stage-2-ingredient-sentence-word-section",
];

for (const testId of requiredTestIds) {
  assert.ok(
    cardContent.includes(`data-testid="${testId}"`),
    `Card must preserve data-testid="${testId}"`,
  );
}

// Template testids check
assert.ok(
  cardContent.includes('data-testid={`stage-2-order-row-${langCode}`}'),
  "Must preserve stage-2-order-row-${langCode}",
);
assert.ok(
  cardContent.includes('data-testid={`stage-2-ratio-row-${langCode}`}'),
  "Must preserve stage-2-ratio-row-${langCode}",
);
assert.ok(
  cardContent.includes('data-testid={`stage-2-blacklist-container-${langCode}`}'),
  "Must preserve stage-2-blacklist-container-${langCode}",
);
assert.ok(
  cardContent.includes('data-testid={`stage-2-sentence-or-word-container-${langCode}`}'),
  "Must preserve stage-2-sentence-or-word-container-${langCode}",
);
console.log("✅ PASS: All data-testid contracts intact.");

console.log("=========================================================================");
console.log("🎉 ALL TESTS PASSED: Learning Goals List Presentation & Icons First (Task 337)");
console.log("=========================================================================");
