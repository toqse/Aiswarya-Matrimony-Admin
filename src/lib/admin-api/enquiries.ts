import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export type EnquiryStatus = "new" | "contacted" | "interested" | "converted" | "lost";
export type EnquirySource = "website" | "walk-in" | "phone" | "whatsapp" | "email";

export interface EnquiryNote {
  id: number;
  text: string;
  created_at: string;
}

export interface EnquiryRow {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  source: EnquirySource;
  status: EnquiryStatus;
  assigned_to: number | null;
  assigned_to_name: string | null;
  branch: number | null;
  branch_name: string | null;
  notes: string;
  enquiry_notes: EnquiryNote[];
  created_at: string;
  updated_at: string;
}

export interface EnquiryListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: EnquiryRow[];
}

export interface EnquiryKanbanData {
  new: { count: number; items: EnquiryRow[] };
  contacted: { count: number; items: EnquiryRow[] };
  interested: { count: number; items: EnquiryRow[] };
  converted: { count: number; items: EnquiryRow[] };
  lost: { count: number; items: EnquiryRow[] };
}

export interface BranchEnquirySummary {
  total_enquiries: number;
  active_leads: number;
  converted: number;
  overdue_followups: number;
  pipeline: Record<EnquiryStatus, number>;
  sources: Array<{ source: EnquirySource; count: number }>;
}

export interface EnquiryOptionBranch {
  id: number;
  name: string;
}

export interface EnquiryOptionStaff {
  id: number;
  name: string;
  branch_id: number | null;
  branch_name: string;
}

export interface EnquiryFormOptions {
  branches: EnquiryOptionBranch[];
  staff: EnquiryOptionStaff[];
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

export async function fetchAdminEnquiries(params?: {
  search?: string;
  status?: EnquiryStatus;
  source?: EnquirySource;
  branch_id?: number;
  staff_id?: number;
  page?: number;
  page_size?: number;
}) {
  const res = await adminRequest<EnquiryListData>(`v1/admin/enquiries/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchAdminEnquiryKanban(params?: {
  search?: string;
  status?: EnquiryStatus;
  source?: EnquirySource;
  branch_id?: number;
  staff_id?: number;
}) {
  const res = await adminRequest<EnquiryKanbanData>(`v1/admin/enquiries/kanban/${toQs(params)}`);
  return unwrap(res);
}

export async function createAdminEnquiry(body: {
  name: string;
  phone: string;
  email?: string;
  source: EnquirySource;
  branch?: number;
  assigned_to?: number;
}) {
  const res = await adminRequest<EnquiryRow>("v1/admin/enquiries/", { method: "POST", body });
  return unwrap(res);
}

export async function fetchAdminEnquiryOptions(params?: { branch_id?: number }) {
  const res = await adminRequest<EnquiryFormOptions>(`v1/admin/enquiries/options/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchAdminEnquiryDetail(id: number) {
  const res = await adminRequest<EnquiryRow>(`v1/admin/enquiries/${id}/`);
  return unwrap(res);
}

export async function moveAdminEnquiry(id: number, status: Exclude<EnquiryStatus, "new">) {
  const res = await adminRequest<{ id: number; status: EnquiryStatus }>(`v1/admin/enquiries/${id}/move/`, {
    method: "PATCH",
    body: { status },
  });
  return unwrap(res);
}

export async function assignAdminEnquiry(id: number, staff_id: number) {
  const res = await adminRequest<{ id: number; assigned_to: string }>(`v1/admin/enquiries/${id}/assign/`, {
    method: "PATCH",
    body: { staff_id },
  });
  return unwrap(res);
}

export async function addAdminEnquiryNote(id: number, text: string) {
  const res = await adminRequest<EnquiryNote>(`v1/admin/enquiries/${id}/notes/`, {
    method: "POST",
    body: { text },
  });
  return unwrap(res);
}

export async function fetchBranchEnquirySummary(params?: { branch_id?: number }) {
  const res = await adminRequest<BranchEnquirySummary>(`v1/branch/enquiries/summary/${toQs(params)}`);
  return unwrap(res);
}

export async function fetchBranchEnquiries(params?: {
  search?: string;
  status?: EnquiryStatus;
  source?: EnquirySource;
  branch_id?: number;
  page?: number;
  page_size?: number;
}) {
  const res = await adminRequest<EnquiryListData>(`v1/branch/enquiries/${toQs(params)}`);
  return unwrap(res);
}

export async function createBranchEnquiry(body: {
  name: string;
  phone: string;
  email?: string;
  source: EnquirySource;
  branch?: number;
  assigned_to?: number;
}) {
  const res = await adminRequest<EnquiryRow>("v1/branch/enquiries/", { method: "POST", body });
  return unwrap(res);
}

export async function fetchBranchEnquiryDetail(id: number) {
  const res = await adminRequest<EnquiryRow>(`v1/branch/enquiries/${id}/`);
  return unwrap(res);
}

export async function moveBranchEnquiry(id: number, status: Exclude<EnquiryStatus, "new">) {
  const res = await adminRequest<{ id: number; status: EnquiryStatus }>(`v1/branch/enquiries/${id}/move/`, {
    method: "PATCH",
    body: { status },
  });
  return unwrap(res);
}

export async function reassignBranchEnquiry(id: number, staff_id: number) {
  const res = await adminRequest<{ id: number; assigned_to: string }>(`v1/branch/enquiries/${id}/reassign/`, {
    method: "PATCH",
    body: { staff_id },
  });
  return unwrap(res);
}

export async function addBranchEnquiryNote(id: number, text: string) {
  const res = await adminRequest<EnquiryNote>(`v1/branch/enquiries/${id}/notes/`, {
    method: "POST",
    body: { text },
  });
  return unwrap(res);
}
