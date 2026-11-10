import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Focus Mode: Hide Redundant Fetch Toggles (Prompt 143 / Task 374)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");

const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

// Test 1: auto-speak-on-fetch-toggle container is hidden
console.log("\n[Test 1] Verifying auto-speak-on-fetch-toggle is styled with hidden...");
assert.ok(
  /<div\s+className="hidden[^"]*">[\s\S]*?id="auto-speak-on-fetch-toggle"/.test(indexContent),
  "Container div for auto-speak-on-fetch-toggle must have 'hidden' class",
);
console.log("✅ PASS: auto-speak-on-fetch-toggle container is styled with hidden.");

// Test 2: speak-language-name-on-fetch-toggle container is hidden
console.log("\n[Test 2] Verifying speak-language-name-on-fetch-toggle is styled with hidden...");
assert.ok(
  /<div\s+className="hidden[^"]*">[\s\S]*?id="speak-language-name-on-fetch-toggle"/.test(indexContent),
  "Container div for speak-language-name-on-fetch-toggle must have 'hidden' class",
);
console.log("✅ PASS: speak-language-name-on-fetch-toggle container is styled with hidden.");

// Test 3: Prior hidden elements from Prompt 142 remain hidden
console.log("\n[Test 3] Verifying prior Prompt 142 hidden elements remain hidden...");
assert.ok(
  /<LanguageBoxesSelector[\s\S]*?className="hidden"/.test(indexContent),
  "LanguageBoxesSelector must remain hidden",
);
assert.ok(
  /<GlobalFavoriteLanguagesPanel[\s\S]*?className="hidden"/.test(indexContent),
  "GlobalFavoriteLanguagesPanel must remain hidden",
);
assert.ok(
  indexContent.includes('<div className="overflow-x-auto hidden">'),
  "Table container must remain hidden",
);
console.log("✅ PASS: Prior hidden elements remain hidden.");

console.log("\n=========================================================================");
console.log("🎉 ALL TESTS PASSED: Redundant fetch toggles hidden successfully! (Task 374)");
console.log("=========================================================================");
