import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";
import type { CommissionListData } from "@/lib/admin-api/commissions";
import type { PayrollListData } from "@/lib/admin-api/payroll";
import type { SubscriptionListData } from "@/lib/admin-api/subscriptions";

export async function fetchStaffSubscriptions(params?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
  const qs = q.toString();
  const res = await adminRequest<SubscriptionListData>(qs ? `v1/staff/subscriptions/?${qs}` : "v1/staff/subscriptions/");
  return unwrap(res);
}

export async function fetchBranchSubscriptions(params?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
  const qs = q.toString();
  const res = await adminRequest<SubscriptionListData>(qs ? `v1/branch/subscriptions/?${qs}` : "v1/branch/subscriptions/");
  return unwrap(res);
}

export async function fetchStaffCommissions(params?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
  const qs = q.toString();
  const res = await adminRequest<CommissionListData>(qs ? `v1/staff/commissions/?${qs}` : "v1/staff/commissions/");
  return unwrap(res);
}

export async function fetchStaffPayroll(params?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
  const qs = q.toString();
  const res = await adminRequest<PayrollListData>(qs ? `v1/staff/payroll/?${qs}` : "v1/staff/payroll/");
  return unwrap(res);
}
