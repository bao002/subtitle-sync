import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("====================================================");
console.log("🧪 Verifying Advanced Subtitles Section Design Parity (Task 259)");
console.log("====================================================");

const beginnerFile = path.join(process.cwd(), "src/components/beginner/tabs/BeginnerVideoTab.tsx");
assert(fs.existsSync(beginnerFile), "BeginnerVideoTab.tsx exists");
const beginnerContent = fs.readFileSync(beginnerFile, "utf-8");

assert(
  beginnerContent.includes('data-testid="beginner-parallel-subtitles"'),
  "Beginner mode contains dedicated parallel subtitles section container",
);
assert(
  beginnerContent.includes("border border-emerald-500/25 bg-emerald-500/5"),
  "Beginner mode applies emerald theme border and background to parallel subtitles section",
);

const indexFile = path.join(process.cwd(), "src/routes/index.tsx");
assert(fs.existsSync(indexFile), "src/routes/index.tsx exists");
const indexContent = fs.readFileSync(indexFile, "utf-8");

assert(
  indexContent.includes('data-testid="advanced-parallel-subtitles"'),
  "Advanced mode contains dedicated parallel subtitles section container with data-testid='advanced-parallel-subtitles'",
);
assert(
  /data-testid="advanced-parallel-subtitles"[\s\S]*?border border-emerald-500\/25 bg-emerald-500\/5/.test(
    indexContent,
  ) ||
    /border border-emerald-500\/25 bg-emerald-500\/5[\s\S]*?data-testid="advanced-parallel-subtitles"/.test(
      indexContent,
    ),
  "Advanced mode subtitles section container matches the sleek emerald card styling for parity",
);
assert(
  /<h3[^>]*>[\s\S]*?Parallel subtitles[\s\S]*?<\/h3>/.test(indexContent),
  "Advanced mode includes clean heading parity matching Beginner mode",
);

console.log("====================================================");
console.log("🎉 ALL ADVANCED SUBTITLES SECTION DESIGN CHECKS PASSED!");
console.log("====================================================");
