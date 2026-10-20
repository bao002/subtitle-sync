import { type Row, fmt } from "@/lib/subtitles";

/**
 * Detailed representation of a subtitle record change between two parser configurations.
 */
export interface ChangedRecordItem {
  index: number;
  start: number;
  end: number;
  formattedTime: string;
  text: string;
  textsByLang: Record<string, string>;
}

export type ParserChangeType = "split" | "merged" | "timing" | "content" | "added" | "removed" | "modified";

export interface ChangedRecordDiff {
  id: string;
  changeIndex: number;
  changeType: ParserChangeType;
  description: string;
  timeRange: {
    start: number;
    end: number;
    formatted: string;
  };
  beforeRecords: ChangedRecordItem[];
  afterRecords: ChangedRecordItem[];
  beforeTextSummary: string;
  afterTextSummary: string;
}

export interface ParserDiffResult {
  hasChanges: boolean;
  totalBefore: number;
  totalAfter: number;
  totalChanges: number;
  changedRecords: ChangedRecordDiff[];
  summaryMessage: string;
}

function rowToItem(row: Row, index: number, baseLang: string): ChangedRecordItem {
  const text = (baseLang && row.texts[baseLang]) || Object.values(row.texts)[0] || "";
  return {
    index,
    start: row.start,
    end: row.end,
    formattedTime: `${fmt(row.start)}–${fmt(row.end)}`,
    text,
    textsByLang: { ...row.texts },
  };
}

function areRowsEqual(a: Row, b: Row): boolean {
  if (Math.abs(a.start - b.start) > 50 || Math.abs(a.end - b.end) > 50) {
    return false;
  }
  const keysA = Object.keys(a.texts);
  const keysB = Object.keys(b.texts);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a.texts[k]?.trim() !== b.texts[k]?.trim()) {
      return false;
    }
  }
  return true;
}

/**
 * Computes difference between current subtitle rows and proposed subtitle rows.
 * Highlights changed records, time shifts, sentence splitting, and merges.
 */
export function computeParserDiff(
  currentRows: Row[],
  proposedRows: Row[],
  baseLanguage = "en",
): ParserDiffResult {
  const totalBefore = currentRows.length;
  const totalAfter = proposedRows.length;

  if (totalBefore === 0 && totalAfter === 0) {
    return {
      hasChanges: false,
      totalBefore: 0,
      totalAfter: 0,
      totalChanges: 0,
      changedRecords: [],
      summaryMessage: "No subtitle records available to compare.",
    };
  }

  const changedRecords: ChangedRecordDiff[] = [];
  let i = 0;
  let j = 0;
  let changeCount = 0;

  while (i < totalBefore || j < totalAfter) {
    const cur = currentRows[i];
    const prop = proposedRows[j];

    // Both exist and are identical -> skip
    if (cur && prop && areRowsEqual(cur, prop)) {
      i++;
      j++;
      continue;
    }

    // Determine divergence window
    const beforeCluster: ChangedRecordItem[] = [];
    const afterCluster: ChangedRecordItem[] = [];

    const windowStart = Math.min(
      cur ? cur.start : Infinity,
      prop ? prop.start : Infinity,
    );

    // Collect records that overlap or fall within the diverging segment
    let windowEnd = Math.max(
      cur ? cur.end : -Infinity,
      prop ? prop.end : -Infinity,
    );

    if (cur) {
      beforeCluster.push(rowToItem(cur, i, baseLanguage));
      i++;
    }
    if (prop) {
      afterCluster.push(rowToItem(prop, j, baseLanguage));
      j++;
    }

    // Expand cluster if downstream records overlap with this time window
    while (
      (i < totalBefore && currentRows[i]!.start < windowEnd + 100) ||
      (j < totalAfter && proposedRows[j]!.start < windowEnd + 100)
    ) {
      if (i < totalBefore && currentRows[i]!.start < windowEnd + 100) {
        windowEnd = Math.max(windowEnd, currentRows[i]!.end);
        beforeCluster.push(rowToItem(currentRows[i]!, i, baseLanguage));
        i++;
      }
      if (j < totalAfter && proposedRows[j]!.start < windowEnd + 100) {
        windowEnd = Math.max(windowEnd, proposedRows[j]!.end);
        afterCluster.push(rowToItem(proposedRows[j]!, j, baseLanguage));
        j++;
      }
    }

    // Categorize change type
    let changeType: ParserChangeType = "modified";
    let description = "Subtitle division modified";

    if (beforeCluster.length === 1 && afterCluster.length > 1) {
      changeType = "split";
      description = `Sentence split into ${afterCluster.length} smaller sections`;
    } else if (beforeCluster.length > 1 && afterCluster.length === 1) {
      changeType = "merged";
      description = `${beforeCluster.length} sections merged into 1 continuous sentence`;
    } else if (beforeCluster.length === 0 && afterCluster.length > 0) {
      changeType = "added";
      description = `${afterCluster.length} new subtitle section(s) formed`;
    } else if (beforeCluster.length > 0 && afterCluster.length === 0) {
      changeType = "removed";
      description = `${beforeCluster.length} section(s) removed`;
    } else if (beforeCluster.length === afterCluster.length) {
      const timingChanged = beforeCluster.some(
        (b, idx) =>
          Math.abs(b.start - afterCluster[idx]!.start) > 50 ||
          Math.abs(b.end - afterCluster[idx]!.end) > 50,
      );
      if (timingChanged) {
        changeType = "timing";
        description = "Section timing boundary adjusted";
      } else {
        changeType = "content";
        description = "Subtitle text grouping altered";
      }
    }

    const beforeTextSummary = beforeCluster.map((b) => b.text).filter(Boolean).join(" ");
    const afterTextSummary = afterCluster.map((a) => a.text).filter(Boolean).join(" ");

    changedRecords.push({
      id: `change-${changeCount}`,
      changeIndex: changeCount,
      changeType,
      description,
      timeRange: {
        start: windowStart,
        end: windowEnd,
        formatted: `${fmt(windowStart)}–${fmt(windowEnd)}`,
      },
      beforeRecords: beforeCluster,
      afterRecords: afterCluster,
      beforeTextSummary,
      afterTextSummary,
    });

    changeCount++;
  }

  const hasChanges = changedRecords.length > 0;
  let summaryMessage = "No differences detected. Both configurations produce identical subtitle rows.";
  if (hasChanges) {
    summaryMessage = `Detected ${changedRecords.length} changed record group(s) across ${totalBefore} → ${totalAfter} total records.`;
  }

  return {
    hasChanges,
    totalBefore,
    totalAfter,
    totalChanges: changedRecords.length,
    changedRecords,
    summaryMessage,
  };
}

/**
 * Step navigation helpers for inspecting changed records one by one
 */
export function getNextChangeIndex(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  return (currentIndex + 1) % total;
}

export function getPrevChangeIndex(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  return (currentIndex - 1 + total) % total;
}
