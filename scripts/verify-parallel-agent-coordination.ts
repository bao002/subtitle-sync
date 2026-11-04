import fs from "fs";
import path from "path";
import assert from "assert";

console.log("=========================================================================");
console.log("🧪 Verifying Parallel AI Agent Coordination & Lock Protocol (chat.md)");
console.log("=========================================================================\n");

const rootDir = process.cwd();
const agentsMdPath = path.resolve(rootDir, "AGENTS.md");
const chatMdPath = path.resolve(rootDir, "chat.md");
const noDupesScriptPath = path.resolve(rootDir, "scripts/verify-no-duplicate-md-files.ts");
const autoRetryScriptPath = path.resolve(rootDir, "scripts/verify-auto-retry-and-versioning.ts");

// Step 1: Verify AGENTS.md Protocol & Rules
console.log("--> [Step 1] Verifying AGENTS.md parallel agent coordination rules...");
assert(fs.existsSync(agentsMdPath), "AGENTS.md must exist in root");
const agentsContent = fs.readFileSync(agentsMdPath, "utf8");

assert(
  agentsContent.includes("## Parallel AI agent coordination & lock mechanism (chat.md)"),
  "AGENTS.md must contain dedicated section for parallel agent coordination & lock mechanism",
);

assert(
  agentsContent.includes("chat.md"),
  "AGENTS.md must reference chat.md communication channel",
);

assert(
  agentsContent.includes("Mandatory lock release upon job completion") ||
    agentsContent.includes("take off the lock"),
  "AGENTS.md must enforce mandatory lock release / taking off lock upon job completion",
);

assert(
  agentsContent.includes("Interrupted job priority resolution") ||
    agentsContent.includes("inquire about the job's priority and ask what task to continue"),
  "AGENTS.md must specify inquiring about interrupted job priority before proceeding",
);

assert(
  agentsContent.includes("Duplicate job suspicion communication") ||
    agentsContent.includes("suspects or observes another agent is working on the same job"),
  "AGENTS.md must mandate communication if an agent suspects another agent is working on the same job",
);

assert(
  agentsContent.includes("Fallback redirection to user") ||
    agentsContent.includes("redirect the question directly to the prompt user"),
  "AGENTS.md must mandate redirecting to prompt user if no agent replies",
);

assert(
  agentsContent.includes("Only `README.md`, `AGENTS.md`, `current-sub-task.md`, `temp.md`, `chat.md`"),
  "AGENTS.md must allow chat.md in the root markdown exceptions list",
);

assert(
  agentsContent.includes("Quarantine agent chat") ||
    agentsContent.includes("quarentine and dont use for now") ||
    agentsContent.includes("quarantined and must NOT be used for now"),
  "AGENTS.md must mandate quarantining agent chat and not using it for now",
);
console.log("✅ PASS: AGENTS.md rules satisfy all parallel agent coordination & quarantine requirements.");

// Step 2: Verify chat.md physical presence and schema
console.log("\n--> [Step 2] Verifying chat.md structure, active lock schema, and communication log...");
assert(fs.existsSync(chatMdPath), "chat.md must exist at root");
const chatContent = fs.readFileSync(chatMdPath, "utf8");

assert(
  chatContent.includes("## Active Lock"),
  "chat.md must contain ## Active Lock section",
);

assert(
  chatContent.includes("Status") &&
    (chatContent.includes("[UNLOCKED]") || chatContent.includes("[LOCKED]")),
  "chat.md must specify lock Status ([UNLOCKED] or [LOCKED])",
);

assert(
  chatContent.includes("Agent ID") &&
    chatContent.includes("Task ID") &&
    chatContent.includes("Scope"),
  "chat.md must track Agent ID, Task ID, and Scope",
);

assert(
  chatContent.includes("## Communication Log"),
  "chat.md must contain ## Communication Log section",
);

assert(
  chatContent.includes("QUARANTINED") || chatContent.includes("Quarantined"),
  "chat.md must indicate quarantine notice",
);

const quarentinedChatPath = path.resolve(rootDir, "quarentined/chat.md");
assert(
  fs.existsSync(quarentinedChatPath),
  "quarentined/chat.md must physically exist under quarentined/",
);
console.log("✅ PASS: chat.md exists with required lock schema, quarantine notice, and quarentined/ archive.");

// Step 3: Verify scripts allowlist for root markdown files
console.log("\n--> [Step 3] Verifying root markdown file allowlists in audit scripts...");
const noDupesContent = fs.readFileSync(noDupesScriptPath, "utf8");
assert(
  noDupesContent.includes('"chat.md"'),
  "scripts/verify-no-duplicate-md-files.ts must include chat.md in allowedRootMdFiles",
);

const autoRetryContent = fs.readFileSync(autoRetryScriptPath, "utf8");
assert(
  autoRetryContent.includes('"chat.md"'),
  "scripts/verify-auto-retry-and-versioning.ts must include chat.md in allowedRootMd",
);
console.log("✅ PASS: Audit scripts allow chat.md in root directory.");

// Step 4: AGENTS.md size budget check
console.log("\n--> [Step 4] Checking AGENTS.md size budget...");
const agentsStat = fs.statSync(agentsMdPath);
const MAX_BUDGET = 21000;
assert(
  agentsStat.size <= MAX_BUDGET,
  `AGENTS.md size (${agentsStat.size} bytes) must be <= ${MAX_BUDGET} bytes safe budget`,
);
console.log(`✅ PASS: AGENTS.md size is ${agentsStat.size} bytes (within ${MAX_BUDGET} bytes budget).`);

console.log("\n=========================================================================");
console.log("🎉 ALL PARALLEL AGENT COORDINATION CHECKS PASSED SUCCESSFULLY (100% verified)");
console.log("=========================================================================\n");
