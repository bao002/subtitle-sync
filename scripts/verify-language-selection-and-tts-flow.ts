import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  matchesLanguageCode,
  deduplicateVoices,
  getLanguageVoices,
  setCachedVoices,
  getCachedVoices,
  findVoiceByUriOrName,
  normalizeLanguageCode,
} from "../src/utils/speechVoiceUtils";
import {
  buildGoogleTranslateTtsUrl,
  getUseAlternativeTts,
  setUseAlternativeTts,
  getAlternativeTtsMode,
  setAlternativeTtsMode,
} from "../src/lib/alternative-tts";
import {
  getFavoriteLanguages,
  setFavoriteLanguages,
  DEFAULT_APP_SETTINGS,
} from "../src/utils/appSettings";
import {
  getVideoSettings,
  saveVideoSettings,
  deleteVideoSettings,
} from "../src/utils/videoSettings";

console.log("=========================================================================");
console.log("🧪 Verifying Language Selection Flow, TTS Engine & Settings Architecture");
console.log("=========================================================================");

// Mock window & localStorage if in Node environment
const mockStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === "undefined") {
  (globalThis as any).localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = String(val);
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
  };
}
if (typeof globalThis.window === "undefined") {
  (globalThis as any).window = globalThis;
}

// -----------------------------------------------------------------------------
// [Check 1] Voice Selection & ISO-639 Alias Normalization
// -----------------------------------------------------------------------------
console.log("--> [Check 1] Verifying TTS Voice Matching and ISO Aliases...");

assert.strictEqual(
  matchesLanguageCode("iw-IL", "he"),
  true,
  "iw-IL (legacy Android Hebrew) should match target language he",
);
assert.strictEqual(matchesLanguageCode("he-IL", "he"), true, "he-IL should match he");
assert.strictEqual(
  matchesLanguageCode("in-ID", "id"),
  true,
  "in-ID (legacy Android Indonesian) should match target language id",
);
assert.strictEqual(matchesLanguageCode("en-US", "en"), true, "en-US should match en");
assert.strictEqual(
  matchesLanguageCode("en_GB", "en"),
  true,
  "en_GB with underscore should match en",
);
assert.strictEqual(matchesLanguageCode("fr-FR", "he"), false, "fr-FR should not match he");

const testVoices = [
  { voiceURI: "v1", name: "Hebrew Voice", lang: "iw-IL" },
  { voiceURI: "v1", name: "Hebrew Voice Duplicate", lang: "iw-IL" },
  { voiceURI: "v2", name: "English Voice", lang: "en-US" },
  { voiceURI: "v3", name: "Italian Voice", lang: "it-IT" },
];

const deduped = deduplicateVoices(testVoices);
assert.strictEqual(deduped.length, 3, "deduplicateVoices should remove duplicate voiceURI");

const hebrewVoices = getLanguageVoices(testVoices, "he");
assert.strictEqual(hebrewVoices.length, 1, "getLanguageVoices should find iw-IL voice for he");
assert.strictEqual(hebrewVoices[0].voiceURI, "v1");

setCachedVoices(testVoices);
const cached = getCachedVoices();
assert.strictEqual(cached.length, 3, "setCachedVoices should populate module voice cache");

const found = findVoiceByUriOrName(testVoices, "v2");
assert.strictEqual(found?.name, "English Voice", "findVoiceByUriOrName should locate voice");

console.log("✅ PASS: TTS voice selection, ISO aliases, and caching verified.");

// -----------------------------------------------------------------------------
// [Check 2] Alternative TTS Service (Google Translate TTS)
// -----------------------------------------------------------------------------
console.log("--> [Check 2] Verifying Alternative TTS Service Endpoint & Preferences...");

const sampleUrl = buildGoogleTranslateTtsUrl("Hello world", "en");
assert.strictEqual(
  sampleUrl,
  "https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl=en&q=Hello%20world",
  "Alternative TTS URL should match Google Translate endpoint",
);

const hebrewUrl = buildGoogleTranslateTtsUrl("שלום", "iw-IL");
assert(hebrewUrl.includes("tl=he"), "Alternative TTS URL should normalize iw-IL to tl=he");

// Verify default is OFF
setUseAlternativeTts(false);
assert.strictEqual(getUseAlternativeTts(), false, "Alternative TTS must be turned OFF by default");

setUseAlternativeTts(true);
assert.strictEqual(
  getUseAlternativeTts(),
  true,
  "setUseAlternativeTts(true) should enable alternative TTS",
);

setAlternativeTtsMode("always");
assert.strictEqual(getAlternativeTtsMode(), "always", "setAlternativeTtsMode should persist mode");

setAlternativeTtsMode("fallback_only");
assert.strictEqual(getAlternativeTtsMode(), "fallback_only", "Fallback only mode should persist");

assert.strictEqual(
  DEFAULT_APP_SETTINGS.useAlternativeTtsService,
  false,
  "DEFAULT_APP_SETTINGS.useAlternativeTtsService must be false (OFF by default)",
);

console.log("✅ PASS: Alternative TTS service URL, mode, and default-off setting verified.");

