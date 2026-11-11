import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import assert from "node:assert/strict";

console.log("=========================================================================");
console.log("🧪 Verifying React Single Instance & Vite Reload Hotfix (Task 378)");
console.log("=========================================================================");

const rootDir = process.cwd();

function probeDevServer(urlPath: string): Promise<{ status: number; text: string }> {
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
  // Test 1: vite.config.ts optimizeDeps and dedupe
  console.log("\n[Test 1] Verifying vite.config.ts optimizeDeps and dedupe...");
  const viteConfigPath = path.join(rootDir, "vite.config.ts");
  assert.ok(fs.existsSync(viteConfigPath), "vite.config.ts must exist");
  const viteConfigContent = fs.readFileSync(viteConfigPath, "utf-8");

  assert.ok(
    viteConfigContent.includes("optimizeDeps:"),
    "vite.config.ts must configure optimizeDeps",
  );
  assert.ok(
    viteConfigContent.includes('"react"') &&
      viteConfigContent.includes('"react-dom"') &&
      viteConfigContent.includes('"react-dom/client"'),
    "vite.config.ts optimizeDeps.include must include react and react-dom packages",
  );
  assert.ok(
    viteConfigContent.includes("dedupe: [") &&
      viteConfigContent.includes('"react"') &&
      viteConfigContent.includes('"react-dom"'),
    "vite.config.ts resolve.dedupe must include React packages",
  );
  console.log("✅ PASS: vite.config.ts enforces optimizeDeps.include and dedupe for React packages.");

  // Test 2: Clean type-only imports in components
  console.log("\n[Test 2] Verifying type-only imports in target components...");
  const expPanelPath = path.join(rootDir, "src/components/ExperimentalSubtitleFetchPanel.tsx");
  const expPanelContent = fs.readFileSync(expPanelPath, "utf-8");
  assert.ok(
    expPanelContent.includes("type ExactFetchResult"),
    "ExperimentalSubtitleFetchPanel must use 'type ExactFetchResult'",
  );
  assert.ok(
    expPanelContent.includes("type { Json3 }") || expPanelContent.includes("type Json3"),
    "ExperimentalSubtitleFetchPanel must use 'type Json3' or 'type { Json3 }'",
  );

  const langBoxesPath = path.join(rootDir, "src/components/LanguageBoxesSelector.tsx");
  const langBoxesContent = fs.readFileSync(langBoxesPath, "utf-8");
  assert.ok(
    langBoxesContent.includes("type { Json3 }") || langBoxesContent.includes("type Json3"),
    "LanguageBoxesSelector must use 'type Json3' or 'type { Json3 }'",
  );
  assert.ok(
    langBoxesContent.includes('@/lib/native-captions'),
    "LanguageBoxesSelector must use normalized '@/lib/native-captions' alias",
  );

  const beginnerFlowPath = path.join(rootDir, "src/components/beginner/BeginnerFlowContainer.tsx");
  const beginnerFlowContent = fs.readFileSync(beginnerFlowPath, "utf-8");
  assert.ok(
    beginnerFlowContent.includes("type BeginnerTabId"),
    "BeginnerFlowContainer must use 'type BeginnerTabId'",
  );

  console.log("✅ PASS: Target components have clean normalized type-only imports.");

  // Test 3: Dev server returns HTTP 200 for root
  console.log("\n[Test 3] Verifying dev server health...");
  const rootRes = await probeDevServer("/");
  assert.equal(rootRes.status, 200, "Dev server root must return HTTP 200");
  assert.ok(rootRes.text.includes("<!doctype html>"), "Dev server root must serve index.html");
  console.log("✅ PASS: Dev server is healthy and responding with HTTP 200.");

  // Test 4: Dev server serves client and LanguageBoxesSelector with matching React hashes
  console.log("\n[Test 4] Verifying unified React version hashes across modules...");
  const clientRes = await probeDevServer("/src/client.tsx");
  assert.equal(clientRes.status, 200, "client.tsx must return HTTP 200");
  const clientReactMatch = clientRes.text.match(/\/node_modules\/\.vite\/deps\/react\.js\?v=([a-f0-9]+)/);
  assert.ok(clientReactMatch, "client.tsx must import pre-bundled react.js with hash");
  const clientHash = clientReactMatch[1];

  const langBoxesRes = await probeDevServer("/src/components/LanguageBoxesSelector.tsx");
  assert.equal(langBoxesRes.status, 200, "LanguageBoxesSelector.tsx must return HTTP 200");
  const langBoxesReactMatch = langBoxesRes.text.match(/\/node_modules\/\.vite\/deps\/react\.js\?v=([a-f0-9]+)/);
  assert.ok(langBoxesReactMatch, "LanguageBoxesSelector.tsx must import pre-bundled react.js with hash");
  const langBoxesHash = langBoxesReactMatch[1];

  assert.equal(
    clientHash,
    langBoxesHash,
    `client.tsx hash (${clientHash}) and LanguageBoxesSelector hash (${langBoxesHash}) must be strictly identical`,
  );
  console.log(`✅ PASS: Both modules import react.js with identical version hash: ?v=${clientHash}`);

  // Test 5: Verify all 6 reported failure modules load cleanly
  console.log("\n[Test 5] Verifying all reported modules transform with 200 OK without errors...");
  const targetModules = [
    "/src/components/ExperimentalSubtitleFetchPanel.tsx",
    "/src/components/beginner/BeginnerFlowContainer.tsx",
    "/src/routes/index.tsx",
    "/src/components/AiSubtitlePunctuationTab.tsx",
    "/src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
    "/src/components/beginner/PerLanguageTtsPreferences.tsx",
    "/src/components/LanguageBoxesSelector.tsx",
  ];

  for (const modPath of targetModules) {
    const res = await probeDevServer(modPath);
    assert.equal(res.status, 200, `Module ${modPath} must return 200, got ${res.status}`);
    assert.ok(
      !res.text.includes("[PARSE_ERROR]") && !res.text.includes("Internal server error"),
      `Module ${modPath} must not contain transformation errors`,
    );
    console.log(`  ✓ ${modPath}: 200 OK (${res.text.length} bytes)`);
  }
  console.log("✅ PASS: All 7 modules transform cleanly with 200 OK.");

  console.log("\n=========================================================================");
  console.log("🎉 ALL TESTS PASSED: React single instance and Vite reload hotfix verified! (Task 378)");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
