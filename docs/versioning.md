# Android Application Versioning & Update Architecture (`docs/versioning.md`)

This document explains the versioning architecture of YouTube Viewer (`com.ytviewer.app`), how users update the application, why update errors such as _"same package already installed"_ or `INSTALL_FAILED_UPDATE_INCOMPATIBLE` occur, and the automated recovery flows implemented in the codebase.

---

## 1. Versioning Architecture: `versionName` vs `versionCode`

Android enforces a dual-identifier versioning system in `AndroidManifest.xml` and Gradle:

| Identifier        | Type    | Format / Example            | Purpose                                                                                                                 |
| :---------------- | :------ | :-------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **`versionName`** | String  | `"1.0.16"` or `"1.0.16.42"` | Displayed to end users in the UI, Settings, and release notes.                                                          |
| **`versionCode`** | Integer | `42` or `10016`             | Strictly monotonic integer examined by the Android Package Manager (`PackageManager`) to determine upgrade eligibility. |

### Build-Time Resolution in `android-shell/app/build.gradle.kts`:

- **CI Release Builds (`.github/workflows/release-apk.yml`)**:
  - `versionCode = ${GITHUB_RUN_NUMBER}`
  - `versionName = ${package.json.version}.${GITHUB_RUN_NUMBER}` (e.g. `1.0.16.42`)
- **Local / Development Builds**:
  - Automatically parses the root `package.json` version string.
  - Generates a semver numeric code:
    $$\text{versionCode} = (\text{major} \times 10000) + (\text{minor} \times 100) + \text{patch}$$
    (e.g., `1.0.16` $\rightarrow$ `10016`).
  - Ensures local builds do not stay stuck at default `versionCode = 1` and `versionName = "1.0"`.

### Dynamic Runtime Version Bridge (`AndroidNativeShell`):

The native Android activity (`MainActivity.kt`) exposes the installed APK's actual package information directly to the Web SPA via `@JavascriptInterface`:

- `AndroidNativeShell.getAppVersionName()`: Returns the live installed `versionName` from `PackageManager`.
- `AndroidNativeShell.getAppVersionCode()`: Returns the live installed `versionCode`.
- `AndroidNativeShell.getInstalledAppInfo()`: Returns a JSON object `{ "packageName": "com.ytviewer.app", "versionName": "1.0.16.42", "versionCode": 42 }`.

The client utility (`src/utils/apkUpdater.ts`) reads this dynamically via `getActiveAppVersion()`, ensuring the UI footer, settings, and release modals reflect the true installed APK version rather than static fallbacks.

---

## 2. How to Update the Application

The application supports three distinct update channels:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Update Distribution Channels                     │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│ 1. In-App OTA       │ 2. Automated ADB Script  │ 3. Direct APK Install │
│    Hot Update       │    (update.apk.sh)       │    (Device Browser)   │
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ • Zero re-install   │ • One-line terminal cmd  │ • Download APK via    │
│ • Downloads web-dist│ • Resolves devices       │   mobile Chrome       │
│ • No permissions    │ • Deep purge collisions  │ • Open via Android    │
│ • Instant reload    │ • Launches activity      │   Package Installer   │
└─────────────────────┴──────────────────────────┴───────────────────────┘
```

### Channel 1: In-App OTA Hot Update (Recommended for Feature/UI Updates)

- Available inside the app under **Check for Updates** or the APK release modal.
- Downloads `web-dist.zip` from GitHub Releases directly to device storage (`context.filesDir/app_updates/`).
- Instantly updates web bundle without modifying the native APK shell.
- **Advantage**: Bypasses Android Package Manager entirely—never triggers package or signature collision errors.

### Channel 2: Automated ADB Script (`update.apk.sh`)

- Designed for developers, testers, and connected devices:
  ```bash
  # Option A: One-line remote installation
  curl -fsSL https://raw.githubusercontent.com/mostuf2556/subtitle-sync/main/update.apk.sh | bash

  # Option B: Local script execution
  bash update.apk.sh
  ```
- Automatically checks for connected Android devices via `adb devices`.
- Downloads the latest release APK from GitHub.
- Applies collision-recovery strategies (`-r -d -t` with automatic fallback to deep purge).

### Channel 3: Direct APK Install via Android Browser

1. Download `YouTube-Viewer-debug.apk` from GitHub Releases on your Android device.
2. Tap the downloaded file in notifications or Files app.
3. If an existing version signed by a different key is installed, **uninstall the previous version first** before installing the new APK.

---

## 3. Why Updates Fail: Diagnosing "Same Package Already Installed" & Collision Errors

When installing an APK update on Android, the system Package Manager performs strict security and state verifications. If any check fails, the install aborts with an error:

### Root Cause 1: Keystore Signature Mismatch (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`)

