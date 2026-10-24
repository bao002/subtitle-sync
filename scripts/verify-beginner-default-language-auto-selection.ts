import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getBeginnerDefaultBaseLanguage } from "../src/utils/beginnerLanguageSelection";

const root = process.cwd();
const videoTab = fs.readFileSync(
  path.join(root, "src/components/beginner/tabs/BeginnerVideoTab.tsx"),
  "utf8",
);
const flow = fs.readFileSync(
  path.join(root, "src/components/beginner/BeginnerFlowContainer.tsx"),
  "utf8",
);
const appSettings = fs.readFileSync(path.join(root, "src/utils/appSettings.ts"), "utf8");
const deprecation = fs.readFileSync(path.join(root, "docs/deprecated.md"), "utf8");

assert.equal(
  getBeginnerDefaultBaseLanguage([{ lang: "fr" }, { lang: "en" }, { lang: "he" }]),
  "en",
  "English must be preferred when detected",
);
assert.equal(
  getBeginnerDefaultBaseLanguage([{ lang: "fr" }, { lang: "he" }]),
  "fr",
  "The first detected track must be the fallback",
);
assert.equal(getBeginnerDefaultBaseLanguage([]), "", "No detected tracks yields no base language");

assert(
  flow.includes("getBeginnerDefaultBaseLanguage(observedTracks)") &&
    flow.includes("const isUnlocked = hasObservedBaseLanguage"),
  "The detected default base track must automatically unlock downstream tabs",
);
assert(
  !videoTab.includes("onSelectBaseLang") &&
    !videoTab.includes("track-select-") &&
    videoTab.includes("automatically: English when available"),
  "The first Beginner tab must display detected tracks without manual selection controls",
);
assert(
  appSettings.includes("delete parsed.beginnerSelectedBaseLang") &&
    !appSettings.includes("beginnerSelectedBaseLang?: string"),
  "The obsolete persisted language selection must be ignored and removed",
);
assert(
  deprecation.includes("Manual base-language selection on the Beginner video tab") &&
    deprecation.includes("first detected subtitle track"),
  "The retired feature and its replacement must be documented",
);

console.log(
  "PASS: Beginner base language selects automatically and the old chooser is deprecated.",
);
