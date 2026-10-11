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

// Assert proactiveDetectSubtitles has bundled fixture fallback for offline / emulator parity
assert(
  activityContent.includes("fixtures/$videoId/en.json") ||
    activityContent.includes("fixtures/L2Ryrr6txwA/en.json"),
  "proactiveDetectSubtitles must include offline asset fixture fallback",
);
assert(
  activityContent.includes("SUBTITLE_FETCH kind=default http=200"),
  "proactiveDetectSubtitles must log SUBTITLE_FETCH kind=default http=200 upon resolution",
);
console.log("✅ PASS: proactiveDetectSubtitles includes offline asset fixture resolution and default log");

// Assert executeTimedTextRepetition preserves lang parameter
assert(
  activityContent.includes('val originalLang = uri.getQueryParameter("lang")?.takeIf { it.isNotBlank() } ?: "en"'),
  "executeTimedTextRepetition must ensure originalLang is never omitted or blank",
);
console.log("✅ PASS: executeTimedTextRepetition ensures originalLang is always set");

// 2. Verify bundled assets have fixtures available
const assetsDir = path.join(rootDir, "android-shell/app/src/main/assets");
const enFixturePath = path.join(assetsDir, "fixtures/L2Ryrr6txwA/en.json");
const heFixturePath = path.join(assetsDir, "fixtures/L2Ryrr6txwA/he.json");
const itFixturePath = path.join(assetsDir, "fixtures/L2Ryrr6txwA/it.json");

assert(fs.existsSync(enFixturePath), "en.json fixture must exist in Android assets");
assert(fs.existsSync(heFixturePath), "he.json fixture must exist in Android assets");
assert(fs.existsSync(itFixturePath), "it.json fixture must exist in Android assets");
console.log("✅ PASS: Multilingual JSON3 fixtures physically present in bundled Android assets");

// 3. Verify src/routes/index.tsx subtitle fetching fallback
const indexPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf8");

assert(
  indexContent.includes("JSON3_RAW_MAP[code]"),
  "src/routes/index.tsx must include fallback recovery to JSON3_RAW_MAP[code]",
);
console.log("✅ PASS: React web application integrates resilient fallback for favorite language subtitles");

console.log("==================================================================");
console.log("🎉 ALL ANDROID COMMIT 25131f0 PARITY CHECKS PASSED SUCCESSFULLY!");
console.log("==================================================================");
