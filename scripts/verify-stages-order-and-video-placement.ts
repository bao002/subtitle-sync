import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("--> Validating Stage Order and Strict Video Placement (Stage 1 Learning Goals, Last Stage Video)...");

  const root = path.resolve(".");
  const indexTsxPath = path.join(root, "src/routes/index.tsx");
  assert.ok(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
  const indexTsx = fs.readFileSync(indexTsxPath, "utf8");

  // 1. Stepper labels
  assert.ok(
    indexTsx.includes('id="stage-step-1"') && indexTsx.includes('<span>Learning Goals</span>'),
    "Stage 1 step button must be labeled 'Learning Goals'",
  );
  assert.ok(
    indexTsx.includes('id="stage-step-2"') && indexTsx.includes('<span>Subtitles Table</span>'),
    "Stage 2 step button must be labeled 'Subtitles Table'",
  );
  assert.ok(
    indexTsx.includes('id="stage-step-3"') && indexTsx.includes('<span>Video &amp; Playback</span>'),
    "Stage 3 step button must be labeled 'Video & Playback'",
  );
  console.log("✓ Stepper labels verified: Stage 1 = Learning Goals, Stage 2 = Subtitles Table, Stage 3 = Video & Playback");

  // 2. Filter logic: Stage 1 must ONLY return languages
  const stage1Match = indexTsx.match(/if\s*\(currentAccordionStage\s*===\s*1\)[\s\S]*?return\s+([^;]+);/);
  assert.ok(stage1Match, "Must find stage 1 filter block");
  assert.strictEqual(
    stage1Match[1].trim(),
    'panelId === "languages"',
    "Stage 1 must strictly return panelId === 'languages'",
  );
  assert.ok(
    !stage1Match[0].includes('"player"'),
    "Video player must NOT be returned on Stage 1",
  );
  console.log("✓ Stage 1 strictly isolates to Learning Goals (no video)");

  // 3. Filter logic: Stage 2 must ONLY return subtitles
  const stage2Match = indexTsx.match(/if\s*\(currentAccordionStage\s*===\s*2\)[\s\S]*?return\s+([^;]+);/);
  assert.ok(stage2Match, "Must find stage 2 filter block");
  assert.strictEqual(
    stage2Match[1].trim(),
    'panelId === "subtitles"',
    "Stage 2 must strictly return panelId === 'subtitles'",
  );
  assert.ok(
    !stage2Match[0].includes('"player"'),
    "Video player must NOT be returned on Stage 2",
  );
  console.log("✓ Stage 2 strictly isolates to Subtitles Table (no video)");

  // 4. Filter logic: Stage 3 (last stage) is the video
  const stage3Match = indexTsx.match(/if\s*\(currentAccordionStage\s*===\s*3\)[\s\S]*?return\s+([^;]+);/);
  assert.ok(stage3Match, "Must find stage 3 filter block");
  assert.ok(
    stage3Match[1].includes('panelId === "player"'),
    "Stage 3 must include the video player",
  );
  console.log("✓ Stage 3 (last stage) renders the video player");

  // 5. Verification: Video player is NOT returned on any other stage
  console.log("✓ Video player is verified to be absent on Stage 1 and Stage 2");

  console.log("All validations for Stage Order and Strict Video Placement passed successfully!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
