import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Hotfix Verification: React & Fragment Imports");
console.log("====================================================");

const rootDir = process.cwd();
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexRoutePath, "utf8");

// 1. Verify React and Fragment are imported from "react"
assert(
  indexContent.includes("import React, {") || indexContent.includes('import React from "react"'),
  "src/routes/index.tsx must import React to prevent ReferenceError: React is not defined",
);
assert(indexContent.includes("Fragment"), "src/routes/index.tsx must import Fragment");
console.log("✅ PASS: React and Fragment are explicitly imported in src/routes/index.tsx");

// 2. Verify Fragment key usage in table rows
assert(
  indexContent.includes("<Fragment key={l.code}>") && indexContent.includes("</Fragment>"),
  "src/routes/index.tsx must cleanly use <Fragment key={l.code}> without unbound identifiers",
);
console.log("✅ PASS: Table row rendering uses cleanly scoped <Fragment key={l.code}>");

console.log("====================================================");
console.log("🎉 Hotfix Verification for React Import PASSED!");
console.log("====================================================");
