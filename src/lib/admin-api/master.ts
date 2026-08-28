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

export interface CountryItem {
  id: number;
  name: string;
  code?: string;
}

export interface StateItem {
  id: number;
  name: string;
  code?: string;
  country?: number;
}

export interface DistrictItem {
  id: number;
  name: string;
  state?: number;
}

export interface CityItem {
  id: number;
  name: string;
  district?: number;
}

export interface AdminCountryItem {
  id: number;
  name: string;
  code?: string;
  is_active: boolean;
  state_count?: number;
}

export interface AdminStateItem {
  id: number;
  name: string;
  code?: string;
  country: number;
  country_name?: string;
  is_active: boolean;
}

export interface AdminDistrictItem {
  id: number;
  name: string;
  state: number;
  state_name?: string;
  is_active: boolean;
}

export interface AdminCityItem {
  id: number;
  name: string;
  district: number;
  district_name?: string;
  is_active: boolean;
}

export interface LocationParentTab {
  id: number;
  name: string;
  state_count?: number;
  district_count?: number;
  city_count?: number;
}

export interface EducationItem {
  id: number;
  name: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EducationSubjectItem {
  id: number;
  name: string;
  education?: number;
  education_ids?: number[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OccupationItem {
  id: number;
  name: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmploymentStatusItem {
  id: number;
  name: string;
  is_active?: boolean;
}

export interface IncomeRangeItem {
  id: number;
  name: string;
  min_value?: number | null;
  max_value?: number | null;
}

export interface HeightItem {
  id: number;
  value_cm: number;
  display_label: string;
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
  if ("results" in d) return d as unknown as PaginatedMaster<T>;
  throw new Error("Invalid list response");
}

function neverMarriedFirst<T extends { name?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aNever = (a.name ?? "").trim().toLowerCase() === "never married";
    const bNever = (b.name ?? "").trim().toLowerCase() === "never married";
    if (aNever === bNever) return 0;
    return aNever ? -1 : 1;
  });
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

export async function fetchPublicMotherTongues(params?: { search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/master/mother-tongues/?${qs}` : "v1/master/mother-tongues/");
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

export async function fetchCountries(params?: { search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/master/countries/?${qs}` : "v1/master/countries/");
  return parsePaginated<CountryItem>(res);
}

export async function fetchStates(params: { country_id: number; search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  q.set("country_id", String(params.country_id));
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(`v1/master/states/?${qs}`);
  return parsePaginated<StateItem>(res);
}

export async function fetchDistricts(params: { state_id: number; search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  q.set("state_id", String(params.state_id));
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(`v1/master/districts/?${qs}`);
  return parsePaginated<DistrictItem>(res);
}

export async function fetchCities(params: { district_id: number; search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  q.set("district_id", String(params.district_id));
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(`v1/master/cities/?${qs}`);
  return parsePaginated<CityItem>(res);
}

export async function fetchAdminCountries(params?: { search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/admin/master/countries/?${qs}` : "v1/admin/master/countries/");
  return parsePaginated<AdminCountryItem>(res);
}

export async function createCountry(body: { name: string; code?: string }) {
  const res = await adminRequest<AdminCountryItem>("v1/admin/master/countries/", { method: "POST", body });
  return unwrap(res);
}

export async function updateCountry(id: number, body: { name?: string; code?: string }) {
  const res = await adminRequest<AdminCountryItem>(`v1/admin/master/countries/${id}/`, { method: "PATCH", body });
  return unwrap(res);
}

export async function deleteCountry(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/master/countries/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error(getAuthApiErrorMessage(res.data as AuthApiEnvelope<unknown>));
}

export async function fetchStateCountries() {
  const res = await adminRequest<LocationParentTab[]>("v1/admin/master/states/countries/");
  return unwrap(res);
}

export async function fetchAdminStates(params: {
  country_id: number;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const q = new URLSearchParams();
  q.set("country_id", String(params.country_id));
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const res = await adminRequest<never>(`v1/admin/master/states/?${q.toString()}`);
  return parsePaginated<AdminStateItem>(res);
}

export async function createState(body: { name: string; country: number; code?: string }) {
  const res = await adminRequest<AdminStateItem>("v1/admin/master/states/", { method: "POST", body });
  return unwrap(res);
}

export async function updateState(id: number, body: { name?: string; country?: number; code?: string }) {
  const res = await adminRequest<AdminStateItem>(`v1/admin/master/states/${id}/`, { method: "PATCH", body });
  return unwrap(res);
}

export async function deleteState(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/master/states/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error(getAuthApiErrorMessage(res.data as AuthApiEnvelope<unknown>));
}

export async function fetchDistrictStates(countryId: number) {
  const res = await adminRequest<LocationParentTab[]>(`v1/admin/master/districts/states/?country_id=${countryId}`);
  return unwrap(res);
}

export async function fetchAdminDistricts(params: {
  state_id: number;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const q = new URLSearchParams();
  q.set("state_id", String(params.state_id));
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const res = await adminRequest<never>(`v1/admin/master/districts/?${q.toString()}`);
  return parsePaginated<AdminDistrictItem>(res);
}

export async function createDistrict(body: { name: string; state: number }) {
  const res = await adminRequest<AdminDistrictItem>("v1/admin/master/districts/", { method: "POST", body });
  return unwrap(res);
}

export async function updateDistrict(id: number, body: { name?: string; state?: number }) {
  const res = await adminRequest<AdminDistrictItem>(`v1/admin/master/districts/${id}/`, { method: "PATCH", body });
  return unwrap(res);
}

export async function deleteDistrict(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/master/districts/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error(getAuthApiErrorMessage(res.data as AuthApiEnvelope<unknown>));
}

export async function fetchCityDistricts(stateId: number) {
  const res = await adminRequest<LocationParentTab[]>(`v1/admin/master/cities/districts/?state_id=${stateId}`);
  return unwrap(res);
}

export async function fetchAdminCities(params: {
  district_id: number;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const q = new URLSearchParams();
  q.set("district_id", String(params.district_id));
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const res = await adminRequest<never>(`v1/admin/master/cities/?${q.toString()}`);
  return parsePaginated<AdminCityItem>(res);
}

export async function createCity(body: { name: string; district: number }) {
  const res = await adminRequest<AdminCityItem>("v1/admin/master/cities/", { method: "POST", body });
  return unwrap(res);
}

export async function updateCity(id: number, body: { name?: string; district?: number }) {
  const res = await adminRequest<AdminCityItem>(`v1/admin/master/cities/${id}/`, { method: "PATCH", body });
  return unwrap(res);
}

export async function deleteCity(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/master/cities/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error(getAuthApiErrorMessage(res.data as AuthApiEnvelope<unknown>));
}

export async function fetchEducations(params?: { search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/master/educations/?${qs}` : "v1/master/educations/");
  return parsePaginated<EducationItem>(res);
}

export async function fetchEducationSubjects(params?: { education_id?: number; search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.education_id != null) q.set("education_id", String(params.education_id));
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/master/education-subjects/?${qs}` : "v1/master/education-subjects/");
  return parsePaginated<EducationSubjectItem>(res);
}

export async function fetchOccupations(params?: {
  search?: string;
  page?: number;
  page_size?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  const limit = params?.limit ?? params?.page_size;
  if (limit) q.set("limit", String(Math.min(Number(limit), 200)));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/master/occupations/?${qs}` : "v1/master/occupations/");
  return parsePaginated<OccupationItem>(res);
}

export async function fetchAdminEducations(params?: { search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/admin/master/educations/?${qs}` : "v1/admin/master/educations/");
  return parsePaginated<EducationItem>(res);
}

export async function createEducation(body: { name: string }) {
  const res = await adminRequest<EducationItem>("v1/admin/master/educations/", { method: "POST", body });
  return unwrap(res);
}

export async function updateEducation(id: number, body: { name?: string }) {
  const res = await adminRequest<EducationItem>(`v1/admin/master/educations/${id}/`, { method: "PATCH", body });
  return unwrap(res);
}

export async function deleteEducation(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/master/educations/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error(getAuthApiErrorMessage(res.data as AuthApiEnvelope<unknown>));
}

export async function fetchAdminEducationSubjects(params?: { search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(
    qs ? `v1/admin/master/education-subjects/?${qs}` : "v1/admin/master/education-subjects/",
  );
  return parsePaginated<EducationSubjectItem>(res);
}

export async function createEducationSubject(body: { name: string; educations?: number[] }) {
  const res = await adminRequest<EducationSubjectItem>("v1/admin/master/education-subjects/", { method: "POST", body });
  return unwrap(res);
}

export async function updateEducationSubject(id: number, body: { name?: string; educations?: number[] }) {
  const res = await adminRequest<EducationSubjectItem>(`v1/admin/master/education-subjects/${id}/`, {
    method: "PATCH",
    body,
  });
  return unwrap(res);
}

export async function deleteEducationSubject(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/master/education-subjects/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error(getAuthApiErrorMessage(res.data as AuthApiEnvelope<unknown>));
}

export async function fetchAdminOccupations(params?: { search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/admin/master/occupations/?${qs}` : "v1/admin/master/occupations/");
  return parsePaginated<OccupationItem>(res);
}

export async function createOccupation(body: { name: string }) {
  const res = await adminRequest<OccupationItem>("v1/admin/master/occupations/", { method: "POST", body });
  return unwrap(res);
}

export async function updateOccupation(id: number, body: { name?: string }) {
  const res = await adminRequest<OccupationItem>(`v1/admin/master/occupations/${id}/`, { method: "PATCH", body });
  return unwrap(res);
}

export async function deleteOccupation(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/master/occupations/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error(getAuthApiErrorMessage(res.data as AuthApiEnvelope<unknown>));
}

export async function fetchEmploymentStatuses(params?: { search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/master/employment-statuses/?${qs}` : "v1/master/employment-statuses/");
  return parsePaginated<EmploymentStatusItem>(res);
}

export async function fetchIncomeRanges(params?: { page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/master/income-ranges/?${qs}` : "v1/master/income-ranges/");
  return parsePaginated<IncomeRangeItem>(res);
}

export async function fetchHeights(params?: { page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/master/heights/?${qs}` : "v1/master/heights/");
  return parsePaginated<HeightItem>(res);
}

export async function fetchMaritalStatuses(params?: { page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/master/marital-status/?${qs}` : "v1/master/marital-status/");
  const parsed = parsePaginated<MasterItem>(res);
  return { ...parsed, results: neverMarriedFirst(parsed.results ?? []) };
}

export async function fetchComplexions(params?: { page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<never>(qs ? `v1/master/complexions/?${qs}` : "v1/master/complexions/");
  return parsePaginated<MasterItem>(res);
}
