import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("--> Starting validation of Programmatic Caption Triggering & Automation Guide (Task 364)...");

  const root = path.resolve(".");

  // 1. Validate docs/automation_enable_captions.md exists and is thorough
  console.log("Checking docs/automation_enable_captions.md documentation...");
  const docPath = path.join(root, "docs/automation_enable_captions.md");
  assert.ok(fs.existsSync(docPath), "docs/automation_enable_captions.md must exist strictly under docs/*.md");
  const docContent = fs.readFileSync(docPath, "utf8");

  assert.ok(
    docContent.includes("loadModule") && docContent.includes("captions"),
    "Doc must explain player.loadModule('captions')",
  );
  assert.ok(
    docContent.includes("setOption") && docContent.includes("track") && docContent.includes("languageCode"),
    "Doc must explain player.setOption('captions', 'track', { languageCode })",
  );
  assert.ok(
    docContent.includes("timedtext"),
    "Doc must explain the timedtext network interception pipeline",
  );
  assert.ok(
    docContent.includes("native") && docContent.includes("icon"),
    "Doc must explain achieving caption triggering without the native YouTube CC button",
  );
  assert.ok(
    docContent.includes("grace"),
    "Doc must explain the quiet grace window for noise reduction before fallback alert",
  );
  console.log("✓ docs/automation_enable_captions.md verified");

  // 2. Validate src/routes/index.tsx programmatic caption activation
  console.log("Checking src/routes/index.tsx programmatic caption triggering...");
  const indexTsx = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");

  assert.ok(
    indexTsx.includes("triggerProgrammaticCaptions"),
    "index.tsx must define triggerProgrammaticCaptions callback",
  );
  assert.ok(
    indexTsx.includes('loadModule?.("captions")') || indexTsx.includes('loadModule("captions")'),
    "Must invoke loadModule('captions') programmatically",
  );
  assert.ok(
    indexTsx.includes('setOption?.("captions", "track", { languageCode:') ||
      indexTsx.includes('setOption?.("captions", "track", { languageCode'),
    "Must command the player with setOption('captions', 'track', ...)",
  );
  assert.ok(
    indexTsx.includes("captionsAlertGraceActive"),
    "Must maintain captionsAlertGraceActive state for quiet noise reduction",
  );
  assert.ok(
    indexTsx.includes("!captionsAlertGraceActive"),
    "floating-no-captions-alert must wait for !captionsAlertGraceActive before rendering",
  );
  assert.ok(
    indexTsx.includes('data-testid="btn-auto-trigger-captions"'),
    "Must provide button to auto-trigger captions on demand in player accordion",
  );
  console.log("✓ Programmatic caption triggering and grace window verified in index.tsx");

  // 3. Verify single source of truth versioning
  console.log("Checking version synchronization...");
  const pkgJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const expectedVer = pkgJson.version;
  const parts = expectedVer.split(".").map((p: string) => parseInt(p, 10) || 0);
  const expectedCode = parts[0] * 10000 + parts[1] * 100 + parts[2];

  const buildGradle = fs.readFileSync(path.join(root, "android-shell/app/build.gradle.kts"), "utf8");
  assert.ok(buildGradle.includes(`versionName = "${expectedVer}"`));
  assert.ok(buildGradle.includes(`versionCode = ${expectedCode}`));
  console.log(`✓ Version ${expectedVer} synchronized`);

  console.log("All Programmatic Caption Triggering verifications passed successfully!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
