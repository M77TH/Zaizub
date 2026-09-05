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

  const allWords: FlatWord[] = [];

  for (const sub of currentSubtitles) {
    if (sub.words && sub.words.length > 0) {
      for (const w of sub.words) {
        if (w.word.trim()) {
          allWords.push({ word: w.word.trim(), start: w.start, end: w.end });
        }
      }
    } else {
      // Fallback: split words from text
      const rawText = sub.text.trim();
      if (!rawText) continue;
      const parts = rawText.includes(' ')
        ? rawText.split(/\s+/).filter(Boolean)
        : rawText.match(/.{1,4}/g) || [rawText];

      const duration = Math.max(0.2, sub.end - sub.start);
      const step = duration / parts.length;
      parts.forEach((p, idx) => {
        const wStart = sub.start + idx * step;
        const wEnd = Math.min(sub.end, wStart + step);
        allWords.push({ word: p, start: Number(wStart.toFixed(2)), end: Number(wEnd.toFixed(2)) });
      });
    }
  }

  if (allWords.length === 0) return currentSubtitles;

  let targetWordsPerChunk = 4;
  if (mode === 'normal') {
    targetWordsPerChunk = 12; // Natural sentence size
  } else if (mode === 'short') {
    targetWordsPerChunk = 3;
  } else if (mode === 'custom') {
    targetWordsPerChunk = Math.max(1, Math.min(20, customWordCount));
  }

  const newSubtitles: SubtitleSegment[] = [];
  let currentGroup: FlatWord[] = [];
  let nextId = 1;

  for (let i = 0; i < allWords.length; i++) {
    const currentWord = allWords[i];
    const prevWord = currentGroup[currentGroup.length - 1];

    const isBigPause = prevWord ? (currentWord.start - prevWord.end > 0.8) : false;
    const isSentenceEnd = prevWord && /[.!?\n]/.test(prevWord.word);

    if (
      currentGroup.length > 0 &&
      (currentGroup.length >= targetWordsPerChunk || isBigPause || (mode === 'normal' && isSentenceEnd))
    ) {
      const gStart = currentGroup[0].start;
      const gEnd = currentGroup[currentGroup.length - 1].end;
      const gText = currentGroup.map((w) => w.word).join('');

      newSubtitles.push({
        id: nextId++,
        start: Number(gStart.toFixed(2)),
        end: Number(Math.max(gStart + 0.3, gEnd).toFixed(2)),
        text: gText,
        words: currentGroup.map((w) => ({ ...w })),
        isEdited: true,
      });
      currentGroup = [];
    }

    currentGroup.push(currentWord);
  }

  if (currentGroup.length > 0) {
    const gStart = currentGroup[0].start;
    const gEnd = currentGroup[currentGroup.length - 1].end;
    const gText = currentGroup.map((w) => w.word).join('');
    newSubtitles.push({
      id: nextId++,
      start: Number(gStart.toFixed(2)),
      end: Number(Math.max(gStart + 0.3, gEnd).toFixed(2)),
      text: gText,
      words: currentGroup.map((w) => ({ ...w })),
      isEdited: true,
    });
  }

  return newSubtitles;
}