import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  TTS_PLAY_HISTORY_STORAGE_KEY,
  clearTtsPlayHistory,
  formatTtsPlayHistoryDebugReport,
  formatVideoTimestampSec,
  getTtsPlayHistorySnapshot,
  recordTtsPlayHistory,
  subscribeToTtsPlayHistory,
} from "../src/utils/ttsPlayHistory";

console.log("=========================================================================");
console.log("🧪 Verifying Task 402: History Stage (TTS-Play History & Reproduction)");
console.log("=========================================================================");

// Mock browser localStorage in Node runtime
const backingStore = new Map<string, string>();
(globalThis as unknown as { window?: unknown }).window = {
  localStorage: {
    getItem: (key: string) => (backingStore.has(key) ? backingStore.get(key)! : null),
    setItem: (key: string, val: string) => {
      backingStore.set(key, String(val));
    },
    removeItem: (key: string) => {
      backingStore.delete(key);
    },
  },
};

clearTtsPlayHistory();
assert.equal(getTtsPlayHistorySnapshot().length, 0, "History must start empty after clear");

let listenerCalls = 0;
const unsubscribe = subscribeToTtsPlayHistory(() => {
  listenerCalls += 1;
});

// 1. Record TTS-play events across different videos, sources, and translations
const first = recordTtsPlayHistory({
  timestamp: Date.UTC(2026, 10, 13, 12, 0, 5),
  videoId: "L2Ryrr6txwA",
  videoTitle: "Interactive Subtitle Sync Demo",
  videoTimeSec: 18.4,
  rowIndex: 2,
  sentence: "Welcome to the language learning adventure.",
  playedText: "ברוכים הבאים להרפתקת לימוד השפה.",
  spokenLang: "he",
  baseLang: "en",
  translationText: "ברוכים הבאים להרפתקת לימוד השפה.",
  translationLang: "he",
  ttsProvider: "lovable:google",
  source: "auto_playback",
});

const second = recordTtsPlayHistory({
  timestamp: Date.UTC(2026, 10, 13, 12, 1, 15),
  videoId: "dQw4w9WgXcQ",
  videoTitle: "Second Study Video",
  videoTimeSec: 65.2,
  rowIndex: 5,
  sentence: "Listen closely to every single word.",
  playedText: "Escucha atentamente cada palabra.",
  spokenLang: "es",
  baseLang: "en",
  translationText: "Escucha atentamente cada palabra.",
  translationLang: "es",
  ttsProvider: "native",
  source: "subtitle_table_cue",
});

assert.equal(listenerCalls, 2, "Subscribers must be notified on each recorded TTS-play event");
const snapshot = getTtsPlayHistorySnapshot();
assert.equal(snapshot.length, 2, "Snapshot must contain both recorded events");
assert.equal(snapshot[0].id, second.id, "Newest event must be first in history order");
assert.equal(snapshot[1].id, first.id, "Older event must follow in descending order");
assert.equal(snapshot[0].videoTimeSec, 65.2);
assert.equal(formatVideoTimestampSec(65.2), "1:05");
assert.equal(snapshot[1].translationLang, "he");
assert.ok(snapshot[1].translationText.includes("ברוכים"));

// Verify persisted localStorage JSON
const storedRaw = backingStore.get(TTS_PLAY_HISTORY_STORAGE_KEY);
assert.ok(storedRaw, "History must persist in localStorage");
const parsed = JSON.parse(storedRaw!);
assert.equal(parsed.length, 2);

// 2. Verify structured Debug & Reproduction report
const allReport = formatTtsPlayHistoryDebugReport(snapshot);
assert.ok(allReport.includes("Scope: All Videos"));
assert.ok(allReport.includes("L2Ryrr6txwA"));
assert.ok(allReport.includes("dQw4w9WgXcQ"));
assert.ok(allReport.includes("Welcome to the language learning adventure."));
assert.ok(allReport.includes("ברוכים הבאים להרפתקת לימוד השפה."));
assert.ok(allReport.includes("lovable:google"));

