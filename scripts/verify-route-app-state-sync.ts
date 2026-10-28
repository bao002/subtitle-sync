import assert from "node:assert";
import {
  syncAppStateToUrl,
  parseShareableUrlState,
  getAppStateFromUrl,
} from "../src/utils/urlStateManager";

console.log("=========================================================================");
console.log("🧪 Verifying Task 268: Route <-> App State Two-Way Synchronization");
console.log("=========================================================================");

// Setup mock window & history for Node runtime
let currentUrl = "https://mostuf2556.github.io/subtitle-sync";
let currentSearch = "";

(global as any).window = {
  location: {
    origin: "https://mostuf2556.github.io",
    pathname: "/subtitle-sync",
    get search() {
      return currentSearch;
    },
    set search(val: string) {
      currentSearch = val;
    },
    hash: "",
  },
  history: {
    replaceState: (_data: any, _unused: string, newUrl: string) => {
      currentUrl = newUrl;
      const qIndex = newUrl.indexOf("?");
      currentSearch = qIndex !== -1 ? newUrl.substring(qIndex) : "";
    },
    pushState: (_data: any, _unused: string, newUrl: string) => {
      currentUrl = newUrl;
      const qIndex = newUrl.indexOf("?");
      currentSearch = qIndex !== -1 ? newUrl.substring(qIndex) : "";
    },
  },
};

// 1. App State -> Route URL
console.log("\n🔄 Section 1: App State -> Route URL (Site Updates URL)");
syncAppStateToUrl({
  videoId: "vBURridJXZ0",
  subtitlesUrl: "https://www.youtube.com/api/timedtext?v=vBURridJXZ0&lang=iw&fmt=json3",
  targetLang: "he",
  autoTTS: true,
});

// Wait for debounce timer (200ms)
setTimeout(() => {
  console.log("Updated Browser URL:", currentUrl);
  const params = new URLSearchParams(currentSearch);
  assert.strictEqual(params.get("v"), "vBURridJXZ0", "v must be set to active videoId");
  assert.strictEqual(
    params.get("subtitles_url"),
    "https://www.youtube.com/api/timedtext?v=vBURridJXZ0&lang=iw&fmt=json3",
    "subtitles_url must be synced",
  );
  assert.strictEqual(params.get("target_lang"), "he", "target_lang must be synced");
  assert.strictEqual(params.get("tts"), "1", "tts must be set when autoTTS is true");
  console.log("✅ PASS: App State -> Route URL successfully synced without reload");

  // 2. Route URL -> App State
  console.log("\n🔄 Section 2: Route URL -> App State (URL Updates Site)");
  const reconstructed = parseShareableUrlState(currentSearch);
  assert.strictEqual(reconstructed.videoId, "vBURridJXZ0");
  assert.strictEqual(
    reconstructed.subtitlesUrl,
    "https://www.youtube.com/api/timedtext?v=vBURridJXZ0&lang=iw&fmt=json3",
  );
  assert.strictEqual(reconstructed.targetLang, "he");
  assert.strictEqual(reconstructed.autoTTS, true);
  console.log("✅ PASS: Route URL -> App State successfully parsed and reconstructed");

  console.log("\n=========================================================================");
  console.log("🎉 ALL TASK 268 TWO-WAY SYNC CHECKS PASSED 100%!");
  console.log("=========================================================================");
}, 300);
