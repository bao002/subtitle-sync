/**
 * scripts/verify-hotfix-word-balloon-init.ts
 *
 * Automated verification for Hotfix (Prompt 166):
 * Fix ReferenceError - TDZ on showWordBalloonLearningView in src/routes/index.tsx
 */

import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log("=========================================================================");
console.log("🧪 Verifying Hotfix 166: showWordBalloonLearningView Initialization Order");
console.log("=========================================================================");

const routesIndexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
assert(fs.existsSync(routesIndexPath), "src/routes/index.tsx must exist");
const routesIndexContent = fs.readFileSync(routesIndexPath, "utf-8");
const lines = routesIndexContent.split("\n");

// Locate declaration of showWordBalloonLearningView
let declLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const [showWordBalloonLearningView, setShowWordBalloonLearningView]")) {
    declLine = i + 1;
    break;
  }
}

assert(declLine !== -1, "showWordBalloonLearningView must be declared in src/routes/index.tsx");
console.log(`ℹ️ showWordBalloonLearningView is declared at line ${declLine}`);

// Ensure no reference to showWordBalloonLearningView exists before declLine
const prematureRefs: { line: number; text: string }[] = [];
for (let i = 0; i < declLine - 1; i++) {
  const line = lines[i];
  if (line.includes("showWordBalloonLearningView") && !line.trim().startsWith("//") && !line.trim().startsWith("/*")) {
    prematureRefs.push({ line: i + 1, text: line.trim() });
  }
}

assert(
  prematureRefs.length === 0,
  `Found premature references to showWordBalloonLearningView before its declaration: ${JSON.stringify(prematureRefs)}`
);
console.log("✅ PASS: Zero premature references to showWordBalloonLearningView before its initialization (TDZ resolved).");

// Ensure auto-pause effect exists after declaration
let pauseEffectFound = false;
for (let i = declLine; i < lines.length; i++) {
  if (lines[i].includes("if (showWordBalloonLearningView || currentAccordionStage === 5)")) {
    pauseEffectFound = true;
    break;
  }
}

assert(pauseEffectFound, "Auto-pause useEffect must exist after showWordBalloonLearningView declaration");
console.log("✅ PASS: Auto-pause useEffect exists safely after showWordBalloonLearningView is declared.");

console.log("=========================================================================");
console.log("🎉 ALL HOTFIX 166 VERIFICATION CHECKS PASSED (2/2)!");
console.log("=========================================================================");
