import React, { useState } from "react";
import {
  Activity,
  Copy,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  useExternalTtsAuditRecords,
  clearExternalTtsAuditRecords,
  LOVABLE_TTS_DOCS_URL,
  type ExternalTtsAuditRecord,
} from "@/lib/alternative-tts";

interface Props {
  className?: string;
  defaultExpanded?: boolean;
}

export const ExternalTtsDebuggerPanel: React.FC<Props> = ({
  className = "",
  defaultExpanded = true,
}) => {
  const records = useExternalTtsAuditRecords();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<"request" | "response" | "curl" | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const activeRecord: ExternalTtsAuditRecord | null =
    (selectedRecordId ? records.find((r) => r.id === selectedRecordId) : records[0]) || null;

  const buildCurlCommand = (rec: ExternalTtsAuditRecord): string => {
    const headersList = Object.entries(rec.requestHeaders)
      .map(([k, v]) => `  -H '${k}: ${v}'`)
      .join(" \\\n");
    if (rec.method === "POST" && rec.requestBody) {
      return `curl --url '${rec.url}' \\\n${headersList} \\\n  --data-raw '${JSON.stringify(rec.requestBody)}'`;
    }
    return `curl --url '${rec.url}' \\\n${headersList}`;
  };

  const handleCopy = (type: "request" | "response" | "curl") => {
    if (!activeRecord) return;
    let content = "";
    if (type === "curl") {
      content = buildCurlCommand(activeRecord);
    } else if (type === "request") {
      const curl = buildCurlCommand(activeRecord);
      content = JSON.stringify(
        {
          timestamp: new Date(activeRecord.timestamp).toISOString(),
          method: activeRecord.method,
          url: activeRecord.url,
          endpoint: activeRecord.endpoint,
          queryParams: activeRecord.queryParams,
          headers: activeRecord.requestHeaders,
          body: activeRecord.requestBody,
          provider: activeRecord.provider,
          voice: activeRecord.voice,
          lang: activeRecord.lang,
          text: activeRecord.text,
          speed: activeRecord.speed,
          curlEquivalent: curl,
        },
        null,
        2,
      );
    } else {
      content = JSON.stringify(
        {
          timestamp: new Date(activeRecord.timestamp).toISOString(),
          status: activeRecord.status,
          statusText: activeRecord.statusText,
          latencyMs: activeRecord.latencyMs,
          headers: activeRecord.responseHeaders,
          responseType: activeRecord.responseType,
          audioMime: activeRecord.audioMime,
          audioSizeBytes: activeRecord.audioSizeBytes,
          error: activeRecord.error,
          diagnosticAdvice: activeRecord.diagnosticAdvice,
          body: activeRecord.responseBody,
        },
        null,
        2,
      );
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(content);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  return (
    <div
      data-testid="external-tts-debugger-panel"
      className={`rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden text-xs ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-muted/60 border-b border-border select-none">
        <div
          className="flex items-center gap-2 cursor-pointer flex-1 min-w-[200px]"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Activity className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground tracking-tight">
            External TTS Debugger (Request & Response Inspector)
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium">
            {records.length} {records.length === 1 ? "call" : "calls"}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground ml-auto sm:ml-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto sm:ml-0" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={LOVABLE_TTS_DOCS_URL}
            target="_blank"
            rel="noreferrer"
            data-testid="external-tts-docs-link"
            className="text-[11px] text-primary hover:underline font-mono inline-flex items-center gap-1"
            title="Read Speak API OpenAPI and service documentation"
          >
            Docs ↗
          </a>

          {records.length > 0 && (
            <button
              type="button"
              data-testid="clear-external-tts-audit-btn"
              onClick={clearExternalTtsAuditRecords}
              className="px-2 py-0.5 rounded border border-border bg-background hover:bg-muted text-[11px] text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1 cursor-pointer"
              title="Clear debugger history"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground space-y-1 font-mono text-[11px]">
              <p>No external TTS calls captured yet.</p>
              <p className="text-[10px] text-muted-foreground/80">
                Trigger speech with &quot;▶ Test Audio&quot;, &quot;Validate TTS3 Service&quot;, or video playback.
              </p>
            </div>
          ) : (
            <>
              {/* History Record Selector Bar */}
              {records.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                    History:
                  </span>
                  {records.slice(0, 8).map((rec, idx) => {
                    const isSelected = activeRecord?.id === rec.id;
                    const isSuccess = rec.status >= 200 && rec.status < 300;
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => setSelectedRecordId(rec.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : isSuccess
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
                        }`}
                      >
                        {idx === 0 ? "Latest" : `#${records.length - idx}`} ({rec.status || "Err"}) -{" "}
                        {rec.provider || "google"}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Active Record Detail Card */}
              {activeRecord && (
                <div className="space-y-3" data-testid="external-tts-audit-record">
                  {/* Top Status & Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-md bg-muted/40 border border-border/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        data-testid="external-tts-status-badge"
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold inline-flex items-center gap-1 ${
                          activeRecord.status >= 200 && activeRecord.status < 300
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-destructive/20 text-destructive border border-destructive/30"
                        }`}
                      >
                        {activeRecord.status >= 200 && activeRecord.status < 300 ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        <span>
                          {activeRecord.status} {activeRecord.statusText}
                        </span>
                      </span>

                      <span className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activeRecord.latencyMs}ms
                      </span>

                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] font-medium">
                        provider: {activeRecord.provider || "google"}
                      </span>

                      <span
                        data-testid="external-tts-anonymity-badge"
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-medium ${
                          activeRecord.isAnonymous
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {activeRecord.isAnonymous ? "Anonymous" : "Regular"}
                      </span>

                      {activeRecord.voice && (
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">
                          voice: {activeRecord.voice}
                        </span>
                      )}

                      <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">
                        lang: {activeRecord.lang}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        data-testid="btn-copy-external-tts-curl"
                        onClick={() => handleCopy("curl")}
                        className="px-2 py-1 rounded border border-border bg-background hover:bg-muted text-[11px] font-mono inline-flex items-center gap-1 text-foreground cursor-pointer shadow-xs"
                        title="Copy exact executable cURL terminal command"
                      >
                        {copiedType === "curl" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span>Copied cURL!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>cURL</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        data-testid="copy-external-tts-record-btn"
                        onClick={() => handleCopy("request")}
                        className="px-2 py-1 rounded border border-border bg-background hover:bg-muted text-[11px] font-mono inline-flex items-center gap-1 text-foreground cursor-pointer shadow-xs"
                        title="Copy full HTTP request, headers, query, and payload as formatted JSON / cURL"
                      >
                        {copiedType === "request" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span>Copied Req!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Req</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        data-testid="btn-copy-external-tts-response"
                        onClick={() => handleCopy("response")}
                        className="px-2 py-1 rounded border border-border bg-background hover:bg-muted text-[11px] font-mono inline-flex items-center gap-1 text-foreground cursor-pointer shadow-xs"
                        title="Copy full HTTP response, status, headers, and body"
                      >
                        {copiedType === "response" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span>Copied Res!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Res</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Diagnostic Advice Banner */}
                  {activeRecord.diagnosticAdvice && (
                    <div
                      data-testid="external-tts-diagnostic-advice"
                      className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-[11px] space-y-1 font-sans"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>Diagnostic Advice:</span>
                      </div>
                      <p className="leading-relaxed">{activeRecord.diagnosticAdvice}</p>
                    </div>
                  )}

                  {/* Side-by-side or stacked Request vs Response grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* 1. Request Details Section */}
                    <div
                      data-testid="external-tts-request-details"
                      className="p-3 rounded-md bg-muted/20 border border-border/80 space-y-2.5 font-mono text-[11px]"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-1.5">
                        <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
                          1. Full HTTP Request
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold text-[10px]">
                          {activeRecord.method}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[10px]">Endpoint URL:</span>
                        <div className="p-1.5 rounded bg-background border border-border/60 break-all select-all font-mono text-[10.5px]">
                          {activeRecord.url}
                        </div>
                      </div>

                      {activeRecord.queryParams && Object.keys(activeRecord.queryParams).length > 0 && (
                        <div>
                          <span className="text-muted-foreground block text-[10px] mb-1">
                            Query Parameters:
                          </span>
                          <div className="p-1.5 rounded bg-background border border-border/60 space-y-0.5 text-[10.5px]">
                            {Object.entries(activeRecord.queryParams).map(([k, v]) => (
                              <div key={k} className="flex items-baseline gap-1 break-all">
                                <span className="text-primary font-medium">{k}:</span>
                                <span className="text-foreground">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="text-muted-foreground block text-[10px] mb-1">
                          Request Headers:
                        </span>
                        <div className="p-1.5 rounded bg-background border border-border/60 space-y-0.5 text-[10.5px]">
                          {Object.keys(activeRecord.requestHeaders).length > 0 ? (
                            Object.entries(activeRecord.requestHeaders).map(([k, v]) => {
                              const isAuth = k.toLowerCase() === "authorization";
                              const isKey = k.toLowerCase().includes("key");
                              const isSpk = v.toLowerCase().includes("spk_");
                              return (
                                <div key={k} className="flex items-baseline gap-1 break-all">
                                  <span className="text-muted-foreground">{k}:</span>
                                  <span className="text-foreground">
                                    {isAuth && isSpk
                                      ? "Bearer spk_••••••••"
                                      : isAuth || isKey
                                        ? "••••••••"
                                        : v}
                                  </span>
                                  {isAuth && isSpk && (
                                    <span className="text-[9.5px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-sans">
                                      Speak API Personal Token
                                    </span>
                                  )}
                                  {isKey && (
                                    <span className="text-[9.5px] px-1 py-0.2 rounded bg-primary/10 text-primary font-sans">
                                      Provider Key
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-muted-foreground/60 italic">Standard browser headers</span>
                          )}
                        </div>
                      </div>

                      {activeRecord.method === "POST" && Boolean(activeRecord.requestBody) && (
                        <div>
                          <span className="text-muted-foreground block text-[10px] mb-1">
                            Request Body (application/json):
                          </span>
                          <pre className="p-2 rounded bg-background border border-border/60 overflow-x-auto text-[10.5px] leading-relaxed max-h-48">
                            {JSON.stringify(activeRecord.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* 2. Response Details Section */}
                    <div
                      data-testid="external-tts-response-details"
                      className="p-3 rounded-md bg-muted/20 border border-border/80 space-y-2.5 font-mono text-[11px]"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-1.5">
                        <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
                          2. Full HTTP Response
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                            activeRecord.status >= 200 && activeRecord.status < 300
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {activeRecord.status} {activeRecord.statusText}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[10px] mb-1">
                          Response Headers (from Speak API / Provider):
                        </span>
                        <div className="p-1.5 rounded bg-background border border-border/60 space-y-0.5 text-[10.5px] max-h-36 overflow-y-auto">
                          {Object.keys(activeRecord.responseHeaders).length > 0 ? (
                            Object.entries(activeRecord.responseHeaders).map(([k, v]) => (
                              <div key={k} className="flex items-baseline gap-1 break-all">
                                <span className="text-primary font-medium">{k}:</span>
                                <span className="text-foreground">{v}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground/60 italic">No headers recorded</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[10px] mb-1">
                          Response Body & Payload:
                        </span>
                        {activeRecord.error ? (
                          <div className="p-2 rounded bg-destructive/10 border border-destructive/30 text-destructive break-all text-[10.5px]">
                            {activeRecord.error}
                          </div>
                        ) : activeRecord.responseType === "json" && activeRecord.responseBody ? (
                          <div className="space-y-1.5">
                            <pre className="p-2 rounded bg-background border border-border/60 overflow-x-auto text-[10.5px] leading-relaxed max-h-48">
                              {JSON.stringify(
                                typeof activeRecord.responseBody === "object"
                                  ? {
                                      ...((activeRecord.responseBody as Record<string, unknown>) || {}),
                                      audio: (activeRecord.responseBody as { audio?: string })?.audio
                                        ? `[Base64 audio string: ${((activeRecord.responseBody as { audio?: string }).audio || "").length} characters, ~${activeRecord.audioSizeBytes || 0} bytes]`
                                        : undefined,
                                    }
                                  : activeRecord.responseBody,
                                null,
                                2,
                              )}
                            </pre>
                          </div>
                        ) : (
                          <div className="p-2 rounded bg-background border border-border/60 space-y-2 text-[10.5px]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Volume2 className="h-4 w-4 text-primary shrink-0" />
                              <span className="font-semibold text-foreground">
                                {activeRecord.audioMime || "audio/mpeg"}
                              </span>
                              {activeRecord.audioSizeBytes !== undefined && (
                                <span className="text-muted-foreground">
                                  ({(activeRecord.audioSizeBytes / 1024).toFixed(1)} KB)
                                </span>
                              )}
                            </div>
                            {activeRecord.audioUrl && (
                              <audio
                                src={activeRecord.audioUrl}
                                controls
                                className="w-full h-7 mt-1"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
