import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ZaiZubLogo from '@/components/logo/Logo-v3';
import MyVideoClient from '@/components/video/MyVideoClient';
import { VideoProject } from '@/components/video/VideoCard';
import ProfileCard from '@/components/account/ProfileCard';

export default async function MyVideoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/my-video');
  }

  // Fetch user profile for navbar
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';

  // Fetch projects from Supabase
  let userVideos: VideoProject[] = [];

  try {
    const { data: userVideosData, error } = await supabase
      .from('videos')
      .select('id, title, status, thumbnail_url, video_url, duration, subtitles, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && userVideosData && userVideosData.length > 0) {
      interface RawProjectRow {
        id: string;
        title?: string | null;
        status?: string | null;
        thumbnail_url?: string | null;
        video_url?: string | null;
        duration?: number | null;
        updated_at: string;
        subtitles?:
          | Array<{ text?: string }>
          | {
              items?: Array<{ text?: string }>;
              styles?: { aspect_ratio?: string; preset_mode?: string };
            }
          | null;
      }

      userVideos = (userVideosData as RawProjectRow[]).map((p) => {
        const rawSubs = p.subtitles;
        const items = Array.isArray(rawSubs)
          ? rawSubs
          : Array.isArray(rawSubs?.items)
          ? rawSubs.items
          : [];
        const savedStyles = rawSubs && !Array.isArray(rawSubs) ? rawSubs.styles : undefined;
        const aspect = savedStyles?.aspect_ratio;
        const presetMode = savedStyles?.preset_mode;
        const presetMap: Record<string, string> = {
          tiktok: 'TIKTOK',
          badge: 'BADGE',
          karaoke: 'NEON',
          danger: 'HOOK',
          frosted: 'FROST',
          minimal: 'MINIMAL',
          warm: 'PODCAST',
          cinema: 'CINEMA',
        };
        const firstText = typeof items[0]?.text === 'string' ? items[0].text.trim() : '';

        return {
          id: p.id,
          title: p.title || 'Untitled Video',
          status: (p.status as 'done' | 'draft' | 'processing') || 'draft',
          thumbnail_url: p.thumbnail_url ?? undefined,
          video_url: p.video_url ?? undefined,
          duration: p.duration
            ? `${Math.floor(p.duration / 60)}:${Math.floor(p.duration % 60).toString().padStart(2, '0')}`
            : undefined,
          aspectRatio:
            aspect === '9:16' || aspect === '16:9' || aspect === '1:1' ? aspect : undefined,
          captionCount: items.length > 0 ? items.length : undefined,
          presetLabel: presetMode ? presetMap[String(presetMode)] || String(presetMode).toUpperCase() : undefined,
          sampleLine: firstText ? firstText.slice(0, 64) : undefined,
          updated_at: new Date(p.updated_at).toLocaleDateString('th-TH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        };
      });
    }
  } catch {
    // If table doesn't exist yet or query fails, userVideos stays []
  }

  return (
    <div className="relative min-h-screen bg-[#070709] text-zinc-100 flex flex-col overflow-x-clip">
      <header className="sticky top-0 z-40 h-14 border-b border-[#1c1b24] bg-[#070709]/95 backdrop-blur-md">
        <div className="w-full max-w-[1480px] h-full mx-auto flex items-center justify-between px-4 sm:px-8 md:px-10">
          {/* Brand Wordmark + Archive Identifier */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
            >
              <ZaiZubLogo size={26} />
              <span className="font-display text-[15px] font-extrabold tracking-tight text-white">
                Zaizub
              </span>
            </Link>
            <span className="text-zinc-700 font-mono text-xs select-none">/</span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Archive
            </span>
          </div>

          {/* Profile Switcher */}
          <ProfileCard displayName={displayName} email={user.email || ''} />
        </div>
      </header>
      <main className="relative z-10 flex-1">
        <MyVideoClient initialVideos={userVideos} userName={displayName} />
      </main>
    </div>
  );
}
