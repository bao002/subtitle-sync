import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("--> Validating Subtitles-Table-View Stage 2 Isolation (Prompt 93 contract)...");

  const root = path.resolve(".");
  const indexTsxPath = path.join(root, "src/routes/index.tsx");
  assert.ok(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
  const indexTsx = fs.readFileSync(indexTsxPath, "utf8");

  // 1. Stage 2 filter must return "subtitles" unconditionally
  const stage2Block = indexTsx.match(/if\s*\(currentAccordionStage\s*===\s*2\)[\s\S]*?return\s+([^;]+);/);
  assert.ok(stage2Block, "Must find stage 2 filter block in src/routes/index.tsx");
  assert.ok(
    stage2Block[0].includes('"subtitles"'),
    "Stage 2 filter block must return panelId === 'subtitles'",
  );
  console.log("✓ Stage 2 filter block includes subtitles panel");

  // 2. Stage 3 filter must strictly isolate to player (no subtitles on stage 3)
  const stage3Block = indexTsx.match(/if\s*\(currentAccordionStage\s*===\s*3\)[\s\S]*?return\s+([^;]+);/);
  assert.ok(stage3Block, "Must find stage 3 filter block in src/routes/index.tsx");
  assert.ok(
    stage3Block[0].includes('"player"') && !stage3Block[0].includes('"subtitles"'),
    "Stage 3 filter block must return panelId === 'player' and NOT subtitles",
  );
  console.log("✓ Stage 3 filter block strictly isolates to video player (no subtitles on stage 3)");

  // 3. Subtitles panel renders SubtitlesTablePanel without null wrapper
  const subtitlesSectionStart = indexTsx.indexOf('{panelId === "subtitles" && (');
  assert.ok(subtitlesSectionStart !== -1, 'Must find {panelId === "subtitles" && ( without null guard');
  assert.ok(
    indexTsx.includes('<SubtitlesTablePanel'),
    "Must render SubtitlesTablePanel inside subtitles panel",
  );
  assert.ok(
    indexTsx.includes('data-testid="advanced-parallel-subtitles"'),
    "Must have data-testid='advanced-parallel-subtitles' on section",
  );
  console.log("✓ SubtitlesTablePanel is rendered on subtitles panel");

  console.log("All validations for Subtitles-Table-View Stage 2 Isolation passed successfully!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
