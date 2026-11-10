import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Focus Mode: Hide Deprecated Relative Ratio Elements (Task 377)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");

const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

// Test 1: Selector 2 (deprecated badge) has 'hidden' class
console.log("\n[Test 1] Verifying Selector 2 (deprecated badge) has 'hidden' class...");
assert.ok(
  /<span[^>]*data-testid="tts-primary-secondary-deprecated-badge"[^>]*className="[^"]*hidden[^"]*"/.test(
    indexContent,
  ) ||
    /<span[^>]*className="[^"]*hidden[^"]*"[^>]*data-testid="tts-primary-secondary-deprecated-badge"/.test(
      indexContent,
    ),
  "tts-primary-secondary-deprecated-badge must be styled with 'hidden' class",
);
console.log("✅ PASS: Selector 2 (deprecated badge) is styled with 'hidden'.");

// Test 2: Selector 1 (relative ratio explanation text) has 'hidden' class
console.log("\n[Test 2] Verifying Selector 1 (explanation text span) has 'hidden' class...");
assert.ok(
  /<span[^>]*className="[^"]*hidden[^"]*"[^>]*>[\s\S]*?Primary leads; secondary languages speak relative to primary/.test(
    indexContent,
  ),
  "Explanation text span must be styled with 'hidden' class",
);
console.log("✅ PASS: Selector 1 (explanation text span) is styled with 'hidden'.");

// Test 3: Note container is styled with 'hidden'
console.log("\n[Test 3] Verifying container note has 'hidden' class...");
assert.ok(
  /<span[^>]*data-testid="tts-primary-secondary-ratio-note"[^>]*className="[^"]*hidden[^"]*"/.test(
    indexContent,
  ) ||
    /<span[^>]*className="[^"]*hidden[^"]*"[^>]*data-testid="tts-primary-secondary-ratio-note"/.test(
      indexContent,
    ),
  "tts-primary-secondary-ratio-note must be styled with 'hidden' class",
);
console.log("✅ PASS: Ratio note container is styled with 'hidden'.");

console.log("\n=========================================================================");
console.log("🎉 ALL TESTS PASSED: Deprecated relative ratio elements hidden successfully! (Task 377)");
console.log("=========================================================================");
