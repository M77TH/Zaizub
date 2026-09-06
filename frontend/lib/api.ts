// Keep the browser and API deployment-specific. Set NEXT_PUBLIC_API_URL in production;
// local development continues to use the FastAPI server on port 8000.
export const API_BASE_URL = (() => {
  if (typeof window !== "undefined") {
    // If browser is accessing localhost:3000, prefer local backend at port 8000
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
})();

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
