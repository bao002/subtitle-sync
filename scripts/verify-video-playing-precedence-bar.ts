import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getVideoBarIndex,
  updatePrecedenceFromVideoBarIndex,
} from "../src/components/VideoPlaybackPrecedenceBar";

console.log("=== Testing Video Playing Precedence Bar ===");

// 1. Logic unit tests for calculation & update helpers
const sampleLangs = ["en", "es", "fr", "de"];

// Case A: Bar at top (index 0) => Video before all languages
{
  const { sectionOrder, languageOrders } = updatePrecedenceFromVideoBarIndex(sampleLangs, 0);
  assert.equal(sectionOrder, "video-first", "sectionOrder should be video-first at position 0");
  for (const code of sampleLangs) {
    assert.equal(languageOrders[code], "video-first", `${code} should have video-first order`);
  }
  const roundTripIndex = getVideoBarIndex(sampleLangs, languageOrders, sectionOrder);
  assert.equal(roundTripIndex, 0, "round-trip index should be 0");
  console.log("✓ Position 0 (Video before all languages) logic verified");
}

// Case B: Bar at bottom (index 4) => Video after all languages
{
  const { sectionOrder, languageOrders } = updatePrecedenceFromVideoBarIndex(sampleLangs, 4);
  assert.equal(sectionOrder, "tts-first", "sectionOrder should be tts-first at bottom position");
  for (const code of sampleLangs) {
    assert.equal(languageOrders[code], "tts-first", `${code} should have tts-first order`);
  }
  const roundTripIndex = getVideoBarIndex(sampleLangs, languageOrders, sectionOrder);
  assert.equal(roundTripIndex, 4, "round-trip index should be 4");
  console.log("✓ Position 4 (Video after all languages) logic verified");
}

// Case C: Bar in the middle (index 2: en, es before video; fr, de after video)
{
  const { sectionOrder, languageOrders } = updatePrecedenceFromVideoBarIndex(sampleLangs, 2);
  assert.equal(sectionOrder, "video-middle", "sectionOrder should be video-middle when split");
  assert.equal(languageOrders["en"], "tts-first");
  assert.equal(languageOrders["es"], "tts-first");
  assert.equal(languageOrders["fr"], "video-first");
  assert.equal(languageOrders["de"], "video-first");

  const roundTripIndex = getVideoBarIndex(sampleLangs, languageOrders, sectionOrder);
  assert.equal(roundTripIndex, 2, "round-trip index should be 2");
  console.log("✓ Position 2 (Video between en/es and fr/de) logic verified");
}

// 2. Integration in Advanced Mode (src/routes/index.tsx)
{
  const routesIndex = fs.readFileSync(path.resolve("src/routes/index.tsx"), "utf8");
  assert.ok(
    routesIndex.includes("VideoPlaybackPrecedenceBar"),
    "src/routes/index.tsx must import and use VideoPlaybackPrecedenceBar",
  );
  assert.ok(
    routesIndex.includes("btn-place-video-before-"),
    "src/routes/index.tsx must render btn-place-video-before button per table row",
  );
  assert.ok(
    routesIndex.includes("unified-languages-table"),
    "unified-languages-table must exist in src/routes/index.tsx",
  );
  console.log("✓ Advanced Mode (unified-languages-table) integration verified");
}

// 3. Parity in Beginner Mode (src/components/beginner/PerLanguageTtsPreferences.tsx)
{
  const beginnerTts = fs.readFileSync(
    path.resolve("src/components/beginner/PerLanguageTtsPreferences.tsx"),
    "utf8",
  );
  assert.ok(
    beginnerTts.includes("VideoPlaybackPrecedenceBar"),
    "PerLanguageTtsPreferences must import and use VideoPlaybackPrecedenceBar",
  );
  assert.ok(
    beginnerTts.includes("btn-place-video-before-"),
    "PerLanguageTtsPreferences must render btn-place-video-before button for parity",
  );
  console.log("✓ Beginner Mode (PerLanguageTtsPreferences) parity verified");
}

// 4. Storybook-first component workflow
{
  const storyFile = path.resolve("src/components/VideoPlaybackPrecedenceBar.stories.tsx");
  assert.ok(fs.existsSync(storyFile), "Storybook story file must exist");
  const workbench = fs.readFileSync(path.resolve("src/storybook/StorybookWorkbench.tsx"), "utf8");
  assert.ok(
    workbench.includes("VideoPlaybackPrecedenceBar"),
    "StorybookWorkbench must register VideoPlaybackPrecedenceBar",
  );
  console.log("✓ Storybook-first workflow and workbench integration verified");
}

console.log("🎉 All Video Playing Precedence Bar verifications passed successfully!");
