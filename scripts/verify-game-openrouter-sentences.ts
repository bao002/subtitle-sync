import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  OPENROUTER_SENTENCE_BATCH_SIZE,
  OPENROUTER_PREFETCH_REMAINING_THRESHOLD,
  extractTargetWordsToLearn,
  shouldPrefetchNextSentenceBatch,
  buildTargetWordSentencesPrompt,
  parseGeneratedSentencesResponse,
  generateNextTargetWordSentencesBatch,
} from "../src/utils/openRouterSentenceGenerator";

console.log("=========================================================================");
console.log("🧪 Verifying Task 419: Game & OpenRouter Target-Word Sentence Generation (X=5)");
console.log("=========================================================================");

// 1. Validate X=5 batch size & target word extraction from subtitle rows
assert.strictEqual(OPENROUTER_SENTENCE_BATCH_SIZE, 5, "Batch size X must equal 5");
assert.strictEqual(
  OPENROUTER_PREFETCH_REMAINING_THRESHOLD,
  1,
  "Prefetch threshold must trigger near end of batch",
);

const sampleRows = [
  {
    texts: {
      en: "Daily focus helps you master every difficult language faster.",
      he: "מיקוד יומי עוזר לך לשלוט בכל שפה קשה מהר יותר.",
    },
  },
  {
    texts: {
      en: "Consistent practice builds clear memory over time.",
      he: "תרגול עקבי בונה זיכרון ברור לאורך זמן.",
    },
  },
];

const targetWords = extractTargetWordsToLearn(sampleRows, {
  baseLanguage: "en",
  targetLanguage: "he",
  minLetters: 4,
});
assert.ok(targetWords.some((w) => w.normalized === "focus"));
assert.ok(targetWords.some((w) => w.normalized === "practice"));
assert.ok(targetWords.some((w) => w.normalized === "memory"));
console.log("✅ PASS: X=5 batch constant & subtitle target-word extraction verified.");

// 2. Validate on-demand prefetch logic
assert.strictEqual(
  shouldPrefetchNextSentenceBatch(0, 5, false),
  false,
  "Should not prefetch on item 1 of 5",
);
assert.strictEqual(
  shouldPrefetchNextSentenceBatch(2, 5, false),
  false,
  "Should not prefetch on item 3 of 5",
);
assert.strictEqual(
  shouldPrefetchNextSentenceBatch(3, 5, false),
  true,
  "Must trigger on-demand next-5 prefetch when 1 sentence remains (item 4 of 5)",
);
assert.strictEqual(
  shouldPrefetchNextSentenceBatch(4, 5, false),
  true,
  "Must trigger on-demand next-5 prefetch at final sentence (item 5 of 5)",
);
assert.strictEqual(
  shouldPrefetchNextSentenceBatch(4, 5, true),
  false,
  "Must not fire duplicate concurrent prefetch while already loading",
);
console.log("✅ PASS: On-demand next-5 prefetch threshold logic verified.");

// 3. Validate prompt construction & JSON parsing + exclusion deduplication
const prompt = buildTargetWordSentencesPrompt({
  targetWords: ["focus", "practice", "memory"],
  baseLanguageName: "English",
  targetLanguageName: "Hebrew",
  excludeSentences: ["Old sentence using focus."],
});
assert.ok(prompt.includes("exactly 5"), "Prompt must request exactly 5 sentences");
assert.ok(prompt.includes("focus, practice, memory"), "Prompt must include target words");
assert.ok(prompt.includes("Old sentence using focus."), "Prompt must exclude previous sentences");

const rawAiResponse = `\`\`\`json
[
  {"targetWord": "focus", "sentence": "Old sentence using focus.", "translation": "דופליקציה."},
  {"targetWord": "focus", "sentence": "Keep your focus steady during reading.", "translation": "שמור על מיקוד יציב בזמן הקריאה."},
  {"targetWord": "practice", "sentence": "Short practice daily grows fluency.", "translation": "תרגול קצר יומי מגדיל שטף."},
  {"targetWord": "memory", "sentence": "Fresh context locks words in memory.", "translation": "הקשר חדש נועל מילים בזיכרון."},
  {"targetWord": "focus", "sentence": "Morning focus makes hard grammar easier.", "translation": "מיקוד בוקר מקל על דקדוק קשה."},
  {"targetWord": "practice", "sentence": "Speak aloud as active speaking practice.", "translation": "דבר בקול כתרגול דיבור פעיל."},
  {"targetWord": "memory", "sentence": "Extra sixth item must respect batch cap.", "translation": "פריט שישי."}
]
\`\`\``;

const parsedBatch = parseGeneratedSentencesResponse(rawAiResponse, {
  targetWords: ["focus", "practice", "memory"],
  batchIndex: 2,
  excludeSentences: ["Old sentence using focus."],
  expectedCount: 5,
});
assert.strictEqual(parsedBatch.length, 5, "Must parse 5 unique sentences (cap=5 & deduped)");
assert.ok(
  !parsedBatch.some((s) => s.sentence === "Old sentence using focus."),
  "Must filter excluded duplicate sentence",
);
console.log("✅ PASS: Prompt generation & deduplicated 5-sentence parser verified.");

