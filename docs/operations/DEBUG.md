# Diagnostic Debugger & Logging Architecture (`DEBUG.md`)

This document specifies the internal diagnostics logging system, ring buffer management, network request inspection, response body previews, and the AI troubleshooting prompt generator.

---

## 1. Objectives & Scope

To allow comprehensive debugging and telemetry analysis on both browser and Android native host environments without exposing sensitive network tokens, the application incorporates an in-memory diagnostic logging pipeline:

- **Ring Buffer Storage**: Bounded FIFO storage preventing memory leaks.
- **Network Interception Logging**: Captures outgoing/incoming HTTP/HTTPS traffic.
- **15-Character Response Preview**: Sanitized body preview to quickly confirm data formats (e.g. `{"wireMagic":"pb...`).
- **AI Troubleshooting Prompt Generator**: One-click generation of formatted markdown problem reports tailored for AI coding assistants.

---

## 2. In-Memory Ring Buffer (`src/utils/logBuffer.ts`)

### 2.1 Specification

- **Capacity**: Fixed maximum entries (default: 250 records).
- **Log Entry Structure**:
  ```ts
  export interface DiagnosticLogEntry {
    id: string;
    timestamp: number;
    level: "info" | "warn" | "error" | "debug";
    tag: string;
    message: string;
    metadata?: Record<string, unknown>;
  }
  ```
- **Overflow Handling**: When capacity is exceeded, the oldest entry is evicted (`shift()`), preserving the most recent telemetry.

---

## 3. Network Request Inspection & Response Preview

### 3.1 Network Event Captures

When the application dispatches subtitle requests (`/api/fetch-subtitles`, `/api/youtube-timedtext-translate`) or intercepts native WebView requests:

1. Records URL path, method, and query parameters.
2. Sanitizes headers (stripping cookies and auth tokens).
3. Reads the first 200 characters of the response body for instant signature verification:
   - YouTube JSON3 signature: `{"wireMagic":"pb`

### 3.2 Security & Performance Constraints

- Response bodies are truncated to prevent large payloads from inflating memory footprint.
- Previews are sanitized to strip PII and authentication credentials before storing in the ring buffer.

---

## 4. AI Troubleshooting Prompt Generator

### 4.1 Purpose

When a user encounters a playback desynchronization, missing voice, or network failure, the diagnostic panel provides an **"Export AI Diagnostic Prompt"** action.

### 4.2 Generated Prompt Format

```markdown
### Automated Diagnostic Report

- **App Version**: vX.Y.Z
- **Host**: Web Companion / Android Native Shell
- **Active Video ID**: <ID>
- **Selected Languages**: Source: <lang>, Target: <lang>
- **Playback Metrics**: Time: <seconds>, State: <playing/paused>
- **Recent Telemetry (Last 10 Events)**:
  [LOG] <timestamp> - <tag>: <message>
- **Network Request Preview**:
  - Request: <URL>
  - Status: 200 OK
  - Body Preview: "{"wireMagic":"pb..."
```

This structured markdown block is copied to the clipboard with one click, ready for immediate triage by the AI assistant.

---

## 5. Automated CI/CD Error Reporting & AI Reproduction Fix Generator

### 5.1 Overview
In addition to client-side diagnostics, the project features an automated CI/CD error reporting engine (`scripts/generate-error-report.ts`) integrated into `.github/workflows/error-reporting.yml`.

### 5.2 Purpose of `error.log`
Whenever an automated test, build compilation, or lint verification step fails in CI:
1. The error reporter captures the exact failing command, exit code, stdout, and stderr.
2. It extracts suspect files, error category (e.g. `LINT`, `TYPECHECK`, `TEST_ASSERTION`, `BUILD`), and generates actionable reproduction steps.
3. It emits `error.log` which includes a standardized **AI Prompt** block.
4. The output is displayed in the GitHub Actions log, published to the GitHub Job Summary (`$GITHUB_STEP_SUMMARY`), and uploaded as an artifact (`actions/upload-artifact@v4`) for download and direct copy-pasting into the AI prompt to repair the application.

### 5.3 Local Usage
Developers and agents can invoke the reporter directly:
```bash
# Wrap a test command and auto-generate error.log on failure:
npx tsx scripts/generate-error-report.ts --run "npm run test:xyz"

# Or use the npm script:
npm run report:error -- --run "npm run build"
```
