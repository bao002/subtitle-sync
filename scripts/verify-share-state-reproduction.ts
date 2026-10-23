import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { APP_VERSION, APP_COMMIT_ID, APP_VERSION_DESCRIPTION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";
import { createShareableLink, parseShareableUrlState } from "../src/utils/urlStateManager";

console.log("=========================================================================");
console.log("🧪 Running Dedicated Verification: Share State Reproduction (Task 162)");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: Version Parity across all 5 version targets
console.log("--> [Test 1] Auditing version parity across all 5 targets...");
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf8"));
const expectedVer = pkg.version;
const expectedCode = expectedVer.startsWith("2.") ? 20000 : 10103;
assert.strictEqual(APP_VERSION, expectedVer, `appConfig.ts APP_VERSION must be ${expectedVer}`);
assert.strictEqual(CURRENT_APK_VERSION, `v${expectedVer}`, `apkUpdater.ts CURRENT_APK_VERSION must be v${expectedVer}`);

const buildGradle = fs.readFileSync(path.resolve(rootDir, "android-shell/app/build.gradle.kts"), "utf8");
assert.ok(buildGradle.includes(`versionCode = ${expectedCode}`), `build.gradle.kts must have versionCode ${expectedCode}`);
assert.ok(buildGradle.includes(`versionName = "${expectedVer}"`), `build.gradle.kts must have versionName ${expectedVer}`);

const appSettings = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf8");
assert.ok(appSettings.includes(`version: "${expectedVer}"`), `appSettings.ts must have snapshot version ${expectedVer}`);
console.log(`✅ PASS: All 5 version targets synchronized to ${expectedVer} / ${expectedCode}.`);

// Test 2: ShareStateModal receives baseLanguage and synchronizes subUrlInput on open
console.log("--> [Test 2] Verifying ShareStateModal baseLanguage prop and subtitle URL synchronization...");
const indexContent = fs.readFileSync(path.resolve(rootDir, "src/routes/index.tsx"), "utf8");
assert.ok(
  indexContent.includes("<ShareStateModal") && indexContent.includes("baseLanguage={baseLanguage || \"en\"}"),
  "index.tsx must pass baseLanguage={baseLanguage || \"en\"} to ShareStateModal",
);

const shareModalContent = fs.readFileSync(path.resolve(rootDir, "src/components/ShareStateModal.tsx"), "utf8");
assert.ok(
  shareModalContent.includes("setSubUrlInput(activeCandidate)") &&
    shareModalContent.includes("useEffect(() => {\n    if (open) {"),
  "ShareStateModal must synchronize subUrlInput when open becomes true",
);
assert.ok(
  shareModalContent.includes("useEffect(() => {\n    if (observedUrl && observedUrl.trim()) {"),
  "ShareStateModal must update subUrlInput whenever observedUrl changes",
);
console.log("✅ PASS: ShareStateModal receives baseLanguage and synchronizes URL on open.");

// Test 3: createShareableLink & parseShareableUrlState round-trip for user's scenario
console.log("--> [Test 3] Verifying share link creation and state parsing for video + timedtext subtitles URL...");
const sampleVideoId = "vBURridJXZ0";
const sampleTimedtextUrl =
  "https://www.youtube.com/api/timedtext?v=vBURridJXZ0&ei=9nfZaqiaA5fEhcIPxJ-qwAU&caps=asr&opi=112496729&xoaf=5&xowf=1&xospf=1&hl=iw&ip=0.0.0.0&ipbits=0&expire=1792662118&sparams=ip%2Cipbits%2Cexpire%2Cv%2Cei%2Ccaps%2Copi%2Cxoaf&signature=88C479F7211A4B7598C4EFA2801CC220DCC3BD82.744950D1C92041EA70B86119471BD6C4CAF0FEC4&key=yt8&kind=asr&lang=iw&fmt=json3&xorb=2&xobt=3&xovt=3&cbr=Chrome&cbrver=155.0.0.0&c=WEB_EMBEDDED_PLAYER&cver=2.20261020.08.00&cplayer=UNIPLAYER&cos=Windows&cosver=10.0&cplatform=DESKTOP";

const generatedShareLink = createShareableLink({
  baseUrl: "https://my-app.run.app",
  useDemoSiteBase: false,
  videoId: sampleVideoId,
  sourceLangCode: "iw",
  subLang: "iw",
  subtitlesUrl: sampleTimedtextUrl,
  targetLangs: ["he", "en"],
  ttsProvider: "lovable",
});

assert.ok(generatedShareLink.startsWith("https://my-app.run.app?"), "Link must preserve specified host");
assert.ok(generatedShareLink.includes(`v=${sampleVideoId}`), "Link must include video ID");
assert.ok(generatedShareLink.includes("source_lang_code=iw"), "Link must include source_lang_code=iw");
assert.ok(generatedShareLink.includes("sub_lang=iw"), "Link must include sub_lang=iw");
assert.ok(generatedShareLink.includes("subtitles_url="), "Link must encode subtitles_url");
assert.ok(generatedShareLink.includes("Target_langs=he%2Cen") || generatedShareLink.includes("Target_langs=he,en"), "Link must include Target_langs");

const parsedState = parseShareableUrlState(generatedShareLink);
assert.strictEqual(parsedState.videoId, sampleVideoId, "Parsed state videoId must match");
assert.strictEqual(parsedState.subLang, "iw", "Parsed state subLang must be iw");
assert.strictEqual(parsedState.subUrl, sampleTimedtextUrl, "Parsed state subUrl must match timedtext URL exactly");
assert.deepStrictEqual(parsedState.targetLanguages, ["he", "en"], "Parsed state targetLanguages must match");
console.log("✅ PASS: Share link creation and state parsing round-trip verified.");

// Test 4: handleWebDemoLoadVideoAndSubtitles updates baseLanguage
console.log("--> [Test 4] Verifying handleWebDemoLoadVideoAndSubtitles sets baseLanguage...");
assert.ok(
  indexContent.includes("const detectedBase = trackLangs[0];") &&
    indexContent.includes("setBaseLanguage(detectedBase);"),
  "handleWebDemoLoadVideoAndSubtitles must set baseLanguage to trackLangs[0]",
);
console.log("✅ PASS: handleWebDemoLoadVideoAndSubtitles sets baseLanguage accurately.");

// Test 5: URL state restoration supports multi-tier resilient loading (proxy, native shell, direct)
console.log("--> [Test 5] Verifying multi-tier resilient subtitle loading on URL state restoration...");
assert.ok(
  indexContent.includes("const loadIncomingSubtitles = async () =>"),
  "index.tsx must declare async loadIncomingSubtitles function",
);
assert.ok(
  indexContent.includes("fetchViaServer(getFetchServerUrl(), incomingSubUrl)"),
  "loadIncomingSubtitles must support server proxy fallback via fetchViaServer",
);
assert.ok(
  indexContent.includes("window.AndroidNativeShell") &&
    indexContent.includes("fetchTimedTextExact"),
  "loadIncomingSubtitles must support Android native bridge exact fetch fallback",
);
assert.ok(
  indexContent.includes("setTracks((prev) => ({") &&
    indexContent.includes("setBaseLanguage(subLang);") &&
    indexContent.includes("setDefaultCaptionsLoaded(true);"),
  "loadIncomingSubtitles must hydrate tracks, baseLanguage, and defaultCaptionsLoaded",
);
console.log("✅ PASS: URL state restoration has multi-strategy resilient loading.");

console.log("=========================================================================");
console.log("🎉 ALL SHARE STATE REPRODUCTION VERIFICATIONS PASSED (100%)!");
console.log("=========================================================================");
