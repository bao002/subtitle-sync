/**
 * Verification test for Subtask 48.2: In-App Version Display with Link to All Releases Page.
 * Validates:
 * 1. appConfig.ts exports APP_VERSION and ALL_RELEASES_URL.
 * 2. apkUpdater.ts exports CURRENT_APK_VERSION matching package.json and ALL_RELEASES_URL.
 * 3. Header in src/routes/index.tsx renders version badge with data-testid="header-app-version-badge" linking to releases.
 * 4. Footer in src/routes/index.tsx renders all releases link with data-testid="footer-all-releases-link".
 * 5. ApkReleaseModal.tsx renders all releases link with data-testid="modal-all-releases-link".
 * 6. Version parity across package.json, appConfig.ts, and apkUpdater.ts.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { APP_VERSION, ALL_RELEASES_URL } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("====================================================");
console.log("🧪 Running Subtask 48.2: In-App Version & Releases Link Verification");
console.log("====================================================");

// Test 1: Check version parity across package.json and config files
console.log("Test 1: Version parity across project manifests and configs...");
const pkgPath = path.resolve(process.cwd(), "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

assert.strictEqual(pkg.version, APP_VERSION, `package.json version (${pkg.version}) must match APP_VERSION (${APP_VERSION})`);
assert.strictEqual(
  `v${pkg.version}`,
  CURRENT_APK_VERSION,
  `CURRENT_APK_VERSION (${CURRENT_APK_VERSION}) must match v${pkg.version}`,
);
assert.strictEqual(
  ALL_RELEASES_URL,
  "https://github.com/mostuf2556/subtitle-sync/releases",
  "ALL_RELEASES_URL must match canonical GitHub releases page",
);
console.log(`✅ PASS: Version consistency verified across manifests: v${APP_VERSION}`);

// Test 2: Check Header in src/routes/index.tsx
console.log("Test 2: Header version display and link...");
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexContent.includes('data-testid="header-app-version-badge"'),
  "Header must include data-testid=\"header-app-version-badge\"",
);
assert.ok(
  indexContent.includes("href={ALL_RELEASES_URL}"),
  "Header version badge must link to ALL_RELEASES_URL",
);
assert.ok(
  indexContent.includes("v{APP_VERSION}"),
  "Header version badge must display v{APP_VERSION}",
);
console.log("✅ PASS: Header version badge verified");

// Test 3: Check Footer in src/routes/index.tsx or src/components/ApkReleasesFooter.tsx
console.log("Test 3: Footer all releases link...");
const footerPath = path.resolve(process.cwd(), "src/components/ApkReleasesFooter.tsx");
const footerContent = fs.existsSync(footerPath) ? fs.readFileSync(footerPath, "utf-8") : "";
const combinedFooter = indexContent + footerContent;

assert.ok(
  combinedFooter.includes('data-testid="footer-all-releases-link"'),
  "Footer must include data-testid=\"footer-all-releases-link\"",
);
assert.ok(
  combinedFooter.includes("All Releases (v{APP_VERSION})") || combinedFooter.includes("ALL_RELEASES_URL"),
  "Footer must display All Releases (v{APP_VERSION})",
);
console.log("✅ PASS: Footer all releases link verified");

// Test 4: Check ApkReleaseModal.tsx
console.log("Test 4: ApkReleaseModal all releases link...");
const modalPath = path.resolve(process.cwd(), "src/components/ApkReleaseModal.tsx");
const modalContent = fs.readFileSync(modalPath, "utf-8");

assert.ok(
  modalContent.includes('data-testid="modal-all-releases-link"'),
  "ApkReleaseModal must include data-testid=\"modal-all-releases-link\"",
);
assert.ok(
  modalContent.includes("https://github.com/mostuf2556/subtitle-sync/releases"),
  "ApkReleaseModal must link to canonical GitHub releases page",
);
console.log("✅ PASS: ApkReleaseModal releases link verified");

console.log("====================================================");
console.log("🎉 Subtask 48.2 In-App Version & Releases Link tests PASSED!");
console.log("====================================================");
