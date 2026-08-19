import { adminRequest, adminFetchBlob, downloadBlob } from "@/lib/api-client";
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
  matri_id?: string;
  name?: string;
  religion_id?: number;
  branch_id?: number;
  page?: number;
  page_size?: number;
  gender?: string;
  exe_done?: boolean;
  pr_star?: string | number;
  rasi_id?: number;
  has_horoscope?: string;
  planet?: string;
  planet_house?: string | number;
  rajju?: string;
  dosham?: string;
  match_matri_id?: string;
  min_porutham_count?: string | number;
  rajju_match?: string;
  horoscope_match?: string;
  star_match?: string;
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
    matri_id: filters?.matri_id?.trim() || undefined,
    name: filters?.name?.trim() || undefined,
    religion_id: filters?.religion_id,
    branch_id: filters?.branch_id,
    page: filters?.page,
    page_size: filters?.page_size,
    gender: filters?.gender?.trim() || undefined,
    exe_done: filters?.exe_done ? "true" : undefined,
    pr_star: filters?.pr_star,
    rasi_id: filters?.rasi_id,
    has_horoscope: filters?.has_horoscope,
    planet: filters?.planet?.trim() || undefined,
    planet_house: filters?.planet_house,
    rajju: filters?.rajju?.trim() || undefined,
    dosham: filters?.dosham,
    match_matri_id: filters?.match_matri_id?.trim() || undefined,
    min_porutham_count: filters?.min_porutham_count,
    rajju_match: filters?.rajju_match,
    horoscope_match: filters?.horoscope_match,
    star_match: filters?.star_match,
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

const PORUTHAM_NAV_PAGE_SIZE = 100;

/** Rows with a usable profile_id for porutham navigation. */
export function horoscopeNavRows(page: HoroscopeRecordsPage): HoroscopeRecordRow[] {
  return page.results.filter((r) => r.profile_id != null);
}

export interface HoroscopeGenderNavQuery {
  gender: "F" | "M";
  branch_id?: number;
  page?: number;
}

/** Paginated in-scope horoscope list filtered by gender (bride F / groom M). */
export async function fetchHoroscopeRecordsByGender(
  role: UserRole,
  query: HoroscopeGenderNavQuery,
): Promise<HoroscopeRecordsPage> {
  return fetchHoroscopeRecords(role, {
    gender: query.gender,
    branch_id: query.branch_id,
    page: query.page ?? 1,
    page_size: PORUTHAM_NAV_PAGE_SIZE,
    exe_done: true,
  });
}

