# Current Subtask

## Subtask 62.2: Build and verify Android app launch and native subtitle flow

Diagnose the Android build and launch path, then fix anything preventing the native app from building, loading its bundled web interface, or using the native subtitle bridge.

### Done looks like

- The Android debug APK builds with current web assets bundled.
- The launch page and native subtitle bridge have dedicated regression checks.
- Android emulator/device E2E passes when a usable SDK and device are available; otherwise the exact limitation is recorded.
- Focused lint and web build pass, and the changes are committed before validation.
