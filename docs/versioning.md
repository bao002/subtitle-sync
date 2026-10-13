# Android Application Versioning & Update Architecture (`docs/versioning.md`)

This document explains the versioning architecture of YouTube Viewer (`com.ytviewer.app`), how users update the application, why update errors such as *"same package already installed"* or `INSTALL_FAILED_UPDATE_INCOMPATIBLE` occur, and the automated recovery flows implemented in the codebase.

---

## 1. Versioning Architecture: `versionName` vs `versionCode`

Android enforces a dual-identifier versioning system in `AndroidManifest.xml` and Gradle:

| Identifier | Type | Format / Example | Purpose |
| :--- | :--- | :--- | :--- |
| **`versionName`** | String | `"1.0.16"` or `"1.0.16.42"` | Displayed to end users in the UI, Settings, and release notes. |
| **`versionCode`** | Integer | `42` or `10016` | Strictly monotonic integer examined by the Android Package Manager (`PackageManager`) to determine upgrade eligibility. |

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
- **User UI Symptom**: *"App not installed as package conflicts with an existing package"* or *"App not installed as package appears to be corrupt"*.

### Root Cause 2: Version Code Downgrade or Equality (`INSTALL_FAILED_VERSION_DOWNGRADE`)
- **What happens**: The newly built APK has a `versionCode` that is lower than or equal to the currently installed APK's `versionCode`.
- **Android's Rule**: By default, Android Package Manager blocks installing an older version over a newer version unless the `-d` (allow downgrade) flag is explicitly passed via ADB.
- **System Error**: `INSTALL_FAILED_VERSION_DOWNGRADE`.
- **User UI Symptom**: Android's GUI package installer silently fails or states *"App not installed"*.

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
