# Current Subtask

## Subtask 62.2: Build and verify Android app launch and native subtitle flow

Diagnose the Android build and launch path, then fix anything preventing the native app from building, loading its bundled web interface, or using the native subtitle bridge.

### Done looks like

- The Android debug APK builds with current web assets bundled.
- The launch page and native subtitle bridge have dedicated regression checks.
- Local Android emulator E2E is blocked: sdkmanager could not unpack the API 34 Google APIs x86_64 system image because the workspace disk quota was exceeded. The debug APK build itself passes.
- Focused lint and web build pass, and the changes are committed before validation.
