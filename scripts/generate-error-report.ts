import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execSync, spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);

export interface ErrorReportOptions {
  stepName?: string;
  command?: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  outputPath?: string;
  logFile?: string;
  runCommand?: string;
}

export interface DiagnosticDiagnosis {
  category:
    | "lint"
    | "typecheck"
    | "test_assertion"
    | "missing_module"
    | "network"
    | "build"
    | "runtime"
    | "unknown";
  summary: string;
  affectedFiles: string[];
  suggestedFixes: string[];
}

/**
 * Executes a git command safely returning empty string if it fails
 */
function runGit(cmd: string): string {
  try {
    return execSync(`git ${cmd}`, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf-8",
    }).trim();
  } catch {
    return "N/A";
  }
}

/**
 * Analyzes logs using heuristics to extract root cause and actionable fix instructions.
 */
export function diagnoseError(
  stderr: string,
  stdout: string,
  command: string = "",
): DiagnosticDiagnosis {
  const combined = `${stdout}\n${stderr}`;
  const affectedFiles: string[] = [];
  const suggestedFixes: string[] = [];
  let category: DiagnosticDiagnosis["category"] = "unknown";
  let summary = "Process failed with non-zero exit code.";

  // Extract file matches (e.g. /app/applet/src/foo.tsx:12:34 or src/foo.ts)
  const fileRegex =
    /(?:^|\s|["'])((?:src\/|scripts\/|docs\/|e2e\/|\/app\/applet\/)[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)(?::(\d+)(?::(\d+))?)?/g;
  let match: RegExpExecArray | null;
  while ((match = fileRegex.exec(combined)) !== null) {
    const file = match[1].replace(/^\/app\/applet\//, "");
    if (!affectedFiles.includes(file)) {
      affectedFiles.push(file);
    }
  }

  // 1. Lint / Prettier Error
  if (
    combined.includes("prettier/prettier") ||
    combined.includes("ESLint") ||
    combined.includes("eslint")
  ) {
    category = "lint";
    summary = "ESLint / Prettier code style or syntax violation detected.";
    if (affectedFiles.length > 0) {
      suggestedFixes.push(`Format affected files: npx prettier --write ${affectedFiles.join(" ")}`);
    } else {
      suggestedFixes.push(
        "Run 'npm run lint -- --fix' or 'npx prettier --write src/' to auto-format files.",
      );
    }
    suggestedFixes.push("Verify with 'npm run lint'.");
  }
  // 2. TypeScript / Compiler Error
  else if (
    /error TS\d+:/.test(combined) ||
    combined.includes("TypeScript error") ||
    combined.includes("Type '")
  ) {
    category = "typecheck";
    summary = "TypeScript static type checking or compiler error.";
    suggestedFixes.push("Check interface definitions, missing property types, or type assertions.");
    suggestedFixes.push("Run 'npx tsc --noEmit' to inspect all compiler errors in the project.");
  }
  // 3. Test Assertion Failure
  else if (
    combined.includes("ERR_ASSERTION") ||
    combined.includes("AssertionError") ||
    combined.includes("expect(")
  ) {
    category = "test_assertion";
    summary = "Automated test assertion failed (expected condition was not satisfied).";
    suggestedFixes.push("Review test expectations against actual runtime output.");
    if (command) {
      suggestedFixes.push(`Re-run failed test in isolation: ${command}`);
    }
  }
  // 4. Missing Module / Dependency
  else if (combined.includes("Cannot find module") || combined.includes("ERR_MODULE_NOT_FOUND")) {
    category = "missing_module";
    summary = "Missing JavaScript/TypeScript dependency or incorrect import path.";
    suggestedFixes.push("Verify the import path matches the file location exactly.");
    suggestedFixes.push("Install missing dependency via 'npm install <package-name>'.");
  }
  // 5. Port Conflict / Dev Server
  else if (combined.includes("EADDRINUSE") || combined.includes("address already in use")) {
    category = "network";
    summary = "Network port collision (EADDRINUSE).";
    suggestedFixes.push(
      "Kill process holding port 3000: 'fuser -k 3000/tcp' or check vite server port configuration.",
    );
  }
  // 6. Vite / Webpack Build Failure
  else if (combined.includes("vite build") || combined.includes("Rollup failed")) {
    category = "build";
    summary = "Production web build bundling error.";
    suggestedFixes.push(
      "Check circular dependencies, missing exports, or unresolved asset imports.",
    );
    suggestedFixes.push("Test build locally via 'npm run build'.");
  } else {
    summary = `Command '${command || "step"}' terminated abnormally.`;
    suggestedFixes.push(`Execute reproduction command directly: ${command || "npm test"}`);
  }

  return { category, summary, affectedFiles, suggestedFixes };
}

/**
 * Builds the complete structured error report markdown text
 */
export function buildErrorReport(options: ErrorReportOptions): string {
  const stepName = options.stepName || "Automated Verification / CI Step";
  const command = options.command || "npm test";
  const exitCode = options.exitCode ?? 1;
  const stdout = options.stdout || "";
  const stderr = options.stderr || "";

  const diagnosis = diagnoseError(stderr, stdout, command);

  // Environment Telemetry
  const gitCommit = runGit("rev-parse HEAD");
  const gitBranch = runGit("rev-parse --abbrev-ref HEAD");
  const gitStatus = runGit("status --short");
  const nodeVersion = process.version;
  const osPlatform = `${os.platform()} (${os.arch()}) ${os.release()}`;
  const timestamp = new Date().toISOString();

  // Trim and extract most relevant log tail
  const rawLog = `${stdout}\n${stderr}`.trim();
  const logLines = rawLog.split("\n");
  const trimmedLog = logLines.length > 80 ? logLines.slice(-80).join("\n") : rawLog;

  return `# =====================================================================
# AUTOMATED ERROR REPORT & AI REPRODUCTION FIX PROMPT (error.log)
# Generated At: ${timestamp}
# Status: FAILED (Exit Code: ${exitCode})
# =====================================================================

## 1. Executive Summary
- **Failed Step**: ${stepName}
- **Executed Command**: \`${command}\`
- **Exit Code**: ${exitCode}
- **Failure Category**: ${diagnosis.category.toUpperCase()}
- **Root Cause Summary**: ${diagnosis.summary}
${
  diagnosis.affectedFiles.length > 0
    ? `- **Suspect Files**: ${diagnosis.affectedFiles.map((f) => `\`${f}\``).join(", ")}`
    : ""
}

## 2. Environment Telemetry
- **Node.js**: ${nodeVersion}
- **Platform**: ${osPlatform}
- **Git Branch**: \`${gitBranch}\`
- **Git Commit**: \`${gitCommit}\`
- **Working Tree State**:
\`\`\`
${gitStatus || "Clean (no uncommitted changes)"}
\`\`\`

## 3. Minimal Reproduction Steps
To immediately reproduce this exact failure locally or in development:

\`\`\`bash
# 1. Ensure dependencies are current
npm install

# 2. Run the exact failing command
${command}
\`\`\`

## 4. Suggested Fix & Diagnostic Recommendations
${diagnosis.suggestedFixes.map((fix, idx) => `${idx + 1}. ${fix}`).join("\n")}

## 5. Failure Log & Stack Trace
\`\`\`
${trimmedLog || "No stdout/stderr captured."}
\`\`\`

---

# =====================================================================
# AI PROMPT (Copy everything below directly into your AI Assistant prompt)
# =====================================================================

Fix the following issue in the application:

### Bug Report: ${diagnosis.summary}
- **Failed Step**: ${stepName}
- **Failing Command**: \`${command}\`
- **Exit Code**: ${exitCode}
${
  diagnosis.affectedFiles.length > 0
    ? `- **Affected Files**: ${diagnosis.affectedFiles.map((f) => `\`${f}\``).join(", ")}`
    : ""
}

### How to Reproduce
\`\`\`bash
${command}
\`\`\`

### Error Output / Stack Trace
\`\`\`
${trimmedLog}
\`\`\`

### Instructions for AI Assistant:
1. Examine the root cause highlighted in the error output above.
2. Implement targeted, minimal file edits to resolve the problem.
3. Verify that \`${command}\` passes with exit code 0.
4. Run \`compile_applet\` and \`lint_applet\` to guarantee zero regressions.
`;
}

/**
 * Main execution routine for CLI invocation
 */
export function main() {
  const args = process.argv.slice(2);
  let runCommand = "";
  let logFile = "";
  let command = "";
  let stepName = "";
  let outputPath = "error.log";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--run" && args[i + 1]) {
      runCommand = args[++i];
    } else if (args[i] === "--file" && args[i + 1]) {
      logFile = args[++i];
    } else if (args[i] === "--command" && args[i + 1]) {
      command = args[++i];
    } else if (args[i] === "--step" && args[i + 1]) {
      stepName = args[++i];
    } else if (args[i] === "--output" && args[i + 1]) {
      outputPath = args[++i];
    }
  }

  // Mode 1: Run suspect command directly and intercept failure
  if (runCommand) {
    command = runCommand;
    stepName = stepName || `Execution of: ${runCommand}`;
    console.log(`[error-reporter] Executing command: ${runCommand}`);

    const res = spawnSync(runCommand, { shell: true, encoding: "utf-8" });
    const stdout = res.stdout || "";
    const stderr = res.stderr || "";
    const exitCode = res.status ?? (res.error ? 1 : 0);

    if (exitCode === 0) {
      console.log(`✅ [error-reporter] Command '${runCommand}' succeeded with exit code 0.`);
      return 0;
    }

    console.error(
      `❌ [error-reporter] Command '${runCommand}' failed with exit code ${exitCode}. Generating error report...`,
    );
    const report = buildErrorReport({
      stepName,
      command: runCommand,
      exitCode,
      stdout,
      stderr,
      outputPath,
    });

    fs.writeFileSync(outputPath, report, "utf-8");
    console.log(`📄 [error-reporter] Error report generated and saved to: ${outputPath}`);

    // If running in GitHub Actions, append to GITHUB_STEP_SUMMARY
    if (process.env.GITHUB_STEP_SUMMARY) {
      try {
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n\n${report}\n`);
      } catch (err) {
        console.warn("[error-reporter] Could not write to GITHUB_STEP_SUMMARY:", err);
      }
    }

    return exitCode;
  }

  // Mode 2: Ingest existing log file
  if (logFile && fs.existsSync(logFile)) {
    const content = fs.readFileSync(logFile, "utf-8");
    const report = buildErrorReport({
      stepName: stepName || `Failure in ${logFile}`,
      command: command || "npm test",
      exitCode: 1,
      stderr: content,
      outputPath,
    });

    fs.writeFileSync(outputPath, report, "utf-8");
    console.log(`📄 [error-reporter] Error report generated from ${logFile} to ${outputPath}`);
    return 1;
  }

  // Mode 3: Manual report synthesis
  const report = buildErrorReport({
    stepName: stepName || "System Diagnostic Report",
    command: command || "npm test",
    exitCode: 1,
    stderr: "Manual error report invocation.",
    outputPath,
  });

  fs.writeFileSync(outputPath, report, "utf-8");
  console.log(`📄 [error-reporter] Diagnostic error report generated to: ${outputPath}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const code = main();
  if (typeof code === "number" && code !== 0) {
    process.exit(code);
  }
}
