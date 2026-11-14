import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { splitSentenceHighlightParts } from "../src/utils/listeningGame";

function runUnitAndSourceChecks() {
  console.log(
    "=== Verifying Task 408 (Prompt 197 Ch. 3): Derived Original Sentence & Play Sentence + Translation ===",
  );

  // 1. Unit tests on splitSentenceHighlightParts
  const enParts = splitSentenceHighlightParts(
    "The world connects through music, not worldwide slogans.",
    "world",
  );
  assert.deepEqual(
    enParts.filter((p) => p.isMatch).map((p) => p.text),
    ["world"],
    "Should match whole word 'world' without matching 'worldwide'",
  );
  assert.equal(
    enParts.map((p) => p.text).join(""),
    "The world connects through music, not worldwide slogans.",
    "Joined highlight parts must reconstruct the exact original sentence",
  );

  const ruParts = splitSentenceHighlightParts("Привет, как дела?", "дела");
  assert.deepEqual(
    ruParts.filter((p) => p.isMatch).map((p) => p.text),
    ["дела"],
    "Should highlight Cyrillic word inside source sentence",
  );

  const heParts = splitSentenceHighlightParts("שלום עולם! תרגול מביא התקדמות.", "עולם");
  assert.deepEqual(
    heParts.filter((p) => p.isMatch).map((p) => p.text),
    ["עולם"],
    "Should highlight Hebrew RTL word inside source sentence",
  );

  const specialParts = splitSentenceHighlightParts("Learn C++ basics now.", "C++");
  assert.equal(
    specialParts.map((p) => p.text).join(""),
    "Learn C++ basics now.",
    "Regex metacharacters must never throw",
  );
  console.log("✔ splitSentenceHighlightParts unit checks passed.");

  // 2. Source invariants in ListeningGamePanel.tsx
  const panelSrc = fs.readFileSync(path.resolve("src/components/ListeningGamePanel.tsx"), "utf-8");
  assert.ok(
    panelSrc.includes("splitSentenceHighlightParts") &&
      panelSrc.includes("data-testid={`listening-word-source-sentence-${idx}`}") &&
      panelSrc.includes("data-testid={`listening-play-word-sentence-${idx}`}") &&
      panelSrc.includes("handlePlayWordSentence") &&
      panelSrc.includes("speakSingleEntry(item.sourceSentence, item.sourceTranslation"),
    "ListeningGamePanel must render highlighted item.sourceSentence and wire Play Sentence (+ translation)",
  );
  console.log("✔ Source invariants in ListeningGamePanel.tsx verified.");
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
            }, 15);
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
          }, 15);
          activeTimer = setTimeout(() => {
            if (activeUtterance !== u) return;
            activeUtterance = null;
            mockSynth.speaking = false;
            if (typeof u.onend === "function") u.onend();
          }, 120);
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
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

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
    await page.getByTestId("listening-words-section").waitFor({ state: "visible", timeout: 10000 });

    // Pick card index 1 or 2 where derived sentence differs meaningfully, or index 1 ("дела" inside "Привет, как дела?")
    const cardIdx = (await page.getByTestId("listening-word-item-1").count()) > 0 ? 1 : 0;
    const card = page.getByTestId(`listening-word-item-${cardIdx}`);
    const wordText = ((await card.locator("span.font-bold.text-sm").textContent()) || "").trim();
    assert.ok(wordText.length > 0, "Word title must be present");

    const sourceSentenceEl = page.getByTestId(`listening-word-source-sentence-${cardIdx}`);
    await sourceSentenceEl.waitFor({ state: "visible", timeout: 5000 });
    const sourceSentenceText = ((await sourceSentenceEl.textContent()) || "").trim();
    assert.ok(
      sourceSentenceText.toLowerCase().includes(wordText.toLowerCase()),
      `Source sentence '${sourceSentenceText}' must include derived word '${wordText}'`,
    );

    const markText = ((await sourceSentenceEl.locator("mark").first().textContent()) || "").trim();
    assert.equal(
      markText.toLowerCase(),
      wordText.toLowerCase(),
      `Highlighted <mark> ('${markText}') inside source sentence must match word '${wordText}'`,
    );

    const sourceTransEl = page.getByTestId(`listening-word-translation-${cardIdx}`);
    await sourceTransEl.waitFor({ state: "visible", timeout: 5000 });
    const sourceTransText = ((await sourceTransEl.textContent()) || "").trim();
    assert.ok(sourceTransText.length > 0, "Expected derived sentence translation when With Translations is active");
    console.log(
      `✔ Card #${cardIdx} displays derived sentence '${sourceSentenceText}' (<mark>${markText}</mark>) + translation '${sourceTransText}'.`,
    );

    // Click Play Sentence button on card and verify BOTH sentence and translation play in order
    await page.getByTestId(`listening-play-word-sentence-${cardIdx}`).click();
    await page.waitForFunction(
      () => {
        const log =
          (window as unknown as { __MOCK_SPOKEN_LOG__?: Array<{ text: string }> }).__MOCK_SPOKEN_LOG__ || [];
        return log.length >= 2;
      },
      undefined,
      { timeout: 10000 },
    );

    const spokenLog = await page.evaluate(
      () =>
        (window as unknown as { __MOCK_SPOKEN_LOG__: Array<{ text: string; lang: string }> })
          .__MOCK_SPOKEN_LOG__,
    );
    assert.equal(
      spokenLog[0]?.text.trim(),
      sourceSentenceText,
      `Expected derived sentence '${sourceSentenceText}' spoken first, got ${JSON.stringify(spokenLog)}`,
    );
    assert.equal(
      spokenLog[1]?.text.trim(),
      sourceTransText,
      `Expected derived sentence translation '${sourceTransText}' spoken second, got ${JSON.stringify(spokenLog)}`,
    );
    console.log("✔ Clicking Sentence button played derived original sentence followed by its translation.");

    // Switch to Without Translations: original sentence remains visible; translation hides; Play Sentence plays base only
    await page.getByTestId("listening-without-translations-btn").click();
    assert.equal(await sourceSentenceEl.isVisible(), true);
    assert.equal(await sourceTransEl.count(), 0);
    await page.evaluate(() => {
      (window as unknown as { __MOCK_SPOKEN_LOG__: Array<{ text: string }> }).__MOCK_SPOKEN_LOG__.length = 0;
    });
    await page.getByTestId(`listening-play-word-sentence-${cardIdx}`).click();
    await page.waitForFunction(
      () => {
        const log =
          (window as unknown as { __MOCK_SPOKEN_LOG__?: Array<{ text: string }> }).__MOCK_SPOKEN_LOG__ || [];
        return log.length >= 1;
      },
      undefined,
      { timeout: 10000 },
    );
    await page.waitForTimeout(260);
    const spokenNoTrans = await page.evaluate(
      () => (window as unknown as { __MOCK_SPOKEN_LOG__: Array<{ text: string }> }).__MOCK_SPOKEN_LOG__,
    );
    assert.equal(spokenNoTrans.length, 1, "Without Translations must play original sentence only");
    assert.equal(spokenNoTrans[0]?.text.trim(), sourceSentenceText);

    assert.equal(await page.getByTestId("floating-error-button").count(), 0);
    assert.deepEqual(pageErrors, []);
    const badConsole = consoleErrors.filter(
      (m) => !m.includes("WebSocket") && !m.includes("ws://"),
    );
    assert.deepEqual(badConsole, []);
    console.log("✔ Live Chromium derived sentence display + playback E2E PASSED!");
  } finally {
    await browser.close();
  }
}

async function main() {
  runUnitAndSourceChecks();
  await runChromiumE2E();
  console.log("=== Task 408 Verification PASSED ===");
}

main().catch((err) => {
  console.error("❌ Task 408 verification failed:", err);
  process.exit(1);
});
