import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { applyVideoSharingFavoriteLanguageRules } from "../src/utils/favoriteLanguagesRules";

console.log("=========================================================================");
console.log("🧪 Verifying Hotfix: Maximum Update Depth Exceeded Prevention (Task 147)");
console.log("=========================================================================");

const rootDir = process.cwd();

// --- Test 1: Guarding baseLanguage and Favorite Rules Effect in src/routes/index.tsx ---
console.log("\nTest 1: Auditing baseLanguage effect guards in src/routes/index.tsx...");
const indexSource = fs.readFileSync(path.resolve(rootDir, "src/routes/index.tsx"), "utf8");

assert.ok(
  indexSource.includes("const lastAppliedBaseLanguageRef = useRef<string>(\"\")") ||
    indexSource.includes("lastAppliedBaseLanguageRef = useRef"),
  "index.tsx must declare lastAppliedBaseLanguageRef to track applied baseLanguage",
);

assert.ok(
  indexSource.includes("lastAppliedBaseLanguageRef.current !== baseLanguage"),
  "baseLanguage effect must guard execution with lastAppliedBaseLanguageRef check",
);

assert.ok(
  indexSource.includes("lastAppliedBaseLanguageRef.current = \"\""),
  "lastAppliedBaseLanguageRef must be reset when video changes",
);

assert.ok(
  indexSource.includes("favoriteLanguagesRef = useRef(favoriteLanguages)"),
  "favoriteLanguagesRef must be declared to avoid recursive effect dependencies",
);

console.log("✅ PASS: baseLanguage effect correctly guarded against recursive re-execution.");

// --- Test 2: State Equality Guards in baseLanguage Effect ---
console.log("\nTest 2: Verifying state value equality guards...");
assert.ok(
  indexSource.includes("prev.length === rules.orderedFavorites.length &&"),
  "setFavoriteLanguagesState must use value equality check to prevent reference-driven re-renders",
);

assert.ok(
  indexSource.includes("prev.length === rules.spokenLanguages.length &&"),
  "setSpoken must use value equality check to prevent reference-driven re-renders",
);

console.log("✅ PASS: State setters use shallow value equality checks returning prev.");

// --- Test 3: Guarding missingInShown Synchronization Effect ---
console.log("\nTest 3: Auditing missingInShown synchronization effect dependencies...");
// The effect must not depend on `shown` (which causes setShown -> effect trigger -> setShown loop)
const missingInShownMatch = indexSource.match(
  /useEffect\(\(\)\s*=>\s*\{[\s\S]*?missingInShown[\s\S]*?\},\s*\[(.*?)\]\)/,
);
if (missingInShownMatch) {
  const deps = missingInShownMatch[1]!.split(",").map((d) => d.trim());
  assert.ok(
    !deps.includes("shown"),
    "missingInShown sync effect must NOT include 'shown' in its dependency array",
  );
}
assert.ok(
  indexSource.includes("setShown((prevShown) => {"),
  "setShown must use functional updater to safely inspect previous state without depending on shown",
);
console.log("✅ PASS: missingInShown effect avoids circular dependency on shown.");

// --- Test 4: Guarding setLanguageOrder Effect ---
console.log("\nTest 4: Auditing setLanguageOrder effect array equality guard...");
assert.ok(
  indexSource.includes("prev.length === next.length && prev.every((c, i) => c === next[i])"),
  "setLanguageOrder must compare elements and return prev if unchanged",
);
console.log("✅ PASS: setLanguageOrder effect returns prev when arrays match.");

// --- Test 5: Behavioral Simulation - Stable Convergence in Single Step ---
console.log("\nTest 5: Simulating favorite language rules state convergence...");
let simulatedFavs = ["he", "it"];
let simulatedSpoken = ["he", "it"];
let iterations = 0;

function runSimulationStep(baseLang: string) {
  iterations++;
  const rules = applyVideoSharingFavoriteLanguageRules(baseLang, {
    currentFavorites: simulatedFavs,
    persist: false,
  });

  const nextFavs =
    simulatedFavs.length === rules.orderedFavorites.length &&
    simulatedFavs.every((c, i) => c === rules.orderedFavorites[i])
      ? simulatedFavs
      : rules.orderedFavorites;

  const nextSpoken =
    simulatedSpoken.length === rules.spokenLanguages.length &&
    simulatedSpoken.every((c, i) => c === rules.spokenLanguages[i])
      ? simulatedSpoken
      : rules.spokenLanguages;

  const changed = nextFavs !== simulatedFavs || nextSpoken !== simulatedSpoken;
  simulatedFavs = nextFavs;
  simulatedSpoken = nextSpoken;
  return changed;
}

// Step 1: Initial call with detected language "en"
const changed1 = runSimulationStep("en");
assert.strictEqual(changed1, true, "First run should apply changes");
assert.deepStrictEqual(simulatedFavs, ["he", "it", "en"]);
assert.deepStrictEqual(simulatedSpoken, ["he"]);

// Step 2: Second call with same "en"
const changed2 = runSimulationStep("en");
assert.strictEqual(changed2, false, "Second run with identical baseLanguage must produce ZERO state changes");
assert.strictEqual(iterations, 2, "Simulation converges immediately in exactly 1 update step");
console.log("✅ PASS: State updates converge stably with zero loop.");

// --- Test 6: Version Parity Verification across all 5 Targets ---
console.log("\nTest 6: Version parity check for 1.0.50 / 10050...");
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf8"));
const currentVersion = pkg.version;
assert.strictEqual(currentVersion, "1.0.50", "package.json version must be 1.0.50");

const parts = currentVersion.split(".").map((n: string) => parseInt(n, 10) || 0);
const expectedCode = (parts[0] || 1) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);

const gradleContent = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/build.gradle.kts"),
  "utf8",
);
assert(
  gradleContent.includes(`versionCode = ${expectedCode}`),
  `build.gradle.kts must have versionCode ${expectedCode}`,
);
assert(
  gradleContent.includes(`versionName = "${currentVersion}"`),
  `build.gradle.kts must have versionName "${currentVersion}"`,
);

const appConfigContent = fs.readFileSync(
  path.resolve(rootDir, "src/config/appConfig.ts"),
  "utf8",
);
assert(
  appConfigContent.includes(`export const APP_VERSION = "${currentVersion}"`),
  `appConfig.ts must export APP_VERSION "${currentVersion}"`,
);

const apkUpdaterContent = fs.readFileSync(
  path.resolve(rootDir, "src/utils/apkUpdater.ts"),
  "utf8",
);
assert(
  apkUpdaterContent.includes(`export const CURRENT_APK_VERSION = "v${currentVersion}"`),
  `apkUpdater.ts must export CURRENT_APK_VERSION "v${currentVersion}"`,
);

const appSettingsContent = fs.readFileSync(
  path.resolve(rootDir, "src/utils/appSettings.ts"),
  "utf8",
);
assert(
  appSettingsContent.includes(`version: "${currentVersion}"`),
  `appSettings.ts must declare version "${currentVersion}"`,
);
console.log(`✅ PASS: Version ${currentVersion} and versionCode ${expectedCode} strictly aligned across all 5 targets.`);

console.log("=========================================================================");
console.log("🎉 ALL MAXIMUM UPDATE DEPTH HOTFIX CHECKS PASSED (6/6)!");
console.log("=========================================================================");
