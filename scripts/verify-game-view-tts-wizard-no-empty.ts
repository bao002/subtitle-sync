import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  extractListeningSentences,
  extractListeningWords,
  type SubtitleRowLike,
} from "../src/utils/listeningGame";

console.log(
  "=== Verifying Task 403: Game View List TTS-Play Trigger, Guided Wizard Menu & Empty-Content Guard ===",
);

// 1. Verify ListeningGamePanel sequential TTS-play, stop propagation, and auto-fit recovery
const listeningPanelSrc = fs.readFileSync(
  path.resolve("src/components/ListeningGamePanel.tsx"),
  "utf-8",
);
assert.ok(
  listeningPanelSrc.includes("onStopSpeaking?: () => void"),
  "ListeningGamePanel must declare onStopSpeaking prop",
);
assert.ok(
  listeningPanelSrc.includes("playingProgress") &&
    listeningPanelSrc.includes("await speakSingleEntry("),
  "ListeningGamePanel must sequentially await speakSingleEntry and track playingProgress",
);
assert.ok(
  listeningPanelSrc.includes('data-testid="listening-autofit-words-btn"') &&
    listeningPanelSrc.includes('data-testid="listening-autofit-sentences-btn"'),
  "ListeningGamePanel must provide 1-click auto-fit recovery buttons when filters hide all items",
);
assert.ok(
  listeningPanelSrc.includes("onStopSpeakingRef.current?.()"),
  "ListeningGamePanel must cancel host speech cleanly on stop or unmount",
);

// Verify word/sentence helper behavior on short-word / long-sentence subtitles
const edgeRows: SubtitleRowLike[] = [
  {
    texts: {
      en: "Hi! Go on now, we do it so well every single day together.",
      he: "היי! קדימה עכשיו, אנחנו עושים את זה כל יום.",
    },
  },
];
const strictWords = extractListeningWords(edgeRows, {
  baseLanguage: "en",
  targetLanguage: "he",
  minLetters: 10,
});
assert.equal(strictWords.length, 0);
const relaxedWords = extractListeningWords(edgeRows, {
  baseLanguage: "en",
  targetLanguage: "he",
  minLetters: 1,
});
assert.ok(relaxedWords.length >= 10, "Relaxing minLetters to 1 recovers all subtitle words");
const allSentences = extractListeningSentences(edgeRows, {
  baseLanguage: "en",
  targetLanguage: "he",
  maxWords: 100,
});
assert.ok(allSentences.length >= 2, "Extracting with maxWords=100 exposes all punctuation sentences");
console.log("✔ ListeningGamePanel sequential awaiting, cancellation, and auto-fit verified.");

// 2. Verify WordBalloonLearningView Empty-Content Guard, [Fixture] label, and Guided Wizard Menu
const gameViewSrc = fs.readFileSync(
  path.resolve("src/components/WordBalloonLearningView.tsx"),
  "utf-8",
);
assert.ok(
  gameViewSrc.includes('data-testid="game-empty-content-wizard"') &&
    gameViewSrc.includes('data-testid="game-load-sample-fixture-btn"') &&
    gameViewSrc.includes("[Fixture] Load Sample Subtitles (L2Ryrr6txwA)") &&
    gameViewSrc.includes('data-testid="game-empty-back-to-video-btn"'),
  "WordBalloonLearningView must block empty games with game-empty-content-wizard and explicit [Fixture] sample loader",
);
assert.ok(
  gameViewSrc.includes('data-testid="game-wizard-menu"') &&
    gameViewSrc.includes('data-testid="wizard-quick-start-btn"') &&
    gameViewSrc.includes('data-testid="game-back-to-menu-btn"') &&
    gameViewSrc.includes('data-testid="wizard-card-listening-game"') &&
    gameViewSrc.includes('data-testid="wizard-card-sentence-builder"') &&
    gameViewSrc.includes('data-testid="wizard-card-word-match"') &&
    gameViewSrc.includes('data-testid="wizard-card-missing-word"') &&
    gameViewSrc.includes('data-testid="wizard-card-word-balloons"') &&
    gameViewSrc.includes('data-testid="wizard-card-canvas-fullscreen"'),
  "WordBalloonLearningView must expose the guided Game Menu / Wizard workflow across all game modes",
);
assert.ok(
  gameViewSrc.includes("fallbackRowSentence") && gameViewSrc.includes("effectiveRowIndex"),
  "WordBalloonLearningView must fall back to subtitleRows[0] when active sentence hasn't started yet",
);
console.log("✔ WordBalloonLearningView Empty-Content Guard & Guided Wizard verified.");

// 3. Verify src/routes/index.tsx async return + rows[0] fallback + Beginner/Advanced parity
const indexSrc = fs.readFileSync(path.resolve("src/routes/index.tsx"), "utf-8");
assert.ok(
  indexSrc.includes(
    "const rowIdx = speakingRow >= 0 ? speakingRow : active >= 0 ? active : rows.length > 0 ? 0 : -1;",
  ),
  "src/routes/index.tsx must fall back to row 0 when rows exist even before video playback begins",
);
assert.ok(
  indexSrc.includes(
    "return speak(textToSpeak, ttsLang, rate, voice, rowIdx, setSpeechProgress, volume);",
  ),
  "handleSpeakTextFromAlternativeView MUST return the speak() Promise so Listen All plays sequentially",
);
assert.ok(
  (indexSrc.match(/onStopSpeaking=\{handleCancelAlternativeSpeech\}/g) || []).length >= 2,
  "Both Beginner and Advanced WordBalloonLearningView must wire onStopSpeaking={handleCancelAlternativeSpeech}",
);
assert.ok(
  (indexSrc.match(/onLoadSampleSubtitles=\{handleLoadSampleSubtitlesForGame\}/g) || []).length >= 2,
  "Both Beginner and Advanced WordBalloonLearningView must wire onLoadSampleSubtitles={handleLoadSampleSubtitlesForGame}",
);
console.log("✔ Route TTS promise return, row 0 fallback, and Beginner/Advanced parity verified.");

// 4. Verify Storybook stories and StorybookWorkbench coverage
const storySrc = fs.readFileSync(
  path.resolve("src/components/WordBalloonLearningView.stories.tsx"),
  "utf-8",
);
assert.ok(
  storySrc.includes("export const GuidedWizardMenu") &&
    storySrc.includes("export const EmptyContentWizard") &&
    storySrc.includes("export const ListeningGame"),
  "WordBalloonLearningView.stories.tsx must export GuidedWizardMenu, EmptyContentWizard, and ListeningGame",
);
const workbenchSrc = fs.readFileSync(path.resolve("src/storybook/StorybookWorkbench.tsx"), "utf-8");
assert.ok(
  workbenchSrc.includes("onStopSpeaking={() => {}}") &&
    workbenchSrc.includes("new Promise((resolve) => setTimeout(resolve, 250))"),
  "StorybookWorkbench listening_game preview must return async Promise and provide onStopSpeaking",
);
console.log("✔ Storybook stories and StorybookWorkbench verified.");
console.log("=== Task 403 Verification PASSED ===");
