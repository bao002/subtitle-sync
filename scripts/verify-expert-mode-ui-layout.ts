import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=== Verifying expert-mode UX cleanup tasks 202-205 ===");

const root = process.cwd();
const parserModalPath = path.join(root, "src/components/ParserDiffConfirmationModal.tsx");
const indexPath = path.join(root, "src/routes/index.tsx");

const parserModal = fs.readFileSync(parserModalPath, "utf8");
assert(parserModal.includes("inline?: boolean"), "inline support should exist on ParserDiffConfirmationModal");
assert(
  parserModal.includes('data-testid="parser-diff-inline-review"') ||
    parserModal.includes("parser-diff-inline-review"),
  "inline parser diff review should render in a non-modal container",
);
console.log("[PASS] Inline parser review support verified");

const index = fs.readFileSync(indexPath, "utf8");
assert(
  index.includes('data-testid="favorite-visibility-toolbar"'),
  "favorite visibility toolbar should be rendered beside the video area",
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
  index.includes('workflowMode !== "expert" && Boolean(pendingParserChange)'),
  "popup confirmation should be hidden while expert mode uses inline review",
);
console.log("[PASS] Viewer and language-section layout checks verified");

console.log("\n=== ALL TASK 202-205 UX LAYOUT CHECKS PASSED ===");
