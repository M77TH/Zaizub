'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface SaveProjectPayload {
  id?: string;
  title: string;
  status?: 'draft' | 'done' | 'processing';
  duration?: string;
  video_url?: string;
  video_filename?: string;
  thumbnail_url?: string;
  subtitles: any[];
  styles: any;
}

/**
 * Saves or updates a project in Supabase with user authentication.
 */
export async function saveProjectAction(payload: SaveProjectPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนบันทึกงาน' };
  }

  try {
    // Note: Table 'videos' contains: id, user_id, title, status, video_url, thumbnail_url, duration, subtitles, created_at, updated_at
    // If styles are provided, we bundle them into the subtitles JSONB or omit them so Supabase doesn't reject with 42703 (column does not exist)
    let subtitlesPayload = payload.subtitles ?? [];
    if (payload.styles && Object.keys(payload.styles).length > 0) {
      if (Array.isArray(subtitlesPayload)) {
        subtitlesPayload = {
          items: subtitlesPayload,
          styles: payload.styles,
          video_filename: payload.video_filename,
        } as any;
      }
    }

    const projectData: any = {
      user_id: user.id,
      title: payload.title || 'โปรเจกต์ไม่มีชื่อ',
      status: payload.status || 'draft',
      video_url: payload.video_url,
      thumbnail_url: payload.thumbnail_url || null,
      subtitles: subtitlesPayload,
      updated_at: new Date().toISOString(),
    };

    if (payload.duration) {
      if (typeof payload.duration === 'string' && payload.duration.includes(':')) {
        const parts = payload.duration.split(':');
        const mins = parseFloat(parts[0]) || 0;
        const secs = parseFloat(parts[1]) || 0;
        projectData.duration = mins * 60 + secs;
      } else {
        const numDur = parseFloat(payload.duration as string);
        if (!isNaN(numDur)) {
          projectData.duration = numDur;
        }
      }
    }

    if (payload.id && payload.id.length > 10) {
      projectData.id = payload.id;
    }

    const { data, error } = await supabase
      .from('videos')
      .upsert(projectData)
      .select('id')
      .single();

    if (error) {
      console.error('Supabase saveProjectAction error:', error);
      return { error: error.message };
    }

    revalidatePath('/my-video');
    return { success: true, projectId: data?.id };
  } catch (err: any) {
    console.error('Failed to save project:', err);
    return { error: err.message || 'บันทึกข้อมูลล้มเหลว' };
  }
}

/**
 * Deletes a project by ID from Supabase.
 */
export async function deleteProjectAction(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  try {
    // 1. First fetch the project to locate any files stored in Supabase Storage
    const { data: project } = await supabase
      .from('videos')
      .select('video_url, thumbnail_url')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    // 2. Remove files from Supabase Storage 'videos' bucket to reclaim free quota
    if (project) {
      const filesToRemove: string[] = [];

      const extractStoragePath = (url?: string | null) => {
        if (!url) return null;
        // Match Supabase storage URL pattern: .../object/public/videos/<file_path>
        const match = url.match(/\/object\/public\/videos\/(.+)$/);
        return match ? decodeURIComponent(match[1]) : null;
      };

      const videoPath = extractStoragePath(project.video_url);
      const thumbPath = extractStoragePath(project.thumbnail_url);

      if (videoPath) filesToRemove.push(videoPath);
      if (thumbPath) filesToRemove.push(thumbPath);

      if (filesToRemove.length > 0) {
        try {
          await supabase.storage.from('videos').remove(filesToRemove);
        } catch (storageErr) {
          console.warn('Supabase storage file removal notice:', storageErr);
        }
      }
    }

    // 3. Delete database record
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/my-video');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Renames a project in Supabase.
 */
export async function renameProjectAction(projectId: string, newTitle: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  try {
    const { error } = await supabase
      .from('videos')
      .update({ title: newTitle, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/my-video');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Duplicates a project in Supabase.
 */
export async function duplicateProjectAction(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  try {
    const { data: original, error: fetchErr } = await supabase
      .from('videos')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !original) {
      return { error: fetchErr?.message || 'Project not found' };
    }

    const { id, created_at, ...rest } = original;
    const { error: insertErr } = await supabase.from('videos').insert({
      ...rest,
      title: `${original.title} (สำเนา)`,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertErr) {
      return { error: insertErr.message };
    }

    revalidatePath('/my-video');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
