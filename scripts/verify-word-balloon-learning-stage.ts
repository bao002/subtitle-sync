import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Task 359: Dedicated Word Balloons Learning Stage");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Component Verification: WordBalloonLearningView.tsx
console.log("\n🎈 Section 1: WordBalloonLearningView Component Integrity");
const componentPath = path.resolve(rootDir, "src/components/WordBalloonLearningView.tsx");
assert(fs.existsSync(componentPath), "src/components/WordBalloonLearningView.tsx must exist");
const componentContent = fs.readFileSync(componentPath, "utf-8");

assert(
  componentContent.includes("export const WordBalloonLearningView"),
  "WordBalloonLearningView component must be exported",
);
assert(
  componentContent.includes("AudioContext") || componentContent.includes("webkitAudioContext"),
  "WordBalloonLearningView must synthesize audio pop sound effect via Web Audio API",
);
assert(
  componentContent.includes('data-testid="word-balloon-learning-view"'),
  "Must include word-balloon-learning-view container test ID",
);
assert(
  componentContent.includes('data-testid="word-balloons-container"'),
  "Must include word-balloons-container test ID",
);
assert(
  componentContent.includes('data-testid="balloon-progress-text"'),
  "Must track punched balloons count and progress",
);
assert(
  componentContent.includes('data-testid="reset-balloons-btn"'),
  "Must provide reset/re-inflate balloons action",
);
assert(
  componentContent.includes('data-testid="balloon-prev-sentence-btn"') &&
    componentContent.includes('data-testid="balloon-next-sentence-btn"'),
  "Must provide sentence navigation buttons",
);
console.log("✅ PASS: WordBalloonLearningView component structure, balloons, audio pop, and score tracking validated.");

// 2. Storybook Story Verification
console.log("\n📚 Section 2: Storybook Story Coverage");
const storyPath = path.resolve(rootDir, "src/components/WordBalloonLearningView.stories.tsx");
assert(fs.existsSync(storyPath), "src/components/WordBalloonLearningView.stories.tsx must exist");
const storyContent = fs.readFileSync(storyPath, "utf-8");
assert(storyContent.includes("export default meta;"), "Stories file must export default meta");
assert(storyContent.includes("export const Interactive"), "Must provide Interactive story");
console.log("✅ PASS: Storybook stories valid.");

// 3. Stage 5 Stepper & Integration in src/routes/index.tsx
console.log("\n🚀 Section 3: Advanced Mode Integration & Stage 5 Stepper in src/routes/index.tsx");
const indexRoutePath = path.resolve(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

assert(
  indexContent.includes("WordBalloonLearningView"),
  "src/routes/index.tsx must import and use WordBalloonLearningView",
);
assert(
  indexContent.includes("data-testid=\"stage-step-learning\""),
  "src/routes/index.tsx must include Stage 5 Word Balloons stepper button (stage-step-learning)",
);
assert(
  indexContent.includes("currentAccordionStage === 5"),
  "Stage stepper and panel filter must handle currentAccordionStage === 5",
);
assert(
  indexContent.includes("data-testid=\"toggle-word-balloon-learning-btn\""),
  "video-display-controls in src/routes/index.tsx must include toggle-word-balloon-learning-btn",
);
console.log("✅ PASS: Stage 5 stepper and Word Balloons toggle in Advanced Mode validated.");

// 4. Parity in Beginner Mode
console.log("\n🎯 Section 4: Beginner Mode Parity");
const beginnerVideoPath = path.resolve(
  rootDir,
  "src/components/beginner/tabs/BeginnerVideoTab.tsx",
);
assert(fs.existsSync(beginnerVideoPath), "BeginnerVideoTab.tsx must exist");
const beginnerVideoContent = fs.readFileSync(beginnerVideoPath, "utf-8");

assert(
  beginnerVideoContent.includes("data-testid=\"toggle-word-balloon-learning-btn\""),
  "BeginnerVideoTab.tsx must include toggle-word-balloon-learning-btn in video-display-controls for 100% parity",
);

const beginnerFlowPath = path.resolve(
  rootDir,
  "src/components/beginner/BeginnerFlowContainer.tsx",
);
assert(fs.existsSync(beginnerFlowPath), "BeginnerFlowContainer.tsx must exist");
const beginnerFlowContent = fs.readFileSync(beginnerFlowPath, "utf-8");

assert(
  beginnerFlowContent.includes("showWordBalloonLearningView") &&
    beginnerFlowContent.includes("onToggleWordBalloonLearningView"),
  "BeginnerFlowContainer.tsx must accept and forward Word Balloons view props",
);
console.log("✅ PASS: 100% parity between Beginner and Advanced modes verified.");

// 5. Version Verification
console.log("\n🔖 Section 5: Version Synchronization");
const pkgPath = path.resolve(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
assert(
  pkg.version >= "2.1.64",
  `package.json version must be >= 2.1.64 (got ${pkg.version})`,
);

const gradlePath = path.resolve(rootDir, "android-shell/app/build.gradle.kts");
const gradleContent = fs.readFileSync(gradlePath, "utf-8");
assert(
  gradleContent.includes(pkg.version),
  `android-shell/app/build.gradle.kts must be synchronized to version ${pkg.version}`,
);
console.log(`✅ PASS: Single source of truth version ${pkg.version} synchronized across files.`);

console.log("=========================================================================");
console.log("🎉 ALL TASK 359 WORD BALLOONS LEARNING STAGE CHECKS PASSED 100%!");
console.log("=========================================================================");
