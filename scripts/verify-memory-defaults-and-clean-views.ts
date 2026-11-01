import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {
  DEBUG_MODE_STORAGE_KEY,
  getDebugModeSetting,
  setDebugModeSetting,
  QUICK_LOADER_STORAGE_KEY,
  getQuickLoaderSetting,
  setQuickLoaderSetting,
  VERSION_DETAILS_STORAGE_KEY,
  getVersionDetailsSetting,
  setVersionDetailsSetting,
} from "../src/utils/appSettings";

console.log("==================================================================");
console.log("🧪 Testing Memory Defaults, Clean Views, Quick-Loader & Version Toggles");
console.log("==================================================================");

const rootDir = process.cwd();

// 1. Verify docs/memory.md existence and schema content
console.log("Test 1: docs/memory.md documentation verification...");
const memoryDocPath = path.join(rootDir, "docs/memory.md");
assert.ok(fs.existsSync(memoryDocPath), "docs/memory.md must exist under docs/*.md");
const memoryDocContent = fs.readFileSync(memoryDocPath, "utf-8");
assert.ok(
  memoryDocContent.includes("defaults: boolean") && memoryDocContent.includes("localstorage: boolean"),
  "docs/memory.md must document 'defaults: boolean' and 'localstorage: boolean' schema",
);
assert.ok(
  memoryDocContent.includes("yt_debug_mode") && memoryDocContent.includes("present-on-start: off"),
  "docs/memory.md must document debug mode present-on-start: off",
);
assert.ok(
  memoryDocContent.includes("yt_show_version_details") && memoryDocContent.includes("version-button"),
  "docs/memory.md must document version details element and version-button toggle",
);
assert.ok(
  memoryDocContent.includes("quick-subtitles-and-video-loader") &&
    memoryDocContent.includes("quick-loader-button"),
  "docs/memory.md must document quick-subtitles-and-video-loader and quick-loader-button",
);
console.log("✅ PASS: docs/memory.md verified");

// 2. Mock localStorage and test memory defaults
console.log("Test 2: Memory defaults in appSettings...");
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

// 2.1 Debug mode setting defaults to false (OFF)
delete mockStorage[DEBUG_MODE_STORAGE_KEY];
assert.strictEqual(
  getDebugModeSetting(),
  false,
  "getDebugModeSetting() must return false (OFF) when unset in localStorage",
);
setDebugModeSetting(true);
assert.strictEqual(mockStorage[DEBUG_MODE_STORAGE_KEY], "true");
assert.strictEqual(getDebugModeSetting(), true);
setDebugModeSetting(false);
assert.strictEqual(mockStorage[DEBUG_MODE_STORAGE_KEY], "false");
assert.strictEqual(getDebugModeSetting(), false);
console.log("✅ PASS: Debug mode default and persistence verified (present-on-start: off, local storage: off)");

// 2.2 Quick loader setting defaults to false (OFF)
delete mockStorage[QUICK_LOADER_STORAGE_KEY];
assert.strictEqual(
  getQuickLoaderSetting(),
  false,
  "getQuickLoaderSetting() must return false (OFF) when unset in localStorage",
);
setQuickLoaderSetting(true);
assert.strictEqual(mockStorage[QUICK_LOADER_STORAGE_KEY], "true");
assert.strictEqual(getQuickLoaderSetting(), true);
setQuickLoaderSetting(false);
assert.strictEqual(mockStorage[QUICK_LOADER_STORAGE_KEY], "false");
assert.strictEqual(getQuickLoaderSetting(), false);
console.log("✅ PASS: Quick loader default and persistence verified (hidden by default)");

// 2.3 Version details setting defaults to false (OFF)
delete mockStorage[VERSION_DETAILS_STORAGE_KEY];
assert.strictEqual(
  getVersionDetailsSetting(),
  false,
  "getVersionDetailsSetting() must return false (OFF) when unset in localStorage",
);
setVersionDetailsSetting(true);
assert.strictEqual(mockStorage[VERSION_DETAILS_STORAGE_KEY], "true");
assert.strictEqual(getVersionDetailsSetting(), true);
setVersionDetailsSetting(false);
assert.strictEqual(mockStorage[VERSION_DETAILS_STORAGE_KEY], "false");
assert.strictEqual(getVersionDetailsSetting(), false);
console.log("✅ PASS: Version details default and persistence verified (present-on-start: off, local storage: off)");

// 3. Verify src/routes/index.tsx UI elements
console.log("Test 3: UI elements in src/routes/index.tsx...");
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexTsxPath, "utf-8");

// 3.1 Quick loader button and container
assert.ok(
  indexContent.includes('id="quick-loader-button"') || indexContent.includes('data-testid="quick-loader-button"'),
  "index.tsx must render quick-loader-button",
);
assert.ok(
  indexContent.includes('quick-loader'),
  "quick-loader button must have label text 'quick-loader'",
);
assert.ok(
  indexContent.includes("showQuickLoader"),
  "index.tsx must track showQuickLoader state",
);

// 3.2 WebDemoUrlsInput has id="quick-subtitles-and-video-loader"
const webDemoInputPath = path.join(rootDir, "src/components/WebDemoUrlsInput.tsx");
const webDemoInputContent = fs.readFileSync(webDemoInputPath, "utf-8");
assert.ok(
  webDemoInputContent.includes('id="quick-subtitles-and-video-loader"'),
  "WebDemoUrlsInput must have id='quick-subtitles-and-video-loader'",
);
assert.ok(
  webDemoInputContent.includes('data-testid="quick-subtitles-and-video-loader"'),
  "WebDemoUrlsInput must have data-testid='quick-subtitles-and-video-loader'",
);
console.log("✅ PASS: Quick subtitles and video loader button and container verified");

// 3.3 Version button and parent container
assert.ok(
  indexContent.includes('id="version-button"') && indexContent.includes('data-testid="version-button"'),
  "index.tsx must render version-button",
);
assert.ok(
  indexContent.includes('id="version-details-container"') &&
    indexContent.includes('data-testid="version-details-container"'),
  "index.tsx must wrap version details in version-details-container",
);
assert.ok(
  indexContent.includes("showVersionDetails"),
  "index.tsx must manage showVersionDetails state",
);
console.log("✅ PASS: Version button and version details parent element toggle verified");

// 3.4 Raw video data element removal
assert.strictEqual(
  indexContent.includes('data-testid="top-screen-video-caption-status"'),
  false,
  "top-screen-video-caption-status must be removed from header in index.tsx",
);
assert.strictEqual(
  indexContent.includes("sections · live"),
  false,
  "Raw video sections and live caption text must be removed from header",
);
console.log("✅ PASS: Raw video data element removed cleanly");

console.log("==================================================================");
console.log("🎉 ALL Memory Defaults, Clean Views & UI Toggle Tests PASSED!");
console.log("==================================================================");
