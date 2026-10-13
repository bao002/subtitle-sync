# Temporary Scratchpad (`temp.md`)

## Task 103 Plan: Full Implementation of Versioning Discrepancy Architecture

### 1. `MainActivity.kt` (Android Shell):
- In `onCreate()`:
  - Add `clearOtaCacheOnApkUpgrade`: Check `last_run_version_code` from SharedPreferences `app_version_tracking`. If `currentVersionCode > lastRunVersionCode`, recursively delete `File(filesDir, "app_updates")`, record new version code.
- In `shouldInterceptRequest`:
  - Update `headers` for `LOCAL_ASSET_DOMAIN` to include:
    `"Cache-Control" to "no-cache, no-store, must-revalidate"`,
    `"Pragma" to "no-cache"`,
    `"Expires" to "0"`
- In `AndroidNativeBridge`:
  - Add `@JavascriptInterface fun clearOtaCache(): Boolean` which deletes `File(context.filesDir, "app_updates")`.

### 2. `src/types.ts`:
- Add `clearOtaCache?: () => boolean` to `Window.AndroidNativeShell`.

### 3. `src/utils/apkUpdater.ts`:
- Export `VersionComparison` interface:
  `{ isDiscrepancy: boolean; apkVersion: string; webVersion: string; isOtaActive: boolean; isStaleOtaCache: boolean }`
- Export `checkVersionDiscrepancy(): VersionComparison`.
- Export `clearOtaCacheAndReload(): boolean`:
  - Clears `localStorage.removeItem("active_release_artifact_tag")`.
  - Calls `window.AndroidNativeShell?.clearOtaCache?.()`.
  - Reloads window: `window.location.reload()`.

### 4. `src/components/ApkReleaseModal.tsx`:
- Render dual-version card / indicator showing:
  - Container APK version (`apkVersion`)
  - Web bundle version (`webVersion`)
  - OTA status badge (`OTA Hotfix active` vs `Clean bundled assets`)
  - If discrepancy detected: warning message and "Clear OTA Cache & Reload" button.

### 5. Automated test & verification:
- `scripts/verify-versioning-discrepancy-implementation.ts`
- Run build & lint.
