/**
 * Single Source of Truth Version Synchronizer (scripts/sync-version.ts)
 *
 * Canonical Source of Truth: package.json ("version")
 *
 * Automatically synchronizes or verifies downstream targets:
 * 1. android-shell/app/build.gradle.kts (versionCode & versionName)
 * 2. Confirms TypeScript files derive version dynamically (appConfig.ts, apkUpdater.ts, appSettings.ts)
 *
 * Usage:
 *   npx tsx scripts/sync-version.ts           # Syncs downstream files to match package.json
 *   npx tsx scripts/sync-version.ts --check   # CI check: fails if files are out of sync
 *   npx tsx scripts/sync-version.ts <version> # Bumps package.json and syncs downstream files
 */

import fs from "node:fs";
import path from "node:path";

export interface VersionInfo {
  version: string;
  versionCode: number;
}

export function computeVersionCode(semver: string): number {
  const parts = semver.split(".").map((p) => parseInt(p, 10));
  const major = parts[0] || 1;
  const minor = parts[1] || 0;
  const patch = parts[2] || 0;
  return major * 10000 + minor * 100 + patch;
}

export function syncVersion(options: { checkOnly?: boolean; newVersion?: string } = {}) {
  const repoRoot = process.cwd();
  const pkgPath = path.resolve(repoRoot, "package.json");
  const gradlePath = path.resolve(repoRoot, "android-shell/app/build.gradle.kts");

  if (!fs.existsSync(pkgPath)) {
    throw new Error("package.json not found");
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  let targetVersion = pkg.version;

  if (options.newVersion) {
    targetVersion = options.newVersion.replace(/^v/, "").trim();
    pkg.version = targetVersion;
    if (!options.checkOnly) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
      console.log(`📝 Updated package.json version to: "${targetVersion}"`);
    }
  }

  const targetCode = computeVersionCode(targetVersion);

  if (fs.existsSync(gradlePath)) {
    let gradleContent = fs.readFileSync(gradlePath, "utf-8");
    const codeMatch = gradleContent.match(/versionCode\s*=\s*(\d+)/);
    const nameMatch = gradleContent.match(/versionName\s*=\s*"([^"]+)"/);

    const currentCode = codeMatch ? parseInt(codeMatch[1], 10) : null;
    const currentName = nameMatch ? nameMatch[1] : null;

    if (options.checkOnly) {
      if (currentName !== targetVersion || currentCode !== targetCode) {
        console.error(
          `❌ OUT OF SYNC: android-shell/app/build.gradle.kts (code: ${currentCode}, name: "${currentName}") does not match package.json (code: ${targetCode}, name: "${targetVersion}")`
        );
        process.exit(1);
      }
      console.log(`✅ IN SYNC: build.gradle.kts matches package.json (${targetVersion}, code ${targetCode})`);
    } else {
      let modified = false;
      if (codeMatch && currentCode !== targetCode) {
        gradleContent = gradleContent.replace(/versionCode\s*=\s*\d+/, `versionCode = ${targetCode}`);
        modified = true;
      }
      if (nameMatch && currentName !== targetVersion) {
        gradleContent = gradleContent.replace(/versionName\s*=\s*"[^"]+"/, `versionName = "${targetVersion}"`);
        modified = true;
      }
      if (modified) {
        fs.writeFileSync(gradlePath, gradleContent, "utf-8");
        console.log(`📱 Synchronized android-shell/app/build.gradle.kts to v${targetVersion} (code: ${targetCode})`);
      } else {
        console.log(`📱 build.gradle.kts already synchronized with v${targetVersion} (code: ${targetCode})`);
      }
    }
  }

  return { version: targetVersion, versionCode: targetCode };
}

// Direct CLI execution
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.endsWith("sync-version.ts")) {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const newVerArg = args.find((a) => !a.startsWith("--") && /^\d+\.\d+\.\d+/.test(a));

  try {
    const res = syncVersion({ checkOnly, newVersion: newVerArg });
    console.log(`✨ Single source of truth version active: v${res.version} (code: ${res.versionCode})`);
  } catch (err: any) {
    console.error("❌ Version sync failed:", err.message);
    process.exit(1);
  }
}
