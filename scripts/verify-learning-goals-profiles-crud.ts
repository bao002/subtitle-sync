/**
 * Automated Verification Script: Task 351
 *
 * Verifies:
 * 1. Complete CRUD in ratioCompositionsManager:
 *    - Create (saveRatioComposition)
 *    - Read (getStoredRatioCompositions, getActiveRatioCompositionId)
 *    - Update (updateRatioComposition - rename and update values/rates/ratios)
 *    - Delete (deleteRatioComposition)
 * 2. LanguageRatioCompositionSelector component contains full CRUD UI controls:
 *    - Dropdown selector (ratio-compositions-dropdown)
 *    - Save profile form (open-save-profile-button, save-profile-name-input, confirm-save-profile-button)
 *    - Update current profile button (update-active-profile-button)
 *    - Edit/Rename profile form (edit-profile-name-button, edit-profile-name-input, confirm-edit-profile-button)
 *    - Delete custom profile button (delete-custom-profile-button)
 * 3. App routes integration in src/routes/index.tsx:
 *    - LanguageRatioCompositionSelector wires onUpdateProfile={handleUpdateRatioComposition}
 *    - Wires onSaveProfile, onSelectComposition, and onDeleteProfile
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

// Initialize mock localStorage for Node.js environment
const mockStorage: Record<string, string> = {};
const mockLocalStorage: Storage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) {
      delete mockStorage[k];
    }
  },
  key: (index: number) => Object.keys(mockStorage)[index] ?? null,
  get length() {
    return Object.keys(mockStorage).length;
  },
};

(globalThis as any).localStorage = mockLocalStorage;
if (typeof window === "undefined") {
  (globalThis as any).window = {
    localStorage: mockLocalStorage,
  };
}

async function runVerification() {
  console.log("==================================================================");
  console.log("🧪 Verifying Task 351: Learning Goals Profiles Full CRUD");
  console.log("==================================================================");

  // 1. Test ratioCompositionsManager CRUD operations
  console.log("--> [Step 1] Testing ratioCompositionsManager CRUD operations...");
  const {
    saveRatioComposition,
    getStoredRatioCompositions,
    updateRatioComposition,
    deleteRatioComposition,
    getActiveRatioCompositionId,
    setActiveRatioCompositionId,
    BUILT_IN_COMPOSITIONS,
  } = await import("../src/utils/ratioCompositionsManager");

  // Read initial
  const initial = getStoredRatioCompositions();
  assert.ok(initial.length >= BUILT_IN_COMPOSITIONS.length, "Built-in compositions must be present");

  // CREATE
  const created = saveRatioComposition(
    "Spanish Intensive (1:3)",
    { es: 3, en: 1 },
    {
      rates: { es: 1.25, en: 1.0 },
      maxWordsPerSentence: 8,
      sectionOrder: "in-between",
    },
  );
  assert.ok(created.id.startsWith("custom_"), "Custom profile ID must start with custom_");
  assert.strictEqual(created.name, "Spanish Intensive (1:3)");
  assert.strictEqual(created.ratios.es, 3);
  assert.strictEqual(created.rates?.es, 1.25);
  assert.strictEqual(created.maxWordsPerSentence, 8);
  assert.strictEqual(created.sectionOrder, "in-between");
  assert.strictEqual(getActiveRatioCompositionId(), created.id, "Newly created profile must be set as active");

  // READ
  const afterCreate = getStoredRatioCompositions();
  const found = afterCreate.find((c) => c.id === created.id);
  assert.ok(found, "Newly created profile must be retrieved from storage");
  assert.strictEqual(found.name, "Spanish Intensive (1:3)");

  // UPDATE (rename and change rates/ratios)
  const updated = updateRatioComposition(created.id, {
    name: "Spanish & Hebrew Dual Immersion",
    ratios: { es: 4, he: 2, en: 1 },
    rates: { es: 1.5, he: 0.75, en: 1.0 },
    maxWordsPerSentence: 10,
  });
  assert.ok(updated, "Update must succeed and return updated profile");
  assert.strictEqual(updated.name, "Spanish & Hebrew Dual Immersion");
  assert.strictEqual(updated.ratios.es, 4);
  assert.strictEqual(updated.ratios.he, 2);
  assert.strictEqual(updated.rates?.es, 1.5);
  assert.strictEqual(updated.maxWordsPerSentence, 10);

  // Read again to verify persistence of update
  const afterUpdate = getStoredRatioCompositions();
  const foundUpdated = afterUpdate.find((c) => c.id === created.id);
  assert.ok(foundUpdated, "Updated profile must be persisted in storage");
  assert.strictEqual(foundUpdated.name, "Spanish & Hebrew Dual Immersion");

  // DELETE
  const deleted = deleteRatioComposition(created.id);
  assert.strictEqual(deleted, true, "Delete custom profile must return true");

  const afterDelete = getStoredRatioCompositions();
  assert.strictEqual(
    afterDelete.some((c) => c.id === created.id),
    false,
    "Deleted profile must not exist in storage",
  );
  console.log("✅ Step 1: ratioCompositionsManager CRUD (Create, Read, Update, Delete) works 100%");

  // 2. Check LanguageRatioCompositionSelector component source code
  console.log("--> [Step 2] Auditing LanguageRatioCompositionSelector component for full CRUD UI...");
  const selectorPath = path.resolve(process.cwd(), "src/components/LanguageRatioCompositionSelector.tsx");
  const selectorContent = fs.readFileSync(selectorPath, "utf-8");

  const requiredTestIds = [
    'data-testid="ratio-compositions-dropdown"',
    'data-testid="update-active-profile-button"',
    'data-testid="edit-profile-name-button"',
    'data-testid="edit-profile-name-input"',
    'data-testid="confirm-edit-profile-button"',
    'data-testid="delete-custom-profile-button"',
    'data-testid="open-save-profile-button"',
    'data-testid="save-profile-name-input"',
    'data-testid="confirm-save-profile-button"',
  ];

  for (const tid of requiredTestIds) {
    assert.ok(
      selectorContent.includes(tid),
      `LanguageRatioCompositionSelector must contain test ID: ${tid}`,
    );
  }
  console.log("✅ Step 2: LanguageRatioCompositionSelector contains all CRUD UI elements");

  // 3. Check wiring in src/routes/index.tsx
  console.log("--> [Step 3] Auditing src/routes/index.tsx for complete selector wiring...");
  const indexTsxPath = path.resolve(process.cwd(), "src/routes/index.tsx");
  const indexContent = fs.readFileSync(indexTsxPath, "utf-8");

  assert.ok(
    indexContent.includes("onUpdateProfile={handleUpdateRatioComposition}"),
    "src/routes/index.tsx must wire onUpdateProfile={handleUpdateRatioComposition}",
  );
  assert.ok(
    indexContent.includes("onSaveProfile={handleSaveComposition}"),
    "src/routes/index.tsx must wire onSaveProfile={handleSaveComposition}",
  );
  assert.ok(
    indexContent.includes("onDeleteProfile={handleDeleteRatioComposition}"),
    "src/routes/index.tsx must wire onDeleteProfile={handleDeleteRatioComposition}",
  );
  assert.ok(
    indexContent.includes("onSelectComposition={handleSelectRatioComposition}"),
    "src/routes/index.tsx must wire onSelectComposition={handleSelectRatioComposition}",
  );
  console.log("✅ Step 3: src/routes/index.tsx connects complete profile CRUD operations");

  console.log("==================================================================");
  console.log("🎉 All checks for Task 351 passed successfully!");
  console.log("==================================================================");
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
