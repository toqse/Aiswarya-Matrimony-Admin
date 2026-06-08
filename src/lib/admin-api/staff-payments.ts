import { adminFetchBlob, adminRequest, downloadBlob } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";
import { getAuthApiErrorMessage } from "@/lib/auth-api";
import type { UserRole } from "@/types/user-role";

export type StaffPaymentMode = "cash" | "gpay_upi";
export type StaffPaymentStatus = "pending" | "verified" | "completed";

function paymentsRoot(role: UserRole): "v1/staff/payments" | "v1/branch/payments" {
  return role === "branch-manager" ? "v1/branch/payments" : "v1/staff/payments";
}

/** Quote + customer OTP are registered only under staff payments (branch manager uses these same URLs). */
const STAFF_PAYMENTS_API = "v1/staff/payments";

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

export interface PaymentCustomerLookupData {
  id: string;
  matri_id: string;
  name: string;
  mobile: string;
}

export interface StaffPaymentQuoteData {
  plan_amount?: number;
  plan_price?: number;
  discount_amount?: number;
  total?: number;
  total_payable?: number;
  amount?: number;
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

export async function fetchPaymentsSummary(role: UserRole) {
  const root = paymentsRoot(role);
  const res = await adminRequest<StaffPaymentsSummaryData>(`${root}/summary/`);
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

export async function fetchPaymentsList(
  role: UserRole,
  params?: {
    mode?: StaffPaymentMode;
    status?: StaffPaymentStatus;
    search?: string;
    date?: string;
    page?: number;
    page_size?: number;
  },
) {
  const root = paymentsRoot(role);
  const res = await adminRequest<StaffPaymentsListData>(`${root}/${toQs(params)}`);
  return unwrap(res);
}

export async function postPaymentQuote(_role: UserRole, body: { plan_id: number; discount_amount?: number }) {
  let res = await adminRequest<StaffPaymentQuoteData>(`${STAFF_PAYMENTS_API}/quote/`, { method: "POST", body });
  // Many Django setups expose quote as GET with query params; POST returns 405.
  if (res.status === 405) {
    const getParams: Record<string, number> = { plan_id: body.plan_id };
    if (body.discount_amount != null && body.discount_amount > 0) {
      getParams.discount_amount = body.discount_amount;
    }
    const qs = toQs(getParams);
    res = await adminRequest<StaffPaymentQuoteData>(`${STAFF_PAYMENTS_API}/quote/${qs}`);
  }
  return unwrap(res);
}

async function postStaffCustomerOtpSendAt(pathSuffix: string, body: { customer_matri_id: string }) {
  return adminRequest<unknown>(`${STAFF_PAYMENTS_API}/${pathSuffix}`, { method: "POST", body });
}

export async function postPaymentCustomerOtpSend(_role: UserRole, body: { customer_matri_id: string }) {
  let res = await postStaffCustomerOtpSendAt("customer-otp/send/", body);
  // Alternate urlpattern spelling used in some Django apps.
  if (res.status === 404) {
    res = await postStaffCustomerOtpSendAt("customer_otp/send/", body);
  }
  return unwrap(res);
}

async function postStaffCustomerOtpVerifyAt(pathSuffix: string, body: { customer_matri_id: string; otp: string }) {
  return adminRequest<unknown>(`${STAFF_PAYMENTS_API}/${pathSuffix}`, { method: "POST", body });
}

export async function postPaymentCustomerOtpVerify(_role: UserRole, body: { customer_matri_id: string; otp: string }) {
  let res = await postStaffCustomerOtpVerifyAt("customer-otp/verify/", body);
  if (res.status === 404) {
    res = await postStaffCustomerOtpVerifyAt("customer_otp/verify/", body);
  }
  return unwrap(res);
}

export type CreatePaymentBody = {
  mode: StaffPaymentMode;
  customer_matri_id: string;
  plan_id: number;
  amount: number;
  discount_amount?: number;
  reference_no?: string;
  physical_receipt_no?: string;
  cashier_receipt_no?: string;
  otp?: string;
  notes?: string;
};

export async function createStaffPayment(body: CreatePaymentBody) {
  const res = await adminRequest<StaffPaymentDetail>("v1/staff/payments/", { method: "POST", body });
  return unwrap(res);
}

export async function createPayment(role: UserRole, body: CreatePaymentBody) {
  const root = paymentsRoot(role);
  const res = await adminRequest<StaffPaymentDetail>(`${root}/`, { method: "POST", body });
  return unwrap(res);
}

export async function fetchStaffPaymentCustomerLookup(params: { matri_id?: string; mobile?: string }) {
  const res = await adminRequest<PaymentCustomerLookupData>(`v1/staff/payments/customer-lookup/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchBranchPaymentCustomerLookup(params: { matri_id?: string; mobile?: string }) {
  const res = await adminRequest<PaymentCustomerLookupData>(`v1/branch/payments/customer-lookup/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchPaymentCustomerLookup(role: UserRole, params: { matri_id?: string; mobile?: string }) {
  const root = paymentsRoot(role);
  const res = await adminRequest<PaymentCustomerLookupData>(`${root}/customer-lookup/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchStaffPaymentDetail(receiptId: string) {
  const res = await adminRequest<StaffPaymentDetail>(`v1/staff/payments/${encodeURIComponent(receiptId)}/`);
  return unwrap(res);
}

export async function fetchPaymentDetail(role: UserRole, receiptId: string) {
  const root = paymentsRoot(role);
  const res = await adminRequest<StaffPaymentDetail>(`${root}/${encodeURIComponent(receiptId)}/`);
  return unwrap(res);
}

export async function downloadStaffPaymentReceiptPdf(receiptId: string) {
  const { ok, blob, filename } = await adminFetchBlob(`v1/staff/payments/${encodeURIComponent(receiptId)}/receipt/`);
  if (!ok) throw new Error("Download failed");
  downloadBlob(blob, filename || `${receiptId}.pdf`);
}

export async function downloadPaymentReceiptPdf(role: UserRole, receiptId: string) {
  const root = paymentsRoot(role);
  const { ok, blob, filename } = await adminFetchBlob(`${root}/${encodeURIComponent(receiptId)}/receipt/`);
  if (!ok) throw new Error("Download failed");
  downloadBlob(blob, filename || `${receiptId}.pdf`);
}

export async function downloadStaffPaymentReceiptPdfFromUrl(receiptPdfUrl: string) {
  const url = String(receiptPdfUrl ?? "").trim();
  if (!url || url === "undefined") {
    throw new Error("Receipt download URL is missing.");
  }
  const { ok, blob, filename } = await adminFetchBlob(url);
  if (!ok) throw new Error(getAuthApiErrorMessage({}));
  downloadBlob(blob, filename || "receipt.pdf");
}

