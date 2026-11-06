import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Hotfix Verification: baseLanguage Declaration Order & TDZ Prevention");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");

const indexContent = fs.readFileSync(indexTsxPath, "utf8");
const lines = indexContent.split("\n");

// 1. Locate the definition of baseLanguage
const baseLanguageDefIndex = lines.findIndex((line) =>
  /const\s+baseLanguage\s*=\s*useMemo/.test(line),
);
assert(
  baseLanguageDefIndex !== -1,
  "baseLanguage must be declared with `const baseLanguage = useMemo` in src/routes/index.tsx",
);
console.log(`✅ PASS: baseLanguage declared at line ${baseLanguageDefIndex + 1}`);

// 2. Ensure ZERO references to baseLanguage exist before its declaration
const priorLinesWithBaseLanguage: { lineNum: number; content: string }[] = [];
for (let i = 0; i < baseLanguageDefIndex; i++) {
  const line = lines[i];
  if (line.includes("baseLanguage")) {
    priorLinesWithBaseLanguage.push({ lineNum: i + 1, content: line.trim() });
  }
}

assert(
  priorLinesWithBaseLanguage.length === 0,
  `Found references to baseLanguage before its initialization: ${JSON.stringify(priorLinesWithBaseLanguage)}`,
);
console.log("✅ PASS: Zero occurrences of baseLanguage before its initialization (TDZ prevented)");

// 3. Ensure handleSpeakCue and handleValidateRemoteService are defined AFTER baseLanguage
const handleValidateRemoteServiceIndex = lines.findIndex((line) =>
  /const\s+handleValidateRemoteService\s*=/.test(line),
);
const handleSpeakCueIndex = lines.findIndex((line) =>
  /const\s+handleSpeakCue\s*=\s*useCallback/.test(line),
);

assert(
  handleValidateRemoteServiceIndex > baseLanguageDefIndex,
  `handleValidateRemoteService (line ${handleValidateRemoteServiceIndex + 1}) must be defined after baseLanguage (line ${baseLanguageDefIndex + 1})`,
);
console.log(
  `✅ PASS: handleValidateRemoteService (line ${handleValidateRemoteServiceIndex + 1}) declared after baseLanguage`,
);

assert(
  handleSpeakCueIndex > baseLanguageDefIndex,
  `handleSpeakCue (line ${handleSpeakCueIndex + 1}) must be defined after baseLanguage (line ${baseLanguageDefIndex + 1})`,
);
console.log(
  `✅ PASS: handleSpeakCue (line ${handleSpeakCueIndex + 1}) declared after baseLanguage`,
);

// 4. Ensure tracksRef is declared before setBaseLanguage
const tracksRefIndex = lines.findIndex((line) =>
  /const\s+tracksRef\s*=\s*useRef/.test(line),
);
const setBaseLanguageIndex = lines.findIndex((line) =>
  /const\s+setBaseLanguage\s*=\s*useCallback/.test(line),
);

assert(
  tracksRefIndex !== -1 && tracksRefIndex < setBaseLanguageIndex,
  `tracksRef (line ${tracksRefIndex + 1}) must be declared before setBaseLanguage (line ${setBaseLanguageIndex + 1})`,
);
console.log(
  `✅ PASS: tracksRef (line ${tracksRefIndex + 1}) declared before setBaseLanguage (line ${setBaseLanguageIndex + 1})`,
);

console.log("=========================================================================");
console.log("🎉 All baseLanguage initialization assertions passed successfully! (100%)");
console.log("=========================================================================");
