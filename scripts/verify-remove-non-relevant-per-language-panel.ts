import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { APP_VERSION } from "../src/config/appConfig";

console.log("=========================================================================");
console.log("🧪 Running Dedicated Verification: Remove Non-Relevant Per-Language Panel (Task 263)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

// Test 1: data-testid="per-language-settings-panel" is completely removed
console.log("\n[Test 1] Verifying removal of data-testid='per-language-settings-panel'...");
assert.ok(
  !indexContent.includes('data-testid="per-language-settings-panel"'),
  "src/routes/index.tsx must not contain data-testid='per-language-settings-panel'",
);
console.log("✅ PASS: data-testid='per-language-settings-panel' is removed");

// Test 2: Unused expandedLanguageSettings state and setter are removed
console.log("\n[Test 2] Verifying removal of expandedLanguageSettings state...");
assert.ok(
  !indexContent.includes("expandedLanguageSettings"),
  "src/routes/index.tsx must not declare or reference expandedLanguageSettings",
);
assert.ok(
  !indexContent.includes("setExpandedLanguageSettings"),
  "src/routes/index.tsx must not declare or reference setExpandedLanguageSettings",
);
console.log("✅ PASS: expandedLanguageSettings state and setter completely eliminated");

// Test 3: tts-settings-summary buttons are removed
console.log("\n[Test 3] Verifying removal of tts-settings-summary buttons...");
assert.ok(
  !indexContent.includes("tts-settings-summary-"),
  "src/routes/index.tsx must not render tts-settings-summary- buttons",
);
console.log("✅ PASS: tts-settings-summary- buttons eliminated");

// Test 4: Essential per-language TTS controls and role switcher are preserved
console.log("\n[Test 4] Verifying essential per-language TTS cards are preserved...");
assert.ok(
  indexContent.includes("tts-settings-card-"),
  "src/routes/index.tsx must preserve active tts-settings-card- items",
);
assert.ok(
  indexContent.includes("tts-switch-roles-button-advanced"),
  "src/routes/index.tsx must preserve primary/secondary role switch button",
);
console.log("✅ PASS: Essential per-language TTS cards and role switch controls preserved");

// Test 5: Language table is intact
console.log("\n[Test 5] Verifying language table integrity...");
assert.ok(
  indexContent.includes("checkbox-present-in-table-"),
  "src/routes/index.tsx must preserve Present in Table checkboxes",
);
assert.ok(
  indexContent.includes("checkbox-tts-play-"),
  "src/routes/index.tsx must preserve TTS-play checkboxes",
);
console.log("✅ PASS: Languages table controls intact");

// Test 6: App version is 2.0.*
console.log("\n[Test 6] Verifying version 2.0.* synchronization...");
assert.ok(APP_VERSION.startsWith("2.0."), "APP_VERSION must start with 2.0.");
console.log(`✅ PASS: APP_VERSION is ${APP_VERSION}`);

console.log("\n=========================================================================");
console.log("🎉 ALL REMOVE NON-RELEVANT PER-LANGUAGE PANEL CHECKS PASSED 100%!");
console.log("=========================================================================");
