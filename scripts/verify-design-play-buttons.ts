import fs from "fs";
import path from "path";

console.log("=========================================================================");
console.log("🧪 Verifying docs/design_play_buttons.md & Unique Play Button Test IDs");
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

// 1. Verify docs/design_play_buttons.md exists
const docPath = path.resolve(process.cwd(), "docs/design_play_buttons.md");
assert(fs.existsSync(docPath), "docs/design_play_buttons.md must exist under docs/");

const docContent = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf-8") : "";

// 2. Verify doc covers key play/pause controls and their testIds
const expectedTestIds = [
  "player-control-play-pause",
  "video-overlay-play-pause-btn",
  "btn-player-play-pause",
  "floating-pause-button",
  "menu-option-setup-pause",
  "btn-speak-cell-",
  "btn-speak-cue-",
  "btn-player-speak-current",
  "test-alternative-tts-btn",
  "btn-test-alternative-tts",
  "library-video-card-play-btn-",
  "play-video-button",
  "btn-load-video",
  "floating-retry-pause-btn",
  "tab-retry-toggle-btn",
];

for (const testId of expectedTestIds) {
  assert(
    docContent.includes(testId),
    `docs/design_play_buttons.md must document testId "${testId}"`,
  );
}

// 3. Verify doc explains Pause for Setup distinction
assert(
  docContent.includes("Pause for Setup") && docContent.includes("freezes"),
  "docs/design_play_buttons.md must explain Pause for Setup freezing video, TTS, and auto-scrolling",
);

// 4. Verify doc explains Android notification 1-click pause
assert(
  docContent.includes("BackgroundAudioService") && docContent.includes("1-Click Pause"),
  "docs/design_play_buttons.md must explain Android notification 1-click pause kill session",
);

// 5. Verify source code files have the unique data-testid attributes
const filesToCheck = [
  {
    file: "src/components/VideoPlaybackControls.tsx",
    expected: ['data-testid="player-control-play-pause"'],
  },
  {
    file: "src/routes/index.tsx",
    expected: [
      'data-testid="video-overlay-play-pause-btn"',
      'data-testid="test-alternative-tts-btn"',
      'data-testid="play-video-button"',
    ],
  },
  {
    file: "src/components/beginner/tabs/BeginnerPlayerTab.tsx",
    expected: [
      'data-testid="btn-player-play-pause"',
      'data-testid="btn-player-speak-current"',
      "btn-speak-cue-",
    ],
  },
  {
    file: "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
    expected: ['data-testid="btn-test-alternative-tts"'],
  },
  {
    file: "src/components/FloatingDraggablePauseButton.tsx",
    expected: [
      'data-testid="floating-pause-button"',
      'data-testid="menu-option-setup-pause"',
    ],
  },
  {
    file: "src/components/SubtitleRow.tsx",
    expected: ["btn-speak-cell-"],
  },
  {
    file: "src/components/VideoLibraryPanel.tsx",
    expected: ["library-video-card-play-btn-"],
  },
  {
    file: "src/components/beginner/tabs/BeginnerVideoTab.tsx",
    expected: ['data-testid="btn-load-video"'],
  },
  {
    file: "src/components/FloatingSubtitleRetryIndicator.tsx",
    expected: ['"floating-retry-pause-btn"', '"floating-retry-resume-btn"'],
  },
  {
    file: "src/components/NotificationsStatusTab.tsx",
    expected: ['data-testid="tab-retry-toggle-btn"'],
  },
];

for (const { file, expected } of filesToCheck) {
  const filePath = path.resolve(process.cwd(), file);
  assert(fs.existsSync(filePath), `Source file ${file} must exist`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const exp of expected) {
      assert(content.includes(exp), `${file} must contain "${exp}"`);
    }
  }
}

// 6. Verify docs/files.md registers design_play_buttons.md
const filesMdPath = path.resolve(process.cwd(), "docs/files.md");
const filesMdContent = fs.readFileSync(filesMdPath, "utf-8");
assert(
  filesMdContent.includes("docs/design_play_buttons.md"),
  "docs/files.md must catalog docs/design_play_buttons.md",
);

// 7. Verify no duplicate markdown files in root
assert(
  !fs.existsSync(path.resolve(process.cwd(), "design_play_buttons.md")),
  "No duplicate design_play_buttons.md in root directory",
);

if (failureCount > 0) {
  console.error(`\n❌ Total failures: ${failureCount}`);
  process.exit(1);
}

console.log("\n🎉 ALL DESIGN PLAY BUTTONS CHECKS PASSED!");
