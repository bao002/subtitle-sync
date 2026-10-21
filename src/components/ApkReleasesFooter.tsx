import React from "react";
import { Smartphone, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  APP_VERSION,
  APP_COMMIT_ID,
  APP_VERSION_DESCRIPTION,
  ALL_RELEASES_URL,
} from "@/config/appConfig";

export interface ApkReleaseLink {
  owner: string;
  downloadUrl: string;
  releaseUrl: string;
}

export interface ApkReleasesFooterProps {
  apkReleaseLinks: ApkReleaseLink[];
  onOpenApkModal: () => void;
}

export function ApkReleasesFooter({ apkReleaseLinks, onOpenApkModal }: ApkReleasesFooterProps) {
  return (
    <footer
      id="apk-releases-footer"
      data-testid="apk-releases-footer"
      className="mt-8 border-t border-border px-6 py-4 bg-muted/20 text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Smartphone className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="font-semibold text-foreground">Latest Android APK Releases:</span>
          <span
            data-testid="footer-version-info"
            title={APP_VERSION_DESCRIPTION}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground bg-background px-2 py-0.5 rounded border border-border"
          >
            <span className="font-semibold text-foreground">v{APP_VERSION}</span>
            <span>·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              #{APP_COMMIT_ID}
            </span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {apkReleaseLinks.map((link) => (
            <div
              key={link.owner}
              data-testid={`apk-footer-link-group-${link.owner}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 shadow-sm"
            >
              <span className="font-mono font-bold text-foreground">{link.owner}</span>
              <span className="text-muted-foreground">·</span>
              <a
                href={link.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`apk-footer-download-${link.owner}`}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                title={`Direct APK download from ${link.owner}`}
              >
                <Download className="h-3 w-3" />
                <span>APK</span>
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                href={link.releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`apk-footer-release-${link.owner}`}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                title={`Latest GitHub release page for ${link.owner}`}
              >
                <ExternalLink className="h-3 w-3" />
                <span>Release</span>
              </a>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenApkModal}
            className="text-xs h-8 px-2.5 gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
            <span>All Options & CLI</span>
          </Button>
          <a
            href={ALL_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="footer-all-releases-link"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-1 py-1"
            title="Browse All GitHub Releases & Versions"
          >
            <span>All Releases (v{APP_VERSION})</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
