import { readFileSync } from "fs";
import { resolve } from "path";
import * as ts from "typescript";

/**
 * Dedicated automated verification test for Hotfix (Prompt 159):
 * Fix Syntax Error in `src/routes/index.tsx` (Missing Closing Tag for <div>).
 */
function runHotfixVerification() {
  console.log("=== Verifying Hotfix (Prompt 159): JSX Syntax & Structure in src/routes/index.tsx ===");

  const indexPath = resolve(process.cwd(), "src/routes/index.tsx");
  const content = readFileSync(indexPath, "utf8");

  // 1. Verify specific closing tags structure for stage-2-language-ratios-container
  const targetPattern = /<div[^>]*?id="stage-2-language-ratios-container"[\s\S]*?<\/LearningGoalAccordion>/;
  const match = content.match(targetPattern);
  if (!match) {
    throw new Error("FAIL: Could not locate stage-2-language-ratios-container inside LearningGoalAccordion in src/routes/index.tsx");
  }

  // Count <div> and </div> inside the accordion block
  const block = match[0];
  const openingDivs = (block.match(/<div(\s|>)/g) || []).length;
  const closingDivs = (block.match(/<\/div>/g) || []).length;

  console.log(`Checking JSX div balance in narration-ratios accordion: ${openingDivs} opening divs, ${closingDivs} closing divs.`);
  if (openingDivs !== closingDivs) {
    throw new Error(`FAIL: Mismatched div tags inside narration-ratios block! Opening: ${openingDivs}, Closing: ${closingDivs}`);
  }

  // 2. Full TypeScript AST Parsing validation
  console.log("Validating complete TypeScript AST parsing for src/routes/index.tsx...");
  const sourceFile = ts.createSourceFile(
    "index.tsx",
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const parseDiagnostics = (sourceFile as unknown as { parseDiagnostics?: ts.Diagnostic[] }).parseDiagnostics || [];
  const syntaxErrors = parseDiagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);

  if (syntaxErrors.length > 0) {
    const errorMessages = syntaxErrors.slice(0, 5).map(d => {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(d.start || 0);
      return `Line ${line + 1}:${character + 1} - ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`;
    });
    throw new Error(`FAIL: TypeScript AST reported syntax errors in index.tsx:\n${errorMessages.join("\n")}`);
  }

  console.log("PASS: TypeScript AST parsed src/routes/index.tsx with 0 syntax errors!");

  // 3. Verify LearningGoalAccordion tags balance across the file
  const openAccordions = (content.match(/<LearningGoalAccordion/g) || []).length;
  const closeAccordions = (content.match(/<\/LearningGoalAccordion>/g) || []).length;
  console.log(`Checking LearningGoalAccordion balance: ${openAccordions} opened, ${closeAccordions} closed.`);
  if (openAccordions !== closeAccordions) {
    throw new Error(`FAIL: Unbalanced LearningGoalAccordion tags! Opened: ${openAccordions}, Closed: ${closeAccordions}`);
  }

  console.log("SUCCESS: All Hotfix (Prompt 159) checks passed perfectly!");
}

try {
  runHotfixVerification();
} catch (err: unknown) {
  console.error((err as Error).message);
  process.exit(1);
}
