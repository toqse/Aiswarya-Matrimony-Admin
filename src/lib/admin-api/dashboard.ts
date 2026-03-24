import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface DashboardSummary {
  total_users: number;
  total_subscriptions: number;
  mrr: number;
  active_profiles: number;
  todays_registrations: number;
  total_revenue: number;
}

export interface MonthlyPoint {
  month: string;
  total_revenue: number;
}

export interface SubscriptionGrowthPoint {
  month: string;
  subscriptions: number;
}

export interface BranchPerformanceRow {
  branch: { id: number | null; name: string; code: string | null };
  total_users: number;
  active_subscriptions: number;
  todays_registrations: number;
  total_revenue: number;
}

export interface RecentActivityLog {
  id: number;
  type: string;
  channel: string;
  recipient: string;
  subject: string;
  success: boolean;
  error_message: string;
  created_at: string;
}

export interface BranchDashboardSummary {
  total_subscriptions: number;
  total_revenue: number;
  total_staff: number;
  active_enquiries: number;
  total_profiles: number;
}

interface BranchDashboardSummaryApi {
  total_subscriptions?: number;
  total_revenue?: number;
  total_staff?: number;
  active_enquiries?: number;
  branch_subscriptions?: number;
  branch_revenue?: number;
  active_staff?: number;
  branch_profiles?: number;
}

export interface BranchDashboardRevenuePoint {
  period: string;
  revenue: number;
}

export interface BranchDashboardStaffPerformanceRow {
  staff_id: number;
  staff_name: string;
  revenue: number;
  commission: number;
}

export interface BranchDashboardTargetProgressRow {
  staff_id: number;
  staff_name: string;
  achieved_target: number;
  monthly_target: number;
  target_progress: number;
}

export interface BranchDashboardTopPerformerRow {
  staff_id: number;
  staff_name: string;
  revenue: number;
}

export async function fetchDashboardSummary() {
  const res = await adminRequest<DashboardSummary>("v1/admin/dashboard/summary/");
  return unwrap(res);
}

export async function fetchMonthlyRevenue() {
  const res = await adminRequest<{ series: MonthlyPoint[] }>("v1/admin/dashboard/monthly-revenue/");
  return unwrap(res);
}

export async function fetchSubscriptionGrowth() {
  const res = await adminRequest<{ series: SubscriptionGrowthPoint[] }>("v1/admin/dashboard/subscription-growth/");
  return unwrap(res);
}

export async function fetchBranchPerformance() {
  const res = await adminRequest<{ branches: BranchPerformanceRow[] }>("v1/admin/dashboard/branch-performance/");
  return unwrap(res);
}

export async function fetchRecentActivity() {
  const res = await adminRequest<{ logs: RecentActivityLog[] }>("v1/admin/dashboard/recent-activity/");
  return unwrap(res);
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

export async function fetchBranchDashboardSummary(params?: { month?: string }) {
  const res = await adminRequest<BranchDashboardSummaryApi>(`v1/branch/dashboard/summary/${toQs(params)}`);
  const data = await unwrap(res);
  return {
    total_subscriptions: data.total_subscriptions ?? data.branch_subscriptions ?? 0,
    total_revenue: data.total_revenue ?? data.branch_revenue ?? 0,
    total_staff: data.total_staff ?? data.active_staff ?? 0,
    active_enquiries: data.active_enquiries ?? data.branch_profiles ?? 0,
    total_profiles: data.branch_profiles ?? data.active_enquiries ?? 0,
  } satisfies BranchDashboardSummary;
}

export async function fetchBranchDashboardRevenueTrend(params?: { period?: string; month?: string }) {
  const res = await adminRequest<{ series: BranchDashboardRevenuePoint[] }>(
    `v1/branch/dashboard/revenue-trend/${toQs(params)}`,
  );
  return unwrap(res);
}

export async function fetchBranchDashboardStaffPerformance(params?: { month?: string }) {
  const res = await adminRequest<{ staff: BranchDashboardStaffPerformanceRow[] }>(
    `v1/branch/dashboard/staff-performance/${toQs(params)}`,
  );
  return unwrap(res);
}

export async function fetchBranchDashboardTargetProgress(params?: { month?: string }) {
  const res = await adminRequest<{ staff: BranchDashboardTargetProgressRow[] }>(
    `v1/branch/dashboard/target-progress/${toQs(params)}`,
  );
  return unwrap(res);
}

export async function fetchBranchDashboardTopPerformers(params?: { month?: string }) {
  const res = await adminRequest<{ staff: BranchDashboardTopPerformerRow[] }>(
    `v1/branch/dashboard/top-performers/${toQs(params)}`,
  );
  return unwrap(res);
}

export async function fetchBranchDashboardEnquiryOverview(params?: { page?: number; page_size?: number; search?: string }) {
  const res = await adminRequest<{ count: number; next: string | null; previous: string | null; results: unknown[] }>(
    `v1/branch/dashboard/enquiry-overview/${toQs(params)}`,
  );
  return unwrap(res);
}
