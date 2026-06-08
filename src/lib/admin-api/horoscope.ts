import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";
import type { UserRole } from "@/types/user-role";

function pickStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return "";
}

function pickNum(...vals: unknown[]): number {
  for (const v of vals) {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function nestedName(obj: unknown): string {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return "";
  const o = obj as Record<string, unknown>;
  return pickStr(o.name, o.title, o.label);
}

export function horoscopeBasePath(role: UserRole): string {
  if (role === "branch-manager") return "v1/branch/horoscope/";
  if (role === "staff") return "v1/staff/horoscope/";
  return "v1/admin/horoscope/";
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

/** Normalized row for Horoscope records table + actions */
export interface HoroscopeRecordRow {
  user_uuid: string;
  matri_id: string;
  profile_id: number | null;
  profile_name: string;
  branch: string;
  religion: string;
  dob: string;
  rasi: string;
  nakshatram: string;
  dosham: string;
  mangal: boolean;
  jathagam_status: "generated" | "pending" | "failed" | "not-applicable";
  last_edited_label: string;
  raw: Record<string, unknown>;
}

function normalizeJathagamStatus(v: unknown): HoroscopeRecordRow["jathagam_status"] {
  const s = pickStr(v).toLowerCase().replace(/\s+/g, "_");
  if (s.includes("generat") || s === "ready" || s === "done") return "generated";
  if (s.includes("pend") || s === "queued" || s === "processing") return "pending";
  if (s.includes("fail")) return "failed";
  if (s.includes("n/a") || s.includes("not_applicable") || s === "na" || s === "none") return "not-applicable";
  if (!s) return "not-applicable";
  return "pending";
}

export function normalizeHoroscopeRecord(row: unknown, index: number): HoroscopeRecordRow {
  let r = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;

  // Detail endpoint returns { record: {...}, horoscope: {...} }. Flatten so the
  // table/dialog can read fields from either side. `record` wins on conflicts.
  if (
    (r.record && typeof r.record === "object" && !Array.isArray(r.record)) ||
    (r.horoscope && typeof r.horoscope === "object" && !Array.isArray(r.horoscope))
  ) {
    const rec = (r.record && typeof r.record === "object" && !Array.isArray(r.record)
      ? r.record
      : {}) as Record<string, unknown>;
    const horo = (r.horoscope && typeof r.horoscope === "object" && !Array.isArray(r.horoscope)
      ? r.horoscope
      : {}) as Record<string, unknown>;
    r = { ...horo, ...rec, _record: rec, _horoscope: horo };
  }

  const user_uuid = pickStr(
    r.user_uuid,
    r.user_id,
    r.uuid,
    r.id,
    typeof r.user === "string" ? r.user : "",
    (r.user as Record<string, unknown>)?.uuid,
    (r.user as Record<string, unknown>)?.id,
  );
  const uuidFallback = `row-${index}`;

  const matri_id = pickStr(r.matri_id, r.profile_id_string, r.matriId);

  let profileId: number | null = null;
  const pid = r.profile_id ?? r.user_profile_id ?? r.user_pk ?? (typeof r.user === "object" && r.user ? (r.user as Record<string, unknown>).profile_id : undefined);
  if (typeof pid === "number" && !Number.isNaN(pid)) profileId = pid;
  else if (typeof pid === "string" && /^\d+$/.test(pid)) profileId = Number(pid);

  const branch = pickStr(r.branch_name, r.branch_title, typeof r.branch === "string" ? r.branch : "", nestedName(r.branch));

  const mangalRaw = r.mangal ?? r.mangal_dosham ?? r.mangal_dosha ?? r.manglik ?? r.has_mangal_dosham;
  const mangal =
    mangalRaw === true ||
    mangalRaw === "yes" ||
    pickStr(mangalRaw).toLowerCase() === "true" ||
    pickStr(mangalRaw).toLowerCase() === "yes";

  const lastEdited = pickStr(
    r.last_edited,
    r.last_edited_at,
    r.updated_at,
    r.modified_at,
    r.edited_at,
  );
  const lastEditor = pickStr(r.last_edited_by_name, r.last_edited_by, r.updated_by_name, r.updated_by, r.staff_name, nestedName(r.last_edited_by_user), nestedName(r.updated_by_user));
  const last_edited_label = [lastEditor, lastEdited].filter(Boolean).join(" · ") || "";

  return {
    user_uuid: user_uuid || uuidFallback,
    matri_id,
    profile_id: profileId,
    profile_name: pickStr(r.name, r.profile_name, r.full_name, r.display_name, nestedName(r.profile), nestedName(r.user)),
    branch,
    religion: pickStr(r.religion, r.religion_name, nestedName(r.religion_obj)),
    dob: pickStr(r.dob, r.date_of_birth, r.birth_date, r.birthdate, r.pr_dob),
    rasi: pickStr(r.rasi, r.rasi_sign, r.pr_rasi, r.moon_sign, r.rashi),
    nakshatram: pickStr(r.nakshatram, r.nakshatra, r.star_name, r.star, r.pr_star),
    dosham: pickStr(r.dosham, r.dosha_summary, r.dosha),
    mangal,
    jathagam_status: normalizeJathagamStatus(r.jathagam_status ?? r.chart_status ?? r.pdf_status ?? r.jathakam_status),
    last_edited_label,
    raw: r,
  };
}

export interface HoroscopeSummaryKpis {
  total_horoscopes: number;
  jathagam_generated: number;
  pending_generation: number;
  match_calculations: number;
  mangal_dosham: number;
}

export function normalizeHoroscopeSummary(payload: unknown): HoroscopeSummaryKpis {
  const p = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  return {
    total_horoscopes: pickNum(
      p.total_horoscopes,
      p.total,
      p.horoscope_count,
      p.records_total,
    ),
    jathagam_generated: pickNum(p.jathagam_generated, p.generated, p.jathagam_ready, p.charts_generated),
    pending_generation: pickNum(p.pending_generation, p.pending, p.jathagam_pending, p.charts_pending),
    match_calculations: pickNum(p.match_calculations, p.porutham_count, p.matches_count),
    mangal_dosham: pickNum(p.mangal_dosham, p.mangal_count, p.manglik_count),
  };
}

export interface HoroscopeRecordsPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: HoroscopeRecordRow[];
}

function unwrapListPayload(payload: unknown): { count: number; next: string | null; previous: string | null; results: unknown[] } {
  let p = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  if (p.data && typeof p.data === "object" && p.data !== null && !Array.isArray(p.data)) {
    p = p.data as Record<string, unknown>;
  }
  const resultsRaw = p.results;
  const results = Array.isArray(resultsRaw) ? resultsRaw : [];
  return {
    count: typeof p.count === "number" ? p.count : results.length,
    next: (p.next as string | null | undefined) ?? null,
    previous: (p.previous as string | null | undefined) ?? null,
    results,
  };
}

export interface HoroscopeRecordsFilters {
  search?: string;
  branch_id?: number;
  page?: number;
  page_size?: number;
}

export interface HoroscopeSummaryQuery {
  /** Optional master branch id (branch manager / staff parity with other branch APIs). */
  branch_id?: number;
}

export async function fetchHoroscopeSummary(role: UserRole, query?: HoroscopeSummaryQuery): Promise<HoroscopeSummaryKpis> {
  const base = horoscopeBasePath(role);
  const q = toQs({ branch_id: query?.branch_id });
  const res = await adminRequest<unknown>(`${base}summary/${q}`);
  const data = await unwrap(res);
  return normalizeHoroscopeSummary(data);
}

export async function fetchHoroscopeRecords(role: UserRole, filters?: HoroscopeRecordsFilters): Promise<HoroscopeRecordsPage> {
  const base = horoscopeBasePath(role);
  const q = toQs({
    search: filters?.search?.trim() || undefined,
    branch_id: filters?.branch_id,
    page: filters?.page,
    page_size: filters?.page_size,
  });
  const res = await adminRequest<unknown>(`${base}records/${q}`);
  const data = await unwrap(res);
  const { count, next, previous, results } = unwrapListPayload(data);
  return {
    count,
    next,
    previous,
    results: results.map((row, i) => normalizeHoroscopeRecord(row, i)),
  };
}

export async function fetchHoroscopeRecordByMatri(role: UserRole, matriId: string): Promise<Record<string, unknown>> {
  const base = horoscopeBasePath(role);
  const enc = encodeURIComponent(matriId.trim());
  const res = await adminRequest<unknown>(`${base}records/by-matri/${enc}/`);
  const data = await unwrap(res);
  if (data && typeof data === "object" && !Array.isArray(data)) return data as Record<string, unknown>;
  return {};
}

export async function fetchHoroscopeRecordDetail(role: UserRole, userUuid: string): Promise<Record<string, unknown>> {
  const base = horoscopeBasePath(role);
  const enc = encodeURIComponent(userUuid.trim());
  const res = await adminRequest<unknown>(`${base}records/${enc}/`);
  const data = await unwrap(res);
  if (data && typeof data === "object" && !Array.isArray(data)) return data as Record<string, unknown>;
  return {};
}

export async function postHoroscopeRegenerate(role: UserRole, userUuid: string): Promise<unknown> {
  const base = horoscopeBasePath(role);
  const enc = encodeURIComponent(userUuid.trim());
  const res = await adminRequest<unknown>(`${base}records/${enc}/regenerate/`, { method: "POST", body: {} });
  return unwrap(res);
}

export async function postHoroscopePorutham(
  role: UserRole,
  body: { bride_profile_id: number; groom_profile_id: number },
): Promise<unknown> {
  const base = horoscopeBasePath(role);
  const res = await adminRequest<unknown>(`${base}porutham/`, { method: "POST", body });
  return unwrap(res);
}

export interface JathakamPdfRow {
  matri_id: string;
  profile_name: string;
  branch: string;
  pdf_url: string;
  status: string;
  raw: Record<string, unknown>;
}

function normalizeJathakamRow(row: unknown, index: number): JathakamPdfRow {
  const r = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
  const pdf_url = pickStr(
    r.pdf_url,
    r.url,
    r.file_url,
    r.download_url,
    r.jathakam_url,
    r.jathagam_pdf_url,
    typeof r.pdf === "string" ? r.pdf : "",
  );
  return {
    matri_id: pickStr(r.matri_id, r.profile_matri_id),
    profile_name: pickStr(r.name, r.profile_name, r.full_name),
    branch: pickStr(r.branch_name, typeof r.branch === "string" ? r.branch : "", nestedName(r.branch)),
    pdf_url,
    status: pickStr(r.status, r.jathagam_status, r.state) || "—",
    raw: r,
  };
}

export interface JathakamPdfsQuery {
  branch_id?: number;
}

export async function fetchJathakamPdfs(role: UserRole, query?: JathakamPdfsQuery): Promise<JathakamPdfRow[]> {
  const base = horoscopeBasePath(role);
  const q = toQs({ branch_id: query?.branch_id });
  const res = await adminRequest<unknown>(`${base}jathakam-pdfs/${q}`);
  const data = await unwrap(res);
  if (Array.isArray(data)) return data.map((row, i) => normalizeJathakamRow(row, i));
  const { results } = unwrapListPayload(data);
  return results.map((row, i) => normalizeJathakamRow(row, i));
}
