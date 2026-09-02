import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";
import { getAuthApiErrorMessage } from "@/lib/auth-api";

export interface PlanRow {
  id: number;
  name: string;
  price: string;
  duration_days: number;
  interest_limit: number;
  contact_view_limit: number;
  chat_limit: number;
  horoscope_match_limit: number;
  profile_view_limit: number;
  has_horoscope: boolean;
  is_highlighted: boolean;
  is_published: boolean;
  is_active: boolean;
  subscriber_count: number;
  description: string;
  created_at: string;
}

export async function fetchPlans() {
  const res = await adminRequest<PlanRow[]>("v1/admin/plans/");
  return unwrap(res);
}

export async function createPlan(body: Record<string, unknown>) {
  const res = await adminRequest<PlanRow>("v1/admin/plans/", { method: "POST", body });
  return unwrap(res);
}

export async function updatePlan(id: number, body: Record<string, unknown>) {
  const res = await adminRequest<PlanRow>(`v1/admin/plans/${id}/`, { method: "PATCH", body });
  return unwrap(res);
}

export async function togglePlanStatus(id: number) {
  const res = await adminRequest<never>(`v1/admin/plans/${id}/toggle-status/`, { method: "PATCH" });
  const raw = res.data as unknown as { success?: boolean; error?: { message?: string } };
  if (!res.ok || raw.success === false) throw new Error(getAuthApiErrorMessage(res.data));
  return res.data;
}

export async function togglePlanPublish(id: number) {
  const res = await adminRequest<never>(`v1/admin/plans/${id}/toggle-publish/`, { method: "PATCH" });
  const raw = res.data as unknown as { success?: boolean; error?: { message?: string } };
  if (!res.ok || raw.success === false) throw new Error(getAuthApiErrorMessage(res.data));
  return res.data;
}
