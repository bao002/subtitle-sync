import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Subtitles Parser Specification Verification");
console.log("====================================================");

const rootDir = process.cwd();
const parserMdPath = path.join(rootDir, "parser.md");
const docsParserMdPath = path.join(rootDir, "docs/parser.md");
assert(
  !fs.existsSync(parserMdPath),
  "parser.md must not exist in root directory (canonical is docs/parser.md)",
);
assert(fs.existsSync(docsParserMdPath), "docs/parser.md must exist in the docs directory");

const parserContent = fs.readFileSync(docsParserMdPath, "utf8");

// 1. Verify JSON3 schema documentation
assert(
  parserContent.includes("json3") &&
    parserContent.includes("events") &&
    parserContent.includes("tStartMs") &&
    parserContent.includes("dDurationMs") &&
    parserContent.includes("segs") &&
    parserContent.includes("utf8") &&
    parserContent.includes("tOffsetMs"),
  "parser.md must explain the YouTube JSON3 schema and attributes",
);
console.log("✅ PASS: YouTube JSON3 schema comprehensively documented");

// 2. Verify punctuation-based splitting documentation
assert(
  parserContent.includes("Punctuation Characters") &&
    parserContent.includes("Sentence Terminators") &&
    parserContent.includes("/[.?!…。؟]"),
  "parser.md must explain punctuation character splitting and regex",
);
console.log("✅ PASS: Punctuation-based sentence splitting rules documented");

// 3. Verify splitting issues and edge cases documentation
assert(
  parserContent.includes("Missing Punctuation") &&
    parserContent.includes("Abbreviations") &&
    parserContent.includes("Run-on") &&
    parserContent.includes("Cross-Language Drift"),
  "parser.md must detail pure punctuation splitting pitfalls and issues",
);
console.log("✅ PASS: Punctuation splitting issues and pitfalls documented");

// 4. Verify timing calculation features and math documentation
assert(
  parserContent.includes("Natural Speech Pauses") &&
    parserContent.includes("pauseTimes") &&
    parserContent.includes("Context Window Clamping") &&
    parserContent.includes("Multi-Track Timing Consensus"),
  "parser.md must document timing calculation benefits (pauses, window clamps, consensus)",
);
console.log("✅ PASS: Timing calculations and acoustic pause benefits documented");

// 5. Verify educational comparison matrix and UI experimentation guidance
assert(
  parserContent.includes("Comparison Matrix") &&
    parserContent.includes("Interactive Experimentation"),
  "parser.md must provide comparison matrix and interactive experimentation section",
);
console.log("✅ PASS: Comparison matrix and user experimentation guide documented");

console.log("====================================================");
console.log("🎉 All Parser Documentation tests PASSED successfully!");
console.log("====================================================");
