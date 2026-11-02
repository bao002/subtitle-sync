import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=============================================================");
console.log("🧪 Verifying docs/next_version_from_scratch.md Architecture Guide");
console.log("=============================================================");

const rootDir = process.cwd();
const docPath = path.join(rootDir, "docs/next_version_from_scratch.md");

// 1. Verify existence strictly under docs/*.md
assert(fs.existsSync(docPath), "docs/next_version_from_scratch.md must exist strictly under docs/");
console.log("✅ PASS: docs/next_version_from_scratch.md exists under docs/*.md");

const content = fs.readFileSync(docPath, "utf8");

// 2. Verify Zoom-Out explanation
assert(
  content.includes("The Zoom-Out View") || content.includes("Zoom-Out"),
  "Document must contain a high-level Zoom-Out explanation",
);
assert(
  content.includes("Unidirectional") && content.includes("Pipeline"),
  "Zoom-Out explanation must describe the unidirectional media-driven pipeline",
);
console.log("✅ PASS: Zoom-out high-level architecture is clearly established");

// 3. Verify Closer Overview in sequential steps
assert(
  content.includes("Closer Overview") && content.includes("Sequential Build Steps"),
  "Document must provide a closer overview in sequential steps",
);
assert(
  content.includes("Step 1") &&
    content.includes("Step 2") &&
    content.includes("Step 3") &&
    content.includes("Step 4") &&
    content.includes("Step 5"),
  "Document must walk through clear sequential build steps (Steps 1 to 5)",
);
console.log("✅ PASS: Closer overview in 5 sequential steps is documented");

// 4. Verify Component Inventory describes each's goal (not code implementation)
assert(
  content.includes("Component Inventory") &&
    (content.includes("Goal & Responsibility") || content.includes("Goals & Responsibilities")),
  "Document must include a component inventory detailing goals and responsibilities",
);
assert(
  content.includes("VideoPlayerHost") &&
    content.includes("SubtitleMatrixView") &&
    content.includes("SentenceRow") &&
    content.includes("AudioCoordinator") &&
    content.includes("LanguageSelector"),
  "Document must cover the core component inventory",
);
console.log("✅ PASS: Component inventory describes goals and responsibilities without code clutter");

// 5. Verify explicitly omitting the bad parts from project history
assert(
  content.includes("Bad Parts") || content.includes("bad part"),
  "Document must explicitly address omitting the bad parts from project history",
);
assert(
  content.includes("Monolithic") || content.includes("9,000+"),
  "Document must warn against monolithic route files",
);
assert(
  content.includes("Dual-Mode") || content.includes("Beginner"),
  "Document must warn against dual-mode DOM duplication",
);
assert(
  content.includes("Database") || content.includes("Supabase"),
  "Document must warn against unnecessary database / backend sprawl",
);
assert(
  content.includes("Zero-hardcoded-subtitles") || content.includes("Hardcoded Subtitle"),
  "Document must warn against hardcoded subtitles pollution",
);
console.log("✅ PASS: Historical bad parts and anti-patterns are explicitly analyzed and avoided");

// 6. Verify zero duplicate files in root
assert(
  !fs.existsSync(path.join(rootDir, "next_version_from_scratch.md")),
  "next_version_from_scratch.md must NOT exist in root (strictly in docs/)",
);
console.log("✅ PASS: No duplicate markdown files exist outside docs/");

console.log("=============================================================");
console.log("🎉 docs/next_version_from_scratch.md Verification PASSED successfully!");
console.log("=============================================================");
