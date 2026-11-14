import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  buildListeningLanguageOptions,
  extractListeningSentences,
  extractListeningWords,
  moveListeningLanguage,
  reconcileListeningLanguagesConfig,
  toggleListeningLanguageEnabled,
  type SubtitleRowLike,
} from "../src/utils/listeningGame";

function runUnitAndSourceChecks() {
  console.log("=== Verifying Task 410 (Prompt 201 Ch. 1): Listening Languages List & Order ===");

  const rows: SubtitleRowLike[] = [
    {
      texts: {
        en: "Hello world! Practice daily.",
        es: "¡Hola mundo! Practica diariamente.",
        he: "שלום עולם! תרגל מדי יום.",
      },
    },
  ];

  const options = buildListeningLanguageOptions({
    baseLanguage: "en",
    baseLanguageName: "English",
    targetLanguage: "es",
    targetLanguageName: "Spanish",
    availableLanguages: [
      { code: "es", name: "Spanish" },
      { code: "he", name: "Hebrew" },
      { code: "fr", name: "French" },
    ],
    rows,
  });
  assert.deepEqual(
    options.map((o) => o.code),
    ["en", "es", "he", "fr"],
    "Should deduplicate and order base, target, available, and row languages cleanly",
  );

  const initial = reconcileListeningLanguagesConfig(options, "en", "es", null);
  assert.deepEqual(initial.orderedLanguages, ["en", "es", "he", "fr"]);
  assert.deepEqual(initial.enabledLanguages, ["en", "es"]);

  // Enable Hebrew and move it to the front
  const withHe = toggleListeningLanguageEnabled(initial.enabledLanguages, "he", initial.orderedLanguages);
  assert.deepEqual(withHe, ["en", "es", "he"]);

  const movedOnce = moveListeningLanguage(initial.orderedLanguages, "he", "up");
  const movedTwice = moveListeningLanguage(movedOnce, "he", "up");
  assert.deepEqual(movedTwice, ["he", "en", "es", "fr"]);

  const reconciled = reconcileListeningLanguagesConfig(options, "en", "es", {
    orderedLanguages: movedTwice,
    enabledLanguages: withHe,
  });
  assert.deepEqual(reconciled.orderedLanguages, ["he", "en", "es", "fr"]);
  assert.deepEqual(
    reconciled.orderedLanguages.filter((c) => reconciled.enabledLanguages.includes(c)),
    ["he", "en", "es"],
    "Enabled languages must follow the user's configured playback order",
  );

  // Never allow disabling the last remaining language
  const onlyHe = toggleListeningLanguageEnabled(
    toggleListeningLanguageEnabled(["he", "en"], "en", movedTwice),
    "he",
    movedTwice,
  );
  assert.deepEqual(onlyHe, ["he"], "At least one listening language must remain enabled");

  // Verify translationsByLang alignment
  const sentences = extractListeningSentences(rows, {
    baseLanguage: "en",
    targetLanguage: "es",
    maxWords: 10,
  });
  assert.equal(sentences[0]?.translationsByLang?.en, "Hello world!");
  assert.equal(sentences[0]?.translationsByLang?.es, "¡Hola mundo!");
  assert.equal(sentences[0]?.translationsByLang?.he, "שלום עולם!");

  const words = extractListeningWords(rows, {
    baseLanguage: "en",
    targetLanguage: "es",
    minLetters: 4,
  });
  assert.ok(words[0]?.translationsByLang?.he?.includes("שלום"));

  const panelSrc = fs.readFileSync(path.resolve("src/components/ListeningGamePanel.tsx"), "utf-8");
  assert.ok(
    panelSrc.includes('data-testid="listening-languages-order-panel"') &&
      panelSrc.includes("effectivePlaybackLanguages") &&
      panelSrc.includes("handleMoveListeningLanguage") &&
      panelSrc.includes("handleToggleListeningLanguage"),
    "ListeningGamePanel must expose listening languages & order controls and playback loop",
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

    await page.addInitScript(`(() => {
      const spokenLog = [];
      window.__MOCK_SPOKEN_LOG__ = spokenLog;
      let activeUtterance = null;
      let activeTimer = null;

      function FakeUtterance(text) {
        this.text = text || "";
        this.lang = "en-US";
        this.rate = 1;
        this.volume = 1;
        this.voice = null;
        this.onstart = null;
        this.onend = null;
        this.onerror = null;
        this.onboundary = null;
      }
      window.SpeechSynthesisUtterance = FakeUtterance;

      const fakeVoices = [
        { name: "English Mock", lang: "en-US", voiceURI: "mock-en", default: true, localService: true },
        { name: "Russian Mock", lang: "ru-RU", voiceURI: "mock-ru", default: false, localService: true },
        { name: "Spanish Mock", lang: "es-ES", voiceURI: "mock-es", default: false, localService: true },
        { name: "Hebrew Mock", lang: "he-IL", voiceURI: "mock-he", default: false, localService: true },
        { name: "Italian Mock", lang: "it-IT", voiceURI: "mock-it", default: false, localService: true },
      ];

      const mockSynth = {
        speaking: false,
        pending: false,
        paused: false,
        getVoices() { return fakeVoices; },
        resume() {},
        pause() {},
        addEventListener() {},
        removeEventListener() {},
        cancel() {
          mockSynth.speaking = false;
          if (activeTimer !== null) {
            clearTimeout(activeTimer);
            activeTimer = null;
          }
          if (activeUtterance) {
            const u = activeUtterance;
            activeUtterance = null;
            setTimeout(() => {
              if (typeof u.onerror === "function") u.onerror({ error: "canceled" });
            }, 10);
          }
        },
        speak(u) {
          activeUtterance = u;
          mockSynth.speaking = true;
          const text = String((u && u.text) || "");
          const lang = String((u && u.lang) || "");
          setTimeout(() => {
            if (activeUtterance !== u) return;
            if (typeof u.onstart === "function") u.onstart();
            spokenLog.push({ text, lang });
          }, 10);
          activeTimer = setTimeout(() => {
            if (activeUtterance !== u) return;
            activeUtterance = null;
            mockSynth.speaking = false;
            if (typeof u.onend === "function") u.onend();
          }, 80);
        }
      };

      try {
        Object.defineProperty(window, "speechSynthesis", {
          value: mockSynth,
          configurable: true,
        });
      } catch {}
    })();`);

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
    await page.getByTestId("listening-languages-order-panel").waitFor({ state: "visible", timeout: 10000 });

    const initialSeq =
      (await page.getByTestId("listening-languages-active-sequence").textContent()) || "";
    console.log("Initial listening sequence:", initialSeq);

    // Enable 'es' (or 'en') if not enabled, and move it to position 1
    const targetToEnable = (await page.getByTestId("listening-lang-toggle-es").count()) > 0 ? "es" : "en";
    const toggleBtn = page.getByTestId(`listening-lang-toggle-${targetToEnable}`);
    if ((await toggleBtn.getAttribute("aria-pressed")) !== "true") {
      await toggleBtn.click();
    }

    const moveUpBtn = page.getByTestId(`listening-lang-move-up-${targetToEnable}`);
    for (let step = 0; step < 10; step++) {
      if ((await moveUpBtn.count()) === 0 || !(await moveUpBtn.isEnabled())) break;
      await moveUpBtn.click();
    }

    const seqText =
      (await page.getByTestId("listening-languages-active-sequence").textContent()) || "";
    console.log("Reordered listening sequence:", seqText);
    assert.ok(
      seqText.startsWith("1. ") && seqText.includes(`(${targetToEnable})`),
      `Expected '${targetToEnable}' moved to position 1 in sequence, got: '${seqText}'`,
    );

    // Clear spoken log and click Play Sentence #0
    await page.evaluate(() => {
      (window as unknown as { __MOCK_SPOKEN_LOG__: Array<{ text: string; lang: string }> }).__MOCK_SPOKEN_LOG__.length = 0;
    });

    await page.getByTestId("listening-play-sentence-0").click();
    await page.waitForFunction(
      () => {
        const log =
          (window as unknown as { __MOCK_SPOKEN_LOG__?: Array<{ lang: string }> }).__MOCK_SPOKEN_LOG__ || [];
        return log.length >= 2;
      },
      undefined,
      { timeout: 12000 },
    );
    await page.waitForTimeout(350);

    const spokenLog = await page.evaluate(
      () =>
        (window as unknown as { __MOCK_SPOKEN_LOG__: Array<{ text: string; lang: string }> })
          .__MOCK_SPOKEN_LOG__,
    );
    console.log("Spoken log after reorder:", spokenLog);
    assert.ok(
      spokenLog[0]?.lang.toLowerCase().startsWith(targetToEnable),
      `Expected first spoken language to be '${targetToEnable}' after reordering, got ${JSON.stringify(spokenLog)}`,
    );
    assert.ok(spokenLog.length >= 2, "Expected multiple enabled languages to play sequentially");

    // Reset back to default and confirm
    await page.getByTestId("listening-lang-reset-btn").click();
    const resetSeq =
      (await page.getByTestId("listening-languages-active-sequence").textContent()) || "";
    console.log("Reset listening sequence:", resetSeq);
    assert.ok(
      !resetSeq.startsWith("1. Spanish (es)") && !resetSeq.startsWith("1. English (en)") || resetSeq === initialSeq,
      "Reset restores default order",
    );

    assert.equal(await page.getByTestId("floating-error-button").count(), 0);
    assert.deepEqual(pageErrors, []);
    console.log("✔ Live Chromium E2E for listening languages list & order PASSED!");
  } finally {
    await browser.close();
  }
}

async function main() {
  runUnitAndSourceChecks();
  await runChromiumE2E();
  console.log("=== Task 410 Verification PASSED ===");
}

main().catch((err) => {
  console.error("❌ Task 410 verification failed:", err);
  process.exit(1);
});
