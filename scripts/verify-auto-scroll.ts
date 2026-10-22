import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getAutoScrollSetting,
  setAutoScrollSetting,
  AUTO_SCROLL_STORAGE_KEY,
  recordUserInteraction,
  getLastUserInteractionTimestamp,
  isAutoScrollAllowed,
  resetUserInteractionTimestamp,
  AUTO_SCROLL_COOLDOWN_MS,
} from "../src/utils/appSettings";

console.log("=========================================================================");
console.log("🧪 Starting Auto-Scroll & 5s Inactivity Cooldown Test Suite (Task 148)");
console.log("=========================================================================");

// Mock localStorage in Node environment
const storage = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, val: string) => storage.set(key, val),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
};

// Section 1: Default setting is OFF (false) & Persistence
console.log("\n📦 Section 1: Auto-Scroll Setting Persistence");
storage.clear();
const defaultVal = getAutoScrollSetting();
assert.equal(defaultVal, false, "Auto-scroll setting must default to false (OFF)");
console.log("✅ PASS: Default auto-scroll setting is OFF (false)");

setAutoScrollSetting(true);
assert.equal(getAutoScrollSetting(), true, "Should return true after enabling");
assert.equal(storage.get(AUTO_SCROLL_STORAGE_KEY), "true");
console.log("✅ PASS: setAutoScrollSetting(true) updates localStorage");

setAutoScrollSetting(false);
assert.equal(getAutoScrollSetting(), false, "Should return false after disabling");
assert.equal(storage.get(AUTO_SCROLL_STORAGE_KEY), "false");
console.log("✅ PASS: setAutoScrollSetting(false) updates localStorage");

storage.set(AUTO_SCROLL_STORAGE_KEY, "invalid_string");
assert.equal(getAutoScrollSetting(), false, "Invalid values must resolve to false");
console.log("✅ PASS: Invalid storage values fall back safely to false");

// Section 2: 5-Second Inactivity Cooldown Thresholds
console.log("\n⏳ Section 2: User Interaction Tracking & 5-Second Cooldown Gate");
resetUserInteractionTimestamp();
assert.equal(AUTO_SCROLL_COOLDOWN_MS, 5000, "Cooldown threshold must be exactly 5000ms");
assert.equal(getLastUserInteractionTimestamp(), 0, "Initial interaction timestamp should be 0");
assert.equal(
  isAutoScrollAllowed(),
  true,
  "Auto-scroll should be permitted before any user interaction occurs",
);
console.log("✅ PASS: Auto-scroll permitted when no interaction has occurred");

// User interacts at T=10,000
const interactionTime = 10000;
recordUserInteraction(interactionTime);
assert.equal(
  getLastUserInteractionTimestamp(),
  interactionTime,
  "Recorded interaction timestamp must match",
);

// Immediate check: at T=10,500 (500ms after interaction) -> blocked
assert.equal(
  isAutoScrollAllowed(10500),
  false,
  "Auto-scroll must be BLOCKED 500ms after user interaction (within 5s window)",
);
console.log("✅ PASS: Auto-scroll blocked at 500ms after user interaction");

// Check at T=12,500 (2.5s after interaction) -> still blocked
assert.equal(
  isAutoScrollAllowed(12500),
  false,
  "Auto-scroll must be BLOCKED 2.5s after user interaction (within 5s window)",
);
console.log("✅ PASS: Auto-scroll blocked at 2.5s after user interaction");

// Check at T=14,999 (4.999s after interaction) -> still blocked
assert.equal(
  isAutoScrollAllowed(14999),
  false,
  "Auto-scroll must be BLOCKED at 4999ms after user interaction",
);
console.log("✅ PASS: Auto-scroll blocked at 4999ms after user interaction");

// Check at T=15,000 (exactly 5s after interaction) -> PERMITTED
assert.equal(
  isAutoScrollAllowed(15000),
  true,
  "Auto-scroll must be PERMITTED after 5000ms of user inactivity",
);
console.log("✅ PASS: Auto-scroll permitted at exactly 5000ms after interaction");

// Check at T=20,000 (10s after interaction) -> PERMITTED
assert.equal(
  isAutoScrollAllowed(20000),
  true,
  "Auto-scroll must remain PERMITTED after 10s of user inactivity",
);
console.log("✅ PASS: Auto-scroll permitted at 10,000ms after interaction");

// New interaction at T=20,001 resets cooldown
recordUserInteraction(20001);
assert.equal(
  isAutoScrollAllowed(20500),
  false,
  "Auto-scroll must be immediately re-blocked upon fresh user interaction",
);
console.log("✅ PASS: Fresh interaction immediately resets 5s cooldown window");

// Section 3: Verify source code integration in src/routes/index.tsx
console.log("\n🔍 Section 3: Verification of Source Code Integration in src/routes/index.tsx");
const indexSource = fs.readFileSync(path.resolve(process.cwd(), "src/routes/index.tsx"), "utf-8");
assert(
  indexSource.includes("isAutoScrollAllowed"),
  "src/routes/index.tsx must gate auto-scroll with isAutoScrollAllowed",
);
assert(
  indexSource.includes("AUTO_SCROLL_COOLDOWN_MS"),
  "src/routes/index.tsx must import AUTO_SCROLL_COOLDOWN_MS",
);
assert(
  indexSource.includes("recordUserInteraction"),
  "src/routes/index.tsx must track user interactions with recordUserInteraction",
);
assert(
  indexSource.includes("pointerdown") && indexSource.includes("keydown"),
  "src/routes/index.tsx must listen to user interaction events (pointerdown, keydown, etc.)",
);
console.log("✅ PASS: src/routes/index.tsx contains complete 5s cooldown integration");

console.log("=========================================================================");
console.log("🎉 ALL AUTO-SCROLL & 5S COOLDOWN TESTS PASSED (100%)!");
console.log("=========================================================================");
