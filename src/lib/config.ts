const FALLBACK_API_BASE_URL = "http://localhost:8000/api/";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? FALLBACK_API_BASE_URL;
