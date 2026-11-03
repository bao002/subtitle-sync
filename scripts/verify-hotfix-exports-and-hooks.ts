import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import assert from "node:assert";
import React from "react";
import { renderToString } from "react-dom/server";
import { SwitchableDefaultSubtitlesBar } from "../src/components/SwitchableDefaultSubtitlesBar";
import { getTtsFallbackOrder, setTtsFallbackOrder, DEFAULT_TTS_FALLBACK_ORDER } from "../src/lib/alternative-tts";
import {
  isLanguageTtsBlacklisted,
  getTtsBlacklist,
  setTtsBlacklist,
  toggleLanguageTtsBlacklist,
  isTtsSpeakableLanguage,
} from "../src/lib/playback-preferences";

function probeUrl(urlPath: string): Promise<{ status: number; text: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode || 0,
          text: data,
          contentType: res.headers["content-type"] || "",
        });
      });
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error(`Timeout probing dev server for ${urlPath}`));
    });
  });
}

async function run() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Hotfix Task 287: Exports, Circular Dependencies & React Hooks");
  console.log("=========================================================================");

  // 1. Verify alternative-tts fallback order functions
  console.log("Check 1: Verifying alternative-tts exports and functions...");
  assert.strictEqual(typeof getTtsFallbackOrder, "function", "getTtsFallbackOrder must be exported as a function");
  assert.strictEqual(typeof setTtsFallbackOrder, "function", "setTtsFallbackOrder must be exported as a function");
  assert.ok(DEFAULT_TTS_FALLBACK_ORDER, "DEFAULT_TTS_FALLBACK_ORDER must be exported");
  const initialOrder = getTtsFallbackOrder();
  assert.ok(initialOrder, "getTtsFallbackOrder() must return a valid order string");
  setTtsFallbackOrder("tts3_google_native");
  assert.strictEqual(getTtsFallbackOrder(), "tts3_google_native");
  setTtsFallbackOrder(initialOrder); // restore
  console.log("✓ Check 1 passed: alternative-tts exports work flawlessly.");

  // 2. Verify playback-preferences blacklist exports
  console.log("Check 2: Verifying playback-preferences exports and functions...");
  assert.strictEqual(typeof isLanguageTtsBlacklisted, "function", "isLanguageTtsBlacklisted must be a function");
  assert.strictEqual(typeof getTtsBlacklist, "function", "getTtsBlacklist must be a function");
  assert.strictEqual(typeof setTtsBlacklist, "function", "setTtsBlacklist must be a function");
  assert.strictEqual(typeof toggleLanguageTtsBlacklist, "function", "toggleLanguageTtsBlacklist must be a function");
  assert.strictEqual(typeof isTtsSpeakableLanguage, "function", "isTtsSpeakableLanguage must be a function");

  setTtsBlacklist(["es", "fr"]);
  assert.strictEqual(isLanguageTtsBlacklisted("es"), true, "es should be blacklisted");
  assert.strictEqual(isLanguageTtsBlacklisted("fr"), true, "fr should be blacklisted");
  assert.strictEqual(isLanguageTtsBlacklisted("en"), false, "en should not be blacklisted");
  assert.strictEqual(isTtsSpeakableLanguage("es", "en"), false, "Blacklisted language should not be speakable");
  assert.strictEqual(isTtsSpeakableLanguage("en", "en"), false, "Base language should not be speakable");
  setTtsBlacklist([]);
  console.log("✓ Check 2 passed: playback-preferences exports and blacklist work correctly.");

  // 3. Verify no circular dependency between SwitchableDefaultSubtitlesBar and VideoPlayground
  console.log("Check 3: Verifying no circular dependency in SwitchableDefaultSubtitlesBar...");
  const barSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/SwitchableDefaultSubtitlesBar.tsx"),
    "utf-8",
  );
  assert.ok(
    !barSource.includes('from "@/components/VideoPlayground"'),
    "SwitchableDefaultSubtitlesBar must NOT import from VideoPlayground",
  );
  console.log("✓ Check 3 passed: Circular dependency between SwitchableDefaultSubtitlesBar and VideoPlayground is broken.");

  // 4. Verify dedupe in vite.config.ts
  console.log("Check 4: Verifying dedupe configuration in vite.config.ts...");
  const viteConfig = fs.readFileSync(path.resolve(process.cwd(), "vite.config.ts"), "utf-8");
  assert.ok(
    viteConfig.includes('dedupe: ["react", "react-dom"]'),
    'vite.config.ts must include dedupe: ["react", "react-dom"]',
  );
  console.log("✓ Check 4 passed: dedupe: [\"react\", \"react-dom\"] is configured.");

  // 5. Verify SwitchableDefaultSubtitlesBar renders with React hooks without error
  console.log("Check 5: Testing SwitchableDefaultSubtitlesBar React rendering...");
  const renderedHtml = renderToString(
    React.createElement(SwitchableDefaultSubtitlesBar, {
      videoId: "L2Ryrr6txwA",
      defaultLanguages: ["en", "he", "ar"],
      activeLanguage: "en",
      onSelectLanguage: () => {},
      tracks: {
        en: { events: [{ tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: "Hello, world!" }] }] },
      },
    }),
  );
  assert.ok(renderedHtml.includes("switchable-default-subtitles-bar"), "Must render container element");
  assert.ok(renderedHtml.includes("Default Subtitles"), "Must render Default Subtitles label");
  console.log("✓ Check 5 passed: SwitchableDefaultSubtitlesBar rendered cleanly with hooks!");

  // 6. Probe Vite dev server for all critical modules
  console.log("Check 6: Probing Vite dev server transforms for critical modules...");
  const endpoints = [
    "/src/lib/alternative-tts.ts",
    "/src/lib/playback-preferences.ts",
    "/src/components/SwitchableDefaultSubtitlesBar.tsx",
    "/src/components/VideoPlayground.tsx",
    "/src/components/beginner/PerLanguageTtsPreferences.tsx",
    "/src/routes/index.tsx",
  ];

  for (const ep of endpoints) {
    const res = await probeUrl(ep);
    assert.strictEqual(res.status, 200, `Module ${ep} must return status 200`);
    if (ep.includes("alternative-tts.ts")) {
      assert.ok(
        res.text.includes("getTtsFallbackOrder"),
        "Transformed alternative-tts.ts must contain getTtsFallbackOrder",
      );
    }
    if (ep.includes("playback-preferences.ts")) {
      assert.ok(
        res.text.includes("isLanguageTtsBlacklisted"),
        "Transformed playback-preferences.ts must contain isLanguageTtsBlacklisted",
      );
    }
    console.log(`  ✓ ${ep}: 200 OK (${res.text.length} bytes)`);
  }

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Hotfix Task 287 successfully resolved all app errors!");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
