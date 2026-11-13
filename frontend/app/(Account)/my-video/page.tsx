import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ZaiZubLogo from '@/components/logo/Logo-v3';
import MyVideoClient from '@/components/video/MyVideoClient';
import { VideoProject } from '@/components/video/VideoCard';
import ProfileCard from '@/components/account/ProfileCard';
import {
  mapVideoRowToProject,
  RawVideoRow,
  resolveUserDisplayName,
} from '@/lib/projects/projectMapper';

export default async function MyVideoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/my-video');
  }

  // Fetch user profile for navbar
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.warn('Unable to load user profile:', profileError.message);
  }

  const displayName = resolveUserDisplayName(profile, user);

  // Fetch projects from Supabase
  let userVideos: VideoProject[] = [];

  try {
    const { data: userVideosData, error } = await supabase
      .from('videos')
      .select('id, title, status, thumbnail_url, video_url, duration, subtitles, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Unable to load user videos:', error.message);
    } else if (userVideosData && userVideosData.length > 0) {
      userVideos = (userVideosData as RawVideoRow[]).map(mapVideoRowToProject);
    }
  } catch (err) {
    console.warn('Unexpected error loading user videos:', err);
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
              My Video
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
