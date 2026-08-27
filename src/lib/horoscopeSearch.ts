import type { HoroscopeRecordsFilters } from "@/lib/admin-api/horoscope";

/** Horoscope records list filters (aligned with Profile Admin horoscope fields + table columns). */
export interface HoroscopeSearchFiltersState {
  search: string;
  matri_id: string;
  name: string;
  religion_id: string;
  caste_id: string;
  branch_id: string;
  pr_star: string;
  rasi_id: string;
  planet: string;
  planet_house: string;
  has_horoscope: string;
  rajju: string;
  dosham: string;
  match_matri_id: string;
  min_porutham_count: string;
  rajju_match: string;
  horoscope_match: string;
  star_match: string;
}

export const EMPTY_HOROSCOPE_SEARCH: HoroscopeSearchFiltersState = {
  search: "",
  matri_id: "",
  name: "",
  religion_id: "",
  caste_id: "",
  branch_id: "",
  pr_star: "",
  rasi_id: "",
  planet: "",
  planet_house: "",
  has_horoscope: "",
  rajju: "",
  dosham: "",
  match_matri_id: "",
  min_porutham_count: "",
  rajju_match: "",
  horoscope_match: "",
  star_match: "",
};

function assignYesNo(
  out: HoroscopeRecordsFilters,
  key: keyof HoroscopeRecordsFilters,
  val: string,
) {
  if (val === "yes") (out as Record<string, unknown>)[key] = "true";
  else if (val === "no") (out as Record<string, unknown>)[key] = "false";
}

export function horoscopeSearchToQuery(
  filters: HoroscopeSearchFiltersState,
  paging?: { page?: number; page_size?: number },
): HoroscopeRecordsFilters {
  const q: HoroscopeRecordsFilters = {
    page: paging?.page,
    page_size: paging?.page_size,
  };

  const assign = (key: keyof HoroscopeRecordsFilters, val: unknown) => {
    if (val == null) return;
    if (typeof val === "string" && val.trim() === "") return;
    (q as Record<string, unknown>)[key] = val;
  };

  assign("search", filters.search.trim());
  assign("matri_id", filters.matri_id.trim());
  assign("name", filters.name.trim());
  if (filters.religion_id) assign("religion_id", Number(filters.religion_id));
  if (filters.caste_id) assign("caste_id", Number(filters.caste_id));
  if (filters.branch_id) assign("branch_id", Number(filters.branch_id));
  if (filters.pr_star) assign("pr_star", filters.pr_star);
  if (filters.rasi_id) assign("rasi_id", Number(filters.rasi_id));

  if (filters.planet.trim() && filters.planet_house.trim()) {
    assign("planet", filters.planet.trim());
    assign("planet_house", filters.planet_house.trim());
  }
  assignYesNo(q, "has_horoscope", filters.has_horoscope);
  assignYesNo(q, "dosham", filters.dosham);
  assignYesNo(q, "star_match", filters.star_match);

  if (filters.rajju.trim()) assign("rajju", filters.rajju.trim());
  if (filters.match_matri_id.trim()) assign("match_matri_id", filters.match_matri_id.trim());
  if (filters.min_porutham_count.trim()) assign("min_porutham_count", filters.min_porutham_count.trim());
  if (filters.rajju_match) assign("rajju_match", filters.rajju_match);
  if (filters.horoscope_match) assign("horoscope_match", filters.horoscope_match);

  return q;
}

export function hasActiveHoroscopeSearch(filters: HoroscopeSearchFiltersState): boolean {
  return (
    !!filters.search.trim()
    || !!filters.matri_id.trim()
    || !!filters.name.trim()
    || !!filters.religion_id
    || !!filters.caste_id
    || !!filters.branch_id
    || !!filters.pr_star
    || !!filters.rasi_id
    || (!!filters.planet && !!filters.planet_house)
    || !!filters.has_horoscope
    || !!filters.rajju.trim()
    || !!filters.dosham
    || !!filters.match_matri_id.trim()
    || !!filters.min_porutham_count.trim()
    || !!filters.rajju_match
    || !!filters.horoscope_match
    || !!filters.star_match
  );
}
