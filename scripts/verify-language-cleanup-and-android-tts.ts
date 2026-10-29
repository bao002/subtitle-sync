import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Verifying Language Cleanup, Android TTS & UI Specs");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify target-language-select displays languages without favorites
const langBoxesPath = path.join(rootDir, "src/components/LanguageBoxesSelector.tsx");
assert(fs.existsSync(langBoxesPath), "LanguageBoxesSelector.tsx must exist");
const langBoxesContent = fs.readFileSync(langBoxesPath, "utf8");

assert(
  langBoxesContent.includes("catalogWithoutFavorites") &&
    langBoxesContent.includes("!favoriteLanguages.includes(l.code)"),
  "LanguageBoxesSelector must compute catalogWithoutFavorites filtering out saved languages",
);

assert(
  langBoxesContent.includes('id="target-language-select"') &&
    langBoxesContent.includes("catalogWithoutFavorites.map"),
  "target-language-select must render catalogWithoutFavorites without favorites",
);
console.log("✅ PASS: target-language-select shows languages without favorites");

// 2. Verify removal of favorite/fav/(Fav) overuse
assert(
  !langBoxesContent.includes(
    '{isFavoritesFiltered ? "Favorite Language Boxes" : "Language Boxes"}',
  ),
  "Must not label header as 'Favorite Language Boxes'",
);
assert(
  !langBoxesContent.includes(">Fav</span>"),
  "Must not render visual Fav badges on chips or language boxes",
);
assert(
  langBoxesContent.includes(
    'title={showAllLanguages ? "Show my languages only" : "Show all catalog languages"}',
  ) || langBoxesContent.includes("Show my languages only"),
  "Toggle title must use clean language phrasing instead of favorites only",
);
console.log("✅ PASS: LanguageBoxesSelector free of redundant 'favorite' / 'Fav' labels");

// 3. Verify index.tsx clean design & removal of duplicate cues in Column 1
const indexPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf8");

assert(
  indexContent.includes("My Languages:") && !indexContent.includes("Favorite Learning Languages:"),
  "index.tsx must label user languages as 'My Languages:' without favorite overuse",
);

assert(
  indexContent.includes("Add Language:") && !indexContent.includes("Quick Add to Favorites:"),
  "index.tsx must label dropdown as 'Add Language:' without favorite overuse",
);

assert(
  indexContent.includes("↺ Reset List") && indexContent.includes("Save as Default List"),
  "index.tsx buttons must use clean '↺ Reset List' and 'Save as Default List'",
);

assert(
  !indexContent.includes("(Fav)"),
  "index.tsx must not display visual (Fav) badges in enabled badges or table",
);

// Verify table column 1 cues count removed while right column keeps it
assert(
  indexContent.includes('<span>{cueCount ? `${cueCount} cues` : "URL"}</span>'),
  "Right column in Unified Languages table must display cues count on URL button",
);
console.log("✅ PASS: index.tsx clean design and table cues display verified");

// 4. Verify Per-language TTS settings section Speak label
const perLangTtsPath = path.join(rootDir, "src/components/beginner/PerLanguageTtsPreferences.tsx");
assert(fs.existsSync(perLangTtsPath), "PerLanguageTtsPreferences.tsx must exist");
const perLangTtsContent = fs.readFileSync(perLangTtsPath, "utf8");

assert(
  !perLangTtsContent.includes("Speak (rel. to"),
  "PerLanguageTtsPreferences must not include redundant 'Speak (rel. to English)' text",
);
assert(
  perLangTtsContent.includes("Speak\n                  </span>") ||
    perLangTtsContent.includes("Speak</span>") ||
    perLangTtsContent.includes(">\n                    Speak\n"),
  "PerLanguageTtsPreferences must label cleanly as 'Speak'",
);
console.log(
  "✅ PASS: Per-language TTS settings section has clean 'Speak' label without redundant text",
);

// 5. Verify Android native TTS enhancements and fallbacks
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf8");

assert(
  mainActivityContent.includes("Locale.forLanguageTag(cleanLang)") &&
    mainActivityContent.includes("speakResult != TextToSpeech.SUCCESS"),
  "MainActivity.kt must handle locales with Locale.forLanguageTag and check speakResult",
);

assert(
  indexContent.includes("Android native TTS error, falling back to Google TTS audio") &&
    indexContent.includes(
      "Android native TTS unhandled/not ready, falling back to Google TTS audio",
    ),
  "index.tsx speak() must fall back to Google TTS audio when Android native TTS fails or is unhandled",
);

const beginnerPrefsPath = path.join(
  rootDir,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
const beginnerPrefsContent = fs.readFileSync(beginnerPrefsPath, "utf8");
assert(
  beginnerPrefsContent.includes("window.AndroidNativeShell?.speak"),
  "BeginnerPreferencesTab handleTestVoice must use Android native TTS when on Android",
);
console.log("✅ PASS: Android native TTS bridge and guaranteed audio fallback verified");

// 6. Verify removal of redundant Favorite column from Unified Languages table
assert(
  !/<th[^>]*>\s*Favorite\s*<\/th>/i.test(indexContent),
  "Unified Languages table header must NOT contain a Favorite column",
);
assert(
  !indexContent.includes(
    'title="Favorite learning language (saved app-wide)">\n                                    Favorite',
  ),
  "Unified Languages table header must not have Favorite column header",
);
console.log("✅ PASS: Unified languages table header has no redundant Favorite column");

// 7. Verify version 2.0.35 across all 5 files
const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
assert.strictEqual(pkgJson.version, "2.0.35", "package.json version must be 2.0.35");

const gradleContent = fs.readFileSync(
  path.join(rootDir, "android-shell/app/build.gradle.kts"),
  "utf8",
);
assert(
  gradleContent.includes('versionName = "2.0.35"') && gradleContent.includes("versionCode = 20035"),
  "build.gradle.kts must be 2.0.35 / 20035",
);

const appConfigContent = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf8");
assert(
  appConfigContent.includes('APP_VERSION = "2.0.35"'),
  "appConfig.ts APP_VERSION must be 2.0.35",
);

const apkUpdaterContent = fs.readFileSync(path.join(rootDir, "src/utils/apkUpdater.ts"), "utf8");
assert(
  apkUpdaterContent.includes('CURRENT_APK_VERSION = "v2.0.35"'),
  "apkUpdater.ts CURRENT_APK_VERSION must be v2.0.35",
);

const appSettingsContent = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf8");
assert(
  appSettingsContent.includes('version: "2.0.35"'),
  "appSettings.ts snapshot version must be 2.0.35",
);
console.log("✅ PASS: App version 2.0.35 synchronized across all 5 files");

console.log("====================================================");
console.log("🎉 ALL LANGUAGE CLEANUP & ANDROID TTS TESTS PASSED!");
console.log("====================================================");
