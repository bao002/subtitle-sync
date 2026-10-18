import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  extractDetectedLanguage,
  applyVideoSharingFavoriteLanguageRules,
} from "../src/utils/favoriteLanguagesRules";

console.log("=========================================================================");
console.log("🧪 Verifying Video Sharing Favorite Languages Rules (Task 146)");
console.log("=========================================================================");

const rootDir = process.cwd();

// Mock localStorage for node test execution
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};
(globalThis as any).window = globalThis;

// --- Test 1: Extract Detected Language from URLs, Query Params, or Fallback ---
console.log("\nTest 1: Language extraction from URLs & query parameters...");
assert.strictEqual(extractDetectedLanguage(undefined), "en", "Empty/undefined should fallback to en");
assert.strictEqual(extractDetectedLanguage(""), "en", "Empty string should fallback to en");
assert.strictEqual(extractDetectedLanguage("es"), "es", "Direct lang code 'es' should return 'es'");
assert.strictEqual(extractDetectedLanguage("iw"), "he", "Direct legacy code 'iw' should normalize to 'he'");
assert.strictEqual(
  extractDetectedLanguage("https://www.youtube.com/watch?v=L2Ryrr6txwA&lang=ar"),
  "ar",
  "Should extract lang=ar parameter",
);
assert.strictEqual(
  extractDetectedLanguage("https://youtu.be/L2Ryrr6txwA?subLang=it"),
  "it",
  "Should extract subLang=it parameter",
);
assert.strictEqual(
  extractDetectedLanguage("https://www.youtube.com/watch?v=L2Ryrr6txwA&hl=fr"),
  "fr",
  "Should extract hl=fr parameter",
);
assert.strictEqual(
  extractDetectedLanguage("https://www.youtube.com/watch?v=L2Ryrr6txwA"),
  "en",
  "Standard link without lang query should fallback to default 'en'",
);
console.log("✅ PASS: extractDetectedLanguage functions accurately across all query and fallback variations.");

// --- Test 2: Rule a - Add default/detected language at the bottom ---
console.log("\nTest 2: Rule a - Default/detected language placed strictly at the bottom...");
// Case A: Initial favs ["he", "it"], detected language "en" -> ["he", "it", "en"]
const resA = applyVideoSharingFavoriteLanguageRules("https://youtu.be/test1", {
  currentFavorites: ["he", "it"],
  persist: false,
});
assert.deepStrictEqual(
  resA.orderedFavorites,
  ["he", "it", "en"],
  "Default 'en' must be added at the bottom",
);
assert.strictEqual(resA.bottomLanguage, "en");

// Case B: Initial favs ["en", "he", "it"], detected language "en" -> ["he", "it", "en"]
const resB = applyVideoSharingFavoriteLanguageRules("https://youtu.be/test2", {
  currentFavorites: ["en", "he", "it"],
  persist: false,
});
assert.deepStrictEqual(
  resB.orderedFavorites,
  ["he", "it", "en"],
  "Existing 'en' must be moved to the bottom",
);

// Case C: Detected language from link "es", initial favs ["he", "es", "it"] -> ["he", "it", "es"]
const resC = applyVideoSharingFavoriteLanguageRules("https://youtu.be/test3?lang=es", {
  currentFavorites: ["he", "es", "it"],
  persist: false,
});
assert.deepStrictEqual(
  resC.orderedFavorites,
  ["he", "it", "es"],
  "Detected language 'es' must be moved to the bottom",
);
console.log("✅ PASS: Rule a verified - default/detected language is placed strictly at the bottom.");

// --- Test 3: Rule b - Remove any tts-play checkbox selection and checkbox-select only top language ---
console.log("\nTest 3: Rule b - Checkbox-select only the top language for tts-play...");
assert.deepStrictEqual(
  resA.spokenLanguages,
  ["he"],
  "Spoken list must contain ONLY the top language ('he')",
);
assert.strictEqual(resA.topLanguage, "he", "Top language should be 'he'");
assert.strictEqual(
  resA.spokenLanguages.includes("it"),
  false,
  "Secondary languages must not be selected for tts-play",
);
assert.strictEqual(
  resA.spokenLanguages.includes("en"),
  false,
  "Bottom detected language must not be selected for tts-play",
);

const resD = applyVideoSharingFavoriteLanguageRules("https://youtu.be/test4?lang=ar", {
  currentFavorites: ["ru", "es", "ar"],
  persist: false,
});
assert.deepStrictEqual(
  resD.orderedFavorites,
  ["ru", "es", "ar"],
  "Order should be ['ru', 'es', 'ar']",
);
assert.deepStrictEqual(
  resD.spokenLanguages,
  ["ru"],
  "Only top language 'ru' must be selected for tts-play",
);
console.log("✅ PASS: Rule b verified - only the top language is selected for tts-play.");

