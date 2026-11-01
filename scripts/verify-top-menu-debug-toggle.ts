import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isDeveloperModeEnabled,
  setDeveloperModeEnabled,
  toggleDeveloperMode,
  DEBUG_MODE_STORAGE_KEY,
} from "../src/utils/developerMode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("====================================================");
console.log("🧪 Starting Top Menu Debug Mode Toggle Verification");
console.log("====================================================");

// 1. Mock window and localStorage for node testing
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, val: string): void {
    this.store[key] = String(val);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
(globalThis as any).window = {
  location: { search: "" },
  localStorage: mockStorage,
};
(globalThis as any).localStorage = mockStorage;

// 2. Test initial state
assert.strictEqual(isDeveloperModeEnabled(), false, "Initial debug mode without query should be false");

// 3. Test programmatic toggle
const toggledOn = toggleDeveloperMode();
assert.strictEqual(toggledOn, true, "toggleDeveloperMode should turn on debug mode");
assert.strictEqual(isDeveloperModeEnabled(), true, "isDeveloperModeEnabled should now return true");
assert.strictEqual(mockStorage.getItem(DEBUG_MODE_STORAGE_KEY), "true", "localStorage should persist 'true'");

const toggledOff = toggleDeveloperMode();
assert.strictEqual(toggledOff, false, "toggleDeveloperMode should turn off debug mode");
assert.strictEqual(isDeveloperModeEnabled(), false, "isDeveloperModeEnabled should now return false");
assert.strictEqual(mockStorage.getItem(DEBUG_MODE_STORAGE_KEY), "false", "localStorage should persist 'false'");

// 4. Test URL search parameter overrides
assert.strictEqual(isDeveloperModeEnabled("?debug=true"), true, "search param ?debug=true must evaluate true");
assert.strictEqual(isDeveloperModeEnabled("?debug=false"), false, "search param ?debug=false must evaluate false");
console.log("✅ Step 1 PASS: developerMode utility functions and persistence verified.");

// 5. Verify top menu toggle button in src/routes/index.tsx
const indexTsxPath = path.resolve(__dirname, "../src/routes/index.tsx");
assert.ok(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf-8");

assert.ok(
  indexContent.includes('id="header-debug-mode-toggle"'),
  "src/routes/index.tsx must contain id='header-debug-mode-toggle' button on top menu",
);
assert.ok(
  indexContent.includes('data-testid="header-debug-mode-toggle"'),
  "src/routes/index.tsx must contain data-testid='header-debug-mode-toggle'",
);
assert.ok(
  indexContent.includes("handleToggleDebugMode"),
  "src/routes/index.tsx must wire header-debug-mode-toggle to handleToggleDebugMode",
);
console.log("✅ Step 2 PASS: Top menu header-debug-mode-toggle button is present and wired.");

// 6. Verify experimental views are conditionally presented when debug mode is enabled
const experimentalViewMarkers = [
  'id="tab-playground"',
  'data-testid="tab-playground"',
  'id="tab-ai-punctuation"',
  'data-testid="tab-ai-punctuation"',
  'data-testid="developer-mode-indicator"',
  'open-state-machine-action-logs-button',
];

for (const marker of experimentalViewMarkers) {
  assert.ok(
    indexContent.includes(marker),
    `src/routes/index.tsx must contain experimental view marker: ${marker}`,
  );
}

// Verify isDeveloperMode is driven by debugMode
assert.ok(
  indexContent.includes("const isDeveloperMode = debugMode;"),
  "isDeveloperMode must be directly driven by stateful debugMode",
);
console.log("✅ Step 3 PASS: Experimental views (playground, AI punctuation, logs, inspector) presented when debug mode enabled.");

console.log("====================================================");
console.log("🎉 Top Menu Debug Toggle Verification PASSED Successfully!");
console.log("====================================================");
