import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

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
