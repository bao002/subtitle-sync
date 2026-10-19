/**
 * Verification test for Task 145: Ensure TTS-Play Functionality & Seamless Bidirectional Mode Switching.
 *
 * Validates:
 * 1. Mode Switcher Header: Renders Beginner and Advanced mode options with data-testid selectors.
 * 2. Header Quick Toggle: Main app header includes 1-click mode toggle (data-testid="header-mode-toggle").
 * 3. BeginnerTabNav: Includes direct "Advanced Studio" button (data-testid="nav-switch-to-advanced").
 * 4. Zero duplicate headers in Advanced mode view.
 * 5. On-Demand TTS in Beginner Player: Cues and header expose speak buttons (btn-player-speak-current, btn-speak-cue-*).
 * 6. On-Demand TTS in Subtitles Table: Table rows expose speak buttons (btn-speak-cell-*).
 * 7. State synchronization across modes: callbacks wired between BeginnerFlowContainer and playback state.
 * 8. Speech synthesis safety timeout and fallback mechanism.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("==================================================================");
console.log("🧪 Running Task 145: TTS-Play & Seamless Mode Switching Verification");
console.log("==================================================================");

const rootDir = process.cwd();
const indexPath = path.join(rootDir, "src/routes/index.tsx");
const modeSwitcherPath = path.join(rootDir, "src/components/ModeSwitcherHeader.tsx");
const beginnerNavPath = path.join(rootDir, "src/components/beginner/BeginnerTabNav.tsx");
const beginnerContainerPath = path.join(rootDir, "src/components/beginner/BeginnerFlowContainer.tsx");
const beginnerPlayerPath = path.join(rootDir, "src/components/beginner/tabs/BeginnerPlayerTab.tsx");
const subtitleRowPath = path.join(rootDir, "src/components/SubtitleRow.tsx");
const subtitleTablePath = path.join(rootDir, "src/components/SubtitlesTablePanel.tsx");

// 1. Verify ModeSwitcherHeader component exists and contains mode buttons
console.log("Test 1: Verifying ModeSwitcherHeader controls...");
assert(fs.existsSync(modeSwitcherPath), "ModeSwitcherHeader.tsx must exist");
const modeSwitcherContent = fs.readFileSync(modeSwitcherPath, "utf8");
assert(
  modeSwitcherContent.includes('data-testid="mode-switcher-header"'),
  "ModeSwitcherHeader must have data-testid='mode-switcher-header'",
);
assert(
  modeSwitcherContent.includes('data-testid="btn-mode-beginner"'),
  "ModeSwitcherHeader must have data-testid='btn-mode-beginner'",
);
assert(
  modeSwitcherContent.includes('data-testid="btn-mode-expert"'),
  "ModeSwitcherHeader must have data-testid='btn-mode-expert'",
);
assert(
  modeSwitcherContent.includes('data-testid="mode-badge"'),
  "ModeSwitcherHeader must have data-testid='mode-badge'",
);
console.log("✅ PASS: ModeSwitcherHeader has all required controls and testids.");

// 2. Verify 1-Click Header Mode Toggle
console.log("Test 2: Verifying 1-click header-mode-toggle in index.tsx...");
assert(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf8");
assert(
  indexContent.includes('data-testid="header-mode-toggle"'),
  "Main header must contain data-testid='header-mode-toggle' for effortless 1-click mode switching",
);
console.log("✅ PASS: Main header contains 1-click header-mode-toggle button.");

// 3. Verify BeginnerTabNav has quick switch to Advanced Studio
console.log("Test 3: Verifying BeginnerTabNav has quick switch to Advanced Studio...");
assert(fs.existsSync(beginnerNavPath), "BeginnerTabNav.tsx must exist");
const beginnerNavContent = fs.readFileSync(beginnerNavPath, "utf8");
assert(
  beginnerNavContent.includes('data-testid="nav-switch-to-advanced"'),
  "BeginnerTabNav must include data-testid='nav-switch-to-advanced'",
);
assert(
  beginnerNavContent.includes("onSwitchToAdvanced"),
  "BeginnerTabNav must support onSwitchToAdvanced callback",
);
console.log("✅ PASS: BeginnerTabNav includes direct 1-click Advanced Studio button.");

// 4. Verify Zero Duplicate Headers in Expert Mode
console.log("Test 4: Verifying zero duplicate headers in Expert mode...");
const headerMatches = indexContent.match(/<header\b/g);
assert(
  headerMatches && headerMatches.length === 1,
  `There must be exactly ONE <header> element rendered in index.tsx, found ${headerMatches?.length}`,
);
console.log("✅ PASS: Exactly one header element exists in index.tsx (no duplicates).");

// 5. Verify On-Demand TTS in Beginner Player Tab
console.log("Test 5: Verifying On-Demand TTS controls in BeginnerPlayerTab...");
assert(fs.existsSync(beginnerPlayerPath), "BeginnerPlayerTab.tsx must exist");
const playerContent = fs.readFileSync(beginnerPlayerPath, "utf8");
assert(
  playerContent.includes('data-testid="btn-player-speak-current"'),
  "BeginnerPlayerTab must include 'btn-player-speak-current' button in playback controls",
);
assert(
  playerContent.includes("data-testid={`btn-speak-cue-${idx}`}") ||
    playerContent.includes('data-testid={`btn-speak-cue-${idx}`}'),
  "BeginnerPlayerTab must include per-cue speak buttons with data-testid='btn-speak-cue-${idx}'",
);
assert(
  playerContent.includes("onSpeakCue"),
  "BeginnerPlayerTab must accept and invoke onSpeakCue callback",
);
console.log("✅ PASS: BeginnerPlayerTab includes header and per-cue TTS speak buttons.");

// 6. Verify On-Demand TTS in Subtitles Table Panel and Row
console.log("Test 6: Verifying On-Demand TTS in Subtitles Table...");
assert(fs.existsSync(subtitleRowPath), "SubtitleRow.tsx must exist");
const rowContent = fs.readFileSync(subtitleRowPath, "utf8");
assert(
  rowContent.includes("data-testid={`btn-speak-cell-${actualIndex}-${l.code}`}"),
  "SubtitleRow must include data-testid='btn-speak-cell-${actualIndex}-${l.code}'",
);
assert(
  rowContent.includes("onSpeakCue"),
  "SubtitleRow must accept onSpeakCue",
);

assert(fs.existsSync(subtitleTablePath), "SubtitlesTablePanel.tsx must exist");
const tableContent = fs.readFileSync(subtitleTablePath, "utf8");
assert(
  tableContent.includes("onSpeakCue"),
  "SubtitlesTablePanel must accept and pass onSpeakCue",
);
console.log("✅ PASS: Subtitles Table Panel & SubtitleRow expose on-demand TTS speak buttons.");

// 7. Verify State Synchronization across Beginner and Advanced Modes
console.log("Test 7: Verifying bidirectional state synchronization...");
assert(fs.existsSync(beginnerContainerPath), "BeginnerFlowContainer.tsx must exist");
const containerContent = fs.readFileSync(beginnerContainerPath, "utf8");

assert(
  containerContent.includes("onOrderChange"),
  "BeginnerFlowContainer must support onOrderChange",
);
assert(
  containerContent.includes("onTtsSpeedChange"),
  "BeginnerFlowContainer must support onTtsSpeedChange",
);
assert(
  containerContent.includes("onTtsVoiceChange"),
  "BeginnerFlowContainer must support onTtsVoiceChange",
);
assert(
  containerContent.includes("onSubtitlesRatioChange"),
  "BeginnerFlowContainer must support onSubtitlesRatioChange",
);
assert(
  containerContent.includes("onFavoriteLanguagesChange"),
  "BeginnerFlowContainer must support onFavoriteLanguagesChange",
);
assert(
  containerContent.includes("onBaseLangChange"),
  "BeginnerFlowContainer must support onBaseLangChange",
);
assert(
  containerContent.includes("onSpeakCue"),
  "BeginnerFlowContainer must support onSpeakCue",
);

// Verify index.tsx wires these callbacks to state
assert(
  indexContent.includes("onOrderChange={(newOrder) =>"),
  "index.tsx must wire onOrderChange to sectionOrderState and saveSectionOrder",
);
assert(
  indexContent.includes("onTtsSpeedChange={(newSpeed) =>"),
  "index.tsx must wire onTtsSpeedChange to rates",
);
assert(
  indexContent.includes("onSubtitlesRatioChange={(ratio) =>"),
  "index.tsx must wire onSubtitlesRatioChange to ttsRatios",
);
assert(
  indexContent.includes("onFavoriteLanguagesChange={(newFavs) =>"),
  "index.tsx must wire onFavoriteLanguagesChange to handleUpdateFavoriteLanguages",
);
assert(
  indexContent.includes("onBaseLangChange={(lang) =>"),
  "index.tsx must wire onBaseLangChange to spoken",
);
console.log("✅ PASS: State callbacks are completely wired between modes.");

// 8. Verify Speech Synthesis Reliability & getEligibleLangs Fallback
console.log("Test 8: Verifying Speech Synthesis reliability and getEligibleLangs fallback...");
assert(
  indexContent.includes("safetyTimer = setTimeout("),
  "speakText must include safetyTimer to prevent browser speech synthesis deadlocks",
);
assert(
  indexContent.includes("clearTimeout(safetyTimer)"),
  "speakText must clear safetyTimer upon completion",
);
assert(
  indexContent.includes("spoken.length === 0 && orderedLangs.length > 0"),
  "getEligibleLangs must fallback to available loaded subtitles when spoken list is empty",
);
console.log("✅ PASS: Speech synthesis safety timer and getEligibleLangs fallback verified.");

console.log("==================================================================");
console.log("🎉 Task 145: TTS-Play & Seamless Mode Switching PASSED successfully!");
console.log("==================================================================");
