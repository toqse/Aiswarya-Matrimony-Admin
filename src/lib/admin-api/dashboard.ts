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
