import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export type PaymentMode = "cash" | "upi" | "card" | "netbanking";
export type PaymentStatus = "verified" | "pending" | "rejected";

export interface PaymentListRow {
  id: number;
  time: string;
  /** ISO datetime when the backend includes it on list rows (preferred for table date). */
  created_at?: string;
  receipt_txn_id: string;
  customer_name: string;
  matri_id: string;
  plan: string;
  amount: string;
  mode: PaymentMode;
  branch: string;
  staff: string;
  status: PaymentStatus;
}

export interface PaymentListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: PaymentListRow[];
}

export interface PaymentSummaryMetric {
  total: number;
  count: number;
  growth_percent: number;
}

export interface PaymentSummaryData {
  live: boolean;
  last_updated: string;
  cash_payments: PaymentSummaryMetric;
  upi_payments: PaymentSummaryMetric;
  card_payments: PaymentSummaryMetric;
  total_revenue: PaymentSummaryMetric;
}

export interface PaymentDetail extends PaymentListRow {
  rejection_reason: string;
  payment_method: string;
  payment_status: string;
  transaction_type: string;
  created_at: string;
}

export interface PaymentsQuery {
  mode?: PaymentMode;
  branch_id?: number;
  staff_id?: number;
  status?: PaymentStatus;
  search?: string;
  date?: string;
  page?: number;
  page_size?: number;
}

function toQuery(params?: PaymentsQuery) {
  const q = new URLSearchParams();
  if (!params) return "";
  if (params.mode) q.set("mode", params.mode);
  if (params.branch_id != null) q.set("branch_id", String(params.branch_id));
  if (params.staff_id != null) q.set("staff_id", String(params.staff_id));
  if (params.status) q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  if (params.date) q.set("date", params.date);
  if (params.page != null) q.set("page", String(params.page));
  if (params.page_size != null) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchPayments(params?: PaymentsQuery) {
  const res = await adminRequest<PaymentListData>(`v1/admin/payments/${toQuery(params)}`);
  return unwrap(res);
}

export async function fetchPaymentsSummary(params?: PaymentsQuery) {
  const res = await adminRequest<PaymentSummaryData>(`v1/admin/payments/summary/${toQuery(params)}`);
  return unwrap(res);
}

export async function fetchPaymentDetail(id: number) {
  const res = await adminRequest<PaymentDetail>(`v1/admin/payments/${id}/`);
  return unwrap(res);
}

export async function verifyPayment(id: number) {
  const res = await adminRequest<PaymentDetail>(`v1/admin/payments/${id}/verify/`, { method: "PATCH" });
  return unwrap(res);
}

export async function rejectPayment(id: number, reason: string) {
  const res = await adminRequest<PaymentDetail>(`v1/admin/payments/${id}/reject/`, {
    method: "PATCH",
    body: { reason },
  });
  return unwrap(res);
}

export async function createManualPayment(body: {
  customer_matri_id: string;
  plan_id: number;
  amount: string;
  receipt_txn_id: string;
}) {
  const res = await adminRequest<PaymentDetail>("v1/admin/payments/", {
    method: "POST",
    body,
  });
  return unwrap(res);
}
