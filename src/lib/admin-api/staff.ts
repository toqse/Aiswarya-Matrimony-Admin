import { adminRequest, adminFetchBlob, downloadBlob } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";
import { getAuthApiErrorMessage } from "@/lib/auth-api";

export interface StaffListRow {
  id: number;
  emp_code: string;
  name: string;
  profile_photo?: string | null;
  branch: number;
  branch_name: string;
  designation: string;
  basic_salary: string;
  commission_rate: string;
  target_progress: { achieved: number; target: number };
  status: string;
  is_active: boolean;
  account_role?: string;
}

export interface StaffListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: StaffListRow[];
}

export async function fetchAdminStaffList(params?: {
  search?: string;
  branch_id?: number;
  status?: "active" | "inactive" | "deactivated";
  page?: number;
  page_size?: number;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.branch_id != null) q.set("branch_id", String(params.branch_id));
  if (params?.status) q.set("status", params.status);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<StaffListData>(qs ? `v1/admin/staff/?${qs}` : "v1/admin/staff/");
  return unwrap(res);
}

export async function fetchBranchStaffList(params?: {
  search?: string;
  status?: "active" | "inactive" | "deactivated";
  branch_id?: number;
  page?: number;
  page_size?: number;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.status) q.set("status", params.status);
  if (params?.branch_id != null) q.set("branch_id", String(params.branch_id));
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<StaffListData>(qs ? `v1/branch/staff/?${qs}` : "v1/branch/staff/");
  return unwrap(res);
}

export interface StaffCreateBody {
  name: string;
  mobile: string;
  email?: string;
  role: "staff" | "branch_manager";
  branch: number;
  designation: string;
  department?: string;
  joining_date?: string;
  basic_salary: number;
  commission_rate: number;
  monthly_target: number;
  pf_number?: string;
  esi_number?: string;
  street_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
  login_username?: string;
  password?: string;
}

export async function createStaff(body: StaffCreateBody | FormData) {
  const res = await adminRequest<Record<string, unknown>>("v1/admin/staff/", { method: "POST", body });
  return unwrap(res);
}

export async function updateStaff(id: number, body: Partial<StaffCreateBody> | FormData) {
  const res = await adminRequest<Record<string, unknown>>(`v1/admin/staff/${id}/`, { method: "PATCH", body });
  return unwrap(res);
}

export async function deleteStaff(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/staff/${id}/`, { method: "DELETE" });
  if (!res.ok || res.data.success === false) throw new Error(getAuthApiErrorMessage(res.data));
}

/** API returns `{ success, status }` at top level. */
export async function toggleStaffStatus(id: number) {
  const res = await adminRequest<never>(`v1/admin/staff/${id}/toggle-status/`, { method: "PATCH" });
  const raw = res.data as unknown as { success?: boolean; status?: string };
  if (!res.ok || raw.success === false) throw new Error(getAuthApiErrorMessage(res.data));
  return { status: raw.status ?? "active" };
}

export async function downloadStaffReportPdf(staffId: number) {
  const { ok, blob, filename } = await adminFetchBlob(`v1/admin/staff/${staffId}/report/`);
  if (!ok) throw new Error("Failed to download report");
  downloadBlob(blob, filename || `staff_${staffId}_report.pdf`);
}

export async function fetchStaffDetail(id: number) {
  const res = await adminRequest<Record<string, unknown>>(`v1/admin/staff/${id}/`);
  return unwrap(res);
}
