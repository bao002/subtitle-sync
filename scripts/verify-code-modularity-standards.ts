import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Code Architecture & Modularity Standards Test");
console.log("====================================================");

const rootDir = process.cwd();
const agentsMdPath = path.join(rootDir, "AGENTS.md");
assert(fs.existsSync(agentsMdPath), "AGENTS.md must exist");
const agentsContent = fs.readFileSync(agentsMdPath, "utf8");

// 1. Verify AGENTS.md codifies code architecture, modularity, and standards
assert(
  agentsContent.includes("## Code architecture, modularity, and standards"),
  "AGENTS.md must contain ## Code architecture, modularity, and standards section",
);
console.log("✅ PASS: AGENTS.md has dedicated architecture and modularity standards section");

// 2. Verify AGENTS.md explicitly prohibits overloading single files like index.tsx / index.ts
assert(
  agentsContent.includes("Avoid single-file overload") &&
    agentsContent.includes("index.tsx") &&
    agentsContent.includes("index.ts"),
  "AGENTS.md must explicitly prohibit single-file overload in index.tsx, index.ts, etc.",
);
console.log("✅ PASS: AGENTS.md prohibits single-file overload (e.g., index.tsx, index.ts)");

// 3. Verify AGENTS.md mandates component decomposition discipline
assert(
  agentsContent.includes("Component decomposition discipline") &&
    agentsContent.includes("src/components/"),
  "AGENTS.md must mandate component decomposition into src/components/",
);
console.log("✅ PASS: AGENTS.md mandates component decomposition into src/components/");

// 4. Verify AGENTS.md mandates custom hooks and state isolation
assert(
  agentsContent.includes("Custom hooks and state isolation") &&
    agentsContent.includes("src/hooks/"),
  "AGENTS.md must mandate isolating state and hooks under src/hooks/ or src/utils/",
);
console.log("✅ PASS: AGENTS.md mandates custom hooks and state isolation");

// 5. Verify src/components exists and contains dedicated modular components
const componentsDir = path.join(rootDir, "src/components");
assert(fs.existsSync(componentsDir), "src/components directory must exist");
const componentFiles = fs.readdirSync(componentsDir);
assert(
  componentFiles.length > 5,
  "src/components must contain modular components decomposing application views",
);
console.log(`✅ PASS: src/components contains ${componentFiles.length} modular components`);

console.log("====================================================");
console.log("🎉 All Code Architecture & Modularity Standards tests PASSED successfully!");
console.log("====================================================");
