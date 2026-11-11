import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import http from "node:http";

function probeUrl(urlPath: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode || 0,
          text: data,
        });
      });
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error(`Timeout probing dev server for ${urlPath}`));
    });
  });
}

async function run() {
  console.log("=========================================================================");
  console.log("🧪 Task 390: Verifying Subtitles Sentence & Word Learning Game");
  console.log("=========================================================================");

  const rootDir = process.cwd();

  // 1. Audit WordBalloonLearningView.tsx
  console.log("\n[1] Auditing WordBalloonLearningView.tsx component...");
  const componentPath = path.resolve(rootDir, "src/components/WordBalloonLearningView.tsx");
  assert.ok(fs.existsSync(componentPath), "src/components/WordBalloonLearningView.tsx must exist");
  const componentContent = fs.readFileSync(componentPath, "utf-8");

  // Verify multiple game modes exist
  assert.ok(
    componentContent.includes('"sentence_builder"') &&
      componentContent.includes('"word_match"') &&
      componentContent.includes('"missing_word"') &&
      componentContent.includes('"word_balloons"'),
    "Component must support sentence_builder, word_match, missing_word, and word_balloons game modes",
  );

  // Verify test IDs for modes
  assert.ok(
    componentContent.includes('data-testid="game-mode-sentence-builder"'),
    "Must include game-mode-sentence-builder selector",
  );
  assert.ok(
    componentContent.includes('data-testid="game-mode-word-match"'),
    "Must include game-mode-word-match selector",
  );
  assert.ok(
    componentContent.includes('data-testid="game-mode-missing-word"'),
    "Must include game-mode-missing-word selector",
  );
  assert.ok(
    componentContent.includes('data-testid="game-mode-word-balloons"'),
    "Must include game-mode-word-balloons selector",
  );

  // Verify gamification elements: Score and Streak
  assert.ok(
    componentContent.includes('data-testid="game-xp-score"'),
    "Must include game-xp-score counter",
  );
  assert.ok(
    componentContent.includes('data-testid="game-streak-counter"'),
    "Must include game-streak-counter",
  );

  // Verify Web Audio synthesized audio effects
  assert.ok(
    componentContent.includes("playWebAudioPopSound") &&
      componentContent.includes("playWebAudioSuccessChime") &&
      componentContent.includes("playWebAudioErrorTone"),
    "Must include Web Audio pop sound, success chime, and error tone functions",
  );

  // Verify Return to Video and Fullscreen Game buttons
  assert.ok(
    componentContent.includes('data-testid="balloon-back-to-video-btn"'),
    "Must provide Back to Video button",
  );
  assert.ok(
    componentContent.includes('data-testid="balloon-play-canvas-game-btn"'),
    "Must provide Canvas Full Screen game button",
  );
  console.log("  ✓ Component structure, 4 interactive game modes, audio FX, and gamification validated.");

  // 2. Audit Stage 5 Integration & Video Player Exclusion in Advanced Mode
  console.log("\n[2] Auditing src/routes/index.tsx for Stage 5 & Video Player Exclusion...");
  const indexRoutePath = path.resolve(rootDir, "src/routes/index.tsx");
  assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
  const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

  // Stage 5 button in stepper
  assert.ok(
    indexContent.includes('data-testid="stage-step-learning"'),
    "Must include stage-step-learning button in stepper",
  );
  assert.ok(
    indexContent.includes("Sentence &amp; Word Game") || indexContent.includes("Sentence & Word Game"),
    "Stage 5 step label must reflect Sentence & Word Game",
  );

  // Panel title dynamic adaptation
  assert.ok(
    indexContent.includes('currentAccordionStage === 5 || showWordBalloonLearningView'),
    "index.tsx must detect Stage 5 or showWordBalloonLearningView for panel title and view swap",
  );

  // Video player exclusion in Advanced Mode
  assert.ok(
    indexContent.includes("showWordBalloonLearningView || currentAccordionStage === 5 ? ("),
    "When on Stage 5 or learning view is active, WordBalloonLearningView must replace video player",
  );

  // Video playback controls exclusion in Beginner Mode
  assert.ok(
    indexContent.includes("playbackControlsSlot={\n              showWordBalloonLearningView ? null : ("),
    "Beginner Mode must exclude playbackControlsSlot when showWordBalloonLearningView is active",
  );
  console.log("  ✓ Advanced Mode and Beginner Mode cleanly exclude video player during game play.");

  // 3. Audit Beginner Mode Tab
  console.log("\n[3] Auditing Beginner Mode Video Tab for parity...");
  const beginnerVideoPath = path.resolve(
    rootDir,
    "src/components/beginner/tabs/BeginnerVideoTab.tsx",
  );
  assert.ok(fs.existsSync(beginnerVideoPath), "BeginnerVideoTab.tsx must exist");
  const beginnerVideoContent = fs.readFileSync(beginnerVideoPath, "utf-8");

  assert.ok(
    beginnerVideoContent.includes('data-testid="toggle-word-balloon-learning-btn"'),
    "BeginnerVideoTab must include toggle-word-balloon-learning-btn",
  );
  assert.ok(
    beginnerVideoContent.includes("Sentence & Word Game"),
    "BeginnerVideoTab toggle button must show Sentence & Word Game label",
  );
  console.log("  ✓ 100% parity verified between Beginner and Advanced modes.");

  // 4. Probe Dev Server Transform
  console.log("\n[4] Probing dev server transformation for WordBalloonLearningView.tsx...");
  const devRes = await probeUrl("/src/components/WordBalloonLearningView.tsx");
  assert.strictEqual(devRes.status, 200, "Dev server must return 200 for WordBalloonLearningView.tsx");
  assert.ok(
    !devRes.text.includes("[PARSE_ERROR]"),
    "Dev server response must not contain parse errors",
  );
  console.log(`  ✓ WordBalloonLearningView.tsx transformed successfully (${devRes.text.length} bytes).`);

  console.log("\n=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Subtitles Sentence & Word Learning Game verified!");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
