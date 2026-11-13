// Keep the browser and API deployment-specific. Set NEXT_PUBLIC_API_URL in production;
// local development continues to use the FastAPI server on port 8000.
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolveMediaUrl(url?: string | null): string {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) return "";
  if (/^(https?:|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }
  return apiUrl(trimmed);
}
