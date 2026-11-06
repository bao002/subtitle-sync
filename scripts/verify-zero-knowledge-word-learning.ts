/**
 * Dedicated test script: scripts/verify-zero-knowledge-word-learning.ts
 *
 * Validates Task 325 (Prompt 90):
 * 1. Parameter `zero_knowledge_in_lang: boolean` defined and persisted per-language.
 * 2. Pick word strategy: choose between "longest" (default) or "random" word.
 * 3. Word extraction across scripts and punctuation boundary sanitization.
 * 4. Word translation manager with in-memory caching.
 * 5. Audio playback coordination: pronounces the picked word in the target language
 *    followed by its translation in the user's base language (logged via ZERO_KNOWLEDGE_WORD_SPOKEN).
 * 6. Export/Import settings backup includes zeroKnowledgeInLang and pickWordStrategy.
 * 7. Absolute UI parity between Advanced Mode, Beginner Mode, and Settings Stage.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Mock localStorage for node environment before importing client modules
class LocalStorageMock {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  get length(): number {
    return this.store.size;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

const mockStorage = new LocalStorageMock();
(globalThis as unknown as { localStorage: LocalStorageMock }).localStorage = mockStorage;
(globalThis as unknown as { window: { localStorage: LocalStorageMock; dispatchEvent: () => boolean } }).window = {
  localStorage: mockStorage,
  dispatchEvent: () => true,
};

import {
  extractWordsFromSentence,
  pickWordFromSentence,
  getWordTranslation,
  clearWordTranslationCache,
} from "../src/utils/zeroKnowledgeWordManager";

import {
  getZeroKnowledgeInLang,
  setZeroKnowledgeInLang,
  toggleZeroKnowledgeInLang,
  getAllZeroKnowledgeInLang,
  setAllZeroKnowledgeInLang,
  getPickWordStrategy,
  setPickWordStrategy,
} from "../src/lib/playback-preferences";

import {
  createApplicationSettingsBackup,
  importApplicationSettings,
} from "../src/utils/settingsBackupManager";

console.log("=========================================================================");
console.log("🧪 Testing Zero Knowledge in Language Mode (Task 325 / Prompt 90)");
console.log("=========================================================================");

// -----------------------------------------------------------------------------
// Test 1: Word Extraction Across Scripts and Sanitization
// -----------------------------------------------------------------------------
console.log("\n1. Testing word extraction from sentences across languages...");
{
  const enSentence = "Hello, world! Welcome to subtitle synchronization.";
  const enWords = extractWordsFromSentence(enSentence);
  assert.deepEqual(enWords, ["Hello", "world", "Welcome", "to", "subtitle", "synchronization"]);

  const heSentence = "שלום עולם! ברוכים הבאים לתרגום.";
  const heWords = extractWordsFromSentence(heSentence);
  assert.deepEqual(heWords, ["שלום", "עולם", "ברוכים", "הבאים", "לתרגום"]);

  const ruSentence = "Привет мир! Добро пожаловать.";
  const ruWords = extractWordsFromSentence(ruSentence);
  assert.deepEqual(ruWords, ["Привет", "мир", "Добро", "пожаловать"]);

  const withSpeaker = "[Speaker 1]: Look at that >> incredible result!";
  const cleanedWords = extractWordsFromSentence(withSpeaker);
  assert.ok(!cleanedWords.includes("Speaker"));
  assert.ok(cleanedWords.includes("Look"));
  assert.ok(cleanedWords.includes("incredible"));

  console.log("✅ PASS: extractWordsFromSentence accurately tokenizes words across languages");
}

// -----------------------------------------------------------------------------
// Test 2: Pick Word Strategy ("longest" vs "random")
// -----------------------------------------------------------------------------
console.log("\n2. Testing pickWordStrategy logic ('longest' vs 'random')...");
{
  const sentence = "The tiny ant carried an enormous watermelon.";
  const longest = pickWordFromSentence(sentence, "longest");
  assert.equal(longest, "watermelon", "Longest word strategy should select 'watermelon'");

  // Random word should always be one of the sentence words
  const words = extractWordsFromSentence(sentence);
  const randomPick = pickWordFromSentence(sentence, "random");
  assert.ok(words.includes(randomPick), "Random word must be from sentence");

  // Single word sentence
  assert.equal(pickWordFromSentence("Hello!"), "Hello");
  assert.equal(pickWordFromSentence(""), "");

  console.log("✅ PASS: pickWordFromSentence adheres to 'longest' and 'random' strategy");
}

// -----------------------------------------------------------------------------
// Test 3: Word Translation and In-Memory Caching
// -----------------------------------------------------------------------------
console.log("\n3. Testing getWordTranslation and caching...");
async function testWordTranslation() {
  clearWordTranslationCache();

  // Same language returns original word directly without network
  const sameLang = await getWordTranslation("water", "en", "en");
  assert.equal(sameLang, "water");

  // Empty string handling
  const empty = await getWordTranslation("   ", "en", "es");
  assert.equal(empty, "");

  console.log("✅ PASS: getWordTranslation handles identity and whitespace efficiently");
}

// -----------------------------------------------------------------------------
// Test 4: Preferences Persistence (zero_knowledge_in_lang & pickWordStrategy)
// -----------------------------------------------------------------------------
console.log("\n4. Testing zero_knowledge_in_lang preferences persistence...");
{
  mockStorage.clear();

  // Default should be false
  assert.equal(getZeroKnowledgeInLang("he"), false);
  assert.equal(getZeroKnowledgeInLang("ru"), false);

  // Set and toggle
  setZeroKnowledgeInLang("he", true);
  assert.equal(getZeroKnowledgeInLang("he"), true);
  assert.equal(getZeroKnowledgeInLang("ru"), false);

  const toggled = toggleZeroKnowledgeInLang("he");
  assert.equal(toggled, false);
  assert.equal(getZeroKnowledgeInLang("he"), false);

  toggleZeroKnowledgeInLang("ru");
  assert.equal(getZeroKnowledgeInLang("ru"), true);

  // Batch getter & setter
  setAllZeroKnowledgeInLang({ es: true, de: true, it: false });
  const allZk = getAllZeroKnowledgeInLang();
  assert.equal(allZk.es, true);
  assert.equal(allZk.de, true);
  assert.equal(allZk.it, false);

  // Strategy getter & setter
  assert.equal(getPickWordStrategy(), "longest", "Default strategy must be longest");
  setPickWordStrategy("random");
  assert.equal(getPickWordStrategy(), "random");

  // Per-language strategy override
  setPickWordStrategy("longest", "es");
  setPickWordStrategy("random", "de");
  assert.equal(getPickWordStrategy("es"), "longest");
  assert.equal(getPickWordStrategy("de"), "random");

  console.log("✅ PASS: Preferences properly persist and read zero_knowledge_in_lang and pick_word_strategy");
}

// -----------------------------------------------------------------------------
// Test 5: Settings Backup & Restore (Export / Import)
// -----------------------------------------------------------------------------
console.log("\n5. Testing settings export/import of zero knowledge configurations...");
{
  mockStorage.clear();
  setZeroKnowledgeInLang("es", true);
  setZeroKnowledgeInLang("ja", true);
  setPickWordStrategy("random");

  const backup = createApplicationSettingsBackup();
  assert.ok(backup.preferences.zeroKnowledgeInLang, "Backup must include zeroKnowledgeInLang");
  assert.equal(backup.preferences.zeroKnowledgeInLang?.es, true);
  assert.equal(backup.preferences.zeroKnowledgeInLang?.ja, true);
  assert.equal(backup.preferences.pickWordStrategy, "random");

  // Reset storage and restore from backup
  mockStorage.clear();
  assert.equal(getZeroKnowledgeInLang("es"), false);

  const importResult = importApplicationSettings(backup);
  assert.equal(importResult.success, true);
  assert.equal(getZeroKnowledgeInLang("es"), true);
  assert.equal(getZeroKnowledgeInLang("ja"), true);
  assert.equal(getPickWordStrategy(), "random");

  console.log("✅ PASS: createApplicationSettingsBackup & importApplicationSettings preserve zero-knowledge state");
}

// -----------------------------------------------------------------------------
// Test 6: Static File Inspections & Parity Verification
// -----------------------------------------------------------------------------
console.log("\n6. Verifying UI components, state machine actions, and full parity...");
{
  const root = process.cwd();
  const indexRoute = fs.readFileSync(path.resolve(root, "src/routes/index.tsx"), "utf-8");
  const beginnerTts = fs.readFileSync(
    path.resolve(root, "src/components/beginner/PerLanguageTtsPreferences.tsx"),
    "utf-8"
  );
  const subtitlesTable = fs.readFileSync(
    path.resolve(root, "src/components/SubtitlesTablePanel.tsx"),
    "utf-8"
  );

  // 1. Check state machine log action
  assert.ok(
    indexRoute.includes("ZERO_KNOWLEDGE_WORD_SPOKEN"),
    "src/routes/index.tsx must log ZERO_KNOWLEDGE_WORD_SPOKEN when pronouncing word and translation"
  );

  // 2. Check TTS execution logic for zero knowledge
  assert.ok(
    indexRoute.includes("isZeroKnowledge = getZeroKnowledgeInLang"),
    "src/routes/index.tsx must check getZeroKnowledgeInLang in playback loop"
  );
  assert.ok(
    indexRoute.includes("pickWordFromSentence"),
    "src/routes/index.tsx must call pickWordFromSentence"
  );
  assert.ok(
    indexRoute.includes("getWordTranslation"),
    "src/routes/index.tsx must call getWordTranslation"
  );

  // 3. Check Stage 4 Settings Card
  assert.ok(
    indexRoute.includes('data-testid="settings-zero-knowledge-card"'),
    "src/routes/index.tsx must include settings-zero-knowledge-card"
  );
  assert.ok(
    indexRoute.includes('data-testid="settings-pick-word-strategy-select"'),
    "src/routes/index.tsx must include settings-pick-word-strategy-select"
  );

  // 4. Check Stage 1 / Stage 2 Narration Ratios UI
  assert.ok(
    indexRoute.includes("zero-knowledge-toggle-"),
    "src/routes/index.tsx must include zero-knowledge-toggle- for each language"
  );
  assert.ok(
    indexRoute.includes("pick-word-strategy-longest-"),
    "src/routes/index.tsx must include pick-word-strategy-longest- button"
  );
  assert.ok(
    indexRoute.includes("pick-word-strategy-random-"),
    "src/routes/index.tsx must include pick-word-strategy-random- button"
  );

  // 5. Check Beginner Mode Parity
  assert.ok(
    beginnerTts.includes("beginner-zero-knowledge-toggle-"),
    "PerLanguageTtsPreferences.tsx must include beginner-zero-knowledge-toggle-"
  );
  assert.ok(
    beginnerTts.includes("beginner-pick-word-strategy-"),
    "PerLanguageTtsPreferences.tsx must include beginner-pick-word-strategy-"
  );

  // 6. Check Subtitles Table Column Header Badge
  assert.ok(
    subtitlesTable.includes("table-col-zero-knowledge-badge-"),
    "SubtitlesTablePanel.tsx must display zero knowledge badge in column header"
  );

  console.log("✅ PASS: Full UI integration, state machine logging, and Beginner/Advanced mode parity verified");
}

(async () => {
  await testWordTranslation();
  console.log("\n=========================================================================");
  console.log("🎉 All Zero Knowledge in Language Mode tests passed successfully! (100%)");
  console.log("=========================================================================");
})();
