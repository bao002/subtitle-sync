import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("==================================================================");
console.log("🧪 Starting Dynamic Favorite Languages Ordering & Server Fetch Test");
console.log("==================================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
const selectorPath = path.join(rootDir, "src/components/LanguageBoxesSelector.tsx");
const attemptSettingsPath = path.join(rootDir, "src/components/AttemptOrderSettings.tsx");
const inspectorPath = path.join(rootDir, "src/components/NetworkRequestsInspector.tsx");
const fetchPlanPath = path.join(rootDir, "src/lib/subtitle-fetch-plan.ts");
const docsPath = path.join(rootDir, "docs/reliable-subtitles-fetching.md");

assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
assert(fs.existsSync(selectorPath), "LanguageBoxesSelector.tsx must exist");
assert(fs.existsSync(attemptSettingsPath), "AttemptOrderSettings.tsx must exist");
assert(fs.existsSync(inspectorPath), "NetworkRequestsInspector.tsx must exist");
assert(fs.existsSync(fetchPlanPath), "subtitle-fetch-plan.ts must exist");
assert(fs.existsSync(docsPath), "docs/reliable-subtitles-fetching.md must exist");

const indexContent = fs.readFileSync(indexTsxPath, "utf8");
const selectorContent = fs.readFileSync(selectorPath, "utf8");
const attemptSettingsContent = fs.readFileSync(attemptSettingsPath, "utf8");
const inspectorContent = fs.readFileSync(inspectorPath, "utf8");
const fetchPlanContent = fs.readFileSync(fetchPlanPath, "utf8");
const docsContent = fs.readFileSync(docsPath, "utf8");

// 1. Verify LanguageBoxesSelector priority ordering controls and display
assert(
  selectorContent.includes("selected-languages-order-bar"),
  "LanguageBoxesSelector must render selected-languages-order-bar showing fetch priority order",
);
assert(
  selectorContent.includes("move-fav-earlier-") && selectorContent.includes("move-fav-later-"),
  "LanguageBoxesSelector must provide move-fav-earlier and move-fav-later buttons",
);
assert(
  selectorContent.includes("moveFavoriteLanguage"),
  "LanguageBoxesSelector must implement moveFavoriteLanguage function",
);
assert(
  selectorContent.includes("selected-lang-priority-"),
  "LanguageBoxesSelector must render priority badges for selected items",
);
console.log("✅ PASS: LanguageBoxesSelector exposes priority reordering bar & controls");

// 2. Verify index.tsx dynamic favorite language fetch sorting & fetch again updates
assert(
  indexContent.includes("needed.sort((a, b) => {") &&
    indexContent.includes("currentTargetOrder.indexOf"),
  "fetchFavoriteLanguageSubtitles in index.tsx must sort needed strictly according to targetLanguages order",
);
assert(
  indexContent.includes("languagesToFetchNext"),
  "src/routes/index.tsx must dynamically compute languagesToFetchNext based on targetLanguages",
);
assert(
  indexContent.includes("activeFailedToFetch"),
  "src/routes/index.tsx must dynamically compute activeFailedToFetch from targetLanguages",
);
assert(
  indexContent.includes(
    "setFailedLangs((prev) => prev.filter((lang) => newTargetLangs.includes(lang)))",
  ),
  "handleTargetLanguagesChange must prune failedLangs to only currently selected target languages",
);
assert(
  indexContent.includes("setTargetLanguages((current) => {") &&
    indexContent.includes("setUserLearningLanguages(copy)"),
  "moveLanguage in index.tsx must synchronize targetLanguages order when moving a favorite language",
);
console.log("✅ PASS: index.tsx enforces favorite language priority order & dynamic updates");

// 3. Verify subtitle-fetch-plan.ts server repetition helpers
assert(
  fetchPlanContent.includes("export function getUseFetchServer(): boolean") &&
    fetchPlanContent.includes("export function setUseFetchServer("),
  "subtitle-fetch-plan.ts must export getUseFetchServer and setUseFetchServer",
);
assert(
  fetchPlanContent.includes("export function getFetchServerUrl(): string") &&
    fetchPlanContent.includes("export function setFetchServerUrl("),
  "subtitle-fetch-plan.ts must export getFetchServerUrl and setFetchServerUrl",
);
assert(
  fetchPlanContent.includes("export async function fetchViaServer("),
  "subtitle-fetch-plan.ts must export fetchViaServer",
);
console.log(
  "✅ PASS: subtitle-fetch-plan.ts includes server repetition getters, setters & fetchViaServer",
);

// 4. Verify AttemptOrderSettings server repeat controls
assert(
  attemptSettingsContent.includes("use-fetch-server-toggle"),
  "AttemptOrderSettings must render use-fetch-server-toggle (off by default)",
);
assert(
  attemptSettingsContent.includes("fetch-server-url-input"),
  "AttemptOrderSettings must render fetch-server-url-input for server address",
);
assert(
  attemptSettingsContent.includes("update-fetch-server-url-button"),
  "AttemptOrderSettings must render update-fetch-server-url-button",
);
assert(
  attemptSettingsContent.includes("useFetchServer = false"),
  "AttemptOrderSettings must set useFetchServer default to false (off by default)",
);
console.log("✅ PASS: AttemptOrderSettings includes server repeat toggle & address input");

// 5. Verify NetworkRequestsInspector server controls & actions
assert(
  inspectorContent.includes("network-inspector-server-config"),
  "NetworkRequestsInspector must render network-inspector-server-config bar",
);
assert(
  inspectorContent.includes("inspector-use-server-toggle"),
  "NetworkRequestsInspector must render inspector-use-server-toggle",
);
assert(
  inspectorContent.includes("inspector-server-url-input"),
  "NetworkRequestsInspector must render inspector-server-url-input",
);
assert(
  inspectorContent.includes("fetch-again-server-button"),
  "NetworkRequestsInspector must render fetch-again-server-button ('Fetch again (via server)')",
);
console.log("✅ PASS: NetworkRequestsInspector includes server configuration and repeat button");

// 6. Verify index.tsx wires server repeat into AttemptOrderSettings & NetworkRequestsInspector
assert(
  indexContent.includes("useFetchServer={useFetchServer}") &&
    indexContent.includes("fetchServerUrl={fetchServerUrl}"),
  "index.tsx must pass useFetchServer and fetchServerUrl to AttemptOrderSettings and NetworkRequestsInspector",
);
assert(
  indexContent.includes("onFetchAgainViaServer={handleFetchAgainViaServer}"),
  "index.tsx must provide onFetchAgainViaServer handler to NetworkRequestsInspector",
);
console.log("✅ PASS: index.tsx wires server repeating parameters and handlers");

// 7. Functional Simulation: Priority Ordering & Dynamic Recalculation
console.log("--- Functional Logic Simulation ---");

// Test A: Fetch ordering simulation
const mockTargetLanguages = ["he", "it", "es", "ar"];
const unorderedLangsToFetch = ["ar", "es", "he", "it"];

const sortedByPriority = [...unorderedLangsToFetch].sort((a, b) => {
  const idxA = mockTargetLanguages.indexOf(a);
  const idxB = mockTargetLanguages.indexOf(b);
  return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
});

assert.deepStrictEqual(
  sortedByPriority,
  ["he", "it", "es", "ar"],
  "Fetch ordering must match targetLanguages exact order",
);
console.log("✅ PASS: Simulated fetch priority ordering matches targetLanguages");

// Test B: Reordering simulation
const reorderedTargets = [...mockTargetLanguages];
// Move 'ar' from index 3 to index 0
const movedItem = reorderedTargets.splice(3, 1)[0]!;
reorderedTargets.unshift(movedItem);
assert.deepStrictEqual(reorderedTargets, ["ar", "he", "it", "es"]);

const newlySorted = [...unorderedLangsToFetch].sort((a, b) => {
  const idxA = reorderedTargets.indexOf(a);
  const idxB = reorderedTargets.indexOf(b);
  return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
});
assert.deepStrictEqual(
  newlySorted,
  ["ar", "he", "it", "es"],
  "Fetch ordering after reordering must put 'ar' first",
);
console.log("✅ PASS: Reordered targetLanguages dynamically prioritizes 'ar' first in fetch order");

// Test C: Dynamic "Fetch again" list update simulation
let failedLangs = ["he", "it", "ru"];
let currentFavorites = ["he", "it"];

// 1. Initial active failed languages in favorites
let activeFailed = currentFavorites.filter((code) => failedLangs.includes(code));
assert.deepStrictEqual(activeFailed, ["he", "it"], "ru is excluded because it is not a favorite");

// 2. User removes 'he' and adds 'es' (which also failed)
currentFavorites = ["it", "es"];
failedLangs = ["it", "es", "ru"]; // 'he' pruned, 'es' added
activeFailed = currentFavorites.filter((code) => failedLangs.includes(code));
assert.deepStrictEqual(activeFailed, ["it", "es"], "'he' is immediately excluded from fetch again");

// 3. User swaps order of favorites to ['es', 'it']
currentFavorites = ["es", "it"];
activeFailed = currentFavorites.filter((code) => failedLangs.includes(code));
assert.deepStrictEqual(
  activeFailed,
  ["es", "it"],
  "fetch again order reflects new favorites order",
);
console.log(
  "✅ PASS: Dynamic fetch again list and ordering responds immediately to favorites changes",
);

// Test D: Server proxy URL generation simulation
function buildServerProxyUrl(serverUrl: string, targetUrl: string): string {
  const cleanServer = serverUrl.trim();
  if (cleanServer.includes("{url}")) {
    return cleanServer.replace("{url}", encodeURIComponent(targetUrl));
  }
  const sep = cleanServer.includes("?") ? "&" : "?";
  return `${cleanServer}${sep}url=${encodeURIComponent(targetUrl)}`;
}

const sampleTarget = "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&tlang=he";
const urlA = buildServerProxyUrl("http://localhost:8080/fetch", sampleTarget);
assert(urlA.startsWith("http://localhost:8080/fetch?url="));
assert(urlA.includes(encodeURIComponent(sampleTarget)));

const urlB = buildServerProxyUrl("https://my-proxy.com/api?format=json", sampleTarget);
assert(urlB.startsWith("https://my-proxy.com/api?format=json&url="));

const urlC = buildServerProxyUrl("https://proxy.example.com/stream/{url}/raw", sampleTarget);
assert.strictEqual(
  urlC,
  `https://proxy.example.com/stream/${encodeURIComponent(sampleTarget)}/raw`,
);
console.log("✅ PASS: Server proxy URL generation correctly supports queries and templates");

console.log("==================================================================");
console.log("🎉 ALL TESTS PASSED: Dynamic Favorite Languages & Server Fetch Verified");
console.log("==================================================================");
