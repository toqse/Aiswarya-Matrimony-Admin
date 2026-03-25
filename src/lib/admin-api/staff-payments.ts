import { adminFetchBlob, adminRequest, downloadBlob } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";
import { getAuthApiErrorMessage } from "@/lib/auth-api";

export type StaffPaymentMode = "cash" | "gpay_upi";
export type StaffPaymentStatus = "pending" | "verified" | "completed";

export interface StaffPaymentsSummaryData {
  title: string;
  subtitle: string;
  today_cash: number;
  today_upi_gpay: number;
  total_today: number;
  pending_count: number;
}

export interface StaffPaymentRow {
  receipt_id: string;
  customer: { matri_id: string; name: string };
  plan: { id: number; name: string };
  amount: string;
  mode: StaffPaymentMode;
  mode_label: string;
  reference_no: string;
  status: StaffPaymentStatus;
  notes: string;
  created_at: string;
  verified_at: string | null;
  detail_url: string;
  receipt_pdf_url: string;
}

export interface StaffPaymentsListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: StaffPaymentRow[];
}

export interface StaffPaymentDetail extends StaffPaymentRow {
  branch?: { id: number; name: string } | string;
  verified_by?: string | null;
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

export async function fetchStaffPaymentsSummary() {
  const res = await adminRequest<StaffPaymentsSummaryData>("v1/staff/payments/summary/");
  return unwrap(res);
}

export async function fetchStaffPayments(params?: {
  mode?: StaffPaymentMode;
  status?: StaffPaymentStatus;
  search?: string;
  date?: string;
  page?: number;
  page_size?: number;
}) {
  const res = await adminRequest<StaffPaymentsListData>(`v1/staff/payments/${toQs(params)}`);
  return unwrap(res);
}

export async function createStaffPayment(body: {
  mode: StaffPaymentMode;
  customer_matri_id: string;
  plan_id: number;
  amount: number;
  reference_no?: string;
  notes?: string;
}) {
  const res = await adminRequest<StaffPaymentDetail>("v1/staff/payments/", { method: "POST", body });
  return unwrap(res);
}

export async function fetchStaffPaymentDetail(receiptId: string) {
  const res = await adminRequest<StaffPaymentDetail>(`v1/staff/payments/${encodeURIComponent(receiptId)}/`);
  return unwrap(res);
}

export async function downloadStaffPaymentReceiptPdf(receiptId: string) {
  const { ok, blob, filename } = await adminFetchBlob(`v1/staff/payments/${encodeURIComponent(receiptId)}/receipt/`);
  if (!ok) throw new Error("Download failed");
  downloadBlob(blob, filename || `${receiptId}.pdf`);
}

export async function downloadStaffPaymentReceiptPdfFromUrl(receiptPdfUrl: string) {
  const { ok, blob, filename } = await adminFetchBlob(receiptPdfUrl);
  if (!ok) throw new Error(getAuthApiErrorMessage({}));
  downloadBlob(blob, filename || "receipt.pdf");
}

