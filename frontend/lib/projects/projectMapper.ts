export interface VideoProject {
  id: string;
  title: string;
  status: 'done' | 'draft' | 'processing';
  duration?: string;
  video_url?: string;
  thumbnail_url?: string;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  captionCount?: number;
  presetLabel?: string;
  sampleLine?: string;
  updated_at: string;
  uploadPercent?: number;
  uploadError?: string;
}

export interface SubtitlesEnvelope<TItem = Record<string, unknown>, TStyle = Record<string, unknown>> {
  items: TItem[];
  styles: TStyle;
  video_filename?: string;
}

export interface RawVideoRow {
  id: string;
  user_id?: string;
  title?: string | null;
  status?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  duration?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  subtitles?: unknown;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PRESET_LABEL_MAP: Record<string, string> = {
  tiktok: 'TIKTOK',
  badge: 'BADGE',
  karaoke: 'NEON',
  danger: 'HOOK',
  frosted: 'FROST',
  minimal: 'MINIMAL',
  warm: 'PODCAST',
  cinema: 'CINEMA',
};

export function isValidUuid(value?: string | null): value is string {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

export function normalizeProjectStatus(
  status?: string | null
): 'done' | 'draft' | 'processing' {
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
  if (
    normalized === 'done' ||
    normalized === 'completed' ||
    normalized === 'complete' ||
    normalized === 'rendered'
  ) {
    return 'done';
  }
  if (
    normalized === 'processing' ||
    normalized === 'uploading' ||
    normalized === 'queued' ||
    normalized === 'pending'
  ) {
    return 'processing';
  }
  return 'draft';
}

export function parseDurationSeconds(
  duration?: string | number | null
): number | undefined {
  if (typeof duration === 'number') {
    return Number.isFinite(duration) && duration >= 0 ? duration : undefined;
  }
  if (typeof duration !== 'string') {
    return undefined;
  }

  const trimmed = duration.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.includes(':')) {
    const rawParts = trimmed.split(':');
    if (rawParts.length < 2 || rawParts.length > 3) {
      return undefined;
    }
    const nums = rawParts.map((part) => Number(part));
    if (nums.some((n) => !Number.isFinite(n) || n < 0)) {
      return undefined;
    }
    if (nums.length === 2) {
      return nums[0] * 60 + nums[1];
    }
    return nums[0] * 3600 + nums[1] * 60 + nums[2];
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function formatDurationClock(
  duration?: number | string | null
): string | undefined {
  const seconds = parseDurationSeconds(duration);
  if (seconds === undefined || seconds <= 0) {
    return undefined;
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatProjectDate(value?: string | Date | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('th-TH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function sanitizeVideoFilename(filename?: string | null): string | undefined {
  if (typeof filename !== 'string') return undefined;
  const trimmed = filename.trim();
  if (!trimmed || trimmed === 'sample_video.mp4') {
    return undefined;
  }
  return trimmed;
}

export function normalizeOptionalUrl(url?: string | null): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  return trimmed ? trimmed : null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function extractProjectEnvelope<
  TItem = Record<string, unknown>,
  TStyle = Record<string, unknown>
>(rawSubtitlesOrRow: unknown): SubtitlesEnvelope<TItem, TStyle> {
  const rawSubtitles =
    isPlainRecord(rawSubtitlesOrRow) && 'subtitles' in rawSubtitlesOrRow
      ? rawSubtitlesOrRow.subtitles
      : rawSubtitlesOrRow;

  if (Array.isArray(rawSubtitles)) {
    return {
      items: rawSubtitles as TItem[],
      styles: {} as TStyle,
      video_filename: undefined,
    };
  }

  if (isPlainRecord(rawSubtitles)) {
    const items = Array.isArray(rawSubtitles.items)
      ? (rawSubtitles.items as TItem[])
      : [];
    const styles = isPlainRecord(rawSubtitles.styles)
      ? (rawSubtitles.styles as TStyle)
      : ({} as TStyle);
    const video_filename = sanitizeVideoFilename(
      typeof rawSubtitles.video_filename === 'string'
        ? rawSubtitles.video_filename
        : undefined
    );
    return { items, styles, video_filename };
  }

  return {
    items: [],
    styles: {} as TStyle,
    video_filename: undefined,
  };
}

export function buildSubtitlesEnvelope<
  TItem = Record<string, unknown>,
  TStyle extends Record<string, unknown> = Record<string, unknown>
>(
  subtitles: unknown,
  styles?: unknown,
  videoFilename?: string | null
): SubtitlesEnvelope<TItem, TStyle> {
  const extracted = extractProjectEnvelope<TItem, TStyle>(subtitles);
  const items = Array.isArray(subtitles) ? (subtitles as TItem[]) : extracted.items;

  const cleanStyles = isPlainRecord(styles)
    ? (styles as TStyle)
    : extracted.styles;

  const cleanFilename =
    sanitizeVideoFilename(videoFilename) ?? extracted.video_filename;

  return {
    items,
    styles: cleanStyles,
    ...(cleanFilename ? { video_filename: cleanFilename } : {}),
  };
}

export function mapVideoRowToProject(row: RawVideoRow): VideoProject {
  const { items, styles } = extractProjectEnvelope(row.subtitles);
  const rawAspect = isPlainRecord(styles) ? styles.aspect_ratio : undefined;
  const rawPreset = isPlainRecord(styles) ? styles.preset_mode : undefined;
  const firstItem = items[0];
  const firstText =
    isPlainRecord(firstItem) && typeof firstItem.text === 'string'
      ? firstItem.text.trim()
      : '';

  const aspectRatio =
    rawAspect === '9:16' || rawAspect === '16:9' || rawAspect === '1:1'
      ? rawAspect
      : undefined;

  const presetModeStr =
    typeof rawPreset === 'string' && rawPreset.trim() ? rawPreset.trim() : '';

  return {
    id: row.id,
    title: row.title?.trim() || 'Untitled Video',
    status: normalizeProjectStatus(row.status),
    thumbnail_url: normalizeOptionalUrl(row.thumbnail_url) ?? undefined,
    video_url: normalizeOptionalUrl(row.video_url) ?? undefined,
    duration: formatDurationClock(row.duration),
    aspectRatio,
    captionCount: items.length > 0 ? items.length : undefined,
    presetLabel: presetModeStr
      ? PRESET_LABEL_MAP[presetModeStr] || presetModeStr.toUpperCase()
      : undefined,
    sampleLine: firstText ? firstText.slice(0, 64) : undefined,
    updated_at: formatProjectDate(row.updated_at || row.created_at),
  };
}

interface AuthUserLike {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

export function resolveProfileFormDisplayName(
  profile?: { display_name?: string | null } | null,
  user?: AuthUserLike | null
): string {
  const candidates = [
    profile?.display_name,
    user?.user_metadata?.display_name,
    user?.user_metadata?.full_name,
    user?.user_metadata?.name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return '';
}

export function resolveUserDisplayName(
  profile?: { display_name?: string | null } | null,
  user?: AuthUserLike | null
): string {
  const fromProfileOrMeta = resolveProfileFormDisplayName(profile, user);
  if (fromProfileOrMeta) {
    return fromProfileOrMeta;
  }
  if (typeof user?.email === 'string' && user.email.includes('@')) {
    return user.email.split('@')[0] || 'User';
  }
  return 'User';
}
