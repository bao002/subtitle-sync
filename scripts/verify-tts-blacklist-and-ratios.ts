import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  getTtsBlacklist,
  setTtsBlacklist,
  isLanguageTtsBlacklisted,
  toggleLanguageTtsBlacklist,
  isTtsSpeakableLanguage,
  isLanguageEligibleForTtsWithRole,
  shouldHighlightSentenceForTtsWithRole,
  getTtsRatiosPreference,
  setTtsRatioPreference,
  getLanguageTtsRatio,
} from "../src/lib/playback-preferences";

// Setup mock localStorage
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = String(value);
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  },
};
Object.defineProperty(globalThis, "localStorage", {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

async function runTests() {
  console.log("=== Testing TTS Blacklist, Whitelist, and Up to 1:20 Ratios ===");

  // 1. Blacklist getters/setters and toggles
  mockLocalStorage.clear();
  assert.deepStrictEqual(getTtsBlacklist(), [], "Initial blacklist should be empty");
  assert.strictEqual(isLanguageTtsBlacklisted("en"), false, "English should not be blacklisted initially");

  setTtsBlacklist(["es", "fr"]);
  assert.deepStrictEqual(getTtsBlacklist(), ["es", "fr"], "Blacklist should be updated to ['es', 'fr']");
  assert.strictEqual(isLanguageTtsBlacklisted("es"), true, "es should be blacklisted");
  assert.strictEqual(isLanguageTtsBlacklisted("fr"), true, "fr should be blacklisted");
  assert.strictEqual(isLanguageTtsBlacklisted("en"), false, "en should not be blacklisted");

  // Toggle adds language
  const isNowBlacklisted1 = toggleLanguageTtsBlacklist("en");
  assert.strictEqual(isNowBlacklisted1, true, "Toggling en should return true (now blacklisted)");
  assert.deepStrictEqual(getTtsBlacklist(), ["es", "fr", "en"], "Blacklist should contain ['es', 'fr', 'en']");
  assert.strictEqual(isLanguageTtsBlacklisted("en"), true, "en should now be blacklisted");

  // Toggle removes language
  const isNowBlacklisted2 = toggleLanguageTtsBlacklist("es");
  assert.strictEqual(isNowBlacklisted2, false, "Toggling es should return false (unblacklisted)");
  assert.deepStrictEqual(getTtsBlacklist(), ["fr", "en"], "Blacklist should contain ['fr', 'en']");
  assert.strictEqual(isLanguageTtsBlacklisted("es"), false, "es should no longer be blacklisted");

  // 2. Default subtitles language X skipped if blacklisted
  // Assume default subtitles is "en" (or "he"), which is commonly the base language
  setTtsBlacklist(["en"]);
  assert.strictEqual(
    isTtsSpeakableLanguage("en", ["en", "es"], ["en"]),
    false,
    "Default subtitles language 'en' must be skipped from TTS when blacklisted",
  );
  assert.strictEqual(
    isTtsSpeakableLanguage("es", ["en", "es"], ["en"]),
    true,
    "Non-blacklisted language 'es' remains speakable",
  );

  // 3. Check role-based eligibility with blacklist
  const roleParams = {
    rowIdx: 0,
    langCode: "en",
    ratio: 1,
    primaryLang: "en",
    primaryRatio: 1,
    blacklist: ["en"],
  };
  assert.strictEqual(
    isLanguageEligibleForTtsWithRole(roleParams),
    false,
    "isLanguageEligibleForTtsWithRole must return false for blacklisted language even if primary",
  );
  assert.strictEqual(
    shouldHighlightSentenceForTtsWithRole(roleParams),
    false,
    "shouldHighlightSentenceForTtsWithRole must return false for blacklisted language even if primary",
  );

  // When 'en' is whitelisted again
  const nonBlacklistedParams = {
    ...roleParams,
    blacklist: [],
  };
  assert.strictEqual(
    isLanguageEligibleForTtsWithRole(nonBlacklistedParams),
    true,
    "isLanguageEligibleForTtsWithRole must return true when language is whitelisted",
  );

  // 4. Test ratios up to 1:20
  setTtsRatioPreference("he", 20);
  assert.strictEqual(getLanguageTtsRatio(getTtsRatiosPreference(), "he"), 20, "Should allow ratio up to 20");
  assert.strictEqual(
    mockLocalStorage.getItem("yt_tts_ratio_he"),
    "20",
    "Should persist ratio 20 in localStorage yt_tts_ratio_he",
  );

  // Clamping above 20 to 20
  setTtsRatioPreference("he", 25);
  assert.strictEqual(getLanguageTtsRatio(getTtsRatiosPreference(), "he"), 20, "Should clamp ratio above 20 down to 20");

  // Clamping below 1 to 1
  setTtsRatioPreference("he", 0);
  assert.strictEqual(getLanguageTtsRatio(getTtsRatiosPreference(), "he"), 1, "Should clamp ratio below 1 up to 1");

  // 5. Code inspection for parity and UI elements
  const indexSource = fs.readFileSync(path.join(process.cwd(), "src/routes/index.tsx"), "utf-8");
  assert.ok(
    indexSource.includes("stage-2-toggle-blacklist"),
    "src/routes/index.tsx must contain stage-2-toggle-blacklist button testid",
  );
  assert.ok(
    indexSource.includes("tts-blacklist-toggle-"),
    "src/routes/index.tsx must contain tts-blacklist-toggle- testid in languages table",
  );
  assert.ok(
    indexSource.includes("15, 20"),
    "src/routes/index.tsx must include presets up to 20",
  );

  const beginnerSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/beginner/PerLanguageTtsPreferences.tsx"),
    "utf-8",
  );
  assert.ok(
    beginnerSource.includes("tts-blacklist-toggle-"),
    "PerLanguageTtsPreferences.tsx must contain tts-blacklist-toggle- testid",
  );
  assert.ok(
    beginnerSource.includes("15, 20"),
    "PerLanguageTtsPreferences.tsx must include ratio presets up to 20",
  );

  console.log(" All TTS Blacklist and Ratio verification checks passed successfully!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
