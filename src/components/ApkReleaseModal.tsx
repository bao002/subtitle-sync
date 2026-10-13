import React, { useState } from "react";
import {
  Smartphone,
  Download,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  X,
  Package,
  Sparkles,
} from "lucide-react";
import {
  CURRENT_APK_VERSION,
  getActiveAppVersion,
  getApkReleaseLinks,
  checkVersionDiscrepancy,
  clearOtaCacheAndReload,
  type ApkReleaseLink,
} from "../utils/apkUpdater";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ApkReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkReleaseModal: React.FC<ApkReleaseModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const activeVersion = getActiveAppVersion();
  const releaseLinks: ApkReleaseLink[] = getApkReleaseLinks();
  const versionComparison = checkVersionDiscrepancy();

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (_e) {
      // Ignore clipboard write error
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="apk-release-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6 text-foreground animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <h2 id="apk-release-title" className="text-xl font-bold font-display tracking-tight">
                Latest Android APK Releases
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>Version:</span>
                <span className="font-mono font-semibold text-foreground">
                  {activeVersion || CURRENT_APK_VERSION}
                </span>
                <span>·</span>
                <a
                  href="https://github.com/mostuf2556/subtitle-sync/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="modal-all-releases-link"
                  className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  title="Browse All Releases on GitHub"
                >
                  <span>All Releases</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dual-Version & Architecture Status Card */}
        <div
          data-testid="version-architecture-card"
          className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2.5 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Installed Container Shell:</span>
              <span
                data-testid="installed-shell-version"
                className="font-mono px-2 py-0.5 rounded bg-background border border-border font-medium text-foreground"
              >
                {versionComparison.apkVersion || "Browser Mode (Non-native)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Active Web SPA Bundle:</span>
              <span
                data-testid="active-web-version"
                className="font-mono px-2 py-0.5 rounded bg-background border border-border font-medium text-foreground"
              >
                {versionComparison.webVersion}
              </span>
              {versionComparison.isOtaActive && (
                <span
                  data-testid="ota-active-badge"
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                >
                  OTA Hotfix Active
                </span>
              )}
            </div>
          </div>

          {/* Version Discrepancy Warning & In-App Resolution */}
          {versionComparison.isDiscrepancy && (
            <div
              data-testid="version-discrepancy-banner"
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Version Discrepancy Detected</p>
                  <p className="text-[11px] opacity-90">
                    {versionComparison.isStaleOtaCache || versionComparison.isApkAhead
                      ? "A newer native APK was installed, but older cached OTA web assets are active."
                      : "The web application bundle version differs from the host Android shell."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-testid="clear-ota-cache-btn"
                onClick={() => clearOtaCacheAndReload()}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-sm transition active:scale-[0.98]"
                title="Wipe stale OTA cache and reload freshly bundled APK assets"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset to Bundled Assets</span>
              </button>
            </div>
          )}
        </div>

        {/* Description Banner */}
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
          <Sparkles className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-950 dark:text-emerald-100">
              Direct APK & Web Artifact Downloads
            </p>
            <p className="opacity-90">
              Download the official Android native APK (
              <code className="font-mono text-[11px]">YouTube-Viewer-debug.apk</code>) or the
              instant OTA release bundle (
              <code className="font-mono text-[11px]">web-dist.zip</code>) from either repository
              owner below.
            </p>
          </div>
        </div>

        {/* Release Links by Repo Owner */}
        <div className="grid gap-4 sm:grid-cols-2">
          {releaseLinks.map((link, idx) => (
            <div
              key={link.owner}
              data-testid={`apk-release-card-${link.owner}`}
              className="flex flex-col justify-between rounded-xl border border-border bg-muted/40 p-4 space-y-4 hover:border-emerald-500/50 transition shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-500" />
                    <span className="font-semibold text-sm">
                      Owner: <span className="font-mono text-primary font-bold">{link.owner}</span>
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono px-2 py-0.5 font-semibold">
                    {link.owner === "mostuf2556" ? "Primary" : "Secondary"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                  {link.repo}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <a
                  href={link.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`apk-download-link-${link.owner}`}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-[0.98]"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Latest APK</span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={link.releaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`apk-release-page-${link.owner}`}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-medium transition text-center"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View Release</span>
                  </a>
                  <a
                    href={link.otaBundleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`apk-web-bundle-${link.owner}`}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-medium transition text-center"
                    title="Download instant web bundle hot update"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-500" />
                    <span>web-dist.zip</span>
                  </a>
                </div>
              </div>

              {/* CLI Command */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <Terminal className="h-3 w-3" /> One-line CLI install
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(link.cliInstallCommand, idx)}
                    className="flex items-center gap-1 text-[10px] text-primary hover:underline font-mono"
                    title="Copy command"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[10px] font-mono bg-black/80 text-emerald-400 p-2 rounded border border-border overflow-x-auto whitespace-pre">
                  {link.cliInstallCommand}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <span>Both repositories build and release synchronized APK artifacts.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
