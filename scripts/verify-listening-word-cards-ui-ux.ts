import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

function runSourceChecks() {
  console.log(
    "=== Verifying Task 409 (Prompt 197 Ch. 4): Word Cards Two-Band UI/UX Space Optimization ===",
  );

  const panelSrc = fs.readFileSync(path.resolve("src/components/ListeningGamePanel.tsx"), "utf-8");
  assert.ok(
    panelSrc.includes("data-testid={`listening-word-band-${idx}`}") &&
      panelSrc.includes("data-testid={`listening-word-sentence-band-${idx}`}") &&
      panelSrc.includes("max-h-[26rem]"),
    "ListeningGamePanel must expose two-band word cards (listening-word-band-* + listening-word-sentence-band-*) and max-h-[26rem] list containers",
  );
  assert.ok(
    !panelSrc.includes("letterCount} letters") &&
      !panelSrc.includes("line-clamp-") &&
      !panelSrc.includes("truncate"),
    "Word card bands must not re-introduce 'X letters' badge or truncate derived sentences",
  );
  console.log("✔ Source invariants verified.");
}

async function runChromiumLayoutE2E() {
  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  let serverUp = false;
  try {
    const res = await fetch(baseUrl, { signal: AbortSignal.timeout(2500) });
    serverUp = res.ok;
  } catch {
    serverUp = false;
  }
  if (!serverUp) {
    console.log(`ℹ Skipping live Chromium layout E2E because ${baseUrl} is not reachable.`);
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
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
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
    await page.getByTestId("listening-word-item-1").waitFor({ state: "visible", timeout: 10000 });

    const metrics = await page.evaluate(() => {
      const list = document.querySelector(
        '[data-testid="listening-words-list"]',
      ) as HTMLElement | null;
      const card = document.querySelector(
        '[data-testid="listening-word-item-1"]',
      ) as HTMLElement | null;
      const band1 = document.querySelector(
        '[data-testid="listening-word-band-1"]',
      ) as HTMLElement | null;
      const band2 = document.querySelector(
        '[data-testid="listening-word-sentence-band-1"]',
      ) as HTMLElement | null;
      const listenBtn = document.querySelector(
        '[data-testid="listening-play-word-1"]',
      ) as HTMLElement | null;
      const sentenceBtn = document.querySelector(
        '[data-testid="listening-play-word-sentence-1"]',
      ) as HTMLElement | null;
      const sourceSentenceEl = document.querySelector(
        '[data-testid="listening-word-source-sentence-1"]',
      ) as HTMLElement | null;

      if (!list || !card || !band1 || !band2 || !listenBtn || !sentenceBtn || !sourceSentenceEl) {
        return null;
      }

      const listStyle = window.getComputedStyle(list);
      const band1Rect = band1.getBoundingClientRect();
      const band2Rect = band2.getBoundingClientRect();
      const listenRect = listenBtn.getBoundingClientRect();
      const sentenceRect = sentenceBtn.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      return {
        listMaxHeightPx: parseFloat(listStyle.maxHeight || "0"),
        band1Bottom: band1Rect.bottom,
        band2Top: band2Rect.top,
        listenLeft: listenRect.left,
        listenRight: listenRect.right,
        sentenceLeft: sentenceRect.left,
        sentenceRight: sentenceRect.right,
        listenWidth: listenRect.width,
        sentenceWidth: sentenceRect.width,
        cardScrollWidth: card.scrollWidth,
        cardClientWidth: card.clientWidth,
        cardWidth: cardRect.width,
        hasLettersBadge: (card.textContent || "").toLowerCase().includes("letters"),
        sentenceTextLength: (sourceSentenceEl.textContent || "").trim().length,
      };
    });

    assert.ok(metrics, "Expected all word card band metrics on listening-word-item-1");
    assert.ok(
      metrics.listMaxHeightPx >= 380,
      `Expected expanded comfortable list max-height (>=380px / 26rem), got ${metrics.listMaxHeightPx}px`,
    );
    assert.ok(
      metrics.band2Top >= metrics.band1Bottom - 1,
      `Expected clean vertical two-band separation (band1.bottom=${metrics.band1Bottom}, band2.top=${metrics.band2Top})`,
    );
    assert.ok(
      Math.abs(metrics.listenRight - metrics.sentenceRight) <= 2 &&
        Math.abs(metrics.listenWidth - metrics.sentenceWidth) <= 2,
      `Expected aligned equal-width right-rail action buttons (listen=${metrics.listenWidth}px@${metrics.listenRight}, sentence=${metrics.sentenceWidth}px@${metrics.sentenceRight})`,
    );
    assert.ok(
      metrics.cardScrollWidth <= metrics.cardClientWidth + 1,
      `Expected zero horizontal overflow inside word card (scrollWidth=${metrics.cardScrollWidth}, clientWidth=${metrics.cardClientWidth})`,
    );
    assert.equal(metrics.hasLettersBadge, false, "Must never re-introduce X letters badge");
    assert.ok(metrics.sentenceTextLength > 0, "Expected derived original sentence text");

    assert.equal(await page.getByTestId("floating-error-button").count(), 0);
    assert.deepEqual(pageErrors, []);
    console.log(
      "✔ Live Chromium word card two-band layout & space utilization E2E PASSED:",
      metrics,
    );
  } finally {
    await browser.close();
  }
}

async function main() {
  runSourceChecks();
  await runChromiumLayoutE2E();
  console.log("=== Task 409 Verification PASSED ===");
}

main().catch((err) => {
  console.error("❌ Task 409 verification failed:", err);
  process.exit(1);
});
