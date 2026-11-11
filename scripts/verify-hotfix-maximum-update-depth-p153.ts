import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Hotfix: Maximum Update Depth Exceeded Prevention (Prompt 153)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexSource = fs.readFileSync(path.resolve(rootDir, "src/routes/index.tsx"), "utf8");

// --- Test 1: Guarding Leftmost Column Effect in src/routes/index.tsx ---
console.log("\nTest 1: Auditing leftmost column effect guards in src/routes/index.tsx...");
assert.ok(
  indexSource.includes("lastAppliedLeftmostRef = useRef"),
  "index.tsx must declare lastAppliedLeftmostRef to guard leftmost column effect",
);
assert.ok(
  indexSource.includes("lastAppliedLeftmostRef.current === leftMost && favoriteLanguages.includes(leftMost)"),
  "leftmost column effect must guard against repeated execution when leftmost is already applied",
);
assert.ok(
  indexSource.includes("if (prev.includes(leftMost)) return prev;"),
  "setFavoriteLanguagesState inside leftmost effect must return prev when language already exists",
);
console.log("✅ PASS: Leftmost column effect is strictly guarded against infinite loop re-renders.");

// --- Test 2: Guarding shown and spoken Synchronization Effect ---
console.log("\nTest 2: Auditing shown and spoken synchronization effect in src/routes/index.tsx...");
assert.ok(
  indexSource.includes("if (prevShown.length === next.length && prevShown.every((c, i) => c === next[i]))"),
  "setShown must use array shallow-equality guard to return prevShown if unchanged",
);
assert.ok(
  indexSource.includes("if (prevSpoken.length === next.length && prevSpoken.every((c, i) => c === next[i]))"),
  "setSpoken must use array shallow-equality guard to return prevSpoken if unchanged",
);
console.log("✅ PASS: State setters for shown and spoken safely return prev when arrays match.");

// --- Test 3: Guarding videoId Effect Target Languages ---
console.log("\nTest 3: Auditing videoId effect target languages equality guards...");
assert.ok(
  indexSource.includes("if (curr.length === savedLangs.length && curr.every((c, i) => c === savedLangs[i]))"),
  "setTargetLanguages in videoId effect must return curr when savedLangs match",
);
assert.ok(
  indexSource.includes("if (curr.length === next.length && curr.every((c, i) => c === next[i]))"),
  "setTargetLanguages fallback in videoId effect must return curr when next match",
);
console.log("✅ PASS: videoId effect avoids unstable reference allocations.");

// --- Test 4: Guarding primaryTtsLang Effect ---
console.log("\nTest 4: Auditing primaryTtsLang effect guard...");
assert.ok(
  indexSource.includes("lastSyncedPrimaryTtsLangRef = useRef"),
  "index.tsx must declare lastSyncedPrimaryTtsLangRef",
);
assert.ok(
  indexSource.includes("lastSyncedPrimaryTtsLangRef.current !== primaryTtsLang"),
  "primaryTtsLang effect must guard against redundant updates",
);
console.log("✅ PASS: primaryTtsLang synchronization effect is properly guarded.");

// --- Test 5: Guarding setLanguageOrder Effect ---
console.log("\nTest 5: Auditing setLanguageOrder effect array equality guard...");
assert.ok(
  indexSource.includes("prev.length === next.length && prev.every((c, i) => c === next[i])"),
  "setLanguageOrder must compare elements and return prev if unchanged",
);
console.log("✅ PASS: setLanguageOrder effect returns prev when arrays match.");

console.log("=========================================================================");
console.log("🎉 ALL MAXIMUM UPDATE DEPTH HOTFIX CHECKS PASSED (5/5)!");
console.log("=========================================================================");
