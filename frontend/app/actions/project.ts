'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiUrl } from '@/lib/api';

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
/**
 * Deletes a project by ID from Supabase and purges preview video and thumbnail
 * from Supabase Storage and temporary server storage.
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
    // 1. Fetch the project to locate files stored in Supabase Storage
    const { data: project, error: fetchErr } = await supabase
      .from('videos')
      .select('video_url, thumbnail_url')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      console.warn('Notice locating project files for deletion:', fetchErr);
    }

    // 2. Remove files from Supabase Storage 'videos' bucket to reclaim free quota
    if (project) {
      const filesToRemove: string[] = [];
      const urlsToRemove: string[] = [];

      // Protect duplicated projects: only delete files if not referenced by another project
      let canDeleteVideo = Boolean(project.video_url);
      let canDeleteThumb = Boolean(project.thumbnail_url);

      if (canDeleteVideo && project.video_url) {
        const { count } = await supabase
          .from('videos')
          .select('id', { count: 'exact', head: true })
          .eq('video_url', project.video_url)
          .neq('id', projectId);
        if (count && count > 0) canDeleteVideo = false;
      }

      if (canDeleteThumb && project.thumbnail_url) {
        const { count } = await supabase
          .from('videos')
          .select('id', { count: 'exact', head: true })
          .eq('thumbnail_url', project.thumbnail_url)
          .neq('id', projectId);
        if (count && count > 0) canDeleteThumb = false;
      }

      const extractStoragePath = (url?: string | null) => {
        if (!url) return null;
        const clean = url.split('?')[0].split('#')[0].trim();
        // Match Supabase storage URL pattern: .../videos/<filename>
        const match = clean.match(/\/videos\/([^/?#]+)$/);
        if (match) {
          return decodeURIComponent(match[1]);
        }
        // Direct filename match: prev_xxx.mp4 or thumb_xxx.jpg
        const filename = clean.split('/').pop();
        if (filename && /^(prev_|thumb_).+\.(mp4|jpg|jpeg|png|webp)$/i.test(filename)) {
          return filename;
        }
        return null;
      };

      if (canDeleteVideo && project.video_url) {
        urlsToRemove.push(project.video_url);
        const path = extractStoragePath(project.video_url);
        if (path) filesToRemove.push(path);
      }

      if (canDeleteThumb && project.thumbnail_url) {
        urlsToRemove.push(project.thumbnail_url);
        const path = extractStoragePath(project.thumbnail_url);
        if (path) filesToRemove.push(path);
      }

      const uniqueFiles = Array.from(new Set(filesToRemove));

      // Layer 1: Attempt deletion directly via Admin Client (service_role key)
      const adminClient = createAdminClient();
      if (adminClient && uniqueFiles.length > 0) {
        try {
          const { data, error: storageErr } = await adminClient.storage
            .from('videos')
            .remove(uniqueFiles);
          if (storageErr) {
            console.warn('Admin storage file removal notice:', storageErr);
          } else {
            console.log('Successfully purged files from Supabase Storage:', data);
          }
        } catch (adminErr) {
          console.warn('Supabase storage admin removal exception:', adminErr);
        }
      }

      // Layer 2: Call backend API to purge storage with backend service role key and clean temp_storage
      try {
        await fetch(apiUrl('/api/v1/delete-media'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urls: urlsToRemove,
            paths: uniqueFiles,
          }),
        });
      } catch (backendErr) {
        console.warn('Backend delete-media call notice:', backendErr);
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