- **What happens**: The previously installed APK was signed with one keystore (e.g., local developer `~/.android/debug.keystore`), and the new APK was signed with a different keystore (e.g., GitHub Actions CI runner debug keystore).
- **Android's Rule**: Android strictly prohibits an app from being upgraded by an APK with a different cryptographic signature to protect app data.
- **System Error**: `INSTALL_FAILED_UPDATE_INCOMPATIBLE: Package com.ytviewer.app signatures do not match previously installed version; ignoring!`
- **User UI Symptom**: _"App not installed as package conflicts with an existing package"_ or _"App not installed as package appears to be corrupt"_.

### Root Cause 2: Version Code Downgrade or Equality (`INSTALL_FAILED_VERSION_DOWNGRADE`)

- **What happens**: The newly built APK has a `versionCode` that is lower than or equal to the currently installed APK's `versionCode`.
- **Android's Rule**: By default, Android Package Manager blocks installing an older version over a newer version unless the `-d` (allow downgrade) flag is explicitly passed via ADB.
- **System Error**: `INSTALL_FAILED_VERSION_DOWNGRADE`.
- **User UI Symptom**: Android's GUI package installer silently fails or states _"App not installed"_.

### Root Cause 3: Package Already Exists Without Replace Flag (`INSTALL_FAILED_ALREADY_EXISTS`)

- **What happens**: Running raw `adb install` or `pm install` without the `-r` (replace existing application) parameter.
- **Android's Rule**: Without `-r`, Android treats the install as a fresh installation and rejects it because the package identifier `com.ytviewer.app` is already registered.
- **System Error**: `INSTALL_FAILED_ALREADY_EXISTS: Attempt to re-install com.ytviewer.app without first uninstalling`.

### Root Cause 4: Multi-User / Work Profile Residue

- **What happens**: On devices with multiple users, private space, or work profiles, running `adb uninstall com.ytviewer.app` may remove the app from the primary user while leaving it installed for another profile.
- **System Error**: Collision during global package reinstall.

---

## 4. Automated Recovery & Best Practice Solutions

The codebase implements comprehensive safeguards across scripts and native shell to eliminate these failures:

### 1. Automated Deep Purge in `update.apk.sh` and `install-apk.sh`

The update scripts detect collision errors:

```bash
has_collision_error() {
  local out="$1"
  if echo "$out" | grep -qE "INSTALL_FAILED_ALREADY_EXISTS|INSTALL_FAILED_UPDATE_INCOMPATIBLE|INSTALL_FAILED_VERSION_DOWNGRADE|INSTALL_FAILED_CONFLICTING_PROVIDER|INSTALL_FAILED_SHARED_USER_INCOMPATIBLE|INSTALL_FAILED_DUPLICATE_PERMISSION|signatures do not match"; then
    return 0
  fi
  return 1
}
```

When a collision is detected, the script automatically triggers a **Deep Purge**:

1. `adb shell am force-stop com.ytviewer.app`: Terminate running background audio / player processes.
2. `adb shell pm clear com.ytviewer.app`: Clear corrupt cache and preferences.
3. `adb uninstall com.ytviewer.app`: Global uninstall.
4. `adb shell pm uninstall --user 0 com.ytviewer.app`: Remove user profile residue.
5. Re-executes installation with flags `-r -d -t` (replace, allow downgrade, allow test/debug APKs).

