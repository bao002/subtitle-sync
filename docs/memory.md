# Memory & State Persistence Specification (`docs/memory.md`)

This document defines the application state memory model, persistence defaults, and local storage rules for UI controls, debug utilities, version details, and quick loaders.

---

## 1. Schema & Conventions

Every stateful toggle in the application adheres to the following boolean contract:

```typescript
interface StatefulBooleanSetting {
  id: string;
  storageKey: string;
  defaults: boolean; // In-memory fallback default
  localstorage: boolean; // Default evaluated value when localStorage entry is absent
  presentOnStart: "off" | "on"; // Initial presentation state at application startup
  toggleControlId: string;
  targetElementId: string;
}
```

---

## 2. Boolean Settings & Defaults Matrix

| Setting Feature | Storage Key | Defaults | Local Storage | Present on Start | Toggle Button ID | Target Element ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Debug Button & Mode** | `yt_debug_mode` / `yt_debug_mode_enabled` | `false` | `false` (off) | `off` | `header-debug-mode-toggle` | Experimental tabs, action logs, network inspector |
| **Version Details Parent** | `yt_show_version_details` | `false` | `false` (off) | `off` | `version-button` / `header-version-button` | `apk-releases-footer` / `version-details-container` |
| **Quick Loader** | `yt_show_quick_loader` | `false` | `false` (off) | `off` | `quick-loader-button` / `header-quick-loader-button` | `quick-subtitles-and-video-loader` |
| **Video Item (Player Accordion)** | In-memory (`openPanels.player`) | `false` (folded) | `false` (off) | `off` | `player` accordion header | `player` / Video player container |
| **Other Settings Accordions** | In-memory / session | `false` | `false` (off) | `off` | `header-stage4-settings-button` | Stage 4 secondary accordions |

---

## 3. Detailed Specifications

### 3.1 Debug Button & Mode (`present-on-start: off`, `local storage: off`)
- **Default behavior**: At application startup, Debug Mode is OFF (`false`).
- **Storage retrieval**: When `localStorage.getItem("yt_debug_mode")` returns `null` (unset), the returned value is `false` (`off`).
- **Presentation**: Top-menu debug toggle (`#header-debug-mode-toggle`) renders with `Debug OFF` style. Experimental views (Playground, AI Punctuation, Action logs, Network inspector) remain hidden until explicitly turned on by the user or through `?debug=true`.

### 3.2 Version Details Element (`present-on-start: off`, `local storage: off`)
- **Clean view design**: The application view is kept clean and uncluttered by hiding the extensive version details and APK releases parent element (`#apk-releases-footer`) by default.
- **Toggle button**: The user toggles visibility using the "Version" button (`id="version-button"`, `data-testid="version-button"`) located in the header and near the bottom controls.
- **Default state**: Both in-memory default and localStorage fallback are `false` (`off`), ensuring clean startup presentation across both Beginner and Advanced modes.

### 3.3 Quick Subtitles & Video Loader (`id="quick-subtitles-and-video-loader"`)
- **Clean view design**: The quick loader element (`#quick-subtitles-and-video-loader`) is hidden by default (`present-on-start: off`).
- **Toggle button**: A dedicated "quick-loader" button (`id="quick-loader-button"`, `data-testid="quick-loader-button"`) is provided in the page and action bar to toggle the quick loader into view on demand.

### 3.4 Raw Video Data Caption Status (`top-screen-video-caption-status`)
- **Clean view removal**: The raw video data element (`<span data-testid="top-screen-video-caption-status">`) showing internal video ID, raw section counts, and debug caption labels in the header has been removed to keep the header view clean and focused on user-facing title and metadata.

### 3.5 Video Item Accordion (Folded by default, `local storage: off`)
- **Default behavior**: At application startup, the Video Player accordion (`details#player` / `openPanels.player`) is folded (`open: false`) by default to save vertical viewport space and present a clean overview.
- **Persistence contract**: `defaults: false`, `localstorage: off` (in-memory state, not persisted to localStorage).
- **User interaction**: Users unfold/expand the video player accordion on demand by clicking its header summary button.
