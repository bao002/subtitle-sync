import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { getDisplayLanguageName } from "../src/components/beginner/BeginnerFavoriteLanguageSelector";
import { SUPPORTED_LANGUAGES_CATALOG, ALL_KNOWN_LANGUAGES } from "../src/utils/appSettings";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("--- Starting Verification: Beginner Language Name Display & Parity ---");

// Test 1: Verify getDisplayLanguageName resolves language codes to full human-readable names
console.log("Check 1: Resolving language codes via getDisplayLanguageName...");
const testCodes = [
  { code: "fr", expected: "French (Français)" },
  { code: "en", expected: "English" },
  { code: "es", expected: "Spanish (Español)" },
  { code: "he", expected: "Hebrew (עברית)" },
  { code: "ru", expected: "Russian (Русский)" },
  { code: "ar", expected: "Arabic (العربية)" },
];

for (const { code, expected } of testCodes) {
  const resolved = getDisplayLanguageName(code, SUPPORTED_LANGUAGES_CATALOG);
  assert.strictEqual(
    resolved,
    expected,
    `Expected language code '${code}' to resolve to '${expected}', got '${resolved}'`,
  );
  assert.notStrictEqual(
    resolved.toLowerCase(),
    code.toLowerCase(),
    `Resolved name must never be bare code '${code}'`,
  );
}

// Check with empty catalog (should fall back to ALL_KNOWN_LANGUAGES or Intl.DisplayNames)
const resolvedFrFallback = getDisplayLanguageName("fr", []);
assert.strictEqual(
  resolvedFrFallback,
  "French (Français)",
  `Fallback lookup without catalog must resolve 'fr' to 'French (Français)', got '${resolvedFrFallback}'`,
);

// Check standard ISO code not in short catalogs via Intl.DisplayNames
const resolvedNlFallback = getDisplayLanguageName("nl", []);
assert.ok(
  resolvedNlFallback.toLowerCase().includes("dutch") || resolvedNlFallback.includes("Nederlands"),
  `Fallback for 'nl' should include 'Dutch' or 'Nederlands', got '${resolvedNlFallback}'`,
);
console.log("✓ Check 1 passed: All language codes correctly resolve to full language names.");

// Test 2: Inspect BeginnerFavoriteLanguageSelector source code for display name presentation & styling
console.log("Check 2: Checking BeginnerFavoriteLanguageSelector.tsx source implementation...");
const selectorSrc = fs.readFileSync(
  path.resolve("src/components/beginner/BeginnerFavoriteLanguageSelector.tsx"),
  "utf8",
);

assert.ok(
  selectorSrc.includes("getDisplayLanguageName"),
  "BeginnerFavoriteLanguageSelector must use getDisplayLanguageName helper",
);
assert.ok(
  selectorSrc.includes("ALL_KNOWN_LANGUAGES"),
  "BeginnerFavoriteLanguageSelector must import ALL_KNOWN_LANGUAGES as catalog fallback",
);
assert.ok(
  selectorSrc.includes("title={name}"),
  "Button must contain title attribute with the full language name",
);
assert.ok(
  selectorSrc.includes("aria-label="),
  "Button must have accessible aria-label mentioning the language name",
);
console.log("✓ Check 2 passed: BeginnerFavoriteLanguageSelector properly renders full language names.");

// Test 3: Inspect src/routes/index.tsx for unconditional SUPPORTED_LANGUAGES_CATALOG passing
console.log("Check 3: Inspecting src/routes/index.tsx favoriteLanguageCatalog wiring...");
const indexSrc = fs.readFileSync(path.resolve("src/routes/index.tsx"), "utf8");

assert.ok(
  indexSrc.includes("favoriteLanguageCatalog={SUPPORTED_LANGUAGES_CATALOG}"),
  "src/routes/index.tsx must pass SUPPORTED_LANGUAGES_CATALOG unconditionally",
);
assert.ok(
  !indexSrc.includes("favoriteLanguageCatalog={isAndroid ? SUPPORTED_LANGUAGES_CATALOG : LANGS}"),
  "src/routes/index.tsx must not truncate catalog to LANGS in web mode",
);
console.log("✓ Check 3 passed: favoriteLanguageCatalog correctly wired with complete catalog.");

// Test 4: Version synchronization across all 5 files for 2.0.39
console.log("Check 4: Verifying version 2.0.39 synchronization across all 5 files...");
const packageJson = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));
assert.strictEqual(packageJson.version, "2.0.39", "package.json version must be 2.0.39");

const buildGradle = fs.readFileSync(
  path.resolve("android-shell/app/build.gradle.kts"),
  "utf8",
);
assert.ok(
  buildGradle.includes('versionCode = 20039') && buildGradle.includes('versionName = "2.0.39"'),
  "android-shell/app/build.gradle.kts must define versionCode 20039 and versionName 2.0.39",
);

assert.strictEqual(APP_VERSION, "2.0.39", "src/config/appConfig.ts APP_VERSION must be 2.0.39");
assert.strictEqual(CURRENT_APK_VERSION, "v2.0.39", "src/utils/apkUpdater.ts CURRENT_APK_VERSION must be v2.0.39");

const appSettingsSrc = fs.readFileSync(path.resolve("src/utils/appSettings.ts"), "utf8");
assert.ok(
  appSettingsSrc.includes('version: "2.0.39"'),
  "src/utils/appSettings.ts exportFullAppState snapshot must reflect version 2.0.39",
);
console.log("✓ Check 4 passed: All 5 version files synchronized to 2.0.39.");

console.log("--- All Checks Passed Successfully! ---");
