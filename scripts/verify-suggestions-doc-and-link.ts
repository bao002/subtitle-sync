/**
 * Dedicated Verification Test for Task 164:
 * Document AGENTS.md Optimization Suggestions in docs/suggestions.md & Cross-Link from docs/tokens.md
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("=========================================================================");
console.log("🧪 Running Verification: Suggestions Doc & Tokens Link (Task 164)");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: Version parity (1.0.61)
console.log("Test 1: Version parity across manifests (1.0.61)...");
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert.strictEqual(pkg.version, "1.0.61", "package.json must be 1.0.61");
assert.strictEqual(APP_VERSION, "1.0.61", "APP_VERSION must be 1.0.61");
assert.strictEqual(CURRENT_APK_VERSION, "v1.0.61", "CURRENT_APK_VERSION must be v1.0.61");

const gradleContent = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert.ok(
  gradleContent.includes("10061") && gradleContent.includes('"1.0.61"'),
  "build.gradle.kts must have 10061 and 1.0.61",
);

const appSettingsContent = fs.readFileSync(
  path.resolve(rootDir, "src/utils/appSettings.ts"),
  "utf-8",
);
assert.ok(appSettingsContent.includes('"1.0.61"'), "appSettings.ts snapshot must be 1.0.61");
console.log("✅ PASS: Version 1.0.61 synchronized across all targets");

// Test 2: docs/suggestions.md existence and zero duplicate policy
console.log("Test 2: Auditing docs/suggestions.md file location...");
const suggestionsPath = path.resolve(rootDir, "docs/suggestions.md");
assert.ok(fs.existsSync(suggestionsPath), "docs/suggestions.md must exist under docs/*.md");
assert.ok(
  !fs.existsSync(path.resolve(rootDir, "suggestions.md")),
  "Root must NOT contain duplicate suggestions.md",
);
console.log("✅ PASS: docs/suggestions.md exists exclusively under docs/");

// Test 3: docs/suggestions.md content and feasibility analysis
console.log("Test 3: Auditing docs/suggestions.md content coverage...");
const suggestionsContent = fs.readFileSync(suggestionsPath, "utf-8");

assert.ok(
  suggestionsContent.includes("The 24KB Rule Limit") && suggestionsContent.includes("24,576 bytes"),
  "docs/suggestions.md must document the 24KB platform limit",
);
assert.ok(
  suggestionsContent.includes("Ordered by Urgency and Importance") ||
    suggestionsContent.includes("ordered hierarchically by urgency"),
  "docs/suggestions.md must order steps by urgency and importance",
);
assert.ok(
  suggestionsContent.includes("Priority 1") && suggestionsContent.includes("Critical"),
  "docs/suggestions.md must define Priority 1 as Critical",
);
assert.ok(
  suggestionsContent.includes("Bullet-proof") && suggestionsContent.includes("NOT Bullet-Proof"),
  "docs/suggestions.md must clearly distinguish bullet-proof steps from risky ones",
);
assert.ok(
  suggestionsContent.includes("PARTIALLY IMPLEMENT") ||
    suggestionsContent.includes("Partially Implement"),
  "docs/suggestions.md must recommend partial implementation for non-bullet-proof pipeline extraction",
);
assert.ok(
  suggestionsContent.includes("SKIP ENTIRELY") || suggestionsContent.includes("Skipped"),
  "docs/suggestions.md must recommend skipping prompt truncation",
);
assert.ok(
  suggestionsContent.includes("Decision Matrix"),
  "docs/suggestions.md must include a decision matrix summary",
);
console.log("✅ PASS: docs/suggestions.md content, rankings, and risk analyses verified");

// Test 4: Cross-linking from docs/tokens.md
console.log("Test 4: Auditing cross-linking in docs/tokens.md...");
const tokensPath = path.resolve(rootDir, "docs/tokens.md");
assert.ok(fs.existsSync(tokensPath), "docs/tokens.md must exist");
const tokensContent = fs.readFileSync(tokensPath, "utf-8");

assert.ok(
  tokensContent.includes("docs/suggestions.md") || tokensContent.includes("suggestions.md"),
  "docs/tokens.md must link to docs/suggestions.md",
);
assert.ok(
  tokensContent.includes("| `docs/suggestions.md`"),
  "docs/tokens.md Section 3 protocol table must include docs/suggestions.md",
);
console.log("✅ PASS: docs/tokens.md links to docs/suggestions.md");

// Test 5: Cataloging in docs/files.md
console.log("Test 5: Auditing docs/files.md inventory registration...");
const filesPath = path.resolve(rootDir, "docs/files.md");
const filesContent = fs.readFileSync(filesPath, "utf-8");
assert.ok(
  filesContent.includes("`docs/suggestions.md`"),
  "docs/files.md must inventory `docs/suggestions.md`",
);
console.log("✅ PASS: docs/files.md inventories docs/suggestions.md");

// Test 6: AGENTS.md byte size check (< 20KB)
console.log("Test 6: Auditing AGENTS.md byte size and headroom...");
const agentsPath = path.resolve(rootDir, "AGENTS.md");
const agentsStat = fs.statSync(agentsPath);
assert.ok(agentsStat.size < 20480, `AGENTS.md size must be < 20KB, got ${agentsStat.size} bytes`);
console.log(`✅ PASS: AGENTS.md is lean at ${agentsStat.size} bytes (< 20KB)`);

console.log("=========================================================================");
console.log("🎉 ALL Suggestions Doc & Tokens Link TESTS PASSED (100%)!");
console.log("=========================================================================");
