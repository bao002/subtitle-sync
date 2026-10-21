import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

import {
  getVideoThumbnails,
  getCachedVideoMetadata,
  fetchVideoMetadata,
  fetchMultipleVideoMetadata,
  clearVideoMetadataCache,
} from "../src/utils/videoMetadataManager";
import {
  updateVideoLibraryTitle,
  loadVideoLibrary,
  saveVideoLibrary,
} from "../src/utils/videoLibraryManager";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("=========================================================================");
console.log("🧪 Verifying Client-Side Video Metadata Extraction & Presentation");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify Thumbnail Generation
console.log("\n--> [Test 1] Verifying getVideoThumbnails helper...");
const thumbs = getVideoThumbnails("vBURridJXZ0");
assert.strictEqual(
  thumbs.maxRes,
  "https://img.youtube.com/vi/vBURridJXZ0/maxresdefault.jpg",
  "maxRes thumbnail URL must match YouTube img format",
);
assert.strictEqual(
  thumbs.hq,
  "https://img.youtube.com/vi/vBURridJXZ0/hqdefault.jpg",
  "hq thumbnail URL must match YouTube img format",
);
assert.strictEqual(
  thumbs.mq,
  "https://img.youtube.com/vi/vBURridJXZ0/mqdefault.jpg",
  "mq thumbnail URL must match YouTube img format",
);
assert.strictEqual(
  thumbs.default,
  "https://img.youtube.com/vi/vBURridJXZ0/default.jpg",
  "default thumbnail URL must match YouTube img format",
);
console.log("✅ PASS: Video thumbnail generation verified.");

// 2. Verify fetchVideoMetadata and In-Memory / Local Storage Caching
console.log("\n--> [Test 2] Verifying fetchVideoMetadata with caching...");
async function runMetadataFetchTest() {
  clearVideoMetadataCache();
  assert.strictEqual(getCachedVideoMetadata("vBURridJXZ0"), null, "Cache must be empty initially");

  const meta = await fetchVideoMetadata("vBURridJXZ0");
  assert.ok(meta, "Metadata must be returned");
  assert.strictEqual(meta.videoId, "vBURridJXZ0", "videoId must match");
  assert.ok(
    typeof meta.title === "string" && meta.title.length > 0,
    "Title must be non-empty string",
  );
  assert.strictEqual(meta.providerName, "YouTube", "providerName must be YouTube");
  assert.ok(typeof meta.fetchedAt === "number", "fetchedAt must be timestamp");

  // Subsequent call should hit cache immediately
  const cachedMeta = getCachedVideoMetadata("vBURridJXZ0");
  assert.ok(cachedMeta, "Metadata must be cached in memory");
  assert.strictEqual(cachedMeta?.title, meta.title, "Cached title must match fetched title");

  // Test batch fetching
  const batch = await fetchMultipleVideoMetadata(["vBURridJXZ0", "L2Ryrr6txwA"]);
  assert.ok(batch["vBURridJXZ0"], "Batch must include vBURridJXZ0");
  assert.ok(batch["L2Ryrr6txwA"], "Batch must include L2Ryrr6txwA");
  console.log("✅ PASS: Video metadata extraction, caching, and batch fetching verified.");
}

// 3. Verify Video Library Title Update
console.log("\n--> [Test 3] Verifying updateVideoLibraryTitle...");
const initialItems = loadVideoLibrary();
const testVideoId = "test_meta_video_id";
saveVideoLibrary([
  {
    id: testVideoId,
    originalUrl: `https://www.youtube.com/watch?v=${testVideoId}`,
    title: `YouTube Video · ${testVideoId}`,
    cues: [],
    timestamp: Date.now(),
  },
  ...initialItems,
]);

updateVideoLibraryTitle(testVideoId, "Authentic Extracted Video Title");
const updatedItems = loadVideoLibrary();
const testItem = updatedItems.find((i) => i.id === testVideoId);
assert.strictEqual(
  testItem?.title,
  "Authentic Extracted Video Title",
  "updateVideoLibraryTitle must update title in storage",
);
// Cleanup test item
saveVideoLibrary(initialItems);
console.log("✅ PASS: updateVideoLibraryTitle verified.");

// 4. Verify Code Contracts and UI Integration in Source Files
console.log("\n--> [Test 4] Verifying UI integration & testids in source code...");
const typesPath = path.resolve(rootDir, "src/types.ts");
const typesContent = fs.readFileSync(typesPath, "utf8");
assert.ok(
  typesContent.includes("export interface VideoMetadata"),
  "src/types.ts must export VideoMetadata interface",
);

const panelPath = path.resolve(rootDir, "src/components/VideoLibraryPanel.tsx");
const panelContent = fs.readFileSync(panelPath, "utf8");
assert.ok(
  panelContent.includes("fetchVideoMetadata") && panelContent.includes("getCachedVideoMetadata"),
  "VideoLibraryPanel.tsx must use videoMetadataManager",
);
assert.ok(
  panelContent.includes("library-author-"),
  "VideoLibraryPanel.tsx must render library-author testids",
);

const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf8");
assert.ok(
  indexContent.includes('data-testid="video-metadata-card"'),
  "src/routes/index.tsx must render video-metadata-card",
);
assert.ok(
  indexContent.includes('data-testid="video-metadata-title"'),
  "src/routes/index.tsx must render video-metadata-title",
);
assert.ok(
  indexContent.includes('data-testid="video-metadata-author"'),
  "src/routes/index.tsx must render video-metadata-author",
);
console.log("✅ PASS: UI components and testids verified.");

// 5. Verify Version Parity Across Manifests
console.log("\n--> [Test 5] Verifying version parity across manifests...");
const pkgPath = path.resolve(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const currentVer = pkg.version;
assert.ok(currentVer, "package.json version must be defined");
assert.strictEqual(APP_VERSION, currentVer, "APP_VERSION must match package.json");
assert.strictEqual(
  CURRENT_APK_VERSION,
  `v${currentVer}`,
  "CURRENT_APK_VERSION must match package.json",
);

const gradlePath = path.resolve(rootDir, "android-shell/app/build.gradle.kts");
const gradleContent = fs.readFileSync(gradlePath, "utf8");
assert.ok(
  gradleContent.includes(`versionName = "${currentVer}"`),
  `build.gradle.kts must specify versionName ${currentVer}`,
);
console.log(`✅ PASS: Version ${currentVer} parity verified across all manifests.`);

async function main() {
  await runMetadataFetchTest();
  console.log("\n=========================================================================");
  console.log("🎉 ALL CLIENT-SIDE VIDEO METADATA EXTRACTION CHECKS PASSED!");
  console.log("=========================================================================");
}

main().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
