/**
 * Dedicated test script: scripts/verify-main-stage-components-isolated.ts
 *
 * Prompt 93 / Task 326:
 * "any one of the main stage's component - should apear only on his stage. i.e: the video - dont show anywhere else,same for the subtitles table and etc."
 *
 * Validates:
 * 1. Stage 0: fetchedSubtitles appears ONLY on Stage 0 (never on 1, 2, 3, 4).
 * 2. Stage 1: languages appears ONLY on Stage 1 (never on 0, 2, 3, 4).
 * 3. Stage 2: subtitles table appears ONLY on Stage 2 (never on 0, 1, 3, 4).
 * 4. Stage 3: video player appears ONLY on Stage 3 (never on 0, 1, 2, 4).
 * 5. Stage 4: playback and library settings appear ONLY on Stage 4 (never on 0, 1, 2, 3).
 * 6. Stage 3 stepper click opens player panel exclusively (not subtitles).
 * 7. Stage 2 NEXT button opens player panel exclusively (not subtitles).
 * 8. Stage 3 navigation bar provides dedicated back button to Stage 2 subtitles table.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Strict Main Stage Component Isolation (Task 326 / Prompt 93)");
  console.log("=========================================================================");

  const root = path.resolve(".");
  const indexTsxPath = path.join(root, "src/routes/index.tsx");
  assert.ok(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
  const indexTsx = fs.readFileSync(indexTsxPath, "utf8");

  // 1. Locate the panelOrder.filter block
  const filterBlockMatch = indexTsx.match(/panelOrder\s*\.filter\(\(panelId\)\s*=>\s*\{([\s\S]*?)\}\s*\)\s*\.map/);
  assert.ok(filterBlockMatch, "Must find panelOrder.filter block in src/routes/index.tsx");
  const filterBody = filterBlockMatch[1];

  // 2. Test Stage 0: fetchedSubtitles ONLY
  assert.ok(
    filterBody.includes('if (currentAccordionStage === 0)') &&
      filterBody.includes('return panelId === "fetchedSubtitles";'),
    "Stage 0 must strictly return panelId === 'fetchedSubtitles'",
  );
  console.log("✅ PASS: Stage 0 strictly isolates to Fetched Subtitles & Statistics");

  // 3. Test Stage 1: languages ONLY
  assert.ok(
    filterBody.includes('if (currentAccordionStage === 1)') &&
      filterBody.includes('return panelId === "languages";'),
    "Stage 1 must strictly return panelId === 'languages'",
  );
  console.log("✅ PASS: Stage 1 strictly isolates to Learning Goals / Languages");

  // 4. Test Stage 2: subtitles table ONLY
  assert.ok(
    filterBody.includes('if (currentAccordionStage === 2)') &&
      filterBody.includes('return panelId === "subtitles";'),
    "Stage 2 must strictly return panelId === 'subtitles'",
  );
  console.log("✅ PASS: Stage 2 strictly isolates to Parallel Subtitles Table");

  // 5. Test Stage 3: player ONLY (NO subtitles table leakage on stage 3)
  assert.ok(
    filterBody.includes('if (currentAccordionStage === 3)') &&
      filterBody.includes('return panelId === "player";'),
    "Stage 3 must strictly return panelId === 'player' (no subtitles table on stage 3)",
  );
  assert.ok(
    !/if\s*\(currentAccordionStage\s*===\s*3\)[\s\S]*?panelId\s*===\s*["']subtitles["']/.test(filterBody),
    "Subtitles table must NOT be returned on Stage 3 filter",
  );
  console.log("✅ PASS: Stage 3 strictly isolates to Video Player (no subtitles table on stage 3)");

  // 6. Test Stage 4: settings ONLY (playback and library)
  assert.ok(
    filterBody.includes('if (currentAccordionStage === 4)') &&
      filterBody.includes('return panelId === "playback" || panelId === "library";'),
    "Stage 4 must strictly return playback and library settings panels",
  );
  console.log("✅ PASS: Stage 4 strictly isolates to Settings panels");

  // 7. Verify stage 3 stepper opens player exclusively
  const stage3StepperSnippet = indexTsx.slice(
    indexTsx.indexOf('id="stage-step-3"'),
    indexTsx.indexOf('id="stage-step-3"') + 400,
  );
  assert.ok(
    stage3StepperSnippet.includes('player: true') && !stage3StepperSnippet.includes('subtitles: true'),
    "Stage 3 stepper click must open player panel exclusively (not subtitles)",
  );
  console.log("✅ PASS: Stage 3 stepper button opens player panel exclusively");

  // 8. Verify Stage 2 to Video button opens player exclusively
  const stage2BtnIdx = indexTsx.indexOf('id="stage-2-to-video-button"');
  const stage2OnClick = indexTsx.slice(stage2BtnIdx, stage2BtnIdx + 600);
  assert.ok(
    stage2OnClick.includes('player: true') && !stage2OnClick.includes('subtitles: true'),
    "Stage 2 to Video button must open player panel exclusively",
  );
  console.log("✅ PASS: Stage 2 to Video button opens player panel exclusively");

  // 9. Verify Stage 3 navigation bar exists with back to Stage 2 button
  assert.ok(
    indexTsx.includes('data-testid="stage-3-navigation-bar"'),
    "Stage 3 must include navigation bar (stage-3-navigation-bar)",
  );
  assert.ok(
    indexTsx.includes('data-testid="stage-3-back-to-subtitles-btn"'),
    "Stage 3 must include back to subtitles table button (stage-3-back-to-subtitles-btn)",
  );
  assert.ok(
    indexTsx.includes('data-testid="stage-3-to-settings-btn"'),
    "Stage 3 must include forward to settings button (stage-3-to-settings-btn)",
  );
  console.log("✅ PASS: Stage 3 contains navigation bar with back to subtitles table and forward to settings");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Main stage components strictly isolated to their own stages!");
  console.log("=========================================================================");
}

main().catch((err) => {
  console.error("❌ FAIL: Verification failed:", err);
  process.exit(1);
});
