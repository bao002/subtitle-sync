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
  console.log("🧪 Verifying Vite Reload & Module Health (Hotfix Prompt 161)");
  console.log("=========================================================================");

  const targetModules = [
    "/src/styles.css",
    "/src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
    "/src/components/AiSubtitlePunctuationTab.tsx",
    "/src/components/TtsServiceSettingsPanel.tsx",
    "/src/components/NetworkRequestsInspector.tsx",
    "/src/components/LanguageBoxesSelector.tsx",
    "/src/components/beginner/BeginnerFlowContainer.tsx",
    "/src/routes/index.tsx",
    "/src/components/beginner/PerLanguageTtsPreferences.tsx",
    "/src/components/WebDemoUrlsInput.tsx",
    "/src/components/FetchedSubtitlesStagePanel.tsx",
    "/src/components/ApkReleaseModal.tsx",
    "/src/components/ShareStateModal.tsx",
    "/src/components/FloatingErrorButton.tsx",
    "/src/components/StateMachineActionLogsInspector.tsx",
    "/src/components/BottomLogViewer.tsx",
    "/src/components/CriticalCaptionsAlert.tsx",
  ];

  // 1. Verify all target files exist on disk with non-empty content and no merge markers
  console.log("\n[1] Verifying all target files exist on disk...");
  for (const modPath of targetModules) {
    const diskPath = path.resolve(process.cwd(), modPath.slice(1));
    assert.ok(fs.existsSync(diskPath), `File must exist on disk: ${diskPath}`);
    const content = fs.readFileSync(diskPath, "utf-8");
    assert.ok(content.length > 50, `File must not be empty: ${diskPath}`);
    assert.ok(!content.includes("<<<<<<<"), `File must not contain merge markers: ${modPath}`);
    assert.ok(!content.includes(">>>>>>>"), `File must not contain merge markers: ${modPath}`);
  }
  console.log(`✓ [1] All ${targetModules.length} target files exist on disk with valid content.`);

  // 2. Probe Vite dev server for all target modules
  console.log("\n[2] Probing dev server for all target modules...");
  for (const modPath of targetModules) {
    const res = await probeUrl(modPath);
    assert.strictEqual(
      res.status,
      200,
      `Dev server must return HTTP 200 for ${modPath}, got ${res.status}`,
    );
    assert.ok(
      !res.text.includes("[PARSE_ERROR]"),
      `Dev server transform for ${modPath} must not contain PARSE_ERROR`,
    );
    assert.ok(
      !res.text.trim().startsWith("<!doctype html") && !res.text.trim().startsWith("<!DOCTYPE html"),
      `Dev server must transform ${modPath} as JS/TS module, not fallback to index.html`,
    );
    console.log(`  ✓ ${modPath}: 200 OK (${res.text.length} bytes transformed)`);
  }

  // 3. Probe root application index
  console.log("\n[3] Probing root URL /...");
  const rootRes = await probeUrl("/");
  assert.strictEqual(rootRes.status, 200, `Root page must return HTTP 200`);
  assert.ok(rootRes.text.includes("<div id=\"root\">"), `Root page must contain #root div`);
  console.log(`  ✓ Root URL returned HTTP 200 with valid HTML (${rootRes.text.length} bytes)`);

  // 4. Verify AGENTS.md size budget is strictly honored
  console.log("\n[4] Verifying AGENTS.md size budget...");
  const agentsPath = path.resolve(process.cwd(), "AGENTS.md");
  const agentsContent = fs.readFileSync(agentsPath, "utf8");
  const agentsSize = Buffer.byteLength(agentsContent, "utf8");
  assert.ok(
    agentsSize <= 21000,
    `AGENTS.md (${agentsSize} bytes) must be <= 21000 bytes safe budget`,
  );
  console.log(`  ✓ AGENTS.md size: ${agentsSize} bytes (well within 21,000 bytes budget)`);

  console.log("\n=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Vite reload and module health verified 100%!");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
