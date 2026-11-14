import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  clampListeningTtsRate,
  resolveEffectiveListeningTtsRate,
} from "../src/utils/listeningGame";

function runUnitAndSourceChecks() {
  console.log("=== Verifying Task 412 (Prompt 201 Ch. 3): Listening TTS Speed Override ===");

  assert.equal(clampListeningTtsRate(0.1), 0.25, "Lower bound must clamp to 0.25");
  assert.equal(clampListeningTtsRate(4.0), 2.5, "Upper bound must clamp to 2.5");
  assert.equal(clampListeningTtsRate(1.375), 1.38, "Rates round cleanly to 2 decimals");
  assert.equal(clampListeningTtsRate(Number.NaN), 1.0, "NaN falls back to 1.0");

  const configuredRates = { en: 0.8, ru: 0.65, es: 1.1 };
  assert.equal(
    resolveEffectiveListeningTtsRate("ru", configuredRates, null),
    0.65,
    "When override is null, configured rate is used",
  );
  assert.equal(
    resolveEffectiveListeningTtsRate("he", configuredRates, null),
    1.0,
    "When language has no configured rate and override is null, defaults to 1.0",
  );
  assert.equal(
    resolveEffectiveListeningTtsRate("ru", configuredRates, 1.75),
    1.75,
    "When override is active, override supersedes configured rate",
  );

  const panelSrc = fs.readFileSync(path.resolve("src/components/ListeningGamePanel.tsx"), "utf-8");
  const indexSrc = fs.readFileSync(path.resolve("src/routes/index.tsx"), "utf-8");
  assert.ok(
    panelSrc.includes('data-testid="listening-speed-override-control"') &&
      panelSrc.includes('data-testid="listening-speed-override-toggle"') &&
      panelSrc.includes('data-testid="listening-speed-input"') &&
      panelSrc.includes("rateOverride"),
    "ListeningGamePanel must expose TTS speed override UI and forward rateOverride",
  );
  assert.ok(
    indexSrc.includes("options?.rateOverride") && indexSrc.includes("configuredRates={rates}"),
    "src/routes/index.tsx must honor options?.rateOverride and pass configuredRates in both modes",
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
          const rate = Number((u && u.rate) || 1);
          setTimeout(() => {
            if (activeUtterance !== u) return;
            if (typeof u.onstart === "function") u.onstart();
            spokenLog.push({ text, lang, rate });
          }, 10);
          activeTimer = setTimeout(() => {
            if (activeUtterance !== u) return;
            activeUtterance = null;
            mockSynth.speaking = false;
            if (typeof u.onend === "function") u.onend();
          }, 70);
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
    await page
      .getByTestId("listening-speed-override-control")
      .waitFor({ state: "visible", timeout: 10000 });

    const toggleBtn = page.getByTestId("listening-speed-override-toggle");
    assert.equal(
      await toggleBtn.getAttribute("aria-pressed"),
      "false",
      "Override must be disabled by default (using configured speed)",
    );

    // Clear log and play sentence 0 at configured rate
    await page.evaluate(() => {
      (
        window as unknown as { __MOCK_SPOKEN_LOG__: Array<{ rate: number }> }
      ).__MOCK_SPOKEN_LOG__.length = 0;
    });
    await page.getByTestId("listening-play-sentence-0").click();
    await page.waitForFunction(
      () =>
        ((window as unknown as { __MOCK_SPOKEN_LOG__?: unknown[] }).__MOCK_SPOKEN_LOG__ || [])
          .length >= 1,
      undefined,
      { timeout: 10000 },
    );
    await page.waitForTimeout(300);

    const configuredLog = await page.evaluate(
      () =>
        (
          window as unknown as {
            __MOCK_SPOKEN_LOG__: Array<{ text: string; lang: string; rate: number }>;
          }
        ).__MOCK_SPOKEN_LOG__,
    );
    console.log("Spoken log at configured rate:", configuredLog);
    assert.ok(configuredLog[0]?.rate !== 1.75, "Default playback must use configured rate");

    // Select 1.5x preset or enter 1.75x override
    const speedInput = page.getByTestId("listening-speed-input");
    await speedInput.fill("1.75");
    assert.equal(
      await toggleBtn.getAttribute("aria-pressed"),
      "true",
      "Editing speed input must activate speed override",
    );

    // Clear log and play word 0 + sentence 0 with 1.75x override active
    await page.evaluate(() => {
      (
        window as unknown as { __MOCK_SPOKEN_LOG__: Array<{ rate: number }> }
      ).__MOCK_SPOKEN_LOG__.length = 0;
    });
    await page.getByTestId("listening-play-word-0").click();
    await page.waitForFunction(
      () =>
        ((window as unknown as { __MOCK_SPOKEN_LOG__?: unknown[] }).__MOCK_SPOKEN_LOG__ || [])
          .length >= 1,
      undefined,
      { timeout: 10000 },
    );
    await page.waitForTimeout(300);

    const overrideLog = await page.evaluate(
      () =>
        (
          window as unknown as {
            __MOCK_SPOKEN_LOG__: Array<{ text: string; lang: string; rate: number }>;
          }
        ).__MOCK_SPOKEN_LOG__,
    );
    console.log("Spoken log with 1.75x override:", overrideLog);
    assert.ok(
      overrideLog.every((entry) => Math.abs(entry.rate - 1.75) < 0.01),
      `All spoken utterances under override must play at 1.75x, got ${JSON.stringify(overrideLog)}`,
    );

    // Reset back to configured speed
    await page.getByTestId("listening-speed-reset-btn").click();
    assert.equal(
      await toggleBtn.getAttribute("aria-pressed"),
      "false",
      "Clicking 'Use Configured' must clear the override",
    );

    assert.equal(await page.getByTestId("floating-error-button").count(), 0);
    assert.deepEqual(pageErrors, []);
    console.log("✔ Live Chromium E2E for listening TTS speed override PASSED!");
  } finally {
    await browser.close();
  }
}

async function main() {
  runUnitAndSourceChecks();
  await runChromiumE2E();
  console.log("=== Task 412 Verification PASSED ===");
}

main().catch((err) => {
  console.error("❌ Task 412 verification failed:", err);
  process.exit(1);
});
