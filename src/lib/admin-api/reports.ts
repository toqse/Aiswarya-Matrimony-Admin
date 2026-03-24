import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";
import { adminFetchBlob, downloadBlob } from "@/lib/api-client";

export interface RevenueReportData {
  total: number;
  period: "daily" | "monthly" | "yearly";
  start_date: string;
  end_date: string;
  branch_id: number | null;
  chart: Array<{ label: string; value: number }>;
  by_plan: Array<{ plan: string; revenue: number; count: number }>;
  by_branch: Array<{ branch: string; branch_id: number; revenue: number; count: number }>;
  summary_table: Array<{ metric: string; value: number; period: string; from: string; to: string }>;
}

export interface ProductivityReportData {
  month: string;
  branch_id: number | null;
  chart: Array<{ label: string; value: number; subscriptions_sold: number }>;
  summary_table: Array<{
    staff_id: number;
    staff_name: string;
    emp_code: string;
    branch: string;
    subscriptions_sold: number;
    commission_earned: number;
    monthly_target: number;
    achieved_target: number;
    target_met: boolean;
    target_progress_pct: number;
  }>;
}

export interface GrowthReportData {
  period: "monthly";
  branch_id: number | null;
  chart: Array<{ label: string; new_registrations: number; new_subscriptions: number }>;
  summary_table: Array<{ month: string; new_registrations: number; new_subscriptions: number }>;
  totals: { new_registrations: number; new_subscriptions: number };
}

export interface ProfileCompletionReportData {
  branch_id: number | null;
  total_profiles: number;
  fully_complete_count: number;
  chart: Array<{ label: string; step: string; incomplete_count: number; percent_of_profiles: number }>;
  summary_table: Array<{
    step: string;
    step_label: string;
    incomplete_count: number;
    complete_count: number;
    percent_incomplete: number;
  }>;
}

export interface PlanPopularityReportData {
  start_date: string;
  end_date: string;
  branch_id: number | null;
  total_revenue: number;
  total_sales: number;
  chart: Array<{ label: string; value: number; count: number }>;
  summary_table: Array<{ plan_id: number; plan: string; subscriber_count: number; revenue: number }>;
}

export interface BranchStaffPerformanceSummary {
  total_staff: number;
  total_revenue: number;
  total_commission: number;
  avg_target_progress: number;
}

export interface BranchStaffPerformanceChartRow {
  staff_id: number;
  staff_name: string;
  revenue: number;
  commission: number;
}

export interface BranchStaffPerformanceTargetRow {
  staff_id: number;
  staff_name: string;
  achieved_target: number;
  monthly_target: number;
  target_progress: number;
}

export interface BranchStaffPerformanceListRow {
  staff_id: number;
  staff_name: string;
  designation: string;
  revenue: number;
  commission_earned: number;
  achieved_target: number;
  monthly_target: number;
  target_progress: number;
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

export async function fetchRevenueReport(params?: {
  period?: "daily" | "monthly" | "yearly";
  start_date?: string;
  end_date?: string;
  branch_id?: number;
}) {
  const res = await adminRequest<RevenueReportData>(`v1/admin/reports/revenue/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchProductivityReport(params?: { month?: string; branch_id?: number }) {
  const res = await adminRequest<ProductivityReportData>(`v1/admin/reports/productivity/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchGrowthReport(params?: {
  period?: "monthly";
  months?: number;
  start_date?: string;
  end_date?: string;
  branch_id?: number;
}) {
  const res = await adminRequest<GrowthReportData>(`v1/admin/reports/growth/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchProfileCompletionReport(params?: { branch_id?: number }) {
  const res = await adminRequest<ProfileCompletionReportData>(`v1/admin/reports/profile-completion/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchPlanPopularityReport(params?: { start_date?: string; end_date?: string; branch_id?: number }) {
  const res = await adminRequest<PlanPopularityReportData>(`v1/admin/reports/plan-popularity/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchBranchStaffPerformanceSummary(params?: { month?: string }) {
  const res = await adminRequest<BranchStaffPerformanceSummary>(`v1/branch/staff-performance/summary/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchBranchStaffPerformanceChart(params?: { month?: string }) {
  const res = await adminRequest<{ staff: BranchStaffPerformanceChartRow[] }>(`v1/branch/staff-performance/chart/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchBranchStaffPerformanceTargets(params?: { month?: string }) {
  const res = await adminRequest<{ staff: BranchStaffPerformanceTargetRow[] }>(`v1/branch/staff-performance/targets/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchBranchStaffPerformanceList(params?: { month?: string; page?: number; page_size?: number; search?: string }) {
  const res = await adminRequest<{ count: number; next: string | null; previous: string | null; results: BranchStaffPerformanceListRow[] }>(
    `v1/branch/staff-performance/${toQs(params)}`,
  );
  return unwrap(res);
}

export async function exportBranchStaffPerformance(params?: { month?: string; format?: "csv" | "pdf" }) {
  const q = new URLSearchParams();
  if (params?.month) q.set("month", params.month);
  q.set("format", params?.format ?? "csv");
  const { ok, blob, filename } = await adminFetchBlob(`v1/branch/staff-performance/export/?${q.toString()}`);
  if (!ok) throw new Error("Export failed");
  downloadBlob(blob, filename || `branch_staff_performance.${params?.format ?? "csv"}`);
}
