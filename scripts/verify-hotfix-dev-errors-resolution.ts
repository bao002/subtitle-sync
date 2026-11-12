import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import assert from "node:assert";

function probeUrl(urlPath: string): Promise<{ status: number; text: string }> {
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
  console.log("=========================================================================");
  console.log("🧪 Verifying Hotfix (Prompt 172): Dev Errors & Compilation Resolution");
  console.log("=========================================================================");

  // 1. Verify src/routes/index.tsx has curPlaying defined before usage
  console.log("\n[1] Checking curPlaying definition in src/routes/index.tsx...");
  const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
  const indexContent = fs.readFileSync(indexPath, "utf-8");
  assert.ok(
    indexContent.includes("const curPlaying ="),
    "src/routes/index.tsx must declare const curPlaying before checking !curPlaying",
  );
  assert.ok(
    indexContent.includes("if (!curPlaying && !speakingLangRef.current && !busy.current)"),
    "src/routes/index.tsx must gate pause with curPlaying",
  );
  console.log("  ✓ curPlaying is properly declared and referenced in src/routes/index.tsx");

  // 2. Verify src/components/SubtitlesTablePanel.tsx imports NewSubtitlesParserBar
  console.log("\n[2] Checking NewSubtitlesParserBar import in SubtitlesTablePanel.tsx...");
  const tablePath = path.resolve(process.cwd(), "src/components/SubtitlesTablePanel.tsx");
  const tableContent = fs.readFileSync(tablePath, "utf-8");
  assert.ok(
    tableContent.includes("import { NewSubtitlesParserBar } from"),
    "SubtitlesTablePanel.tsx must import NewSubtitlesParserBar",
  );
  console.log("  ✓ NewSubtitlesParserBar is properly imported in SubtitlesTablePanel.tsx");

  // 3. Verify filterLogEntriesOptimized in src/utils/componentOptimizationService.ts accepts readonly LogEntry[]
  console.log("\n[3] Checking filterLogEntriesOptimized signature in componentOptimizationService.ts...");
  const compOptPath = path.resolve(process.cwd(), "src/utils/componentOptimizationService.ts");
  const compOptContent = fs.readFileSync(compOptPath, "utf-8");
  assert.ok(
    compOptContent.includes("entries: readonly LogEntry[] | LogEntry[]"),
    "filterLogEntriesOptimized must accept readonly LogEntry[] | LogEntry[]",
  );
  console.log("  ✓ filterLogEntriesOptimized accepts readonly LogEntry[] arrays");

  // 4. Probe Dev Server
  console.log("\n[4] Probing dev server for affected modules...");
  const probeModules = [
    "/src/routes/index.tsx",
    "/src/components/SubtitlesTablePanel.tsx",
    "/src/utils/componentOptimizationService.ts",
    "/src/components/BottomLogViewer.tsx",
    "/",
  ];
  for (const mod of probeModules) {
    const res = await probeUrl(mod);
    assert.strictEqual(res.status, 200, `Dev server must return HTTP 200 for ${mod}`);
    assert.ok(
      !res.text.includes("[PARSE_ERROR]"),
      `Transform for ${mod} must not contain PARSE_ERROR`,
    );
    console.log(`  ✓ ${mod}: HTTP 200 OK (${res.text.length} bytes)`);
  }

  console.log("\n=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Dev errors & compilation hotfix verified 100%!");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
