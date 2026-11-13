export type SubtitlePosition = 'bottom' | 'center' | 'custom';
export type SubtitleAnimation = 'none' | 'fade' | 'pop' | 'typewriter' | 'shake' | 'bounce' | 'slide-up';
export type SubtitlePresetMode =
  | 'default'
  | 'tiktok'
  | 'badge'
  | 'karaoke'
  | 'danger'
  | 'frosted'
  | 'minimal'
  | 'warm'
  | 'cinema';

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
  outline_color?: string;
  outline_thickness?: number;
  text_color: string;
  base_text_color?: string;
  word_highlight?: boolean;
  preset_mode?: SubtitlePresetMode;
  badge_color?: string;
  bg_color: string;
  bg_opacity: number;
  padding_x: number;
  padding_y: number;
  border_radius?: number;
  line_height?: number;
  letter_spacing?: number;
  uppercase?: boolean;
  position: SubtitlePosition;
  custom_x?: number;
  custom_y?: number;
  box_width?: number;
  animation: SubtitleAnimation;
  aspect_ratio?: '9:16' | '16:9' | '1:1';
  caption_length_mode?: CaptionLengthMode;
  custom_word_count?: number;
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
  font_family: 'Kanit',
  font_size: 56,
  bold: true,
  italic: false,
  underline: false,
  shadow: true,
  outline: true,
  shadow_color: '#000000',
  shadow_thickness: 3,
  outline_color: '#000000',
  outline_thickness: 3,
  text_color: '#facc15',
  base_text_color: '#ffffff',
  word_highlight: true,
  preset_mode: 'tiktok',
  badge_color: '#16a34a',
  bg_color: '#000000',
  bg_opacity: 0,
  padding_x: 16,
  padding_y: 8,
  border_radius: 12,
  line_height: 1.35,
  letter_spacing: 0,
  uppercase: false,
  position: 'bottom',
  custom_x: 50,
  custom_y: 82,
  box_width: 86,
  animation: 'pop',
  aspect_ratio: '9:16',
  caption_length_mode: 'custom',
  custom_word_count: 4,
};

export const DEFAULT_SUBTITLES: SubtitleSegment[] = [];

/**
 * Converts CSS #RGB, #RRGGBB, rgb(...), or rgba(...) into a normalized #rrggbb hex and [0..1] opacity.
 */
export function parseCssColorToHexAndOpacity(
  colorStr: string | undefined,
  fallbackHex: string = '#000000',
  explicitOpacity?: number
): { hex: string; opacity: number } {
  const baseOpacity =
    typeof explicitOpacity === 'number' && Number.isFinite(explicitOpacity)
      ? Math.max(0, Math.min(1, explicitOpacity))
      : 1;

  if (!colorStr || typeof colorStr !== 'string') {
    return { hex: fallbackHex, opacity: baseOpacity };
  }

  const trimmed = colorStr.trim();
  const rgbaMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$/i
  );
  if (rgbaMatch) {
    const r = Math.max(0, Math.min(255, parseInt(rgbaMatch[1], 10)));
    const g = Math.max(0, Math.min(255, parseInt(rgbaMatch[2], 10)));
    const b = Math.max(0, Math.min(255, parseInt(rgbaMatch[3], 10)));
    const rgbaAlpha =
      rgbaMatch[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(rgbaMatch[4]))) : 1;
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
      .toString(16)
      .padStart(2, '0')}`;
    return { hex, opacity: Math.max(0, Math.min(1, Number((baseOpacity * rgbaAlpha).toFixed(3)))) };
  }

  const clean = trimmed.replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(clean)) {
    const expanded = clean
      .split('')
      .map((c) => c + c)
      .join('');
    return { hex: `#${expanded.toLowerCase()}`, opacity: baseOpacity };
  }
  if (/^[0-9a-f]{6}$/i.test(clean)) {
    return { hex: `#${clean.toLowerCase()}`, opacity: baseOpacity };
  }

  return { hex: fallbackHex, opacity: baseOpacity };
}

/**
 * Ensures every SubtitleStyle object (whether loaded from legacy DB rows, templates, or edits)
 * contains consistent normalized fields for both preview and backend rendering.
 */
