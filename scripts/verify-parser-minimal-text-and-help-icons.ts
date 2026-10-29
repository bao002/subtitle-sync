import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Parser Minimal Text & '?' Help Icon Buttons (Chapter 3)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
const beginnerParsingPath = path.join(
  rootDir,
  "src/components/beginner/tabs/BeginnerParsingTab.tsx",
);
const specialCharsPath = path.join(rootDir, "src/components/SpecialCharactersRemovalPanel.tsx");

assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
assert.ok(fs.existsSync(beginnerParsingPath), "BeginnerParsingTab.tsx must exist");
assert.ok(fs.existsSync(specialCharsPath), "SpecialCharactersRemovalPanel.tsx must exist");

const indexCode = fs.readFileSync(indexRoutePath, "utf-8");
const beginnerCode = fs.readFileSync(beginnerParsingPath, "utf-8");
const specialCharsCode = fs.readFileSync(specialCharsPath, "utf-8");

// Test 1: Advanced Mode Parser minimal text & '?' buttons
console.log("--> [Test 1] Verifying Advanced Mode Parser minimal text and '?' buttons...");
assert.ok(
  indexCode.includes("data-testid={`help-btn-${crit.id}`}") ||
    indexCode.includes("help-btn-${crit.id}"),
  "index.tsx must provide '?' help button for each parser criterion",
);

assert.ok(
  indexCode.includes('data-testid="help-btn-criteria-overview"'),
  "index.tsx must provide help-btn-criteria-overview '?' button",
);

assert.ok(
  indexCode.includes('data-testid="help-btn-parser-summary"'),
  "index.tsx must provide help-btn-parser-summary '?' button",
);

assert.ok(
  indexCode.includes("isHelpOpen && (") &&
    indexCode.includes("data-testid={`help-text-${crit.id}`}"),
  "index.tsx criteria description must only render when help is expanded (isHelpOpen)",
);

// Ensure unconditional verbose paragraph under Accumulative Division Criteria was removed
assert.ok(
  !indexCode.includes(
    '<p className="text-xs text-muted-foreground mb-3">\n                              Select multiple criteria accumulatively to divide subtitles into\n                              separated, translatable sections of related sentences and cohesive\n                              context. Click settings to tune inner parameters for each group.\n                            </p>',
  ),
  "Unconditional verbose criteria overview paragraph must be removed in favor of '?' button",
);
console.log("✅ PASS: Advanced Mode parser minimal text and '?' buttons verified.");

// Test 2: Beginner Mode Parser minimal text & '?' buttons
console.log("--> [Test 2] Verifying Beginner Mode Parser minimal text and '?' buttons...");
assert.ok(
  beginnerCode.includes("help-btn-beginner-parsing-header"),
  "BeginnerParsingTab must provide help-btn-beginner-parsing-header '?' button",
);

assert.ok(
  beginnerCode.includes("help-btn-beginner-chars-rules"),
  "BeginnerParsingTab must provide help-btn-beginner-chars-rules '?' button",
);

assert.ok(
  beginnerCode.includes("help-btn-beginner-strip-brackets"),
  "BeginnerParsingTab must provide help-btn-beginner-strip-brackets '?' button",
);

assert.ok(
  beginnerCode.includes("help-btn-beginner-sentence-splitting"),
  "BeginnerParsingTab must provide help-btn-beginner-sentence-splitting '?' button",
);

assert.ok(
  beginnerCode.includes("expandedHelp.sentenceSplitting && (") &&
    beginnerCode.includes("expandedHelp.stripBrackets && ("),
  "BeginnerParsingTab explanations must be conditionally displayed only upon clicking '?'",
);
console.log("✅ PASS: Beginner Mode parser minimal text and '?' buttons verified.");

// Test 3: Special Characters Removal Panel '?' buttons
console.log("--> [Test 3] Verifying SpecialCharactersRemovalPanel minimal text and '?' buttons...");
assert.ok(
  specialCharsCode.includes("help-btn-advanced-chars-stage"),
  "SpecialCharactersRemovalPanel must provide help-btn-advanced-chars-stage '?' button",
);

assert.ok(
  specialCharsCode.includes("help-btn-advanced-strip-brackets"),
  "SpecialCharactersRemovalPanel must provide help-btn-advanced-strip-brackets '?' button",
);

assert.ok(
  specialCharsCode.includes("expandedHelp.stage && (") &&
    specialCharsCode.includes("expandedHelp.stripBrackets && ("),
  "SpecialCharactersRemovalPanel explanations must be conditionally displayed upon clicking '?'",
);
console.log("✅ PASS: SpecialCharactersRemovalPanel '?' buttons verified.");

console.log("=========================================================================");
console.log("🎉 ALL PARSER MINIMAL TEXT & HELP BUTTON CHECKS PASSED (100%)!");
console.log("=========================================================================");
