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

export interface SubtitleSegment {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  isEdited?: boolean;
  style?: SubtitleStyle;
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
    }))
    .filter((item) => item.text.length > 0 && Number.isFinite(item.start) && Number.isFinite(item.end));
}