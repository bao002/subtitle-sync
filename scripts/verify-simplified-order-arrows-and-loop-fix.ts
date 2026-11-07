import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Simplified Arrow Buttons & Loop Prevention Hotfix (Task 333)");
console.log("=========================================================================");

const root = process.cwd();

// --------------------------------------------------------------------------
// [Test 1] Verify Hotfix: shown and languageOrder effects guard against loop
// --------------------------------------------------------------------------
console.log("--> [Test 1] Auditing infinite re-render loop prevention in index.tsx...");

const indexTsx = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");

// Verify shown sync effect does NOT have shown in its dependency array
const shownEffectMatch = indexTsx.match(
  /useEffect\(\(\)\s*=>\s*\{[\s\S]*?missingInShown[\s\S]*?\},\s*\[(.*?)\]\)/,
);
assert.ok(shownEffectMatch, "shown synchronization effect must exist");
const shownDeps = shownEffectMatch[1]!.split(",").map((s) => s.trim());
assert.ok(
  !shownDeps.includes("shown"),
  "shown synchronization effect must NOT include 'shown' in dependencies to avoid recursive re-renders",
);

// Verify languageOrder effect guards with array equality check
const languageOrderEffectMatch = indexTsx.match(
  /setLanguageOrder\(\(prev\)\s*=>\s*\{[\s\S]*?return\s+next;[\s\S]*?\}\);/,
);
assert.ok(languageOrderEffectMatch, "setLanguageOrder effect must exist");
assert.ok(
  indexTsx.includes("prev.length === next.length && prev.every((c, i) => c === next[i])"),
  "setLanguageOrder must compare arrays and return prev if elements match",
);

console.log("✅ PASS: State synchronization effects are safely guarded against infinite loop.");

// --------------------------------------------------------------------------
// [Test 2] Verify Simplified Arrow Buttons in Language Order Controls
// --------------------------------------------------------------------------
console.log("--> [Test 2] Auditing simplified arrow buttons in stage 2 order controls...");

assert.ok(
  indexTsx.includes('data-testid={`stage-2-btn-move-lang-up-${langCode}`}'),
  "Must retain stage-2-btn-move-lang-up testid",
);
assert.ok(
  indexTsx.includes('data-testid={`stage-2-btn-move-lang-down-${langCode}`}'),
  "Must retain stage-2-btn-move-lang-down testid",
);

const upIdx = indexTsx.indexOf('data-testid={`stage-2-btn-move-lang-up-${langCode}`}');
const downIdx = indexTsx.indexOf('data-testid={`stage-2-btn-move-lang-down-${langCode}`}');

assert.ok(upIdx !== -1, "Must find stage-2-btn-move-lang-up");
assert.ok(downIdx !== -1, "Must find stage-2-btn-move-lang-down");

const upButtonSlice = indexTsx.slice(upIdx, upIdx + 600);
const downButtonSlice = indexTsx.slice(downIdx, downIdx + 600);

assert.ok(
  !upButtonSlice.includes("<span>Earlier</span>"),
  "Order up button must NOT contain verbose 'Earlier' text span - simplified to arrow buttons",
);
assert.ok(
  !downButtonSlice.includes("<span>Later</span>"),
  "Order down button must NOT contain verbose 'Later' text span - simplified to arrow buttons",
);
assert.ok(
  upButtonSlice.includes("<ChevronUp"),
  "Must render ChevronUp icon in up-button",
);
assert.ok(
  downButtonSlice.includes("<ChevronDown"),
  "Must render ChevronDown icon in down-button",
);

console.log("✅ PASS: Language order controls successfully simplified to clean arrow buttons.");

// --------------------------------------------------------------------------
// [Test 3] Verify Simplified Arrow Buttons in VideoPlaybackPrecedenceBar
// --------------------------------------------------------------------------
console.log("--> [Test 3] Auditing VideoPlaybackPrecedenceBar arrow button simplification...");

const precedenceBarTsx = fs.readFileSync(
  path.join(root, "src/components/VideoPlaybackPrecedenceBar.tsx"),
  "utf8",
);

assert.ok(
  !precedenceBarTsx.includes("<span>Move Up</span>"),
  "VideoPlaybackPrecedenceBar must not have 'Move Up' text span",
);
assert.ok(
  !precedenceBarTsx.includes("<span>Move Down</span>"),
  "VideoPlaybackPrecedenceBar must not have 'Move Down' text span",
);
assert.ok(
  precedenceBarTsx.includes('data-testid="btn-move-video-bar-up"'),
  "Must retain btn-move-video-bar-up",
);
assert.ok(
  precedenceBarTsx.includes('data-testid="btn-move-video-bar-down"'),
  "Must retain btn-move-video-bar-down",
);

console.log("✅ PASS: VideoPlaybackPrecedenceBar action buttons simplified to arrow buttons.");

console.log("=========================================================================");
console.log("🎉 ALL CHECKS PASSED! Task 333 verified successfully.");
console.log("=========================================================================");
