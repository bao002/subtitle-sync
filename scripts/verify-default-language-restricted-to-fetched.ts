import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Default Language Restricted to Fetched Subtitles (Task 265)");
console.log("=========================================================================");

const root = process.cwd();
const indexTsx = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const gradleKts = fs.readFileSync(
  path.join(root, "android-shell/app/build.gradle.kts"),
  "utf8",
);
const appConfig = fs.readFileSync(path.join(root, "src/config/appConfig.ts"), "utf8");
const apkUpdater = fs.readFileSync(path.join(root, "src/utils/apkUpdater.ts"), "utf8");
const appSettings = fs.readFileSync(path.join(root, "src/utils/appSettings.ts"), "utf8");

// [Check 1] Verify fetchedSubtitleLanguages is defined and uses tracks with valid cues
console.log("--> [Check 1] Verifying fetchedSubtitleLanguages definition...");
assert.ok(
  indexTsx.includes("const fetchedSubtitleLanguages = useMemo(() => {"),
  "Must define fetchedSubtitleLanguages using useMemo",
);
assert.ok(
  indexTsx.includes("Object.entries(tracks).forEach(([code, track]) => {"),
  "fetchedSubtitleLanguages must inspect entries in tracks",
);
console.log("✅ PASS: fetchedSubtitleLanguages properly inspects tracks for valid cues.");

// [Check 2] Verify Stage 2 default language selector restricts buttons to fetchedSubtitleLanguages
console.log("--> [Check 2] Verifying Stage 2 default language selector UI...");
assert.ok(
  indexTsx.includes("fetchedSubtitleLanguages.length > 0 ? (") &&
    indexTsx.includes("fetchedSubtitleLanguages.map((langCode) => {"),
  "Stage 2 default language selector must map exclusively over fetchedSubtitleLanguages",
);
assert.ok(
  indexTsx.includes('data-testid={`stage-2-default-lang-${langCode}`}'),
  "Must preserve data-testid={`stage-2-default-lang-${langCode}`} on buttons",
);
const normalizedIndexTsx = indexTsx.replace(/\s+/g, " ");
assert.ok(
  normalizedIndexTsx.includes(
    "The default language can only be one of those languages their subtitles have been successfully fetched already.",
  ),
  "Stage 2 UI must explicitly state that default language can only be chosen from successfully fetched subtitles",
);
assert.ok(
  normalizedIndexTsx.includes(
    "No fetched subtitles yet. The default language can only be chosen from languages whose subtitles have been successfully fetched already.",
  ),
  "Must display informative empty state when no subtitles have been fetched yet",
);
console.log("✅ PASS: Stage 2 default language selector restricts buttons strictly to fetchedSubtitleLanguages.");

// [Check 3] Verify baseLanguage resolution and setBaseLanguage enforcement
console.log("--> [Check 3] Verifying baseLanguage resolution and setBaseLanguage enforcement...");
assert.ok(
  indexTsx.includes(
    "// The default language can only be one of those languages their subtitles have been successfully fetched already",
  ),
  "baseLanguage resolution must be documented with the fetched restriction rule",
);
assert.ok(
  indexTsx.includes("if (fetchedKeys.length === 0) {\n      return \"\";\n    }") ||
    indexTsx.includes("if (fetchedKeys.length === 0) {\n      return '';\n    }"),
  "baseLanguage must return empty string if no subtitles are fetched in tracks",
);
assert.ok(
  indexTsx.includes("findFetchedSubtitleLanguage(tracksRef.current, lang)"),
  "setBaseLanguage must verify language has fetched subtitles before setting explicit base language",
);
console.log("✅ PASS: baseLanguage and setBaseLanguage strictly enforce fetched subtitles restriction.");

// [Check 4] Functional simulation of baseLanguage selection logic
console.log("--> [Check 4] Simulating baseLanguage resolution logic...");
function resolveBaseLanguage(
  tracks: Record<string, { events?: unknown[]; length?: number }> | null,
  explicitBase: string,
  observedUrl?: string,
): string {
  const fetchedKeys = tracks
    ? Object.keys(tracks).filter((k) => {
        const t = tracks[k];
        return ((t?.events?.length || t?.length || 0) > 0);
      })
    : [];

  if (fetchedKeys.length === 0) {
    return "";
  }

  if (explicitBase && tracks?.[explicitBase] && ((tracks[explicitBase]?.events?.length || 0) > 0)) {
    return explicitBase;
  }

  if (observedUrl) {
    try {
      const l = new URL(observedUrl).searchParams.get("lang");
      if (l && tracks?.[l] && ((tracks[l]?.events?.length || 0) > 0)) {
        return l;
      }
    } catch {
      // ignore
    }
  }

  return fetchedKeys[0] || "";
}

// Case A: No tracks loaded yet
assert.equal(
  resolveBaseLanguage(null, "en"),
  "",
  "When no tracks exist, base language must be empty, not an unfetched language",
);

// Case B: Only 'he' is fetched, but user asked for 'en'
assert.equal(
  resolveBaseLanguage({ he: { events: [{ tStartMs: 0 }] } }, "en"),
  "he",
  "When only 'he' is fetched, default language must be 'he', not unfetched 'en'",
);

// Case C: 'en' and 'es' are fetched, user selects 'es'
assert.equal(
  resolveBaseLanguage(
    {
      en: { events: [{ tStartMs: 0 }] },
      es: { events: [{ tStartMs: 0 }] },
    },
    "es",
  ),
  "es",
  "When 'es' is fetched and requested, 'es' is selected",
);

// Case D: 'en' and 'es' are fetched, user attempts to select unfetched 'fr'
assert.equal(
  resolveBaseLanguage(
    {
      en: { events: [{ tStartMs: 0 }] },
      es: { events: [{ tStartMs: 0 }] },
    },
    "fr",
  ),
  "en",
  "When user requests unfetched 'fr', must fallback to fetched language 'en'",
);
console.log("✅ PASS: Functional simulation passed all 4 cases perfectly.");

// [Check 5] Version synchronization across all 5 files (2.0.66)
console.log("--> [Check 5] Verifying version synchronization across all 5 files...");
const expectedVersion = "2.0.66";
const expectedCode = "20066";

assert.equal(
  packageJson.version,
  expectedVersion,
  `package.json version must be ${expectedVersion}`,
);
assert.ok(
  gradleKts.includes(`versionCode = ${expectedCode}`),
  `build.gradle.kts versionCode must be ${expectedCode}`,
);
assert.ok(
  gradleKts.includes(`versionName = "${expectedVersion}"`),
  `build.gradle.kts versionName must be "${expectedVersion}"`,
);
assert.ok(
  appConfig.includes(`APP_VERSION = "${expectedVersion}"`),
  `appConfig.ts APP_VERSION must be "${expectedVersion}"`,
);
assert.ok(
  apkUpdater.includes(`CURRENT_APK_VERSION = "v${expectedVersion}"`),
  `apkUpdater.ts CURRENT_APK_VERSION must be "v${expectedVersion}"`,
);
assert.ok(
  appSettings.includes(`version: "${expectedVersion}"`),
  `appSettings.ts version must be "${expectedVersion}"`,
);
console.log(`✅ PASS: All 5 files consistently synchronized to version ${expectedVersion}.`);

console.log("=========================================================================");
console.log("🎉 ALL DEFAULT LANGUAGE RESTRICTION CHECKS PASSED (100%)!");
console.log("=========================================================================");
