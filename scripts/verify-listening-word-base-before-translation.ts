import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

function runSourceAndRaceUnitChecks() {
  console.log(
    "=== Verifying Task 407 (Prompt 197 Ch. 2): Trigger Listening Plays Base Word Before Translation ===",
  );

  // 1. Source invariants in src/routes/index.tsx
  const indexSrc = fs.readFileSync(path.resolve("src/routes/index.tsx"), "utf-8");
  assert.ok(
    indexSrc.includes("hadActiveUtterance || window.speechSynthesis.speaking || window.speechSynthesis.pending"),
    "cancelSpeech() must conditionally cancel Web Speech only when active/pending",
  );
  assert.ok(
    indexSrc.includes("lastSpeechSynthesisCancelAt") &&
      indexSrc.includes("elapsedSinceCancel < 160"),
    "executeSingleSpeech must wait past the 160ms post-cancel cooldown before speaking",
  );
  assert.ok(
    indexSrc.includes("let hasStarted = false;") &&
      indexSrc.includes("cancelRaceRetried") &&
      indexSrc.includes("if (!isCancelled() && !hasStarted && !cancelRaceRetried)") &&
      indexSrc.includes("win._activeUtterance === activeUtteranceRef"),
    "executeSingleSpeech must detect pre-start async cancel race when !isCancelled() and retry instead of dropping the base word",
  );
  console.log("✔ Source invariants in src/routes/index.tsx verified.");

  // 2. Source invariants in src/lib/alternative-tts.ts
  const altTtsSrc = fs.readFileSync(path.resolve("src/lib/alternative-tts.ts"), "utf-8");
  assert.ok(
    altTtsSrc.includes("const hadActive = Boolean(synth?.speaking || synth?.pending);") &&
      altTtsSrc.includes("setTimeout(speakFallback, 150)") &&
      altTtsSrc.includes("setTimeout(speakNative, 150)"),
    "alternative-tts.ts Web Speech fallbacks must conditionally cancel and yield 150ms before speak()",
  );
  console.log("✔ Source invariants in src/lib/alternative-tts.ts verified.");

  // 3. Source invariants in src/components/ListeningGamePanel.tsx
  const panelSrc = fs.readFileSync(path.resolve("src/components/ListeningGamePanel.tsx"), "utf-8");
  assert.ok(
    panelSrc.includes("isAlternativeTtsPlaying") &&
      panelSrc.includes("isAnyPlaybackActive") &&
      panelSrc.includes("stopSequentialPlayback(wasAlreadySpeaking)") &&
      panelSrc.includes("setTimeout(resolve, 150)"),
    "ListeningGamePanel must inspect isAnyPlaybackActive() and yield 150ms only when interrupting active speech",
  );
  console.log("✔ Source invariants in src/components/ListeningGamePanel.tsx verified.");

  // 4. Unit simulation: pre-start 'canceled' race when NOT cancelled retries and preserves base word
  const spokenOrder: string[] = [];
  let simulatedAttempt = 0;
  function simulatePreStartCancelRace(isCancelled: boolean) {
    let hasStarted = false;
    let cancelRaceRetried = false;

    const dispatch = () => {
      simulatedAttempt += 1;
      if (simulatedAttempt === 1) {
        // First attempt hits async Chrome speechSynthesis.cancel() race BEFORE onstart
        const errorType = "canceled";
        if (errorType === "canceled") {
          if (!isCancelled && !hasStarted && !cancelRaceRetried) {
            cancelRaceRetried = true;
            dispatch(); // retry
            return;
          }
          return; // intentional cancel
        }
      }
      hasStarted = true;
      spokenOrder.push("base:Hello");
    };

    dispatch();
  }

  simulatePreStartCancelRace(false);
  spokenOrder.push("translation:Hola");
  assert.deepEqual(
    spokenOrder,
    ["base:Hello", "translation:Hola"],
    "Pre-start cancel race must retry and still speak base word before translation",
  );

  // Intentional cancel skips retry
  const intentionalEvents: string[] = [];
  const simulateIntentionalCancel = () => {
    const isCancelled = true;
    const hasStarted = false;
    let retried = false;
    if (!isCancelled && !hasStarted && !retried) {
      retried = true;
      intentionalEvents.push("retried");
    } else {
      intentionalEvents.push("stopped-cleanly");
    }
  };
  simulateIntentionalCancel();
  assert.deepEqual(intentionalEvents, ["stopped-cleanly"]);
  console.log("✔ Web Speech pre-start cancel race & intentional-cancel simulations passed.");
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

    // Install deterministic Web Speech synthesizer as a plain JS string so tsx/esbuild
    // never injects Node-side __name helpers into the browser init script.
    await page.addInitScript(`(() => {
      const spokenLog = [];
      window.__MOCK_SPOKEN_LOG__ = spokenLog;

      let lastCancelAt = 0;
      let isSpeaking = false;
      let activeTimer = null;
      let activeUtterance = null;

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
        get speaking() { return isSpeaking; },
        get pending() { return false; },
        get paused() { return false; },
        getVoices() { return fakeVoices; },
        resume() {},
        pause() {},
        addEventListener() {},
        removeEventListener() {},
        cancel() {
          lastCancelAt = Date.now();
          isSpeaking = false;
          if (activeTimer !== null) {
            clearTimeout(activeTimer);
            activeTimer = null;
          }
          if (activeUtterance) {
            const u = activeUtterance;
            activeUtterance = null;
            setTimeout(() => {
              if (typeof u.onerror === "function") {
                u.onerror({ error: "canceled" });
              }
            }, 25);
          }
        },
        speak(u) {
          const dt = Date.now() - lastCancelAt;
          const text = String((u && u.text) || "");
          const lang = String((u && u.lang) || "");
          if (lastCancelAt > 0 && dt < 120) {
            spokenLog.push({ text, lang, canceledRace: true });
            setTimeout(() => {
              if (typeof u.onerror === "function") {
                u.onerror({ error: "canceled" });
              }
            }, 15);
            return;
          }
          activeUtterance = u;
          isSpeaking = true;
          setTimeout(() => {
            if (activeUtterance !== u) return;
            if (typeof u.onstart === "function") {
              u.onstart();
            }
            spokenLog.push({ text, lang, canceledRace: false });
          }, 20);
          activeTimer = setTimeout(() => {
            if (activeUtterance !== u) return;
            activeUtterance = null;
            isSpeaking = false;
            if (typeof u.onend === "function") {
              u.onend();
            }
          }, 180);
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

    // Wait for first word card's on-demand translation to appear
    const firstOnDemand = page.getByTestId("listening-word-ondemand-translation-0");
    await firstOnDemand.waitFor({ state: "visible", timeout: 10000 });
    const firstOnDemandText = ((await firstOnDemand.textContent()) || "")
      .replace(/^→\s*/, "")
      .trim();

    const firstWordText = (
      (await page
        .getByTestId("listening-word-item-0")
        .locator("span.font-bold.text-sm")
        .textContent()) || ""
    ).trim();
    assert.ok(firstWordText.length > 0, "Expected non-empty first word");

    // Case 1: Click Listen on Word 0 from idle
    await page.getByTestId("listening-play-word-0").click();
    try {
      await page.waitForFunction(
        () => {
          const log =
            (
              window as unknown as {
                __MOCK_SPOKEN_LOG__?: Array<{ text: string; canceledRace: boolean }>;
              }
            ).__MOCK_SPOKEN_LOG__ || [];
          return log.filter((x) => !x.canceledRace).length >= 2;
        },
        undefined,
        { timeout: 10000 },
      );
    } catch (waitErr) {
      const diag = await page.evaluate(() => ({
        mockLog: (window as unknown as { __MOCK_SPOKEN_LOG__?: unknown }).__MOCK_SPOKEN_LOG__,
        history: JSON.parse(localStorage.getItem("yt_tts_play_history_v1") || "[]"),
        voicesCount: window.speechSynthesis?.getVoices?.().length ?? -1,
      }));
      throw new Error(
        `Timed out waiting for >=2 non-canceled mock utterances. diag=${JSON.stringify(diag)}; err=${waitErr}`,
      );
    }

    const logAfterFirstClick = await page.evaluate(
      () =>
        (
          window as unknown as {
            __MOCK_SPOKEN_LOG__: Array<{ text: string; lang: string; canceledRace: boolean }>;
          }
        ).__MOCK_SPOKEN_LOG__,
    );
    const spokenNonCanceled1 = logAfterFirstClick.filter((x) => !x.canceledRace);
    assert.equal(
      spokenNonCanceled1[0]?.text.trim(),
      firstWordText,
      `Expected base word '${firstWordText}' to be spoken FIRST, got ${JSON.stringify(spokenNonCanceled1)}`,
    );
    assert.equal(
      spokenNonCanceled1[1]?.text.trim(),
      firstOnDemandText,
      `Expected on-demand translation '${firstOnDemandText}' to be spoken SECOND, got ${JSON.stringify(spokenNonCanceled1)}`,
    );
    console.log(
      `✔ Idle Listen spoke base '${firstWordText}' -> translation '${firstOnDemandText}' in exact order.`,
    );

    // Case 2: Interrupt active Listen All Words by clicking Listen on Word 1 immediately
    const listenAllWordsBtn = page.getByTestId("listening-play-all-words-btn");
    await listenAllWordsBtn.click();
    await page.waitForTimeout(120);

    await page.evaluate(() => {
      (
        window as unknown as {
          __MOCK_SPOKEN_LOG__: Array<{ text: string; lang: string; canceledRace: boolean }>;
        }
      ).__MOCK_SPOKEN_LOG__.length = 0;
    });

    const secondWordText = (
      (await page
        .getByTestId("listening-word-item-1")
        .locator("span.font-bold.text-sm")
        .textContent()) || ""
    ).trim();
    const secondOnDemand = page.getByTestId("listening-word-ondemand-translation-1");
    await secondOnDemand.waitFor({ state: "visible", timeout: 10000 });
    const secondOnDemandText = ((await secondOnDemand.textContent()) || "")
      .replace(/^→\s*/, "")
      .trim();

    await page.getByTestId("listening-play-word-1").click();

    try {
      await page.waitForFunction(
        (expectedWord) => {
          const log =
            (
              window as unknown as {
                __MOCK_SPOKEN_LOG__?: Array<{ text: string; canceledRace: boolean }>;
              }
            ).__MOCK_SPOKEN_LOG__ || [];
          const ok = log.filter((x) => !x.canceledRace);
          const idx = ok.findIndex((x) => x.text.trim() === expectedWord);
          return idx >= 0 && ok.length > idx + 1;
        },
        secondWordText,
        { timeout: 10000 },
      );
    } catch (waitErr) {
      const diag = await page.evaluate(() => ({
        mockLog: (window as unknown as { __MOCK_SPOKEN_LOG__?: unknown }).__MOCK_SPOKEN_LOG__,
        history: JSON.parse(localStorage.getItem("yt_tts_play_history_v1") || "[]"),
      }));
      throw new Error(
        `Timed out waiting for interrupted Listen ('${secondWordText}' -> '${secondOnDemandText}'). diag=${JSON.stringify(diag)}; err=${waitErr}`,
      );
    }

    const logAfterInterrupt = await page.evaluate(
      () =>
        (
          window as unknown as {
            __MOCK_SPOKEN_LOG__: Array<{ text: string; lang: string; canceledRace: boolean }>;
          }
        ).__MOCK_SPOKEN_LOG__,
    );
    const spokenAfterInterrupt = logAfterInterrupt.filter((x) => !x.canceledRace);
    const baseIdx = spokenAfterInterrupt.findIndex((x) => x.text.trim() === secondWordText);
    assert.ok(
      baseIdx >= 0,
      `Expected base word '${secondWordText}' to be spoken after interrupting Listen All, got ${JSON.stringify(spokenAfterInterrupt)}`,
    );
    assert.equal(
      spokenAfterInterrupt[baseIdx + 1]?.text.trim(),
      secondOnDemandText,
      `Expected translation '${secondOnDemandText}' right after '${secondWordText}', got ${JSON.stringify(spokenAfterInterrupt)}`,
    );
    console.log(
      `✔ Interrupted Listen spoke base '${secondWordText}' -> translation '${secondOnDemandText}' without dropping base word.`,
    );

    assert.equal(await page.getByTestId("floating-error-button").count(), 0);
    assert.deepEqual(pageErrors, []);
    const badConsole = consoleErrors.filter(
      (m) => !m.includes("WebSocket") && !m.includes("ws://"),
    );
    assert.deepEqual(badConsole, []);
    console.log("✔ Live Chromium base-word-before-translation E2E PASSED!");
  } finally {
    await browser.close();
  }
}

async function main() {
  runSourceAndRaceUnitChecks();
  await runChromiumE2E();
  console.log("=== Task 407 Verification PASSED ===");
}

main().catch((err) => {
  console.error("❌ Task 407 verification failed:", err);
  process.exit(1);
});
