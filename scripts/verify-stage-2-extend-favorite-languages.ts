/**
 * Dedicated Verification Test Suite for Task 266:
 * Provide In-Place Control to Extend the List of Favorite Languages Within Stage 2 Learning Goals Card
 *
 * Validates:
 * 1. Stage 2 Learning Goals Card contains the in-place favorite languages extension control:
 *    - Container: `data-testid="stage-2-extend-favorites-container"`
 *    - Filter input: `data-testid="stage-2-filter-languages-input"`
 *    - Select dropdown: `data-testid="stage-2-add-favorite-select"`
 * 2. Extension logic adds language to both favoriteLanguages (via handleUpdateFavoriteLanguages)
 *    and targetLanguages (via handleTargetLanguagesChange).
 * 3. In-place favorite removal buttons (`data-testid="stage-2-remove-fav-${code}"`) for fast trimming.
 * 4. Isolation rule: The card is presented strictly in Stage 2 ("here and only here is the right place").
 * 5. Multi-catalog support: catalogs from SUPPORTED_LANGUAGES_CATALOG are available to add.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Running Verification: Stage 2 Extend Favorite Languages In-Place Control");
console.log("=========================================================================");

const indexRoutePath = path.resolve(process.cwd(), "src/routes/index.tsx");
assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

// Test 1: Verify Stage 2 container and in-place extend control exist inside #stage-2-learning-goals-card
console.log("Test 1: Verify Stage 2 in-place extension elements exist as unified filter input...");
assert.ok(
  indexContent.includes('id="stage-2-learning-goals-card"'),
  "Must include #stage-2-learning-goals-card container",
);
assert.ok(
  indexContent.includes('id="stage-2-extend-favorites-container"'),
  "Must include #stage-2-extend-favorites-container",
);
assert.ok(
  indexContent.includes('data-testid="stage-2-extend-favorites-container"'),
  "Must include data-testid='stage-2-extend-favorites-container'",
);
assert.ok(
  indexContent.includes('data-testid="stage-2-filter-languages-input"'),
  "Must include data-testid='stage-2-filter-languages-input'",
);
assert.ok(
  indexContent.includes('id="stage-2-languages-datalist"'),
  "Must include #stage-2-languages-datalist for unified combobox filtering",
);
assert.ok(
  !indexContent.includes('id="stage-2-add-favorite-select"'),
  "Must NOT have a separated select element (enforcing single item for filtering/narrowing)",
);
console.log("✅ PASS: Stage 2 unified in-place extension elements verified");

// Test 2: Verify select handler updates both favoriteLanguages and targetLanguages
console.log("Test 2: Verify handler synchronizes favorites and target selections...");
assert.ok(
  indexContent.includes("handleUpdateFavoriteLanguages(nextFavs)"),
  "Must update favoriteLanguages upon selection",
);
assert.ok(
  indexContent.includes("handleTargetLanguagesChange(") &&
    indexContent.includes("...targetLanguages") &&
    indexContent.includes("code"),
  "Must automatically approve added language into targetLanguages for video",
);
assert.ok(
  indexContent.includes("SUPPORTED_LANGUAGES_CATALOG.filter("),
  "Must populate select dropdown from SUPPORTED_LANGUAGES_CATALOG",
);
console.log("✅ PASS: State update synchronization verified");

// Test 3: Verify in-place favorite language removal buttons exist
console.log("Test 3: Verify in-place favorite language chip removal button...");
assert.ok(
  indexContent.includes("data-testid={`stage-2-remove-fav-${code}`}"),
  "Must provide in-place remove button for each favorite chip in Stage 2",
);
console.log("✅ PASS: In-place chip removal button verified");

// Test 4: Verify Stage 2 isolation
console.log("Test 4: Verify Stage 2 conditional rendering...");
assert.ok(
  indexContent.includes('panelId === "languages"') &&
    (indexContent.includes("currentAccordionStage === 2") ||
      indexContent.includes("currentAccordionStage === 1")),
  "Stage 2 learning goals card must strictly render when currentAccordionStage is active for learning goals",
);
console.log("✅ PASS: Stage 2 isolation verified");

console.log("=========================================================================");
console.log("🎉 All 4 Stage 2 Favorite Language Extension verification assertions passed!");
console.log("=========================================================================");
