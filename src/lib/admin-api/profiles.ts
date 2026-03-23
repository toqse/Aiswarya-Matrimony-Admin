import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface ProfileListRow {
  matri_id: string;
  name: string;
  gender: string;
  age: number;
  religion: string;
  caste: string;
  marital_status: string;
  plan: string;
  assigned_staff: string;
  verified: boolean;
  completion_percent: number;
  horoscope_available: boolean;
  is_active: boolean;
  is_blocked: boolean;
}

export interface ProfileListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProfileListRow[];
}

export type ProfilesQuery = {
  search?: string;
  gender?: "M" | "F" | "O";
  religion_id?: number;
  plan?: string;
  verified?: boolean;
  staff_id?: number;
  page?: number;
  show_inactive?: boolean;
};

function buildProfilesQuery(params?: ProfilesQuery): string {
  const q = new URLSearchParams();
  if (!params) return "";
  if (params.search) q.set("search", params.search);
  if (params.gender) q.set("gender", params.gender);
  if (params.religion_id != null) q.set("religion_id", String(params.religion_id));
  if (params.plan) q.set("plan", params.plan);
  if (params.verified != null) q.set("verified", String(params.verified));
  if (params.staff_id != null) q.set("staff_id", String(params.staff_id));
  if (params.page != null) q.set("page", String(params.page));
  if (params.show_inactive) q.set("show_inactive", "1");
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchAdminProfiles(params?: ProfilesQuery) {
  const res = await adminRequest<ProfileListData>(`v1/admin/profiles/${buildProfilesQuery(params)}`);
  return unwrap(res);
}

export async function fetchStaffProfiles(params?: ProfilesQuery) {
  const res = await adminRequest<ProfileListData>(`v1/staff/profiles/${buildProfilesQuery(params)}`);
  return unwrap(res);
}

export async function fetchAdminProfileDetail(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(`v1/admin/profiles/${encodeURIComponent(matriId)}/`);
  return unwrap(res);
}

export async function patchAdminProfile(matriId: string, body: Record<string, unknown>) {
  const res = await adminRequest<Record<string, unknown>>(`v1/admin/profiles/${encodeURIComponent(matriId)}/`, {
    method: "PATCH",
    body,
  });
  return unwrap(res);
}

export async function patchProfileVerify(matriId: string, verified?: boolean) {
  const body = verified == null ? {} : { verified };
  const res = await adminRequest<Record<string, unknown>>(`v1/admin/profiles/${encodeURIComponent(matriId)}/verify/`, {
    method: "PATCH",
    body,
  });
  return unwrap(res);
}

export async function patchProfileAssignStaff(matriId: string, staffId: number) {
  const res = await adminRequest<Record<string, unknown>>(`v1/admin/profiles/${encodeURIComponent(matriId)}/assign-staff/`, {
    method: "PATCH",
    body: { staff_id: staffId },
  });
  return unwrap(res);
}

export async function patchProfileBlock(matriId: string, blocked?: boolean) {
  const body = blocked == null ? {} : { blocked };
  const res = await adminRequest<Record<string, unknown>>(`v1/admin/profiles/${encodeURIComponent(matriId)}/block/`, {
    method: "PATCH",
    body,
  });
  return unwrap(res);
}

export async function deleteAdminProfile(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(`v1/admin/profiles/${encodeURIComponent(matriId)}/`, {
    method: "DELETE",
  });
  return unwrap(res);
}