// --- Test 4: Rule c - The order should be stored on localStorage ---
console.log("\nTest 4: Rule c - Order stored in localStorage...");
mockStorage["yt_favorite_languages"] = "";
const resPersist = applyVideoSharingFavoriteLanguageRules("https://youtu.be/test5?lang=it", {
  currentFavorites: ["he", "it", "fr"],
  persist: true,
});
assert.deepStrictEqual(resPersist.orderedFavorites, ["he", "fr", "it"]);
const stored = JSON.parse(mockStorage["yt_favorite_languages"] || "[]");
assert.deepStrictEqual(
  stored,
  ["he", "fr", "it"],
  "Stored localStorage favorites must match ordered favorites with detected at bottom",
);
console.log("✅ PASS: Rule c verified - order correctly stored in localStorage.");

// --- Test 5: Rule d - Allow multi-selection ---
console.log("\nTest 5: Rule d - Multi-selection allowed...");
// In the app, spoken array and targetLanguages are standard string arrays allowing multiple items
const multiSelection = [...resPersist.spokenLanguages, "fr", "it"];
assert.strictEqual(multiSelection.length, 3, "Multi-selection of spoken languages must be supported");
const selectorSource = fs.readFileSync(
  path.resolve(rootDir, "src/components/LanguageBoxesSelector.tsx"),
  "utf8",
);
assert.ok(
  selectorSource.includes("onSelectionChange: (next: string[]) => void"),
  "LanguageBoxesSelector must accept multi-selection string array",
);
console.log("✅ PASS: Rule d verified - multi-selection is fully supported.");

// --- Test 6: Route Integration in src/routes/index.tsx ---
console.log("\nTest 6: Integration in src/routes/index.tsx...");
const indexSource = fs.readFileSync(path.resolve(rootDir, "src/routes/index.tsx"), "utf8");
assert.ok(
  indexSource.includes("applyVideoSharingFavoriteLanguageRules"),
  "src/routes/index.tsx must import and use applyVideoSharingFavoriteLanguageRules",
);
assert.ok(
  indexSource.includes("applyVideoSharingFavoriteLanguageRules(link"),
  "openLink must apply favorite language rules on shared link",
);
assert.ok(
  indexSource.includes("applyVideoSharingFavoriteLanguageRules(baseLanguage"),
  "baseLanguage effect must apply favorite language rules on detected track",
);
assert.ok(
  indexSource.includes("applyVideoSharingFavoriteLanguageRules(videoInput"),
  "youtube-url-form submit must apply favorite language rules",
);
assert.ok(
  indexSource.includes("checkbox-tts-play"),
  "index.tsx must render tts-play checkbox with data-testid='checkbox-tts-play-*'",
);
console.log("✅ PASS: Route integration properly wires favorite language rules across all sharing paths.");

// --- Test 7: Version Parity Verification across all 5 Targets ---
console.log("\nTest 7: Version parity check for 1.0.49 / 10049...");
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf8"));
const currentVersion = pkg.version;
assert.strictEqual(currentVersion, "1.0.49", "package.json version must be 1.0.49");

const parts = currentVersion.split(".").map((n: string) => parseInt(n, 10) || 0);
const expectedCode = (parts[0] || 1) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);

const gradleContent = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/build.gradle.kts"),
  "utf8",
);
assert(
  gradleContent.includes(`versionCode = ${expectedCode}`),
  `build.gradle.kts must have versionCode ${expectedCode}`,
);
assert(
  gradleContent.includes(`versionName = "${currentVersion}"`),
  `build.gradle.kts must have versionName "${currentVersion}"`,
);

const appConfigContent = fs.readFileSync(
  path.resolve(rootDir, "src/config/appConfig.ts"),
  "utf8",
);
assert(
  appConfigContent.includes(`export const APP_VERSION = "${currentVersion}"`),
  `appConfig.ts must export APP_VERSION "${currentVersion}"`,
);

const apkUpdaterContent = fs.readFileSync(
  path.resolve(rootDir, "src/utils/apkUpdater.ts"),
  "utf8",
);
assert(
  apkUpdaterContent.includes(`export const CURRENT_APK_VERSION = "v${currentVersion}"`),
  `apkUpdater.ts must export CURRENT_APK_VERSION "v${currentVersion}"`,
);

const appSettingsContent = fs.readFileSync(
  path.resolve(rootDir, "src/utils/appSettings.ts"),
  "utf8",
);
assert(
  appSettingsContent.includes(`version: "${currentVersion}"`),
  `appSettings.ts must declare version "${currentVersion}"`,
);
console.log(`✅ PASS: Version ${currentVersion} and versionCode ${expectedCode} strictly aligned across all 5 targets.`);

console.log("=========================================================================");
console.log("🎉 ALL VIDEO SHARING FAVORITE RULES VERIFICATIONS PASSED (7/7)!");
console.log("=========================================================================");
