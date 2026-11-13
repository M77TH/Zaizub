'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiUrl } from '@/lib/api';
import {
  buildSubtitlesEnvelope,
  extractProjectEnvelope,
  isValidUuid,
  mapVideoRowToProject,
  normalizeOptionalUrl,
  normalizeProjectStatus,
  parseDurationSeconds,
} from '@/lib/projects/projectMapper';

export interface SaveProjectPayload {
  id?: string;
  title: string;
  status?: 'draft' | 'done' | 'processing';
  duration?: string | number;
  video_url?: string;
  video_filename?: string;
  thumbnail_url?: string;
  subtitles: unknown[];
  styles: object;
}

function extractStoragePath(url?: string | null): string | null {
  if (!url) return null;
  const clean = url.split('?')[0].split('#')[0].trim();
  if (!clean || /^(blob:|data:)/i.test(clean)) {
    return null;
  }

  const bucketMatch = clean.match(
    /\/storage\/v1\/object\/(?:public|sign|authenticated)\/videos\/(.+)$/i
  );
  if (bucketMatch?.[1]) {
    try {
      return decodeURIComponent(bucketMatch[1]);
    } catch {
      return bucketMatch[1];
    }
  }

  const shortMatch = clean.match(/\/videos\/([^/?#]+)$/);
  if (shortMatch?.[1]) {
    try {
      return decodeURIComponent(shortMatch[1]);
    } catch {
      return shortMatch[1];
    }
  }

  const filename = clean.split('/').pop();
  if (
    filename &&
    /^(prev_|thumb_).+\.(mp4|mov|webm|mkv|avi|m4v|jpg|jpeg|png|webp)$/i.test(
      filename
    )
  ) {
    return filename;
  }

  return null;
}

/**
 * Saves or updates a project in Supabase `videos` table for the authenticated user.
 */
export async function saveProjectAction(payload: SaveProjectPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนบันทึกงาน' };
  }

  const rawId = typeof payload.id === 'string' ? payload.id.trim() : '';
  if (rawId && !isValidUuid(rawId)) {
    return { error: 'รหัสโปรเจกต์ไม่ถูกต้อง' };
  }

  try {
    const subtitlesEnvelope = buildSubtitlesEnvelope(
      payload.subtitles,
      payload.styles,
      payload.video_filename
    );
    const parsedDuration = parseDurationSeconds(payload.duration);
    const nowIso = new Date().toISOString();
    const safeTitle =
      typeof payload.title === 'string' && payload.title.trim()
        ? payload.title.trim()
        : 'โปรเจกต์ไม่มีชื่อ';

    if (rawId) {
      const updateData: Record<string, unknown> = {
        title: safeTitle,
        subtitles: subtitlesEnvelope,
        updated_at: nowIso,
      };

      if (payload.status !== undefined) {
        updateData.status = normalizeProjectStatus(payload.status);
      }
      if (typeof payload.video_url === 'string') {
        // `videos.video_url` is NOT NULL in Supabase; persist trimmed string ("" when unset)
        updateData.video_url = payload.video_url.trim();
      }
      if (payload.thumbnail_url !== undefined) {
        updateData.thumbnail_url = normalizeOptionalUrl(payload.thumbnail_url);
      }
      if (parsedDuration !== undefined) {
        updateData.duration = parsedDuration;
      }

      const { data, error } = await supabase
        .from('videos')
        .update(updateData)
        .eq('id', rawId)
        .eq('user_id', user.id)
        .select('id, status')
        .maybeSingle();

      if (error) {
        console.error('Supabase saveProjectAction update error:', error);
        return { error: error.message };
      }
      if (!data) {
        return { error: 'ไม่พบโปรเจกต์หรือไม่มีสิทธิ์แก้ไขโปรเจกต์นี้' };
      }

      revalidatePath('/my-video');
      return {
        success: true,
        projectId: data.id,
        status: normalizeProjectStatus(data.status),
      };
    }

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      title: safeTitle,
      status: normalizeProjectStatus(payload.status ?? 'draft'),
      video_url: typeof payload.video_url === 'string' ? payload.video_url.trim() : '',
      thumbnail_url: normalizeOptionalUrl(payload.thumbnail_url),
      subtitles: subtitlesEnvelope,
      updated_at: nowIso,
    };

    if (parsedDuration !== undefined) {
      insertData.duration = parsedDuration;
    }

    const { data, error } = await supabase
      .from('videos')
      .insert(insertData)
      .select('id, status')
      .single();

    if (error || !data) {
      console.error('Supabase saveProjectAction insert error:', error);
      return { error: error?.message || 'บันทึกข้อมูลล้มเหลว' };
    }

    revalidatePath('/my-video');
    return {
      success: true,
      projectId: data.id,
      status: normalizeProjectStatus(data.status),
    };
  } catch (err: unknown) {
    console.error('Failed to save project:', err);
    return {
      error: err instanceof Error ? err.message : 'บันทึกข้อมูลล้มเหลว',
    };
  }
}

/**
 * Deletes a project row from Supabase first, then purges unreferenced media
 * from Supabase Storage and backend temporary storage.
 */
export async function deleteProjectAction(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const trimmedId = typeof projectId === 'string' ? projectId.trim() : '';
  if (!isValidUuid(trimmedId)) {
    return { error: 'Invalid project ID' };
  }

  try {
    // 1. Locate media references before deleting the DB row
    const { data: project, error: fetchErr } = await supabase
      .from('videos')
      .select('video_url, thumbnail_url')
      .eq('id', trimmedId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchErr) {
      return { error: fetchErr.message };
    }
    if (!project) {
      return { error: 'Project not found' };
    }

    // 2. Delete DB record first so storage is never removed ahead of a failed DB delete
    const { data: deletedRow, error: deleteErr } = await supabase
      .from('videos')
      .delete()
      .eq('id', trimmedId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (deleteErr) {
      return { error: deleteErr.message };
    }
    if (!deletedRow) {
      return { error: 'Project not found or permission denied' };
    }

    // 3. Remove storage objects only if no remaining project references the same URL
    const adminClient = createAdminClient();
    const refClient = adminClient ?? supabase;
    const filesToRemove: string[] = [];
    const urlsToRemove: string[] = [];

    if (project.video_url) {
      const { count } = await refClient
        .from('videos')
        .select('id', { count: 'exact', head: true })
        .eq('video_url', project.video_url);
      if (!count || count === 0) {
        urlsToRemove.push(project.video_url);
        const path = extractStoragePath(project.video_url);
        if (path) filesToRemove.push(path);
      }
    }

    if (project.thumbnail_url) {
      const { count } = await refClient
        .from('videos')
        .select('id', { count: 'exact', head: true })
        .eq('thumbnail_url', project.thumbnail_url);
      if (!count || count === 0) {
        urlsToRemove.push(project.thumbnail_url);
        const path = extractStoragePath(project.thumbnail_url);
        if (path) filesToRemove.push(path);
      }
    }

    const uniqueFiles = Array.from(new Set(filesToRemove));

    if (adminClient && uniqueFiles.length > 0) {
      try {
        const { error: storageErr } = await adminClient.storage
          .from('videos')
          .remove(uniqueFiles);
        if (storageErr) {
          console.warn('Admin storage file removal notice:', storageErr);
        }
      } catch (adminErr) {
        console.warn('Supabase storage admin removal exception:', adminErr);
      }
    }

    if (urlsToRemove.length > 0 || uniqueFiles.length > 0) {
      try {
        await fetch(apiUrl('/api/v1/delete-media'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urls: urlsToRemove,
            paths: uniqueFiles,
          }),
          signal: AbortSignal.timeout(5000),
        });
      } catch (backendErr) {
        console.warn('Backend delete-media call notice:', backendErr);
      }
    }

    revalidatePath('/my-video');
    return { success: true };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Failed to delete project',
    };
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

  const trimmedId = typeof projectId === 'string' ? projectId.trim() : '';
  if (!isValidUuid(trimmedId)) {
    return { error: 'Invalid project ID' };
  }

  const cleanTitle = typeof newTitle === 'string' ? newTitle.trim() : '';
  if (!cleanTitle) {
    return { error: 'กรุณาระบุชื่อโปรเจกต์' };
  }

  try {
    const { data, error } = await supabase
      .from('videos')
      .update({ title: cleanTitle, updated_at: new Date().toISOString() })
      .eq('id', trimmedId)
      .eq('user_id', user.id)
      .select('id, title')
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }
    if (!data) {
      return { error: 'Project not found' };
    }

    revalidatePath('/my-video');
    return { success: true, title: data.title };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Failed to rename project',
    };
  }
}

