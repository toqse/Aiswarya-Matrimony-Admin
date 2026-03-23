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
  summary: {
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
