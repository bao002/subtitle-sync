import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Disclaimer Moved to Settings Footer (Task 376.2)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");

const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

// Test 1: Disclaimer is present inside settings-footer
console.log("\n[Test 1] Verifying demo-languages-disclaimer is present inside settings-footer...");
assert.ok(
  indexContent.includes('data-testid="settings-footer"'),
  "Settings stage must have a 'settings-footer' element",
);
assert.ok(
  /<footer[^>]*data-testid="settings-footer"[\s\S]*?data-testid="demo-languages-disclaimer"/.test(indexContent),
  "demo-languages-disclaimer must be contained within settings-footer",
);
console.log("✅ PASS: demo-languages-disclaimer is located inside settings-footer.");

// Test 2: Disclaimer does not exist in Stage 1 (Languages stage)
console.log("\n[Test 2] Verifying disclaimer is removed from Languages stage...");
const languagesStageStart = indexContent.indexOf('panelId === "languages"');
const subtitlesStageStart = indexContent.indexOf('panelId === "subtitles"');
assert.ok(languagesStageStart !== -1 && subtitlesStageStart !== -1, "Stage markers must exist");

const languagesStageSection = indexContent.slice(languagesStageStart, subtitlesStageStart);
assert.ok(
  !languagesStageSection.includes('data-testid="demo-languages-disclaimer"'),
  "Languages stage must NOT contain demo-languages-disclaimer (moved to Settings footer)",
);
console.log("✅ PASS: demo-languages-disclaimer is not present in Languages stage.");

// Test 3: Disclaimer preserves required content (L2Ryrr6txwA fixture note)
console.log("\n[Test 3] Verifying disclaimer content preservation...");
assert.ok(
  indexContent.includes("L2Ryrr6txwA"),
  "Disclaimer must cite fixture video ID L2Ryrr6txwA",
);
assert.ok(
  indexContent.includes("Demo Mode Caption Limitation Note"),
  "Disclaimer must include 'Demo Mode Caption Limitation Note' title",
);
console.log("✅ PASS: Disclaimer content accurately preserved.");

console.log("\n=========================================================================");
console.log("🎉 ALL TESTS PASSED: Disclaimer moved to Settings footer successfully! (Task 376.2)");
console.log("=========================================================================");