const scopedReport = formatTtsPlayHistoryDebugReport(snapshot, "L2Ryrr6txwA");
assert.ok(scopedReport.includes("Scoped Video ID: L2Ryrr6txwA"));
assert.ok(scopedReport.includes("L2Ryrr6txwA"));
assert.ok(!scopedReport.includes("dQw4w9WgXcQ"), "Scoped debug report must exclude other videos");

// 3. Clear resets store and notifies listeners
clearTtsPlayHistory();
assert.equal(getTtsPlayHistorySnapshot().length, 0);
assert.equal(backingStore.has(TTS_PLAY_HISTORY_STORAGE_KEY), false);
assert.equal(listenerCalls, 3);
unsubscribe();

console.log("✅ PASS: ttsPlayHistory utility persistence, snapshots, and debug reports verified.");

// 4. Component, Storybook, and Mode Parity wiring checks
const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

const panelSource = read("src/components/TtsPlayHistoryPanel.tsx");
const storiesSource = read("src/components/TtsPlayHistoryPanel.stories.tsx");
const workbenchSource = read("src/storybook/StorybookWorkbench.tsx");
const beginnerFlowSource = read("src/components/beginner/BeginnerFlowContainer.tsx");
const beginnerVideoSource = read("src/components/beginner/tabs/BeginnerVideoTab.tsx");
const indexSource = read("src/routes/index.tsx");

assert.ok(panelSource.includes('data-testid="tts-play-history-panel"'));
assert.ok(panelSource.includes('data-testid="tts-history-copy-report-btn"'));
assert.ok(panelSource.includes('data-testid="tts-history-clear-btn"'));
assert.ok(panelSource.includes('data-testid="tts-history-video-filter-btn"'));
assert.ok(panelSource.includes('data-testid="tts-history-search-input"'));
assert.ok(storiesSource.includes("PopulatedHistory") && storiesSource.includes("EmptyState"));
assert.ok(
  workbenchSource.includes('"tts_history"') && workbenchSource.includes("<TtsPlayHistoryPanel"),
  "StorybookWorkbench must catalog TtsPlayHistoryPanel",
);

// Advanced Stage 6 & Beginner Mode parity
assert.ok(
  indexSource.includes('id="stage-step-history"') &&
    indexSource.includes("setCurrentAccordionStage(6)") &&
    indexSource.includes("currentAccordionStage === 6") &&
    indexSource.includes('data-testid="advanced-history-stage-container"'),
  "Advanced Mode must expose History Stage (Stage 6) with shared TtsPlayHistoryPanel",
);
assert.ok(
  beginnerFlowSource.includes("historyStageSlot") &&
    beginnerVideoSource.includes('data-testid="beginner-history-stage-toggle"') &&
    beginnerVideoSource.includes('data-testid="beginner-history-stage-section"') &&
    indexSource.includes("historyStageSlot={"),
  "Beginner Mode must expose the shared TtsPlayHistoryPanel via historyStageSlot",
);

// All TTS recording call sites must be wired
const recordCallCount = (indexSource.match(/recordTtsPlayHistory\(/g) ?? []).length;
assert.ok(
  recordCallCount >= 4,
  `Expected at least 4 recordTtsPlayHistory call sites in index.tsx (found ${recordCallCount})`,
);
assert.ok(indexSource.includes('source: "subtitle_table_cue"'));
assert.ok(indexSource.includes('source: "learning_or_alternative_view"'));
assert.ok(indexSource.includes('source: "zero_knowledge"'));
assert.ok(indexSource.includes('source: "auto_playback"'));

console.log("✅ PASS: Storybook, Advanced Stage 6, Beginner Mode parity, and all TTS recording hooks verified.");
console.log("=========================================================================");
console.log("🎉 Task 402 History Stage Verification PASSED!");
console.log("=========================================================================");
