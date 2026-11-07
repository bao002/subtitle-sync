import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getLanguageTtsRatio,
  saveTtsRatioPreference,
  getTtsRatiosPreference,
  setTtsRatioPreference,
} from "../src/lib/playback-preferences";

console.log("=========================================================================");
console.log("🧪 Verifying Learning Goals Component Design & UI Split (Task 329)");
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
// [Test 1] Verify Component Design Documentation
// --------------------------------------------------------------------------
console.log("--> [Test 1] Inspecting docs/component_design/language_goals.md...");
const docPath = path.join(root, "docs/component_design/language_goals.md");
assert.ok(fs.existsSync(docPath), "docs/component_design/language_goals.md must exist");
const docContent = fs.readFileSync(docPath, "utf8");

assert.ok(
  docContent.includes("Default Translation Source") || docContent.includes("Translation Source"),
  "Component design doc must describe Default Translation Source",
);
assert.ok(
  docContent.includes("no secondary language tag") || docContent.includes("No Secondary Tag"),
  "Component design doc must specify warning: no secondary language tag defined or presented",
);
assert.ok(
  docContent.includes("Favorite Languages") || docContent.includes("favorite languages"),
  "Component design doc must specify favorite languages list and add language",
);
assert.ok(
  docContent.includes("Order of Playing") && docContent.includes("Precedence Bar"),
  "Component design doc must define Type A: Order of Playing with video precedence bar",
);
assert.ok(
  docContent.includes("TTS-Play Ratio") && docContent.includes("slider") && (docContent.includes("plus") || docContent.includes("+")),
  "Component design doc must define Type B: TTS-Play Ratio slider control with plus/minus buttons",
);
assert.ok(
  docContent.includes("Blacklisted") && docContent.includes("sentence") && docContent.includes("word"),
  "Component design doc must define Type C: Blacklisted control skipping sentence TTS while allowing word TTS",
);
console.log("✅ PASS: docs/component_design/language_goals.md contains comprehensive design specifications.");