### 2. Manual User Recovery Workflow

If updating manually without ADB:

1. Long-press the YouTube Viewer app icon on the Android home screen or app drawer.
2. Select **App Info** $\rightarrow$ **Uninstall**.
3. Tap the newly downloaded `YouTube-Viewer-debug.apk` to install a fresh, clean build.
4. Future OTA updates can then be received directly in-app via the OTA updater without needing to reinstall.

---

## 5. APK Version vs. WebView Version Discrepancies: Architecture, Causes & Recovery

In a hybrid Android application, two separate layers have distinct version identities:

1. **The Native APK Container Layer**: The Android application package (`com.ytviewer.app`) compiled by Gradle, signed by a keystore, managed by the Android `PackageManager`, and identified by `versionName` (e.g. `1.0.16.42`) and `versionCode` (e.g. `42` or `10016`).
2. **The Embedded WebView SPA Layer**: The React/Vite single-page web application executing inside the Android `WebView`, identified by `package.json` (`version: "1.0.16"`), the built JavaScript bundle (`assets/dist/` or `assets/`), and any downloaded in-app OTA hot update artifacts (`context.filesDir/app_updates/`).

When these two layers fall out of sync, the application experiences a **Version Discrepancy** (e.g., the Android settings or APK footer reports `v1.0.17`, but the internal UI or subtitle features behave according to `v1.0.16`, or vice-versa).

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Hybrid Version Architecture Dual-Layer               │
├───────────────────────────────────┬────────────────────────────────────┤
│ Native APK Container (Shell)      │ Embedded WebView Bundle (SPA)      │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Defined in build.gradle.kts     │ • Defined in package.json          │
│ • Inspectable via PackageManager  │ • Embedded in assets/ or OTA files │
│ • Queried via AndroidNativeShell  │ • Queried via getActiveAppVersion()│
│   .getAppVersionName()            │ • Can be updated via OTA web-dist  │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

### 5.1 Root Causes of APK vs. WebView Version Divergence

Understanding the exact mechanism causing the disparity is essential to applying the correct fix:

#### Root Cause 1: Stale Bundled Web Assets During APK Compilation (Build Pipeline Desync)

- **What happens**: A developer or CI workflow bumps the project version in `package.json` or modifies frontend code, but builds the Android APK (`./gradlew assembleDebug`) **without first running `npm run build`** or without copying the fresh `dist/` directory into `android-shell/app/src/main/assets/`.
- **Symptom**: The APK installer and Android System App Info show the bumped native `versionName` (e.g., `1.0.17`), but the WebView serves the older bundled `index.html` and JavaScript chunks (e.g., `1.0.16`).
- **Resolution**: Enforce a sequential build script that compiles web assets before Gradle packaging.

#### Root Cause 2: Active OTA Hot Update Bundle (Intentional Version Lead)

- **What happens**: The user received an In-App OTA hot update (Channel 1: downloading `web-dist.zip` from GitHub Releases). The web SPA extracted into `context.filesDir/app_updates/` has a higher version (e.g., `1.0.18`) than the base APK shell installed months ago (e.g., `1.0.16`).
- **Symptom**: The Web UI reports `v1.0.18`, but `PackageManager` reports `1.0.16`.
- **Assessment**: This is **normal, intentional behavior** for OTA hot updates. The app is running the latest web code inside an older native shell container.
- **Resolution**: Ensure the UI indicates that an OTA hot update is active (`v1.0.18 (OTA) • Base APK v1.0.16`). If the web bundle requires newly added native bridge methods not present in the older APK shell, prompt the user for a full native APK upgrade.

#### Root Cause 3: Lingering Stale OTA Cache After Native APK Upgrade

