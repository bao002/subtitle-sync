if (typeof (globalThis as any).window === "undefined") {
  const store = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => store.set(key, String(val)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  };
}

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ACCORDION_AUTO_FOLD_SECONDS,
  ACCORDION_AUTO_FOLD_MS,
} from "../src/components/AccordionSection";
import {
  getVideoLibraryTimeoutSetting,
  setVideoLibraryTimeoutSetting,
  VIDEO_LIBRARY_TIMEOUT_KEY,
} from "../src/utils/appSettings";

function runVerification() {
  console.log(
    "=== Verifying Chapter 5: 10s Accordion Timeout with Sand-Time / Hourglass & Progress Bar ===",
  );

  // 1. Verify timeout constants
  assert.strictEqual(
    ACCORDION_AUTO_FOLD_SECONDS,
    10,
    "ACCORDION_AUTO_FOLD_SECONDS must be exactly 10 seconds",
  );
  assert.strictEqual(
    ACCORDION_AUTO_FOLD_MS,
    10000,
    "ACCORDION_AUTO_FOLD_MS must be 10,000 milliseconds",
  );
  console.log("✓ ACCORDION_AUTO_FOLD_SECONDS = 10, ACCORDION_AUTO_FOLD_MS = 10,000 verified");

  // 2. Verify AccordionSection contains hourglass icon, progress bar, and timeout countdown
  const accordionSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/AccordionSection.tsx"),
    "utf-8",
  );

  assert.ok(
    accordionSource.includes("Hourglass"),
    "AccordionSection must import and render Hourglass icon",
  );
  assert.ok(
    accordionSource.includes("accordion-hourglass-icon-"),
    "AccordionSection must render data-testid for accordion-hourglass-icon",
  );
  assert.ok(
    accordionSource.includes("accordion-timeout-progress-"),
    "AccordionSection must render data-testid for accordion-timeout-progress bar",
  );
  assert.ok(
    accordionSource.includes("accordion-timeout-countdown-"),
    "AccordionSection must render data-testid for countdown timer",
  );
  assert.ok(
    accordionSource.includes("autoTimeout"),
    "AccordionSection must accept autoTimeout prop to control timeout enablement",
  );
  console.log(
    "✓ AccordionSection component supports 10s countdown, Hourglass icon, and progress bar",
  );

  // 3. Verify appSettings storage functions
  const defaultSetting = getVideoLibraryTimeoutSetting();
  assert.strictEqual(typeof defaultSetting, "boolean", "Default timeout setting must be boolean");

  setVideoLibraryTimeoutSetting(false);
  assert.strictEqual(
    getVideoLibraryTimeoutSetting(),
    false,
    "Setting must persist false in storage",
  );

  setVideoLibraryTimeoutSetting(true);
  assert.strictEqual(getVideoLibraryTimeoutSetting(), true, "Setting must persist true in storage");
  console.log("✓ appSettings persistence for video library timeout verified");

  // 4. Verify index.tsx wiring
  const indexSource = fs.readFileSync(path.resolve(process.cwd(), "src/routes/index.tsx"), "utf-8");

  assert.ok(
    indexSource.includes("getVideoLibraryTimeoutSetting"),
    "index.tsx must import getVideoLibraryTimeoutSetting",
  );
  assert.ok(
    indexSource.includes("videoLibraryTimeoutEnabled"),
    "index.tsx must track videoLibraryTimeoutEnabled state",
  );
  assert.ok(
    indexSource.includes("setting-video-library-timeout"),
    "index.tsx Settings panel must render data-testid='setting-video-library-timeout'",
  );
  assert.ok(
    indexSource.includes(
      'autoTimeout={panelId === "library" ? videoLibraryTimeoutEnabled : false}',
    ),
    "index.tsx must pass autoTimeout restricted strictly to library accordion based on setting",
  );
  console.log("✓ index.tsx wiring and Settings control verified");

  console.log("=== All Chapter 5 verification assertions passed successfully! ===");
}

runVerification();
