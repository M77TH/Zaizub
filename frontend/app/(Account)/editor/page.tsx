import { createClient } from '@/lib/supabase/server';
import EditorWorkspace from '@/components/editor/EditorWorkspace';

interface EditorPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const { id } = await searchParams;
  let initialProject = null;

  if (id) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        initialProject = data;
      }
    } catch (e) {
      console.warn('Failed to load project from Supabase:', e);
    }
  }

  return <EditorWorkspace initialProject={initialProject} />;
}
