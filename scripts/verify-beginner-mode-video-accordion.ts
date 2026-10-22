import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Beginner Mode Video Folded Accordion (First Tab Only)");
console.log("=========================================================================");

const rootDir = process.cwd();
const flowContainerPath = path.join(rootDir, "src/components/beginner/BeginnerFlowContainer.tsx");
assert.ok(fs.existsSync(flowContainerPath), "BeginnerFlowContainer.tsx must exist");
const flowCode = fs.readFileSync(flowContainerPath, "utf-8");

// Test 1: Accordion imports
console.log("--> [Test 1] Verifying Accordion imports in BeginnerFlowContainer.tsx...");
assert.ok(
  flowCode.includes("from \"@/components/ui/accordion\""),
  "BeginnerFlowContainer must import from @/components/ui/accordion",
);
assert.ok(
  flowCode.includes("AccordionItem") && flowCode.includes("AccordionTrigger") && flowCode.includes("AccordionContent"),
  "BeginnerFlowContainer must import AccordionItem, AccordionTrigger, AccordionContent",
);
console.log("✅ PASS: Accordion components properly imported.");

// Test 2: Video player in folded accordion
console.log("--> [Test 2] Verifying video player is folded by default...");
assert.ok(
  flowCode.includes('defaultValue=""') && flowCode.includes("collapsible"),
  "Accordion must be collapsible and have defaultValue=\"\" (folded/closed by default)",
);
assert.ok(
  flowCode.includes('data-testid="beginner-video-accordion-container"'),
  "Beginner video accordion container testid must exist",
);
assert.ok(
  flowCode.includes('data-testid="beginner-video-accordion-trigger"'),
  "Beginner video accordion trigger testid must exist",
);
console.log("✅ PASS: Video player is enclosed in a folded-by-default accordion.");

// Test 3: Restricted strictly to the first tab (activeTab === "video")
console.log("--> [Test 3] Verifying video accordion element exists strictly on the first tab...");
assert.ok(
  flowCode.includes('activeTab === "video" && playerSlot && ('),
  'Video player container must strictly check activeTab === "video" && playerSlot',
);
// Confirm it does NOT render outside activeTab === "video"
assert.ok(
  !flowCode.includes('{playerSlot && (\n        <div className="w-full max-w-4xl mx-auto px-2 pt-2">'),
  "Unconditional persistent playerSlot wrapper must no longer be present",
);
console.log("✅ PASS: Video accordion element exists strictly on the first tab (activeTab === 'video').");

console.log("=========================================================================");
console.log("🎉 ALL BEGINNER MODE VIDEO ACCORDION CHECKS PASSED (100%)!");
console.log("=========================================================================");
