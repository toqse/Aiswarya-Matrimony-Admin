import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";
import type { AuthApiEnvelope } from "@/lib/auth-api";
import { getAuthApiErrorMessage } from "@/lib/auth-api";

export interface MasterItem {
  id: number;
  name: string;
  is_active: boolean;
  religion?: number;
  religion_name?: string;
  caste_count?: number;
}

export interface PaginatedMaster<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total?: number;
}

function parsePaginated<T>(res: { ok: boolean; data: unknown }): PaginatedMaster<T> {
  if (!res.ok) throw new Error(getAuthApiErrorMessage(res.data as AuthApiEnvelope<unknown>));
  const d = res.data as Record<string, unknown>;
  if (d.data && typeof d.data === "object" && d.data !== null && "results" in (d.data as object)) {
    return d.data as PaginatedMaster<T>;
  }
  if ("results" in d) return d as PaginatedMaster<T>;
  throw new Error("Invalid list response");
}

export async function fetchReligions(params?: { search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/admin/master/religions/?${qs}` : "v1/admin/master/religions/");
  return parsePaginated<MasterItem>(res);
}

export async function createReligion(body: { name: string }) {
  const res = await adminRequest<MasterItem>("v1/admin/master/religions/", { method: "POST", body });
  return unwrap(res);
}

export async function updateReligion(id: number, body: { name?: string }) {
  const res = await adminRequest<MasterItem>(`v1/admin/master/religions/${id}/`, { method: "PATCH", body });
  return unwrap(res);
}

export async function deleteReligion(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/master/religions/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error(getAuthApiErrorMessage(res.data as AuthApiEnvelope<unknown>));
}

export async function fetchCasteReligions() {
  const res = await adminRequest<MasterItem[]>("v1/admin/master/castes/religions/");
  return unwrap(res);
}

export async function fetchCastes(params: {
  religion_id: number;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const q = new URLSearchParams();
  q.set("religion_id", String(params.religion_id));
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(`v1/admin/master/castes/?${qs}`);
  return parsePaginated<MasterItem>(res);
}

export async function createCaste(body: { name: string; religion: number }) {
  const res = await adminRequest<MasterItem>("v1/admin/master/castes/", { method: "POST", body });
  return unwrap(res);
}

export async function updateCaste(id: number, body: { name?: string; religion?: number }) {
  const res = await adminRequest<MasterItem>(`v1/admin/master/castes/${id}/`, { method: "PATCH", body });
  return unwrap(res);
}

export async function deleteCaste(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/master/castes/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error(getAuthApiErrorMessage(res.data as AuthApiEnvelope<unknown>));
}

export async function fetchMotherTongues(params?: { search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/admin/master/mother-tongues/?${qs}` : "v1/admin/master/mother-tongues/");
  return parsePaginated<MasterItem>(res);
}

export async function createMotherTongue(body: { name: string }) {
  const res = await adminRequest<MasterItem>("v1/admin/master/mother-tongues/", { method: "POST", body });
  return unwrap(res);
}

export async function updateMotherTongue(id: number, body: { name?: string }) {
  const res = await adminRequest<MasterItem>(`v1/admin/master/mother-tongues/${id}/`, { method: "PATCH", body });
  return unwrap(res);
}

export async function deleteMotherTongue(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/master/mother-tongues/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error(getAuthApiErrorMessage(res.data as AuthApiEnvelope<unknown>));
}
