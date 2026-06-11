import {
  adminRequest,
  adminFetchBlob,
  downloadBlob,
  downloadSalarySlip as downloadBranchSalarySlipBlob,
} from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";
import { getAuthApiErrorMessage } from "@/lib/auth-api";

export interface PayrollRow {
  id: number;
  staff: string;
  branch: string;
  month: string;
  basic: string;
  commission: string;
  allowances: string;
  deductions: string;
  gross: string;
  net: string;
  status: string;
}

export interface PayrollListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: PayrollRow[];
}

export interface PayrollSummary {
  total_net_payroll: number;
  total_gross: number;
  staff_count: number;
  pending_drafts: number;
  month: string;
}

export interface BranchPayrollSummary {
  total_staff: number;
  approved_count: number;
  paid_count: number;
  draft_count: number;
  branch_net_payroll: number;
}

export async function fetchPayrollList(params?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
  }
  const qs = q.toString();
  const res = await adminRequest<PayrollListData>(qs ? `v1/admin/payroll/?${qs}` : "v1/admin/payroll/");
  return unwrap(res);
}

export async function fetchPayrollSummary(params?: { month?: string; branch_id?: string }) {
  const q = new URLSearchParams();
  if (params?.month) q.set("month", params.month);
  if (params?.branch_id) q.set("branch_id", params.branch_id);
  const qs = q.toString();
  const res = await adminRequest<PayrollSummary>(qs ? `v1/admin/payroll/summary/?${qs}` : "v1/admin/payroll/summary/");
  return unwrap(res);
}

export async function generatePayroll(body: { month: string }) {
  const res = await adminRequest<{
    month: string;
    records_created: number;
    skipped_existing?: number;
  }>("v1/admin/payroll/generate/", {
    method: "POST",
    body,
  });
  return unwrap(res);
}

export async function approvePayroll(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/payroll/${id}/approve/`, { method: "PATCH" });
  if (!res.ok || res.data.success === false) throw new Error(getAuthApiErrorMessage(res.data));
}

export async function markPayrollPaid(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/payroll/${id}/mark-paid/`, { method: "PATCH" });
  if (!res.ok || res.data.success === false) throw new Error(getAuthApiErrorMessage(res.data));
}

export async function downloadSalarySlip(id: number) {
  const { ok, blob, filename } = await adminFetchBlob(`v1/admin/payroll/${id}/download/`);
  if (!ok) throw new Error("Download failed");
  downloadBlob(blob, filename || `salary_${id}_slip.pdf`);
}

export async function fetchBranchPayrollList(params?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
  }
  const qs = q.toString();
  const res = await adminRequest<PayrollListData>(qs ? `v1/branch/payroll/?${qs}` : "v1/branch/payroll/");
  return unwrap(res);
}

export async function fetchBranchPayrollSummary(params?: { month?: string }) {
  const q = new URLSearchParams();
  if (params?.month) q.set("month", params.month);
  const qs = q.toString();
  const res = await adminRequest<BranchPayrollSummary>(
    qs ? `v1/branch/payroll/summary/?${qs}` : "v1/branch/payroll/summary/",
  );
  return unwrap(res);
}

export async function generateBranchPayroll(body: { month: string }) {
  const res = await adminRequest<{ month: string; records_created: number }>("v1/branch/payroll/generate/", {
    method: "POST",
    body,
  });
  return unwrap(res);
}

export async function approveBranchPayroll(id: number) {
  const res = await adminRequest<unknown>(`v1/branch/payroll/${id}/approve/`, { method: "PATCH" });
  if (!res.ok || res.data.success === false) throw new Error(getAuthApiErrorMessage(res.data));
}

export async function downloadBranchSalarySlip(id: number) {
  await downloadBranchSalarySlipBlob(id);
}
