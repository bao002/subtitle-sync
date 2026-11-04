import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { calculateTrackPunctuationStats, analyzeDefaultSubtitlesPunctuation } from "../src/utils/subtitlePunctuationStats";
import { cacheJson3Track, getCachedTrackDetails, getCachedRawJson3 } from "../src/utils/subtitleCache";

async function main() {
  console.log("--> Starting validation of Fetched Subtitles Info & Statistics Stage (Prompt 62)...");

  const root = path.resolve(".");

  // 1. Check FetchedSubtitlesStagePanel component
  const panelPath = path.join(root, "src/components/FetchedSubtitlesStagePanel.tsx");
  assert.ok(fs.existsSync(panelPath), "FetchedSubtitlesStagePanel.tsx must exist");
  const panelContent = fs.readFileSync(panelPath, "utf8");

  assert.ok(
    panelContent.includes("export const FetchedSubtitlesStagePanel"),
    "Must export FetchedSubtitlesStagePanel component",
  );
  assert.ok(
    panelContent.includes('data-testid="fetched-subtitles-stage-panel"'),
    "Must have fetched-subtitles-stage-panel container",
  );
  assert.ok(
    panelContent.includes('data-testid="subtitles-fetching-controls-container"'),
    "Must contain subtitle fetching controls container within the accordion",
  );
  assert.ok(
    panelContent.includes('data-testid="stage-video-url-input"'),
    "Must contain video URL input inside the accordion",
  );
  assert.ok(
    panelContent.includes('data-testid="stage-timedtext-url-input"'),
    "Must contain direct timedtext URL input inside the accordion",
  );
  assert.ok(
    panelContent.includes('data-testid="subtitles-fetcher-terminal-log"'),
    "Must contain real-time terminal log element (youtube-subtitles-fetcher style)",
  );
  assert.ok(
    panelContent.includes('data-testid="parser-quarantine-status-card"'),
    "Must display inner parser quarantine status by default",
  );
  console.log("✓ FetchedSubtitlesStagePanel component structure verified");

  // 2. Check Punctuation Stats & Recommendation Engine
  console.log("Validating punctuation statistics calculation and recommendation...");
  const dummyTrackEn = {
    events: [
      { tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: "Hello world. How are you?" }] },
      { tStartMs: 2500, dDurationMs: 3000, segs: [{ utf8: "This is great! Yes, absolutely." }] },
    ],
  };
  const statsEn = calculateTrackPunctuationStats("en", dummyTrackEn);
  assert.strictEqual(statsEn.periods, 2, "Expected 2 periods");
  assert.strictEqual(statsEn.questionMarks, 1, "Expected 1 question mark");
  assert.strictEqual(statsEn.exclamationMarks, 1, "Expected 1 exclamation mark");
  assert.strictEqual(statsEn.commas, 1, "Expected 1 comma");
  assert.strictEqual(statsEn.totalPunctuation, 5, "Expected 5 total punctuation marks");

  const dummyTrackEs = {
    events: [
      { tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: "Hola mundo sin puntuacion" }] },
    ],
  };
  const analysis = analyzeDefaultSubtitlesPunctuation(["en", "es"], { en: dummyTrackEn, es: dummyTrackEs });
  assert.strictEqual(analysis.recommendedLang, "en", "Track with highest punctuation must be recommended");
  console.log("✓ Track with highest sentence punctuation count accurately recommended as translation source");

  // 3. Check Accordion Themes and Index Integration
  console.log("Validating accordion themes and index.tsx wiring...");
  const themesPath = path.join(root, "src/config/accordionThemes.ts");
  const themesContent = fs.readFileSync(themesPath, "utf8");
  assert.ok(
    themesContent.includes('"fetchedSubtitles"'),
    "accordionThemes.ts must include fetchedSubtitles in PanelId and PANELS",
  );

  const indexPath = path.join(root, "src/routes/index.tsx");
  const indexContent = fs.readFileSync(indexPath, "utf8");
  assert.ok(
    indexContent.includes('import { FetchedSubtitlesStagePanel }'),
    "index.tsx must import FetchedSubtitlesStagePanel",
  );
  assert.ok(
    indexContent.includes('id="stage-step-0"') && indexContent.includes('data-testid="stage-step-0"'),
    "index.tsx must include stage-step-0 button for Fetched Subtitles stage",
  );
  assert.ok(
    indexContent.includes('panelId === "fetchedSubtitles"'),
    "index.tsx must handle panelId === 'fetchedSubtitles' inside AccordionSection",
  );
  console.log("✓ Stage 0 stepper and accordion integration in index.tsx verified");

  // 4. Check Inner Parser Quarantined by Default in SubtitlesTablePanel
  console.log("Validating parser quarantine in SubtitlesTablePanel...");
  const tablePanelPath = path.join(root, "src/components/SubtitlesTablePanel.tsx");
  const tableContent = fs.readFileSync(tablePanelPath, "utf8");
  assert.ok(
    tableContent.includes('data-testid="subtitles-parser-quarantined-banner"'),
    "SubtitlesTablePanel must render parser quarantined banner by default",
  );
  assert.ok(
    tableContent.includes("showQuarantinedParser"),
    "SubtitlesTablePanel must manage showQuarantinedParser state defaulting to false",
  );
  console.log("✓ Inner parser quarantined and disabled by default in SubtitlesTablePanel");

  // 5. Check Storybook Integration
  console.log("Validating Storybook integration...");
  const storiesPath = path.join(root, "src/components/FetchedSubtitlesStagePanel.stories.tsx");
  assert.ok(fs.existsSync(storiesPath), "FetchedSubtitlesStagePanel.stories.tsx must exist");
  const workbenchPath = path.join(root, "src/storybook/StorybookWorkbench.tsx");
  const workbenchContent = fs.readFileSync(workbenchPath, "utf8");
  assert.ok(
    workbenchContent.includes('"fetched_subtitles"'),
    "StorybookWorkbench must include fetched_subtitles in component catalog",
  );
  console.log("✓ Storybook story and workbench registration verified");

  console.log("\n--> ALL Fetched Subtitles Info & Statistics Stage verifications passed successfully!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
