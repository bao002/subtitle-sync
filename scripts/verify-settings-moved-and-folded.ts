import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Settings Moved to Settings Stage & Folded Accordions (Task 376.1)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");

const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

// Test 1: Sub-Accordion 1 in Settings (settings-playback-accordion) is folded by default (no 'open' attribute)
console.log("\n[Test 1] Verifying settings-playback-accordion is folded by default...");
assert.ok(
  !/<details[^>]*open[^>]*data-testid="settings-playback-accordion"/.test(indexContent) &&
    !/<details[^>]*data-testid="settings-playback-accordion"[^>]*open/.test(indexContent),
  "settings-playback-accordion must NOT have 'open' attribute (must be folded by default)",
);
console.log("✅ PASS: settings-playback-accordion is folded by default.");

// Test 2: Sub-Accordion 5 (settings-subtitle-fetching-accordion) exists under Settings stage
console.log("\n[Test 2] Verifying settings-subtitle-fetching-accordion exists under Settings...");
assert.ok(
  indexContent.includes('data-testid="settings-subtitle-fetching-accordion"'),
  "Settings stage must have 'settings-subtitle-fetching-accordion'",
);
assert.ok(
  !/<details[^>]*open[^>]*data-testid="settings-subtitle-fetching-accordion"/.test(indexContent) &&
    !/<details[^>]*data-testid="settings-subtitle-fetching-accordion"[^>]*open/.test(indexContent),
  "settings-subtitle-fetching-accordion must NOT have 'open' attribute (must be folded by default)",
);
console.log("✅ PASS: settings-subtitle-fetching-accordion exists and is folded by default.");

// Test 3: Subtitle fetch pacing & automation settings controls exist inside Settings stage
console.log("\n[Test 3] Verifying pacing and automation settings inside Settings stage...");
assert.ok(
  indexContent.includes('data-testid="settings-fetch-window-seconds-input"'),
  "Settings stage must include settings-fetch-window-seconds-input",
);
assert.ok(
  indexContent.includes('data-testid="settings-auto-speak-on-fetch-toggle"'),
  "Settings stage must include settings-auto-speak-on-fetch-toggle",
);
assert.ok(
  indexContent.includes('data-testid="settings-speak-language-name-on-fetch-toggle"'),
  "Settings stage must include settings-speak-language-name-on-fetch-toggle",
);
console.log("✅ PASS: Pacing and automation settings present in Settings stage.");

// Test 4: In Stage 1 (Languages), the pacing input container is hidden
console.log("\n[Test 4] Verifying pacing control in Stage 1 is hidden...");
assert.ok(
  /<div\s+className="hidden[^"]*">[\s\S]*?id="fetch-window-seconds-input"/.test(indexContent),
  "Stage 1 pacing container must be hidden",
);
console.log("✅ PASS: Stage 1 pacing container is hidden.");

console.log("\n=========================================================================");
console.log("🎉 ALL TESTS PASSED: Settings moved to Settings and folded by default! (Task 376.1)");
console.log("=========================================================================");
