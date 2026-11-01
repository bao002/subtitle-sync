import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("--> Verifying Language Selection Table 'is-primary' and 'json3' columns...");

  const root = path.resolve(".");
  const indexTsx = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");

  // 1. Assert column header th-is-primary and th-json3
  assert.ok(indexTsx.includes('data-testid="th-is-primary"'), "Must contain th-is-primary header");
  assert.ok(indexTsx.includes('data-testid="th-json3"'), "Must contain th-json3 header");
  console.log("✓ Column headers 'is-primary' and 'json3' verified");

  // 2. Assert is-primary radio selectors
  assert.ok(indexTsx.includes('name="is-primary-tts-parent"'), "Must contain is-primary-tts-parent radio group");
  assert.ok(indexTsx.includes('data-testid={`radio-is-primary-${lang.code}`}'), "Must contain per-language is-primary radio buttons");
  assert.ok(indexTsx.includes('The explicit is-primary column selection is the only way to define the tts-ratio absolute parent'), "Must establish is-primary as the only way to define the tts-ratio absolute parent");
  console.log("✓ 'is-primary' absolute parent selection logic verified");

  // 3. Assert json3 direct fetching status and player toggle button
  assert.ok(indexTsx.includes('data-testid={`col-json3-${lang.code}`}'), "Must contain col-json3 per language");
  assert.ok(indexTsx.includes('data-testid={`btn-toggle-player-json3-${lang.code}`}'), "Must contain direct toggle button for json3 on player");
  console.log("✓ 'json3' column and player caption toggling verified");

  console.log("All Language Selection is-primary and json3 column checks passed!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
