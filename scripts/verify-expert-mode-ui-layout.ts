import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=== Verifying expert-mode UX cleanup tasks 202-205 ===");

const root = process.cwd();
const indexPath = path.join(root, "src/routes/index.tsx");

const index = fs.readFileSync(indexPath, "utf8");
assert(
  !index.includes('data-testid="favorite-visibility-toolbar"'),
  "favorite visibility toolbar should be removed as requested in Task 260",
);
assert(
  index.includes('data-testid="per-language-settings-panel"'),
  "per-language settings container should be exposed for compact editing",
);
assert(
  index.includes("setExpandedLanguageSettings"),
  "language setup rows should support expand/collapse editing",
);
assert(
  !index.includes("pendingParserChange") && !index.includes("ParserDiffConfirmationModal"),
  "parser changes should apply directly without diff review",
);
console.log("[PASS] Viewer, language-section, and immediate parser layout checks verified");

console.log("\n=== ALL TASK 202-205 UX LAYOUT CHECKS PASSED ===");
