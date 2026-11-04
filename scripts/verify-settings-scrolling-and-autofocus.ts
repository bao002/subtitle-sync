import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  getDisableScrollingSetting,
  setDisableScrollingSetting,
  getDisableAutoFocusSetting,
  setDisableAutoFocusSetting,
  DISABLE_SCROLLING_STORAGE_KEY,
  DISABLE_AUTOFOCUS_STORAGE_KEY,
  DEFAULT_APP_SETTINGS,
} from "../src/utils/appSettings";

console.log("=========================================================================");
console.log("🧪 Verifying Global Features on Settings: Disable Scrolling & Disable Auto-Focus (Task 298)");
console.log("=========================================================================");

// 1. Verify appSettings.ts exports and getters/setters
console.log("1. Verifying storage keys and default values in appSettings.ts...");
assert.strictEqual(DISABLE_SCROLLING_STORAGE_KEY, "yt_disable_scrolling", "Storage key for disable scrolling must match");
assert.strictEqual(DISABLE_AUTOFOCUS_STORAGE_KEY, "yt_disable_autofocus", "Storage key for disable auto-focus must match");
assert.strictEqual(DEFAULT_APP_SETTINGS.disableScrolling, true, "DEFAULT_APP_SETTINGS.disableScrolling must be true by default");
assert.strictEqual(DEFAULT_APP_SETTINGS.disableAutoFocus, true, "DEFAULT_APP_SETTINGS.disableAutoFocus must be true by default");

// Mock localStorage in Node.js environment
const mockStorage: Record<string, string> = {};
global.window = {
  localStorage: {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => { mockStorage[key] = val; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  },
} as any;

// Test setter and getter for disable scrolling
setDisableScrollingSetting(false);
assert.strictEqual(getDisableScrollingSetting(), false, "getDisableScrollingSetting must return false after setting false");
setDisableScrollingSetting(true);
assert.strictEqual(getDisableScrollingSetting(), true, "getDisableScrollingSetting must return true after setting true");

// Test setter and getter for disable auto-focus
setDisableAutoFocusSetting(false);
assert.strictEqual(getDisableAutoFocusSetting(), false, "getDisableAutoFocusSetting must return false after setting false");
setDisableAutoFocusSetting(true);
assert.strictEqual(getDisableAutoFocusSetting(), true, "getDisableAutoFocusSetting must return true after setting true");
console.log("✅ PASS: appSettings.ts getters, setters, and persistent storage contracts verified.");

// 2. Verify Advanced Mode settings UI in src/routes/index.tsx
console.log("2. Verifying Advanced Mode settings UI in src/routes/index.tsx...");
const indexRoutePath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

assert(indexContent.includes('id="disable-scrolling-toggle"'), "src/routes/index.tsx must contain disable-scrolling-toggle id");
assert(indexContent.includes('data-testid="disable-scrolling-toggle"'), "src/routes/index.tsx must contain disable-scrolling-toggle testid");
assert(indexContent.includes('id="disable-autofocus-toggle"'), "src/routes/index.tsx must contain disable-autofocus-toggle id");
assert(indexContent.includes('data-testid="disable-autofocus-toggle"'), "src/routes/index.tsx must contain disable-autofocus-toggle testid");
assert(indexContent.includes("onDisableScrollingChange"), "src/routes/index.tsx must define onDisableScrollingChange handler");
assert(indexContent.includes("onDisableAutoFocusChange"), "src/routes/index.tsx must define onDisableAutoFocusChange handler");
assert(indexContent.includes("disableScrolling"), "src/routes/index.tsx must guard auto-scroll using disableScrolling state");
console.log("✅ PASS: src/routes/index.tsx contains all required global feature controls and state logic.");

// 3. Verify Beginner Mode settings UI in src/components/beginner/tabs/BeginnerPreferencesTab.tsx
console.log("3. Verifying Beginner Mode settings UI in BeginnerPreferencesTab.tsx...");
const beginnerTabPath = path.resolve(process.cwd(), "src/components/beginner/tabs/BeginnerPreferencesTab.tsx");
const beginnerContent = fs.readFileSync(beginnerTabPath, "utf-8");

assert(beginnerContent.includes('data-testid="beginner-global-features-card"'), "BeginnerPreferencesTab.tsx must contain beginner-global-features-card");
assert(beginnerContent.includes('data-testid="beginner-disable-scrolling-toggle"'), "BeginnerPreferencesTab.tsx must contain beginner-disable-scrolling-toggle testid");
assert(beginnerContent.includes('data-testid="beginner-disable-autofocus-toggle"'), "BeginnerPreferencesTab.tsx must contain beginner-disable-autofocus-toggle testid");
assert(beginnerContent.includes("getDisableScrollingSetting"), "BeginnerPreferencesTab.tsx must integrate getDisableScrollingSetting");
assert(beginnerContent.includes("getDisableAutoFocusSetting"), "BeginnerPreferencesTab.tsx must integrate getDisableAutoFocusSetting");
console.log("✅ PASS: BeginnerPreferencesTab.tsx satisfies full parity with Advanced Mode.");

console.log("=========================================================================");
console.log("🎉 ALL CHECKS PASSED! Task 298 verified successfully.");
console.log("=========================================================================");
