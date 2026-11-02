import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getDefaultSubtitleLanguages,
  addDefaultSubtitleLanguage,
  saveDefaultSubtitleLanguages,
  DEFAULT_SUBTITLES_KEY_PREFIX,
} from "../src/utils/subtitleCache";

console.log("=========================================================================");
console.log("🧪 Verifying Stored Default Subtitles & Switchable Bar Around Video (Task 280)");
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
// [Check 1] Persistent Storage of Default Subtitles & No Reset on Switch
// --------------------------------------------------------------------------
console.log("--> [Check 1] Testing persistent storage and accumulation of default subtitles...");

const testVideoId = "test_vid_xyz123";
// Initially empty for a new video
assert.deepStrictEqual(getDefaultSubtitleLanguages(testVideoId), [], "New video starts with empty default subtitles");

// User starts with English
const afterFirst = addDefaultSubtitleLanguage(testVideoId, "en");
assert.ok(afterFirst.includes("en"), "Must contain English after first fetch");
assert.strictEqual(afterFirst.length, 1, "Must have exactly 1 language initially");

// User chooses another subtitle from video's menu: Spanish
const afterSecond = addDefaultSubtitleLanguage(testVideoId, "es");
assert.ok(afterSecond.includes("en"), "English must NOT be reset or removed");
assert.ok(afterSecond.includes("es"), "Spanish must be added");
assert.strictEqual(afterSecond.length, 2, "Must accumulate both default subtitle languages");

// User chooses yet another subtitle from video's menu: Hebrew
const afterThird = addDefaultSubtitleLanguage(testVideoId, "he");
assert.ok(afterThird.includes("en") && afterThird.includes("es") && afterThird.includes("he"), "All 3 must be preserved");
assert.strictEqual(afterThird.length, 3, "Must preserve all 3 fetched default subtitles");

// Verify localStorage was written correctly
const rawStored = mockStorage[`${DEFAULT_SUBTITLES_KEY_PREFIX}${testVideoId}`];
assert.ok(rawStored, "Must persist to localStorage under DEFAULT_SUBTITLES_KEY_PREFIX");
const parsedStored = JSON.parse(rawStored);
assert.deepStrictEqual(parsedStored.sort(), ["en", "es", "he"].sort(), "Stored JSON must match accumulated languages");

// Verify retrieval across session reload
const reloaded = getDefaultSubtitleLanguages(testVideoId);
assert.deepStrictEqual(reloaded.sort(), ["en", "es", "he"].sort(), "Must retrieve all accumulated default subtitles on reload");
console.log("✅ PASS: Default subtitles accumulate and persist without resetting on switch.");

// --------------------------------------------------------------------------
// [Check 2] SwitchableDefaultSubtitlesBar Component Existence & Contract
// --------------------------------------------------------------------------
console.log("--> [Check 2] Inspecting SwitchableDefaultSubtitlesBar component...");
const barPath = path.join(root, "src/components/SwitchableDefaultSubtitlesBar.tsx");
assert.ok(fs.existsSync(barPath), "src/components/SwitchableDefaultSubtitlesBar.tsx must exist");
const barContent = fs.readFileSync(barPath, "utf8");

assert.ok(
  barContent.includes('data-testid="switchable-default-subtitles-bar"'),
  "Must render switchable-default-subtitles-bar container testid",
);
assert.ok(
  barContent.includes('data-testid={`default-subtitle-lang-btn-${langCode}`}'),
  "Must render individual language buttons with default-subtitle-lang-btn testid",
);
assert.ok(
  barContent.includes('data-testid="active-default-subtitle-indicator"'),
  "Must visually highlight active default subtitle language",
);
assert.ok(
  barContent.includes("onSelectLanguage(langCode)"),
  "Must invoke onSelectLanguage callback when clicked",
);
console.log("✅ PASS: SwitchableDefaultSubtitlesBar satisfies all UI component requirements.");

// --------------------------------------------------------------------------
// [Check 3] Placement Around Video Component in Advanced & Beginner Modes
// --------------------------------------------------------------------------
console.log("--> [Check 3] Inspecting placement around video component in index.tsx...");
const indexTsxPath = path.join(root, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

assert.ok(
  indexContent.includes("import { SwitchableDefaultSubtitlesBar }"),
  "index.tsx must import SwitchableDefaultSubtitlesBar",
);
assert.ok(
  indexContent.includes("const [defaultSubtitleLanguages, setDefaultSubtitleLanguages]"),
  "index.tsx must manage defaultSubtitleLanguages state",
);

// Advanced mode placement around video
assert.ok(
  indexContent.includes("<SwitchableDefaultSubtitlesBar") &&
    indexContent.includes("defaultLanguages={defaultSubtitleLanguages}"),
  "Advanced mode must render SwitchableDefaultSubtitlesBar around video component",
);

// Beginner mode placement
assert.ok(
  indexContent.includes("playbackControlsSlot={") &&
    indexContent.includes("<SwitchableDefaultSubtitlesBar"),
  "Beginner mode must also render SwitchableDefaultSubtitlesBar around video for parity",
);
console.log("✅ PASS: SwitchableDefaultSubtitlesBar is positioned around video component in both modes.");

// --------------------------------------------------------------------------
// [Check 4] Placement in Video Playground Around Playground Video
// --------------------------------------------------------------------------
console.log("--> [Check 4] Inspecting placement in VideoPlayground.tsx...");
const playgroundPath = path.join(root, "src/components/VideoPlayground.tsx");
const playgroundContent = fs.readFileSync(playgroundPath, "utf8");

assert.ok(
  playgroundContent.includes("import { SwitchableDefaultSubtitlesBar }"),
  "VideoPlayground.tsx must import SwitchableDefaultSubtitlesBar",
);
assert.ok(
  playgroundContent.includes("<SwitchableDefaultSubtitlesBar"),
  "VideoPlayground.tsx must render SwitchableDefaultSubtitlesBar around playground video",
);
assert.ok(
  playgroundContent.includes("isPlayground"),
  "VideoPlayground.tsx must pass isPlayground flag to SwitchableDefaultSubtitlesBar",
);
console.log("✅ PASS: SwitchableDefaultSubtitlesBar is cleanly integrated into Video Playground.");

// --------------------------------------------------------------------------
// [Check 5] Hydration & Live Interception Preserves Default Subtitles
// --------------------------------------------------------------------------
console.log("--> [Check 5] Verifying cache hydration and live interception preservation...");
assert.ok(
  indexContent.includes("const defaultLangs = getDefaultSubtitleLanguages(videoId);"),
  "Cache hydration must read stored defaultSubtitleLanguages for the video",
);
assert.ok(
  indexContent.includes("addDefaultSubtitleLanguage(videoId, lang);"),
  "Interception must accumulate newly intercepted default subtitles via addDefaultSubtitleLanguage",
);
assert.ok(
  indexContent.includes("handleSelectDefaultSubtitle"),
  "index.tsx must implement handleSelectDefaultSubtitle to switch active default language",
);
console.log("✅ PASS: Hydration and live interception preserve and accumulate default subtitles.");

console.log("=========================================================================");
console.log("🎉 All Task 280 Switchable Default Subtitles Verification Checks PASSED 100%!");
console.log("=========================================================================");
