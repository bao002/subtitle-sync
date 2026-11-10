import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Primary/Secondary Relative Ratio Deprecation (Task 376.3)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");

const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

// Test 1: Deprecated badge is present in UI banner
console.log("\n[Test 1] Verifying deprecated badge in UI banner...");
assert.ok(
  indexContent.includes('data-testid="tts-primary-secondary-deprecated-badge"'),
  "UI must expose 'tts-primary-secondary-deprecated-badge'",
);
assert.ok(
  indexContent.includes("[Deprecated]"),
  "UI badge must contain '[Deprecated]' text",
);
console.log("✅ PASS: Deprecated badge is present in the UI banner.");

// Test 2: Ratio note container exists
console.log("\n[Test 2] Verifying ratio note container...");
assert.ok(
  indexContent.includes('data-testid="tts-primary-secondary-ratio-note"'),
  "UI must expose 'tts-primary-secondary-ratio-note'",
);
assert.ok(
  indexContent.includes("Primary leads; secondary languages speak relative to primary"),
  "Banner must preserve primary leads relative ratio explanation",
);
console.log("✅ PASS: Relative ratio banner container and explanation preserved.");

// Test 3: docs/deprecated.md documents the deprecation
console.log("\n[Test 3] Verifying docs/deprecated.md documentation...");
const deprecatedDocPath = path.join(rootDir, "docs/deprecated.md");
assert.ok(fs.existsSync(deprecatedDocPath), "docs/deprecated.md must exist");
const deprecatedDocContent = fs.readFileSync(deprecatedDocPath, "utf-8");

assert.ok(
  deprecatedDocContent.includes("Relative TTS Ratio using Primary and Secondary Languages (Deprecated)"),
  "docs/deprecated.md must include section for primary/secondary relative ratio deprecation",
);
assert.ok(
  deprecatedDocContent.includes("data-testid=\"tts-primary-secondary-deprecated-badge\""),
  "docs/deprecated.md must cite the deprecated badge testid",
);
console.log("✅ PASS: docs/deprecated.md accurately records the deprecation.");

console.log("\n=========================================================================");
console.log("🎉 ALL TESTS PASSED: Primary/secondary relative ratio deprecated! (Task 376.3)");
console.log("=========================================================================");
