import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying MainActivity.kt executeTimedTextRepetition Scope (Hotfix)");
console.log("=========================================================================");

const rootDir = process.cwd();
const mainActivityPath = path.resolve(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);

assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const content = fs.readFileSync(mainActivityPath, "utf8");

// Test 1: Check that executeTimedTextRepetition is called in shouldInterceptRequest
console.log("--> [Test 1] Verifying shouldInterceptRequest invokes executeTimedTextRepetition...");
const interceptorMatch = content.match(/shouldInterceptRequest[\s\S]*?fun executeTimedTextRepetition/);
assert(
  interceptorMatch && interceptorMatch[0].includes("val json3Body = executeTimedTextRepetition(url, lang, \"json3\")"),
  "shouldInterceptRequest must call executeTimedTextRepetition on line ~235",
);
console.log("✅ PASS: shouldInterceptRequest calls executeTimedTextRepetition.");

// Test 2: Check that executeTimedTextRepetition is declared at MainActivity level (outside AndroidNativeBridge)
console.log("--> [Test 2] Verifying executeTimedTextRepetition is declared at MainActivity class scope...");
const bridgeEndIdx = content.indexOf("class AndroidNativeBridge");
assert(bridgeEndIdx > 0, "AndroidNativeBridge class declaration must exist");

const repetitionDeclIdx = content.indexOf("fun executeTimedTextRepetition(base: String");
assert(repetitionDeclIdx > 0, "fun executeTimedTextRepetition must be declared");

// Verify that between the bridge end and executeTimedTextRepetition, AndroidNativeBridge closes
const bridgeSub = content.substring(bridgeEndIdx, repetitionDeclIdx);
// The last closing brace before repetitionDeclIdx closes AndroidNativeBridge
assert(bridgeSub.includes("fetchTranslatedCaptionsWithUrl"), "fetchTranslatedCaptionsWithUrl must be in AndroidNativeBridge");
assert(bridgeSub.trim().endsWith("}"), "AndroidNativeBridge must close before fun executeTimedTextRepetition");
console.log("✅ PASS: executeTimedTextRepetition is at MainActivity class level, accessible to both WebViewClient and bridge.");

// Test 3: Check that AndroidNativeBridge also successfully invokes executeTimedTextRepetition
console.log("--> [Test 3] Verifying AndroidNativeBridge calls executeTimedTextRepetition...");
assert(
  content.includes("fetchTranslatedCaptionsWithUrl(customUrl: String, targetLang: String, format: String): String"),
  "fetchTranslatedCaptionsWithUrl must be declared",
);
assert(
  content.includes("return executeTimedTextRepetition(base, targetLang, format)"),
  "AndroidNativeBridge must delegate to executeTimedTextRepetition",
);
console.log("✅ PASS: AndroidNativeBridge calls executeTimedTextRepetition cleanly.");

// Test 4: Verify package.json script registration
console.log("--> [Test 4] Verifying package.json registration...");
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf8"));
assert(
  pkg.scripts["test:mainactivity-scope"],
  "package.json must contain 'test:mainactivity-scope' script",
);
console.log("✅ PASS: package.json script registered.");

// Test 5: Verify docs/files.md registration
console.log("--> [Test 5] Verifying docs/files.md registration...");
const filesMdContent = fs.readFileSync(path.resolve(rootDir, "docs/files.md"), "utf8");
assert(
  filesMdContent.includes("verify-android-mainactivity-compilation.ts"),
  "docs/files.md must inventory verify-android-mainactivity-compilation.ts",
);
console.log("✅ PASS: docs/files.md inventories verify-android-mainactivity-compilation.ts.");

console.log("=========================================================================");
console.log("🎉 ALL MAINACTIVITY SCOPE CHECKS PASSED (100%)!");
console.log("=========================================================================");
