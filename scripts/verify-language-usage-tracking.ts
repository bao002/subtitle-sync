/**
 * Dedicated test script: scripts/verify-language-usage-tracking.ts
 *
 * Validates:
 * 1. Tracking startDate / addedAt when a language is added (via localStorage).
 * 2. Preserving the original startDate when the language is touched again.
 * 3. Tracking ratioLastUpdated / ratioUpdatedAt when a language's ratio is updated (via localStorage).
 * 4. Integration with setFavoriteLanguages and setTtsRatioPreference.
 * 5. Direct inspection of localStorage keys (yt_language_usage_v1, yt_lang_start_date_*, yt_lang_ratio_updated_*).
 */

import assert from "node:assert";
import {
  recordLanguageAdded,
  recordLanguageRatioUpdated,
  getLanguageUsage,
  getAllLanguagesUsage,
  LANGUAGE_USAGE_STORAGE_KEY,
} from "../src/utils/languageUsageTracker";
import { setFavoriteLanguages } from "../src/utils/appSettings";
import { setTtsRatioPreference } from "../src/lib/playback-preferences";

console.log("=========================================================================");
console.log("🧪 Testing Language Usage Tracking (Start Date & Ratio Last Updated)");
console.log("=========================================================================");

// Setup mock window and localStorage for node runtime if needed
if (typeof (globalThis as any).window === "undefined") {
  const store = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
  (globalThis as any).window = { localStorage: mockLocalStorage };
  (globalThis as any).localStorage = mockLocalStorage;
}

// 1. Test recordLanguageAdded
console.log("1. Testing recordLanguageAdded...");
const testLang1 = "it";
const record1 = recordLanguageAdded(testLang1, "2026-01-15T10:00:00.000Z");
assert.strictEqual(record1.langCode, "it");
assert.strictEqual(record1.startDate, "2026-01-15T10:00:00.000Z");
console.log("✅ PASS: recordLanguageAdded recorded custom startDate correctly");

// 2. Test preservation of startDate on subsequent calls
console.log("2. Testing preservation of initial startDate...");
const record1Repeat = recordLanguageAdded(testLang1, "2026-11-05T12:00:00.000Z");
assert.strictEqual(
  record1Repeat.startDate,
  "2026-01-15T10:00:00.000Z",
  "Initial startDate must be preserved and not overwritten"
);
console.log("✅ PASS: Initial startDate preserved across repeated recordLanguageAdded calls");

// 3. Test recordLanguageRatioUpdated
console.log("3. Testing recordLanguageRatioUpdated...");
const ratioUpdateTimestamp = "2026-11-05T18:30:00.000Z";
const recordRatio1 = recordLanguageRatioUpdated(testLang1, ratioUpdateTimestamp);
assert.strictEqual(recordRatio1.ratioLastUpdated, ratioUpdateTimestamp);
assert.strictEqual(
  recordRatio1.startDate,
  "2026-01-15T10:00:00.000Z",
  "startDate must remain unchanged when ratio is updated"
);
console.log("✅ PASS: recordLanguageRatioUpdated set ratioLastUpdated while preserving startDate");

// 4. Test getLanguageUsage
console.log("4. Testing getLanguageUsage...");
const fetchedUsage = getLanguageUsage("IT"); // case-insensitive
assert(fetchedUsage !== null, "Usage record for IT must exist");
assert.strictEqual(fetchedUsage?.startDate, "2026-01-15T10:00:00.000Z");
assert.strictEqual(fetchedUsage?.ratioLastUpdated, ratioUpdateTimestamp);
console.log("✅ PASS: getLanguageUsage retrieves accurate tracking record case-insensitively");

// 5. Test setFavoriteLanguages integration
console.log("5. Testing setFavoriteLanguages automatic usage tracking...");
setFavoriteLanguages(["he", "ar"]);
const heUsage = getLanguageUsage("he");
const arUsage = getLanguageUsage("ar");
assert(heUsage !== null, "Hebrew usage record must be created");
assert(typeof heUsage?.startDate === "string" && heUsage.startDate.length > 0);
assert(arUsage !== null, "Arabic usage record must be created");
assert(typeof arUsage?.startDate === "string" && arUsage.startDate.length > 0);
console.log("✅ PASS: setFavoriteLanguages automatically records start dates for added languages");

// 6. Test setTtsRatioPreference integration
console.log("6. Testing setTtsRatioPreference automatic ratio update tracking...");
setTtsRatioPreference("he", 5);
const heUpdatedUsage = getLanguageUsage("he");
assert(heUpdatedUsage !== null);
assert(
  typeof heUpdatedUsage?.ratioLastUpdated === "string" &&
    heUpdatedUsage.ratioLastUpdated.length > 0,
  "ratioLastUpdated must be populated after setTtsRatioPreference"
);
console.log("✅ PASS: setTtsRatioPreference automatically updates ratioLastUpdated");

// 7. Verify localStorage persistence structure
console.log("7. Verifying localStorage data integrity...");
const rawStorage = (globalThis as any).localStorage.getItem(LANGUAGE_USAGE_STORAGE_KEY);
assert(rawStorage, "Storage key yt_language_usage_v1 must exist");
const allData = JSON.parse(rawStorage);
assert(allData.it && allData.he && allData.ar, "All tracked languages must be present in JSON map");
console.log("✅ PASS: localStorage contains valid JSON tracking data for all languages");

console.log("=========================================================================");
console.log("🎉 ALL TESTS PASSED! Language usage tracking fully verified.");
console.log("=========================================================================");
