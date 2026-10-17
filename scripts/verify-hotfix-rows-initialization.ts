import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Hotfix: No TDZ ReferenceError for 'rows' in src/routes/index.tsx");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexTsxPath = path.resolve(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");

const content = fs.readFileSync(indexTsxPath, "utf-8");
const lines = content.split("\n");

// 1. Locate line index of `const rows = useMemo`
const rowsDeclLineIdx = lines.findIndex((l) => /const\s+rows\s*=\s*useMemo/.test(l));
assert.ok(rowsDeclLineIdx > 0, "Must locate `const rows = useMemo` declaration in index.tsx");
console.log(`✅ PASS: Located 'const rows = useMemo' at line ${rowsDeclLineIdx + 1}`);

// 2. Locate line index of `handleSwitchToViewerAtTime`
const handleSwitchLineIdx = lines.findIndex((l) =>
  l.includes("const handleSwitchToViewerAtTime = useCallback"),
);
assert.ok(
  handleSwitchLineIdx > 0,
  "Must locate `handleSwitchToViewerAtTime` definition in index.tsx",
);
console.log(`✅ PASS: Located 'handleSwitchToViewerAtTime' at line ${handleSwitchLineIdx + 1}`);

// 3. Assert that handleSwitchToViewerAtTime occurs strictly AFTER rows declaration
assert.ok(
  handleSwitchLineIdx > rowsDeclLineIdx,
  `handleSwitchToViewerAtTime (line ${handleSwitchLineIdx + 1}) must be defined AFTER rows declaration (line ${rowsDeclLineIdx + 1}) to avoid Temporal Dead Zone (TDZ) ReferenceError`,
);
console.log("✅ PASS: handleSwitchToViewerAtTime is positioned safely after rows declaration.");

// 4. Verify that NO hook dependency array prior to rows declaration references `rows`
for (let i = 0; i < rowsDeclLineIdx; i++) {
  const line = lines[i];
  if (/\[[^\]]*\brows\b[^\]]*\]/.test(line)) {
    assert.fail(
      `Line ${i + 1} references 'rows' in a dependency array before its declaration: "${line.trim()}"`,
    );
  }
}
console.log(
  "✅ PASS: Zero premature hook dependency references to 'rows' before line " +
    (rowsDeclLineIdx + 1),
);

// 5. Verify that player.current is referenced rather than undeclared playerRef
const handleSwitchBlock = lines.slice(handleSwitchLineIdx, handleSwitchLineIdx + 30).join("\n");
assert.ok(
  !handleSwitchBlock.includes("playerRef"),
  "handleSwitchToViewerAtTime must not reference undeclared playerRef",
);
assert.ok(
  handleSwitchBlock.includes("player.current"),
  "handleSwitchToViewerAtTime must safely reference player.current",
);
console.log("✅ PASS: player.current properly referenced in handleSwitchToViewerAtTime.");

console.log("=========================================================================");
console.log("🎉 HOTFIX VERIFICATION PASSED: No TDZ ReferenceError for rows!");
console.log("=========================================================================");
