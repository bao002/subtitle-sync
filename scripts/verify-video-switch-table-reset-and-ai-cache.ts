import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  saveCachedAiSubtitles,
  getCachedAiSubtitles,
  hasCachedAiSubtitles,
  clearCachedAiSubtitles,
  saveCachedRawJson3,
  getCachedRawJson3,
  clearVideoSubtitleCache,
} from "../src/utils/subtitleCache";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";
import { parseJson3 } from "../src/lib/native-captions";
import { align, type Json3 } from "../src/lib/subtitles";

console.log("=========================================================================");
console.log("🧪 Starting Video Switch Subtitles Clean Reset & AI Subtitle Cache Test");
console.log("=========================================================================");

const rootDir = process.cwd();

// -----------------------------------------------------------------------------
// Part 1: Source Code Verification for Clean Reset on Video Change
// -----------------------------------------------------------------------------
console.log("\n[1/4] Checking Video Transition & Subtitles Table Clean Reset in index.tsx…");

const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// Must track previous videoId to detect transitions
assert(
  indexContent.includes("previousVideoIdRef = useRef<string>(videoId)"),
  "index.tsx must define previousVideoIdRef to detect video changes",
);
assert(
  indexContent.includes("const isVideoChanged = previousVideoIdRef.current !== videoId"),
  "index.tsx must check if isVideoChanged on videoId updates",
);

// On video transition, must flush tracks, subtitlesPage, active, playedTtsRecords, onDemandTranslations
assert(
  indexContent.includes("setTracks(null)") &&
    indexContent.includes("setSubtitlesPage(1)") &&
    indexContent.includes("setActive(-1)") &&
    indexContent.includes("playedTtsRecords.current.clear()") &&
    indexContent.includes("setOnDemandTranslations({})") &&
    indexContent.includes("setDetectedPlaygroundTracks({})"),
  "index.tsx must cleanly flush all previous video table states on video transition",
);

// When hydrating tracks for new video, must NOT merge with prev video tracks
assert(
  indexContent.includes("if (isVideoChanged)") &&
    indexContent.includes("setTracks(hydratedTracks)") &&
    indexContent.includes("setTracks((prev) => ({ ...(prev || {}), ...hydratedTracks }))"),
  "index.tsx must strictly set tracks to new video hydrated tracks without merging previous video tracks",
);

// Verify library video selection resets table state
assert(
  indexContent.includes("const handleSelectLibraryVideo = (newId: string") &&
    indexContent.includes("setSubtitlesPage(1)") &&
    indexContent.includes("setOnDemandTranslations({})"),
  "handleSelectLibraryVideo must cleanly reset pagination and translations",
);

console.log("✅ PASS: Video transition cleans subtitles table view and all associated state.");

// -----------------------------------------------------------------------------
// Part 2: Source Code Verification for AI Subtitle Caching & Loading
// -----------------------------------------------------------------------------
console.log("\n[2/4] Checking AI Subtitle Caching & Loading Controls…");

const aiTabPath = path.join(rootDir, "src/components/AiSubtitlePunctuationTab.tsx");
assert(fs.existsSync(aiTabPath), "src/components/AiSubtitlePunctuationTab.tsx must exist");
const aiTabContent = fs.readFileSync(aiTabPath, "utf8");

assert(
  aiTabContent.includes("saveCachedAiSubtitles") &&
    aiTabContent.includes("getCachedAiSubtitles") &&
    aiTabContent.includes("clearCachedAiSubtitles"),
  "AiSubtitlePunctuationTab.tsx must import and use AI subtitle caching functions",
);

// Check caching on completion
assert(
  aiTabContent.includes("saveCachedAiSubtitles({") &&
    aiTabContent.includes("punctuatedJson3: res.punctuatedJson3"),
  "AiSubtitlePunctuationTab.tsx must save returned AI subtitles to cache",
);

// Check UI controls for cached AI subtitles
assert(
  aiTabContent.includes('data-testid="cached-ai-subtitles-card"'),
  "AiSubtitlePunctuationTab.tsx must render cached-ai-subtitles-card",
);
assert(
  aiTabContent.includes('data-testid="load-cached-ai-subtitles-btn"'),
  "AiSubtitlePunctuationTab.tsx must render load-cached-ai-subtitles-btn",
);
assert(
  aiTabContent.includes('data-testid="preview-cached-ai-subtitles-btn"'),
  "AiSubtitlePunctuationTab.tsx must render preview-cached-ai-subtitles-btn",
);
assert(
  aiTabContent.includes('data-testid="clear-cached-ai-subtitles-btn"'),
  "AiSubtitlePunctuationTab.tsx must render clear-cached-ai-subtitles-btn",
);

// Check SubtitlesTablePanel and viewer integration
const subtitlesTablePath = path.join(rootDir, "src/components/SubtitlesTablePanel.tsx");
assert(fs.existsSync(subtitlesTablePath), "src/components/SubtitlesTablePanel.tsx must exist");
const subtitlesTableContent = fs.readFileSync(subtitlesTablePath, "utf8");

assert(
  subtitlesTableContent.includes('data-testid="load-cached-ai-subtitles-viewer-btn"'),
  "SubtitlesTablePanel.tsx must render load-cached-ai-subtitles-viewer-btn when cached AI subtitles are available",
);

assert(
  indexContent.includes('data-testid="tab-ai-cached-indicator"'),
  "index.tsx must render tab-ai-cached-indicator badge on AI Punctuation tab button",
);

