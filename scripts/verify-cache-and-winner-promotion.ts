import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

// Polyfill minimal browser environment for node testing
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
}

const mockStore = new MockLocalStorage();
(globalThis as unknown as { localStorage: MockLocalStorage }).localStorage = mockStore;
(globalThis as unknown as { window: unknown }).window = {
  localStorage: mockStore,
  dispatchEvent: (event: unknown) => {
    dispatchedEvents.push(event);
    return true;
  },
};

const dispatchedEvents: unknown[] = [];

// Now import target modules
import {
  recordWinnerPromotion,
  getWinnerPromotionHistory,
  getWinnerPromotionStats,
  clearWinnerPromotionHistory,
} from "../src/utils/winnerPromotionTracker";
import {
  recordVideoWatch,
  loadVideoLibrary,
  saveVideoLibrary,
  removeVideoFromLibrary,
  clearVideoLibrary,
} from "../src/utils/videoLibraryManager";
import {
  isValidJsonSubtitleResponse,
  saveCachedRawJson3,
  getCachedRawJson3,
  getAllCachedTargetLanguages,
  clearVideoSubtitleCache,
} from "../src/utils/subtitleCache";

console.log("==================================================================");
console.log("🧪 Running Cache Architecture & Winner Promotion Verification");
console.log("==================================================================");

const rootDir = process.cwd();

// -------------------------------------------------------------
// Test 1: docs/cache.md Verification
// -------------------------------------------------------------
console.log("\n1. Verifying docs/cache.md documentation...");
const cacheDocPath = path.join(rootDir, "docs", "cache.md");
assert.ok(fs.existsSync(cacheDocPath), "docs/cache.md must exist under docs/");
const cacheDocContent = fs.readFileSync(cacheDocPath, "utf-8");
assert.ok(
  cacheDocContent.includes("Multi-Tier Cache Hierarchy"),
  "Must detail multi-tier caching hierarchy",
);
assert.ok(cacheDocContent.includes("isValidJsonSubtitleResponse"), "Must detail validation gate");
assert.ok(
  cacheDocContent.includes("Shared Video Persistence"),
  "Must detail shared video persistence",
);
assert.ok(cacheDocContent.includes("Cache Hydration"), "Must detail cache hydration workflow");
assert.ok(
  cacheDocContent.includes("yt_subtitles_raw_"),
  "Must document raw JSON3 storage key namespace",
);
console.log("✅ PASS: docs/cache.md contains complete cache and persistence documentation");

// -------------------------------------------------------------
// Test 2: Winner Promotion Tracker & Stats Aggregation
// -------------------------------------------------------------
console.log("\n2. Verifying Winner Promotion Tracker...");
clearWinnerPromotionHistory();
assert.strictEqual(getWinnerPromotionHistory().length, 0, "History should be empty after clear");

// Record 3 winning events across 2 videos
const w1 = recordWinnerPromotion({
  videoId: "vid_alpha",
  lang: "he",
  mode: "tlang",
  send: "session",
  videoTitle: "Alpha Hebrew",
  cuesCount: 42,
  timestamp: 1000,
});
assert.strictEqual(w1.videoId, "vid_alpha");
assert.strictEqual(w1.mode, "tlang");
assert.strictEqual(w1.send, "session");

const w2 = recordWinnerPromotion({
  videoId: "vid_alpha",
  lang: "en",
  mode: "lang",
  send: "session",
  cuesCount: 50,
  timestamp: 2000,
});

const w3 = recordWinnerPromotion({
  videoId: "vid_beta",
  lang: "ar",
  mode: "tlang",
  send: "anon",
  cuesCount: 30,
  timestamp: 3000,
});

const history = getWinnerPromotionHistory();
assert.strictEqual(history.length, 3, "Must persist 3 distinct winning attempt events");

const stats = getWinnerPromotionStats();
assert.strictEqual(stats.totalWins, 3, "Total wins must be 3");
assert.strictEqual(stats.uniqueVideos, 2, "Unique videos must be 2 (vid_alpha, vid_beta)");
assert.strictEqual(stats.modeCounts.tlang, 2, "tlang count must be 2");
assert.strictEqual(stats.modeCounts.lang, 1, "lang count must be 1");
assert.strictEqual(stats.sendCounts.session, 2, "session count must be 2");
assert.strictEqual(stats.sendCounts.anon, 1, "anon count must be 1");
console.log(
  "✅ PASS: Winner Promotion records and aggregates statistics accurately across all past videos",
);

