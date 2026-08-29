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
  const starNum = Number(filters.pr_star);
  if (Number.isInteger(starNum) && starNum >= 1 && starNum <= 27) {
    q.pr_star = String(starNum);
  }
  const rasiNum = Number(filters.rasi_id);
  if (Number.isInteger(rasiNum) && rasiNum >= 1 && rasiNum <= 12) {
    q.rasi_id = rasiNum;
  }
  const rajju = filters.rajju.trim();
  if (rajju && rajju.toLowerCase() !== "all") {
    q.rajju = rajju;
  }
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
