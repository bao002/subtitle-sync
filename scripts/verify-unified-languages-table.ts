import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { APP_VERSION } from "../src/config/appConfig";

console.log("=========================================================================");
console.log("🧪 Running Dedicated Verification: Unified Languages Table (Task 264)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

// Test 1: Single unified table element exists
console.log("\n[Test 1] Verifying presence of single unified languages table element...");
assert.ok(
  indexContent.includes('data-testid="unified-languages-table"'),
  "src/routes/index.tsx must render unified-languages-table",
);
console.log("✅ PASS: data-testid='unified-languages-table' is present");

// Test 2: All required columns in the unified table header
console.log("\n[Test 2] Verifying all required table columns (rate, primary, ratio, tts-play, present-in-table, subtitles-url, order)...");
assert.ok(/<th[^>]*>\s*Language\s*<\/th>/.test(indexContent), "Must contain Language column");
assert.ok(/<th[^>]*>\s*Primary\s*<\/th>/.test(indexContent), "Must contain Primary column");
assert.ok(/<th[^>]*>\s*Rate\s*<\/th>/.test(indexContent), "Must contain Rate column");
assert.ok(/<th[^>]*>\s*(?:TTS\s+)?Ratio\s*<\/th>/.test(indexContent), "Must contain Ratio column");
assert.ok(/<th[^>]*>\s*TTS-Play\s*<\/th>/.test(indexContent), "Must contain TTS-Play column");
assert.ok(/<th[^>]*>\s*Present in Table\s*<\/th>/.test(indexContent), "Must contain Present in Table column");
assert.ok(/<th[^>]*>\s*Subtitle URL\s*<\/th>/.test(indexContent), "Must contain Subtitle URL column");
assert.ok(/<th[^>]*>\s*Order\s*<\/th>/.test(indexContent), "Must contain Order column");
console.log("✅ PASS: All 8 required columns configured in table header");

// Test 3: Language row controls
console.log("\n[Test 3] Verifying language row controls integration in the table...");
assert.ok(
  indexContent.includes('data-testid={`tts-role-badge-${lang.code}`}'),
  "Row must support Primary badge",
);
assert.ok(
  indexContent.includes('data-testid={`tts-switch-primary-${lang.code}`}'),
  "Row must support Make Primary switch button",
);
assert.ok(
  indexContent.includes('aria-label={`${lang.name} speech rate`}'),
  "Row must support speech rate slider",
);
assert.ok(
  indexContent.includes('data-testid={`tts-ratio-slider-${lang.code}`}'),
  "Row must support TTS ratio select",
);
assert.ok(
  indexContent.includes('data-testid={`checkbox-tts-play-${lang.code}`}'),
  "Row must support TTS-play checkbox",
);
assert.ok(
  indexContent.includes('data-testid={`checkbox-present-in-table-${lang.code}`}'),
  "Row must support Present in Table checkbox",
);
assert.ok(
  indexContent.includes('data-testid={`table-btn-subtitle-url-${lang.code}`}'),
  "Row must support Subtitle URL button",
);
console.log("✅ PASS: All inline row controls present in unified table");

// Test 4: Separate records block after primary title banner is not rendered
console.log("\n[Test 4] Verifying separate records after primary title banner are eliminated...");
const titleIndex = indexContent.indexOf("Primary leads; secondary languages speak relative to primary");
assert.ok(titleIndex !== -1, "Title banner must exist");
const afterTitle = indexContent.slice(titleIndex);
assert.ok(
  !afterTitle.includes("orderedLangs.filter((lang) => spoken.includes(lang.code)).map"),
  "No separate records list must follow after the primary title banner",
);
console.log("✅ PASS: Separate records block below title banner is removed");

// Test 5: Role switch button is preserved
console.log("\n[Test 5] Verifying ⇄ Switch Primary/Secondary button is preserved...");
assert.ok(
  indexContent.includes('data-testid="tts-switch-roles-button-advanced"'),
  "Advanced mode must preserve ⇄ Switch Primary/Secondary button",
);
console.log("✅ PASS: ⇄ Switch Primary/Secondary button is preserved");

// Test 6: App version is 2.0.31
console.log("\n[Test 6] Verifying version 2.0.31 synchronization...");
assert.strictEqual(APP_VERSION, "2.0.31", "APP_VERSION must be 2.0.31");
console.log("✅ PASS: APP_VERSION is 2.0.31");

console.log("\n=========================================================================");
console.log("🎉 ALL UNIFIED LANGUAGES TABLE CHECKS PASSED 100%!");
console.log("=========================================================================");
