import { API_BASE_URL } from "@/lib/config";

export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/?$/, "/");
  const p = path.replace(/^\//, "");
  return `${base}${p}`;
}
