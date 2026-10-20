import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_LIBRARY_ITEMS, APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";
import { getMockedSubtitlesForVideo, getCachedJson3ForVideoAndLanguage } from "../test/fixtures/defaultSubtitles";

console.log("=== Verifying Subtitles Fixtures Restriction & Hardcoded Subtitles Purge (Task 157) ===");

// 1. Version 1.0.57 checks
const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
assert.strictEqual(pkg.version, "1.0.57", "package.json version must be 1.0.57");
assert.strictEqual(APP_VERSION, "1.0.57", "appConfig.ts APP_VERSION must be 1.0.57");
assert.strictEqual(CURRENT_APK_VERSION, "v1.0.57", "apkUpdater.ts CURRENT_APK_VERSION must be v1.0.57");

const gradle = fs.readFileSync("android-shell/app/build.gradle.kts", "utf-8");
assert.ok(gradle.includes('versionName = "1.0.57"'), "build.gradle.kts must have versionName 1.0.57");
assert.ok(gradle.includes("versionCode = 10057"), "build.gradle.kts must have versionCode 10057");

const appSettings = fs.readFileSync("src/utils/appSettings.ts", "utf-8");
assert.ok(appSettings.includes('version: "1.0.57"'), "appSettings.ts must have version 1.0.57");
console.log("✓ Version 1.0.57 verified across all 5 targets.");

// 2. AGENTS.md policy verification
const agentsMd = fs.readFileSync("AGENTS.md", "utf-8");
assert.ok(
  agentsMd.includes("Subtitles fixtures restriction & zero hardcoded subtitles policy"),
  "AGENTS.md must define the fixtures restriction policy",
);
assert.ok(
  agentsMd.includes("L2Ryrr6txwA") && agentsMd.includes("public/fixtures/L2Ryrr6txwA"),
  "AGENTS.md must restrict fixtures strictly to L2Ryrr6txwA in public/fixtures/L2Ryrr6txwA",
);
assert.ok(
  agentsMd.includes("Zero hardcoded subtitles policy"),
  "AGENTS.md must declare zero hardcoded subtitles policy",
);
console.log("✓ AGENTS.md fixtures restriction and zero hardcoded subtitles policy verified.");

// 3. Purge verification in src/config/fixtures.ts
const fixturesConfig = fs.readFileSync("src/config/fixtures.ts", "utf-8");
assert.ok(
  !fixturesConfig.includes("SAMPLE_AUTHENTIC_RUSSIAN_CUES"),
  "src/config/fixtures.ts must not contain SAMPLE_AUTHENTIC_RUSSIAN_CUES",
);
assert.ok(
  !fixturesConfig.includes("SAMPLE_TRANSLATIONS"),
  "src/config/fixtures.ts must not contain SAMPLE_TRANSLATIONS",
);
console.log("✓ src/config/fixtures.ts verified free of hardcoded subtitles.");

// 4. Purge verification in src/config/appConfig.ts
DEFAULT_LIBRARY_ITEMS.forEach((item) => {
  assert.strictEqual(
    item.cues.length,
    0,
    `DEFAULT_LIBRARY_ITEMS video ${item.id} must have empty cues (found ${item.cues.length})`,
  );
});
console.log("✓ All DEFAULT_LIBRARY_ITEMS verified with empty cues (no hardcoded subtitles).");

// 5. Fixture restriction in test/fixtures/defaultSubtitles.ts
const mockedOther = getMockedSubtitlesForVideo("EILFkSGNkdA");
assert.strictEqual(mockedOther.length, 0, "No fixtures allowed for EILFkSGNkdA");
const cachedOther = getCachedJson3ForVideoAndLanguage("EILFkSGNkdA", "en");
assert.strictEqual(cachedOther, null, "No cached JSON3 fixtures allowed for EILFkSGNkdA");

// Verify authentic fixture for L2Ryrr6txwA at public/fixtures/L2Ryrr6txwA
const enFixturePath = "public/fixtures/L2Ryrr6txwA/en.json";
assert.ok(fs.existsSync(enFixturePath), "public/fixtures/L2Ryrr6txwA/en.json must exist");
const rawEnFixture = fs.readFileSync(enFixturePath, "utf-8");
const parsedJson = JSON.parse(rawEnFixture);
assert.ok(Array.isArray(parsedJson.events) && parsedJson.events.length > 0, "L2Ryrr6txwA en.json must contain valid events");
console.log(`✓ L2Ryrr6txwA approved demo fixture verified at public/fixtures/L2Ryrr6txwA/en.json (${parsedJson.events.length} events).`);


// 6. Verify public/fixtures directory structure
const fixturesDir = "public/fixtures";
if (fs.existsSync(fixturesDir)) {
  const dirs = fs.readdirSync(fixturesDir).filter((f) => fs.statSync(path.join(fixturesDir, f)).isDirectory());
  dirs.forEach((d) => {
    assert.strictEqual(
      d,
      "L2Ryrr6txwA",
      `Only L2Ryrr6txwA is permitted as a fixture folder in public/fixtures (found ${d})`,
    );
  });
  console.log("✓ public/fixtures verified to only contain L2Ryrr6txwA.");
}

console.log("=== All Subtitles Fixtures Restriction & Purge Checks Passed Successfully! ===");
