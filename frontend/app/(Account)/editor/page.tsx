import { createClient } from '@/lib/supabase/server';
import EditorWorkspace from '@/components/editor/EditorWorkspace';
import { redirect } from 'next/navigation';

interface EditorPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const { id } = await searchParams;
  let initialProject = null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login'); 
  }

  if (id) {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id) 
        .maybeSingle();

      if (error || !data) {
        console.warn('Unauthorized or Project not found');
        redirect('/my-video');
      }
      
      initialProject = data;
      
    } catch (e) {
      console.warn('Failed to load project from Supabase:', e);
      redirect('/my-video');
    }
  } else {
    redirect('/my-video');
  }

  return <EditorWorkspace initialProject={initialProject} />;
}
