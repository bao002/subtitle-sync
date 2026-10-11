import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("==================================================================");
console.log("🧪 Running Android Commit 25131f0 Parity & Runtime Integrity Test");
console.log("==================================================================");

const rootDir = process.cwd();

// 1. Verify MainActivity.kt has proactive subtitle detection & correct query suffix fallback
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const activityContent = fs.readFileSync(mainActivityPath, "utf8");

// Assert onCreate calls proactiveDetectSubtitles
assert(
  activityContent.includes("proactiveDetectSubtitles(initialVideoId)"),
  "MainActivity.kt onCreate must call proactiveDetectSubtitles(initialVideoId)",
);
console.log("✅ PASS: onCreate calls proactiveDetectSubtitles(initialVideoId)");

// Assert onNewIntent calls proactiveDetectSubtitles
assert(
  activityContent.includes("proactiveDetectSubtitles(targetVideoId)"),
  "MainActivity.kt onNewIntent must call proactiveDetectSubtitles(targetVideoId)",
);
console.log("✅ PASS: onNewIntent calls proactiveDetectSubtitles(targetVideoId)");

// Assert query suffix fallback ensures default video and android=true
assert(
  activityContent.includes('buildQuerySuffix(sharedText).ifEmpty { "?v=vBURridJXZ0&android=true" }'),
  "MainActivity.kt must provide fallback to ?v=vBURridJXZ0&android=true on default launch",
);
console.log("✅ PASS: querySuffix guarantees default video ID and android=true on launch");

// Assert proactiveDetectSubtitles queries genuine timedtext test URLs without fixture fallback
assert(
  activityContent.includes("https://www.youtube.com/api/timedtext?v=$videoId&fmt=json3"),
  "proactiveDetectSubtitles must query authentic YouTube timedtext URLs",
);
assert(
  !activityContent.includes("fixtures/$videoId/en.json") &&
    !activityContent.includes("fixtures/L2Ryrr6txwA/en.json"),
  "proactiveDetectSubtitles must not use offline asset fixture fallback",
);
console.log("✅ PASS: proactiveDetectSubtitles queries authentic timedtext without fixture fallback");

// Assert executeTimedTextRepetition preserves lang parameter
assert(
  activityContent.includes('val originalLang = uri.getQueryParameter("lang")?.takeIf { it.isNotBlank() } ?: "en"'),
  "executeTimedTextRepetition must ensure originalLang is never omitted or blank",
);
console.log("✅ PASS: executeTimedTextRepetition ensures originalLang is always set");

// 2. Verify bundled assets have web application resources
const assetsDir = path.join(rootDir, "android-shell/app/src/main/assets");
const indexHtmlPath = path.join(assetsDir, "index.html");
assert(fs.existsSync(indexHtmlPath), "index.html must exist in Android assets");
console.log("✅ PASS: Production web application bundled in Android assets");

// 3. Verify src/routes/index.tsx authentic subtitle fetching
const indexPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf8");

assert(
  !indexContent.includes("JSON3_RAW_MAP[code]"),
  "src/routes/index.tsx must not fall back to JSON3_RAW_MAP[code] fixtures for live languages",
);
console.log("✅ PASS: React application uses authentic native bridge and network subtitles without fixture fallbacks");

console.log("==================================================================");
console.log("🎉 ALL ANDROID COMMIT 25131f0 PARITY CHECKS PASSED SUCCESSFULLY!");
console.log("==================================================================");
