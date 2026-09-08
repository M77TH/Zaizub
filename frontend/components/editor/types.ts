export type SubtitlePosition = 'bottom' | 'center' | 'custom';
export type SubtitleAnimation = 'none' | 'fade' | 'pop' | 'typewriter';

export interface SubtitleStyle {
  font_family: string;
  font_size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  shadow: boolean;
  outline: boolean;
  shadow_color: string;
  shadow_thickness: number;
  text_color: string;
  bg_color: string;
  bg_opacity: number;
  padding_x: number;
  padding_y: number;
  border_radius?: number;
  position: SubtitlePosition;
  custom_x?: number;
  custom_y?: number;
  box_width?: number;
  animation: SubtitleAnimation;
}

export interface WordToken {
  word: string;
  start: number;
  end: number;
}

export type CaptionLengthMode = 'normal' | 'short' | 'custom';

export interface SubtitleSegment {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  isEdited?: boolean;
  style?: SubtitleStyle;
  words?: WordToken[];
}

export const DEFAULT_STYLES: SubtitleStyle = {
  font_family: 'Noto Sans Thai',
  font_size: 52,
  bold: true,
  italic: false,
  underline: false,
  shadow: false,
  outline: false,
  shadow_color: '#000000',
  shadow_thickness: 2,
  text_color: '#ffffff',
  bg_color: '#000000',
  bg_opacity: 0.85,
  padding_x: 18,
  padding_y: 10,
  border_radius: 12,
  position: 'bottom',
  custom_x: 50,
  custom_y: 82,
  box_width: 86,
  animation: 'none',
};

export const DEFAULT_SUBTITLES: SubtitleSegment[] = [];

export function normaliseSubtitles(value: unknown): SubtitleSegment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: Record<string, unknown>, index) => ({
      id: typeof item?.id === 'number' ? item.id : index + 1,
      start: Number(item?.start ?? item?.start_time ?? item?.startTime ?? 0),
      end: Number(item?.end ?? item?.end_time ?? item?.endTime ?? 3),
      text: String(item?.text ?? item?.caption ?? item?.content ?? '').trim(),
      isEdited: false,
      style: item?.style as SubtitleStyle | undefined,
      words: Array.isArray(item?.words)
        ? (item.words as Record<string, unknown>[])
            .map((w) => ({
              word: String(w?.word ?? ''),
              start: Number(w?.start ?? 0),
              end: Number(w?.end ?? 0),
            }))
            .filter((w) => w.word.length > 0)
        : undefined,
    }))
    .filter((item) => item.text.length > 0 && Number.isFinite(item.start) && Number.isFinite(item.end));
}

/**
 * Dynamic Subtitle Regrouping:
 * Combines or segments word tokens based on user preference:
 * - 'normal': full natural sentence / pause-based chunks
 * - 'short': 2-3 words per card (punchy TikTok/Shorts)
 * - 'custom': custom X words per card
 */
