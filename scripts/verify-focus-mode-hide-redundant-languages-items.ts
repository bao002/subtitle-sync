import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Focus Mode: Hide Redundant Language Items (Prompt 142 / Task 373)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
const boxesSelectorPath = path.join(rootDir, "src/components/LanguageBoxesSelector.tsx");
const favPanelPath = path.join(rootDir, "src/components/GlobalFavoriteLanguagesPanel.tsx");

assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
assert.ok(fs.existsSync(boxesSelectorPath), "LanguageBoxesSelector.tsx must exist");
assert.ok(fs.existsSync(favPanelPath), "GlobalFavoriteLanguagesPanel.tsx must exist");

const indexContent = fs.readFileSync(indexRoutePath, "utf-8");
const boxesSelectorContent = fs.readFileSync(boxesSelectorPath, "utf-8");
const favPanelContent = fs.readFileSync(favPanelPath, "utf-8");

// Test 1: LanguageBoxesSelector and GlobalFavoriteLanguagesPanel support className prop
console.log("\n[Test 1] Verifying className prop support on redundant components...");
assert.ok(
  boxesSelectorContent.includes("className?: string"),
  "LanguageBoxesSelectorProps must support optional className prop",
);
assert.ok(
  boxesSelectorContent.includes("${className || \"\"}") ||
    boxesSelectorContent.includes("${className || ''}"),
  "LanguageBoxesSelector must interpolate className on wrapper",
);
assert.ok(
  favPanelContent.includes("className?: string"),
  "GlobalFavoriteLanguagesPanelProps must support optional className prop",
);
assert.ok(
  favPanelContent.includes("${className || \"\"}") ||
    favPanelContent.includes("${className || ''}"),
  "GlobalFavoriteLanguagesPanel must interpolate className on wrapper",
);
console.log("✅ PASS: Components support className prop.");

// Test 2: In src/routes/index.tsx, LanguageBoxesSelector & GlobalFavoriteLanguagesPanel have className="hidden"
console.log("\n[Test 2] Verifying hidden styling applied in index.tsx...");
assert.ok(
  /<LanguageBoxesSelector[\s\S]*?className="hidden"/.test(indexContent),
  "LanguageBoxesSelector in index.tsx must have className='hidden'",
);
assert.ok(
  /<GlobalFavoriteLanguagesPanel[\s\S]*?className="hidden"/.test(indexContent),
  "GlobalFavoriteLanguagesPanel in index.tsx must have className='hidden'",
);
console.log("✅ PASS: LanguageBoxesSelector and GlobalFavoriteLanguagesPanel styled with hidden.");

// Test 3: In unified-languages-table, all 10 th headers and container are styled with hidden
console.log("\n[Test 3] Verifying all 10 <th> headers in unified-languages-table are styled with hidden...");
assert.ok(
  indexContent.includes('<div className="overflow-x-auto hidden">'),
  "Table container must have hidden class",
);
assert.ok(
  indexContent.includes('<table\n                                    className="w-full text-xs hidden"\n                                    data-testid="unified-languages-table"') ||
    indexContent.includes('className="w-full text-xs hidden"'),
  "unified-languages-table must have hidden class",
);

// Verify all 10 headers have hidden class
const thMatches = indexContent.match(/<th[^>]*class(?:Name)?="[^"]*hidden[^"]*"[^>]*>[\s\S]*?<\/th>/g);
assert.ok(
  thMatches && thMatches.length >= 10,
  `Expected at least 10 hidden <th> elements in unified table, found ${thMatches ? thMatches.length : 0}`,
);
console.log(`✅ PASS: Found ${thMatches.length} <th> elements styled with hidden class.`);

// Test 4: VideoPlaybackPrecedenceBar uses colSpan={9} without obsolete colSpan={10}
console.log("\n[Test 4] Verifying colSpan={9} consistency...");
assert.ok(indexContent.includes("colSpan={9}"), "Must use colSpan={9}");
assert.ok(!indexContent.includes("colSpan={10}"), "Must not contain obsolete colSpan={10}");
console.log("✅ PASS: colSpan={9} verified across table elements.");

console.log("\n=========================================================================");
console.log("🎉 ALL TESTS PASSED: Redundant language elements hidden successfully! (Task 373)");
console.log("=========================================================================");
