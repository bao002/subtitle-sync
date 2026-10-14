import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  DEBUG_MODE_STORAGE_KEY,
  getDebugModeSetting,
  setDebugModeSetting,
} from "../src/utils/appSettings";

console.log("====================================================");
console.log("🧪 Starting Debug Mode Toggle & Network Panel Suppression Test");
console.log("====================================================");

// 1. Verify storage key constant
assert.strictEqual(
  DEBUG_MODE_STORAGE_KEY,
  "yt_debug_mode",
  "DEBUG_MODE_STORAGE_KEY must be 'yt_debug_mode'",
);
console.log("✅ PASS: DEBUG_MODE_STORAGE_KEY constant verified");

// 2. Mock localStorage environment to verify getDebugModeSetting / setDebugModeSetting
const mockStorage: Record<string, string> = {};
(global as any).window = {
  localStorage: {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
  },
};

// Default state must be true (ON by default)
delete mockStorage[DEBUG_MODE_STORAGE_KEY];
assert.strictEqual(
  getDebugModeSetting(),
  true,
  "Debug mode must strictly default to true (ON) when no storage key exists",
);
console.log("✅ PASS: getDebugModeSetting() defaults to true (ON)");

// Toggle OFF
setDebugModeSetting(false);
assert.strictEqual(mockStorage[DEBUG_MODE_STORAGE_KEY], "false");
assert.strictEqual(
  getDebugModeSetting(),
  false,
  "getDebugModeSetting() must return false when disabled",
);
console.log("✅ PASS: setDebugModeSetting(false) persisted and read correctly");

// Toggle ON
setDebugModeSetting(true);
assert.strictEqual(mockStorage[DEBUG_MODE_STORAGE_KEY], "true");
assert.strictEqual(
  getDebugModeSetting(),
  true,
  "getDebugModeSetting() must return true when enabled",
);
console.log("✅ PASS: setDebugModeSetting(true) persisted and read correctly");

// 3. Verify src/utils/appSettings.ts exports
const appSettingsPath = path.join(process.cwd(), "src/utils/appSettings.ts");
assert(fs.existsSync(appSettingsPath), "appSettings.ts must exist");
const appSettingsContent = fs.readFileSync(appSettingsPath, "utf8");
assert(
  appSettingsContent.includes('export const DEBUG_MODE_STORAGE_KEY = "yt_debug_mode"'),
  "appSettings.ts must export DEBUG_MODE_STORAGE_KEY",
);
assert(
  appSettingsContent.includes("export function getDebugModeSetting"),
  "appSettings.ts must export getDebugModeSetting",
);
assert(
  appSettingsContent.includes("export function setDebugModeSetting"),
  "appSettings.ts must export setDebugModeSetting",
);
console.log("✅ PASS: appSettings.ts exports validated");

// 4. Verify src/routes/index.tsx UI toggle and conditional suppression
const indexTsxPath = path.join(process.cwd(), "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

assert(
  indexContent.includes("getDebugModeSetting") && indexContent.includes("setDebugModeSetting"),
  "index.tsx must import getDebugModeSetting and setDebugModeSetting",
);

assert(
  indexContent.includes('id="debug-mode-toggle"') ||
    indexContent.includes('data-testid="debug-mode-toggle"'),
  "index.tsx must render debug-mode-toggle checkbox input",
);

assert(
  indexContent.includes("debugMode &&") && indexContent.includes("open-network-inspector-button"),
  "index.tsx must conditionally hide open-network-inspector-button when debugMode is false",
);

assert(
  indexContent.includes("debugMode &&") && indexContent.includes("<NetworkRequestsInspector"),
  "index.tsx must conditionally suppress NetworkRequestsInspector modal rendering when debugMode is false",
);

assert(
  indexContent.includes("setNetworkInspectorOpen(false)"),
  "index.tsx must close network inspector if debug mode is turned off",
);

console.log("✅ PASS: index.tsx UI toggle and conditional rendering verified");

console.log("====================================================");
console.log("🎉 All Debug Mode Toggle tests PASSED successfully!");
console.log("====================================================");
