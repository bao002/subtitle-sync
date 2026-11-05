import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("=========================================================================");
console.log("🧪 Running Dedicated Verification: UI/UX Expert Design Polish (Task 306)");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: Typography and Google Fonts integration in index.html
console.log("\n--> [Test 1] Inspecting index.html typography configuration...");
const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf-8");
assert.ok(
  indexHtml.includes("family=Plus+Jakarta+Sans") && indexHtml.includes("family=JetBrains+Mono"),
  "index.html must load Plus Jakarta Sans for crisp UI display and JetBrains Mono for monospace data",
);
assert.ok(
  indexHtml.includes('class="dark dark-blue"'),
  "index.html must default to dark dark-blue Midnight theme",
);
console.log("✅ PASS: index.html typography and midnight theme classes verified.");

// Test 2: Design system tokens and studio utility classes in src/styles.css
console.log("\n--> [Test 2] Inspecting design tokens and studio classes in src/styles.css...");
const stylesCss = fs.readFileSync(path.join(rootDir, "src/styles.css"), "utf-8");
assert.ok(
  stylesCss.includes('--font-display: "Plus Jakarta Sans"') || stylesCss.includes('"Plus Jakarta Sans"'),
  "src/styles.css must map Plus Jakarta Sans in font theme stacks",
);
assert.ok(
  stylesCss.includes("--font-mono:"),
  "src/styles.css must configure tabular-compatible font-mono stack",
);
assert.ok(
  stylesCss.includes(".studio-glass") &&
    stylesCss.includes(".studio-card-elevated") &&
    stylesCss.includes(".studio-interactive-btn") &&
    stylesCss.includes(".studio-subtle-glow"),
  "src/styles.css must define modern studio glassmorphism and tactile interaction utility classes",
);
console.log("✅ PASS: Design system typography tokens and studio classes verified.");

// Test 3: Polished AccordionSection with rounded-xl, smooth transitions, and chevron animations
console.log("\n--> [Test 3] Inspecting AccordionSection layout and animation polish...");
const accordionSection = fs.readFileSync(path.join(rootDir, "src/components/AccordionSection.tsx"), "utf-8");
assert.ok(
  accordionSection.includes("rounded-xl") && accordionSection.includes("shadow-xs"),
  "AccordionSection must use rounded-xl with subtle shadow-xs depth",
);
assert.ok(
  accordionSection.includes("duration-200") && accordionSection.includes("rotate-180"),
  "AccordionSection chevron must support smooth 200ms transition rotation",
);
assert.ok(
  accordionSection.includes('data-testid={`accordion-bar-${id}`}'),
  "AccordionSection must preserve all required test IDs",
);
console.log("✅ PASS: AccordionSection modern card geometry and transitions verified.");

// Test 4: SubtitlesTablePanel table header elevation and backdrop blur
console.log("\n--> [Test 4] Inspecting SubtitlesTablePanel header styling...");
const tablePanel = fs.readFileSync(path.join(rootDir, "src/components/SubtitlesTablePanel.tsx"), "utf-8");
assert.ok(
  tablePanel.includes("backdrop-blur-md") && tablePanel.includes("bg-secondary/95"),
  "SubtitlesTablePanel must render sticky glassmorphic table header with backdrop-blur-md",
);
assert.ok(
  tablePanel.includes("uppercase text-muted-foreground"),
  "Table headers must follow editorial typographic tracking with uppercase text-muted-foreground",
);
console.log("✅ PASS: SubtitlesTablePanel header elevation and legibility verified.");

// Test 5: SubtitleRow active styling, tabular figures, and touch-friendly controls
console.log("\n--> [Test 5] Inspecting SubtitleRow speech feedback and timing figures...");
const subtitleRow = fs.readFileSync(path.join(rootDir, "src/components/SubtitleRow.tsx"), "utf-8");
assert.ok(
  subtitleRow.includes("tabular-nums") && subtitleRow.includes('data-testid="cue-row-timestamp"'),
  "SubtitleRow must format timestamp with tabular-nums for aligned columns",
);
assert.ok(
  subtitleRow.includes("transition-colors duration-150") && subtitleRow.includes("bg-primary/[0.08]"),
  "SubtitleRow must retain smooth active row transition and highlight",
);
assert.ok(
  subtitleRow.includes("active:scale-90") && subtitleRow.includes("Volume2"),
  "SubtitleRow speak cue action must provide tactile scale feedback",
);
console.log("✅ PASS: SubtitleRow alignment, active highlights, and feedback verified.");

// Test 6: SwitchableDefaultSubtitlesBar and LanguageBoxesSelector studio card elevation
console.log("\n--> [Test 6] Inspecting SwitchableDefaultSubtitlesBar & LanguageBoxesSelector cards...");
const switchableBar = fs.readFileSync(path.join(rootDir, "src/components/SwitchableDefaultSubtitlesBar.tsx"), "utf-8");
assert.ok(
  switchableBar.includes("rounded-xl") && switchableBar.includes("studio-card-elevated"),
  "SwitchableDefaultSubtitlesBar must use rounded-xl with studio-card-elevated styling",
);

const langBoxes = fs.readFileSync(path.join(rootDir, "src/components/LanguageBoxesSelector.tsx"), "utf-8");
assert.ok(
  langBoxes.includes("studio-card-elevated") && langBoxes.includes("min-h-[48px]"),
  "LanguageBoxesSelector must preserve min-h-[48px] touch targets with studio-card-elevated styling",
);
console.log("✅ PASS: Switchable bar and language cards elevation verified.");

// Test 7: Single source of truth version synchronization at 2.1.6
console.log("\n--> [Test 7] Verifying version 2.1.6 synchronization across all targets...");
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert.strictEqual(pkg.version, "2.1.6", "package.json must be 2.1.6");
assert.strictEqual(APP_VERSION, "2.1.6", "appConfig.ts APP_VERSION must match package.json (2.1.6)");
assert.strictEqual(CURRENT_APK_VERSION, "v2.1.6", "apkUpdater.ts CURRENT_APK_VERSION must match v2.1.6");

const buildGradle = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(buildGradle.includes('versionName = "2.1.6"'), "build.gradle.kts must have versionName = '2.1.6'");
assert.ok(buildGradle.includes("versionCode = 20106"), "build.gradle.kts must have versionCode = 20106");
console.log("✅ PASS: Single source of truth version 2.1.6 verified across all targets.");

console.log("\n=========================================================================");
console.log("🎉 ALL UI/UX DESIGN POLISH VERIFICATIONS PASSED (100%)!");
console.log("=========================================================================");