export function normalizeSubtitleStyle(
  style?: Partial<SubtitleStyle>,
  fallback: SubtitleStyle = DEFAULT_STYLES
): SubtitleStyle {
  const merged = { ...fallback, ...(style || {}) };

  const parsedBg = parseCssColorToHexAndOpacity(
    merged.bg_color,
    '#000000',
    typeof merged.bg_opacity === 'number' ? merged.bg_opacity : fallback.bg_opacity
  );
  const parsedText = parseCssColorToHexAndOpacity(merged.text_color, '#ffffff', 1);
  const parsedBaseText = parseCssColorToHexAndOpacity(
    merged.base_text_color || '#ffffff',
    '#ffffff',
    1
  );
  const parsedShadow = parseCssColorToHexAndOpacity(merged.shadow_color || '#000000', '#000000', 1);
  const parsedOutline = parseCssColorToHexAndOpacity(
    merged.outline_color || merged.shadow_color || '#000000',
    '#000000',
    1
  );
  const parsedBadge = parseCssColorToHexAndOpacity(merged.badge_color || '#16a34a', '#16a34a', 1);

  const posMode: SubtitlePosition = merged.position || 'bottom';
  const defaultY = posMode === 'center' ? 50 : posMode === 'custom' ? 12 : 82;

  const presetMode: SubtitlePresetMode = merged.preset_mode || 'default';
  const inferredWordHighlight =
    typeof merged.word_highlight === 'boolean'
      ? merged.word_highlight
      : ['tiktok', 'badge', 'karaoke', 'danger', 'frosted', 'warm'].includes(presetMode) ||
        (parsedText.hex !== '#ffffff' && parsedText.hex !== '#f8fafc');

  return {
    ...merged,
    font_family: merged.font_family || fallback.font_family || 'Kanit',
    font_size: Number.isFinite(Number(merged.font_size)) ? Number(merged.font_size) : fallback.font_size,
    bold: Boolean(merged.bold ?? true),
    italic: Boolean(merged.italic ?? false),
    underline: Boolean(merged.underline ?? false),
    shadow: Boolean(merged.shadow ?? false),
    outline: Boolean(merged.outline ?? false),
    shadow_color: parsedShadow.hex,
    shadow_thickness: Number.isFinite(Number(merged.shadow_thickness))
      ? Number(merged.shadow_thickness)
      : fallback.shadow_thickness,
    outline_color: parsedOutline.hex,
    outline_thickness: Number.isFinite(Number(merged.outline_thickness))
      ? Number(merged.outline_thickness)
      : merged.outline
      ? 3
      : 0,
    text_color: parsedText.hex,
    base_text_color: parsedBaseText.hex,
    word_highlight: inferredWordHighlight,
    preset_mode: presetMode,
    badge_color: parsedBadge.hex,
    bg_color: parsedBg.hex,
    bg_opacity: parsedBg.opacity,
    padding_x: Number.isFinite(Number(merged.padding_x)) ? Number(merged.padding_x) : 16,
    padding_y: Number.isFinite(Number(merged.padding_y)) ? Number(merged.padding_y) : 8,
    border_radius: Number.isFinite(Number(merged.border_radius)) ? Number(merged.border_radius) : 12,
    line_height: Number.isFinite(Number(merged.line_height)) ? Number(merged.line_height) : 1.35,
    letter_spacing: Number.isFinite(Number(merged.letter_spacing)) ? Number(merged.letter_spacing) : 0,
    uppercase: Boolean(merged.uppercase ?? false),
    position: posMode,
    custom_x: Number.isFinite(Number(merged.custom_x)) ? Number(merged.custom_x) : 50,
    custom_y: Number.isFinite(Number(merged.custom_y)) ? Number(merged.custom_y) : defaultY,
    box_width: Number.isFinite(Number(merged.box_width)) ? Number(merged.box_width) : 86,
    animation: merged.animation || 'none',
    aspect_ratio: merged.aspect_ratio || fallback.aspect_ratio || '9:16',
    caption_length_mode: merged.caption_length_mode || fallback.caption_length_mode || 'custom',
    custom_word_count: Number.isFinite(Number(merged.custom_word_count))
      ? Number(merged.custom_word_count)
      : fallback.custom_word_count || 4,
  };
}

const THAI_SCRIPT_RE = /[\u0E00-\u0E7F]/;

function isAsciiAlnumChar(ch: string): boolean {
  return /^[A-Za-z0-9]$/.test(ch);
}

