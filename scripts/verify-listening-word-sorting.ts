import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  extractListeningWords,
  sortListeningWords,
  type SubtitleRowLike,
} from "../src/utils/listeningGame";

function runUnitAndSourceChecks() {
  console.log("=== Verifying Task 411 (Prompt 201 Ch. 2): Listening Word Sorting ===");

  const rows: SubtitleRowLike[] = [
    {
      texts: {
        en: "Zebra walks",
        es: "La cebra camina",
      },
    },
    {
      texts: {
        en: "Elephant gracefully wanders through savannas today",
        es: "El elefante camina con gracia por las sabanas hoy",
      },
    },
    {
      texts: {
        en: "Ant runs fast",
        es: "La hormiga corre rápido",
      },
    },
  ];

  const words = extractListeningWords(rows, {
    baseLanguage: "en",
    targetLanguage: "es",
    minLetters: 3,
  });

  const ant = words.find((w) => w.word === "Ant");
  const zebra = words.find((w) => w.word === "Zebra");
  const elephant = words.find((w) => w.word === "Elephant");
  assert.ok(ant && zebra && elephant, "Expected Ant, Zebra, and Elephant to be extracted");
  assert.equal(zebra.sourceSentenceWordCount, 2);
  assert.equal(ant.sourceSentenceWordCount, 3);
  assert.equal(elephant.sourceSentenceWordCount, 6);

  // 1. Default order (asc & desc)
  const defaultAsc = sortListeningWords(words, "default", "asc");
  assert.deepEqual(
    defaultAsc.map((w) => w.word),
    words.map((w) => w.word),
  );
  const defaultDesc = sortListeningWords(words, "default", "desc");
  assert.deepEqual(
    defaultDesc.map((w) => w.word),
    [...words].reverse().map((w) => w.word),
  );

  // 2. Alphabet (asc & desc)
  const alphaAsc = sortListeningWords(words, "alphabet", "asc", "en");
  assert.equal(alphaAsc[0]?.word, "Ant");
  assert.equal(alphaAsc[alphaAsc.length - 1]?.word, "Zebra");

  const alphaDesc = sortListeningWords(words, "alphabet", "desc", "en");
  assert.equal(alphaDesc[0]?.word, "Zebra");
  assert.equal(alphaDesc[alphaDesc.length - 1]?.word, "Ant");

  // 3. Word size (asc & desc)
  const sizeAsc = sortListeningWords(words, "word_size", "asc", "en");
  for (let i = 1; i < sizeAsc.length; i++) {
    assert.ok(
      sizeAsc[i - 1].letterCount <= sizeAsc[i].letterCount,
      "word_size asc must sort by ascending letterCount",
    );
  }
  const sizeDesc = sortListeningWords(words, "word_size", "desc", "en");
  assert.equal(
    sizeDesc[0]?.word,
    "gracefully",
    "Longest word should appear first in word_size desc",
  );

  // 4. Sentence length in number of words (asc & desc)
  const sentAsc = sortListeningWords(words, "sentence_length", "asc", "en");
  for (let i = 1; i < sentAsc.length; i++) {
    assert.ok(
      sentAsc[i - 1].sourceSentenceWordCount <= sentAsc[i].sourceSentenceWordCount,
      "sentence_length asc must sort by ascending sourceSentenceWordCount",
    );
  }
  assert.equal(sentAsc[0]?.sourceSentenceWordCount, 2);
  assert.equal(sentAsc[sentAsc.length - 1]?.sourceSentenceWordCount, 6);

  const sentDesc = sortListeningWords(words, "sentence_length", "desc", "en");
  assert.equal(sentDesc[0]?.sourceSentenceWordCount, 6);
  assert.equal(sentDesc[sentDesc.length - 1]?.sourceSentenceWordCount, 2);

  const panelSrc = fs.readFileSync(path.resolve("src/components/ListeningGamePanel.tsx"), "utf-8");
  assert.ok(
    panelSrc.includes('data-testid="listening-words-sort-select"') &&
      panelSrc.includes('data-testid="listening-words-sort-direction-btn"') &&
      panelSrc.includes("sortListeningWords(") &&
      panelSrc.includes("sortedWords"),
    "ListeningGamePanel must expose sort controls and render/play sortedWords",
  );
  assert.ok(
    !panelSrc.includes("letterCount} letters"),
    "Word card must not re-introduce 'X letters' badge (Task 406 invariant)",
  );

  console.log("✔ Unit and source checks passed.");
}

