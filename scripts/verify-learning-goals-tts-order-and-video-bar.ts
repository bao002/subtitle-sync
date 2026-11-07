import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getVideoBarIndex,
  updatePrecedenceFromVideoBarIndex,
} from "../src/components/VideoPlaybackPrecedenceBar";
import {
  getSectionOrder,
  setSectionOrder,
  getTtsLanguageOrdersPreference,
  setTtsLanguageOrderPreference,
} from "../src/lib/playback-preferences";

console.log("=========================================================================");
console.log("🧪 Verifying TTS Playback Order & In-Between Video Bar in Learning Goals (Task 327)");
console.log("=========================================================================");

const root = process.cwd();

// Mock localStorage for node environment
const mockStorage: Record<string, string> = {};
const mockWindow = {
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
(global as any).window = mockWindow;
(globalThis as any).window = mockWindow;

// --------------------------------------------------------------------------
// [Test 1] Inspecting Advanced Mode Learning Goals in src/routes/index.tsx
// --------------------------------------------------------------------------
console.log("\n--> [Test 1] Inspecting Advanced Mode Learning Goals in src/routes/index.tsx...");
const indexTsxPath = path.join(root, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// 1.1 Must define stage-2-learning-goals-card
assert.ok(
  indexContent.includes('id="stage-2-learning-goals-card"'),
  "index.tsx must define stage-2-learning-goals-card",
);

// 1.2 Learning Goals card must NOT render redundant VideoLanguageSequenceControl banner (removed in Prompt 95)
const stage2CardIndex = indexContent.indexOf('id="stage-2-learning-goals-card"');
const stage2EndIndex = indexContent.indexOf('/* Regular Languages Accordion Content', stage2CardIndex);
const stage2SectionContent = indexContent.slice(stage2CardIndex, stage2EndIndex);

assert.ok(
  !stage2SectionContent.includes("<VideoLanguageSequenceControl"),
  "Stage 2 Learning Goals card must not render redundant VideoLanguageSequenceControl banner",
);

// 1.3 Learning Goals card must render VideoPlaybackPrecedenceBar (video bar in between)
assert.ok(
  stage2SectionContent.includes("<VideoPlaybackPrecedenceBar"),
  "Stage 2 Learning Goals card must render VideoPlaybackPrecedenceBar",
);

// 1.4 Learning Goals card must provide language reordering buttons
assert.ok(
  stage2SectionContent.includes("stage-2-btn-move-lang-up-"),
  "Stage 2 Learning Goals must render move-up button for TTS playback order",
);
assert.ok(
  stage2SectionContent.includes("stage-2-btn-move-lang-down-"),
  "Stage 2 Learning Goals must render move-down button for TTS playback order",
);

// 1.5 Learning Goals card must provide 'Place Video Here' button for positioning video between languages
assert.ok(
  stage2SectionContent.includes("btn-place-video-before-"),
  "Stage 2 Learning Goals must render Place Video Here button per language",
);

console.log("✅ PASS: Advanced Mode Stage 2 Learning Goals contains precedence bar and order buttons without redundant banner.");

// --------------------------------------------------------------------------
// [Test 2] Inspecting Beginner Mode Parity in PerLanguageTtsPreferences.tsx
// --------------------------------------------------------------------------
console.log("\n--> [Test 2] Inspecting Beginner Mode Parity in PerLanguageTtsPreferences.tsx...");
const beginnerPrefsPath = path.join(root, "src/components/beginner/PerLanguageTtsPreferences.tsx");
assert.ok(fs.existsSync(beginnerPrefsPath), "PerLanguageTtsPreferences.tsx must exist");
const beginnerContent = fs.readFileSync(beginnerPrefsPath, "utf8");

// 2.1 Beginner mode must NOT render redundant VideoLanguageSequenceControl banner
assert.ok(
  !beginnerContent.includes("<VideoLanguageSequenceControl"),
  "Beginner Mode PerLanguageTtsPreferences must not render redundant VideoLanguageSequenceControl for 100% parity",
);

// 2.2 Beginner mode must render VideoPlaybackPrecedenceBar
assert.ok(
  beginnerContent.includes("<VideoPlaybackPrecedenceBar"),
  "Beginner Mode PerLanguageTtsPreferences must render VideoPlaybackPrecedenceBar",
);

// 2.3 Beginner mode must render language reordering buttons
assert.ok(
  beginnerContent.includes("beginner-btn-move-lang-up-"),
  "Beginner Mode must render move-up button for TTS playback order",
);
assert.ok(
  beginnerContent.includes("beginner-btn-move-lang-down-"),
  "Beginner Mode must render move-down button for TTS playback order",
);

// 2.4 Beginner mode must render Place Video Here button
assert.ok(
  beginnerContent.includes("btn-place-video-before-"),
  "Beginner Mode must render Place Video Here button",
);

console.log("✅ PASS: Beginner Mode has 100% parity with sequence control, precedence bar, and reorder controls.");

// --------------------------------------------------------------------------
// [Test 3] Precedence Calculation Logic & In-Between Video Positioning
// --------------------------------------------------------------------------
console.log("\n--> [Test 3] Testing Precedence Calculation Logic for Video In-Between...");

const testLangs = ["en", "es", "he", "ar"];

// 3.1 Video First (position 0)
const pos0 = updatePrecedenceFromVideoBarIndex(testLangs, 0);
assert.equal(pos0.sectionOrder, "video-first");
assert.equal(getVideoBarIndex(testLangs, pos0.languageOrders, pos0.sectionOrder), 0);

// 3.2 Video In-Between (position 2: en, es before; he, ar after)
const pos2 = updatePrecedenceFromVideoBarIndex(testLangs, 2);
assert.equal(pos2.sectionOrder, "video-middle");
assert.equal(pos2.languageOrders["en"], "tts-first");
assert.equal(pos2.languageOrders["es"], "tts-first");
assert.equal(pos2.languageOrders["he"], "video-first");
assert.equal(pos2.languageOrders["ar"], "video-first");
assert.equal(getVideoBarIndex(testLangs, pos2.languageOrders, pos2.sectionOrder), 2);

// 3.3 Video Last (position 4: all before video)
const pos4 = updatePrecedenceFromVideoBarIndex(testLangs, 4);
assert.equal(pos4.sectionOrder, "tts-first");
assert.equal(getVideoBarIndex(testLangs, pos4.languageOrders, pos4.sectionOrder), 4);

console.log("✅ PASS: Precedence calculation and round-trip indexing verified for in-between video placement.");

console.log("\n=========================================================================");
console.log("🎉 ALL TESTS PASSED! Task 327 verified with 100% parity across modes.");
console.log("=========================================================================");