function isWordyChar(ch: string): boolean {
  return /^[\p{L}\p{N}\p{M}]$/u.test(ch);
}

/**
 * Returns true if a visible space belongs between two adjacent word tokens:
 * no space between Thai words, natural spaces around ASCII words/numbers and English punctuation.
 */
export function needsSpaceBetweenWords(prev: string, curr: string): boolean {
  if (!prev || !curr) return false;
  const lastCh = prev[prev.length - 1];
  const firstCh = curr[0];
  return (
    (isAsciiAlnumChar(lastCh) || isAsciiAlnumChar(firstCh)) &&
    (isWordyChar(lastCh) || /^[.,!?;:)]$/.test(lastCh)) &&
    isWordyChar(firstCh)
  );
}

/**
 * Joins word tokens into natural caption text matching backend _join semantics.
 */
export function joinSubtitleTokens(words: string[]): string {
  let res = '';
  for (const raw of words) {
    const w = (raw || '').trim();
    if (!w) continue;
    if (!res) {
      res = w;
    } else {
      res += needsSpaceBetweenWords(res, w) ? ` ${w}` : w;
    }
  }
  return res;
}

const DEPENDENT_THAI_OR_PUNCT_START_RE = /^[\u0E2F\u0E30-\u0E3A\u0E45-\u0E4E]/;
const ATTACHING_PUNCT_OR_CONTRACTION_RE =
  /^(?:[.,!?;:…%)\]}"'’”]+|['’](?:t|s|re|ve|ll|d|m)\b|\.\d)/i;
