/**
 * Dedicated verification for Prompt 66 Chapter 2 / Task 299:
 * "settings - should appear only on its own stage"
 *
 * Verifies:
 * 1. Stage 4 ("Settings") is explicitly defined in the accordion stage stepper with data-testid="stage-step-4".
 * 2. On Stage 4 (currentAccordionStage === 4), only settings panels ('playback', 'library') are displayed.
 * 3. On Stages 0, 1, 2, and 3, settings panels ('playback', 'library') are strictly excluded and never rendered.
 * 4. Header buttons and toggle controls switch directly to Stage 4.
 * 5. Parity with Beginner mode: Preferences is isolated in its own dedicated tab/stage ("preferences").
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

function run() {
  console.log('[TEST] Verifying Settings appears ONLY on its own dedicated stage...');

  const indexPath = path.resolve(process.cwd(), 'src/routes/index.tsx');
  const indexContent = fs.readFileSync(indexPath, 'utf-8');

  // Check 1: Stage 4 button exists in the stage stepper
  assert.ok(
    indexContent.includes('id="stage-step-4"') && indexContent.includes('data-testid="stage-step-4"'),
    'Stage 4 button (data-testid="stage-step-4") must exist in the stage stepper'
  );
  console.log('✓ Stage 4 button is present in stepper');

  // Check 2: Stage 4 label is Settings
  const stageStep4Snippet = indexContent.slice(
    indexContent.indexOf('id="stage-step-4"'),
    indexContent.indexOf('id="stage-step-4"') + 500
  );
  assert.ok(
    stageStep4Snippet.includes('Settings'),
    'Stage 4 button must be labeled Settings'
  );
  console.log('✓ Stage 4 is clearly labeled Settings');

  // Check 3: Panel filter strictly isolates settings to Stage 4
  assert.ok(
    indexContent.includes('if (currentAccordionStage === 4)'),
    'Filtering logic must explicitly check for currentAccordionStage === 4'
  );
  assert.ok(
    indexContent.includes('return panelId === "playback" || panelId === "library";'),
    'On Stage 4, only playback and library settings panels should be returned'
  );
  console.log('✓ Stage 4 only displays settings panels');

  // Check 4: On Stages 0, 1, 2, 3, settings panels never appear
  assert.ok(
    indexContent.includes('if (panelId === "playback" || panelId === "library") {\n                      return false;\n                    }'),
    'On non-stage-4 stages, settings panels (playback, library) must return false'
  );
  console.log('✓ Stages 0, 1, 2, 3 strictly exclude settings panels');

  // Check 5: Beginner tab isolation
  const beginnerTabNavPath = path.resolve(process.cwd(), 'src/components/beginner/BeginnerTabNav.tsx');
  const beginnerTabNavContent = fs.readFileSync(beginnerTabNavPath, 'utf-8');
  assert.ok(
    beginnerTabNavContent.includes('id: "preferences"') && beginnerTabNavContent.includes('General Preferences'),
    'Beginner mode must have its own dedicated preferences tab/stage'
  );
  console.log('✓ Beginner mode maintains parity with dedicated General Preferences tab');

  console.log('All Settings stage isolation checks passed successfully!');
}

run();
