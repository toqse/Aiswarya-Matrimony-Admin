import { adminRequest, adminFetchBlob, downloadBlob } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface SubscriptionLedgerRow {
  id: number;
  customer: string;
  matri_id: string;
  plan: string;
  amount: string;
  payment_mode: string;
  staff: string;
  branch: string;
  start_date: string;
  expiry_date: string;
  status: string;
}

export interface SubscriptionListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: SubscriptionLedgerRow[];
}

export async function fetchAdminSubscriptions(params?: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v));
    });
  }
  const qs = q.toString();
  const res = await adminRequest<SubscriptionListData>(qs ? `v1/admin/subscriptions/?${qs}` : "v1/admin/subscriptions/");
  return unwrap(res);
}

export async function fetchSubscriptionDetail(id: number) {
  const res = await adminRequest<SubscriptionLedgerRow>(`v1/admin/subscriptions/${id}/`);
  return unwrap(res);
}

export async function exportSubscriptionsCsv(params?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
  }
  const qs = q.toString();
  const path = qs ? `v1/admin/subscriptions/export/?${qs}` : "v1/admin/subscriptions/export/";
  const { ok, blob, filename } = await adminFetchBlob(path);
  if (!ok) throw new Error("Export failed");
  downloadBlob(blob, filename || "subscriptions_export.csv");
}