async function runChromiumE2E() {
  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  let serverUp = false;
  try {
    const res = await fetch(baseUrl, { signal: AbortSignal.timeout(2500) });
    serverUp = res.ok;
  } catch {
    serverUp = false;
  }
  if (!serverUp) {
    console.log(`ℹ Skipping live Chromium E2E because ${baseUrl} is not reachable.`);
    return;
  }

  const knownHeadlessPath =
    "/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell";
  const executablePath = fs.existsSync(knownHeadlessPath) ? knownHeadlessPath : undefined;

  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded", timeout: 25000 });

    const stageLearningBtn = page.getByTestId("stage-step-learning");
    if ((await stageLearningBtn.count()) > 0) {
      await stageLearningBtn.click();
    }
    await page.waitForSelector("#word-balloon-learning-view", { timeout: 15000 });

    const loadFixtureBtn = page.getByTestId("game-load-sample-fixture-btn");
    if ((await loadFixtureBtn.count()) > 0) {
      await loadFixtureBtn.click();
    }

    await page.getByTestId("wizard-quick-start-btn").waitFor({ state: "visible", timeout: 10000 });
    await page.getByTestId("wizard-quick-start-btn").click();
    await page
      .getByTestId("listening-words-sort-select")
      .waitFor({ state: "visible", timeout: 10000 });

    const readDisplayedWords = async () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-testid^="listening-word-item-"]')).map(
          (el) => ({
            word: el.getAttribute("data-word-item") || "",
            wcText:
              el.querySelector('[data-testid^="listening-word-sentence-wordcount-"]')
                ?.textContent || "",
          }),
        ),
      );

    const activeLocale = await page.evaluate(() => {
      const card = document.querySelector('[data-testid="balloon-base-sentence-card"]');
      const txt = card?.textContent || "";
      const match = txt.match(/\(([a-zA-Z-]+)\)/);
      return match ? match[1] : undefined;
    });

    // 1. Sort by Alphabet (Asc)
    await page.getByTestId("listening-words-sort-select").selectOption("alphabet");
    const alphaAscWords = await readDisplayedWords();
    assert.ok(alphaAscWords.length >= 5, "Expected multiple words in fixture");
    for (let i = 1; i < Math.min(alphaAscWords.length, 15); i++) {
      assert.ok(
        alphaAscWords[i - 1].word.localeCompare(alphaAscWords[i].word, activeLocale, {
          sensitivity: "base",
        }) <= 0,
        `Expected alphabetical asc (${activeLocale || "default"}) at index ${i}: ${alphaAscWords[i - 1].word} <= ${alphaAscWords[i].word}`,
      );
    }

    // Toggle to Desc
    await page.getByTestId("listening-words-sort-direction-btn").click();
    const alphaDescWords = await readDisplayedWords();
    for (let i = 1; i < Math.min(alphaDescWords.length, 15); i++) {
      assert.ok(
        alphaDescWords[i - 1].word.localeCompare(alphaDescWords[i].word, activeLocale, {
          sensitivity: "base",
        }) >= 0,
        `Expected alphabetical desc (${activeLocale || "default"}) at index ${i}: ${alphaDescWords[i - 1].word} >= ${alphaDescWords[i].word}`,
      );
    }
    assert.notEqual(
      alphaDescWords[0].word,
      alphaAscWords[0].word,
      "Expected Desc first word to differ from Asc first word",
    );

    // Toggle back to Asc for remaining checks
    await page.getByTestId("listening-words-sort-direction-btn").click();

    // 2. Sort by Word Size (Asc & Desc)
    await page.getByTestId("listening-words-sort-select").selectOption("word_size");
    const sizeAscWords = await readDisplayedWords();
    const letterCount = (w: string) =>
      (w.match(/\p{L}/gu) || w.match(/[\p{L}\p{N}]/gu) || []).length;
    for (let i = 1; i < Math.min(sizeAscWords.length, 15); i++) {
      assert.ok(
        letterCount(sizeAscWords[i - 1].word) <= letterCount(sizeAscWords[i].word),
        `Expected word size asc: ${sizeAscWords[i - 1].word} <= ${sizeAscWords[i].word}`,
      );
    }

    await page.getByTestId("listening-words-sort-direction-btn").click();
    const sizeDescWords = await readDisplayedWords();
    assert.ok(
      letterCount(sizeDescWords[0].word) >= letterCount(sizeAscWords[0].word),
      "Expected longest word first when word_size is descending",
    );

    // 3. Sort by Sentence Length (words count)
    await page.getByTestId("listening-words-sort-select").selectOption("sentence_length");
    const sentDescWords = await readDisplayedWords();
    const parseWc = (s: string) => parseInt(s.replace(/\D+/g, ""), 10) || 0;
    for (let i = 1; i < Math.min(sentDescWords.length, 15); i++) {
      assert.ok(
        parseWc(sentDescWords[i - 1].wcText) >= parseWc(sentDescWords[i].wcText),
        `Expected sentence word count desc: ${sentDescWords[i - 1].wcText} >= ${sentDescWords[i].wcText}`,
      );
    }

    await page.getByTestId("listening-words-sort-direction-btn").click();
    const sentAscWords = await readDisplayedWords();
    for (let i = 1; i < Math.min(sentAscWords.length, 15); i++) {
      assert.ok(
        parseWc(sentAscWords[i - 1].wcText) <= parseWc(sentAscWords[i].wcText),
        `Expected sentence word count asc: ${sentAscWords[i - 1].wcText} <= ${sentAscWords[i].wcText}`,
      );
    }

    assert.equal(await page.getByTestId("floating-error-button").count(), 0);
    assert.deepEqual(pageErrors, []);
    console.log("✔ Live Chromium E2E for listening word sorting PASSED!");
  } finally {
    await browser.close();
  }
}

async function main() {
  runUnitAndSourceChecks();
  await runChromiumE2E();
  console.log("=== Task 411 Verification PASSED ===");
}

main().catch((err) => {
  console.error("❌ Task 411 verification failed:", err);
  process.exit(1);
});
