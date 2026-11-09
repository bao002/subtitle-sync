import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

async function main() {
  console.log("--> Starting validation of Hotfix: src/routes/index.tsx lint and stage visibility...");

  const root = path.resolve(".");
  const indexTsx = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");

  // 1. Check for no 'any' type in panelOrder.filter
  console.log("Checking panelOrder filter type safety...");
  assert.ok(
    !indexTsx.includes(".filter((panelId: any)"),
    "src/routes/index.tsx must not contain '.filter((panelId: any)'",
  );
  assert.ok(
    indexTsx.includes(".filter((panelId: PanelId)"),
    "src/routes/index.tsx must type panelId as PanelId in panelOrder.filter",
  );
  console.log("✓ Type safety in panelOrder.filter verified");

  // 2. Check useEffect for stage view visibility and openPanels synchronization
  console.log("Checking useEffect stage synchronization for openPanels and settings accordion...");
  assert.ok(
    indexTsx.includes("currentAccordionStage === 0") &&
      indexTsx.includes("currentAccordionStage === 1") &&
      indexTsx.includes("currentAccordionStage === 2") &&
      indexTsx.includes("currentAccordionStage === 3") &&
      indexTsx.includes("currentAccordionStage === 4"),
    "Must handle all stages 0, 1, 2, 3, 4",
  );
  assert.ok(
    indexTsx.includes("setOpenPanels((prev) => ({ ...prev, fetchedSubtitles: true }))"),
    "Stage 0 must open fetchedSubtitles panel",
  );
  assert.ok(
    indexTsx.includes("setOpenPanels((prev) => ({ ...prev, languages: true }))"),
    "Stage 1 must open languages panel",
  );
  assert.ok(
    indexTsx.includes("setOpenPanels((prev) => ({ ...prev, subtitles: true }))"),
    "Stage 2 must open subtitles panel",
  );
  assert.ok(
    indexTsx.includes("setOpenPanels((prev) => ({ ...prev, player: true }))"),
    "Stage 3 must open player panel",
  );
  assert.ok(
    indexTsx.includes("setOpenPanels((prev) => ({ ...prev, playback: true, library: true }))"),
    "Stage 4 must open playback and library panels",
  );
  console.log("✓ Stage view synchronization logic verified");

  // 3. Run ESLint on src/lib src/routes to ensure clean execution
  console.log("Running ESLint on src/lib and src/routes...");
  execSync("npx eslint src/lib src/routes", { stdio: "inherit" });
  console.log("✓ ESLint verified clean");

  console.log("All Hotfix lint and stage visibility verifications passed successfully!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
