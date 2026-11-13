export interface SubtitleRowLike {
  texts?: Record<string, string>;
  text?: string;
  translation?: string;
}

export interface ListeningGameWordItem {
  id: string;
  word: string;
  normalized: string;
  letterCount: number;
  sourceSentence: string;
  sourceTranslation: string;
  rowIndex: number;
}

export interface ListeningGameSentenceItem {
  id: string;
  sentence: string;
  translation: string;
  wordCount: number;
  rowIndex: number;
}

export function sanitizeListeningWord(rawWord: string): string {
  return rawWord
    .trim()
    .replace(
      /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,
      "",
    );
}

export function countWordLetters(word: string): number {
  const letters = word.match(/\p{L}/gu);
  if (letters) return letters.length;
  const alnum = word.match(/[\p{L}\p{N}]/gu);
  return alnum ? alnum.length : 0;
}

export function countSentenceWords(sentence: string): number {
  if (!sentence.trim()) return 0;
  return sentence
    .trim()
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

export function splitTextIntoPunctuationSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const sentences: string[] = [];
  let buffer = "";
  let inDoubleQuote = false;
  let parenDepth = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    buffer += ch;

    if (ch === '"' || ch === "“" || ch === "”") {
      inDoubleQuote = !inDoubleQuote;
    } else if (ch === "(") {
      parenDepth += 1;
    } else if (ch === ")" && parenDepth > 0) {
      parenDepth -= 1;
    }

    const isTerminal =
      ch === "." ||
      ch === "!" ||
      ch === "?" ||
      ch === "؟" ||
      ch === "。" ||
      ch === "！" ||
      ch === "？" ||
      ch === ";";

    if (isTerminal && !inDoubleQuote && parenDepth === 0) {
      // Avoid splitting decimal numbers like 3.5 or abbreviations when next char is digit/letter without whitespace
      const nextChar = trimmed[i + 1];
      if (ch === "." && nextChar && /\S/.test(nextChar) && nextChar !== '"' && nextChar !== ")") {
        continue;
      }
      const candidate = buffer.trim();
      if (candidate && countSentenceWords(candidate) > 0) {
        sentences.push(candidate);
      }
      buffer = "";
    }
  }

  const tail = buffer.trim();
  if (tail && countSentenceWords(tail) > 0) {
    sentences.push(tail);
  }

  return sentences;
}

export function resolveRowBaseAndTranslation(
  row: SubtitleRowLike,
  baseLanguage: string,
  targetLanguage: string,
): { baseText: string; translationText: string } {
  const texts = row.texts || {};
  const baseText = (
    (baseLanguage ? texts[baseLanguage] : undefined) ??
    row.text ??
    Object.values(texts)[0] ??
    ""
  ).trim();

  const translationText = (
    (targetLanguage ? texts[targetLanguage] : undefined) ??
    row.translation ??
    ""
  ).trim();

  return { baseText, translationText };
}

export interface ExtractListeningWordsOptions {
  baseLanguage: string;
  targetLanguage: string;
  minLetters: number;
  fallbackSentence?: string;
  fallbackTranslation?: string;
}

export function extractListeningWords(
  rows: SubtitleRowLike[],
  options: ExtractListeningWordsOptions,
): ListeningGameWordItem[] {
  const safeMinLetters = Math.max(1, Math.floor(options.minLetters || 1));
  const sourceRows: SubtitleRowLike[] =
    rows.length > 0
      ? rows
      : options.fallbackSentence
        ? [
            {
              text: options.fallbackSentence,
              translation: options.fallbackTranslation || "",
            },
          ]
        : [];

  const seen = new Set<string>();
  const items: ListeningGameWordItem[] = [];

  sourceRows.forEach((row, rowIndex) => {
    const { baseText, translationText } = resolveRowBaseAndTranslation(
      row,
      options.baseLanguage,
      options.targetLanguage,
    );
    if (!baseText) return;

    const rawTokens = baseText.split(/\s+/);
    for (const token of rawTokens) {
      const clean = sanitizeListeningWord(token);
      if (!clean) continue;
      const letterCount = countWordLetters(clean);
      if (letterCount < safeMinLetters) continue;
      const normalized = clean.toLowerCase();
      if (seen.has(normalized)) continue;
      seen.add(normalized);

      items.push({
        id: `word-${rowIndex}-${normalized}`,
        word: clean,
        normalized,
        letterCount,
        sourceSentence: baseText,
        sourceTranslation: translationText,
        rowIndex,
      });
    }
  });

  return items;
}

export interface ExtractListeningSentencesOptions {
  baseLanguage: string;
  targetLanguage: string;
  maxWords: number;
  fallbackSentence?: string;
  fallbackTranslation?: string;
}

export function extractListeningSentences(
  rows: SubtitleRowLike[],
  options: ExtractListeningSentencesOptions,
): ListeningGameSentenceItem[] {
  const safeMaxWords = Math.max(1, Math.floor(options.maxWords || 1));
  const sourceRows: SubtitleRowLike[] =
    rows.length > 0
      ? rows
      : options.fallbackSentence
        ? [
            {
              text: options.fallbackSentence,
              translation: options.fallbackTranslation || "",
            },
          ]
        : [];

  const seen = new Set<string>();
  const items: ListeningGameSentenceItem[] = [];

  sourceRows.forEach((row, rowIndex) => {
    const { baseText, translationText } = resolveRowBaseAndTranslation(
      row,
      options.baseLanguage,
      options.targetLanguage,
    );
    if (!baseText) return;

    const baseSentences = splitTextIntoPunctuationSentences(baseText);
    const transSentences = translationText
      ? splitTextIntoPunctuationSentences(translationText)
      : [];

    baseSentences.forEach((sentence, sIdx) => {
      const wordCount = countSentenceWords(sentence);
      if (wordCount <= 0 || wordCount > safeMaxWords) return;

      const normalized = sentence.toLowerCase().replace(/\s+/g, " ").trim();
      if (seen.has(normalized)) return;
      seen.add(normalized);

      const pairedTranslation =
        transSentences.length === baseSentences.length
          ? transSentences[sIdx] || translationText
          : translationText;

      items.push({
        id: `sentence-${rowIndex}-${sIdx}`,
        sentence,
        translation: pairedTranslation,
        wordCount,
        rowIndex,
      });
    });
  });

  return items;
}
