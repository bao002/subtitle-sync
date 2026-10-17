import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Basic Minimalist README.md Verification");
console.log("====================================================");

const rootDir = process.cwd();
const readmePath = path.resolve(rootDir, "README.md");

// 1. Verify README.md exists
assert(fs.existsSync(readmePath), "README.md must exist in root");
const content = fs.readFileSync(readmePath, "utf8");
const lines = content.split("\n");

console.log(`📄 README.md length: ${lines.length} lines, ${content.length} bytes.`);

// 2. Verify README is very basic and concise
assert(
  lines.length <= 15,
  `README.md must be very basic and concise (<= 15 lines), got ${lines.length} lines`,
);
assert(
  content.length < 1000,
  `README.md must be minimal (< 1000 bytes), got ${content.length} bytes`,
);
console.log("✅ PASS: README.md is very basic and concise.");

// 3. Verify Requirement 1: Link to docs
const docsMatch = content.match(/\[([^\]]*docs[^\]]*)\]\(([^)]+)\)/i);
assert(docsMatch, "README.md must contain a link to docs");
const docsTarget = docsMatch[2].trim();
const resolvedDocs = path.resolve(rootDir, docsTarget);
assert(
  fs.existsSync(resolvedDocs) && fs.statSync(resolvedDocs).isDirectory(),
  `Docs link "${docsTarget}" must point to existing docs directory (resolved: ${resolvedDocs})`,
);
console.log(`✅ PASS: Requirement 1 verified - link to docs: "${docsMatch[0]}"`);

// 4. Verify Requirement 2: Link to demo website on github-pages
const demoMatch = content.match(
  /\[([^\]]*demo[^\]]*)\]\((https:\/\/[a-zA-Z0-9_\-.]+\.github\.io\/[a-zA-Z0-9_\-.]+\/?)\)/i,
);
assert(demoMatch, "README.md must contain a link to the demo website hosted on github-pages");
console.log(
  `✅ PASS: Requirement 2 verified - demo website link on GitHub Pages: "${demoMatch[2]}"`,
);

// 5. Verify Requirement 3: Link to the report on github-pages
const reportMatch = content.match(
  /\[([^\]]*report[^\]]*)\]\((https:\/\/[a-zA-Z0-9_\-.]+\.github\.io\/[a-zA-Z0-9_\-.]+\/android-emulator-report\.html)\)/i,
);
assert(
  reportMatch,
  "README.md must contain a link to the report (android-emulator-report.html) on github-pages",
);
console.log(`✅ PASS: Requirement 3 verified - report link on GitHub Pages: "${reportMatch[2]}"`);

// 6. Verify all relative links in README.md resolve cleanly
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
let match: RegExpExecArray | null;
while ((match = linkRegex.exec(content)) !== null) {
  const target = match[2].trim();
  if (!target.startsWith("http://") && !target.startsWith("https://") && !target.startsWith("#")) {
    const cleanTarget = target.split("#")[0];
    const resolved = path.resolve(rootDir, cleanTarget);
    assert(
      fs.existsSync(resolved),
      `Relative link "${target}" in README.md must point to an existing target (resolved: ${resolved})`,
    );
    console.log(`✅ PASS: Relative link "${target}" resolves to valid target.`);
  }
}

console.log("====================================================");
console.log("🎉 ALL BASIC MINIMALIST README.md VERIFICATIONS PASSED!");
console.log("====================================================");
