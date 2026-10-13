import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Zero Duplicate Markdown Files & AGENTS.md docs/*.md Mandate");
console.log("=========================================================================");

const rootDir = process.cwd();

// Helper to recursively collect all .md files (excluding node_modules, dist, .git)
function collectMarkdownFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === ".git" ||
        entry.name === ".next"
      ) {
        continue;
      }
      files = files.concat(collectMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(relPath);
    }
  }

  return files;
}

const allMdFiles = collectMarkdownFiles(rootDir);
console.log(`Discovered ${allMdFiles.length} Markdown files in repository.`);

// 1. Verify AGENTS.md instructs all .md files to be under docs/*.md and zero duplicates policy
console.log("\n--> [Step 1] Verifying AGENTS.md instruction and policy...");
const agentsPath = path.resolve(rootDir, "AGENTS.md");
assert(fs.existsSync(agentsPath), "AGENTS.md must exist in root directory");
const agentsContent = fs.readFileSync(agentsPath, "utf8");

assert(
  agentsContent.includes("Mandatory location of all .md files under `docs/*.md` & zero duplicates policy") ||
  agentsContent.includes("docs/*.md"),
  "AGENTS.md must mandate that all documentation files are located under docs/*.md",
);
assert(
  agentsContent.includes("ZERO duplicate `.md` files") ||
  agentsContent.includes("zero duplicate") ||
  agentsContent.includes("zero duplicates"),
  "AGENTS.md must mandate zero duplicate markdown files in repository",
);
assert(
  agentsContent.includes("docs/tokens.md"),
  "AGENTS.md must reference docs/tokens.md instead of root tokens.md",
);
assert(
  agentsContent.includes("docs/android.md"),
  "AGENTS.md must reference docs/android.md instead of root android.md",
);
console.log("✅ PASS: AGENTS.md explicitly mandates docs/*.md location and zero duplicates policy.");

// 2. Verify forbidden duplicate files do NOT exist in root
console.log("\n--> [Step 2] Verifying no duplicate / redundant .md files in root directory...");
const forbiddenRootMdFiles = [
  "tokens.md",
  "android.md",
  "parser.md",
  "self-verification.md",
  "roadmap.md",
];

for (const forbidden of forbiddenRootMdFiles) {
  const fullPath = path.resolve(rootDir, forbidden);
  assert(
    !fs.existsSync(fullPath),
    `Forbidden duplicate file "${forbidden}" must not exist in repository root (must be in docs/${forbidden})`,
  );
  console.log(`✅ PASS: Root does not contain duplicate "${forbidden}"`);
}

// 3. Verify canonical files exist in docs/
console.log("\n--> [Step 3] Verifying canonical files exist under docs/*.md...");
const requiredDocsFiles = [
  "docs/tokens.md",
  "docs/android.md",
  "docs/parser.md",
  "docs/self-verification.md",
  "docs/roadmap.md",
  "docs/tasks.md",
  "docs/todo.md",
  "docs/done.md",
  "docs/files.md",
  "docs/later.md",
  "docs/server.md",
];



for (const req of requiredDocsFiles) {
  const fullPath = path.resolve(rootDir, req);
  assert(fs.existsSync(fullPath), `Required canonical documentation file must exist: "${req}"`);
  console.log(`✅ PASS: Canonical file exists: "${req}"`);
}

// 4. Verify Root Markdown Files Contain Only Allowed Entry Points
console.log("\n--> [Step 4] Auditing root directory markdown files...");
const allowedRootMdFiles = new Set(["README.md", "AGENTS.md", "current-sub-task.md", "temp.md"]);
const rootMdFiles = fs
  .readdirSync(rootDir)
  .filter((f) => f.endsWith(".md"));

for (const rootFile of rootMdFiles) {
  assert(
    allowedRootMdFiles.has(rootFile),
    `Unpermitted markdown file found in root: "${rootFile}". All documentation must be under docs/*.md`,
  );
}
console.log(`✅ PASS: Root directory contains only allowed files: ${rootMdFiles.join(", ")}`);

// 5. Verify Content Hash Uniqueness (No Duplicate Content Across Repository)
console.log("\n--> [Step 5] Checking content hash uniqueness across all markdown files...");
const hashes = new Map<string, string>();
for (const file of allMdFiles) {
  const content = fs.readFileSync(path.resolve(rootDir, file), "utf8");
  const hash = crypto.createHash("sha256").update(content).digest("hex");

  if (hashes.has(hash)) {
    const existingFile = hashes.get(hash)!;
    assert.fail(
      `Duplicate markdown content detected between "${existingFile}" and "${file}" (SHA-256: ${hash.slice(0, 12)}...)`,
    );
  }
  hashes.set(hash, file);
}
console.log(`✅ PASS: All ${allMdFiles.length} Markdown files have unique content (0 duplicates).`);

console.log("\n=========================================================================");
console.log("🎉 ALL ZERO-DUPLICATE MARKDOWN AND AGENTS.md MANDATE CHECKS PASSED!");
console.log("=========================================================================");
