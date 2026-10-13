/**
 * Verification test for docs/versioning.md:
 * APK Version vs. WebView Version Discrepancies Architecture & Recovery Flow
 */

import * as fs from "fs";
import * as path from "path";

console.log("=========================================================================");
console.log("🧪 Verifying docs/versioning.md APK vs WebView Version Discrepancy Guide");
console.log("=========================================================================");

const versioningDocPath = path.resolve(process.cwd(), "docs/versioning.md");

if (!fs.existsSync(versioningDocPath)) {
  console.error(`❌ FAIL: ${versioningDocPath} does not exist.`);
  process.exit(1);
}

const content = fs.readFileSync(versioningDocPath, "utf-8");

// Check 1: Verify Section 5 Presence and Dual-Layer Architecture
console.log("--> [Check 1] Verifying Section 5 and Dual-Layer Hybrid Architecture...");
const requiredSection5Headings = [
  "## 5. APK Version vs. WebView Version Discrepancies: Architecture, Causes & Recovery",
  "### 5.1 Root Causes of APK vs. WebView Version Divergence",
  "### 5.2 Diagnostic Workflow: How to Detect Version Discrepancies",
  "### 5.3 Architectural Solutions & Automated Native Safeguards",
  "### 5.4 Step-by-Step Recovery Procedures",
];

for (const heading of requiredSection5Headings) {
  if (!content.includes(heading)) {
    console.error(`❌ FAIL: Missing required heading: "${heading}"`);
    process.exit(1);
  }
}

const requiredArchitectureKeywords = [
  "Native APK Container Layer",
  "Embedded WebView SPA Layer",
  "AndroidNativeShell",
  "getAppVersionName()",
  "getActiveAppVersion()",
  "context.filesDir/app_updates/",
];

for (const kw of requiredArchitectureKeywords) {
  if (!content.includes(kw)) {
    console.error(`❌ FAIL: Missing architecture keyword: "${kw}"`);
    process.exit(1);
  }
}
console.log("✅ PASS: Section 5 and Dual-Layer Architecture definitions verified.");

// Check 2: Verify 5 Distinct Root Causes
console.log("--> [Check 2] Verifying the 5 Root Causes of Discrepancies...");
const rootCauses = [
  "Root Cause 1: Stale Bundled Web Assets During APK Compilation",
  "Root Cause 2: Active OTA Hot Update Bundle",
  "Root Cause 3: Lingering Stale OTA Cache After Native APK Upgrade",
  "Root Cause 4: Static Fallback Hardcoding vs Dynamic Bridge Querying",
  "Root Cause 5: Live Development Server / Remote Endpoint Loading",
];

for (const rc of rootCauses) {
  if (!content.includes(rc)) {
    console.error(`❌ FAIL: Missing root cause: "${rc}"`);
    process.exit(1);
  }
}
console.log("✅ PASS: All 5 Root Causes comprehensively documented.");

// Check 3: Verify Diagnostic Workflow & ADB Terminal Commands
console.log("--> [Check 3] Verifying Diagnostic Workflow & ADB Commands...");
const diagnosticKeywords = [
  "adb shell dumpsys package com.ytviewer.app",
  "run-as com.ytviewer.app",
  "adb logcat",
  "checkVersionDiscrepancy",
];

for (const kw of diagnosticKeywords) {
  if (!content.includes(kw)) {
    console.error(`❌ FAIL: Missing diagnostic element: "${kw}"`);
    process.exit(1);
  }
}
console.log("✅ PASS: Diagnostics and ADB terminal commands verified.");

// Check 4: Verify Architectural Solutions & Native Safeguards
console.log("--> [Check 4] Verifying Architectural Solutions & Native Safeguards...");
const safeguardKeywords = [
  "clearOtaCacheOnApkUpgrade",
  "last_run_version_code",
  "currentVersionCode > lastRunVersionCode",
  "Cache-Control",
  "no-cache, no-store, must-revalidate",
  "npm run build",
  "assembleDebug",
];

for (const kw of safeguardKeywords) {
  if (!content.includes(kw)) {
    console.error(`❌ FAIL: Missing safeguard keyword: "${kw}"`);
    process.exit(1);
  }
}
console.log("✅ PASS: Architectural solutions and automated native safeguards verified.");

// Check 5: Verify Step-by-Step Recovery Procedures
console.log("--> [Check 5] Verifying Step-by-Step Recovery Procedures...");
const recoveryProcedures = [
  "Procedure A: User In-App Recovery (Zero Reinstall)",
  "Procedure B: Developer ADB One-Line Clean",
  "Procedure C: Complete Clean Rebuild & Reinstall",
  "adb shell pm clear com.ytviewer.app",
  "update.apk.sh",
];

for (const rp of recoveryProcedures) {
  if (!content.includes(rp)) {
    console.error(`❌ FAIL: Missing recovery procedure element: "${rp}"`);
    process.exit(1);
  }
}
console.log("✅ PASS: Step-by-step recovery procedures verified.");

// Check 6: Functional simulation of version discrepancy resolution
console.log("--> [Check 6] Simulating Version Discrepancy Detection Logic...");
function evaluateVersionDiscrepancy(
  apkVersion: string,
  webVersion: string,
  otaTag: string | null
): { isDiscrepancy: boolean; isOtaActive: boolean; isStaleOtaCache: boolean } {
  const isOtaActive = Boolean(otaTag);
  const cleanApk = apkVersion.replace(/^v/, "");
  const cleanWeb = webVersion.replace(/^v/, "");
  const cleanOta = otaTag ? otaTag.replace(/^v/, "") : null;

  const isDiscrepancy = cleanApk !== cleanWeb;
  const isStaleOtaCache = Boolean(cleanOta && cleanApk > cleanOta);

  return { isDiscrepancy, isOtaActive, isStaleOtaCache };
}

// Case 1: In sync
const case1 = evaluateVersionDiscrepancy("1.0.16", "v1.0.16", null);
if (case1.isDiscrepancy !== false || case1.isOtaActive !== false) {
  console.error("❌ FAIL: In-sync scenario failed", case1);
  process.exit(1);
}

// Case 2: OTA hot update active
const case2 = evaluateVersionDiscrepancy("1.0.16", "v1.0.17", "v1.0.17");
if (case2.isDiscrepancy !== true || case2.isOtaActive !== true || case2.isStaleOtaCache !== false) {
  console.error("❌ FAIL: OTA hot update scenario failed", case2);
  process.exit(1);
}

// Case 3: APK upgraded but stale OTA remains
const case3 = evaluateVersionDiscrepancy("1.0.18", "v1.0.17", "v1.0.17");
if (case3.isDiscrepancy !== true || case3.isStaleOtaCache !== true) {
  console.error("❌ FAIL: Stale OTA scenario failed", case3);
  process.exit(1);
}

console.log("✅ PASS: Version discrepancy detection logic behaves accurately.");

console.log("=========================================================================");
console.log("🎉 ALL VERSION DISCREPANCY DOCUMENTATION & LOGIC CHECKS PASSED!");
console.log("=========================================================================");
