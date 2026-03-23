import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface SuccessStoryRow {
  id: number;
  couple_name_1: string;
  couple_name_2: string;
  couple_names: string;
  wedding_date: string;
  location: string;
  story_text?: string;
  couple_photo: string | null;
  status: "draft" | "published";
  is_featured: boolean;
  views_count: number;
  created_at: string;
  updated_at?: string;
}

export interface SuccessStorySummary {
  total_stories: number;
  published: number;
  drafts: number;
  total_views: number;
}

export interface SuccessStoriesListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: SuccessStoryRow[];
  summary?: SuccessStorySummary;
}

export async function fetchAdminSuccessStories(params?: {
  status?: "draft" | "published";
  search?: string;
  page?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));

  const qs = q.toString();
  const res = await adminRequest<SuccessStoriesListData>(
    qs ? `v1/admin/success-stories/?${qs}` : "v1/admin/success-stories/",
  );
  return unwrap(res);
}

export interface SuccessStoryUpsertPayload {
  couple_name_1: string;
  couple_name_2: string;
  wedding_date: string;
  location: string;
  story_text: string;
  status?: "draft" | "published";
  is_featured?: boolean;
  couple_photo?: File;
}

function toFormData(payload: Partial<SuccessStoryUpsertPayload>) {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "couple_photo" && value instanceof File) {
      fd.append(key, value);
      return;
    }
    fd.append(key, String(value));
  });
  return fd;
}

export async function createSuccessStory(payload: SuccessStoryUpsertPayload) {
  const res = await adminRequest<SuccessStoryRow>("v1/admin/success-stories/", {
    method: "POST",
    body: toFormData(payload),
  });
  return unwrap(res);
}

export async function updateSuccessStory(id: number, payload: Partial<SuccessStoryUpsertPayload>) {
  const res = await adminRequest<SuccessStoryRow>(`v1/admin/success-stories/${id}/`, {
    method: "PATCH",
    body: toFormData(payload),
  });
  return unwrap(res);
}

export async function deleteSuccessStory(id: number) {
  const res = await adminRequest<{ message?: string }>(`v1/admin/success-stories/${id}/`, {
    method: "DELETE",
  });
  return unwrap(res);
}
