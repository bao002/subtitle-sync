import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("--> Starting validation of Stage Click View Visibility (Task 362)...");

  const root = path.resolve(".");
  const indexTsx = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");

  // 1. Stage Stepper buttons must set openPanels and update currentAccordionStage
  console.log("Checking stage stepper navigation buttons...");
  assert.ok(
    indexTsx.includes('id="stage-step-0"') &&
      indexTsx.includes('setCurrentAccordionStage(0)') &&
      indexTsx.includes('fetchedSubtitles: true'),
    "Stage step 0 button must set stage 0 and open fetchedSubtitles panel",
  );
  assert.ok(
    indexTsx.includes('id="stage-step-1"') &&
      indexTsx.includes('setCurrentAccordionStage(1)') &&
      indexTsx.includes('languages: true'),
    "Stage step 1 button must set stage 1 and open languages panel",
  );
  assert.ok(
    indexTsx.includes('id="stage-step-2"') &&
      indexTsx.includes('setCurrentAccordionStage(2)') &&
      indexTsx.includes('subtitles: true'),
    "Stage step 2 button must set stage 2 and open subtitles panel",
  );
  assert.ok(
    indexTsx.includes('id="stage-step-3"') &&
      indexTsx.includes('setCurrentAccordionStage(3)') &&
      indexTsx.includes('player: true'),
    "Stage step 3 button must set stage 3 and open player panel",
  );
  assert.ok(
    indexTsx.includes('id="stage-step-4"') &&
      indexTsx.includes('setCurrentAccordionStage(4)') &&
      indexTsx.includes('playback: true, library: true') ||
      (indexTsx.includes('playback: true') && indexTsx.includes('library: true')),
    "Stage step 4 button must set stage 4 and open settings panels",
  );
  console.log("✓ Stepper button stage handlers verified");

  // 2. useEffect ensures stage view visibility whenever stage changes
  console.log("Checking useEffect stage synchronization guarantee...");
  assert.ok(
    indexTsx.includes("useEffect(() => {") &&
      indexTsx.includes("[currentAccordionStage]"),
    "Must have an active useEffect listening to currentAccordionStage changes",
  );
  assert.ok(
    indexTsx.includes("if (currentAccordionStage === 0) {") &&
      indexTsx.includes("setOpenPanels((prev) => ({ ...prev, fetchedSubtitles: true }));"),
    "useEffect must open fetchedSubtitles panel when currentAccordionStage is 0",
  );
  assert.ok(
    indexTsx.includes("else if (currentAccordionStage === 1) {") &&
      indexTsx.includes("setOpenPanels((prev) => ({ ...prev, languages: true }));"),
    "useEffect must open languages panel when currentAccordionStage is 1",
  );
  assert.ok(
    indexTsx.includes("else if (currentAccordionStage === 2) {") &&
      indexTsx.includes("setOpenPanels((prev) => ({ ...prev, subtitles: true }));"),
    "useEffect must open subtitles panel when currentAccordionStage is 2",
  );
  assert.ok(
    indexTsx.includes("else if (currentAccordionStage === 3) {") &&
      indexTsx.includes("setOpenPanels((prev) => ({ ...prev, player: true }));"),
    "useEffect must open player panel when currentAccordionStage is 3",
  );
  assert.ok(
    indexTsx.includes("else if (currentAccordionStage === 4) {") &&
      indexTsx.includes("setOpenPanels((prev) => ({ ...prev, playback: true, library: true }));"),
    "useEffect must open playback & library panels when currentAccordionStage is 4",
  );
  console.log("✓ useEffect stage view synchronization verified");

  // 3. In-panel navigation buttons must maintain visibility
  console.log("Checking in-panel progression buttons...");
  assert.ok(
    indexTsx.includes('data-testid="stage-1-next-button"') &&
      indexTsx.includes('setCurrentAccordionStage(2)'),
    "Stage 1 NEXT button must advance to Stage 2",
  );
  assert.ok(
    indexTsx.includes('data-testid="stage-2-to-video-button"') &&
      indexTsx.includes('setCurrentAccordionStage(3)'),
    "Stage 2 to Video button must advance to Stage 3",
  );
  assert.ok(
    indexTsx.includes('data-testid="stage-3-back-to-subtitles-btn"') &&
      indexTsx.includes('setCurrentAccordionStage(2)'),
    "Stage 3 back button must navigate to Stage 2",
  );
  assert.ok(
    indexTsx.includes('data-testid="stage-3-to-settings-btn"') &&
      indexTsx.includes('setCurrentAccordionStage(4)'),
    "Stage 3 to Settings button must navigate to Stage 4",
  );
  assert.ok(
    indexTsx.includes('data-testid="settings-open-stage-0-btn"') &&
      indexTsx.includes('setCurrentAccordionStage(0)'),
    "Settings open stage 0 button must navigate to Stage 0",
  );
  console.log("✓ In-panel navigation buttons verified");

  // 4. Panel filtering ensures strict stage isolation without hiding active stage
  console.log("Checking panelOrder filtering logic...");
  assert.ok(
    indexTsx.includes('if (currentAccordionStage === 0) {\n                      return panelId === "fetchedSubtitles";\n                    }'),
    "Must return fetchedSubtitles on stage 0",
  );
  assert.ok(
    indexTsx.includes('if (currentAccordionStage === 1) {\n                      return panelId === "languages";\n                    }'),
    "Must return languages on stage 1",
  );
  assert.ok(
    indexTsx.includes('if (currentAccordionStage === 2) {\n                      return panelId === "subtitles";\n                    }'),
    "Must return subtitles on stage 2",
  );
  assert.ok(
    indexTsx.includes('if (panelId === "player") {\n                      return currentAccordionStage === 3 || currentAccordionStage === 5;\n                    }'),
    "Must return player on stage 3 (and stage 5 learning view)",
  );
  assert.ok(
    indexTsx.includes('if (currentAccordionStage === 4) {\n                      return panelId === "playback" || panelId === "library";\n                    }'),
    "Must return playback and library on stage 4",
  );
  console.log("✓ Panel filter logic verified");

  console.log("All Stage Click View Visibility checks passed successfully!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
