import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import jsYaml from "js-yaml";

console.log("====================================================");
console.log("🧪 Starting Extended Flow Options Verification");
console.log("====================================================");

const rootDir = process.cwd();
const workflowsDir = path.resolve(rootDir, ".github", "workflows");

// 1. Verify zero cron jobs across all workflow files
console.log("1. Verifying Zero GitHub Actions cron jobs policy...");
const workflowFiles = fs.readdirSync(workflowsDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
assert(workflowFiles.length > 0, "Workflows directory must contain YAML workflow files");

for (const file of workflowFiles) {
  const filePath = path.join(workflowsDir, file);
  const content = fs.readFileSync(filePath, "utf8");
  const parsed = jsYaml.load(content) as any;

  assert(
    !content.includes("schedule:"),
    `Workflow '${file}' must not define a 'schedule:' trigger (Zero cron policy)`,
  );
  assert(
    !content.includes("cron:"),
    `Workflow '${file}' must not define a 'cron:' expression (Zero cron policy)`,
  );
  assert(
    parsed.on && !parsed.on.schedule,
    `Workflow '${file}' must not contain an on.schedule field`,
  );
}
console.log(`✅ PASS: All ${workflowFiles.length} workflow files strictly adhere to Zero Cron policy.`);

// 2. Verify emulation.yml extended flow options
console.log("2. Verifying emulation.yml flow options (Appium Android inspired)...");
const emulationPath = path.join(workflowsDir, "emulation.yml");
assert(fs.existsSync(emulationPath), "emulation.yml must exist");
const emulationYaml = fs.readFileSync(emulationPath, "utf8");
const parsedEmulation = jsYaml.load(emulationYaml) as any;

assert(parsedEmulation.on?.workflow_dispatch?.inputs, "emulation.yml must define workflow_dispatch inputs");
const emuInputs = parsedEmulation.on.workflow_dispatch.inputs;

assert(emuInputs["api-level"], "emulation.yml must define 'api-level' input");
assert.deepStrictEqual(emuInputs["api-level"].options, ["33", "34", "35"], "api-level options must include 33, 34, 35");
assert(emuInputs["target"], "emulation.yml must define 'target' input");
assert(emuInputs["arch"], "emulation.yml must define 'arch' input");
assert(emuInputs["disable-animations"], "emulation.yml must define 'disable-animations' input");
assert(emuInputs["record-video"], "emulation.yml must define 'record-video' input");
assert(emuInputs["emulator-boot-timeout"], "emulation.yml must define 'emulator-boot-timeout' input");
assert(emuInputs["test-filter"], "emulation.yml must define 'test-filter' input");

assert(emulationYaml.includes("api-level: ${{ inputs.api-level || 34 }}"), "emulation.yml must bind api-level input");
assert(emulationYaml.includes("emulator-boot-timeout: ${{ inputs.emulator-boot-timeout || 600 }}"), "emulation.yml must bind boot timeout input");
console.log("✅ PASS: emulation.yml exposes complete Appium Android-style parameterization.");

// 3. Verify web.yml extended flow options
console.log("3. Verifying web.yml flow options (Appium Inspector inspired)...");
const webPath = path.join(workflowsDir, "web.yml");
assert(fs.existsSync(webPath), "web.yml must exist");
const webYaml = fs.readFileSync(webPath, "utf8");
const parsedWeb = jsYaml.load(webYaml) as any;

assert(parsedWeb.on?.workflow_dispatch?.inputs, "web.yml must define workflow_dispatch inputs");
const webInputs = parsedWeb.on.workflow_dispatch.inputs;

assert(webInputs["project"], "web.yml must define 'project' input");
assert.deepStrictEqual(webInputs["project"].options, ["web", "emulation", "app"], "project options must include web, emulation, app");
assert(webInputs["test-filter"], "web.yml must define 'test-filter' input");
assert(webInputs["retention-days"], "web.yml must define 'retention-days' input");
assert(webYaml.includes("--project=${{ inputs.project || 'web' }}"), "web.yml must bind project input");
console.log("✅ PASS: web.yml exposes complete Appium Inspector-style parameterization.");

// 4. Verify integrity.yml extended flow options
console.log("4. Verifying integrity.yml flow options...");
const integrityPath = path.join(workflowsDir, "integrity.yml");
assert(fs.existsSync(integrityPath), "integrity.yml must exist");
const integrityYaml = fs.readFileSync(integrityPath, "utf8");
const parsedIntegrity = jsYaml.load(integrityYaml) as any;

assert(parsedIntegrity.on?.workflow_dispatch?.inputs, "integrity.yml must define workflow_dispatch inputs");
const integrityInputs = parsedIntegrity.on.workflow_dispatch.inputs;
assert(integrityInputs["scope"], "integrity.yml must define 'scope' input");
assert(integrityInputs["fail-fast"], "integrity.yml must define 'fail-fast' input");
console.log("✅ PASS: integrity.yml exposes complete scope parameterization.");

console.log("====================================================");
console.log("🎉 Extended Flow Options Verification PASSED 100%!");
console.log("====================================================");
