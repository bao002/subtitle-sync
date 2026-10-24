import { CaptionCue } from "../../../src/types";
import { parseRawCaptionData } from "../../../src/utils/captionParser";

import arJsonRaw from "./ar.json?raw";
import enJsonRaw from "./en.json?raw";
import esJsonRaw from "./es.json?raw";
import heJsonRaw from "./he.json?raw";
import itJsonRaw from "./it.json?raw";
import ptBrJsonRaw from "./pt-BR.json?raw";
import ruJsonRaw from "./ru.json?raw";

const toRawString = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") return JSON.stringify(v);
  return "";
};

const arStr = toRawString(arJsonRaw);
const enStr = toRawString(enJsonRaw);
const esStr = toRawString(esJsonRaw);
const heStr = toRawString(heJsonRaw);
const itStr = toRawString(itJsonRaw);
const ptBrStr = toRawString(ptBrJsonRaw);
const ruStr = toRawString(ruJsonRaw);

export const JSON3_RAW_MAP: Record<string, string> = {
  ar: arStr,
  en: enStr,
  es: esStr,
  he: heStr,
  iw: heStr,
  il: heStr,
  it: itStr,
  "pt-br": ptBrStr,
  "pt-BR": ptBrStr,
  pt: ptBrStr,
  ru: ruStr,
};

// Parse JSON3 timed-text subtitle fixtures for video L2Ryrr6txwA
const parsedAr = parseRawCaptionData(arStr).cues;
const parsedEn = parseRawCaptionData(enStr).cues;
const parsedEs = parseRawCaptionData(esStr).cues;
const parsedHe = parseRawCaptionData(heStr).cues;
const parsedIt = parseRawCaptionData(itStr).cues;
const parsedPtBr = parseRawCaptionData(ptBrStr).cues;
const parsedRu = parseRawCaptionData(ruStr).cues;


export const L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS: Record<string, CaptionCue[]> = {
  ar: parsedAr,
  en: parsedEn,
  es: parsedEs,
  he: parsedHe,
  iw: parsedHe,
  il: parsedHe,
  it: parsedIt,
  "pt-BR": parsedPtBr,
  "pt-br": parsedPtBr,
  pt: parsedPtBr,
  ru: parsedRu,
};

export function getRawJson3ForLanguage(langCode: string): string | null {
  const code = (langCode || "").trim();
  if (JSON3_RAW_MAP[code]) return JSON3_RAW_MAP[code];
  const clean = code.toLowerCase();
  if (JSON3_RAW_MAP[clean]) return JSON3_RAW_MAP[clean];
  const prefix = clean.split(/[-_]/)[0];
  if (prefix === "il" || prefix === "iw") return JSON3_RAW_MAP["he"] || null;
  return JSON3_RAW_MAP[prefix] || null;
}