// 4. Validate API invocation with OpenRouter key + model -> batch #1 + batch #2 (10 total)
const originalFetch = globalThis.fetch;
let apiCallCount = 0;
let lastBodyModel = "";
let lastAuthHeader = "";

(globalThis as unknown as { fetch: typeof fetch }).fetch = (async (
  _url: RequestInfo | URL,
  init?: RequestInit,
) => {
  apiCallCount++;
  const parsedBody = JSON.parse(String(init?.body || "{}")) as { model?: string };
  lastBodyModel = parsedBody.model || "";
  const hdrs = (init?.headers || {}) as Record<string, string>;
  lastAuthHeader = hdrs["Authorization"] || "";

  const batchItems = Array.from({ length: 5 }, (_, i) => ({
    targetWord: ["focus", "practice", "memory", "focus", "practice"][i],
    sentence: `Generated batch ${apiCallCount} sentence ${i + 1} with focus.`,
    translation: `משפט ${apiCallCount}-${i + 1}.`,
  }));

  return {
    ok: true,
    json: async () => ({
      model: lastBodyModel,
      choices: [{ message: { content: JSON.stringify(batchItems) } }],
    }),
  } as Response;
}) as typeof fetch;

const batch1 = await generateNextTargetWordSentencesBatch({
  targetWords: ["focus", "practice", "memory"],
  baseLanguage: "en",
  baseLanguageName: "English",
  targetLanguage: "he",
  targetLanguageName: "Hebrew",
  batchIndex: 1,
  apiKey: "sk-or-v1-game-test-419",
  model: "openrouter/auto:free",
});
assert.strictEqual(batch1.sentences.length, 5);
assert.strictEqual(lastAuthHeader, "Bearer sk-or-v1-game-test-419");
assert.strictEqual(lastBodyModel, "openrouter/auto:free");

const batch2 = await generateNextTargetWordSentencesBatch({
  targetWords: ["focus", "practice", "memory"],
  baseLanguage: "en",
  baseLanguageName: "English",
  targetLanguage: "he",
  targetLanguageName: "Hebrew",
  batchIndex: 2,
  excludeSentences: batch1.sentences.map((s) => s.sentence),
  apiKey: "sk-or-v1-game-test-419",
  model: "openrouter/auto:free",
});
globalThis.fetch = originalFetch;

assert.strictEqual(batch2.sentences.length, 5);
assert.strictEqual(apiCallCount, 2);
console.log("✅ PASS: On-demand Batch #1 & Next-5 Batch #2 generation verified.");

// 5. Verify Storybook-first integration + shared WordBalloonLearningView parity
const root = process.cwd();
const gamePanelContent = fs.readFileSync(
  path.join(root, "src/components/OpenRouterSentenceGamePanel.tsx"),
  "utf8",
);
const workbenchContent = fs.readFileSync(
  path.join(root, "src/storybook/StorybookWorkbench.tsx"),
  "utf8",
);
const learningViewContent = fs.readFileSync(
  path.join(root, "src/components/WordBalloonLearningView.tsx"),
  "utf8",
);
const storyExists = fs.existsSync(
  path.join(root, "src/components/OpenRouterSentenceGamePanel.stories.tsx"),
);

assert.ok(storyExists, "OpenRouterSentenceGamePanel.stories.tsx must exist");
assert.ok(
  workbenchContent.includes("<OpenRouterSentenceGamePanel") &&
    workbenchContent.includes('"openrouter_sentence_game"'),
  "StorybookWorkbench must register openrouter_sentence_game",
);
assert.ok(
  learningViewContent.includes("openrouter_sentences") &&
    learningViewContent.includes("<OpenRouterSentenceGamePanel") &&
    learningViewContent.includes('data-testid="game-mode-openrouter-sentences"') &&
    learningViewContent.includes('data-testid="wizard-card-openrouter-sentences"'),
  "WordBalloonLearningView (shared across Advanced & Beginner) must integrate OpenRouterSentenceGamePanel",
);
for (const tid of [
  "openrouter-sentence-game-panel",
  "ai-game-fetch-next-batch-btn",
  "ai-game-next-btn",
  "ai-game-prev-btn",
  "ai-game-sentence-card",
  "ai-game-target-words-list",
]) {
  assert.ok(
    gamePanelContent.includes(`data-testid="${tid}"`),
    `OpenRouterSentenceGamePanel must expose data-testid="${tid}"`,
  );
}
console.log("✅ PASS: Storybook story, Workbench tab, and shared Game view integration verified.");

console.log("=========================================================================");
console.log("🎉 Task 419 Game & OpenRouter Target-Word Sentences Verification PASSED!");
console.log("=========================================================================");
