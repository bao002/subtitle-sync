import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { getBackgroundAudioEnabled, setBackgroundAudioEnabled } from "../src/lib/playback-preferences";
import { checkVersionDiscrepancy, clearOtaCacheAndReload } from "../src/utils/apkUpdater";
import { VideoInstancesSwiper } from "../src/components/VideoInstancesSwiper";

console.log("====================================================");
console.log("🧪 Starting Hotfix Verification: Dev Exports & Logger");
console.log("====================================================");

// 1. Verify playback-preferences exports
console.log("1. Verifying playback-preferences exports...");
assert(typeof getBackgroundAudioEnabled === "function", "getBackgroundAudioEnabled must be exported as a function");
assert(typeof setBackgroundAudioEnabled === "function", "setBackgroundAudioEnabled must be exported as a function");

const initialAudio = getBackgroundAudioEnabled();
assert(typeof initialAudio === "boolean", "getBackgroundAudioEnabled must return a boolean");
setBackgroundAudioEnabled(false);
assert.strictEqual(getBackgroundAudioEnabled(), false, "setBackgroundAudioEnabled(false) must update state");
setBackgroundAudioEnabled(true);
assert.strictEqual(getBackgroundAudioEnabled(), true, "setBackgroundAudioEnabled(true) must update state");
console.log("✅ PASS: getBackgroundAudioEnabled and setBackgroundAudioEnabled operate correctly");

// 2. Verify apkUpdater exports
console.log("2. Verifying apkUpdater exports...");
assert(typeof checkVersionDiscrepancy === "function", "checkVersionDiscrepancy must be exported as a function");
assert(typeof clearOtaCacheAndReload === "function", "clearOtaCacheAndReload must be exported as a function");

const comparison = checkVersionDiscrepancy();
assert(comparison && typeof comparison === "object", "checkVersionDiscrepancy must return an object");
assert(typeof comparison.isDiscrepancy === "boolean", "comparison.isDiscrepancy must be a boolean");
assert(typeof comparison.apkVersion === "string", "comparison.apkVersion must be a string");
assert(typeof comparison.webVersion === "string", "comparison.webVersion must be a string");
assert(typeof comparison.isOtaActive === "boolean", "comparison.isOtaActive must be a boolean");
assert(typeof comparison.isStaleOtaCache === "boolean", "comparison.isStaleOtaCache must be a boolean");
console.log("✅ PASS: checkVersionDiscrepancy returns valid VersionComparison structure");

// 3. Verify VideoInstancesSwiper component export
console.log("3. Verifying VideoInstancesSwiper component export...");
assert(typeof VideoInstancesSwiper === "function", "VideoInstancesSwiper must be exported as a React component function");
console.log("✅ PASS: VideoInstancesSwiper is a valid function component");

// 4. Verify logInfo and logError arguments in apkUpdater.ts
console.log("4. Verifying logger invocations in apkUpdater.ts...");
const apkUpdaterPath = path.join(process.cwd(), "src/utils/apkUpdater.ts");
const content = fs.readFileSync(apkUpdaterPath, "utf8");

// Ensure no single-argument logInfo/logWarn/logError calls exist
const singleArgCallPattern = /log(Info|Warn|Error)\(\s*["'`][^,"'`]+["'`]\s*\)/g;
const invalidMatches = content.match(singleArgCallPattern);
assert(!invalidMatches || invalidMatches.length === 0, `apkUpdater.ts contains log calls missing category argument: ${JSON.stringify(invalidMatches)}`);
console.log("✅ PASS: All logger calls in apkUpdater.ts specify valid categories");

console.log("====================================================");
console.log("🎉 ALL HOTFIX CHECKS PASSED SUCCESSFULLY!");
console.log("====================================================");
