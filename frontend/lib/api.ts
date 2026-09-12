// Keep the browser and API deployment-specific. Set NEXT_PUBLIC_API_URL in production;
// local development continues to use the FastAPI server on port 8000.
import { createClient } from "@/lib/supabase/client";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

  // ฟังก์ชันเพื่อดึง token ของผู้ใช้ที่ล็อกอินอยู่
export async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}


  // ฟังก์ชันสำหรับเรียก API พร้อมการแนบ token ของผู้ใช้ที่ล็อกอินอยู่

export async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});

  // ตั้งค่า Content-Type เป็น JSON หากไม่ได้กำหนดไว้
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // แนบ Bearer Token หากมีการล็อกอิน
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}