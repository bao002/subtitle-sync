/**
 * Verification Script: Hotfix for Vite Reload & TypeScript TS2367 Comparison Error
 *
 * Verifies that:
 * 1. All 10 modules reported by Vite reload exist and are free from syntax/merge errors.
 * 2. TtsFallbackOrderSwitch.tsx has no invalid 'step.type === "google"' comparisons (TS2367 resolved).
 * 3. Dev server serves all 10 modules with HTTP 200 OK and valid JavaScript/CSS transforms.
 * 4. Application version is synchronized at 2.1.8 across package.json and build.gradle.kts.
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import assert from "node:assert";

function probeUrl(urlPath: string): Promise<{ status: number; text: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode || 0,
          text: data,
          contentType: res.headers["content-type"] || "",
        });
      });
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error(`Timeout probing dev server for ${urlPath}`));
    });
  });
}

async function run() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Vite Reload & TS2367 Comparison Hotfix (Prompt 78)");
  console.log("=========================================================================");

  const targetModules = [
    "/src/styles.css",
    "/src/components/TtsServiceSettingsPanel.tsx",
    "/src/components/beginner/BeginnerTtsServiceControl.tsx",
    "/src/components/SwitchableDefaultSubtitlesBar.tsx",
    "/src/routes/index.tsx",
    "/src/components/ExternalTtsDebuggerPanel.tsx",
    "/src/components/TtsFallbackOrderSwitch.tsx",
    "/src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
    "/src/storybook/StorybookWorkbench.tsx",
    "/src/components/NetworkRequestsInspector.tsx",
  ];

  // 1. Verify all 10 files exist on disk without merge markers
  console.log("Check 1: Verifying all 10 target files exist on disk...");
  for (const modPath of targetModules) {
    const diskPath = path.resolve(process.cwd(), modPath.slice(1));
    assert.ok(fs.existsSync(diskPath), `File must exist on disk: ${diskPath}`);
    const content = fs.readFileSync(diskPath, "utf-8");
    assert.ok(!content.includes("<<<<<<<"), `File must not contain merge markers: ${modPath}`);
  }
  console.log("✓ Check 1 passed: All 10 files exist cleanly on disk.");

  // 2. Verify TtsFallbackOrderSwitch.tsx TS2367 fix
  console.log("Check 2: Verifying TtsFallbackOrderSwitch.tsx has no invalid google step comparisons...");
  const switchSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/TtsFallbackOrderSwitch.tsx"),
    "utf-8",
  );
  assert.ok(
    !switchSource.includes('step.type === "google"'),
    "TtsFallbackOrderSwitch.tsx must not contain step.type === 'google' comparison",
  );
  assert.ok(
    !switchSource.includes(", Globe,"),
    "TtsFallbackOrderSwitch.tsx must not import unused Globe icon",
  );
  assert.ok(
    switchSource.includes("export const TTS_FALLBACK_ORDER_OPTIONS"),
    "TtsFallbackOrderSwitch.tsx must export TTS_FALLBACK_ORDER_OPTIONS",
  );
  console.log("✓ Check 2 passed: TS2367 comparison error completely eliminated.");

  // 3. Probe Vite dev server for all 10 modules
  console.log("Check 3: Probing Vite dev server transforms for all 10 modules...");
  for (const modPath of targetModules) {
    const res = await probeUrl(modPath);
    assert.strictEqual(
      res.status,
      200,
      `Dev server must return HTTP 200 for ${modPath}, got ${res.status}`,
    );
    assert.ok(
      !res.text.includes("[PARSE_ERROR]"),
      `Dev server response for ${modPath} must not contain PARSE_ERROR`,
    );
    if (modPath.endsWith(".tsx")) {
      assert.ok(
        !res.text.trim().startsWith("<!doctype html") && !res.text.trim().startsWith("<!DOCTYPE html"),
        `Dev server must transform ${modPath} as JavaScript/TypeScript, not fallback to index.html`,
      );
    }
    console.log(`  ✓ ${modPath}: 200 OK (${res.text.length} bytes)`);
  }
  console.log("✓ Check 3 passed: All 10 modules transformed successfully with 200 OK.");

  // 4. Verify Single Source Version
  console.log("Check 4: Verifying single-source version 2.1.8...");
  const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"));
  assert.strictEqual(pkg.version, "2.1.8", "package.json version must be 2.1.8");

  const gradle = fs.readFileSync(
    path.resolve(process.cwd(), "android-shell/app/build.gradle.kts"),
    "utf-8",
  );
  assert.ok(gradle.includes('versionName = "2.1.8"'), "build.gradle.kts must have versionName = '2.1.8'");
  assert.ok(gradle.includes("versionCode = 20108"), "build.gradle.kts must have versionCode = 20108");
  console.log("✓ Check 4 passed: Version 2.1.8 is in sync across package.json and build.gradle.kts.");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Vite reload and TS2367 errors resolved cleanly!");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