export interface PoruthamNavWindow {
  list: HoroscopeRecordRow[];
  index: number;
  /** Highest page number fetched so far (1-based). */
  loadedPage: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

export interface PoruthamNavSelectionItem {
  profile_id: number;
  matri_id: string;
  profile_name: string;
  row?: HoroscopeRecordRow;
}

export function rowToPoruthamSelection(row: HoroscopeRecordRow): PoruthamNavSelectionItem | null {
  if (row.profile_id == null) return null;
  return {
    profile_id: row.profile_id,
    matri_id: row.matri_id,
    profile_name: row.profile_name,
    row,
  };
}

export function createSyntheticNavRow(
  profileId: number,
  matriId?: string,
  profileName?: string,
): HoroscopeRecordRow {
  return {
    user_uuid: `nav-${profileId}`,
    matri_id: (matriId || "").trim(),
    profile_id: profileId,
    profile_name: (profileName || "").trim() || `Profile ${profileId}`,
    branch: "",
    religion: "",
    dob: "",
    rasi: "",
    nakshatram: "",
    dosham: "",
    mangal: false,
    jathagam_status: "not-applicable",
    last_edited_label: "",
    raw: {},
  };
}

function selectionItemToNavRow(item: PoruthamNavSelectionItem): HoroscopeRecordRow {
  return item.row ?? createSyntheticNavRow(item.profile_id, item.matri_id, item.profile_name);
}

/**
 * Builds a fixed navigation window from an explicit multi-select list (no API paging).
 */
export function initPoruthamNavFromSelection(
  selections: PoruthamNavSelectionItem[],
  activeProfileId: number,
  fallback?: { matriId?: string; profileName?: string },
): PoruthamNavWindow {
  const seen = new Set<number>();
  let list: HoroscopeRecordRow[] = [];
  for (const item of selections) {
    if (seen.has(item.profile_id)) continue;
    seen.add(item.profile_id);
    list.push(selectionItemToNavRow(item));
  }

  let index = list.findIndex((r) => r.profile_id === activeProfileId);
  if (index < 0) {
    const synthetic = createSyntheticNavRow(
      activeProfileId,
      fallback?.matriId,
      fallback?.profileName,
    );
    list = [synthetic, ...list];
    index = 0;
  }

  return {
    list,
    index: Math.max(0, index),
    loadedPage: 1,
    hasMore: false,
    hasPrevious: false,
  };
}

export interface InitPoruthamNavWindowInput {
  gender: "F" | "M";
  profileId: number;
  matriId?: string;
  profileName?: string;
}

/**
 * Loads page 1 of the gender list and positions the cursor on `profileId`.
 * If the profile is missing from page 1 (manual ID entry), prepends a synthetic row.
 */
export async function initPoruthamNavWindow(
  role: UserRole,
  branchId: number | undefined,
  input: InitPoruthamNavWindowInput,
): Promise<PoruthamNavWindow> {
  const page = await fetchHoroscopeRecordsByGender(role, {
    gender: input.gender,
    branch_id: branchId,
    page: 1,
  });
  let list = horoscopeNavRows(page);
  let index = list.findIndex((r) => r.profile_id === input.profileId);
  if (index < 0) {
    const synthetic = createSyntheticNavRow(
      input.profileId,
      input.matriId,
      input.profileName,
    );
    list = [synthetic, ...list];
    index = 0;
  }
  return {
    list,
    index,
    loadedPage: 1,
    hasMore: Boolean(page.next),
    hasPrevious: false,
  };
}

export interface AdvancePoruthamNavInput {
  gender: "F" | "M";
  direction: 1 | -1;
  window: PoruthamNavWindow;
  /** Skip rows whose profile_id equals this (avoid bride === groom). */
  excludeProfileId?: number;
}

export interface AdvancePoruthamNavResult {
  window: PoruthamNavWindow;
  row: HoroscopeRecordRow | null;
  canPrev: boolean;
  canNext: boolean;
}

async function fetchNavPage(
  role: UserRole,
  branchId: number | undefined,
  gender: "F" | "M",
  page: number,
): Promise<HoroscopeRecordsPage> {
  return fetchHoroscopeRecordsByGender(role, { gender, branch_id: branchId, page });
}

function navCanPrev(window: PoruthamNavWindow): boolean {
  return window.index > 0 || window.hasPrevious;
}

function navCanNext(window: PoruthamNavWindow, totalCount?: number): boolean {
  if (window.index < window.list.length - 1) return true;
  if (window.hasMore) return true;
  if (typeof totalCount === "number" && window.list.length < totalCount) return true;
  return false;
}

function pickNavRow(
  list: HoroscopeRecordRow[],
  startIndex: number,
  direction: 1 | -1,
  excludeProfileId?: number,
): { index: number; row: HoroscopeRecordRow | null } {
  let i = startIndex;
  while (i >= 0 && i < list.length) {
    const row = list[i]!;
    if (!excludeProfileId || row.profile_id !== excludeProfileId) {
      return { index: i, row };
    }
    i += direction;
  }
  return { index: startIndex, row: null };
}

/**
 * Moves the nav cursor forward/back, fetching adjacent pages when needed.
 */
export async function advancePoruthamNav(
  role: UserRole,
  branchId: number | undefined,
  input: AdvancePoruthamNavInput,
): Promise<AdvancePoruthamNavResult> {
  const { direction, gender, excludeProfileId } = input;
  let window = { ...input.window, list: [...input.window.list] };

  const finish = (row: HoroscopeRecordRow | null, index: number): AdvancePoruthamNavResult => {
    const nextWindow = { ...window, index };
    return {
      window: nextWindow,
      row,
      canPrev: navCanPrev(nextWindow),
      canNext: navCanNext(nextWindow),
    };
  };

  if (direction === 1) {
    let candidateIndex = window.index + 1;
    if (candidateIndex >= window.list.length) {
      if (!window.hasMore) {
        return finish(null, window.index);
      }
      const nextPage = await fetchNavPage(role, branchId, gender, window.loadedPage + 1);
      const newRows = horoscopeNavRows(nextPage);
      if (!newRows.length) {
        window = { ...window, hasMore: false };
        return finish(null, window.index);
      }
      window = {
        ...window,
        list: [...window.list, ...newRows],
        loadedPage: window.loadedPage + 1,
        hasMore: Boolean(nextPage.next),
      };
      candidateIndex = window.index + 1;
    }
    const picked = pickNavRow(window.list, candidateIndex, 1, excludeProfileId);
    if (!picked.row) {
      return finish(null, window.index);
    }
    window = { ...window, index: picked.index };
    return {
      window,
      row: picked.row,
      canPrev: navCanPrev(window),
      canNext: navCanNext(window),
    };
  }

  // direction === -1
  let candidateIndex = window.index - 1;
  if (candidateIndex < 0) {
    if (!window.hasPrevious || window.loadedPage <= 1) {
      return finish(null, window.index);
    }
    const prevPage = await fetchNavPage(role, branchId, gender, window.loadedPage - 1);
    const newRows = horoscopeNavRows(prevPage);
    if (!newRows.length) {
      window = { ...window, hasPrevious: false };
      return finish(null, window.index);
    }
    const offset = newRows.length;
    window = {
      ...window,
      list: [...newRows, ...window.list],
      index: window.index + offset,
      loadedPage: window.loadedPage - 1,
      hasPrevious: Boolean(prevPage.previous),
      hasMore: true,
    };
    candidateIndex = window.index - 1;
  }
  const picked = pickNavRow(window.list, candidateIndex, -1, excludeProfileId);
  if (!picked.row) {
    return finish(null, window.index);
  }
  window = { ...window, index: picked.index };
  return {
    window,
    row: picked.row,
    canPrev: navCanPrev(window),
    canNext: navCanNext(window),
  };
}

export function poruthamNavCapabilities(
  window: PoruthamNavWindow | null,
  excludeProfileId?: number,
): { canPrev: boolean; canNext: boolean } {
  if (!window || !window.list.length) return { canPrev: false, canNext: false };
  const canPrev = navCanPrev(window);
  let canNext = navCanNext(window);
  if (canNext && excludeProfileId != null) {
    const nextIdx = window.index + 1;
    if (nextIdx < window.list.length && window.list[nextIdx]?.profile_id === excludeProfileId && !window.hasMore) {
      const further = window.list.slice(nextIdx + 1).some((r) => r.profile_id !== excludeProfileId);
      canNext = further;
    }
  }
  return { canPrev, canNext };
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

/* ------------------------------------------------------------------ *
 * Jathagam PDFs tab:
 *   GET <role>/horoscope/records/?page=&page_size=  -> horoscope list
 *   GET v1/astrology/jathagam/<horoscope_id>/       -> Jathagam PDF (blob)
 * ------------------------------------------------------------------ */

/** Row shape used by the Jathagam PDFs tab. */
export interface AstrologyHoroscopeRow {
  /** Horoscope id used by the PDF download endpoint. */
  horoscope_id: number;
  /** Stable join key to match the admin jathakam-pdfs list (which carries the PDF url). */
  matri_id: string;
  name: string;
  pr_star: number | null;
  pr_dob: string;
  pr_rasi: string;
  /** Backend-computed readiness (the EXE has produced the chart). */
  is_ready: boolean;
  /** "calculated" | "awaiting_exe" */
  jathagam: string;
  star_display: string;
  dasa_display: string;
}

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** Maps a horoscope/records row (flat or {record, horoscope}) to the Jathagam row shape. */
function normalizeAstrologyHoroscope(row: unknown): AstrologyHoroscopeRow {
  const r = asObj(row);
  const horo = asObj(r.horoscope);
  const rec = asObj(r.record);
  const get = (k: string): unknown => r[k] ?? horo[k] ?? rec[k];

  let star: number | null = null;
  const starRaw = get("pr_star");
  if (typeof starRaw === "number" && !Number.isNaN(starRaw)) star = starRaw;
  else if (typeof starRaw === "string" && starRaw.trim() && !Number.isNaN(Number(starRaw))) star = Number(starRaw);

  const jathagam = pickStr(get("jathagam"));
  const isReadyRaw = get("is_ready");
  const is_ready = isReadyRaw === true || isReadyRaw === 1 || jathagam === "calculated";

  return {
    horoscope_id: pickNum(r.horoscope_id, horo.id, rec.horoscope_id, r.id),
    matri_id: pickStr(get("matri_id"), get("profile_matri_id"), get("matriId")),
    name: pickStr(get("name"), get("pr_name"), get("profile_name"), get("full_name")),
    pr_star: star,
    pr_dob: pickStr(get("dob"), get("pr_dob"), get("date_of_birth")),
    pr_rasi: pickStr(get("pr_rasi"), get("rasi")),
    is_ready,
    jathagam,
    star_display: pickStr(get("star_display"), get("star_name"), get("nakshatram")),
    dasa_display: pickStr(get("dasa_display")),
  };
}

export interface JathagamHoroscopesQuery {
  page?: number;
  page_size?: number;
  search?: string;
  branch_id?: number;
}

/** Lists horoscopes for the Jathagam PDFs tab via the admin horoscope records endpoint. */
export async function fetchJathagamHoroscopes(
  role: UserRole,
  query?: JathagamHoroscopesQuery,
): Promise<AstrologyHoroscopeRow[]> {
  const base = horoscopeBasePath(role);
  const q = toQs({
    page: query?.page ?? 1,
    page_size: query?.page_size ?? 100,
    search: query?.search?.trim() || undefined,
    branch_id: query?.branch_id,
    // Ask the backend to include the chart/display/readiness fields the tab needs.
    fields: "id,horoscope_id,name,pr_name,dob,pr_dob,pr_rasi,pr_star,star_display,dasa_display,is_ready,jathagam",
    include: "pr_rasi,star_display,dasa_display,is_ready,jathagam,horoscope_id",
  });
  const res = await adminRequest<unknown>(`${base}records/${q}`);
  const data = await unwrap(res);
  const { results } = unwrapListPayload(data);
  return results.map(normalizeAstrologyHoroscope);
}

/** Reads a (possibly JSON) error blob and returns the backend's message. */
async function readBlobError(blob: Blob): Promise<string> {
  try {
    const text = await blob.text();
    if (!text) return "";
    try {
      const j = JSON.parse(text) as Record<string, unknown>;
      const msg = j.message ?? j.detail ?? j.error ?? j.errors;
      return (typeof msg === "string" ? msg : JSON.stringify(msg ?? j)).slice(0, 300);
    } catch {
      return text.slice(0, 300);
    }
  } catch {
    return "";
  }
}

/**
 * Downloads the Jathagam PDF on-demand via GET v1/astrology/jathagam/<id>/.
 * The backend generates the PDF dynamically on each request — there is no stored URL.
 * Filename is built from the member's name + DOB: `jathagam_<pr_name>_<pr_dob>.pdf`.
 */
export async function downloadJathagamPdf(
  horoscopeId: number,
  prName?: string,
  prDob?: string,
): Promise<void> {
  if (!horoscopeId || Number.isNaN(horoscopeId)) {
    throw new Error("This row has no horoscope id, so the PDF can't be fetched.");
  }
  const { ok, status, blob } = await adminFetchBlob(`v1/astrology/jathagam/${horoscopeId}/`);
  if (!ok) {
    const detail = await readBlobError(blob);
    throw new Error(`Download failed (HTTP ${status})${detail ? `: ${detail}` : "."}`);
  }
  // Some backends return 200 with a JSON error body instead of the PDF bytes.
  if (blob.type.includes("application/json")) {
    const detail = await readBlobError(blob);
    throw new Error(`Download failed${detail ? `: ${detail}` : ": server did not return a PDF."}`);
  }
  const namePart = (prName || String(horoscopeId)).trim().replace(/\s+/g, "_") || String(horoscopeId);
  const dobPart = (prDob || "").trim();
  const fileName = dobPart ? `jathagam_${namePart}_${dobPart}.pdf` : `jathagam_${namePart}.pdf`;
  const pdfBlob = new Blob([blob], { type: "application/pdf" });
  downloadBlob(pdfBlob, fileName);
}

/**
 * Downloads the porutham (match) report PDF for a bride/groom pair via
 *   GET <role>/horoscope/match-report/?matri_id=<a>&partner_matri_id=<b>
 * The endpoint is role-scoped (admin / staff / branch) like every other
 * horoscope call. Filename: `match_report_<matri>_<partner>.pdf`.
 */
export async function downloadMatchReport(
  role: UserRole,
  matriId: string,
  partnerMatriId: string,
  fileLabel?: string,
): Promise<void> {
  const m = (matriId || "").trim();
  const p = (partnerMatriId || "").trim();
  if (!m || !p) {
    throw new Error("Both Matri IDs are required to download the match report.");
  }
  const base = horoscopeBasePath(role);
  const qs = toQs({ matri_id: m, partner_matri_id: p });
  const { ok, status, blob } = await adminFetchBlob(`${base}match-report/${qs}`);
  if (!ok) {
    const detail = await readBlobError(blob);
    throw new Error(`Download failed (HTTP ${status})${detail ? `: ${detail}` : "."}`);
  }
  // Some backends return 200 with a JSON error body instead of the PDF bytes.
  if (blob.type.includes("application/json")) {
    const detail = await readBlobError(blob);
    throw new Error(`Download failed${detail ? `: ${detail}` : ": server did not return a report."}`);
  }
  const label = (fileLabel || `${m}_${p}`).trim().replace(/\s+/g, "_") || `${m}_${p}`;
  const pdfBlob = new Blob([blob], { type: blob.type || "application/pdf" });
  downloadBlob(pdfBlob, `match_report_${label}.pdf`);
}
