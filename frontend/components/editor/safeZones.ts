export type AspectRatioType = '16:9' | '9:16' | '1:1';

export type SafeZonePlatformId =
  | 'tiktok'
  | 'reels'
  | 'shorts'
  | 'universal'
  | 'youtube'
  | 'broadcast'
  | 'square';

export type RightRailGlyph =
  | 'avatar'
  | 'heart'
  | 'comment'
  | 'bookmark'
  | 'share'
  | 'disc'
  | 'more'
  | 'audio'
  | 'thumbUp'
  | 'thumbDown'
  | 'remix';

export interface SafeZoneMargins {
  /** Percentage of frame height reserved at the top edge. */
  top: number;
  /** Percentage of frame width reserved at the right edge. */
  right: number;
  /** Percentage of frame height reserved at the bottom edge. */
  bottom: number;
  /** Percentage of frame width reserved at the left edge. */
  left: number;
}

export interface SafeZonePreset {
  id: SafeZonePlatformId;
  name: string;
  shortName: string;
  aspectRatio: AspectRatioType;
  resolutionLabel: string;
  accentHex: string;
  description: string;
  safe: SafeZoneMargins;
  topBarLabel?: string;
  bottomBarLabel: string;
  rightRail?: {
    top: number;
    bottom: number;
    width: number;
    items: RightRailGlyph[];
  };
  secondaryGuide?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    label: string;
  };
}

export const SAFE_ZONE_PRESETS: Record<SafeZonePlatformId, SafeZonePreset> = {
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    shortName: 'TikTok',
    aspectRatio: '9:16',
    resolutionLabel: '1080×1920',
    accentHex: '#22d3ee',
    description: 'เว้นบน 8.5% · ล่าง 25% · ขวา 14%',
    safe: { top: 8.5, right: 14, bottom: 25, left: 5.5 },
    topBarLabel: 'Following  |  For You  ·  ค้นหา',
    bottomBarLabel: '@creator · แคปชัน 2 บรรทัด / แท็กเพลง / แถบเวลา',
    rightRail: {
      top: 38,
      bottom: 12,
      width: 13.5,
      items: ['avatar', 'heart', 'comment', 'bookmark', 'share', 'disc'],
    },
  },
  reels: {
    id: 'reels',
    name: 'Instagram Reels',
    shortName: 'Reels',
    aspectRatio: '9:16',
    resolutionLabel: '1080×1920',
    accentHex: '#f472b6',
    description: 'เว้นบน 12.5% · ล่าง 24% · ขวา 13%',
    safe: { top: 12.5, right: 13, bottom: 24, left: 5 },
    topBarLabel: 'Reels  ·  กล้อง',
    bottomBarLabel: '@creator · ติดตาม · แคปชัน · เพลง · เมนู IG',
    rightRail: {
      top: 47,
      bottom: 11,
      width: 12.5,
      items: ['heart', 'comment', 'share', 'more', 'audio'],
    },
    secondaryGuide: {
      top: 14.8,
      bottom: 14.8,
      label: '4:5 FEED CROP (หน้าโปรไฟล์/ฟีด)',
    },
  },
  shorts: {
    id: 'shorts',
    name: 'YouTube Shorts',
    shortName: 'Shorts',
    aspectRatio: '9:16',
    resolutionLabel: '1080×1920',
    accentHex: '#f87171',
    description: 'เว้นบน 11% · ล่าง 21% · ขวา 16%',
    safe: { top: 11, right: 16, bottom: 21, left: 4.5 },
    topBarLabel: 'Shorts  ·  ค้นหา  ·  ⋮',
    bottomBarLabel: '@channel · ติดตาม · ชื่อคลิป · แถบเล่นแดง',
    rightRail: {
      top: 35,
      bottom: 12.5,
      width: 15.5,
      items: ['thumbUp', 'thumbDown', 'comment', 'share', 'remix', 'audio'],
    },
  },
  universal: {
    id: 'universal',
    name: 'ทุกแอป (Universal 9:16)',
    shortName: 'ทุกแอป',
    aspectRatio: '9:16',
    resolutionLabel: '1080×1920',
    accentHex: '#a78bfa',
    description: 'ปลอดภัยร่วมกัน TikTok + Reels + Shorts',
    safe: { top: 13, right: 16, bottom: 25, left: 6 },
    topBarLabel: 'แถบหัวข้อแพลตฟอร์มแนวตั้ง',
    bottomBarLabel: '@creator · แคปชัน / ปุ่มติดตาม / เสียง (ทุกแอป)',
    rightRail: {
      top: 35,
      bottom: 11,
      width: 15.5,
      items: ['avatar', 'heart', 'comment', 'share', 'disc'],
    },
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube Player (16:9)',
    shortName: 'YouTube',
    aspectRatio: '16:9',
    resolutionLabel: '1920×1080',
    accentHex: '#f87171',
    description: 'เว้นแถบชื่อบน 10% · แถบเล่นล่าง 16% · ขอบ 5%',
    safe: { top: 10, right: 5, bottom: 16, left: 5 },
    topBarLabel: 'ชื่อวิดีโอ · Watch Later · Share',
    bottomBarLabel: 'Play · 0:00 / 1:00 · CC · ตั้งค่า · เต็มจอ',
  },
  broadcast: {
    id: 'broadcast',
    name: 'Title Safe (16:9 มาตรฐาน)',
    shortName: 'Title Safe',
    aspectRatio: '16:9',
    resolutionLabel: '1920×1080',
    accentHex: '#38bdf8',
    description: 'Action Safe 5% · Title Safe 10%',
    safe: { top: 10, right: 10, bottom: 10, left: 10 },
    topBarLabel: '80% TITLE SAFE AREA',
    bottomBarLabel: 'ขอบมาตรฐานงานวิดีโอ 16:9',
    secondaryGuide: {
      top: 5,
      right: 5,
      bottom: 5,
      left: 5,
      label: '90% ACTION SAFE',
    },
  },
  square: {
    id: 'square',
    name: 'Social Feed (1:1)',
    shortName: 'Feed 1:1',
    aspectRatio: '1:1',
    resolutionLabel: '1080×1080',
    accentHex: '#34d399',
    description: 'เว้นบน 7% · แถบควบคุมล่าง 14% · ขอบ 6%',
    safe: { top: 7, right: 6, bottom: 14, left: 6 },
    topBarLabel: 'ป้ายสถานะมุมจอ',
    bottomBarLabel: 'แถบควบคุมเล่นวิดีโอ / ปุ่มเสียง',
  },
};

