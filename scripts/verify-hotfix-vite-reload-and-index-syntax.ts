import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

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
  console.log("🧪 Verifying Hotfix: Vite Reload Failure & Undeclared Identifiers in index.tsx");
  console.log("=========================================================================");

  const rootDir = process.cwd();

  // 1. Audit src/routes/index.tsx for undeclared identifiers
  console.log("\n[1] Checking src/routes/index.tsx for syntax and undeclared identifiers...");
  const indexSource = fs.readFileSync(path.resolve(rootDir, "src/routes/index.tsx"), "utf8");

  // Verify launch-canvas-balloon-game-btn uses isVideoPlaying and pauseBothVideoAndTts
  assert.ok(
    !indexSource.includes("if (isPlaying) {\n                                    handlePause();"),
    "index.tsx must not contain undeclared 'if (isPlaying) { handlePause(); }'",
  );
  assert.ok(
    indexSource.includes("if (isVideoPlaying) {\n                                    pauseBothVideoAndTts();"),
    "index.tsx must use isVideoPlaying and pauseBothVideoAndTts() for canvas balloon game button",
  );
  console.log("  ✓ Undeclared identifiers resolved in index.tsx");

  // 2. Audit exports from playback-preferences.ts and speechVoiceUtils.ts
  console.log("\n[2] Checking exports from playback-preferences.ts and speechVoiceUtils.ts...");
  const playbackPrefsSource = fs.readFileSync(
    path.resolve(rootDir, "src/lib/playback-preferences.ts"),
    "utf8",
  );
  assert.ok(
    playbackPrefsSource.includes("export function getDefaultLanguageTtsRate"),
    "playback-preferences.ts must export getDefaultLanguageTtsRate",
  );

  const speechVoiceSource = fs.readFileSync(
    path.resolve(rootDir, "src/utils/speechVoiceUtils.ts"),
    "utf8",
  );
  assert.ok(
    speechVoiceSource.includes("export function getSampleTextForLanguage"),
    "speechVoiceUtils.ts must export getSampleTextForLanguage",
  );
  console.log("  ✓ Both required functions are explicitly exported");

  // 3. Audit all 10 reported modules for file existence on disk
  console.log("\n[3] Auditing all 10 reported error modules on disk...");
  const reportedModules = [
    "/src/routes/index.tsx",
    "/src/lib/playback-preferences.ts",
    "/src/components/beginner/PerLanguageTtsPreferences.tsx",
    "/src/utils/speechVoiceUtils.ts",
    "/src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
    "/src/components/TtsServiceSettingsPanel.tsx",
    "/src/components/ExperimentalSubtitleFetchPanel.tsx",
    "/src/components/AiSubtitlePunctuationTab.tsx",
    "/src/components/FetchedSubtitlesStagePanel.tsx",
    "/src/components/NetworkRequestsInspector.tsx",
  ];

  for (const modPath of reportedModules) {
    const diskPath = path.resolve(rootDir, modPath.slice(1));
    assert.ok(fs.existsSync(diskPath), `Module must exist on disk: ${diskPath}`);
    const stat = fs.statSync(diskPath);
    assert.ok(stat.size > 0, `Module file must not be empty: ${diskPath}`);
    console.log(`  ✓ ${modPath} (${stat.size} bytes)`);
  }

  // 4. Probe Vite dev server for all 10 modules
  console.log("\n[4] Probing dev server transforms for all 10 modules...");
  for (const modPath of reportedModules) {
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
    assert.ok(
      !res.text.trim().startsWith("<!doctype html") && !res.text.trim().startsWith("<!DOCTYPE html"),
      `Dev server must transform ${modPath} as JS/TS module, not fallback to index.html`,
    );
    console.log(`  ✓ ${modPath}: 200 OK (${res.text.length} bytes transformed)`);
  }

  console.log("\n=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Vite reload and identifier errors completely resolved!");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
