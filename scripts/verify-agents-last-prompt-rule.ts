import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting AGENTS.md Last Raw Prompt Rule Verification");
console.log("====================================================");

const rootDir = process.cwd();
const agentsPath = path.join(rootDir, "AGENTS.md");

// 1. Verify AGENTS.md exists
assert(fs.existsSync(agentsPath), "AGENTS.md must exist in root");
const agentsContent = fs.readFileSync(agentsPath, "utf8");

// 2. Verify rule in Work Tracking
assert(
  agentsContent.includes("Always keep last raw prompt in AGENTS.md") ||
    agentsContent.includes("always keep last raw prompt"),
  "AGENTS.md must contain the rule 'Always keep last raw prompt in AGENTS.md'",
);
console.log("✅ PASS: AGENTS.md contains the mandatory raw prompt preservation rule.");

// 3. Verify '## Last raw prompt' section exists
assert(
  agentsContent.includes("## Last raw prompt"),
  "AGENTS.md must contain '## Last raw prompt' section",
);
console.log("✅ PASS: AGENTS.md contains '## Last raw prompt' section.");

// 4. Verify the raw prompt content is present
const lastPromptMatch = agentsContent.match(/## Last raw prompt\s+```[\w]*\n([\s\S]*?)\n```/);
assert(
  lastPromptMatch && lastPromptMatch[1].trim().length > 0,
  "AGENTS.md must preserve a non-empty raw user prompt in the '## Last raw prompt' code block",
);
console.log(
  `✅ PASS: AGENTS.md contains the latest raw user prompt: "${lastPromptMatch[1].trim()}"`,
);

console.log("====================================================");
console.log("🎉 AGENTS.md Last Raw Prompt Rule Verification PASSED!");
console.log("====================================================");
