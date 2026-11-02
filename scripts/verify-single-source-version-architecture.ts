/**
 * Dedicated test script: scripts/verify-single-source-version-architecture.ts
 *
 * Validates the Single Source of Truth versioning architecture:
 * 1. package.json is the authoritative single config file for project version.
 * 2. appConfig.ts dynamically imports package.json rather than maintaining hardcoded version strings.
 * 3. apkUpdater.ts dynamically derives CURRENT_APK_VERSION from APP_VERSION.
 * 4. appSettings.ts references APP_VERSION in AppStateSnapshot.
 * 5. scripts/sync-version.ts exists, synchronizes build.gradle.kts, and supports --check mode.
 * 6. .github/workflows/version-sync.yml workflow exists and executes version-sync.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";
import { computeVersionCode, syncVersion } from "./sync-version";

function run() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Single Source of Truth Versioning Architecture (Task 286)");
  console.log("=========================================================================");

  const repoRoot = process.cwd();

  // 1. Authoritative single place of truth in package.json
  console.log("--> [Test 1] Inspecting package.json as single source of truth...");
  const pkgPath = path.resolve(repoRoot, "package.json");
  assert(fs.existsSync(pkgPath), "package.json must exist at root");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert(typeof pkg.version === "string" && pkg.version.length > 0, "package.json must define version");
  console.log(`✅ PASS: package.json is authoritative version config (current: v${pkg.version})`);

  // 2. Dynamic in-code derivation in appConfig.ts
  console.log("--> [Test 2] Verifying dynamic import in src/config/appConfig.ts...");
  const appConfigPath = path.resolve(repoRoot, "src/config/appConfig.ts");
  const appConfigContent = fs.readFileSync(appConfigPath, "utf-8");
  assert(
    appConfigContent.includes("package.json") && appConfigContent.includes("APP_VERSION = packageJson.version"),
    "appConfig.ts must import package.json and dynamically assign APP_VERSION = packageJson.version",
  );
  assert.strictEqual(APP_VERSION, pkg.version, "Imported APP_VERSION must strictly match package.json version");
  console.log(`✅ PASS: src/config/appConfig.ts dynamically derives APP_VERSION from package.json ("${APP_VERSION}")`);

  // 3. Dynamic derivation in apkUpdater.ts
  console.log("--> [Test 3] Verifying dynamic derivation in src/utils/apkUpdater.ts...");
  const apkUpdaterPath = path.resolve(repoRoot, "src/utils/apkUpdater.ts");
  const apkUpdaterContent = fs.readFileSync(apkUpdaterPath, "utf-8");
  assert(
    apkUpdaterContent.includes("`v${APP_VERSION}`") || apkUpdaterContent.includes('"v" + APP_VERSION'),
    "apkUpdater.ts must dynamically derive CURRENT_APK_VERSION from APP_VERSION",
  );
  assert.strictEqual(CURRENT_APK_VERSION, `v${pkg.version}`, "CURRENT_APK_VERSION must match `v${pkg.version}`");
  console.log(`✅ PASS: src/utils/apkUpdater.ts dynamically derives CURRENT_APK_VERSION ("${CURRENT_APK_VERSION}")`);

  // 4. Dynamic reference in appSettings.ts
  console.log("--> [Test 4] Verifying dynamic reference in src/utils/appSettings.ts...");
  const appSettingsPath = path.resolve(repoRoot, "src/utils/appSettings.ts");
  const appSettingsContent = fs.readFileSync(appSettingsPath, "utf-8");
  assert(
    appSettingsContent.includes("version: APP_VERSION"),
    "appSettings.ts snapshot must reference APP_VERSION single source of truth",
  );
  console.log("✅ PASS: src/utils/appSettings.ts references APP_VERSION constant directly");

  // 5. Automated sync script capabilities
  console.log("--> [Test 5] Testing scripts/sync-version.ts logic and parity...");
  assert.strictEqual(computeVersionCode("2.0.85"), 20085, "computeVersionCode must correctly compute code");
  assert.strictEqual(computeVersionCode("1.2.3"), 10203, "computeVersionCode must correctly handle semver");
  const syncResult = syncVersion({ checkOnly: true });
  assert.strictEqual(syncResult.version, pkg.version, "syncVersion check must match active version");
  console.log(`✅ PASS: scripts/sync-version.ts verified in check mode (version: ${syncResult.version}, code: ${syncResult.versionCode})`);

  // 6. GitHub Action workflow
  console.log("--> [Test 6] Verifying GitHub Action workflow .github/workflows/version-sync.yml...");
  const workflowPath = path.resolve(repoRoot, ".github/workflows/version-sync.yml");
  assert(fs.existsSync(workflowPath), ".github/workflows/version-sync.yml must exist");
  const workflowContent = fs.readFileSync(workflowPath, "utf-8");
  assert(workflowContent.includes("scripts/sync-version.ts"), "Workflow must execute sync-version script");
  assert(!workflowContent.includes("schedule:"), "Workflow must not define cron schedule triggers");
  console.log("✅ PASS: .github/workflows/version-sync.yml verified with event-driven triggers");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED! Single Source of Truth Version Architecture verified.");
  console.log("=========================================================================");
}

run();
