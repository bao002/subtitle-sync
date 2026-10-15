import fs from "fs";
import path from "path";

console.log("=========================================================================");
console.log("🧪 Verifying GitHub Actions -> GitHub Pages -> README Sync Documentation");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: Validate docs/operations/ACTIONS.md
console.log("--> [Test 1] Auditing docs/operations/ACTIONS.md...");
const actionsDocPath = path.join(rootDir, "docs", "operations", "ACTIONS.md");
if (!fs.existsSync(actionsDocPath)) {
  console.error("❌ FAIL: docs/operations/ACTIONS.md does not exist");
  process.exit(1);
}
const actionsContent = fs.readFileSync(actionsDocPath, "utf8");

const requiredActionsTokens = [
  "update-readme.yml",
  "integrity.yml",
  "End-to-End Pipeline: From GitHub Actions & GitHub Pages to README.md",
  "scanReadmeBrokenLinks",
  "<!-- CI_STATUS_INDICATOR_START -->",
  "<!-- CI_STATUS_INDICATOR_END -->",
  "AI FIX PROMPT",
  "Why Reports or Screencast Links May Initially Seem Broken",
  "[skip ci]",
  "gh-pages",
  "android-emulator-report.html",
];

for (const token of requiredActionsTokens) {
  if (!actionsContent.includes(token)) {
    console.error(`❌ FAIL: docs/operations/ACTIONS.md missing required concept: "${token}"`);
    process.exit(1);
  }
}
console.log("✅ PASS: docs/operations/ACTIONS.md contains full architectural documentation.");

// Test 2: Validate docs/self-verification.md
console.log("--> [Test 2] Auditing docs/self-verification.md...");
const selfVerifyPath = path.join(rootDir, "docs", "self-verification.md");
const selfVerifyContent = fs.readFileSync(selfVerifyPath, "utf8");

const requiredSelfVerifyTokens = [
  "Sanity Check 7: Automated README CI Status & Broken Link Synchronizer",
  "test:readme-error-indicator",
  "docs/operations/ACTIONS.md",
];

for (const token of requiredSelfVerifyTokens) {
  if (!selfVerifyContent.includes(token)) {
    console.error(`❌ FAIL: docs/self-verification.md missing required concept: "${token}"`);
    process.exit(1);
  }
}
console.log(
  "✅ PASS: docs/self-verification.md contains Sanity Check 7 and command matrix entries.",
);

// Test 3: Validate docs/android.md
console.log("--> [Test 3] Auditing docs/android.md...");
const androidDocPath = path.join(rootDir, "docs", "android.md");
const androidDocContent = fs.readFileSync(androidDocPath, "utf8");

const requiredAndroidTokens = [
  "Automated Status Reflection in `README.md`",
  "update-readme.yml",
  "workflow_run",
  "docs/operations/ACTIONS.md",
];

for (const token of requiredAndroidTokens) {
  if (!androidDocContent.includes(token)) {
    console.error(`❌ FAIL: docs/android.md missing required concept: "${token}"`);
    process.exit(1);
  }
}
console.log("✅ PASS: docs/android.md contains README reflection documentation.");

console.log("=========================================================================");
console.log("🎉 ALL ACTIONS -> PAGES -> README SYNC DOCUMENTATION AUDITS PASSED 100%!");
console.log("=========================================================================");
