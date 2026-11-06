/**
 * Dedicated Automated Test: scripts/verify-github-actions-and-e2e-crash-detection.ts
 *
 * Verifies:
 * 1. GitHub Actions workflow alignment across all 10 expected workflows, specifically version-sync.yml & web.yml.
 * 2. Playwright web project configuration covers both web.spec.ts and emulation.spec.ts.
 * 3. E2E crash detection mechanisms in e2e/web.spec.ts and e2e/emulation.spec.ts (pageerror, APP_BOOT_ERROR, router-error-component).
 * 4. Root route ErrorComponent in src/routes/__root.tsx renders data-testid markers and logs [APP_BOOT_ERROR].
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Starting GitHub Actions & E2E Crash Detection Verification (Task 304)");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: GitHub Actions workflows alignment
console.log("\n--> [Test 1] Verifying GitHub Actions workflow suite...");
const workflowsDir = path.join(rootDir, ".github/workflows");
assert.ok(fs.existsSync(workflowsDir), ".github/workflows directory must exist");

const expectedWorkflows = [
  "android-system-smoke.yml",
  "deploy-demo.yml",
  "emulation.yml",
  "error-reporting.yml",
  "integrity.yml",
  "release-apk.yml",
  "report-video-flow.yml",
  "update-readme.yml",
  "version-sync.yml",
  "web.yml",
];
const actualWorkflows = fs.readdirSync(workflowsDir).sort();
assert.deepStrictEqual(
  actualWorkflows,
  expectedWorkflows.sort(),
  `Workflow set must match expected 10 workflows: ${expectedWorkflows.join(", ")}`,
);
console.log("✅ PASS: All 10 GitHub Actions workflows are present and aligned.");

// Test 2: web.yml executes Playwright suite
console.log("\n--> [Test 2] Verifying web.yml test execution parameters...");
const webYmlContent = fs.readFileSync(path.join(workflowsDir, "web.yml"), "utf-8");
assert.ok(
  webYmlContent.includes("npx playwright test"),
  "web.yml must execute Playwright test suite",
);
assert.ok(
  webYmlContent.includes('PROJECT_ARG="--project=${{ inputs.project || \'web\' }}"'),
  "web.yml must default to the 'web' project which covers web and emulation specs",
);
console.log("✅ PASS: web.yml correctly executes Playwright with project selection.");

// Test 3: playwright.config.ts project matching
console.log("\n--> [Test 3] Verifying playwright.config.ts project definitions...");
const playwrightConfig = fs.readFileSync(path.join(rootDir, "playwright.config.ts"), "utf-8");
assert.ok(
  playwrightConfig.includes("name: \"web\"") &&
    playwrightConfig.includes("testMatch: /.*(?:emulation|web)\\.spec\\.ts/"),
  "playwright.config.ts 'web' project must match both emulation and web specs",
);
console.log("✅ PASS: Playwright configuration links web and emulation suites under 'web'.");

// Test 4: E2E crash detection in web.spec.ts
console.log("\n--> [Test 4] Verifying crash recognition in e2e/web.spec.ts...");
const webSpecContent = fs.readFileSync(path.join(rootDir, "e2e/web.spec.ts"), "utf-8");
assert.ok(
  webSpecContent.includes('page.on("pageerror"') &&
    webSpecContent.includes("[APP_BOOT_ERROR]"),
  "e2e/web.spec.ts must attach listeners for pageerror and APP_BOOT_ERROR",
);
assert.ok(
  webSpecContent.includes('data-testid="router-error-component"') &&
    webSpecContent.includes("[APPLICATION_CRASH]"),
  "e2e/web.spec.ts must assert afterEach on router-error-component and fail on application crash",
);
assert.ok(
  webSpecContent.includes("e2e tests recognize application crashes and error boundary markers"),
  "e2e/web.spec.ts must contain dedicated test verifying crash recognition",
);
console.log("✅ PASS: e2e/web.spec.ts crash listeners, afterEach assertions, and dedicated test verified.");

// Test 5: E2E crash detection in emulation.spec.ts
console.log("\n--> [Test 5] Verifying crash recognition in e2e/emulation.spec.ts...");
const emulationSpecContent = fs.readFileSync(path.join(rootDir, "e2e/emulation.spec.ts"), "utf-8");
assert.ok(
  emulationSpecContent.includes('page.on("pageerror"') &&
    emulationSpecContent.includes("[APP_BOOT_ERROR]"),
  "e2e/emulation.spec.ts must attach listeners for pageerror and APP_BOOT_ERROR",
);
assert.ok(
  emulationSpecContent.includes('data-testid="router-error-component"') &&
    emulationSpecContent.includes("[APPLICATION_CRASH]"),
  "e2e/emulation.spec.ts must assert afterEach on router-error-component",
);
console.log("✅ PASS: e2e/emulation.spec.ts crash listeners and afterEach assertions verified.");

// Test 6: Root ErrorComponent telemetry & markers in src/routes/__root.tsx
console.log("\n--> [Test 6] Verifying Root ErrorComponent testids in src/routes/__root.tsx...");
const rootContent = fs.readFileSync(path.join(rootDir, "src/routes/__root.tsx"), "utf-8");
assert.ok(
  rootContent.includes('data-testid="router-error-component"'),
  "__root.tsx ErrorComponent must render data-testid='router-error-component'",
);
assert.ok(
  rootContent.includes('data-testid="router-error-title"'),
  "__root.tsx ErrorComponent must render data-testid='router-error-title'",
);
assert.ok(
  rootContent.includes('data-testid="router-error-description"'),
  "__root.tsx ErrorComponent must render data-testid='router-error-description'",
);
assert.ok(
  rootContent.includes("[APP_BOOT_ERROR] Router rendered ErrorComponent"),
  "__root.tsx ErrorComponent must log [APP_BOOT_ERROR]",
);
console.log("✅ PASS: Root ErrorComponent renders all required error markers and diagnostic logs.");

console.log("\n=========================================================================");
console.log("🎉 ALL GITHUB ACTIONS & E2E CRASH DETECTION CHECKS PASSED (100%)!");
console.log("=========================================================================");
