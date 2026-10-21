import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { ACCORDION_THEMES, PANELS } from "../src/config/accordionThemes";

console.log("====================================================");
console.log("🧪 Running Dedicated Verification: Theme Colors Consistency (Task 159)");
console.log("====================================================");

const rootDir = process.cwd();

// Test 1: BeginnerPlayerTab.tsx semantic theme tokens (zero hardcoded slate classes)
console.log("Test 1: BeginnerPlayerTab.tsx semantic theme tokens...");
const playerTabPath = path.resolve(rootDir, "src/components/beginner/tabs/BeginnerPlayerTab.tsx");
assert.ok(fs.existsSync(playerTabPath), "BeginnerPlayerTab.tsx must exist");
const playerTabContent = fs.readFileSync(playerTabPath, "utf-8");

assert.ok(
  !playerTabContent.includes("bg-slate-900") &&
    !playerTabContent.includes("bg-slate-950") &&
    !playerTabContent.includes("border-slate-800") &&
    !playerTabContent.includes("text-slate-300"),
  "BeginnerPlayerTab.tsx must not contain hardcoded slate classes (bg-slate-900, bg-slate-950, border-slate-800, text-slate-300)",
);
assert.ok(playerTabContent.includes("bg-card"), "BeginnerPlayerTab.tsx must use bg-card");
assert.ok(playerTabContent.includes("border-border"), "BeginnerPlayerTab.tsx must use border-border");
assert.ok(playerTabContent.includes("text-foreground"), "BeginnerPlayerTab.tsx must use text-foreground");
assert.ok(playerTabContent.includes("text-muted-foreground"), "BeginnerPlayerTab.tsx must use text-muted-foreground");
console.log("✅ PASS: BeginnerPlayerTab.tsx uses semantic theme tokens and zero hardcoded slate colors");

// Test 2: ModeSwitcherHeader.tsx semantic theme tokens (zero hardcoded slate classes)
console.log("Test 2: ModeSwitcherHeader.tsx semantic theme tokens...");
const modeSwitcherPath = path.resolve(rootDir, "src/components/ModeSwitcherHeader.tsx");
assert.ok(fs.existsSync(modeSwitcherPath), "ModeSwitcherHeader.tsx must exist");
const modeSwitcherContent = fs.readFileSync(modeSwitcherPath, "utf-8");

assert.ok(
  !modeSwitcherContent.includes("bg-slate-900") && !modeSwitcherContent.includes("border-slate-800"),
  "ModeSwitcherHeader.tsx must not contain hardcoded bg-slate-900 or border-slate-800",
);
assert.ok(modeSwitcherContent.includes("bg-card/90"), "ModeSwitcherHeader.tsx must use bg-card/90");
assert.ok(modeSwitcherContent.includes("border-border"), "ModeSwitcherHeader.tsx must use border-border");
assert.ok(modeSwitcherContent.includes("text-foreground"), "ModeSwitcherHeader.tsx must use text-foreground");
console.log("✅ PASS: ModeSwitcherHeader.tsx adapts seamlessly to all themes with semantic tokens");

// Test 3: BeginnerTabNav.tsx semantic theme tokens
console.log("Test 3: BeginnerTabNav.tsx semantic theme tokens...");
const tabNavPath = path.resolve(rootDir, "src/components/beginner/BeginnerTabNav.tsx");
assert.ok(fs.existsSync(tabNavPath), "BeginnerTabNav.tsx must exist");
const tabNavContent = fs.readFileSync(tabNavPath, "utf-8");
assert.ok(
  !tabNavContent.includes("bg-indigo-950/70") && !tabNavContent.includes("border-indigo-700/60"),
  "BeginnerTabNav.tsx must not hardcode dark indigo on switch-to-advanced button",
);
assert.ok(tabNavContent.includes("border-border"), "BeginnerTabNav.tsx must use border-border");
console.log("✅ PASS: BeginnerTabNav.tsx uses semantic tokens for responsive theming");

// Test 4: BeginnerParsingTab.tsx & BeginnerVideoTab.tsx theme responsiveness
console.log("Test 4: Parsing and Video tabs theme responsiveness...");
const parsingTabContent = fs.readFileSync(
  path.resolve(rootDir, "src/components/beginner/tabs/BeginnerParsingTab.tsx"),
  "utf-8",
);
assert.ok(parsingTabContent.includes("text-primary"), "BeginnerParsingTab must use text-primary");
assert.ok(
  parsingTabContent.includes("text-emerald-700 dark:text-emerald-300"),
  "BeginnerParsingTab apply button must have light/dark responsive emerald colors",
);

const videoTabContent = fs.readFileSync(
  path.resolve(rootDir, "src/components/beginner/tabs/BeginnerVideoTab.tsx"),
  "utf-8",
);
assert.ok(
  videoTabContent.includes("text-sky-700 dark:text-sky-300"),
  "BeginnerVideoTab sample captions button must have light/dark responsive sky colors",
);
console.log("✅ PASS: Parsing and Video tabs use theme-responsive colors");

// Test 5: CSS definition of .dark-blue and .dark themes
console.log("Test 5: CSS theme definitions in src/styles.css...");
const cssContent = fs.readFileSync(path.resolve(rootDir, "src/styles.css"), "utf-8");
assert.ok(cssContent.includes(".dark {"), "styles.css must define .dark");
assert.ok(cssContent.includes(".dark-blue {"), "styles.css must define .dark-blue");
assert.ok(cssContent.includes("--color-background: var(--background);"), "styles.css must map --color-background");
assert.ok(cssContent.includes("--color-card: var(--card);"), "styles.css must map --color-card");
console.log("✅ PASS: CSS theme tokens mapped correctly in styles.css");

// Test 6: Accordion themes integrity
console.log("Test 6: Accordion themes integrity in src/config/accordionThemes.ts...");
assert.strictEqual(PANELS.length, 6, "Must define 6 accordion panels");
for (const panel of PANELS) {
  const theme = ACCORDION_THEMES[panel.id];
  assert.ok(theme, `Theme for panel ${panel.id} must be defined`);
  assert.ok(theme.borderLeft.includes("border-l-4"), `Panel ${panel.id} must have border-l-4`);
  assert.ok(theme.summaryBg.includes("dark:"), `Panel ${panel.id} summaryBg must support dark mode`);
}
console.log("✅ PASS: Accordion themes define coherent styling across all panels");

console.log("====================================================");
console.log("🎉 ALL THEME COLORS CONSISTENCY TESTS PASSED!");
console.log("====================================================");