// -------------------------------------------------------------
// Test 3: Video Library Persistence & Shared Video Ingestion
// -------------------------------------------------------------
console.log("\n3. Verifying Video Library Persistence & Event Dispatch...");
clearVideoLibrary();
dispatchedEvents.length = 0;

// Record a shared video
const updatedLib = recordVideoWatch({
  id: "shared_vid_123",
  originalUrl: "https://youtu.be/shared_vid_123",
  title: "Shared Test Video",
});

assert.ok(
  updatedLib.some((item) => item.id === "shared_vid_123"),
  "Shared video must be stored in library",
);
assert.strictEqual(
  updatedLib[0].id,
  "shared_vid_123",
  "Most recently watched video must be at index 0",
);

const loaded = loadVideoLibrary();
assert.ok(
  loaded.some((item) => item.id === "shared_vid_123"),
  "Loaded library must include shared video",
);

// Check event dispatch
assert.ok(
  dispatchedEvents.some((e: any) => e.type === "video-library-updated"),
  "Must dispatch 'video-library-updated' custom event to notify reactive UI",
);

// Remove video
const afterRemove = removeVideoFromLibrary("shared_vid_123");
assert.ok(
  !afterRemove.some((item) => item.id === "shared_vid_123"),
  "Removed video must no longer be in library",
);
console.log("✅ PASS: Shared video library persistence and reactive updates verified");

// -------------------------------------------------------------
// Test 4: Subtitle Cache Validation, Raw Storage & Hydration
// -------------------------------------------------------------
console.log("\n4. Verifying Subtitle Cache Validation Gate & Hydration...");

// 4a. Reject HTML error payloads
const htmlErrorPayload = "<html><body><p>403 Forbidden</p></body></html>";
assert.strictEqual(
  isValidJsonSubtitleResponse(htmlErrorPayload),
  false,
  "HTML error response must be rejected",
);

// 4b. Reject empty events or non-json
assert.strictEqual(isValidJsonSubtitleResponse(""), false, "Empty string must be rejected");
assert.strictEqual(
  isValidJsonSubtitleResponse("{'malformed': true}"),
  false,
  "Malformed JSON must be rejected",
);
assert.strictEqual(
  isValidJsonSubtitleResponse('{"events": []}'),
  false,
  "Empty events array must be rejected",
);

// 4c. Accept valid JSON3 schema
const sampleJson3 = JSON.stringify({
  events: [
    {
      tStartMs: 1000,
      dDurationMs: 2000,
      segs: [{ utf8: "Hello world test cue" }],
    },
  ],
});
assert.strictEqual(
  isValidJsonSubtitleResponse(sampleJson3),
  true,
  "Valid JSON3 with events must be accepted",
);

// 4d. Save raw JSON3
const saved = saveCachedRawJson3("vid_test_xyz", "he", sampleJson3);
assert.strictEqual(saved, true, "Valid JSON3 must be saved to cache");

// 4e. Retrieve raw JSON3
const retrieved = getCachedRawJson3("vid_test_xyz", "he");
assert.strictEqual(retrieved, sampleJson3, "Cached raw JSON3 must match original payload");

// 4f. Inspect getAllCachedTargetLanguages
const cachedLangs = getAllCachedTargetLanguages("vid_test_xyz");
assert.ok(cachedLangs.includes("he"), "getAllCachedTargetLanguages must list 'he'");

// 4g. Clear cache for specific video
clearVideoSubtitleCache("vid_test_xyz");
assert.strictEqual(
  getCachedRawJson3("vid_test_xyz", "he"),
  null,
  "Cache must be purged after clearVideoSubtitleCache",
);
console.log("✅ PASS: Subtitle cache validation gate, raw storage, and granular eviction verified");

console.log("\n==================================================================");
console.log("🎉 ALL CACHE & WINNER PROMOTION VERIFICATIONS PASSED SUCCESSFULLY!");
console.log("==================================================================");
