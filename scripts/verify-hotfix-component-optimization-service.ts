import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import {
  tokenizeSentenceToWordTokens,
  filterLogEntriesOptimized,
  isSubtitleRowMatchingCriteria,
  filterSubtitleRowsByCriteria,
  createVisibilitySafeAnimationLoop,
  shouldComponentProcess,
} from "../src/utils/componentOptimizationService";
import type { LogEntry } from "../src/utils/logBuffer";
import type { Row } from "../src/lib/subtitles";

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
  console.log("🧪 Verifying Hotfix: Component Optimization Service & Dev Server Errors");
  console.log("=========================================================================");

  const rootDir = process.cwd();

  // 1. Verify existence of src/utils/componentOptimizationService.ts
  console.log("\n[1] Checking src/utils/componentOptimizationService.ts file on disk...");
  const servicePath = path.resolve(rootDir, "src/utils/componentOptimizationService.ts");
  assert.ok(fs.existsSync(servicePath), "componentOptimizationService.ts must exist on disk");
  const stat = fs.statSync(servicePath);
  assert.ok(stat.size > 200, `componentOptimizationService.ts must not be empty (${stat.size} bytes)`);
  console.log(`  ✓ File exists (${stat.size} bytes)`);

  // 2. Test tokenizeSentenceToWordTokens
  console.log("\n[2] Testing tokenizeSentenceToWordTokens...");
  const tokens = tokenizeSentenceToWordTokens("Hello world, this is a test.");
  assert.strictEqual(tokens.length, 6, "Must tokenize 6 words");
  assert.strictEqual(tokens[0].word, "Hello");
  assert.strictEqual(tokens[0].index, 0);
  assert.strictEqual(tokens[0].start, 0);
  assert.strictEqual(tokens[0].end, 5);
  assert.strictEqual(tokens[1].word, "world,");
  assert.strictEqual(tokens[1].index, 1);
  console.log("  ✓ Word tokens generated with valid indices and character offsets");

  // 3. Test filterLogEntriesOptimized
  console.log("\n[3] Testing filterLogEntriesOptimized...");
  const dummyEntries: LogEntry[] = [
    { id: "1", timestamp: 100, level: "INFO", message: "app started", category: "lifecycle" },
    { id: "2", timestamp: 105, level: "ACTION", message: "play clicked", category: "action" },
    { id: "3", timestamp: 110, level: "ERROR", message: "network timeout", category: "network" },
  ];
  const collapsed = filterLogEntriesOptimized(dummyEntries, "ALL", false);
  assert.strictEqual(collapsed.length, 0, "Must return 0 entries when viewer is collapsed");

  const expandedAll = filterLogEntriesOptimized(dummyEntries, "ALL", true);
  assert.strictEqual(expandedAll.length, 3, "Must return all entries when expanded with ALL");

  const expandedActionsErrors = filterLogEntriesOptimized(dummyEntries, "ACTIONS_ERRORS", true);
  assert.strictEqual(expandedActionsErrors.length, 2, "Must return only ACTION and ERROR entries");
  console.log("  ✓ Log buffer filtering optimization confirmed");

  // 4. Test isSubtitleRowMatchingCriteria & filterSubtitleRowsByCriteria
  console.log("\n[4] Testing isSubtitleRowMatchingCriteria & filterSubtitleRowsByCriteria...");
  const dummyRows: Row[] = [
    {
      start: 0,
      end: 2000,
      texts: { en: "Short sentence.", he: "משפט קצר." },
    },
    {
      start: 2000,
      end: 6000,
      texts: { en: "This is a very long sentence containing more than five words in English.", he: "משפט ארוך מאוד." },
    },
    {
      start: 6000,
      end: 8000,
      texts: { en: "Incomplete sentence without end punctuation", he: "משפט חלקי ללא פיסוק" },
    },
  ];

  // Test max words limit (5 words)
  assert.strictEqual(isSubtitleRowMatchingCriteria(dummyRows[0], "en", 5, false), true);
  assert.strictEqual(isSubtitleRowMatchingCriteria(dummyRows[1], "en", 5, false), false);

  // Test skip incomplete sentences
  assert.strictEqual(isSubtitleRowMatchingCriteria(dummyRows[0], "en", 0, true), true);
  assert.strictEqual(isSubtitleRowMatchingCriteria(dummyRows[2], "en", 0, true), false);

  const filtered = filterSubtitleRowsByCriteria(dummyRows, "en", 5, true);
  assert.strictEqual(filtered.length, 1, "Only row 0 should match max 5 words + complete punctuation");
  console.log("  ✓ Subtitle row criteria filtering verified");

  // 5. Test createVisibilitySafeAnimationLoop & shouldComponentProcess
  console.log("\n[5] Testing animation loop and component processing gate...");
  const loop = createVisibilitySafeAnimationLoop(() => {});
  assert.strictEqual(typeof loop.start, "function");
  assert.strictEqual(typeof loop.stop, "function");
  loop.start();
  loop.stop();

  assert.strictEqual(shouldComponentProcess(false), false);
  assert.strictEqual(shouldComponentProcess(true, false), false);
  assert.strictEqual(shouldComponentProcess(true, true), true);
  console.log("  ✓ Animation loop and processing gates verified");

  // 6. Test dev server HTTP 200 response for all consumer components
  console.log("\n[6] Probing dev server for all consumer modules...");
  const testModules = [
    "/src/components/AlternativeVideoPlayerView.tsx",
    "/src/components/BottomLogViewer.tsx",
    "/src/components/CanvasBalloonGame.tsx",
    "/src/components/SubtitlesTablePanel.tsx",
    "/src/routes/index.tsx",
    "/src/utils/componentOptimizationService.ts",
  ];

  for (const modPath of testModules) {
    const res = await probeUrl(modPath);
    assert.strictEqual(
      res.status,
      200,
      `Module ${modPath} must return HTTP 200 from Vite dev server, got ${res.status}`,
    );
    assert.ok(
      !res.text.includes("Failed to resolve import"),
      `Module ${modPath} must not have unresolved imports`,
    );
    assert.ok(
      !res.text.includes("Pre-transform error"),
      `Module ${modPath} must not have pre-transform errors`,
    );
    console.log(`  ✓ ${modPath} returned HTTP 200 OK without errors`);
  }

  console.log("\n=========================================================================");
  console.log("🎉 All checks passed! Hotfix verified successfully.");
  console.log("=========================================================================\n");
}

run().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
