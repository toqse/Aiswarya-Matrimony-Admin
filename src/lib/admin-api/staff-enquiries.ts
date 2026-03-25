import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";
import type { EnquiryListData, EnquiryNote, EnquiryRow, EnquirySource, EnquiryStatus } from "@/lib/admin-api/enquiries";

export interface StaffEnquirySummaryData {
  total: number;
  pipeline: Record<EnquiryStatus, number>;
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

export async function fetchStaffEnquirySummary() {
  const res = await adminRequest<StaffEnquirySummaryData>("v1/staff/enquiries/summary/");
  return unwrap(res);
}

export async function fetchStaffEnquiries(params?: {
  search?: string;
  status?: EnquiryStatus;
  source?: EnquirySource;
  page?: number;
  page_size?: number;
}) {
  const res = await adminRequest<EnquiryListData>(`v1/staff/enquiries/${toQs(params)}`);
  return unwrap(res);
}

export async function createStaffEnquiry(body: {
  name: string;
  phone: string;
  email?: string;
  source: EnquirySource;
  branch?: number;
}) {
  const res = await adminRequest<EnquiryRow>("v1/staff/enquiries/", { method: "POST", body });
  return unwrap(res);
}

export async function fetchStaffEnquiryDetail(id: number) {
  const res = await adminRequest<EnquiryRow>(`v1/staff/enquiries/${id}/`);
  return unwrap(res);
}

export async function moveStaffEnquiry(id: number, status: Exclude<EnquiryStatus, "new">) {
  const res = await adminRequest<{ id: number; status: EnquiryStatus }>(`v1/staff/enquiries/${id}/move/`, {
    method: "PATCH",
    body: { status },
  });
  return unwrap(res);
}

export async function addStaffEnquiryNote(id: number, text: string) {
  const res = await adminRequest<EnquiryNote>(`v1/staff/enquiries/${id}/notes/`, {
    method: "POST",
    body: { text },
  });
  return unwrap(res);
}