/**
 * Duplicates a project in Supabase, preserving styles and returning full card metadata.
 */
export async function duplicateProjectAction(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const trimmedId = typeof projectId === 'string' ? projectId.trim() : '';
  if (!isValidUuid(trimmedId)) {
    return { error: 'Invalid project ID' };
  }

  try {
    const { data: original, error: fetchErr } = await supabase
      .from('videos')
      .select('id, title, video_url, thumbnail_url, duration, subtitles')
      .eq('id', trimmedId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchErr) {
      return { error: fetchErr.message };
    }
    if (!original) {
      return { error: 'Project not found' };
    }

    const envelope = extractProjectEnvelope(original.subtitles);
    const normalizedEnvelope = buildSubtitlesEnvelope(
      envelope.items,
      envelope.styles,
      envelope.video_filename
    );
    const nowIso = new Date().toISOString();
    const baseTitle =
      typeof original.title === 'string' && original.title.trim()
        ? original.title.trim()
        : 'Untitled Video';
    const parsedDuration = parseDurationSeconds(original.duration);

    const { data: inserted, error: insertErr } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        title: `${baseTitle} (สำเนา)`,
        status: 'draft',
        video_url:
          typeof original.video_url === 'string' ? original.video_url.trim() : '',
        thumbnail_url: normalizeOptionalUrl(original.thumbnail_url),
        ...(parsedDuration !== undefined ? { duration: parsedDuration } : {}),
        subtitles: normalizedEnvelope,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select('id, title, status, thumbnail_url, video_url, duration, subtitles, updated_at')
      .single();

    if (insertErr || !inserted) {
      return { error: insertErr?.message || 'Failed to duplicate project' };
    }

    revalidatePath('/my-video');
    return {
      success: true,
      project: mapVideoRowToProject(inserted),
    };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Failed to duplicate project',
    };
  }
}
