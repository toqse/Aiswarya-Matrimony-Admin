import { adminRequest, adminFetchBlob, downloadBlob } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";
import { getAuthApiErrorMessage } from "@/lib/auth-api";

export interface CommissionRow {
  id: number;
  date: string;
  staff: string;
  branch: string;
  customer: string;
  matri_id: string;
  plan: string;
  amount: string;
  rate: string;
  commission: string;
  status: string;
}

export interface CommissionListData {
  /** Admin list may embed summary; staff GET /v1/staff/commissions/ does not — use fetchStaffCommissionSummary(). */
  summary?: {
    total_pending: number;
    approved: number;
    paid: number;
    grand_total: number;
  };
  count: number;
  next: string | null;
  previous: string | null;
  results: CommissionRow[];
}

/** GET /api/v1/staff/commissions/summary/ */
export interface StaffCommissionSummary {
  pending: number;
  approved: number;
  paid: number;
  total: number;
}

export interface BranchCommissionSummary {
  total_pending: number;
  approved: number;
  paid: number;
  total: number;
}

export interface MyCommissionSummary {
  pending: number;
  approved: number;
  paid: number;
  total: number;
}

export interface MyCommissionRow {
  id: number;
  date: string;
  customer: string;
  plan: string;
  sale_amount: number;
  rate: number;
  commission: number;
  status: string;
}

export interface MyCommissionListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: MyCommissionRow[];
}

export async function fetchStaffCommissionSummary() {
  const res = await adminRequest<StaffCommissionSummary>("v1/staff/commissions/summary/");
  return unwrap(res);
}

export async function fetchCommissions(params?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
  }
  const qs = q.toString();
  const res = await adminRequest<CommissionListData>(qs ? `v1/admin/commissions/?${qs}` : "v1/admin/commissions/");
  return unwrap(res);
}

export async function createCommission(body: Record<string, unknown>) {
  const res = await adminRequest<CommissionRow>("v1/admin/commissions/", { method: "POST", body });
  return unwrap(res);
}

export async function approveCommission(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/commissions/${id}/approve/`, { method: "PATCH" });
  if (!res.ok || res.data.success === false) throw new Error(getAuthApiErrorMessage(res.data));
}

export async function markCommissionPaid(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/commissions/${id}/mark-paid/`, { method: "PATCH" });
  if (!res.ok || res.data.success === false) throw new Error(getAuthApiErrorMessage(res.data));
}

export async function cancelCommission(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/commissions/${id}/cancel/`, { method: "PATCH" });
  if (!res.ok || res.data.success === false) throw new Error(getAuthApiErrorMessage(res.data));
}

export async function bulkApproveCommissions(ids: number[]) {
  const res = await adminRequest<{ approved_count: number }>("v1/admin/commissions/bulk-approve/", {
    method: "POST",
    body: { ids },
  });
  return unwrap(res);
}

export async function downloadCommissionSlip(id: number) {
  const { ok, blob, filename } = await adminFetchBlob(`v1/admin/commissions/${id}/slip/`);
  if (!ok) throw new Error("Download failed");
  downloadBlob(blob, filename || `commission_${id}_slip.pdf`);
}

export async function fetchBranchCommissionSummary(params?: { branch_id?: number }) {
  const q = new URLSearchParams();
  if (params?.branch_id != null) q.set("branch_id", String(params.branch_id));
  const qs = q.toString();
  const res = await adminRequest<BranchCommissionSummary>(
    qs ? `v1/branch/commissions/summary/?${qs}` : "v1/branch/commissions/summary/",
  );
  return unwrap(res);
}

export async function fetchBranchCommissions(params?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
  }
  const qs = q.toString();
  const res = await adminRequest<{ count: number; next: string | null; previous: string | null; results: CommissionRow[] }>(
    qs ? `v1/branch/commissions/?${qs}` : "v1/branch/commissions/",
  );
  return unwrap(res);
}

export async function fetchBranchCommissionDetail(id: number) {
  const res = await adminRequest<CommissionRow>(`v1/branch/commissions/${id}/`);
  return unwrap(res);
}

export async function approveBranchCommission(id: number) {
  const res = await adminRequest<unknown>(`v1/branch/commissions/${id}/approve/`, { method: "PATCH" });
  if (!res.ok || res.data.success === false) throw new Error(getAuthApiErrorMessage(res.data));
}

export async function cancelBranchCommission(id: number) {
  const res = await adminRequest<unknown>(`v1/branch/commissions/${id}/cancel/`, { method: "PATCH" });
  if (!res.ok || res.data.success === false) throw new Error(getAuthApiErrorMessage(res.data));
}

export async function markBranchCommissionPaid(id: number) {
  const res = await adminRequest<unknown>(`v1/branch/commissions/${id}/mark-paid/`, { method: "PATCH" });
  if (!res.ok || res.data.success === false) throw new Error(getAuthApiErrorMessage(res.data));
}

export async function bulkApproveBranchCommissions(ids: number[]) {
  const res = await adminRequest<{ approved_count: number }>("v1/branch/commissions/bulk-approve/", {
    method: "POST",
    body: { ids },
  });
  return unwrap(res);
}

export async function downloadBranchCommissionSlip(id: number) {
  const { ok, blob, filename } = await adminFetchBlob(`v1/branch/commissions/${id}/slip/`);
  if (!ok) throw new Error("Download failed");
  downloadBlob(blob, filename || `commission_${id}_slip.pdf`);
}

export async function fetchMyBranchCommissionSummary(params?: { branch_id?: number }) {
  const q = new URLSearchParams();
  if (params?.branch_id != null) q.set("branch_id", String(params.branch_id));
  const qs = q.toString();
  const res = await adminRequest<MyCommissionSummary>(
    qs ? `v1/branch/my-commissions/summary/?${qs}` : "v1/branch/my-commissions/summary/",
  );
  return unwrap(res);
}

export async function fetchMyBranchCommissions(params?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
  }
  const qs = q.toString();
  const res = await adminRequest<MyCommissionListData>(
    qs ? `v1/branch/my-commissions/?${qs}` : "v1/branch/my-commissions/",
  );
  return unwrap(res);
}

export async function fetchMyBranchCommissionDetail(id: number) {
  const res = await adminRequest<MyCommissionRow>(`v1/branch/my-commissions/${id}/`);
  return unwrap(res);
}

export async function exportMyBranchCommissions(format: "pdf" | "csv", params?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  q.set("format", format);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
  }
  const { ok, blob, filename } = await adminFetchBlob(`v1/branch/my-commissions/export/?${q.toString()}`);
  if (!ok) throw new Error("Export failed");
  downloadBlob(blob, filename || `my_commissions.${format}`);
}
