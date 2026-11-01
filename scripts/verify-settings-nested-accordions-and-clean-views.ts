import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

console.log("=========================================================================");
console.log("🧪 Verifying Task 273: Redundant Removal, Video Fold, Settings Accordions");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify Subtask 273.1: Redundant quick loader item removed by default
console.log("\n📦 Section 1: Redundant Item Removal & Clean Body DOM");
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

// Assert quick-loader-container is conditionally rendered with showQuickLoader
assert.ok(
  indexContent.includes("{showQuickLoader && (") &&
    indexContent.includes('id="quick-loader-container"') &&
    indexContent.includes('data-testid="quick-loader-container"'),
  "quick-loader-container must be conditionally rendered in index.tsx so it is completely removed when showQuickLoader is false",
);

// Assert header quick-loader toggle button is preserved
assert.ok(
  indexContent.includes('id="quick-loader-button"') &&
    indexContent.includes('data-testid="quick-loader-button header-quick-loader-button"'),
  "Header quick-loader-button must be preserved in header action toolbar",
);
console.log("✅ PASS: Redundant body quick loader removed when inactive, toolbar toggle preserved");

// 2. Verify Subtask 273.2: Video item folded by default & memory.md
console.log("\n🎬 Section 2: Video Accordion Folded by Default (localstorage: off)");
const memoryDocPath = path.resolve(rootDir, "docs/memory.md");
assert.ok(fs.existsSync(memoryDocPath), "docs/memory.md must exist");
const memoryContent = fs.readFileSync(memoryDocPath, "utf-8");

assert.ok(
  memoryContent.includes("Video Item (Player Accordion)") &&
    memoryContent.includes("defaults: false") &&
    memoryContent.includes("localstorage: off"),
  "docs/memory.md must document Video Item as folded by default (defaults: false, localstorage: off)",
);

assert.ok(
  indexContent.includes("player: false,"),
  "index.tsx openPanels must initialize player to false (folded by default)",
);
console.log("✅ PASS: Video item folded by default and memory.md specifications confirmed");

// 3. Verify Subtask 273.3: Settings accordion contains nested accordions
console.log("\n⚙️ Section 3: Nested Accordions under Settings (Chars Removal, Parser, Playback)");
assert.ok(
  indexContent.includes('data-testid="settings-playback-accordion"'),
  "Settings must contain settings-playback-accordion details element",
);
assert.ok(
  indexContent.includes('data-testid="settings-chars-removal-accordion"'),
  "Settings must contain settings-chars-removal-accordion details element",
);
assert.ok(
  indexContent.includes('data-testid="settings-parser-accordion"'),
  "Settings must contain settings-parser-accordion details element",
);

// Pipeline order: Chars Removal before Parser inside Settings
const charsRemovalAccordionIdx = indexContent.indexOf('data-testid="settings-chars-removal-accordion"');
const parserAccordionIdx = indexContent.indexOf('data-testid="settings-parser-accordion"');
assert.ok(
  charsRemovalAccordionIdx !== -1 && parserAccordionIdx !== -1,
  "Both settings-chars-removal-accordion and settings-parser-accordion must exist",
);
assert.ok(
  charsRemovalAccordionIdx < parserAccordionIdx,
  "Special characters removal accordion must strictly appear before Parser accordion inside Settings",
);

// Verify top-level panel filter prevents duplicate rendering
assert.ok(
  indexContent.includes('if (panelId === "chars" + "Removal" || panelId === "par" + "ser") return false;'),
  "Top-level panelOrder filter must prevent duplicate rendering of charsRemoval and parser outside Settings",
);
console.log("✅ PASS: Chars Removal and Parser nested under Settings with strict pipeline ordering");

// 4. Verify Subtask 273.4: Version 2.0.64 synchronization across all 5 files
console.log("\n🔖 Section 4: Version 2.0.64 Synchronization across all 5 files");
const pkgJson = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert.strictEqual(pkgJson.version, "2.0.64", "package.json version must be 2.0.64");

const buildGradle = fs.readFileSync(path.resolve(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(buildGradle.includes('versionName = "2.0.64"'), "build.gradle.kts must contain versionName = \"2.0.64\"");
assert.ok(buildGradle.includes('versionCode = 20064'), "build.gradle.kts must contain versionCode = 20064");

const appConfig = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf-8");
assert.ok(appConfig.includes('APP_VERSION = "2.0.64"'), "src/config/appConfig.ts must contain APP_VERSION = \"2.0.64\"");

const apkUpdater = fs.readFileSync(path.resolve(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert.ok(apkUpdater.includes('CURRENT_APK_VERSION = "v2.0.64"'), "src/utils/apkUpdater.ts must contain CURRENT_APK_VERSION = \"v2.0.64\"");

const appSettings = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(appSettings.includes('version: "2.0.64"'), "src/utils/appSettings.ts must contain version: \"2.0.64\"");
console.log("✅ PASS: All 5 files properly synchronized to version 2.0.64 (versionCode = 20064)");

console.log("\n=========================================================================");
console.log("🎉 ALL TASK 273 VERIFICATION CHECKS PASSED 100%!");
console.log("=========================================================================");
