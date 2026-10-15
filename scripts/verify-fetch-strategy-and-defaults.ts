import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("==================================================================");
console.log("🧪 Starting Subtitle Fetch Strategy, Pacing & Defaults Verification");
console.log("==================================================================");

// 1. Setup mock window and localStorage
const mockStorage: Record<string, string> = {};
(global as any).window = {
  localStorage: {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = String(val);
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
  },
};

// 2. Verify Version Parity Across All Required Files
console.log("\n📦 Section 1: Version Parity Check");
const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf-8"));
const currentVersion = pkg.version;
assert.ok(currentVersion && currentVersion.startsWith("1.0."), "package.json version must be valid 1.0.x");

const buildGradle = fs.readFileSync(path.resolve("android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(
  buildGradle.includes(`"${currentVersion}"`),
  `android-shell/app/build.gradle.kts must contain ${currentVersion}`,
);

const appConfig = fs.readFileSync(path.resolve("src/config/appConfig.ts"), "utf-8");
assert.ok(
  appConfig.includes(`APP_VERSION = "${currentVersion}"`),
  `src/config/appConfig.ts must declare APP_VERSION ${currentVersion}`,
);

const apkUpdater = fs.readFileSync(path.resolve("src/utils/apkUpdater.ts"), "utf-8");
assert.ok(
  apkUpdater.includes(`CURRENT_APK_VERSION = "v${currentVersion}"`),
  `src/utils/apkUpdater.ts must declare CURRENT_APK_VERSION v${currentVersion}`,
);
console.log(`✅ PASS: Semantic version ${currentVersion} strictly aligned across all target files`);

// 3. Verify Default Debug Mode (Requirement: By default enable debug mode)
console.log("\n🐛 Section 2: Default Debug Mode Verification");
import {
  getDebugModeSetting,
  setDebugModeSetting,
  DEFAULT_APP_SETTINGS,
  getSpeakLanguageNameOnFetchSetting,
  setSpeakLanguageNameOnFetchSetting,
  getSubtitleFetchWindowSeconds,
  setSubtitleFetchWindowSeconds,
} from "../src/utils/appSettings";

delete mockStorage["yt_debug_mode"];
assert.strictEqual(
  getDebugModeSetting(),
  true,
  "Debug mode must strictly default to true (ON) when no stored setting exists",
);

setDebugModeSetting(false);
assert.strictEqual(getDebugModeSetting(), false);
setDebugModeSetting(true);
assert.strictEqual(getDebugModeSetting(), true);

const indexSrc = fs.readFileSync(path.resolve("src/routes/index.tsx"), "utf-8");
assert.ok(
  indexSrc.includes("getDebugModeSetting()"),
  "src/routes/index.tsx must initialize debugMode via getDebugModeSetting()",
);
console.log("✅ PASS: Debug Mode defaults to true and is fully controllable");

// 4. Verify Default Parsing Criteria (Requirement: By default use parsing option: check all options)
console.log("\n🧩 Section 3: Default Parser Criteria (All Options Combined)");
import { DEFAULT_PARSER_CRITERIA, PARSER_CRITERIA } from "../src/lib/subtitles";

assert.strictEqual(
  DEFAULT_PARSER_CRITERIA.length,
  PARSER_CRITERIA.length,
  "DEFAULT_PARSER_CRITERIA must include every single criterion in PARSER_CRITERIA",
);

const expectedCriteria = [
  "sentence",
  "pause",
  "punctVote",
  "consensus",
  "cue",
  "anchors",
  "window",
];
for (const c of expectedCriteria) {
  assert.ok(
    DEFAULT_PARSER_CRITERIA.includes(c as any),
    `DEFAULT_PARSER_CRITERIA must include '${c}'`,
  );
}

assert.ok(
  indexSrc.includes("DEFAULT_PARSER_CRITERIA"),
  "src/routes/index.tsx must default selectedCriteria to DEFAULT_PARSER_CRITERIA",
);
console.log("✅ PASS: Default parsing criteria combines all categories (all options checked)");

// 5. Verify Auto-TTS Language Name on Subtitle Fetch
console.log("\n🗣️ Section 4: Auto-TTS Language Name on Fetch");
assert.strictEqual(
  DEFAULT_APP_SETTINGS.speakLanguageNameOnFetch,
  true,
  "DEFAULT_APP_SETTINGS.speakLanguageNameOnFetch must be true by default",
);

delete mockStorage["yt_speak_language_name_on_fetch_v1"];
assert.strictEqual(
  getSpeakLanguageNameOnFetchSetting(),
  true,
  "getSpeakLanguageNameOnFetchSetting() must default to true",
);

setSpeakLanguageNameOnFetchSetting(false);
assert.strictEqual(getSpeakLanguageNameOnFetchSetting(), false);
setSpeakLanguageNameOnFetchSetting(true);
assert.strictEqual(getSpeakLanguageNameOnFetchSetting(), true);

assert.ok(
  indexSrc.includes("speakFetchedLanguageName(code)") ||
    indexSrc.includes("speakFetchedLanguageName"),
  "src/routes/index.tsx must invoke speakFetchedLanguageName when subtitles are fetched",
);
console.log("✅ PASS: TTS-play language name on fetch is enabled by default");

// 6. Verify Subtitle Fetch Window Rate-Limiting & Request Queue Pacing
console.log("\n⏱️ Section 5: Subtitle Fetch Window Rate-Limiting");
import { subtitleRequestQueue } from "../src/utils/subtitleRequestQueue";

// Assert window methods exist
assert.strictEqual(typeof subtitleRequestQueue.setWindowFrameSeconds, "function");
assert.strictEqual(typeof subtitleRequestQueue.setWindowSeconds, "function");
assert.strictEqual(typeof subtitleRequestQueue.getWindowFrameSeconds, "function");
assert.strictEqual(typeof subtitleRequestQueue.getWindowSeconds, "function");
assert.strictEqual(typeof subtitleRequestQueue.getLastFetchTimestamp, "function");

subtitleRequestQueue.setWindowFrameSeconds(5);
assert.strictEqual(subtitleRequestQueue.getWindowFrameSeconds(), 5);
assert.strictEqual(subtitleRequestQueue.getWindowSeconds(), 5);

const qState = subtitleRequestQueue.getState();
assert.strictEqual(qState.windowFrameSeconds, 5);
assert.strictEqual(typeof qState.lastFetchTimestamp, "number");
console.log("✅ PASS: SubtitleRequestQueue window frame rate-limiting methods verified");

// 7. Verify Subtitle Fetching Strategies & Configuration Options
console.log("\n🔀 Section 6: Fetching Strategies & Granular Switches");
import {
  type FetchAttempt,
  DEFAULT_ATTEMPT_ORDER,
  DEFAULT_FETCH_STRATEGY_CONFIG,
  getFetchStrategyConfig,
  setFetchStrategyConfig,
  buildActiveAttemptOrder,
  shuffleAttempts,
} from "../src/lib/subtitle-fetch-plan";

assert.strictEqual(
  DEFAULT_FETCH_STRATEGY_CONFIG.mode,
  "ordered",
  "Default strategy mode must be 'ordered'",
);
assert.strictEqual(
  DEFAULT_FETCH_STRATEGY_CONFIG.windowSeconds,
  5,
  "Default windowSeconds must be 5",
);
assert.strictEqual(DEFAULT_FETCH_STRATEGY_CONFIG.allowSession, true);
assert.strictEqual(DEFAULT_FETCH_STRATEGY_CONFIG.allowAnon, true);
assert.strictEqual(DEFAULT_FETCH_STRATEGY_CONFIG.allowTlang, true);
assert.strictEqual(DEFAULT_FETCH_STRATEGY_CONFIG.allowLang, true);

// Test strategy persistence
delete mockStorage["yt_fetch_strategy_config_v1"];
const readCfg = getFetchStrategyConfig();
assert.strictEqual(readCfg.mode, "ordered");
assert.strictEqual(readCfg.windowSeconds, 5);

const updatedCfg = setFetchStrategyConfig({
  mode: "random",
  useServerAlternate: true,
  allowSession: false,
  windowSeconds: 8,
});
assert.strictEqual(updatedCfg.mode, "random");
assert.strictEqual(updatedCfg.useServerAlternate, true);
assert.strictEqual(updatedCfg.allowSession, false);
assert.strictEqual(updatedCfg.windowSeconds, 8);

// Test buildActiveAttemptOrder filtering:
// When allowSession is false, no attempt should have send: "session"
const filteredOrder = buildActiveAttemptOrder(DEFAULT_ATTEMPT_ORDER, {
  ...DEFAULT_FETCH_STRATEGY_CONFIG,
  allowSession: false,
});
assert.ok(filteredOrder.every((a) => a.send === "anon"));

// When allowTlang is false, no attempt should have mode: "tlang"
const noTlangOrder = buildActiveAttemptOrder(DEFAULT_ATTEMPT_ORDER, {
  ...DEFAULT_FETCH_STRATEGY_CONFIG,
  allowTlang: false,
});
assert.ok(noTlangOrder.every((a) => a.mode === "lang"));

// Test shuffleAttempts preserves all items
const base: FetchAttempt[] = [...DEFAULT_ATTEMPT_ORDER];
const shuffled = shuffleAttempts(base);
assert.strictEqual(shuffled.length, base.length);
for (const item of base) {
  assert.ok(shuffled.some((s) => s.mode === item.mode && s.send === item.send));
}

// Reset strategy config for clean state
setFetchStrategyConfig(DEFAULT_FETCH_STRATEGY_CONFIG);
console.log("✅ PASS: Subtitle fetch strategies, configuration switches & builders verified");

// 8. Verify UI Components & Test Identifiers
console.log("\n🖥️ Section 7: UI Controls & Test Identifiers");
const attemptSettingsSrc = fs.readFileSync(
  path.resolve("src/components/AttemptOrderSettings.tsx"),
  "utf-8",
);
const requiredTestIds = [
  "fetch-strategy-mode-select",
  "strategy-toggle-server-alternate",
  "strategy-toggle-session",
  "strategy-toggle-anon",
  "strategy-toggle-tlang",
  "strategy-toggle-lang",
  "strategy-window-seconds-input",
  "strategy-explanation-panel",
  "subtitle-attempt-order-settings",
];
for (const id of requiredTestIds) {
  assert.ok(
    attemptSettingsSrc.includes(id),
    `src/components/AttemptOrderSettings.tsx must contain test id '${id}'`,
  );
}
console.log("✅ PASS: All required UI controls and data-testids present in AttemptOrderSettings");

// 9. Verify Documentation in docs/reliable-subtitles-fetching.md
console.log("\n📚 Section 8: Architectural Documentation Completeness");
const reliableDoc = fs.readFileSync(path.resolve("docs/reliable-subtitles-fetching.md"), "utf-8");
const docAssertions = [
  "Subtitle fetch window rate-limiting",
  "never try to fetch more than 1 subtitle in a window frame of X seconds",
  "First-Random Strategy",
  "Server Alternate Mode",
  "server:alternate",
  "session",
  "tlang",
  "lang",
  "speakLanguageNameOnFetch",
  "Default debug mode enabled",
  "Default parser criteria",
];
for (const item of docAssertions) {
  assert.ok(
    reliableDoc.includes(item),
    `docs/reliable-subtitles-fetching.md must document '${item}'`,
  );
}
console.log("✅ PASS: docs/reliable-subtitles-fetching.md thoroughly documents all requirements");

console.log("\n==================================================================");
console.log("🎉 ALL TESTS PASSED: Fetch strategies, pacing & defaults verified!");
console.log("==================================================================");