- **What happens**: A user was previously running an OTA hot update (`v1.0.16.5`) on top of an older APK (`v1.0.15`). The user then installs a brand-new native APK (`v1.0.17`) containing updated web assets. However, the native Android shell continues serving the cached OTA directory in `context.filesDir/app_updates/` or `localStorage.getItem("active_release_artifact_tag")` because it was never purged upon native APK upgrade.
- **Symptom**: The user installed a brand-new APK (`v1.0.17`), but the app still runs the older OTA bundle (`v1.0.16.5`).
- **Resolution**: Implement automatic OTA cache invalidation during `MainActivity.onCreate()` whenever `versionCode` increases.

#### Root Cause 4: Static Fallback Hardcoding vs Dynamic Bridge Querying

- **What happens**: Code references a hardcoded constant (such as `CURRENT_APK_VERSION = "v1.0.16"`) in JavaScript instead of dynamically interrogating `window.AndroidNativeShell.getAppVersionName()`.
- **Symptom**: In browser mode, the web view displays the static constant; on Android, if the native bridge fails to load or is unmocked, it falls back to the static string.
- **Resolution**: Dynamically query `AndroidNativeShell.getAppVersionName()` and `AndroidNativeShell.getAppVersionCode()` with safe fallback handling.

#### Root Cause 5: Live Development Server / Remote Endpoint Loading

- **What happens**: In development, `MainActivity.kt` or the WebView is configured to load from `http://10.0.2.2:3000` (local Vite dev server) or a remote preview URL rather than the local offline `https://appassets.androidplatform.net/index.html`.
- **Symptom**: The WebView reflects the live code running on the host machine, while the APK container has a static version.
- **Resolution**: Distinguish between development live reload mode and production local bundled assets mode.

---

### 5.2 Diagnostic Workflow: How to Detect Version Discrepancies

#### 1. In-App Web SPA Comparison Logic

In the React frontend (`src/utils/apkUpdater.ts`), check for disparity:

```typescript
export interface VersionComparison {
  isDiscrepancy: boolean;
  apkVersion: string;
  webVersion: string;
  isOtaActive: boolean;
  isStaleOtaCache: boolean;
}

export function checkVersionDiscrepancy(): VersionComparison {
  const installedInfo = getInstalledApkVersionInfo();
  const apkVersion = installedInfo.versionName; // e.g. "1.0.17"
  const activeVersion = getActiveAppVersion(); // e.g. "v1.0.16" or OTA tag
  const otaTag =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("active_release_artifact_tag")
      : null;

  const isOtaActive = Boolean(otaTag);
  const isDiscrepancy = Boolean(apkVersion && activeVersion && !activeVersion.includes(apkVersion));
  const isStaleOtaCache = Boolean(apkVersion && isOtaActive && apkVersion > (otaTag || ""));

  return {
    isDiscrepancy,
    apkVersion,
    webVersion: activeVersion,
    isOtaActive,
    isStaleOtaCache,
  };
}
```

#### 2. ADB Terminal Diagnostic Commands

To inspect the exact state from your terminal:

```bash
# 1. Query installed native APK version from Android PackageManager
adb shell dumpsys package com.ytviewer.app | grep -E "versionName|versionCode"

# 2. Check if an OTA update bundle is currently stored in internal storage
adb shell "run-as com.ytviewer.app ls -la files/app_updates 2>/dev/null || echo 'No active OTA directory'"

# 3. Check localStorage active release tag via Chrome WebView remote debugging or logcat
adb logcat -d | grep -E "YT_CAPTION_INTERCEPTOR|AndroidNativeShell|ACTIVE_APP_VERSION"
```

---

### 5.3 Architectural Solutions & Automated Native Safeguards

The repository implements four core engineering mechanisms to prevent and automatically recover from version discrepancies:

#### 1. Automatic OTA Cache Invalidation on Native Upgrade (`clearOtaCacheOnApkUpgrade`)

In `MainActivity.kt`, whenever the application boots, it inspects whether the native APK has been upgraded by checking SharedPreferences:

