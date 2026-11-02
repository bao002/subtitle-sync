/**
 * Dedicated test script: scripts/verify-sliders-import-hotfix.ts
 *
 * Validates:
 * 1. src/routes/index.tsx correctly imports Sliders from lucide-react.
 * 2. Sliders is defined and properly used in Stage 2 Learning Goals language narration ratios header.
 * 3. No unresolved ReferenceError: Sliders is not defined occurs.
 */

import fs from "node:fs";
import path from "node:path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
}

async function run() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Hotfix: Sliders Icon Import & Reference in index.tsx");
  console.log("=========================================================================");

  const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
  const indexContent = fs.readFileSync(indexPath, "utf-8");

  // 1. Verify Sliders is imported from lucide-react
  const lucideImportMatch = indexContent.match(/import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["']/);
  assert(!!lucideImportMatch, "index.tsx must contain lucide-react imports");
  const importedIcons = lucideImportMatch![1].split(",").map((s) => s.trim());
  assert(importedIcons.includes("Sliders"), "index.tsx must explicitly import 'Sliders' from lucide-react");
  console.log("✅ PASS: 'Sliders' icon is explicitly imported from 'lucide-react' in index.tsx");

  // 2. Verify Sliders is used in the JSX
  assert(
    indexContent.includes("<Sliders") || indexContent.includes("<Sliders "),
    "index.tsx must render <Sliders /> icon in JSX"
  );
  console.log("✅ PASS: <Sliders /> is properly rendered in JSX");

  // 3. Verify it is inside the stage-2-language-ratios-container
  const ratiosContainerIdx = indexContent.indexOf('id="stage-2-language-ratios-container"');
  assert(ratiosContainerIdx !== -1, "stage-2-language-ratios-container must exist");
  const sliceAroundContainer = indexContent.slice(ratiosContainerIdx, ratiosContainerIdx + 800);
  assert(
    sliceAroundContainer.includes("<Sliders"),
    "Sliders icon must be positioned inside stage-2-language-ratios-container header"
  );
  console.log("✅ PASS: Sliders icon is correctly positioned in the Learning Goals ratios header");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED! Hotfix Sliders import verified successfully.");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
