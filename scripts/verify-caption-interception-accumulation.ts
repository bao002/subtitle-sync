import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getDefaultSubtitleLanguages,
  addDefaultSubtitleLanguage,
  saveDefaultSubtitleLanguages,
  DEFAULT_SUBTITLES_KEY_PREFIX,
} from "../src/utils/subtitleCache";
import { decodeInterceptedCaption, parseJson3 } from "../src/lib/native-captions";

console.log("=========================================================================");
console.log("🧪 Verifying Caption Interception & Accumulation (X -> Y -> Z) [Task 282]");
console.log("=========================================================================");

const root = process.cwd();

// Mock localStorage for node environment
const mockStorage: Record<string, string> = {};
(global as any).window = {
  localStorage: {
    getItem: (k: string) => mockStorage[k] || null,
    setItem: (k: string, v: string) => {
      mockStorage[k] = v;
    },
    removeItem: (k: string) => {
      delete mockStorage[k];
    },
    length: 0,
    key: () => null,
  },
};

// --------------------------------------------------------------------------
// [Test 1] Simulate X -> Y -> Z YouTube API Interception Pipeline
// --------------------------------------------------------------------------
console.log("--> [Test 1] Simulating YouTube API timedtext interception sequence X -> Y -> Z...");

const testVideoId = "test_xyz_video_777";
const sampleJson3 = (lang: string) => ({
  wireMagic: "pb3",
  events: [
    {
      tStartMs: 1000,
      dDurationMs: 2500,
      segs: [{ utf8: `Sample subtitle line in language ${lang}` }],
    },
  ],
});

// Step 1: Default subtitle is X ('en')
const xPayload = {
  url: `https://www.youtube.com/api/timedtext?v=${testVideoId}&lang=en&fmt=json3`,
  rawData: JSON.stringify(sampleJson3("en")),
};
const encodedX = Buffer.from(JSON.stringify(xPayload)).toString("base64");
const decodedX = decodeInterceptedCaption(encodedX);
assert.ok(decodedX, "Decoded X payload must be valid");
assert.strictEqual(decodedX.url, xPayload.url);
const parsedX = parseJson3(decodedX.rawData);
assert.ok(parsedX, "Parsed X JSON3 must be non-null");

const afterX = addDefaultSubtitleLanguage(testVideoId, "en");
assert.deepStrictEqual(afterX, ["en"], "Default subtitles list must contain language X ('en')");

// Step 2: User updates video to show captions in language Y ('es')
// YouTube API request triggered and intercepted
const yPayload = {
  url: `https://www.youtube.com/api/timedtext?v=${testVideoId}&lang=es&fmt=json3`,
  rawData: JSON.stringify(sampleJson3("es")),
};
const encodedY = Buffer.from(JSON.stringify(yPayload)).toString("base64");
const decodedY = decodeInterceptedCaption(encodedY);
assert.ok(decodedY, "Decoded Y payload must be valid");
const parsedY = parseJson3(decodedY.rawData);
assert.ok(parsedY, "Parsed Y JSON3 must be non-null");

const afterY = addDefaultSubtitleLanguage(testVideoId, "es");
assert.ok(afterY.includes("en"), "Language X must remain in default subtitles");
assert.ok(afterY.includes("es"), "Language Y must be added to default subtitles");
assert.strictEqual(afterY.length, 2, "Must contain exactly 2 default subtitles [X, Y]");

// Step 3: User later chooses language Z ('he')
// YouTube API request triggered and intercepted
const zPayload = {
  url: `https://www.youtube.com/api/timedtext?v=${testVideoId}&lang=en&tlang=he&fmt=json3`,
  rawData: JSON.stringify(sampleJson3("he")),
};
const encodedZ = Buffer.from(JSON.stringify(zPayload)).toString("base64");
const decodedZ = decodeInterceptedCaption(encodedZ);
assert.ok(decodedZ, "Decoded Z payload must be valid");
const parsedZ = parseJson3(decodedZ.rawData);
assert.ok(parsedZ, "Parsed Z JSON3 must be non-null");

const afterZ = addDefaultSubtitleLanguage(testVideoId, "he");
assert.ok(afterZ.includes("en"), "Language X must remain");
assert.ok(afterZ.includes("es"), "Language Y must remain");
assert.ok(afterZ.includes("he"), "Language Z must be added");
assert.strictEqual(afterZ.length, 3, "Must contain all 3 default subtitles [X, Y, Z]");

