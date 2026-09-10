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
        <div className="w-full flex items-center justify-between px-4 sm:px-8 md:px-12 py-3.5">
          {/* Official Zaizub Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <ZaiZubLogo />
            <span className="text-white text-base font-bold tracking-tight font-display">Zaizub</span>
          </Link>

          {/* Profile Section Widget with Dropdown */}
          <ProfileCard displayName={displayName} email={user.email || ''} />
        </div>
      </header>
      <main className="flex-1">
        <MyVideoClient initialVideos={userVideos} userName={displayName} />
      </main>
    </div>
  );
}
