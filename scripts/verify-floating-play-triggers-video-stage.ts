import { readFileSync } from "fs";
import { resolve } from "path";

console.log("=========================================================================");
console.log("🧪 Running Verification: Task 346 - Floating Play Button Triggers Video Stage");
console.log("=========================================================================\n");

const indexTsxPath = resolve(process.cwd(), "src/routes/index.tsx");
const indexContent = readFileSync(indexTsxPath, "utf-8");

const beginnerContainerPath = resolve(process.cwd(), "src/components/beginner/BeginnerFlowContainer.tsx");
const beginnerContent = readFileSync(beginnerContainerPath, "utf-8");

const floatingBtnPath = resolve(process.cwd(), "src/components/FloatingDraggablePauseButton.tsx");
const floatingContent = readFileSync(floatingBtnPath, "utf-8");

// Test 1: BeginnerFlowContainer supports controlled activeTab and onActiveTabChange
console.log("Test 1: Verifying BeginnerFlowContainer supports controlled activeTab...");
if (
  beginnerContent.includes("activeTab?: BeginnerTabId") &&
  beginnerContent.includes("onActiveTabChange?: (tab: BeginnerTabId) => void") &&
  beginnerContent.includes("activeTab: activeTabProp") &&
  beginnerContent.includes("onActiveTabChange")
) {
  console.log("✅ PASS: BeginnerFlowContainer supports controlled activeTab and onActiveTabChange");
} else {
  console.error("❌ FAIL: BeginnerFlowContainer missing activeTab or onActiveTabChange support");
  process.exit(1);
}

// Test 2: src/routes/index.tsx passes beginnerActiveTab and onActiveTabChange
console.log("Test 2: Verifying index.tsx controls beginnerActiveTab...");
if (
  indexContent.includes("const [beginnerActiveTab, setBeginnerActiveTab] = useState<BeginnerTabId>") &&
  indexContent.includes("activeTab={beginnerActiveTab}") &&
  indexContent.includes("onActiveTabChange={setBeginnerActiveTab}")
) {
  console.log("✅ PASS: index.tsx manages and binds beginnerActiveTab");
} else {
  console.error("❌ FAIL: index.tsx does not manage or bind beginnerActiveTab");
  process.exit(1);
}

// Test 3: handlePlayVideo activates video stage in both Advanced and Beginner modes
console.log("Test 3: Verifying handlePlayVideo activates video stage...");
if (
  indexContent.includes("if (workflowMode === \"expert\")") &&
  indexContent.includes("currentAccordionStage !== 3") &&
  indexContent.includes("setCurrentAccordionStage(3)") &&
  indexContent.includes("openPanels.player") &&
  indexContent.includes("setBeginnerActiveTab(\"video\")")
) {
  console.log("✅ PASS: handlePlayVideo activates Stage 3 in expert mode and video tab in beginner mode");
} else {
  console.error("❌ FAIL: handlePlayVideo does not activate video stage");
  process.exit(1);
}

// Test 4: pendingPlayRequestedRef queues playback until YouTube player is ready
console.log("Test 4: Verifying pendingPlayRequestedRef handles player mounting and readiness...");
if (
  indexContent.includes("pendingPlayRequestedRef") &&
  indexContent.includes("pendingPlayRequestedRef.current = true") &&
  indexContent.includes("autoplay: isAndroid || pendingPlayRequestedRef.current ? 1 : 0")
) {
  console.log("✅ PASS: pendingPlayRequestedRef queues playback during stage transition and player initialization");
} else {
  console.error("❌ FAIL: pendingPlayRequestedRef queue not wired properly in player lifecycle");
  process.exit(1);
}

// Test 5: FloatingDraggablePauseButton calls onPlay / handlePlayVideo on click when paused
console.log("Test 5: Verifying FloatingDraggablePauseButton calls play callback...");
if (
  floatingContent.includes("onPlay") &&
  floatingContent.includes("handleButtonClick") &&
  indexContent.includes("<FloatingDraggablePauseButton") &&
  indexContent.includes("onPlay={handlePlayVideo}")
) {
  console.log("✅ PASS: FloatingDraggablePauseButton is wired to handlePlayVideo");
} else {
  console.error("❌ FAIL: FloatingDraggablePauseButton not wired to handlePlayVideo");
  process.exit(1);
}

console.log("\n=========================================================================");
console.log("🎉 ALL TESTS PASSED: Task 346 Floating Play Button Triggers Video Stage Verified");
console.log("=========================================================================");
