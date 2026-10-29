import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Starting Alternative TTS Provider Selector Styling & Parity Test Suite");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: Advanced Mode Provider & Voice Selectors Styling
console.log("\n🎨 Test 1: Verifying Advanced Mode Selectors Styling in src/routes/index.tsx...");
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexContent.includes('data-testid="lovable-tts-provider-select"'),
  "Advanced mode must include lovable-tts-provider-select",
);
assert.ok(
  indexContent.includes('data-testid="lovable-tts-voice-select"'),
  "Advanced mode must include lovable-tts-voice-select",
);

// Check enhanced styling tokens on provider select in Advanced mode
assert.ok(
  indexContent.includes(
    "focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-primary/50 cursor-pointer",
  ),
  "Advanced mode provider and voice selects must include interactive focus ring and hover styling",
);
console.log("✅ PASS: Advanced mode selectors feature interactive styling and focus rings.");

// Test 2: Beginner Mode Provider & Voice Selectors Styling
console.log(
  "\n🎨 Test 2: Verifying Beginner Mode Selectors Styling in BeginnerPreferencesTab.tsx...",
);
const beginnerPath = path.resolve(
  rootDir,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
assert.ok(fs.existsSync(beginnerPath), "BeginnerPreferencesTab.tsx must exist");
const beginnerContent = fs.readFileSync(beginnerPath, "utf-8");

assert.ok(
  beginnerContent.includes('data-testid="beginner-lovable-tts-provider-select"'),
  "Beginner mode must include beginner-lovable-tts-provider-select",
);
assert.ok(
  beginnerContent.includes('data-testid="beginner-lovable-tts-voice-select"'),
  "Beginner mode must include beginner-lovable-tts-voice-select",
);

// Check enhanced styling tokens on provider select in Beginner mode
assert.ok(
  beginnerContent.includes(
    "focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-primary/50 cursor-pointer",
  ),
  "Beginner mode provider and voice selects must include interactive focus ring and hover styling",
);
console.log("✅ PASS: Beginner mode selectors feature interactive styling and 100% parity.");

// Test 3: No duplicate comments in BeginnerPreferencesTab.tsx
console.log("\n🧹 Test 3: Checking clean comment hygiene in BeginnerPreferencesTab.tsx...");
const duplicateCommentMatches = beginnerContent.match(
  /\{\/\* 2\. TTS Speed & Voice Selection \*\/\}/g,
);
assert.strictEqual(
  duplicateCommentMatches?.length || 0,
  1,
  "BeginnerPreferencesTab.tsx must not contain duplicate section comment headers",
);
console.log("✅ PASS: Clean single section header comment verified.");

// Test 4: Version 1.0.75 Synchronization Across All 5 Targets
console.log("\n📦 Test 4: Verifying Version 1.0.75 Synchronization across all 5 Targets...");
const expectedVersion = "1.0.75";
const expectedVersionCode = 10075;

// 1. package.json
const pkgJson = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert.strictEqual(
  pkgJson.version,
  expectedVersion,
  `package.json version must be ${expectedVersion}`,
);

// 2. android-shell/app/build.gradle.kts
const gradleContent = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert.ok(
  gradleContent.includes(`versionCode = ${expectedVersionCode}`),
  `build.gradle.kts versionCode must be ${expectedVersionCode}`,
);
assert.ok(
  gradleContent.includes(`versionName = "${expectedVersion}"`),
  `build.gradle.kts versionName must be "${expectedVersion}"`,
);

// 3. src/config/appConfig.ts
const appConfigContent = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf-8");
assert.ok(
  appConfigContent.includes(`export const APP_VERSION = "${expectedVersion}";`),
  `appConfig.ts APP_VERSION must be "${expectedVersion}"`,
);

// 4. src/utils/apkUpdater.ts
const apkUpdaterContent = fs.readFileSync(
  path.resolve(rootDir, "src/utils/apkUpdater.ts"),
  "utf-8",
);
assert.ok(
  apkUpdaterContent.includes(`export const CURRENT_APK_VERSION = "v${expectedVersion}";`),
  `apkUpdater.ts CURRENT_APK_VERSION must be "v${expectedVersion}"`,
);

// 5. src/utils/appSettings.ts
const appSettingsContent = fs.readFileSync(
  path.resolve(rootDir, "src/utils/appSettings.ts"),
  "utf-8",
);
assert.ok(
  appSettingsContent.includes(`version: "${expectedVersion}",`),
  `appSettings.ts version must be "${expectedVersion}"`,
);
console.log(`✅ PASS: Version ${expectedVersion} correctly synchronized across all 5 files.`);

console.log("\n=========================================================================");
console.log("🎉 ALL ALTERNATIVE TTS PROVIDER STYLING & PARITY TESTS PASSED 100%!");
console.log("=========================================================================");