// --------------------------------------------------------------------------
// [Test 2] Verify UI Split & Controls in src/routes/index.tsx
// --------------------------------------------------------------------------
console.log("--> [Test 2] Inspecting Stage 2 Learning Goals implementation in src/routes/index.tsx...");
const indexTsxPath = path.join(root, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// A. Check for container and header
assert.ok(
  indexContent.includes('id="stage-2-language-ratios-container"'),
  "index.tsx must contain stage-2-language-ratios-container",
);

// B. Check that Secondary badge is NOT rendered in stage-2-ratio-row
const stage2RatiosStart = indexContent.indexOf('id="stage-2-language-ratios-container"');
const stage2RatiosSection = indexContent.slice(
  stage2RatiosStart,
  stage2RatiosStart + 60000,
);

assert.ok(
  !stage2RatiosSection.includes(">Secondary</span>"),
  "Stage 2 learning goals ratio row must NOT render a Secondary tag",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-primary-badge-${langCode}`}'),
  "Stage 2 learning goals ratio row renders Default Source (1x) primary badge",
);
console.log("✅ PASS: Secondary language tag is omitted; only default source is badged.");

// C. Check Ingredient 1: Order of Playing & Video Precedence Controls
assert.ok(
  stage2RatiosSection.includes('data-testid="stage-2-ingredient-order-section"'),
  "Stage 2 learning goals must render dedicated top-level Ingredient 1 Order section containing all languages",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-order-row-${langCode}`}'),
  "Stage 2 learning goals must render order row per language",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-order-controls-${langCode}`}'),
  "Stage 2 learning goals must render dedicated order controls container",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-btn-move-lang-up-${langCode}`}'),
  "Stage 2 must render move-up button",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`btn-place-video-before-${langCode}`}'),
  "Stage 2 must render place video before button",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-btn-move-lang-down-${langCode}`}'),
  "Stage 2 must render move-down button",
);
assert.ok(
  stage2RatiosSection.includes("<VideoPlaybackPrecedenceBar"),
  "Stage 2 must render in-between VideoPlaybackPrecedenceBar inside Ingredient 1",
);
console.log("✅ PASS: Ingredient 1 (Order of Playing & Video Precedence Bar containing all languages) is verified.");

// D. Check Ingredient 2: TTS-Play Ratio Slider with +/- buttons on both edges
assert.ok(
  stage2RatiosSection.includes('data-testid="stage-2-ingredient-ratios-section"'),
  "Stage 2 learning goals must render dedicated top-level Ingredient 2 Ratios section containing all languages",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-ratio-slider-container-${langCode}`}'),
  "Stage 2 must render ratio slider container per language",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-ratio-decrement-${langCode}`}'),
  "Stage 2 must render minus/decrement button on left edge of slider",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-ratio-slider-${langCode}`}'),
  "Stage 2 must render range slider input",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-ratio-increment-${langCode}`}'),
  "Stage 2 must render plus/increment button on right edge of slider",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-ratio-display-${langCode}`}'),
  "Stage 2 must render ratio display badge",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-ratio-btn-${langCode}-${ratioVal}`}'),
  "Stage 2 must retain preset buttons testid for backwards compatibility",
);
console.log("✅ PASS: Ingredient 2 (TTS-Play Ratio slider with +/- edge buttons containing all languages) is verified.");

// E. Check Ingredient 3: Blacklisted Control (Skip sentence TTS, allow word TTS)
assert.ok(
  stage2RatiosSection.includes('data-testid="stage-2-ingredient-blacklist-section"'),
  "Stage 2 learning goals must render dedicated top-level Ingredient 3 Blacklist section containing all languages",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-blacklist-container-${langCode}`}'),
  "Stage 2 must render dedicated blacklist container per language",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-toggle-blacklist-${langCode}`}'),
  "Stage 2 must render blacklist toggle button",
);
assert.ok(
  stage2RatiosSection.includes("Blacklisted (Skip sentence, allow word)") ||
    stage2RatiosSection
      .replace(/\s+/g, " ")
      .includes("Blacklisted (Skip sentence, allow word)"),
  "Blacklist button must explicitly state: Blacklisted (Skip sentence, allow word)",
);
console.log("✅ PASS: Ingredient 3 (Blacklisted Control for sentence vs word granularity containing all languages) is verified.");

// F. Check Ingredient 4: Sentence or Word Granularity Control
assert.ok(
  stage2RatiosSection.includes('data-testid="stage-2-ingredient-sentence-word-section"'),
  "Stage 2 learning goals must render dedicated top-level Ingredient 4 Sentence or Word section containing all languages",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`stage-2-sentence-or-word-container-${langCode}`}'),
  "Stage 2 must render dedicated container per language for Ingredient 4: Sentence or Word",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`zero-knowledge-toggle-${langCode}`}'),
  "Stage 2 must render sentence/word toggle button",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`pick-word-strategy-longest-${langCode}`}'),
  "Stage 2 must render longest word strategy button",
);
assert.ok(
  stage2RatiosSection.includes('data-testid={`pick-word-strategy-random-${langCode}`}'),
  "Stage 2 must render random word strategy button",
);
console.log("✅ PASS: Ingredient 4 (Sentence or Word control with word picking strategies containing all languages) is verified.");

// --------------------------------------------------------------------------
// [Test 3] Verify Beginner Mode Parity
// --------------------------------------------------------------------------
console.log("--> [Test 3] Inspecting Beginner Mode Parity in PerLanguageTtsPreferences.tsx...");
const beginnerTabPath = path.join(
  root,
  "src/components/beginner/PerLanguageTtsPreferences.tsx",
);
assert.ok(fs.existsSync(beginnerTabPath), "PerLanguageTtsPreferences.tsx must exist");
const beginnerContent = fs.readFileSync(beginnerTabPath, "utf8");

assert.ok(
  beginnerContent.includes("Blacklisted (Skip sentence, allow word)"),
  "Beginner Mode blacklist toggle must also state: Blacklisted (Skip sentence, allow word)",
);
console.log("✅ PASS: Beginner Mode has parity with sentence vs word blacklist labeling.");

// --------------------------------------------------------------------------
// [Test 4] Functional Ratio Range & Clamping Verification
// --------------------------------------------------------------------------
console.log("--> [Test 4] Testing ratio clamp logic (1..20)...");
setTtsRatioPreference("fr", 1);
assert.strictEqual(getLanguageTtsRatio(getTtsRatiosPreference(), "fr"), 1, "Ratio 1 permitted");

setTtsRatioPreference("fr", 0);
assert.strictEqual(getLanguageTtsRatio(getTtsRatiosPreference(), "fr"), 1, "Ratio < 1 clamped to 1");

setTtsRatioPreference("fr", 20);
assert.strictEqual(getLanguageTtsRatio(getTtsRatiosPreference(), "fr"), 20, "Ratio 20 permitted");

setTtsRatioPreference("fr", 25);
assert.strictEqual(getLanguageTtsRatio(getTtsRatiosPreference(), "fr"), 20, "Ratio > 20 clamped to 20");
console.log("✅ PASS: Ratio boundaries strictly clamped to [1, 20].");

console.log("\n=========================================================================");
console.log("🎉 ALL TESTS PASSED! Task 329 verified successfully.");
console.log("=========================================================================");
