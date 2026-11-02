import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Next Version Architectural Review Test");
console.log("====================================================");

const rootDir = process.cwd();
const docPath = path.join(rootDir, "docs/next_version_from_scratch.md");

// 1. Verify docs/next_version_from_scratch.md exists
assert(fs.existsSync(docPath), "docs/next_version_from_scratch.md must exist");
const content = fs.readFileSync(docPath, "utf8");

// 2. Verify all 5 sequential steps exist
const requiredSteps = [
  "Step 1: Media Host & Playback Clock",
  "Step 2: Caption Ingestion & Schema Gate",
  "Step 3: Text Sanitization & Sentence Boundary Splitting",
  "Step 4: Multi-Language Sentence Matrix Alignment",
  "Step 5: Read-Along & Audio Synthesis Coordinator",
];

for (const step of requiredSteps) {
  assert(content.includes(step), `Architecture doc must include "${step}"`);
}
console.log("✅ PASS: All 5 sequential pipeline steps verified.");

// 3. Verify key app-level design decisions are documented
const requiredDesignDecisions = [
  "Unidirectional Media-Driven Pipeline",
  "100% Client-Side Reactive State",
  "Finite State Machine",
  "No Monolithic Mega-Files",
  "No Dual-Mode DOM Duplication",
  "No Premature Database",
  "No Ad-hoc Race Conditions or Timer Hacks",
  "No Hardcoded Subtitle Pollution",
];

for (const decision of requiredDesignDecisions) {
  assert(
    content.toLowerCase().includes(decision.toLowerCase()),
    `Architecture doc must document app-level decision "${decision}"`,
  );
}
console.log("✅ PASS: Core app-level design decisions and pitfall omissions verified.");

// 4. Verify Component Inventory goals
const requiredComponents = [
  "VideoPlayerHost",
  "SubtitleMatrixView",
  "SentenceRow",
  "AudioCoordinator",
  "LanguageSelector",
  "PlaybackToolbar",
  "PreferencesDrawer",
  "CaptionSourceGate",
];

for (const comp of requiredComponents) {
  assert(content.includes(comp), `Architecture doc must document component "${comp}"`);
}
console.log("✅ PASS: All 8 core components and their responsibilities verified.");

// 5. Verify Section 7 Yes/No Diagnostic Guide exists and contains all 8 questions
assert(
  content.includes("## 7. Architectural Review: Key App-Level Design Decisions (Yes/No Diagnostic Guide)"),
  "Architecture doc must contain Section 7 Yes/No review",
);

const expectedQuestions = [
  "Should the video player clock serve as the single, unidirectional heartbeat",
  "Must text sanitization (stripping speaker brackets, sound effects, arrows) occur strictly before sentence boundary detection",
  "Does the application require a backend database (PostgreSQL, Supabase, Firestore)",
  "Should read-along and speech synthesis (TTS) timing be governed by an explicit Finite State Machine",
  "Should \"Beginner Mode\" and \"Advanced Mode\" be built as separate, parallel component hierarchies",
  "Should the application bundle hardcoded subtitle cue arrays",
  "Should route/page components contain business logic",
  "Should secondary/translated subtitle tracks define their own independent sentence rows",
];

for (const q of expectedQuestions) {
  assert(content.includes(q), `Architecture doc Section 7 must contain question: "${q}"`);
}
console.log("✅ PASS: All 8 Yes/No architectural questions verified in Section 7.");

console.log("====================================================");
console.log("🎉 Architectural Review Test PASSED successfully!");
console.log("====================================================");
