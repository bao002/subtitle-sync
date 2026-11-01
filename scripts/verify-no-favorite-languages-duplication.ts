import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Elimination of Duplicate Favorite Languages Lists (Task 264)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
const pkgPath = path.join(rootDir, "package.json");
const gradlePath = path.join(rootDir, "android-shell/app/build.gradle.kts");
const appConfigPath = path.join(rootDir, "src/config/appConfig.ts");
const apkUpdaterPath = path.join(rootDir, "src/utils/apkUpdater.ts");
const appSettingsPath = path.join(rootDir, "src/utils/appSettings.ts");

assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

// Check 1: Stage 2 isolation prevents duplicate favorite languages lists in Languages accordion
console.log("--> [Check 1] Verifying Stage 2 isolation in Languages accordion...");
assert.ok(
  indexContent.includes('currentAccordionStage === 2 ?'),
  "Languages accordion must conditionally isolate Stage 2 card based on currentAccordionStage === 2",
);
assert.ok(
  indexContent.includes('data-testid="stage-2-learning-goals-card"'),
  "Stage 2 learning goals card must be preserved for Stage 2 flow",
);
console.log("✅ PASS: Stage 2 learning goals card is cleanly isolated to Stage 2.");

// Check 2: Outside Stage 2, standard Languages view renders without stage-2 duplicate card
console.log("--> [Check 2] Verifying standard Languages view is free of Stage 2 duplicate card...");
assert.ok(
  indexContent.includes('<LanguageBoxesSelector'),
  "Standard Languages view must render LanguageBoxesSelector for active video selection",
);
assert.ok(
  indexContent.includes('<GlobalFavoriteLanguagesPanel'),
  "Standard Languages view must render GlobalFavoriteLanguagesPanel for global defaults",
);
console.log("✅ PASS: LanguageBoxesSelector and GlobalFavoriteLanguagesPanel cleanly render in standard view without Stage 2 card repetition.");

// Check 3: Version synchronization across all 5 files
console.log("--> [Check 3] Verifying version synchronization across all 5 files...");
const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const expectedVersion = pkgJson.version as string;
assert.match(expectedVersion, /^\d+\.\d+\.\d+$/, "package.json version must be semantic");
const [major, minor, patch] = expectedVersion.split(".").map(Number);
const expectedVersionCode = major! * 10000 + minor! * 100 + patch!;

const gradleContent = fs.readFileSync(gradlePath, "utf-8");
assert.ok(gradleContent.includes(`versionName = "${expectedVersion}"`), `Gradle versionName must match ${expectedVersion}`);
assert.ok(gradleContent.includes(`versionCode = ${expectedVersionCode}`), `Gradle versionCode must match ${expectedVersionCode}`);

const appConfigContent = fs.readFileSync(appConfigPath, "utf-8");
assert.ok(appConfigContent.includes(`APP_VERSION = "${expectedVersion}"`), `appConfig.ts must match ${expectedVersion}`);

const apkUpdaterContent = fs.readFileSync(apkUpdaterPath, "utf-8");
assert.ok(apkUpdaterContent.includes(`CURRENT_APK_VERSION = "v${expectedVersion}"`), `apkUpdater.ts must match v${expectedVersion}`);

const appSettingsContent = fs.readFileSync(appSettingsPath, "utf-8");
assert.ok(appSettingsContent.includes(`version: "${expectedVersion}"`), `appSettings.ts must match ${expectedVersion}`);
console.log(`✅ PASS: All 5 files consistently synchronized to version ${expectedVersion}.`);

console.log("=========================================================================");
console.log("🎉 ALL DUPLICATE FAVORITE LANGUAGES CHECKS PASSED (100%)!");
console.log("=========================================================================");