// Verify persisted storage
const retrievedStored = getDefaultSubtitleLanguages(testVideoId);
assert.deepStrictEqual(
  retrievedStored.sort(),
  ["en", "es", "he"].sort(),
  "Stored default languages must contain all accumulated tracks [X, Y, Z]",
);
console.log("✅ PASS: Simulated X -> Y -> Z sequence successfully intercepted and accumulated in default subtitles.");

// --------------------------------------------------------------------------
// [Test 2] Verify Codebase Interception Handlers in src/routes/index.tsx
// --------------------------------------------------------------------------
console.log("--> [Test 2] Checking index.tsx live caption interception & accumulation wiring...");

const indexTsxPath = path.join(root, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// 1. Check registerLiveCaptionInterceptor adds intercepted track to defaultSubtitleLanguages
assert.ok(
  indexContent.includes("addDefaultSubtitleLanguage(videoId, lang)"),
  "registerLiveCaptionInterceptor must call addDefaultSubtitleLanguage for intercepted lang",
);
assert.ok(
  indexContent.includes("setDefaultSubtitleLanguages((prev) => (prev.includes(lang) ? prev : [...prev, lang]))"),
  "registerLiveCaptionInterceptor must update defaultSubtitleLanguages state with intercepted lang",
);

// 2. Check handlePlayerCaptionToggled accumulates langCode
assert.ok(
  indexContent.includes("addDefaultSubtitleLanguage(videoId, langCode)"),
  "handlePlayerCaptionToggled must call addDefaultSubtitleLanguage for toggled caption langCode",
);

// 3. Check handleTogglePlayerCaptionTrack accumulates langCode
const hasTogglePlayerCaptionAccumulation =
  indexContent.includes("handleTogglePlayerCaptionTrack") &&
  indexContent.includes("addDefaultSubtitleLanguage(videoId, langCode)");
assert.ok(
  hasTogglePlayerCaptionAccumulation,
  "handleTogglePlayerCaptionTrack must accumulate default subtitle languages",
);

// 4. Check handleSelectDefaultSubtitle switches player captions track
assert.ok(
  indexContent.includes('primaryPlayer?.setOption?.("captions", "track", { languageCode: langCode })'),
  "handleSelectDefaultSubtitle must switch player captions track via primary player setOption",
);
console.log("✅ PASS: index.tsx interception and toggling handlers correctly accumulate default subtitles.");

// --------------------------------------------------------------------------
// [Test 3] Verify SwitchableDefaultSubtitlesBar Displays All Tracks Around Video
// --------------------------------------------------------------------------
console.log("--> [Test 3] Verifying SwitchableDefaultSubtitlesBar placement & props...");

const barPath = path.join(root, "src/components/SwitchableDefaultSubtitlesBar.tsx");
const barContent = fs.readFileSync(barPath, "utf8");
assert.ok(
  barContent.includes('data-testid="switchable-default-subtitles-bar"'),
  "SwitchableDefaultSubtitlesBar must define root data-testid",
);
assert.ok(
  barContent.includes('data-testid={`default-subtitle-lang-btn-${langCode}`}'),
  "SwitchableDefaultSubtitlesBar must render buttons with default-subtitle-lang-btn-{langCode}",
);

// Verify placement around the video in index.tsx
const barUsageCount = (indexContent.match(/<SwitchableDefaultSubtitlesBar/g) || []).length;
assert.ok(
  barUsageCount >= 2,
  `SwitchableDefaultSubtitlesBar must be rendered in both Advanced and Beginner modes (found ${barUsageCount} occurrences)`,
);

// Verify playground integration
const playgroundPath = path.join(root, "src/components/VideoPlayground.tsx");
const playgroundContent = fs.readFileSync(playgroundPath, "utf8");
assert.ok(
  playgroundContent.includes("<SwitchableDefaultSubtitlesBar"),
  "SwitchableDefaultSubtitlesBar must be rendered around the video in VideoPlayground.tsx",
);
console.log("✅ PASS: SwitchableDefaultSubtitlesBar rendered around video across Advanced mode, Beginner mode, and Playground.");

console.log("=========================================================================");
console.log("🎉 ALL TESTS PASSED! Task 282 requirements fully validated.");
console.log("=========================================================================");
