import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Numbered Chapters as Serial Tasks Protocol in AGENTS.md");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: Validate AGENTS.md existence and section
console.log("--> [Test 1] Auditing AGENTS.md for numbered chapters protocol...");
const agentsPath = path.resolve(rootDir, "AGENTS.md");
assert(fs.existsSync(agentsPath), "AGENTS.md must exist in root");
const agentsContent = fs.readFileSync(agentsPath, "utf8");

assert(
  agentsContent.includes("Numbered chapters as serial tasks protocol"),
  "AGENTS.md must include 'Numbered chapters as serial tasks protocol' section",
);

assert(
  agentsContent.includes("numbered chapters") &&
    agentsContent.includes("sub-tasks") &&
    agentsContent.includes("serially"),
  "AGENTS.md must mandate dividing numbered chapters into sub-tasks and working on them serially",
);
console.log("✅ PASS: AGENTS.md contains the Numbered chapters as serial tasks protocol.");

// Test 2: Validate AGENTS.md ## Last raw prompt
console.log("--> [Test 2] Auditing AGENTS.md for Last raw prompt section...");
assert(
  agentsContent.includes("## Last raw prompt"),
  "AGENTS.md must contain ## Last raw prompt section",
);

assert(
  agentsContent.includes("every time the prompt consist of numbered chapters"),
  "AGENTS.md ## Last raw prompt must record verbatim user prompt",
);
console.log("✅ PASS: AGENTS.md contains verbatim latest prompt.");

// Test 3: Validate package.json script registration
console.log("--> [Test 3] Auditing package.json script registration...");
const packageJsonPath = path.resolve(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
assert(
  packageJson.scripts["test:numbered-chapters-protocol"],
  "package.json must contain 'test:numbered-chapters-protocol' script",
);
console.log("✅ PASS: package.json script registered.");

// Test 4: Validate docs/files.md registration
console.log("--> [Test 4] Auditing docs/files.md registration...");
const filesMdPath = path.resolve(rootDir, "docs/files.md");
const filesMdContent = fs.readFileSync(filesMdPath, "utf8");
assert(
  filesMdContent.includes("verify-numbered-chapters-protocol.ts"),
  "docs/files.md must inventory scripts/verify-numbered-chapters-protocol.ts",
);
console.log("✅ PASS: docs/files.md inventories verify-numbered-chapters-protocol.ts.");

console.log("=========================================================================");
console.log("🎉 ALL NUMBERED CHAPTERS PROTOCOL AUDIT CHECKS PASSED (100%)!");
console.log("=========================================================================");
