import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying MainActivity.kt executeTimedTextRepetition Explicit Qualifier (Task 161)");
console.log("=========================================================================");

const rootDir = process.cwd();
const mainActivityPath = path.resolve(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);

assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const content = fs.readFileSync(mainActivityPath, "utf8");

// Test 1: Check that shouldInterceptRequest explicitly qualifies executeTimedTextRepetition with this@MainActivity
console.log("--> [Test 1] Verifying shouldInterceptRequest invokes this@MainActivity.executeTimedTextRepetition...");
assert(
  content.includes('val json3Body = this@MainActivity.executeTimedTextRepetition(url, lang, "json3")'),
  "shouldInterceptRequest must call this@MainActivity.executeTimedTextRepetition",
);
console.log("✅ PASS: shouldInterceptRequest explicitly qualifies executeTimedTextRepetition.");

// Test 2: Check that executeTimedTextRepetition method is declared at MainActivity class scope
console.log("--> [Test 2] Verifying executeTimedTextRepetition is declared at MainActivity class scope...");
const repetitionDecl = "fun executeTimedTextRepetition(base: String, targetLang: String, format: String): String";
assert(content.includes(repetitionDecl), "fun executeTimedTextRepetition must be declared");

const bridgeIdx = content.indexOf("class AndroidNativeBridge");
const repIdx = content.indexOf(repetitionDecl);
assert(bridgeIdx > 0 && repIdx > bridgeIdx, "executeTimedTextRepetition must follow bridge declaration");

const bridgeSub = content.substring(bridgeIdx, repIdx);
assert(
  bridgeSub.trim().endsWith("}"),
  "AndroidNativeBridge must close cleanly before fun executeTimedTextRepetition",
);
console.log("✅ PASS: executeTimedTextRepetition is declared at MainActivity class scope.");

// Test 3: Check that AndroidNativeBridge methods also use explicit this@MainActivity qualification
console.log("--> [Test 3] Verifying AndroidNativeBridge calls qualify this@MainActivity.executeTimedTextRepetition...");
assert(
  content.includes("return this@MainActivity.executeTimedTextRepetition(base, targetLang, format)"),
  "AndroidNativeBridge must qualify executeTimedTextRepetition with this@MainActivity",
);
console.log("✅ PASS: AndroidNativeBridge calls are explicitly qualified.");

console.log("=========================================================================");
console.log("🎉 ALL ANDROID MAINACTIVITY REPETITION SCOPE VERIFICATIONS PASSED!");
console.log("=========================================================================");
