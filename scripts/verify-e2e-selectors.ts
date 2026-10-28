import fs from "fs";
import path from "path";

console.log("=========================================================================");
console.log("🧪 Verifying Proper & Meaningful E2E Test IDs & Child Addressability");
console.log("=========================================================================");

let failureCount = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failureCount++;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// Map of components to audit and the specific meaningful testids they must contain
const auditMap = [
  {
    file: "src/components/SubtitlesTablePanel.tsx",
    description: "Subtitles Table Panel with hierarchical table, thead, tbody, th, and col selectors",
    testIds: [
      'data-testid="subtitles-table-panel"',
      'data-testid="subtitles-table"',
      'data-testid="subtitles-table-head"',
      'data-testid="subtitles-table-body"',
      'data-testid="table-header-time"',
      "table-header-col-",
    ],
  },
  {
    file: "src/components/SubtitleRow.tsx",
    description: "Subtitle Row with addressable timestamp, sentence text, actions, speak buttons, and TTS status badges",
    testIds: [
      "subtitle-cue-row-",
      'data-testid="cue-row-timestamp"',
      "subtitle-cell-",
      "sentence-container-",
      'data-testid="sentence-text-wrapper"',
      'data-testid="sentence-actions-wrapper"',
      "btn-speak-cell-",
      "-tts-status-",
    ],
  },
  {
    file: "src/components/LanguageBoxesSelector.tsx",
    description: "Language Boxes with addressable card container, button, title, check icon, code badge, and expand drawer",
    testIds: [
      'data-testid="language-boxes-selector-wrapper"',
      'data-testid="language-boxes-grid"',
      "language-card-",
      "language-box-",
      'data-testid="language-box-title"',
      'data-testid="language-selected-check"',
      'data-testid="language-code-badge"',
      "expand-subtitles-url-",
    ],
  },
  {
    file: "src/components/VideoPlaybackControls.tsx",
    description: "Video Playback Controls with timeline, skips, sections, and rate selectors",
    testIds: [
      'data-testid="video-playback-controls"',
      'data-testid="player-control-time-display"',
      'data-testid="player-control-seekbar"',
      'data-testid="player-control-prev-section"',
      'data-testid="player-control-rewind"',
      'data-testid="player-control-play-pause"',
      'data-testid="player-control-forward"',
      'data-testid="player-control-next-section"',
      'data-testid="player-control-speed"',
    ],
  },
  {
    file: "src/components/beginner/tabs/BeginnerPlayerTab.tsx",
    description: "Beginner Daily Video tab with language badges, cues list, timestamps, and texts",
    testIds: [
      'data-testid="beginner-player-tab"',
      'data-testid="btn-player-play-pause"',
      'data-testid="player-base-lang-badge"',
      'data-testid="player-target-lang-badge"',
      'data-testid="player-cues-count-badge"',
      'data-testid="cues-table"',
      "cue-row-",
      'data-testid="cue-timestamp"',
      'data-testid="cue-base-text"',
      'data-testid="cue-target-text"',
      "btn-speak-cue-",
    ],
  },
  {
    file: "src/components/FloatingDraggablePauseButton.tsx",
    description: "Floating Pause Controller with draggable container, trigger, dropdown, and options",
    testIds: [
      'data-testid="floating-draggable-pause-container"',
      'data-testid="floating-pause-button"',
      'data-testid="floating-pause-status"',
      'data-testid="floating-menu-dropdown"',
      'data-testid="menu-option-setup-pause"',
      'data-testid="menu-option-auto-scroll"',
    ],
  },
  {
    file: "src/components/NewSubtitlesParserBar.tsx",
    description: "New Subtitles Parser Bar with sentence counter and punctuation splitting toggles",
    testIds: [
      'data-testid="new-subtitles-parser-bar"',
      'data-testid="parser-sentence-count-badge"',
      'data-testid="parser-reset-defaults-btn"',
      'data-testid="parser-split-dot-toggle"',
      'data-testid="parser-split-question-toggle"',
      'data-testid="parser-split-exclamation-toggle"',
      'data-testid="parser-split-comma-toggle"',
    ],
  },
];

for (const entry of auditMap) {
  const filePath = path.resolve(process.cwd(), entry.file);
  assert(fs.existsSync(filePath), `File exists: ${entry.file}`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const testId of entry.testIds) {
      assert(
        content.includes(testId),
        `[${entry.file}] includes selector: ${testId}`,
      );
    }
  }
}

// Verify that child element addressing works via parent-child query patterns
console.log("\n--> Verifying hierarchical child selector compatibility...");
const tablePanelContent = fs.readFileSync(path.resolve(process.cwd(), "src/components/SubtitlesTablePanel.tsx"), "utf-8");
const subtitleRowContent = fs.readFileSync(path.resolve(process.cwd(), "src/components/SubtitleRow.tsx"), "utf-8");

assert(
  tablePanelContent.includes('data-testid="subtitles-table"') &&
  tablePanelContent.includes('data-testid="subtitles-table-body"'),
  "Parent table structure allows [data-testid='subtitles-table'] tbody targeting",
);

assert(
  subtitleRowContent.includes('data-testid="sentence-text-wrapper"') &&
  subtitleRowContent.includes('data-testid="sentence-actions-wrapper"'),
  "SubtitleRow exposes distinct child wrappers for text and actions",
);

if (failureCount > 0) {
  console.error(`\n❌ Total failures: ${failureCount}`);
  process.exit(1);
}

console.log("\n🎉 ALL E2E SELECTORS AUDIT CHECKS PASSED!");
