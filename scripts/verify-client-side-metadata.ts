/**
 * Dedicated Verification Test for Task 161:
 * Client-Side Video Metadata & Free Information Extraction (Version 1.0.60)
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  getVideoThumbnails,
  formatDurationSeconds,
  extractChannelIdentifier,
  parseTimedTextTrackList,
  enrichMetadataWithPlayer,
  getCachedVideoMetadata,
} from "../src/utils/videoMetadataManager";

console.log("=========================================================================");
console.log("🧪 Running Verification: Client-Side Video Metadata Extraction (v1.0.60)");
console.log("=========================================================================");

// Test 1: Version bump to 1.0.60 across all 4 targets
console.log("Test 1: Version consistency across 4 targets...");
const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"));
assert.strictEqual(pkg.version, "1.0.60", "package.json version must be 1.0.60");

const gradleCode = fs.readFileSync(path.resolve(process.cwd(), "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(gradleCode.includes('"1.0.60"'), "build.gradle.kts must declare 1.0.60");
assert.ok(gradleCode.includes("10060"), "build.gradle.kts must declare versionCode 10060");

const apkUpdaterCode = fs.readFileSync(path.resolve(process.cwd(), "src/utils/apkUpdater.ts"), "utf-8");
assert.ok(apkUpdaterCode.includes('"v1.0.60"'), "apkUpdater.ts must declare CURRENT_APK_VERSION as v1.0.60");

const appSettingsCode = fs.readFileSync(path.resolve(process.cwd(), "src/utils/appSettings.ts"), "utf-8");
assert.ok(appSettingsCode.includes('"1.0.60"'), "appSettings.ts must declare version 1.0.60");
console.log("✅ PASS: Version 1.0.60 verified across all 4 targets");

// Test 2: Full resolution thumbnails generation
console.log("Test 2: Full resolution thumbnails generation...");
const testVideoId = "dQw4w9WgXcQ";
const thumbs = getVideoThumbnails(testVideoId);
assert.strictEqual(thumbs.maxRes, `https://img.youtube.com/vi/${testVideoId}/maxresdefault.jpg`);
assert.strictEqual(thumbs.sd, `https://img.youtube.com/vi/${testVideoId}/sddefault.jpg`);
assert.strictEqual(thumbs.hq, `https://img.youtube.com/vi/${testVideoId}/hqdefault.jpg`);
assert.strictEqual(thumbs.mq, `https://img.youtube.com/vi/${testVideoId}/mqdefault.jpg`);
assert.strictEqual(thumbs.default, `https://img.youtube.com/vi/${testVideoId}/default.jpg`);
console.log("✅ PASS: Full resolution thumbnails verified (maxRes, sd, hq, mq, default)");

// Test 3: Duration formatting helper
console.log("Test 3: Duration formatting helper...");
assert.strictEqual(formatDurationSeconds(0), "0:00");
assert.strictEqual(formatDurationSeconds(45), "0:45");
assert.strictEqual(formatDurationSeconds(75), "1:15");
assert.strictEqual(formatDurationSeconds(600), "10:00");
assert.strictEqual(formatDurationSeconds(3665), "1:01:05");
assert.strictEqual(formatDurationSeconds(-5), "0:00");
console.log("✅ PASS: Duration formatting helper verified");

// Test 4: Channel identifier extraction
console.log("Test 4: Channel identifier extraction...");
assert.strictEqual(extractChannelIdentifier("https://www.youtube.com/@Veritasium"), "@Veritasium");
assert.strictEqual(extractChannelIdentifier("https://www.youtube.com/channel/UCHnyfMqiRRG1u-2MsSQLbXA"), "UCHnyfMqiRRG1u-2MsSQLbXA");
assert.strictEqual(extractChannelIdentifier("https://www.youtube.com/c/3blue1brown"), "3blue1brown");
assert.strictEqual(extractChannelIdentifier("@kurzgesagt"), "@kurzgesagt");
assert.strictEqual(extractChannelIdentifier(undefined), undefined);
console.log("✅ PASS: Channel identifier extraction verified");

// Test 5: Timedtext track list XML parsing
console.log("Test 5: Timedtext track list XML parsing...");
const sampleXml = `<?xml version="1.0" encoding="utf-8" ?>
<transcript_list docid="5888283925000000000">
<track id="0" name="" lang_code="en" lang_original="English" lang_translated="English" lang_default="true"/>
<track id="1" name="" lang_code="es" lang_original="Español" lang_translated="Spanish"/>
<track id="2" name="" lang_code="en" kind="asr" lang_original="English (auto-generated)" lang_translated="English (auto-generated)"/>
</transcript_list>`;

const parsedTracks = parseTimedTextTrackList(sampleXml, testVideoId);
assert.strictEqual(parsedTracks.length, 3, "Must parse exactly 3 tracks");
assert.strictEqual(parsedTracks[0].langCode, "en");
assert.strictEqual(parsedTracks[0].isDefault, true);
assert.strictEqual(parsedTracks[0].isAsr, false);
assert.ok(parsedTracks[0].trackUrl?.includes("lang=en"));

assert.strictEqual(parsedTracks[1].langCode, "es");
assert.strictEqual(parsedTracks[1].name, "Español");

assert.strictEqual(parsedTracks[2].langCode, "en");
assert.strictEqual(parsedTracks[2].isAsr, true);
console.log("✅ PASS: Timedtext track list XML parsing verified");

// Test 6: Player metadata enrichment
console.log("Test 6: Player metadata enrichment...");
const mockPlayer = {
  getDuration: () => 212,
  getVideoData: () => ({
    video_id: testVideoId,
    title: "Rick Astley - Never Gonna Give You Up (Official Music Video)",
    author: "Rick Astley",
  }),
};

const enriched = enrichMetadataWithPlayer(testVideoId, mockPlayer);
assert.ok(enriched, "Must return enriched metadata");
assert.strictEqual(enriched.durationSeconds, 212);
assert.strictEqual(enriched.durationFormatted, "3:32");
assert.strictEqual(enriched.title, "Rick Astley - Never Gonna Give You Up (Official Music Video)");
assert.strictEqual(enriched.authorName, "Rick Astley");
assert.strictEqual(enriched.thumbnailUrl, thumbs.hq);

const cached = getCachedVideoMetadata(testVideoId);
assert.ok(cached, "Enriched metadata must be cached");
assert.strictEqual(cached?.durationFormatted, "3:32");
console.log("✅ PASS: Player metadata enrichment verified");

// Test 7: VideoMetadataModal component exports and structure
console.log("Test 7: VideoMetadataModal component structure...");
const modalPath = path.resolve(process.cwd(), "src/components/VideoMetadataModal.tsx");
assert.ok(fs.existsSync(modalPath), "VideoMetadataModal.tsx must exist");
const modalCode = fs.readFileSync(modalPath, "utf-8");
assert.ok(modalCode.includes("export function VideoMetadataModal"), "Must export VideoMetadataModal");
assert.ok(modalCode.includes('data-testid="video-metadata-modal"'), "Must include video-metadata-modal testid");
assert.ok(modalCode.includes('data-testid="modal-video-title"'), "Must include modal-video-title testid");
assert.ok(modalCode.includes('data-testid="modal-video-description"'), "Must include modal-video-description testid");
assert.ok(modalCode.includes('data-testid="refresh-metadata-button"'), "Must include refresh-metadata-button testid");
console.log("✅ PASS: VideoMetadataModal component structure verified");

// Test 8: Index route wiring and duration badge
console.log("Test 8: Index route wiring...");
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexCode = fs.readFileSync(indexPath, "utf-8");
assert.ok(indexCode.includes("<VideoMetadataModal"), "index.tsx must render VideoMetadataModal");
assert.ok(indexCode.includes('data-testid="video-metadata-duration-badge"'), "index.tsx must render video-metadata-duration-badge");
assert.ok(indexCode.includes('data-testid="open-video-metadata-modal-button"'), "index.tsx must render open-video-metadata-modal-button");
assert.ok(indexCode.includes("enrichMetadataWithPlayer"), "index.tsx must wire enrichMetadataWithPlayer");
console.log("✅ PASS: Index route wiring verified");

// Test 9: VideoLibraryPanel duration badge check
console.log("Test 9: VideoLibraryPanel duration badge check...");
const libraryPath = path.resolve(process.cwd(), "src/components/VideoLibraryPanel.tsx");
const libraryCode = fs.readFileSync(libraryPath, "utf-8");
assert.ok(libraryCode.includes("library-duration-"), "VideoLibraryPanel must include library-duration badge testid");
console.log("✅ PASS: VideoLibraryPanel duration badge verified");

// Test 10: Documentation inventory check in docs/files.md
console.log("Test 10: Documentation inventory in docs/files.md...");
const filesMd = fs.readFileSync(path.resolve(process.cwd(), "docs/files.md"), "utf-8");
assert.ok(filesMd.includes("VideoMetadataModal.tsx"), "docs/files.md must inventory VideoMetadataModal.tsx");
console.log("✅ PASS: Documentation inventory verified");

console.log("=========================================================================");
console.log("🎉 ALL Task 161 (Client-Side Video Metadata) TESTS PASSED (100%)!");
console.log("=========================================================================");