export function regroupSubtitles(
  currentSubtitles: SubtitleSegment[],
  mode: CaptionLengthMode,
  customWordCount: number = 4
): SubtitleSegment[] {
  if (!currentSubtitles || currentSubtitles.length === 0) return [];

  interface FlatWord {
    word: string;
    start: number;
    end: number;
  }

  // Helper to remove severe repetitive sound hallucinations (e.g. ว้ว้ว้ว้ or .....)
  const sanitizeRepetition = (str: string): string => {
    return str.replace(/(.{1,4}?)\1{3,}/gu, '$1').trim();
  };

  // Helper to segment text into words, especially for Thai and mixed languages
  const tokenizeWords = (text: string): string[] => {
    const cleaned = sanitizeRepetition(text);
    if (!cleaned) return [];

    if (cleaned.includes(' ')) {
      return cleaned.split(/\s+/).filter(Boolean);
    }

    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      try {
        const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
        const segments = Array.from(segmenter.segment(cleaned)) as Array<{ segment: string; isWordLike?: boolean }>;
        const words = segments
          .filter((s) => s.isWordLike && s.segment.trim().length > 0)
          .map((s) => s.segment.trim());
        if (words.length > 0) return words;
      } catch {
        // fallback
      }
    }

    return [cleaned];
  };

  interface FlatWord {
    word: string;
    start: number;
    end: number;
    style?: SubtitleStyle;
  }

  // Helper to format words into natural sentence text (spacing English/Numbers naturally)
  const formatWordGroup = (words: FlatWord[]): string => {
    let res = '';
    for (let i = 0; i < words.length; i++) {
      const w = words[i].word;
      if (i === 0) {
        res += w;
      } else {
        const prev = words[i - 1].word;
        const isPrevAscii = /[A-Za-z0-9]$/.test(prev);
        const isCurrAscii = /^[A-Za-z0-9]/.test(w);
        if (isPrevAscii || isCurrAscii) {
          res += ' ' + w;
        } else {
          res += w;
        }
      }
    }
    return res;
  };

  const allWords: FlatWord[] = [];

  for (const sub of currentSubtitles) {
    const rawSubText = (sub.text || '').trim();
    if (!rawSubText) continue;

    // Check if the card's text was edited compared to its underlying words
    const wordsRawText = (sub.words || []).map((w) => w.word).join('');
    const isTextMismatch =
      !sub.words ||
      sub.words.length === 0 ||
      rawSubText.replace(/\s+/g, '') !== wordsRawText.replace(/\s+/g, '');

    if (!isTextMismatch && sub.words && sub.words.length > 0) {
      // Use existing high-precision aligned words
      for (const w of sub.words) {
        const cleanedWord = sanitizeRepetition(w.word || '');
        if (cleanedWord) {
          allWords.push({
            word: cleanedWord,
            start: Number(w.start ?? sub.start),
            end: Number(w.end ?? sub.end),
            style: sub.style,
          });
        }
      }
    } else {
      // The user edited or added this card! Tokenize the new/edited text dynamically
      const parts = tokenizeWords(rawSubText);
      if (parts.length === 0) continue;

      const duration = Math.max(0.3, sub.end - sub.start);
      const step = duration / parts.length;
      parts.forEach((p, idx) => {
        const wStart = sub.start + idx * step;
        const wEnd = Math.min(sub.end, wStart + step);
        allWords.push({
          word: p,
          start: Number(wStart.toFixed(2)),
          end: Number(wEnd.toFixed(2)),
          style: sub.style,
        });
      });
    }
  }

  if (allWords.length === 0) return currentSubtitles;

  let targetWordsPerChunk = 4;
  if (mode === 'normal') {
    targetWordsPerChunk = 10; // Natural sentence size
  } else if (mode === 'short') {
    targetWordsPerChunk = 3;
  } else if (mode === 'custom') {
    targetWordsPerChunk = Math.max(1, Math.min(20, customWordCount));
  }

  const newSubtitles: SubtitleSegment[] = [];
  let currentGroup: FlatWord[] = [];
  let nextId = 1;

  const pushCurrentGroup = () => {
    if (currentGroup.length === 0) return;
    const gStart = currentGroup[0].start;
    const gEnd = currentGroup[currentGroup.length - 1].end;
    const gText = formatWordGroup(currentGroup);

    // Filter out cards with empty text
    if (!gText.trim()) {
      currentGroup = [];
      return;
    }

    // Preserve custom style if all words or the primary word has a custom style
    const activeStyle = currentGroup.find((w) => w.style)?.style;

    newSubtitles.push({
      id: nextId++,
      start: Number(gStart.toFixed(2)),
      end: Number(Math.max(gStart + 0.35, gEnd).toFixed(2)),
      text: gText,
      words: currentGroup.map((w) => ({
        word: w.word,
        start: w.start,
        end: w.end,
      })),
      style: activeStyle,
      isEdited: true,
    });
    currentGroup = [];
  };

  for (let i = 0; i < allWords.length; i++) {
    const currentWord = allWords[i];
    const prevWord = currentGroup[currentGroup.length - 1];

    const isBigPause = prevWord ? (currentWord.start - prevWord.end > 0.8) : false;
    const isSentenceEnd = prevWord && /[.!?\n]/.test(prevWord.word);

    if (
      currentGroup.length > 0 &&
      (currentGroup.length >= targetWordsPerChunk || isBigPause || (mode === 'normal' && isSentenceEnd))
    ) {
      pushCurrentGroup();
    }

    currentGroup.push(currentWord);
  }

  if (currentGroup.length > 0) {
    pushCurrentGroup();
  }

  return newSubtitles.length > 0 ? newSubtitles : currentSubtitles;
}