const ORPHAN_THAI_LEADING_VOWEL_RE = /^[เแโไใ]+$/;
const ASCII_WORD_PART_RE = /^[A-Za-z0-9'’_-]+$/;

function shouldGlueWordTokens(
  prev: string,
  curr: string,
  hasSpaceBetween: boolean = false
): boolean {
  if (!prev || !curr) return false;
  if (DEPENDENT_THAI_OR_PUNCT_START_RE.test(curr)) return true;
  if (ATTACHING_PUNCT_OR_CONTRACTION_RE.test(curr)) return true;
  if (ORPHAN_THAI_LEADING_VOWEL_RE.test(prev)) return true;
  if (/[(\[{"'“‘-]$/.test(prev) && !hasSpaceBetween) return true;
  if (!hasSpaceBetween) {
    if (ASCII_WORD_PART_RE.test(prev) && ASCII_WORD_PART_RE.test(curr)) return true;
    if ((prev === 'การ' || prev === 'ความ') && THAI_SCRIPT_RE.test(curr[0])) return true;
  }
  return false;
}

function glueStringTokens(tokens: string[]): string[] {
  const glued: string[] = [];
  for (const raw of tokens) {
    const t = raw.trim();
    if (!t) continue;
    if (glued.length > 0 && shouldGlueWordTokens(glued[glued.length - 1], t, false)) {
      glued[glued.length - 1] += t;
    } else {
      glued.push(t);
    }
  }
  return glued;
}

/**
 * Merges Whisper sub-word pieces (e.g. ["compu", "ter"] or ["คอม", "พิว", "เตอร์"]) back into
 * unbroken whole words while preserving timestamps and avoiding cutting words in half.
 */
export function coalesceWordTokens(rawWords: WordToken[], referenceText?: string): WordToken[] {
  const cleanTokens = rawWords
    .map((w) => ({
      word: String(w.word || '').trim(),
      start: Number(w.start ?? 0),
      end: Number(w.end ?? 0),
    }))
    .filter((w) => w.word.length > 0);

  if (cleanTokens.length <= 1) return cleanTokens;

  // Detect whether referenceText had explicit spaces between adjacent tokens
  const cleanRef = (referenceText || '').trim();
  const compactTokens = cleanTokens.map((t) => t.word.replace(/\s+/g, '')).join('');
  const compactRef = cleanRef.replace(/\s+/g, '');
  const refMatchesTokens = cleanRef.length > 0 && compactTokens === compactRef;

  const hasSpaceBefore: boolean[] = new Array(cleanTokens.length).fill(false);
  if (refMatchesTokens) {
    let cursor = 0;
    for (let i = 0; i < cleanTokens.length; i++) {
      let sawSpace = false;
      while (cursor < cleanRef.length && /\s/.test(cleanRef[cursor])) {
        sawSpace = true;
        cursor++;
      }
      hasSpaceBefore[i] = i > 0 && sawSpace;
      cursor += cleanTokens[i].word.replace(/\s+/g, '').length;
    }
  }

  // Pass 1: merge atomic fragments (subwords like compu+ter, don+'t, 100+%, Thai prefixes/marks)
  const mergedPass1: WordToken[] = [];
  for (let i = 0; i < cleanTokens.length; i++) {
    const tok = cleanTokens[i];
    if (
      mergedPass1.length > 0 &&
      shouldGlueWordTokens(mergedPass1[mergedPass1.length - 1].word, tok.word, hasSpaceBefore[i])
    ) {
      const prev = mergedPass1[mergedPass1.length - 1];
      prev.word += tok.word;
      prev.end = Math.max(prev.end, tok.end);
    } else {
      mergedPass1.push({ ...tok });
    }
  }

  if (!refMatchesTokens || mergedPass1.length <= 1) {
    return mergedPass1;
  }

  // Pass 2: merge any sub-word fragments that fall inside a single canonical whole word span
  const wholeWords = tokenizeSubtitleText(cleanRef);
  if (wholeWords.length === 0 || wholeWords.length >= mergedPass1.length) {
    return mergedPass1;
  }

  const wholeSpans: Array<{ word: string; startIdx: number; endIdx: number }> = [];
  let offset = 0;
  for (const w of wholeWords) {
    const len = w.replace(/\s+/g, '').length;
    if (len === 0) continue;
    wholeSpans.push({ word: w, startIdx: offset, endIdx: offset + len });
    offset += len;
  }
  if (offset !== compactRef.length) {
    return mergedPass1;
  }

  const aligned: WordToken[] = [];
  let tokIdx = 0;
  let tokStart = 0;
  for (const span of wholeSpans) {
    if (tokIdx >= mergedPass1.length) return mergedPass1;
    let tokEnd = tokStart + mergedPass1[tokIdx].word.replace(/\s+/g, '').length;
    if (tokStart !== span.startIdx) return mergedPass1;

    const firstStart = mergedPass1[tokIdx].start;
    let lastEnd = mergedPass1[tokIdx].end;
    tokIdx++;
    while (tokEnd < span.endIdx && tokIdx < mergedPass1.length) {
      lastEnd = Math.max(lastEnd, mergedPass1[tokIdx].end);
      tokEnd += mergedPass1[tokIdx].word.replace(/\s+/g, '').length;
      tokIdx++;
    }
    if (tokEnd !== span.endIdx) return mergedPass1;

    aligned.push({ word: span.word, start: firstStart, end: lastEnd });
    tokStart = tokEnd;
  }

  return aligned.length > 0 ? aligned : mergedPass1;
}

function segmentThaiChunk(chunk: string): string[] {
  if (
    THAI_SCRIPT_RE.test(chunk) &&
    chunk.length > 2 &&
    typeof Intl !== 'undefined' &&
    (Intl as unknown as { Segmenter?: new (loc: string, opts: { granularity: 'word' }) => { segment: (s: string) => Iterable<{ segment: string; isWordLike?: boolean }> } }).Segmenter
  ) {
    try {
      const SegmenterCtor = (Intl as unknown as { Segmenter: new (loc: string, opts: { granularity: 'word' }) => { segment: (s: string) => Iterable<{ segment: string; isWordLike?: boolean }> } }).Segmenter;
      const segmenter = new SegmenterCtor('th', { granularity: 'word' });
      const rawPieces: string[] = [];
      for (const seg of segmenter.segment(chunk)) {
        const piece = seg.segment.trim();
        if (!piece) continue;
        if (!seg.isWordLike && rawPieces.length > 0) {
          rawPieces[rawPieces.length - 1] += piece;
        } else {
          rawPieces.push(piece);
        }
      }
      const tokens = glueStringTokens(rawPieces);
      if (tokens.length > 0) return tokens;
    } catch {
      // Fallback below
    }
  }
  return [chunk];
}

/**
 * Splits a caption string into displayable whole-word tokens (handles mixed Thai+English via Intl.Segmenter).
 */
export function tokenizeSubtitleText(text: string): string[] {
  const cleaned = (text || '').trim();
  if (!cleaned) return [];

  const chunks = cleaned.split(/\s+/).filter(Boolean);
  const tokens: string[] = [];
  for (const chunk of chunks) {
    tokens.push(...segmentThaiChunk(chunk));
  }
  return tokens;
}

export function distributeTimedTokens(
  tokens: string[],
  start: number,
  end: number,
  precision: number = 2
): WordToken[] {
  if (!tokens || tokens.length === 0) return [];
  const safeStart = Number.isFinite(start) ? start : 0;
  const safeEnd = Number.isFinite(end) && end > safeStart ? end : safeStart + 0.3;
  if (tokens.length === 1) {
    return [{ word: tokens[0], start: Number(safeStart.toFixed(precision)), end: Number(safeEnd.toFixed(precision)) }];
  }

  const weights = tokens.map((t) => Math.max(2, t.length));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0) || tokens.length;
  const totalDur = Math.max(0.2, safeEnd - safeStart);

  let cursor = safeStart;
  return tokens.map((word, idx) => {
    const wStart = Math.min(safeEnd, cursor);
    const isLast = idx === tokens.length - 1;
    const rawSlice = totalDur * (weights[idx] / totalWeight);
    const wEnd = isLast ? Math.max(wStart, safeEnd) : Math.min(safeEnd, wStart + Math.max(0.05, rawSlice));
    cursor = wEnd;
    return {
      word,
      start: Number(wStart.toFixed(precision)),
      end: Number(Math.max(wStart, wEnd).toFixed(precision)),
    };
  });
}

function clampWordsToRange(words: WordToken[], rangeStart: number, rangeEnd: number, precision: number = 2): WordToken[] {
  const safeStart = Number.isFinite(rangeStart) ? rangeStart : 0;
  const safeEnd = Number.isFinite(rangeEnd) && rangeEnd >= safeStart ? rangeEnd : safeStart;
  let prevStart = safeStart;
  return words.map((w) => {
    const rawS = Number.isFinite(Number(w.start)) ? Number(w.start) : prevStart;
    const rawE = Number.isFinite(Number(w.end)) ? Number(w.end) : rawS;
    const clampedStart = Math.max(prevStart, Math.min(safeEnd, rawS));
    prevStart = clampedStart;
    const clampedEnd = Math.max(clampedStart, Math.min(safeEnd, rawE));
    return {
      word: w.word,
      start: Number(clampedStart.toFixed(precision)),
      end: Number(clampedEnd.toFixed(precision)),
    };
  });
}

/**
 * Returns timed WordToken[] matching a SubtitleSegment's text and [start, end] range
 * so VideoPlayer preview and backend ASS word-by-word highlighting align identically.
 */
export function getSubtitleTokensWithTiming(sub: SubtitleSegment): WordToken[] {
  const start = Number.isFinite(Number(sub.start)) ? Number(sub.start) : 0;
  const rawEnd = Number.isFinite(Number(sub.end)) ? Number(sub.end) : start + 2;
  const end = rawEnd > start ? rawEnd : start + 0.5;
  const cleanText = (sub.text || '').trim();
  if (!cleanText) return [];

  if (Array.isArray(sub.words) && sub.words.length > 0) {
    const coalesced = coalesceWordTokens(sub.words, cleanText);
    const joinedWords = coalesced.map((w) => w.word).join('').replace(/\s+/g, '');
    const cleanJoinedText = cleanText.replace(/\s+/g, '');
    if (coalesced.length > 0 && joinedWords === cleanJoinedText) {
      // Normalize boundaries to be monotonically non-decreasing within [start, end]
      let prevStart = start;
      return coalesced.map((w, idx) => {
        const wStart = idx === 0 ? start : Math.max(prevStart, Math.min(end, w.start));
        prevStart = wStart;
        const nextRawStart = coalesced[idx + 1]?.start;
        const wEnd =
          idx === coalesced.length - 1
            ? end
            : Math.max(wStart, Math.min(end, Math.max(wStart + 0.04, nextRawStart ?? w.end)));
        return {
          word: w.word,
          start: Number(wStart.toFixed(3)),
          end: Number(wEnd.toFixed(3)),
        };
      });
    }
  }

  return distributeTimedTokens(tokenizeSubtitleText(cleanText), start, end, 3);
}

/**
 * Shifts (or proportionally scales) a segment's word tokens to a moved [newStart, newEnd] window.
 */
export function shiftSegmentWords(
  segment: SubtitleSegment,
  newStart: number,
  newEnd: number
): WordToken[] | undefined {
  if (!Array.isArray(segment.words) || segment.words.length === 0) return undefined;
  const oldStart = Number(segment.start ?? 0);
  const oldEnd = Number(segment.end ?? oldStart);
  const oldDur = oldEnd - oldStart;
  const newDur = Math.max(0.1, newEnd - newStart);
  const isPureShift = oldDur <= 0.05 || Math.abs(newDur - oldDur) <= 0.05;
  const scale = isPureShift ? 1 : newDur / oldDur;
  const delta = newStart - oldStart;

  let prevStart = newStart;
  return segment.words.map((w, idx) => {
    const rawStart = isPureShift
      ? Number(w.start ?? oldStart) + delta
      : newStart + (Number(w.start ?? oldStart) - oldStart) * scale;
    const rawEnd = isPureShift
      ? Number(w.end ?? oldEnd) + delta
      : newStart + (Number(w.end ?? oldEnd) - oldStart) * scale;
    const start = Number(Math.max(prevStart, Math.min(newEnd, rawStart)).toFixed(2));
    prevStart = start;
    const isLast = !isPureShift && idx === segment.words!.length - 1;
    const end = Number((isLast ? Math.max(start, newEnd) : Math.max(start, Math.min(newEnd, rawEnd))).toFixed(2));
    return { word: w.word, start, end };
  });
}

/**
 * Splits a SubtitleSegment at `splitTime` along whole-word boundaries (preserving Thai words)
 * and partitions `words` accurately between the two halves.
 */
export function splitSegmentByTime(
  segment: SubtitleSegment,
  splitTime: number,
  nextId: number
): [SubtitleSegment, SubtitleSegment] {
  const cutTime = Number(
    Math.max(segment.start + 0.1, Math.min(segment.end - 0.1, splitTime)).toFixed(2)
  );
  const timed = getSubtitleTokensWithTiming(segment);
  if (timed.length <= 1) {
    const fullText = (segment.text || '').trim();
    const firstWord = timed.length === 1 ? [{ ...timed[0], start: segment.start, end: cutTime }] : undefined;
    const secondWord = timed.length === 1 ? [{ ...timed[0], start: cutTime, end: segment.end }] : undefined;
    return [
      { ...segment, end: cutTime, text: fullText, words: firstWord, isEdited: true },
      { ...segment, id: nextId, start: cutTime, end: segment.end, text: fullText, words: secondWord, isEdited: true },
    ];
  }

  let splitIdx = timed.findIndex((tok, i) => i >= 1 && (tok.start + tok.end) / 2 >= cutTime);
  if (splitIdx === -1) {
    const ratio = (cutTime - segment.start) / Math.max(0.2, segment.end - segment.start);
    splitIdx = Math.round(timed.length * ratio);
  }
  splitIdx = Math.max(1, Math.min(timed.length - 1, splitIdx));

  const firstTokens = timed.slice(0, splitIdx);
  const secondTokens = timed.slice(splitIdx);

  const firstHalf: SubtitleSegment = {
    ...segment,
    end: cutTime,
    text: joinSubtitleTokens(firstTokens.map((t) => t.word)),
    words: clampWordsToRange(firstTokens, segment.start, cutTime, 2),
    isEdited: true,
  };
  const secondHalf: SubtitleSegment = {
    ...segment,
    id: nextId,
    start: cutTime,
    end: segment.end,
    text: joinSubtitleTokens(secondTokens.map((t) => t.word)),
    words: clampWordsToRange(secondTokens, cutTime, segment.end, 2),
    isEdited: true,
  };
  return [firstHalf, secondHalf];
}

/**
 * Splits a SubtitleSegment at a cursor index inside `segment.text`, using playheadTime
 * when the playhead is inside the card or exact token boundary timing otherwise.
 */
export function splitSegmentAtCursor(
  segment: SubtitleSegment,
  cursorIndex: number,
  playheadTime: number,
  nextId: number
): [SubtitleSegment, SubtitleSegment] | null {
  const fullText = segment.text || '';
  if (cursorIndex <= 0 || cursorIndex >= fullText.length) return null;

  const firstText = fullText.slice(0, cursorIndex).trimEnd();
  const secondText = fullText.slice(cursorIndex).trimStart();
  if (!firstText || !secondText) return null;

  const timed = getSubtitleTokensWithTiming(segment);
  const firstCompact = firstText.replace(/\s+/g, '');

  let matchedSplitIdx = -1;
  if (timed.length >= 2) {
    let acc = '';
    for (let i = 0; i < timed.length - 1; i++) {
      acc += timed[i].word.replace(/\s+/g, '');
      if (acc === firstCompact) {
        matchedSplitIdx = i + 1;
        break;
      }
      if (acc.length > firstCompact.length) break;
    }
  }

  let splitTime: number;
  if (playheadTime >= segment.start + 0.2 && playheadTime <= segment.end - 0.2) {
    splitTime = Number(playheadTime.toFixed(2));
  } else if (matchedSplitIdx > 0) {
    const boundaryMid = (timed[matchedSplitIdx - 1].end + timed[matchedSplitIdx].start) / 2;
    splitTime = Number(boundaryMid.toFixed(2));
  } else {
    const ratio = firstText.length / Math.max(1, firstText.length + secondText.length);
    splitTime = Number((segment.start + (segment.end - segment.start) * ratio).toFixed(2));
  }
  splitTime = Number(Math.max(segment.start + 0.1, Math.min(segment.end - 0.1, splitTime)).toFixed(2));

  const firstWords =
    matchedSplitIdx > 0
      ? clampWordsToRange(timed.slice(0, matchedSplitIdx), segment.start, splitTime, 2)
      : distributeTimedTokens(tokenizeSubtitleText(firstText), segment.start, splitTime, 2);
  const secondWords =
    matchedSplitIdx > 0
      ? clampWordsToRange(timed.slice(matchedSplitIdx), splitTime, segment.end, 2)
      : distributeTimedTokens(tokenizeSubtitleText(secondText), splitTime, segment.end, 2);

  return [
    {
      ...segment,
      end: splitTime,
      text: firstText,
      words: firstWords,
      isEdited: true,
    },
    {
      ...segment,
      id: nextId,
      start: splitTime,
      end: segment.end,
      text: secondText,
      words: secondWords,
      isEdited: true,
    },
  ];
}

/**
 * Merges two adjacent SubtitleSegments without inserting unwanted Thai spaces,
 * combining both word arrays in chronological order.
 */
export function mergeSegmentPair(
  prevCard: SubtitleSegment,
  currentCard: SubtitleSegment
): { mergedCard: SubtitleSegment; cursorPosition: number } {
  const prevText = (prevCard.text || '').trim();
  const currText = (currentCard.text || '').trim();
  const addSpace = prevText.length > 0 && currText.length > 0 && needsSpaceBetweenWords(prevText, currText);
  const mergedText = prevText && currText ? `${prevText}${addSpace ? ' ' : ''}${currText}` : (prevText || currText);
  const cursorPosition = prevText.length > 0 ? prevText.length + (addSpace ? 1 : 0) : 0;

  const endTime = Math.max(prevCard.end, currentCard.end);
  const combinedWords = [
    ...getSubtitleTokensWithTiming(prevCard),
    ...getSubtitleTokensWithTiming(currentCard),
  ];

  return {
    cursorPosition,
    mergedCard: {
      ...prevCard,
      end: endTime,
      text: mergedText,
      words: clampWordsToRange(combinedWords, prevCard.start, endTime, 2),
      isEdited: true,
    },
  };
}

export function normaliseSubtitles(value: unknown): SubtitleSegment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: Record<string, unknown>, index) => {
      const words = Array.isArray(item?.words)
        ? (item.words as Record<string, unknown>[])
            .map((w) => ({
              word: String(w?.word ?? '').trim(),
              start: Number(w?.start ?? 0),
              end: Number(w?.end ?? 0),
            }))
            .filter((w) => w.word.length > 0)
        : undefined;

      let text = String(item?.text ?? item?.caption ?? item?.content ?? '').trim();
      if (words && words.length >= 3) {
        const thaiWordCount = words.filter((w) => THAI_SCRIPT_RE.test(w.word)).length;
        if (thaiWordCount >= 3 && text === words.map((w) => w.word).join(' ')) {
          text = joinSubtitleTokens(words.map((w) => w.word));
        }
      }

      return {
        id: typeof item?.id === 'number' ? item.id : index + 1,
        start: Number(item?.start ?? item?.start_time ?? item?.startTime ?? 0),
        end: Number(item?.end ?? item?.end_time ?? item?.endTime ?? 3),
        text,
        isEdited: false,
        style: item?.style as SubtitleStyle | undefined,
        words,
      };
    })
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
    style?: SubtitleStyle;
    isEdited?: boolean;
  }

  // Helper to remove severe repetitive sound hallucinations (e.g. ว้ว้ว้ว้ or .....)
  const sanitizeRepetition = (str: string): string => {
    return str.replace(/(.{1,4}?)\1{3,}/gu, '$1').trim();
  };

  const tokenizeWords = (text: string): string[] => {
    const cleaned = sanitizeRepetition(text);
    return cleaned ? tokenizeSubtitleText(cleaned) : [];
  };

  const formatWordGroup = (words: FlatWord[]): string =>
    joinSubtitleTokens(words.map((w) => w.word));

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
      // Coalesce sub-word fragments (e.g. Whisper "compu"+"ter", "don"+"'t") before regrouping
      const sanitizedWords: WordToken[] = [];
      for (const w of sub.words) {
        const cleanedWord = sanitizeRepetition(w.word || '');
        if (cleanedWord) {
          sanitizedWords.push({
            word: cleanedWord,
            start: Number(w.start ?? sub.start),
            end: Number(w.end ?? sub.end),
          });
        }
      }
      const coalesced = clampWordsToRange(
        coalesceWordTokens(sanitizedWords, sanitizeRepetition(rawSubText)),
        sub.start,
        sub.end,
        2
      );
      for (const w of coalesced) {
        allWords.push({
          word: w.word,
          start: w.start,
          end: w.end,
          style: sub.style,
          isEdited: Boolean(sub.isEdited),
        });
      }
    } else {
      // The user edited or added this card! Tokenize with length-weighted timing
      const parts = tokenizeWords(rawSubText);
      if (parts.length === 0) continue;

      const timedParts = distributeTimedTokens(parts, sub.start, sub.end, 2);
      for (const w of timedParts) {
        allWords.push({
          word: w.word,
          start: w.start,
          end: w.end,
          style: sub.style,
          isEdited: Boolean(sub.isEdited),
        });
      }
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

    // Preserve custom style and individual edit status only for cards that actually had them
    const activeStyle = currentGroup.find((w) => w.style)?.style;
    const groupEdited = currentGroup.some((w) => Boolean(w.isEdited));

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
      isEdited: groupEdited,
    });
    currentGroup = [];
  };

  // Never strand dependent Thai marks, contractions, or trailing punctuation onto a new card across boundaries
  let writeIdx = 0;
  for (let i = 0; i < allWords.length; i++) {
    const curr = allWords[i];
    if (
      writeIdx > 0 &&
      (DEPENDENT_THAI_OR_PUNCT_START_RE.test(curr.word) || ATTACHING_PUNCT_OR_CONTRACTION_RE.test(curr.word))
    ) {
      const prev = allWords[writeIdx - 1];
      prev.word = `${prev.word}${curr.word}`;
      prev.end = Math.max(prev.end, curr.end);
      prev.isEdited = Boolean(prev.isEdited || curr.isEdited);
      continue;
    }
    allWords[writeIdx++] = curr;
  }
  allWords.length = writeIdx;

  for (let i = 0; i < allWords.length; i++) {
    const currentWord = allWords[i];
    const prevWord = currentGroup[currentGroup.length - 1];

    const isBigPause = prevWord ? (currentWord.start - prevWord.end > 0.55) : false;
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

  // Never let a minimum-duration extension bleed into the following card's start time
  for (let i = 0; i < newSubtitles.length - 1; i++) {
    const curr = newSubtitles[i];
    const next = newSubtitles[i + 1];
    if (curr.end > next.start) {
      const clampedEnd = Number(Math.max(curr.start, next.start).toFixed(2));
      curr.end = clampedEnd;
      if (curr.words && curr.words.length > 0) {
        curr.words = clampWordsToRange(curr.words, curr.start, clampedEnd, 2);
      }
    }
  }

  return newSubtitles.length > 0 ? newSubtitles : currentSubtitles;
}