```kotlin
// In MainActivity.kt onCreate():
val prefs = getSharedPreferences("app_version_tracking", Context.MODE_PRIVATE)
val lastRunVersionCode = prefs.getLong("last_run_version_code", -1L)
val currentVersionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
    packageManager.getPackageInfo(packageName, 0).longVersionCode
} else {
    @Suppress("DEPRECATION")
    packageManager.getPackageInfo(packageName, 0).versionCode.toLong()
}

if (currentVersionCode > lastRunVersionCode) {
    Log.i(TAG, "Native APK upgraded ($lastRunVersionCode -> $currentVersionCode). Invalidating stale OTA cache.")
    // Purge downloaded OTA updates so newly bundled assets take precedence
    val otaDir = File(filesDir, "app_updates")
    if (otaDir.exists()) {
        otaDir.deleteRecursively()
    }
    // Record new version code
    prefs.edit().putLong("last_run_version_code", currentVersionCode).apply()
}
```

**Why this matters**: This guarantees that when a user installs a new APK, any previously downloaded OTA files from an older version are instantly deleted, allowing the newly bundled assets in the APK to load cleanly.

#### 2. Zero-Cache Headers for Local WebView Asset Loading

In `MainActivity.kt` within `shouldInterceptRequest`, responses served from `LOCAL_ASSET_DOMAIN` (`appassets.androidplatform.net`) include cache-busting headers:

```kotlin
val headers = mapOf(
    "Access-Control-Allow-Origin" to "*",
    "Access-Control-Allow-Methods" to "GET, OPTIONS",
    "Cache-Control" to "no-cache, no-store, must-revalidate",
    "Pragma" to "no-cache",
    "Expires" to "0"
)
```

This prevents Android's internal Chromium WebView HTTP cache from persisting obsolete `.js` or `.css` chunks across app restarts.

#### 3. Dual-Version Reporting in UI

When the native APK container version differs from the active web bundle version, the UI avoids presenting a misleading single number:

- **When OTA is newer**: Displays `Web v1.0.18 (OTA) • Shell v1.0.16`.
- **When APK is newer (Stale OTA)**: Displays a notification banner: _"Newer APK assets detected (v1.0.17). Tap here to clear OTA cache and reload."_

#### 4. Build Pipeline Asset Synchronization Mandate

To prevent building an APK with stale assets, scripts and CI workflows must execute in strict sequence:

```bash
# Standard build pipeline (scripts/build-android-assets.sh):
# Step 1: Compile web application
npm run build

# Step 2: Clear and copy fresh web bundle to Android assets
rm -rf android-shell/app/src/main/assets/dist
mkdir -p android-shell/app/src/main/assets/dist
cp -r dist/* android-shell/app/src/main/assets/dist/
cp -r dist/* android-shell/app/src/main/assets/

# Step 3: Compile Android APK with Gradle
cd android-shell && ./gradlew assembleDebug
```

---

### 5.4 Step-by-Step Recovery Procedures

#### Procedure A: User In-App Recovery (Zero Reinstall)

If a user notices UI features not matching the installed APK version:

1. Open the app and navigate to **Settings** (gear icon) or tap the version footer.
2. Under **Updates & Version Info**, tap **"Clear OTA Cache & Reload"**.
3. The app clears `active_release_artifact_tag`, deletes any local downloaded bundle, and immediately reloads `https://appassets.androidplatform.net/index.html` using the APK's pristine bundled assets.

#### Procedure B: Developer ADB One-Line Clean

For developers testing builds on emulators or USB-connected devices:

```bash
# Wipes local WebView storage, databases, and cached OTA bundles without uninstalling the APK
adb shell pm clear com.ytviewer.app

# Relaunches the application with freshly bundled assets
adb shell am start -n com.ytviewer.app/.MainActivity
```

#### Procedure C: Complete Clean Rebuild & Reinstall

If web assets were out of sync during local development:

```bash
# 1. Clean and rebuild web assets
npm run build

# 2. Copy assets into Android shell
mkdir -p android-shell/app/src/main/assets
cp -r dist/* android-shell/app/src/main/assets/

# 3. Clean Gradle build and assemble
cd android-shell
./gradlew clean assembleDebug
cd ..

# 4. Install fresh APK with replace and downgrade flags
bash update.apk.sh
```