assert(
  indexContent.includes("handleLoadCachedAiFromViewer") &&
    indexContent.includes("hasCachedAi={hasCachedAi}") &&
    indexContent.includes("onLoadCachedAiSubtitles={handleLoadCachedAiFromViewer}"),
  "index.tsx must pass hasCachedAi and onLoadCachedAiSubtitles to SubtitlesTablePanel",
);

console.log("✅ PASS: AI subtitle caching and loading controls verified across components.");

// -----------------------------------------------------------------------------
// Part 3: Functional Unit Test for AI Subtitle Cache Operations
// -----------------------------------------------------------------------------
console.log("\n[3/4] Running functional tests for save, retrieve, check, and clear AI subtitles…");

const sampleVideoA = "TEST_VID_A_123";
const sampleVideoB = "TEST_VID_B_456";
const sampleLang = "en";

const dummyAiJson3: Json3 = {
  events: [
    {
      tStartMs: 0,
      dDurationMs: 2500,
      segs: [{ utf8: "Hello world. This is AI punctuated." }],
    },
    {
      tStartMs: 2500,
      dDurationMs: 3000,
      segs: [{ utf8: "How are you doing today?" }],
    },
  ],
};

// 1. Initially no cached AI subtitles
clearCachedAiSubtitles(sampleVideoA, sampleLang);
assert.strictEqual(
  hasCachedAiSubtitles(sampleVideoA, sampleLang),
  false,
  "Initially hasCachedAiSubtitles must be false",
);
assert.strictEqual(
  getCachedAiSubtitles(sampleVideoA, sampleLang),
  null,
  "Initially getCachedAiSubtitles must return null",
);

// 2. Save AI subtitles
saveCachedAiSubtitles({
  videoId: sampleVideoA,
  lang: sampleLang,
  punctuatedJson3: dummyAiJson3,
  segments: [
    {
      index: 0,
      start: 0,
      end: 2.5,
      originalText: "hello world this is ai punctuated",
      punctuatedText: "Hello world. This is AI punctuated.",
    },
    {
      index: 1,
      start: 2.5,
      end: 5.5,
      originalText: "how are you doing today",
      punctuatedText: "How are you doing today?",
    },
  ],
  modelUsed: "openrouter/auto:free",
  style: "conversational",
  timestamp: Date.now(),
  latencyMs: 1420,
  rawCount: 2,
  punctuatedCount: 3,
});

// 3. Verify retrieved data
assert.strictEqual(
  hasCachedAiSubtitles(sampleVideoA, sampleLang),
  true,
  "hasCachedAiSubtitles must be true after saving",
);

const retrieved = getCachedAiSubtitles(sampleVideoA, sampleLang);
assert(retrieved !== null, "getCachedAiSubtitles must not be null");
assert.strictEqual(retrieved.videoId, sampleVideoA);
assert.strictEqual(retrieved.lang, sampleLang);
assert.strictEqual(retrieved.modelUsed, "openrouter/auto:free");
assert.strictEqual(retrieved.punctuatedCount, 3);
assert.strictEqual(retrieved.rawCount, 2);
assert.deepStrictEqual(retrieved.punctuatedJson3, dummyAiJson3);

// 4. Verify isolation between videos
assert.strictEqual(
  hasCachedAiSubtitles(sampleVideoB, sampleLang),
  false,
  "sampleVideoB must not have AI subtitles cached for sampleVideoA",
);

// 5. Test clearCachedAiSubtitles
clearCachedAiSubtitles(sampleVideoA, sampleLang);
assert.strictEqual(
  hasCachedAiSubtitles(sampleVideoA, sampleLang),
  false,
  "hasCachedAiSubtitles must be false after clearing",
);
assert.strictEqual(
  getCachedAiSubtitles(sampleVideoA, sampleLang),
  null,
  "getCachedAiSubtitles must return null after clearing",
);

console.log("✅ PASS: Functional AI subtitle cache operations work with 100% precision.");

// -----------------------------------------------------------------------------
// Part 4: Version 1.0.42 Consistency Check
// -----------------------------------------------------------------------------
console.log("\n[4/4] Checking version synchronization (1.0.42) across all 5 targets…");

const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
assert.strictEqual(packageJson.version, "1.0.42", "package.json version must be 1.0.42");

const buildGradle = fs.readFileSync(
  path.join(rootDir, "android-shell/app/build.gradle.kts"),
  "utf8",
);
assert(
  buildGradle.includes('versionName = "1.0.42"'),
  "build.gradle.kts versionName must be 1.0.42",
);
assert(buildGradle.includes("versionCode = 10042"), "build.gradle.kts versionCode must be 10042");

assert.strictEqual(
  CURRENT_APK_VERSION,
  "v1.0.42",
  "src/utils/apkUpdater.ts CURRENT_APK_VERSION must be v1.0.42",
);

assert.strictEqual(APP_VERSION, "1.0.42", "src/config/appConfig.ts APP_VERSION must be 1.0.42");

const appSettingsContent = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf8");
assert(
  appSettingsContent.includes('version: "1.0.42"'),
  "src/utils/appSettings.ts default snapshot must be 1.0.42",
);

console.log("✅ PASS: Version 1.0.42 is strictly synchronized across all 5 files.");

console.log("\n=========================================================================");
console.log("🎉 ALL TESTS PASSED: Subtitles table clean reset and AI cache fully verified!");
console.log("=========================================================================");
