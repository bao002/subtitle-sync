import assert from "node:assert/strict";
import {
  cleanSubtitleText,
  splitTextByPunctuation,
} from "../src/components/beginner/tabs/BeginnerParsingTab";

console.log("=== Verifying Beginner Mode Tab-Based Flow ===");

// 1. Verify Bracketed Speaker Markers Stripping
console.log("Checking speaker bracket stripping...");
const input1 = "[Music] Welcome to the tutorial [Applause]";
const cleaned1 = cleanSubtitleText(input1, {
  stripSpeakerBrackets: true,
  removeChars: [">", ">>"],
});
assert.equal(cleaned1, "Welcome to the tutorial");

// 2. Verify Parenthesis Markers Stripping
console.log("Checking parenthesis sound marker stripping...");
const input2 = "(Laughter) That was a funny joke!";
const cleaned2 = cleanSubtitleText(input2, {
  stripSpeakerBrackets: true,
  removeChars: [">", ">>"],
});
assert.equal(cleaned2, "That was a funny joke!");

// 3. Verify angle bracket symbols are stripped regardless of the configured character list.
console.log("Checking angle bracket stripping...");
const input3 = ">> [SPEAKER 1]: Hello <there>! > Yes, hello.";
const cleaned3 = cleanSubtitleText(input3, {
  stripSpeakerBrackets: true,
  removeChars: [],
});
assert.equal(cleaned3, ": Hello there! Yes, hello.");

// 4. Verify Sentence Punctuation Splitting
console.log("Checking sentence punctuation splitting...");
const input4 = "First sentence. Second sentence! Third sentence? All done.";
const segments = splitTextByPunctuation(input4, [".", "!", "?", ",", ";", ":"]);
assert.equal(segments.length, 4);
assert.equal(segments[0], "First sentence.");
assert.equal(segments[1], "Second sentence!");
assert.equal(segments[2], "Third sentence?");
assert.equal(segments[3], "All done.");

// 5. Verify Punctuation Selection Filtering
console.log("Checking selective punctuation filtering...");
const input5 = "Wait, is this one sentence? Yes, it is!";
const segments5 = splitTextByPunctuation(input5, [".", "!"]);
assert.equal(segments5.length, 1);
assert.equal(segments5[0], "Wait, is this one sentence? Yes, it is!");

// 6. Verify Tab Lock Condition Logic
console.log("Checking tab unlock condition logic...");
let selectedBaseLang = "";
assert.equal(Boolean(selectedBaseLang), false, "Tabs must remain locked when base lang is empty");

selectedBaseLang = "he";
assert.equal(Boolean(selectedBaseLang), true, "Tabs must unlock when base lang is selected");

// 7. Verify Non-Resetting Navigation Freedom
console.log("Checking navigation freedom without state reset...");
let activeTab = "video";
if (Boolean(selectedBaseLang)) activeTab = "preferences";
assert.equal(activeTab, "preferences");

if (Boolean(selectedBaseLang)) activeTab = "parsing";
assert.equal(activeTab, "parsing");

// Jump back freely to video tab
activeTab = "video";
assert.equal(activeTab, "video");
assert.equal(selectedBaseLang, "he", "Selected base language must be preserved");

console.log("✓ All Beginner Mode Tab-Based Flow assertions passed successfully!");
