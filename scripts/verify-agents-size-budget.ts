import fs from "fs";
import path from "path";

const PLATFORM_LIMIT_BYTES = 24576; // 24 KB platform rule truncation limit
const BUDGET_LIMIT_BYTES = 21000;   // Safe operational ceiling
const MIN_HEADROOM_BYTES = 3576;    // Minimum required headroom for user prompt injection

function run() {
  console.log("====================================================");
  console.log("🧪 Starting AGENTS.md Size Budget & Headroom Verification (Step 4)");
  console.log("====================================================");

  const agentsPath = path.resolve(process.cwd(), "AGENTS.md");
  if (!fs.existsSync(agentsPath)) {
    console.error("❌ FAIL: AGENTS.md does not exist at repo root!");
    process.exit(1);
  }

  const content = fs.readFileSync(agentsPath, "utf-8");
  const sizeBytes = Buffer.byteLength(content, "utf8");
  const headroomBytes = PLATFORM_LIMIT_BYTES - sizeBytes;

  console.log(`📊 AGENTS.md Size: ${sizeBytes} bytes (${(sizeBytes / 1024).toFixed(2)} KB)`);
  console.log(`🎯 Safe Budget:   ${BUDGET_LIMIT_BYTES} bytes (${(BUDGET_LIMIT_BYTES / 1024).toFixed(2)} KB)`);
  console.log(`🛡️ Platform Limit: ${PLATFORM_LIMIT_BYTES} bytes (${(PLATFORM_LIMIT_BYTES / 1024).toFixed(2)} KB)`);
  console.log(`🚀 Headroom:      ${headroomBytes} bytes (${(headroomBytes / 1024).toFixed(2)} KB)`);

  if (sizeBytes > PLATFORM_LIMIT_BYTES) {
    console.error(`❌ CRITICAL FAIL: AGENTS.md (${sizeBytes} bytes) exceeds platform truncation limit of ${PLATFORM_LIMIT_BYTES} bytes!`);
    process.exit(1);
  }

  if (sizeBytes > BUDGET_LIMIT_BYTES) {
    console.error(`❌ FAIL: AGENTS.md (${sizeBytes} bytes) exceeds safe operational budget of ${BUDGET_LIMIT_BYTES} bytes!`);
    process.exit(1);
  }

  if (headroomBytes < MIN_HEADROOM_BYTES) {
    console.error(`❌ FAIL: AGENTS.md headroom (${headroomBytes} bytes) is below minimum required headroom of ${MIN_HEADROOM_BYTES} bytes!`);
    process.exit(1);
  }

  console.log("✅ PASS: AGENTS.md is strictly within the safe 21,000 byte budget limit.");
  console.log(`✅ PASS: Guaranteed headroom of ${headroomBytes} bytes (>= ${MIN_HEADROOM_BYTES} bytes) protects against truncation.`);

  // Verify docs/suggestions.md references
  const suggestionsPath = path.resolve(process.cwd(), "docs/suggestions.md");
  if (!fs.existsSync(suggestionsPath)) {
    console.error("❌ FAIL: docs/suggestions.md does not exist!");
    process.exit(1);
  }
  const suggestionsText = fs.readFileSync(suggestionsPath, "utf-8");
  if (!suggestionsText.includes("21,000") || !suggestionsText.includes("3,576")) {
    console.error("❌ FAIL: docs/suggestions.md must document the 21,000 byte budget and 3,576 byte headroom!");
    process.exit(1);
  }
  console.log("✅ PASS: docs/suggestions.md properly documents budget constraints.");

  console.log("====================================================");
  console.log("🎉 AGENTS.md Size Budget & Headroom Verification PASSED!");
  console.log("====================================================");
}

run();
