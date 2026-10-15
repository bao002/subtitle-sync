/**
 * Verification test asserting full implementation of docs/versioning.md Section 5 mechanisms:
 * - Native Android safeguards (MainActivity.kt)
 * - Types declaration (src/types.ts)
 * - Version discrepancy detection and reset utilities (src/utils/apkUpdater.ts)
 * - Dual-version and in-app cache reset controls in UI (src/components/ApkReleaseModal.tsx)
 */

import * as fs from "fs";
import * as path from "path";
import { checkVersionDiscrepancy, clearOtaCacheAndReload } from "../src/utils/apkUpdater";

console.log("=========================================================================");
console.log("🧪 Verifying Implementation of docs/versioning.md Architecture & Recovery");
console.log("=========================================================================");

// Check 1: Verify MainActivity.kt Native Android Safeguards
console.log("--> [Check 1] Verifying MainActivity.kt Native Android Safeguards...");
const mainActivityPath = path.resolve(
  process.cwd(),
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf-8");

const requiredNativeSnippets = [
  "clearOtaCacheOnApkUpgrade()",
  "fun clearOtaCacheOnApkUpgrade()",
  "currentVersionCode > lastRunVersionCode",
  "otaDir.deleteRecursively()",
  '"Cache-Control" to "no-cache, no-store, must-revalidate"',
  '"Pragma" to "no-cache"',
  '"Expires" to "0"',
  "fun clearOtaCache(): Boolean",
];

for (const snippet of requiredNativeSnippets) {
  if (!mainActivityContent.includes(snippet)) {
    console.error(`❌ FAIL: Missing native snippet in MainActivity.kt: '${snippet}'`);
    process.exit(1);
  }
}
console.log("✅ PASS: MainActivity.kt native OTA cache purge and zero-cache headers verified.");

// Check 2: Verify src/types.ts AndroidNativeShell Typing
console.log("--> [Check 2] Verifying src/types.ts AndroidNativeShell Typing...");
const typesPath = path.resolve(process.cwd(), "src/types.ts");
const typesContent = fs.readFileSync(typesPath, "utf-8");

if (!typesContent.includes("clearOtaCache?: () => boolean;")) {
  console.error("❌ FAIL: Missing clearOtaCache in src/types.ts");
  process.exit(1);
}
console.log("✅ PASS: clearOtaCache typed on AndroidNativeShell interface in src/types.ts.");

// Check 3: Verify src/utils/apkUpdater.ts Exports
console.log("--> [Check 3] Verifying src/utils/apkUpdater.ts Exports...");
const apkUpdaterPath = path.resolve(process.cwd(), "src/utils/apkUpdater.ts");
const apkUpdaterContent = fs.readFileSync(apkUpdaterPath, "utf-8");

const requiredApkUpdaterExports = [
  "export interface VersionComparison",
  "export function checkVersionDiscrepancy()",
  "export function clearOtaCacheAndReload()",
];

for (const exp of requiredApkUpdaterExports) {
  if (!apkUpdaterContent.includes(exp)) {
    console.error(`❌ FAIL: Missing export in src/utils/apkUpdater.ts: '${exp}'`);
    process.exit(1);
  }
}

// Functional invocation in mock browser environment
const comparison = checkVersionDiscrepancy();
if (typeof comparison.isDiscrepancy !== "boolean" || typeof comparison.webVersion !== "string") {
  console.error("❌ FAIL: checkVersionDiscrepancy returned invalid object structure", comparison);
  process.exit(1);
}
console.log("✅ PASS: checkVersionDiscrepancy() and clearOtaCacheAndReload() verified.");

// Check 4: Verify src/components/ApkReleaseModal.tsx UI Elements
console.log("--> [Check 4] Verifying src/components/ApkReleaseModal.tsx UI Elements...");
const modalPath = path.resolve(process.cwd(), "src/components/ApkReleaseModal.tsx");
const modalContent = fs.readFileSync(modalPath, "utf-8");

const requiredModalElements = [
  'data-testid="version-architecture-card"',
  'data-testid="installed-shell-version"',
  'data-testid="active-web-version"',
  'data-testid="version-discrepancy-banner"',
  'data-testid="clear-ota-cache-btn"',
  "clearOtaCacheAndReload()",
];

for (const el of requiredModalElements) {
  if (!modalContent.includes(el)) {
    console.error(`❌ FAIL: Missing UI element in ApkReleaseModal.tsx: '${el}'`);
    process.exit(1);
  }
}
console.log(
  "✅ PASS: Dual-version presentation and 'Reset to Bundled Assets' UI controls verified.",
);

console.log("=========================================================================");
console.log("🎉 ALL VERSIONING DISCREPANCY IMPLEMENTATION CHECKS PASSED!");
console.log("=========================================================================");
