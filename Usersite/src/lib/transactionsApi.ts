import { BASE_URL } from "./config";
import { memberFetchWithAuthRetry } from "@/lib/memberAuthedFetch";

type ApiErrorPayload = {
  success?: boolean;
  error?: { code?: number; message?: string };
  detail?: string | string[];
  message?: string;
  [key: string]: unknown;
};

function getErrorMessage(data: ApiErrorPayload | unknown, fallback: string): string {
  const payload = (data ?? {}) as ApiErrorPayload;
  if (payload.error?.message) return payload.error.message;
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload.detail === "string" && payload.detail.trim()) return payload.detail;
  if (Array.isArray(payload.detail) && payload.detail[0]) return String(payload.detail[0]);
  return fallback;
}

async function authedGet<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  console.log("[transactionsApi] GET", path);
  const res = await memberFetchWithAuthRetry(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = (await res.json().catch(() => ({}))) as T & ApiErrorPayload;
  console.log("[transactionsApi] response", { status: res.status, data });
  if (!res.ok) throw new Error(getErrorMessage(data, "Request failed"));
  return data as T;
}

// ---- Types ----

export type TransactionType = "plan_purchase" | "profile_boost" | "refund";
export type TransactionStatus = "success" | "failed" | "pending" | "refunded";
export type PaymentMethod = "razorpay" | "stripe" | "upi" | "manual";

export interface Transaction {
  plan_name: string;
  transaction_id: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  date: string;
}

export interface TransactionDetail {
  transaction_id: string;
  plan_name: string;
  amount: number;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  date: string;
}

export interface TransactionSummary {
  total_spent: number;
  active_plan: string | null;
  next_renewal: string | null;
}

export interface TransactionSummaryResponse {
  success: boolean;
  data: TransactionSummary;
}

export interface TransactionListResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    transactions: Transaction[];
  };
}

export interface TransactionCountResponse {
  success: boolean;
  data: {
    total_transactions: number;
  };
}

export interface TransactionDetailResponse {
  success: boolean;
  data: TransactionDetail;
}

// ---- API functions ----

export async function getTransactionSummary(): Promise<TransactionSummaryResponse> {
  return authedGet<TransactionSummaryResponse>("v1/transactions/summary/");
}

export async function getTransactions(page = 1, limit = 20): Promise<TransactionListResponse> {
  return authedGet<TransactionListResponse>(`v1/transactions/?page=${page}&limit=${limit}`);
}

export async function getTransactionCount(): Promise<TransactionCountResponse> {
  return authedGet<TransactionCountResponse>("v1/transactions/count/");
}

export async function getTransactionDetail(transactionId: string): Promise<TransactionDetailResponse> {
  return authedGet<TransactionDetailResponse>(`v1/transactions/${encodeURIComponent(transactionId)}/`);
}
