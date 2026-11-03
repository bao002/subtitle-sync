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
  console.log("🧪 Verifying Vite Reload & Module Health (Hotfix Task 294)");
  console.log("=========================================================================");

  const targetModules = [
    "/src/styles.css",
    "/src/components/beginner/BeginnerFavoriteLanguageSelector.tsx",
    "/src/components/WebDemoUrlsInput.tsx",
    "/src/routes/index.tsx",
    "/src/components/ApkReleaseModal.tsx",
    "/src/components/FloatingSubtitleRetryIndicator.tsx",
    "/src/components/SubtitleRow.tsx",
    "/src/components/beginner/PerLanguageTtsPreferences.tsx",
    "/src/components/FloatingDraggablePauseButton.tsx",
    "/src/components/NewSubtitlesParserBar.tsx",
  ];

  // 1. Verify all 10 files exist on disk
  console.log("Check 1: Verifying all 10 target files exist on disk...");
  for (const modPath of targetModules) {
    const diskPath = path.resolve(process.cwd(), modPath.slice(1));
    assert.ok(fs.existsSync(diskPath), `File must exist on disk: ${diskPath}`);
    const content = fs.readFileSync(diskPath, "utf-8");
    assert.ok(!content.includes("<<<<<<<"), `File must not contain merge markers: ${modPath}`);
  }
  console.log("✓ Check 1 passed: All 10 files physically exist with valid content.");

  // 2. Verify BeginnerFavoriteLanguageSelector exports
  console.log("Check 2: Verifying BeginnerFavoriteLanguageSelector exports...");
  const beginnerSelectorSrc = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/beginner/BeginnerFavoriteLanguageSelector.tsx"),
    "utf-8",
  );
  assert.ok(
    beginnerSelectorSrc.includes("export function getDisplayLanguageName"),
    "Must export getDisplayLanguageName",
  );
  assert.ok(
    beginnerSelectorSrc.includes("export const BeginnerFavoriteLanguageSelector"),
    "Must export BeginnerFavoriteLanguageSelector",
  );
  console.log("✓ Check 2 passed: BeginnerFavoriteLanguageSelector properly implemented and exported.");

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
    // Crucial check: Module request must NOT return the index.html fallback
    if (modPath.endsWith(".tsx")) {
      assert.ok(
        !res.text.trim().startsWith("<!doctype html") && !res.text.trim().startsWith("<!DOCTYPE html"),
        `Dev server must transform ${modPath} as JavaScript/TypeScript, not fallback to index.html`,
      );
    }
    console.log(`  ✓ ${modPath}: 200 OK (transformed length: ${res.text.length} bytes)`);
  }
  console.log("✓ Check 3 passed: All 10 modules successfully transformed with 200 OK.");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Vite reload and missing modules completely resolved!");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
