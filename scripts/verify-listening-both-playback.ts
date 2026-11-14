import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

function runSourceChecks() {
  console.log(
    "=== Verifying Task 413 (Prompt 201 Ch. 4): Both Lists Triggers Words + Sentences Playback ===",
  );

  const panelSrc = fs.readFileSync(path.resolve("src/components/ListeningGamePanel.tsx"), "utf-8");
  assert.ok(
    panelSrc.includes("handlePlayAllBoth") &&
      panelSrc.includes('data-testid="listening-list-both-tab"') &&
      panelSrc.includes('data-testid="listening-play-all-both-btn"') &&
      panelSrc.includes("speakWordEntry(item, runId)") &&
      panelSrc.includes("item.sourceSentence") &&
      panelSrc.includes("unlockTtsAudioPlayback()"),
    "ListeningGamePanel must implement handlePlayAllBoth playing words and their source sentences and trigger it on clicking Both",
  );
  console.log("✔ Source checks passed.");
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
          }, 55);
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
    await page.getByTestId("listening-list-both-tab").waitFor({ state: "visible", timeout: 10000 });

    // Switch to Without Translations first so base word & base derived sentence are crystal clear
    await page.getByTestId("listening-without-translations-btn").click();

    const cardPairs = await page.evaluate(() =>
      [0, 1].map((idx) => {
        const card = document.querySelector(`[data-testid="listening-word-item-${idx}"]`);
        const word = card?.getAttribute("data-word-item") || "";
        const sent = document.querySelector(
          `[data-testid="listening-word-source-sentence-${idx}"]`,
        );
        const sentence = (sent?.textContent || "").trim();
        return { word, sentence };
      }),
    );
    assert.ok(cardPairs[0].word.length > 0, "Expected word text on card 0");
    assert.ok(cardPairs[0].sentence.length > 0, "Expected derived sentence on card 0");
    assert.ok(cardPairs[1].word.length > 0, "Expected word text on card 1");
    assert.ok(cardPairs[1].sentence.length > 0, "Expected derived sentence on card 1");

    // Clear spoken log and click the "Both Lists" button (`listening-list-both-tab`)
    await page.evaluate(() => {
      (
        window as unknown as { __MOCK_SPOKEN_LOG__: Array<{ text: string; lang: string }> }
      ).__MOCK_SPOKEN_LOG__.length = 0;
    });

    await page.getByTestId("listening-list-both-tab").click();

    // Wait for at least 4 utterances (word #0 + sentence #0 + word #1 + sentence #1)
    await page.waitForFunction(
      () =>
        ((window as unknown as { __MOCK_SPOKEN_LOG__?: unknown[] }).__MOCK_SPOKEN_LOG__ || [])
          .length >= 4,
      undefined,
      { timeout: 15000 },
    );

    const playBothBtnText =
      (await page.getByTestId("listening-play-all-both-btn").textContent()) || "";
    assert.ok(
      playBothBtnText.includes("Stop Both"),
      `Expected 'Stop Both' indicator while Both playback is active, got '${playBothBtnText}'`,
    );

    const spokenLog = await page.evaluate(
      () =>
        (window as unknown as { __MOCK_SPOKEN_LOG__: Array<{ text: string; lang: string }> })
          .__MOCK_SPOKEN_LOG__,
    );
    console.log("Spoken log triggered by clicking Both:", spokenLog);
    assert.equal(
      spokenLog[0]?.text,
      cardPairs[0].word,
      `Utterance 0 must be word 0 '${cardPairs[0].word}', got '${spokenLog[0]?.text}'`,
    );
    assert.equal(
      spokenLog[1]?.text,
      cardPairs[0].sentence,
      `Utterance 1 must be sentence 0 '${cardPairs[0].sentence}', got '${spokenLog[1]?.text}'`,
    );
    assert.equal(
      spokenLog[2]?.text,
      cardPairs[1].word,
      `Utterance 2 must be word 1 '${cardPairs[1].word}', got '${spokenLog[2]?.text}'`,
    );
    assert.equal(
      spokenLog[3]?.text,
      cardPairs[1].sentence,
      `Utterance 3 must be sentence 1 '${cardPairs[1].sentence}', got '${spokenLog[3]?.text}'`,
    );

    // Clicking "Both Lists" again stops playback cleanly
    await page.getByTestId("listening-list-both-tab").click();
    await page.waitForTimeout(150);
    const stoppedBtnText =
      (await page.getByTestId("listening-play-all-both-btn").textContent()) || "";
    assert.ok(
      stoppedBtnText.includes("Listen Both"),
      `Clicking Both again should toggle playback off cleanly, got '${stoppedBtnText}'`,
    );

    assert.equal(await page.getByTestId("floating-error-button").count(), 0);
    assert.deepEqual(pageErrors, []);
    console.log("✔ Live Chromium E2E for Both words + sentences playback PASSED!");
  } finally {
    await browser.close();
  }
}

async function main() {
  runSourceChecks();
  await runChromiumE2E();
  console.log("=== Task 413 Verification PASSED ===");
}

main().catch((err) => {
  console.error("❌ Task 413 verification failed:", err);
  process.exit(1);
});
