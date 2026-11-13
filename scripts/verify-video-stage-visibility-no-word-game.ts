import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Task 397: Video Stage Visibility & No Stuck Word Game");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

// 1. showWordBalloonLearningView must NOT initialize from stale localStorage unless ?stage=5 or ?stage=learning
console.log("1. Checking showWordBalloonLearningView initialization guard...");
const initBlockMatch = indexContent.match(
  /const \[showWordBalloonLearningView,\s*setShowWordBalloonLearningView\]\s*=\s*useState<boolean>\(\(\)\s*=>\s*\{([\s\S]*?)\}\);/,
);
assert.ok(initBlockMatch, "showWordBalloonLearningView useState initializer must exist");
const initBody = initBlockMatch[1];
assert.ok(
  initBody.includes('stageParam === "5"') && initBody.includes('stageParam === "learning"'),
  "showWordBalloonLearningView should only boot true for explicit stage=5 or stage=learning query params",
);
assert.ok(
  initBody.includes('localStorage.setItem("subtitle_sync_word_balloon_learning_view", "false")'),
  "showWordBalloonLearningView initializer must clear stale localStorage learning-view flag",
);
console.log("✓ PASS: Initializer guard verified");

// 2. Stage synchronization useEffect must clear showWordBalloonLearningView when leaving Stage 5 or entering Stage 3
console.log("2. Checking currentAccordionStage effect synchronization...");
assert.ok(
  indexContent.includes("if (currentAccordionStage !== 5) {") &&
    indexContent.includes("else if (currentAccordionStage === 3) {"),
  "useEffect([currentAccordionStage]) must handle non-5 stages and Stage 3 explicitly",
);
const stageEffectStart = indexContent.indexOf("if (currentAccordionStage !== 5) {");
const stageEffectSlice = indexContent.slice(stageEffectStart, stageEffectStart + 1200);
assert.ok(
  stageEffectSlice.includes("setShowWordBalloonLearningView(false);"),
  "Stage effect must reset setShowWordBalloonLearningView(false) when not on Stage 5",
);
assert.ok(
  stageEffectSlice.includes("setOpenPanels((prev) => ({ ...prev, player: true }));"),
  "Stage effect must open player panel on Stage 3",
);
console.log("✓ PASS: Stage effect synchronization verified");

// 3. Explicit Stage 3 navigation triggers & Play trigger reset Word Game & open Video Stage
console.log("3. Checking Stage 3 buttons and Play handler...");
const step3Idx = indexContent.indexOf('id="stage-step-3"');
assert.ok(step3Idx > -1, "stage-step-3 button must exist");
const step3Slice = indexContent.slice(step3Idx, step3Idx + 850);
assert.ok(
  step3Slice.includes("setShowWordBalloonLearningView(false)") &&
    step3Slice.includes("setCurrentAccordionStage(3)") &&
    step3Slice.includes("player: true"),
  "#stage-step-3 onClick must clear Word Game, select Stage 3, and open player panel",
);

const stage2ToVideoIdx = indexContent.indexOf('id="stage-2-to-video-button"');
assert.ok(stage2ToVideoIdx > -1, "stage-2-to-video-button must exist");
const stage2ToVideoSlice = indexContent.slice(stage2ToVideoIdx, stage2ToVideoIdx + 1800);
assert.ok(
  stage2ToVideoSlice.includes("setShowWordBalloonLearningView(false)") &&
    stage2ToVideoSlice.includes("setCurrentAccordionStage(3)") &&
    stage2ToVideoSlice.includes("player: true"),
  "#stage-2-to-video-button onClick must clear Word Game, select Stage 3, and open player panel",
);

const playVideoIdx = indexContent.indexOf("const handlePlayVideo = useCallback(() => {");
assert.ok(playVideoIdx > -1, "handlePlayVideo must exist");
const playVideoSlice = indexContent.slice(playVideoIdx, playVideoIdx + 1200);
assert.ok(
  playVideoSlice.includes("setShowWordBalloonLearningView(false)") &&
    playVideoSlice.includes('setActiveTopTab("viewer")') &&
    playVideoSlice.includes("setCurrentAccordionStage(3)") &&
    playVideoSlice.includes('setBeginnerActiveTab("video")'),
  "handlePlayVideo must exit Word Game, restore viewer tab, and activate Video Stage in both modes",
);
console.log("✓ PASS: All Stage 3 & Play entry points verified");

// 4. Stage 5 still intentionally renders WordBalloonLearningView when selected
console.log("4. Checking Stage 5 Word Game rendering remains intact...");
assert.ok(
  indexContent.includes("showWordBalloonLearningView || currentAccordionStage === 5 ? (") &&
    indexContent.includes('id="stage-step-learning"'),
  "Stage 5 must still render WordBalloonLearningView when explicitly activated",
);
console.log("✓ PASS: Stage 5 rendering intact");

console.log("=========================================================================");
console.log("🎉 ALL TASK 397 VIDEO STAGE VISIBILITY CHECKS PASSED 100%!");
console.log("=========================================================================");
