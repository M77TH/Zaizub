export interface PendingUploadJob {
  id: string;
  mode: 'file' | 'link';
  title: string;
  file?: Blob;
  fileName?: string;
  fileType?: string;
  url?: string;
  durationSeconds?: number;
  createdAt: number;
}

export interface EnqueueUploadInput {
  mode: 'file' | 'link';
  title: string;
  file?: File | Blob;
  fileName?: string;
  fileType?: string;
  url?: string;
  durationSeconds?: number;
}

const DB_NAME = 'zaizub_upload_queue_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_uploads';
const LINK_FALLBACK_KEY = 'zaizub_pending_link_queue';

function openQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open queue DB'));
  });
}

function readLinkFallbackQueue(): PendingUploadJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(LINK_FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLinkFallbackQueue(jobs: PendingUploadJob[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (jobs.length === 0) {
      sessionStorage.removeItem(LINK_FALLBACK_KEY);
    } else {
      sessionStorage.setItem(LINK_FALLBACK_KEY, JSON.stringify(jobs));
    }
  } catch {
    // Ignore storage quota / privacy mode failures
  }
}

export function deriveTitleFromLink(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const lastSegment = parsed.pathname.split('/').filter(Boolean).pop();
    if (lastSegment && lastSegment !== 'watch' && lastSegment.length > 2) {
      return decodeURIComponent(lastSegment).replace(/\.[^/.]+$/, '').slice(0, 80);
    }
    return `วิดีโอจาก ${parsed.hostname.replace(/^www\./, '')}`;
  } catch {
    return 'โปรเจกต์จากลิงก์วิดีโอ';
  }
}

export async function enqueuePendingUpload(input: EnqueueUploadInput): Promise<PendingUploadJob> {
  const job: PendingUploadJob = {
    id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode: input.mode,
    title: input.title,
    file: input.file,
    fileName: input.fileName,
    fileType: input.fileType,
    url: input.url,
    durationSeconds: input.durationSeconds,
    createdAt: Date.now(),
  };

  try {
    const db = await openQueueDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(job);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to enqueue upload'));
      tx.onabort = () => reject(tx.error ?? new Error('Queue transaction aborted'));
    });
    db.close();
    return job;
  } catch (err) {
    if (job.mode === 'link') {
      const existing = readLinkFallbackQueue();
      writeLinkFallbackQueue([...existing, job]);
      return job;
    }
    throw err;
  }
}

export async function getPendingUploads(): Promise<PendingUploadJob[]> {
  const fallback = readLinkFallbackQueue();

  try {
    const db = await openQueueDb();
    const idbJobs = await new Promise<PendingUploadJob[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? (req.result as PendingUploadJob[]) : []);
      req.onerror = () => reject(req.error ?? new Error('Failed to read queue DB'));
    });
    db.close();

    const byId = new Map<string, PendingUploadJob>();
    for (const item of [...idbJobs, ...fallback]) {
      byId.set(item.id, item);
    }
    return Array.from(byId.values()).sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return fallback.sort((a, b) => a.createdAt - b.createdAt);
  }
}

export async function removePendingUpload(id: string): Promise<void> {
  const fallback = readLinkFallbackQueue();
  if (fallback.some((item) => item.id === id)) {
    writeLinkFallbackQueue(fallback.filter((item) => item.id !== id));
  }

  try {
    const db = await openQueueDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to remove queued upload'));
    });
    db.close();
  } catch {
    // Ignore cleanup errors if IndexedDB isn't available
  }
}