export const DEFAULT_PLATFORM_BY_ASPECT: Record<AspectRatioType, SafeZonePlatformId> = {
  '9:16': 'tiktok',
  '16:9': 'youtube',
  '1:1': 'square',
};

export function getPresetsForAspectRatio(aspectRatio: AspectRatioType): SafeZonePreset[] {
  return Object.values(SAFE_ZONE_PRESETS).filter((p) => p.aspectRatio === aspectRatio);
}

export interface SafeZoneWarning {
  isOverlapping: boolean;
  edges: Array<'top' | 'bottom' | 'left' | 'right'>;
  message: string | null;
}

/**
 * Checks whether the subtitle anchor center infringes on a platform UI hazard margin.
 */
export function evaluateSubtitleSafeZone(
  posX: number,
  posY: number,
  preset: SafeZonePreset
): SafeZoneWarning {
  const edges: Array<'top' | 'bottom' | 'left' | 'right'> = [];

  if (posY < preset.safe.top + 1.5) edges.push('top');
  if (posY > 100 - preset.safe.bottom - 1.5) edges.push('bottom');
  if (posX < preset.safe.left + 4) edges.push('left');
  if (posX > 100 - preset.safe.right - 4) edges.push('right');

  if (edges.length === 0) {
    return { isOverlapping: false, edges, message: null };
  }

  const labelMap: Record<'top' | 'bottom' | 'left' | 'right', string> = {
    top: 'แถบด้านบน',
    bottom: 'แคปชัน/แถบล่าง',
    left: 'ขอบซ้าย',
    right: 'แถบปุ่มด้านขวา',
  };

  return {
    isOverlapping: true,
    edges,
    message: `ซับอาจถูกบัง (${edges.map((e) => labelMap[e]).join(', ')})`,
  };
}
