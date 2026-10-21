/**
 * Dedicated Hotfix Verification Test:
 * Ensures Slider is properly imported and defined in src/routes/index.tsx,
 * eliminating the runtime ReferenceError: Slider is not defined crash.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Running Dedicated Hotfix Verification: Slider Import in src/routes/index.tsx");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: Check UI Slider Component exists and exports Slider
console.log("\n📦 Test 1: Verifying Slider UI component file...");
const sliderPath = path.join(rootDir, "src/components/ui/slider.tsx");
assert.ok(fs.existsSync(sliderPath), "src/components/ui/slider.tsx must exist");
const sliderContent = fs.readFileSync(sliderPath, "utf-8");
assert.ok(
  sliderContent.includes("export { Slider }") || sliderContent.includes("export const Slider ="),
  "src/components/ui/slider.tsx must export Slider",
);
console.log("✅ PASS: src/components/ui/slider.tsx verified and exports Slider.");

// Test 2: Check src/routes/index.tsx imports Slider from @/components/ui/slider
console.log("\n🚀 Test 2: Verifying Slider import in src/routes/index.tsx...");
const indexPath = path.join(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexContent.includes('import { Slider } from "@/components/ui/slider"') ||
  indexContent.includes('import { Slider') ||
  /import\s*\{[^}]*Slider[^}]*\}\s*from\s*["']@\/components\/ui\/slider["']/.test(indexContent),
  "src/routes/index.tsx must import Slider from @/components/ui/slider",
);
console.log("✅ PASS: src/routes/index.tsx imports Slider component correctly.");

// Test 3: Check that Slider is utilized with data-testid="lovable-tts-speed-slider"
console.log("\n🎛️ Test 3: Verifying Slider usage for Lovable TTS speed control...");
assert.ok(
  indexContent.includes('data-testid="lovable-tts-speed-slider"'),
  "src/routes/index.tsx must contain data-testid='lovable-tts-speed-slider'",
);
assert.ok(
  indexContent.includes("<Slider"),
  "src/routes/index.tsx must render <Slider",
);
console.log("✅ PASS: Slider is properly declared and utilized in index.tsx.");

console.log("\n=========================================================================");
console.log("🎉 ALL SLIDER IMPORT HOTFIX TESTS PASSED 100%!");
console.log("=========================================================================");
