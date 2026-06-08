import { adminFetchBlob, adminRequest, downloadBlob } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface StaffSalarySummaryData {
  ytd_gross_pay: number;
  ytd_commission: number;
  ytd_net_pay: number;
  records_count: number;
}

export type StaffSalaryStatus = "draft" | "approved" | "paid";

export interface StaffSalaryCurrentData {
  month: string;
  basic: number;
  commission_approved: number;
  allowances: number;
  deductions: number;
  gross: number;
  net_pay: number;
  status: StaffSalaryStatus | null;
}

export interface StaffSalaryRow {
  id: number;
  month: string;
  year: number;
  basic: string;
  commission: string;
  allowances: string;
  deductions: string;
  gross: string;
  net: string;
  status: StaffSalaryStatus;
  download_url: string;
}

export interface StaffSalaryListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: StaffSalaryRow[];
}

export type SalaryApiScope = "staff" | "branch-manager";

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

export async function fetchStaffSalarySummary() {
  const res = await adminRequest<StaffSalarySummaryData>("v1/staff/salary/summary/");
  return unwrap(res);
}

export async function fetchStaffSalaryCurrent() {
  const res = await adminRequest<StaffSalaryCurrentData>("v1/staff/salary/current/");
  return unwrap(res);
}

export async function fetchStaffSalaryHistory(params?: { year?: number; page?: number; page_size?: number }) {
  const res = await adminRequest<StaffSalaryListData>(`v1/staff/salary/${toQs(params)}`);
  return unwrap(res);
}

function getSalaryBasePath(scope: SalaryApiScope | undefined): string {
  if (scope === "branch-manager") return "v1/staff/me/salary/";
  return "v1/staff/salary/";
}

export async function fetchMySalarySummary(scope?: SalaryApiScope) {
  const res = await adminRequest<StaffSalarySummaryData>(`${getSalaryBasePath(scope)}summary/`);
  return unwrap(res);
}

export async function fetchMySalaryCurrent(scope?: SalaryApiScope) {
  const res = await adminRequest<StaffSalaryCurrentData>(`${getSalaryBasePath(scope)}current/`);
  return unwrap(res);
}

export async function fetchMySalaryHistory(
  params?: { year?: number; page?: number; page_size?: number },
  scope?: SalaryApiScope,
) {
  const res = await adminRequest<StaffSalaryListData>(`${getSalaryBasePath(scope)}${toQs(params)}`);
  return unwrap(res);
}

export async function downloadStaffSalarySlip(id: number) {
  const { ok, blob, filename } = await adminFetchBlob(`v1/staff/salary/${id}/download/`);
  if (!ok) throw new Error("Download failed");
  downloadBlob(blob, filename || `salary_${id}_slip.pdf`);
}