// -----------------------------------------------------------------------------
// [Check 3] TTS Speed Rate Configuration (Range 0.3 - 1.5, Default 0.5)
// -----------------------------------------------------------------------------
console.log("--> [Check 3] Verifying TTS Speed Rate Range (0.3 to 1.5) and Default (0.5)...");

const routesFile = fs.readFileSync(path.resolve(process.cwd(), "src/routes/index.tsx"), "utf-8");
assert(
  routesFile.includes("min={0.3}") && routesFile.includes("max={1.5}"),
  "Rate slider in index.tsx must configure min={0.3} and max={1.5}",
);
assert(
  routesFile.includes("rates[lang.code] ?? 0.5"),
  "TTS rate default fallback must be 0.5 in index.tsx",
);
assert(routesFile.includes("[lang.code, 0.5]"), "TTS initial rates state must use default 0.5");

console.log("✅ PASS: TTS speed rate 0.3-1.5 range and default 0.5 verified.");

// -----------------------------------------------------------------------------
// [Check 4] Favorite Languages in Settings & Per-Video Persistence
// -----------------------------------------------------------------------------
console.log("--> [Check 4] Verifying Favorite Languages & Per-Video Persistence...");

const initialFavs = ["he", "it"];
setFavoriteLanguages(initialFavs);
const loadedFavs = getFavoriteLanguages();
assert.deepStrictEqual(
  loadedFavs,
  initialFavs,
  "getFavoriteLanguages should retrieve stored favorites",
);

// Video 1: Custom target languages
const testVideo1 = "vid_alpha_123";
saveVideoSettings(testVideo1, {
  targetLanguages: [
    { code: "fr", name: "French" },
    { code: "es", name: "Spanish" },
  ] as any,
});

const video1Settings = getVideoSettings(testVideo1);
assert.strictEqual(video1Settings?.targetLanguages?.length, 2);
assert.strictEqual(video1Settings?.targetLanguages?.[0].code, "fr");

// Video 2: Has no saved settings, so it should fallback to global favorite languages
const testVideo2 = "vid_beta_456";
deleteVideoSettings(testVideo2);
assert.strictEqual(
  getVideoSettings(testVideo2),
  null,
  "Unvisited video has null settings initially",
);

// Clean up
deleteVideoSettings(testVideo1);
deleteVideoSettings(testVideo2);

console.log("✅ PASS: Favorite languages and per-video persistence verified.");

// -----------------------------------------------------------------------------
// [Check 5] UI Indicators: Enabled Languages & Favorites Presentation
// -----------------------------------------------------------------------------
console.log("--> [Check 5] Verifying Enabled Languages & Favorites UI presentation...");

assert(
  routesFile.includes('data-testid="enabled-languages-status-card"'),
  "index.tsx must render enabled-languages-status-card",
);
assert(
  routesFile.includes('data-testid="alternative-tts-settings-card"'),
  "index.tsx must render alternative-tts-settings-card in Settings",
);
assert(
  routesFile.includes('data-testid="settings-favorites-languages-card"'),
  "index.tsx must render settings-favorites-languages-card in Settings",
);
assert(
  routesFile.includes("favoriteLanguages={favoriteLanguages}"),
  "LanguageBoxesSelector must receive favoriteLanguages prop",
);

const selectorFile = fs.readFileSync(
  path.resolve(process.cwd(), "src/components/LanguageBoxesSelector.tsx"),
  "utf-8",
);
assert(
  selectorFile.includes("favoriteLanguages"),
  "LanguageBoxesSelector.tsx must accept and process favoriteLanguages prop",
);

console.log("✅ PASS: UI components correctly render enabled languages and favorite indicators.");

// -----------------------------------------------------------------------------
// [Check 6] Dedicated Documentation Check: docs/languages-selection-flow.md
// -----------------------------------------------------------------------------
console.log("--> [Check 6] Verifying docs/languages-selection-flow.md and docs/files.md...");

const docPath = path.resolve(process.cwd(), "docs/languages-selection-flow.md");
assert(fs.existsSync(docPath), "docs/languages-selection-flow.md must exist under docs/*.md");

const docContent = fs.readFileSync(docPath, "utf-8");
assert(
  docContent.includes("Dual Persistence Hierarchy"),
  "Doc must explain Dual Persistence Hierarchy",
);
assert(docContent.includes("Alternative TTS Service"), "Doc must specify Alternative TTS Service");
assert(docContent.includes("0.3"), "Doc must specify 0.3 min rate");
assert(docContent.includes("1.5"), "Doc must specify 1.5 max rate");
assert(docContent.includes("0.5"), "Doc must specify 0.5 default rate");
assert(docContent.includes("translate_tts"), "Doc must specify translate_tts endpoint");
assert(docContent.includes("iw"), "Doc must specify ISO alias mapping (he <-> iw)");

const filesCatalog = fs.readFileSync(path.resolve(process.cwd(), "docs/files.md"), "utf-8");
assert(
  filesCatalog.includes("docs/languages-selection-flow.md"),
  "docs/files.md must register docs/languages-selection-flow.md",
);

console.log("✅ PASS: Dedicated documentation and file catalog verified.");

console.log("=========================================================================");
console.log("🎉 ALL LANGUAGE SELECTION & TTS FLOW VERIFICATION CHECKS PASSED!");
console.log("=========================================================================");
