import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Hotfix Verification: initialState ReferenceError");
console.log("====================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");

const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// 1. Verify that 'initialState' is NOT referenced in src/routes/index.tsx
const hasInitialState = indexContent.includes("initialState");
assert(
  !hasInitialState,
  "src/routes/index.tsx must not reference undefined 'initialState'",
);
console.log("✅ PASS: No references to undefined 'initialState' in src/routes/index.tsx");

// 2. Verify that defaultSubtitleLanguages initializes with videoId || DEFAULT_VIDEO_ID
const expectedPattern =
  /const\s*\[defaultSubtitleLanguages,\s*setDefaultSubtitleLanguages\]\s*=\s*useState<string\[\]>\(\(\)\s*=>\s*getDefaultSubtitleLanguages\(videoId\s*\|\|\s*DEFAULT_VIDEO_ID\)/;
assert(
  expectedPattern.test(indexContent),
  "defaultSubtitleLanguages must initialize using videoId || DEFAULT_VIDEO_ID",
);
console.log(
  "✅ PASS: defaultSubtitleLanguages correctly initializes with (videoId || DEFAULT_VIDEO_ID)",
);

console.log("====================================================");
console.log("🎉 HOTFIX VERIFICATION: All assertions passed successfully!");
console.log("====================================================");
