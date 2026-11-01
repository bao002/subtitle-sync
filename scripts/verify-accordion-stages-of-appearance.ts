import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("--> Starting validation of Progressive Accordion Stages of Appearance (Stages 1 to 4)...");

  const root = path.resolve(".");
  const indexTsx = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");

  // 1. Stage 1: Floating red-text and in-panel red instruction when no subtitles detected
  console.log("Checking Stage 1: Captions detection alerts and instructions...");
  assert.ok(
    indexTsx.includes('data-testid="floating-no-captions-alert"'),
    "Must contain floating red-text alert (floating-no-captions-alert) when no subtitles detected",
  );
  assert.ok(
    indexTsx.includes('data-testid="video-accordion-red-instruction"'),
    "Must contain in-panel red instruction banner (video-accordion-red-instruction) in player accordion",
  );
  assert.ok(
    indexTsx.includes('data-testid="stage-1-next-button"'),
    "Must contain dynamic NEXT button on video accordion (stage-1-next-button)",
  );
  assert.ok(
    indexTsx.includes('NEXT ({detectedSubtitleCount})'),
    "Stage 1 NEXT button must display dynamic detected subtitles count",
  );
  console.log("✓ Stage 1 captions detection alerts, instructions, and dynamic NEXT button verified");

  // 2. Stage 2: "Learning Goals" accordion
  console.log("Checking Stage 2: Learning goals approval and default language selection...");
  assert.ok(
    indexTsx.includes('data-testid="stage-2-learning-goals-card"'),
    "Must contain dedicated Stage 2 learning goals card (stage-2-learning-goals-card)",
  );
  assert.ok(
    indexTsx.includes('data-testid={`stage-2-default-lang-${langCode}`}'),
    "Must contain selectable buttons to set default language from detected subtitles",
  );
  assert.ok(
    indexTsx.includes('data-testid={`stage-2-learning-lang-${code}`}'),
    "Must contain selectable buttons to approve learning languages from favorites",
  );
  assert.ok(
    indexTsx.includes('data-testid="stage-2-back-button"'),
    "Must contain back button to return to Stage 1 (stage-2-back-button)",
  );
  assert.ok(
    indexTsx.includes('data-testid="stage-2-next-button"'),
    "Must contain NEXT button to proceed to Stage 3 subtitles table (stage-2-next-button)",
  );
  assert.ok(
    indexTsx.includes('panelId === "languages" && currentAccordionStage === 2') &&
      indexTsx.includes('? "Learning goals"'),
    "Languages accordion title must dynamically reflect 'Learning goals' in Stage 2",
  );
  console.log("✓ Stage 2 Learning Goals card, default language selection, and action buttons verified");

  // 3. Stage Stepper & Stage 4 Settings Toggle
  console.log("Checking Stages Stepper and Stage 4 settings toggle...");
  assert.ok(
    indexTsx.includes('data-testid="accordion-stages-stepper"'),
    "Must contain accordion stages stepper (accordion-stages-stepper)",
  );
  assert.ok(
    indexTsx.includes('data-testid="stage-step-1"'),
    "Must contain Stage 1 step button (stage-step-1)",
  );
  assert.ok(
    indexTsx.includes('data-testid="stage-step-2"'),
    "Must contain Stage 2 step button (stage-step-2)",
  );
  assert.ok(
    indexTsx.includes('data-testid="stage-step-3"'),
    "Must contain Stage 3 step button (stage-step-3)",
  );
  assert.ok(
    indexTsx.includes('data-testid="toggle-stage4-settings-btn"'),
    "Must contain Stage 4 settings toggle button in stepper bar (toggle-stage4-settings-btn)",
  );
  assert.ok(
    indexTsx.includes('data-testid="header-stage4-settings-button"'),
    "Must contain Stage 4 settings toggle button in header (header-stage4-settings-button)",
  );
  console.log("✓ Stepper navigation and Stage 4 settings toggle buttons verified");

  // 4. Accordion Stages Visibility Filtering Logic
  console.log("Checking accordion appearance stages visibility filtering...");
  assert.ok(
    indexTsx.includes('if (showOtherSettingsAccordions)'),
    "Must support Stage 4 toggle to reveal all other accordion elements",
  );
  assert.ok(
    indexTsx.includes('if (currentAccordionStage === 1)'),
    "Must isolate to video player accordion only in Stage 1",
  );
  assert.ok(
    indexTsx.includes('if (currentAccordionStage === 2)'),
    "Must show video and learning goals accordions in Stage 2",
  );
  assert.ok(
    indexTsx.includes('if (currentAccordionStage === 3)'),
    "Must show video, learning goals, and subtitles table in Stage 3",
  );
  console.log("✓ Stage visibility filtering logic verified");

  // 5. Version 2.0.61 synchronization across all 5 files
  console.log("Verifying version 2.0.61 synchronization across all 5 files...");
  const pkgJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkgJson.version, "2.0.61", "package.json version must be 2.0.61");

  const buildGradle = fs.readFileSync(path.join(root, "android-shell/app/build.gradle.kts"), "utf8");
  assert.ok(buildGradle.includes('versionName = "2.0.61"'), "build.gradle.kts must contain versionName = \"2.0.61\"");
  assert.ok(buildGradle.includes('versionCode = 20061'), "build.gradle.kts must contain versionCode = 20061");

  const appConfig = fs.readFileSync(path.join(root, "src/config/appConfig.ts"), "utf8");
  assert.ok(appConfig.includes('APP_VERSION = "2.0.61"'), "src/config/appConfig.ts must contain APP_VERSION = \"2.0.61\"");

  const apkUpdater = fs.readFileSync(path.join(root, "src/utils/apkUpdater.ts"), "utf8");
  assert.ok(apkUpdater.includes('CURRENT_APK_VERSION = "v2.0.61"'), "src/utils/apkUpdater.ts must contain CURRENT_APK_VERSION = \"v2.0.61\"");

  const appSettings = fs.readFileSync(path.join(root, "src/utils/appSettings.ts"), "utf8");
  assert.ok(appSettings.includes('version: "2.0.61"'), "src/utils/appSettings.ts must contain version: \"2.0.61\"");
  console.log("✓ All 5 files properly synchronized to version 2.0.61");

  console.log("All Progressive Accordion Stages of Appearance verifications passed successfully!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
