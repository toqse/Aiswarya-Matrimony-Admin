import type { HoroscopeRecordsFilters } from "@/lib/admin-api/horoscope";

/** Partner search filters on Porutham Matches tab. */
export interface PoruthamPartnerFiltersState {
  search: string;
  religion_id: string;
  caste_id: string;
  pr_star: string;
  rasi_id: string;
  rajju: string;
}

export const EMPTY_PORUTHAM_PARTNER_FILTERS: PoruthamPartnerFiltersState = {
  search: "",
  religion_id: "",
  caste_id: "",
  pr_star: "",
  rasi_id: "",
  rajju: "",
};

export function emptyPoruthamPartnerFilters(): PoruthamPartnerFiltersState {
  return { ...EMPTY_PORUTHAM_PARTNER_FILTERS };
}

export function poruthamPartnerFiltersToQuery(
  filters: PoruthamPartnerFiltersState,
  paging?: { page?: number; page_size?: number },
): HoroscopeRecordsFilters {
  const q: HoroscopeRecordsFilters = {
    page: paging?.page ?? 1,
    page_size: paging?.page_size ?? 100,
    exe_done: true,
  };
  const search = filters.search.trim();
  if (search) q.search = search;
  if (filters.religion_id) q.religion_id = Number(filters.religion_id);
  if (filters.caste_id) q.caste_id = Number(filters.caste_id);
  if (filters.pr_star) q.pr_star = filters.pr_star;
  if (filters.rasi_id) q.rasi_id = Number(filters.rasi_id);
  if (filters.rajju.trim()) q.rajju = filters.rajju.trim();
  return q;
}

export function hasActivePoruthamPartnerFilters(filters: PoruthamPartnerFiltersState): boolean {
  return (
    !!filters.search.trim()
    || !!filters.religion_id
    || !!filters.caste_id
    || !!filters.pr_star
    || !!filters.rasi_id
    || !!filters.rajju.trim()
  );
}
