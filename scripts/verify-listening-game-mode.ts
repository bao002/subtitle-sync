import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  countSentenceWords,
  countWordLetters,
  extractListeningSentences,
  extractListeningWords,
  splitTextIntoPunctuationSentences,
  type SubtitleRowLike,
} from "../src/utils/listeningGame";

console.log("=== Verifying Task 401: Game Mode — Listening Game (With/Without Translations) ===");

const sampleRows: SubtitleRowLike[] = [
  {
    texts: {
      en: "Hi! Listen closely, and practice.",
      he: "היי! הקשב היטב, ותתרגל.",
    },
  },
  {
    texts: {
      en: "Short phrase here. This is a noticeably longer grammatical sentence with nine words total.",
      he: "ביטוי קצר כאן. זהו משפט דקדוקי ארוך יותר עם תשע מילים.",
    },
  },
  {
    texts: {
      en: "Hello world! Practice makes progress.",
      es: "¡Hola mundo! La práctica hace el progreso.",
      he: "שלום עולם! תרגול מביא התקדמות.",
    },
  },
];

// 1. Verify letter count and minimum letters word extraction
assert.equal(countWordLetters("Hi!"), 2);
assert.equal(countWordLetters("שלום"), 4);
assert.equal(countWordLetters("grammatical"), 11);

const wordsMin2 = extractListeningWords(sampleRows, {
  baseLanguage: "en",
  targetLanguage: "he",
  minLetters: 2,
});
assert.ok(wordsMin2.some((w) => w.word === "Hi"), "minLetters=2 must include 'Hi'");

const wordsMin6 = extractListeningWords(sampleRows, {
  baseLanguage: "en",
  targetLanguage: "he",
  minLetters: 6,
});
assert.ok(!wordsMin6.some((w) => w.word === "Hi"), "minLetters=6 must exclude 'Hi'");
assert.ok(!wordsMin6.some((w) => w.word === "Short"), "minLetters=6 must exclude 5-letter 'Short'");
assert.ok(wordsMin6.some((w) => w.word === "Listen"), "minLetters=6 must include 6-letter 'Listen'");
assert.ok(
  wordsMin6.some((w) => w.word === "grammatical" && w.letterCount === 11),
  "minLetters=6 must include 11-letter 'grammatical'",
);
// Case-insensitive deduplication check ('Practice' appears twice in sampleRows)
const practiceMatches = wordsMin6.filter((w) => w.normalized === "practice");
assert.equal(practiceMatches.length, 1, "Duplicate words should be deduplicated case-insensitively");
console.log("✔ Words extraction respects configurable minLetters filter and deduplicates cleanly.");

// 2. Verify punctuation sentence splitting and max X words filtering
const split = splitTextIntoPunctuationSentences(
  'Wait! Is this "Mr. Smith?" Yes, it works. Very cool!',
);
assert.ok(split.length >= 3, "Splits punctuation boundaries cleanly");
assert.equal(countSentenceWords("Hello world!"), 2);

const sentencesMax3 = extractListeningSentences(sampleRows, {
  baseLanguage: "en",
  targetLanguage: "he",
  maxWords: 3,
});
assert.ok(
  sentencesMax3.some((s) => s.sentence === "Hi!"),
  "maxWords=3 includes 'Hi!' (1 word)",
);
assert.ok(
  sentencesMax3.some((s) => s.sentence === "Short phrase here."),
  "maxWords=3 includes 'Short phrase here.' (3 words)",
);
assert.ok(
  !sentencesMax3.some((s) => s.sentence.includes("grammatical sentence")),
  "maxWords=3 MUST exclude sentences longer than 3 words",
);
assert.equal(
  sentencesMax3.find((s) => s.sentence === "Hi!")?.translation,
  "היי!",
  "Aligned punctuation sentence pairs matching translation sentence",
);

const sentencesMax12 = extractListeningSentences(sampleRows, {
  baseLanguage: "en",
  targetLanguage: "he",
  maxWords: 12,
});
assert.ok(
  sentencesMax12.some((s) => s.sentence.includes("grammatical sentence")),
  "Raising maxWords to 12 includes longer punctuation sentences",
);
console.log("✔ Punctuation sentences extraction respects configurable maxWords (X) filter.");

// 3. Verify component, Storybook, and Advanced/Beginner parity wiring
const panelPath = path.resolve("src/components/ListeningGamePanel.tsx");
const panelSrc = fs.readFileSync(panelPath, "utf-8");
assert.ok(panelSrc.includes('data-testid="listening-with-translations-btn"'));
assert.ok(panelSrc.includes('data-testid="listening-without-translations-btn"'));
assert.ok(panelSrc.includes('data-testid="listening-min-letters-input"'));
assert.ok(panelSrc.includes('data-testid="listening-max-words-input"'));
assert.ok(panelSrc.includes('data-testid="listening-words-list"'));
assert.ok(panelSrc.includes('data-testid="listening-sentences-list"'));
assert.ok(panelSrc.includes('data-testid="listening-play-all-words-btn"'));
assert.ok(panelSrc.includes('data-testid="listening-play-all-sentences-btn"'));

const learningViewPath = path.resolve("src/components/WordBalloonLearningView.tsx");
const learningViewSrc = fs.readFileSync(learningViewPath, "utf-8");
assert.ok(learningViewSrc.includes('"listening_game"'));
assert.ok(learningViewSrc.includes('data-testid="game-mode-listening-game"'));
assert.ok(learningViewSrc.includes("<ListeningGamePanel"));

const panelStoryPath = path.resolve("src/components/ListeningGamePanel.stories.tsx");
assert.ok(fs.existsSync(panelStoryPath), "ListeningGamePanel.stories.tsx must exist (Storybook-first)");
const viewStorySrc = fs.readFileSync(
  path.resolve("src/components/WordBalloonLearningView.stories.tsx"),
  "utf-8",
);
assert.ok(viewStorySrc.includes("export const ListeningGame"));

const workbenchSrc = fs.readFileSync(path.resolve("src/storybook/StorybookWorkbench.tsx"), "utf-8");
assert.ok(workbenchSrc.includes('"listening_game"'));
assert.ok(workbenchSrc.includes("<ListeningGamePanel"));

// Parity: both Beginner and Advanced render WordBalloonLearningView with subtitleRows={rows}
const indexSrc = fs.readFileSync(path.resolve("src/routes/index.tsx"), "utf-8");
const wordBalloonMatches = indexSrc.match(/<WordBalloonLearningView/g) || [];
assert.ok(wordBalloonMatches.length >= 2, "WordBalloonLearningView shared across Beginner & Advanced modes");
const subtitleRowsMatches = indexSrc.match(/subtitleRows=\{rows\}/g) || [];
assert.ok(subtitleRowsMatches.length >= 2, "Both Beginner & Advanced modes pass subtitleRows={rows}");

console.log("✔ UI, Storybook, and Beginner/Advanced parity wiring verified.");
console.log("=== Task 401 Verification PASSED ===");
