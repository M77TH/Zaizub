import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions/auth';
import ZaiZubLogo from '@/components/logo/Logo-v3';
import MyVideoClient from '@/components/video/MyVideoClient';
import { VideoProject } from '@/components/video/VideoCard';

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
      .select('id, title, status, thumbnail_url, video_url, duration, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && userVideosData && userVideosData.length > 0) {
      userVideos = userVideosData.map((p) => ({
        id: p.id,
        title: p.title || 'Untitled Video',
        status: (p.status as 'done' | 'draft' | 'processing') || 'draft',
        thumbnail_url: p.thumbnail_url,
        video_url: p.video_url,
        duration: p.duration ? `${Math.floor(p.duration / 60)}:${Math.floor(p.duration % 60).toString().padStart(2, '0')}` : undefined,
        updated_at: new Date(p.updated_at).toLocaleDateString('th-TH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      }));
    }
  } catch (e) {
    // If table doesn't exist yet or query fails, userVideos stays []
  }

  return (
    <div
      className="min-h-screen bg-[#06050a] flex flex-col bg-cover bg-center bg-no-out bg-fixed"
      style={{ backgroundImage: "url('/page-bg.png')" }}
    >
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0c0b11]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          {/* Official Zaizub Logo */}
          <Link
            href="/my-video"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <ZaiZubLogo />
            <span className="text-white text-base font-bold tracking-tight font-display">Zaizub</span>
          </Link>

          {/* Profile Section Widget (Hidden) */}
          {/* <Link
            href="/profile"
            className="group flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-[#151322] border border-white/[0.08] hover:border-white/20 transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-[#8b5cf6] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_12px_rgba(139,92,246,0.4)] flex-shrink-0">
              {displayName ? displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : 'U'}
            </div>

            <div className="flex flex-col text-left max-w-[140px] sm:max-w-[180px]">
              <span className="text-xs font-semibold text-white truncate leading-tight group-hover:text-purple-300 transition-colors">
                {displayName}
              </span>
              <span className="text-[11px] text-zinc-400 truncate leading-tight">
                {user.email}
              </span>
            </div>

            <svg
              className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors ml-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link> */}
        </div>
      </header>
      <main className="flex-1">
        <MyVideoClient initialVideos={userVideos} userName={displayName} />
      </main>
    </div>
  );
}
