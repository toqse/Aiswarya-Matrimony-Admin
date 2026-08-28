import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface TestimonialRow {
  id: number;
  name: string;
  role: string;
  review: string;
  rating: number;
  avatar: string | null;
  status: "draft" | "published";
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

export interface TestimonialSummary {
  total_testimonials: number;
  published: number;
  drafts: number;
}

export interface TestimonialsListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: TestimonialRow[];
  summary?: TestimonialSummary;
}

export async function fetchAdminTestimonials(params?: {
  status?: "draft" | "published";
  search?: string;
  page?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));

  const qs = q.toString();
  const res = await adminRequest<TestimonialsListData>(
    qs ? `v1/admin/testimonials/?${qs}` : "v1/admin/testimonials/",
  );
  return unwrap(res);
}

export interface TestimonialUpsertPayload {
  name: string;
  role: string;
  review: string;
  rating?: number;
  status?: "draft" | "published";
  sort_order?: number;
  avatar?: File;
}

function toFormData(payload: Partial<TestimonialUpsertPayload>) {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "avatar" && value instanceof File) {
      fd.append(key, value);
      return;
    }
    fd.append(key, String(value));
  });
  return fd;
}

export async function createTestimonial(payload: TestimonialUpsertPayload) {
  const res = await adminRequest<TestimonialRow>("v1/admin/testimonials/", {
    method: "POST",
    body: toFormData(payload),
  });
  return unwrap(res);
}

export async function updateTestimonial(id: number, payload: Partial<TestimonialUpsertPayload>) {
  const res = await adminRequest<TestimonialRow>(`v1/admin/testimonials/${id}/`, {
    method: "PATCH",
    body: toFormData(payload),
  });
  return unwrap(res);
}

export async function deleteTestimonial(id: number) {
  const res = await adminRequest<{ message?: string }>(`v1/admin/testimonials/${id}/`, {
    method: "DELETE",
  });
  return unwrap(res);
}
