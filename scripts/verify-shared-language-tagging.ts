import assert from "node:assert";
import {
  createShareableLink,
  parseShareableUrlState,
  DEMO_SITE_BASE_URL,
} from "../src/utils/urlStateManager";
import {
  recordSharedLanguageForVideo,
  isSharedLanguageForVideo,
  getSharedLanguagesForVideo,
} from "../src/utils/favoriteLanguagesRules";

console.log("=========================================================================");
console.log("🧪 Verifying Task 267: Minimal URL Sharing & Shared Target Language Tagging");
console.log("=========================================================================");

// Mock localStorage for Node runtime
const storage = new Map<string, string>();
(global as any).window = {
  localStorage: {
    getItem: (k: string) => storage.get(k) || null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
    clear: () => storage.clear(),
  },
};

const userSubtitlesUrl =
  "https://www.youtube.com/api/timedtext?v=vBURridJXZ0&ei=test&lang=iw&fmt=json3";

// Section 1: Minimal share link with target_lang
console.log("\n🔗 Section 1: Minimal Share Link with Target Language");
const minimalWithTarget = createShareableLink({
  videoId: "vBURridJXZ0",
  subtitlesUrl: userSubtitlesUrl,
  targetLang: "he",
  minimal: true,
});

console.log("Generated minimal link with target_lang:", minimalWithTarget);
assert(minimalWithTarget.startsWith(DEMO_SITE_BASE_URL));

const parsedUrl = new URL(minimalWithTarget);
assert.strictEqual(parsedUrl.searchParams.get("v"), "vBURridJXZ0");
assert.strictEqual(parsedUrl.searchParams.get("subtitles_url"), userSubtitlesUrl);
assert.strictEqual(parsedUrl.searchParams.get("target_lang"), "he");
assert(!parsedUrl.searchParams.has("sub_url"), "Must not contain duplicate sub_url");
assert(!parsedUrl.searchParams.has("Target_langs"), "Must not contain duplicate Target_langs");
console.log("✅ PASS: Minimal share link correctly encodes v, subtitles_url, and target_lang");

// Section 2: Shared Language Tagging for Specific Video
console.log("\n🏷️ Section 2: Shared Language Tagging per Video ID");
const videoA = "vBURridJXZ0";
const videoB = "L2Ryrr6txwA";

recordSharedLanguageForVideo(videoA, "he");
assert.strictEqual(isSharedLanguageForVideo(videoA, "he"), true, "he must be shared for videoA");
assert.strictEqual(
  isSharedLanguageForVideo(videoB, "he"),
  false,
  "he must NOT be shared for videoB",
);

const sharedA = getSharedLanguagesForVideo(videoA);
assert.deepStrictEqual(sharedA, ["he"]);
console.log("✅ PASS: Language is strictly isolated and tagged as (shared) for the specific video");

// Section 3: State Reproduction and Adding to Favorites
console.log("\n📥 Section 3: State Reproduction from Shared Link");
const hydrated = parseShareableUrlState(parsedUrl.search);
assert.strictEqual(hydrated.videoId, "vBURridJXZ0");
assert.strictEqual(hydrated.subtitlesUrl, userSubtitlesUrl);
assert.strictEqual(hydrated.targetLang, "he");
console.log("✅ PASS: parseShareableUrlState correctly recreates state with targetLang = he");

console.log("\n=========================================================================");
console.log("🎉 ALL TASK 267 CHECKS PASSED 100%!");
console.log("=========================================================================");
