import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface StaffDashboardSummaryData {
  staff_name: string;
  branch: string;
  my_profiles: { count: number; growth: number; growth_pct: string };
  subscriptions_this_month: { count: number; growth: number; growth_pct: string };
  commission_earned: { amount: number; growth_pct: string };
}

export interface StaffDashboardRecentActivityItem {
  id: number;
  timestamp: string;
  actor_name: string;
  actor_role: string;
  action: string;
  action_display: string;
  resource: string;
  details: string;
  ip_address: string | null;
}

export async function fetchStaffDashboardSummary() {
  const res = await adminRequest<StaffDashboardSummaryData>("v1/staff/dashboard/summary/");
  return unwrap(res);
}

export async function fetchStaffDashboardRecentActivity() {
  const res = await adminRequest<{ items: StaffDashboardRecentActivityItem[] }>(
    "v1/staff/dashboard/recent-activity/",
  );
  return unwrap(res);
}

