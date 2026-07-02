import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface NewsletterSubscriberRow {
  id: number;
  email: string;
  source: string;
  is_active: boolean;
  subscribed_at: string;
  updated_at: string;
}

export interface NewsletterListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: NewsletterSubscriberRow[];
  summary?: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface NewsletterListFilters {
  search?: string;
  is_active?: "true" | "false";
  page?: number;
  page_size?: number;
}

function toQs(params?: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v));
    });
  }
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchNewsletterSubscribers(filters?: NewsletterListFilters) {
  const res = await adminRequest<NewsletterListData>(`v1/admin/newsletter/${toQs(filters)}`);
  const payload = await unwrap(res);
  return {
    count: typeof payload?.count === "number" ? payload.count : 0,
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
    results: Array.isArray(payload?.results) ? payload.results : [],
    summary: payload?.summary,
  };
}
