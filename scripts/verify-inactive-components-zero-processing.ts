/**
 * Verification Script: scripts/verify-inactive-components-zero-processing.ts
 *
 * Verifies Task 391 (Prompt 167):
 * "optimize application ensure every component which isnt being shown is not consuming proccessing (mv app logic to services, enure components are pure)."
 *
 * Checks:
 * 1. Dedicated componentOptimizationService.ts exists and provides pure service methods.
 * 2. Pure component memoization across all core UI components (SubtitlesTablePanel, BottomLogViewer,
 *    AlternativeVideoPlayerView, LanguageBoxesSelector, LanguageRatioCompositionSelector, SpecialCharactersRemovalPanel,
 *    VideoPlaybackControls, VideoPlaybackPrecedenceBar, TtsServiceSettingsPanel, AttemptOrderSettings,
 *    FloatingDraggablePauseButton, FloatingSubtitleRetryIndicator, LearningGoalsFiltersPanel,
 *    LearningGoalAccordion, AccordionSection, BeginnerFlowContainer).
 * 3. Inactive/hidden zero-processing gates:
 *    - BottomLogViewer skips log filtering when collapsed or hidden (filterLogEntriesOptimized).
 *    - FloatingSubtitleRetryIndicator stops countdown and fetch scheduling when isVisible is false.
 *    - CanvasBalloonGame uses createVisibilitySafeAnimationLoop halting 60 FPS animation when tab is hidden or unmounted.
 *    - Modals & debug inspectors in src/routes/index.tsx are conditionally unmounted when closed.
 *    - YouTube player interval pauses coordination when in game mode or paused.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  filterSubtitleRowsByCriteria,
  filterLogEntriesOptimized,
  tokenizeSentenceToWordTokens,
  shouldComponentProcess,
} from "../src/utils/componentOptimizationService.ts";
import { type Row } from "../src/lib/subtitles.ts";
import { type LogEntry } from "../src/utils/logBuffer.ts";

async function main() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Task 391: Inactive Components Zero-Processing & Pure Services");
  console.log("=========================================================================");

  const root = path.resolve(".");

  // 1. Check componentOptimizationService logic
  console.log("--> [Check 1] Verifying componentOptimizationService logic...");
  assert.equal(typeof filterSubtitleRowsByCriteria, "function", "filterSubtitleRowsByCriteria must be exported");
  assert.equal(typeof filterLogEntriesOptimized, "function", "filterLogEntriesOptimized must be exported");
  assert.equal(typeof tokenizeSentenceToWordTokens, "function", "tokenizeSentenceToWordTokens must be exported");
  assert.equal(typeof shouldComponentProcess, "function", "shouldComponentProcess must be exported");

  const sampleRows: Row[] = [
    { start: 0, end: 1000, text: "Short sentence.", texts: { en: "Short sentence." } },
    { start: 1000, end: 3000, text: "This is a much longer sentence that contains many words.", texts: { en: "This is a much longer sentence that contains many words." } },
    { start: 3000, end: 4000, text: "Incomplete fragment without punctuation", texts: { en: "Incomplete fragment without punctuation" } },
  ];

  // Test max words filtering
  const maxWordsFiltered = filterSubtitleRowsByCriteria(sampleRows, "en", 4, false);
  assert.equal(maxWordsFiltered.length, 2, "Should filter out rows exceeding 4 words");
  assert.equal(maxWordsFiltered[0]?.text, "Short sentence.");

  // Test incomplete sentence filtering
  const completeOnlyFiltered = filterSubtitleRowsByCriteria(sampleRows, "en", undefined, true);
  assert.equal(completeOnlyFiltered.length, 2, "Should filter out incomplete sentence fragment");

  // Test log entries optimization: when collapsed, must return 0 entries
  const sampleLogs: LogEntry[] = [
    { id: "1", timestamp: 1000, level: "INFO", message: "Info message" },
    { id: "2", timestamp: 1010, level: "ACTION", message: "User click action" },
    { id: "3", timestamp: 1020, level: "ERROR", message: "Failed request error" },
  ];
  const collapsedLogs = filterLogEntriesOptimized(sampleLogs, "ALL", false);
  assert.deepEqual(collapsedLogs, [], "Collapsed log viewer must return empty array to consume 0 processing");

  const expandedLogs = filterLogEntriesOptimized(sampleLogs, "ACTIONS_ERRORS", true);
  assert.equal(expandedLogs.length, 2, "Expanded viewer filters actions and errors correctly");

  // Test word tokenization
  const tokens = tokenizeSentenceToWordTokens("Hello beautiful world!");
  assert.equal(tokens.length, 3, "Should extract 3 word tokens");
  assert.equal(tokens[0]?.word, "Hello");
  assert.equal(tokens[1]?.word, "beautiful");
  console.log("✅ PASS: componentOptimizationService pure functions verified successfully.");

  // 2. Check pure component memoization across components
  console.log("--> [Check 2] Verifying pure component memoization across UI codebase...");
  const componentsToVerify = [
    { file: "src/components/SubtitlesTablePanel.tsx", name: "SubtitlesTablePanel" },
    { file: "src/components/BottomLogViewer.tsx", name: "BottomLogViewer" },
    { file: "src/components/AlternativeVideoPlayerView.tsx", name: "AlternativeVideoPlayerView" },
    { file: "src/components/LanguageBoxesSelector.tsx", name: "LanguageBoxesSelector" },
    { file: "src/components/LanguageRatioCompositionSelector.tsx", name: "LanguageRatioCompositionSelector" },
    { file: "src/components/SpecialCharactersRemovalPanel.tsx", name: "SpecialCharactersRemovalPanel" },
    { file: "src/components/VideoPlaybackControls.tsx", name: "VideoPlaybackControls" },
    { file: "src/components/VideoPlaybackPrecedenceBar.tsx", name: "VideoPlaybackPrecedenceBar" },
    { file: "src/components/TtsServiceSettingsPanel.tsx", name: "TtsServiceSettingsPanel" },
    { file: "src/components/AttemptOrderSettings.tsx", name: "AttemptOrderSettings" },
    { file: "src/components/FloatingDraggablePauseButton.tsx", name: "FloatingDraggablePauseButton" },
    { file: "src/components/FloatingSubtitleRetryIndicator.tsx", name: "FloatingSubtitleRetryIndicator" },
    { file: "src/components/shared/LearningGoalsFiltersPanel.tsx", name: "LearningGoalsFiltersPanel" },
    { file: "src/components/LearningGoalAccordion.tsx", name: "LearningGoalAccordion" },
    { file: "src/components/AccordionSection.tsx", name: "AccordionSection" },
    { file: "src/components/beginner/BeginnerFlowContainer.tsx", name: "BeginnerFlowContainer" },
  ];

  for (const { file, name } of componentsToVerify) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `${file} must exist`);
    const content = fs.readFileSync(fullPath, "utf8");
    const hasMemo = content.includes("memo(") || content.includes("React.memo(");
    assert.ok(hasMemo, `${name} in ${file} must be wrapped in memo / React.memo to ensure pure component behavior`);
    console.log(`  ✓ ${name} in ${file} is pure and memoized.`);
  }
  console.log("✅ PASS: All target UI components are pure and memoized.");

  // 3. Check zero-processing gates for inactive/hidden components
  console.log("--> [Check 3] Verifying inactive and hidden zero-processing gates...");
  const indexTsxPath = path.join(root, "src/routes/index.tsx");
  const indexTsx = fs.readFileSync(indexTsxPath, "utf8");

  // Check BottomLogViewer isVisible prop passed
  assert.ok(
    indexTsx.includes("<BottomLogViewer isVisible={showBottomLogViewer} />"),
    "index.tsx must pass isVisible={showBottomLogViewer} to BottomLogViewer",
  );

  // Check FloatingSubtitleRetryIndicator isVisible prop passed
  assert.ok(
    indexTsx.includes("isVisible={showAutoFetchSubtitles}"),
    "index.tsx must pass isVisible={showAutoFetchSubtitles} to FloatingSubtitleRetryIndicator",
  );

  // Check FloatingSubtitleRetryIndicator pauses countdown when isVisible is false
  const retryIndicatorPath = path.join(root, "src/components/FloatingSubtitleRetryIndicator.tsx");
  const retryIndicatorContent = fs.readFileSync(retryIndicatorPath, "utf8");
  assert.ok(
    retryIndicatorContent.includes("!isVisible || isPaused || isFetching"),
    "FloatingSubtitleRetryIndicator must clear timers and return when isVisible is false",
  );

  // Check CanvasBalloonGame uses createVisibilitySafeAnimationLoop
  const canvasGamePath = path.join(root, "src/components/CanvasBalloonGame.tsx");
  const canvasGameContent = fs.readFileSync(canvasGamePath, "utf8");
  assert.ok(
    canvasGameContent.includes("createVisibilitySafeAnimationLoop"),
    "CanvasBalloonGame must use createVisibilitySafeAnimationLoop to pause rendering when tab/element is hidden",
  );
  assert.ok(
    canvasGameContent.includes("loop.stop()"),
    "CanvasBalloonGame must call loop.stop() on unmount",
  );

  // Check conditional mounting of modals in index.tsx
  assert.ok(
    indexTsx.includes("networkInspectorOpen && (") || indexTsx.includes("networkInspectorOpen &&\n"),
    "NetworkRequestsInspector must only mount when networkInspectorOpen is true",
  );
  assert.ok(
    indexTsx.includes("actionLogsOpen && (") || indexTsx.includes("actionLogsOpen &&\n"),
    "StateMachineActionLogsInspector must only mount when actionLogsOpen is true",
  );
  assert.ok(
    indexTsx.includes("urlModalLang !== null && ("),
    "LanguageSubtitleUrlModal must only mount when urlModalLang is not null",
  );
  assert.ok(
    indexTsx.includes("apkModalOpen &&"),
    "ApkReleaseModal must only mount when apkModalOpen is true",
  );
  assert.ok(
    indexTsx.includes("shareModalOpen && ("),
    "ShareStateModal must only mount when shareModalOpen is true",
  );
  assert.ok(
    indexTsx.includes("isSettingsBackupModalOpen && ("),
    "SettingsBackupModal must only mount when isSettingsBackupModalOpen is true",
  );
  assert.ok(
    indexTsx.includes("videoMetadataModalOpen && ("),
    "VideoMetadataModal must only mount when videoMetadataModalOpen is true",
  );

  // Check player interval pause logic in index.tsx
  assert.ok(
    indexTsx.includes("showWordBalloonLearningViewRef.current"),
    "Player interval must check showWordBalloonLearningViewRef.current to avoid CPU consumption during game mode",
  );
  assert.ok(
    indexTsx.includes("!curPlaying && !speakingLangRef.current && !busy.current"),
    "Player interval must return early when video is paused and speech is inactive",
  );

  console.log("✅ PASS: Inactive and hidden components zero-processing gates verified.");

  console.log("=========================================================================");
  console.log("🎉 ALL TASK 391 VERIFICATION CHECKS PASSED!");
  console.log("=========================================================================");
}

main().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
