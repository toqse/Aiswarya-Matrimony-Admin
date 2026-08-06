const FALLBACK_API_BASE_URL = "https://api.aiswaryamatrimonials.com/api/";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? FALLBACK_API_BASE_URL;
