import type { ProfilesQuery } from "@/lib/admin-api/profiles";
import { normalizePhoneQuery } from "@/lib/admin-api/profiles";
import { RASI_NAMES_EN, STAR_NAMES_ML } from "@/components/horoscope/horoscope-i18n";

export interface ProfileSearchFiltersState {
  matri_id: string;
  name: string;
  phone: string;
  age_from: string;
  age_to: string;
  religion_id: string;
  caste_id: string;
  pr_star: string;
  state_id: string;
  district_id: string;
  education_id: string;
  occupation_id: string;
  marital_status_id: string;
  profile_status: string;
  staff_id: string;
  plan_id: string;
  has_photo: string;
  height_from_cm: string;
  height_to_cm: string;
  income_id: string;
  registered_from: string;
  registered_to: string;
  rasi_id: string;
  has_horoscope: string;
  planet: string;
  planet_house: string;
  rajju: string;
  dosham: string;
  match_matri_id: string;
  min_porutham_count: string;
  rajju_match: string;
  horoscope_match: string;
  star_match: string;
}

export const EMPTY_PROFILE_SEARCH: ProfileSearchFiltersState = {
  matri_id: "",
  name: "",
  phone: "",
  age_from: "",
  age_to: "",
  religion_id: "",
  caste_id: "",
  pr_star: "",
  state_id: "",
  district_id: "",
  education_id: "",
  occupation_id: "",
  marital_status_id: "",
  profile_status: "all",
  staff_id: "",
  plan_id: "",
  has_photo: "",
  height_from_cm: "",
  height_to_cm: "",
  income_id: "",
  registered_from: "",
  registered_to: "",
  rasi_id: "",
  has_horoscope: "",
  planet: "",
  planet_house: "",
  rajju: "",
  dosham: "",
  match_matri_id: "",
  min_porutham_count: "",
  rajju_match: "",
  horoscope_match: "",
  star_match: "",
};

export const PROFILE_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "complete", label: "Complete" },
  { value: "incomplete", label: "Incomplete" },
  { value: "subscribed", label: "Subscribed" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
] as const;

export const PHOTO_OPTIONS = [
  { value: "", label: "Any" },
  { value: "yes", label: "Photo available" },
  { value: "no", label: "No photo" },
] as const;

export const YES_NO_ANY_OPTIONS = [
  { value: "", label: "Any" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

export const RAJJU_OPTIONS = [
  { value: "", label: "Any" },
  { value: "Padam", label: "Padam" },
  { value: "Kanda", label: "Kanda" },
  { value: "Udara", label: "Udara" },
  { value: "Siro", label: "Siro" },
] as const;

export const RAJJU_MATCH_OPTIONS = [
  { value: "", label: "Any" },
  { value: "pass", label: "Pass (no dosham)" },
  { value: "fail", label: "Fail (dosham)" },
] as const;

export const HOROSCOPE_MATCH_OPTIONS = [
  { value: "", label: "Any" },
  { value: "good", label: "Good match" },
] as const;

export const NAKSHATRA_OPTIONS: { value: string; label: string }[] = STAR_NAMES_ML.map(
  (label, index) => {
    if (index === 0 || !label) return null;
    return { value: String(index), label: `${index} — ${label}` };
  },
).filter(Boolean) as { value: string; label: string }[];

export const RASI_OPTIONS: { value: string; label: string }[] = RASI_NAMES_EN.map(
  (label, index) => {
    if (index === 0 || !label) return null;
    return { value: String(index), label: `${index} — ${label}` };
  },
).filter(Boolean) as { value: string; label: string }[];

/** Planet keys for rasi-chart house-from-Lagnam filter (malefics first). */
export const PLANET_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Any planet" },
  { value: "ravi", label: "Ravi (Papa)" },
  { value: "kuja", label: "Kuja (Papa)" },
  { value: "sani", label: "Sani (Papa)" },
  { value: "rahu", label: "Rahu (Papa)" },
  { value: "kethu", label: "Kethu (Papa)" },
  { value: "chandran", label: "Chandran" },
  { value: "budhan", label: "Budhan" },
  { value: "guru", label: "Guru" },
  { value: "sukran", label: "Sukran" },
  { value: "lagnam", label: "Lagnam" },
  { value: "maandi", label: "Maandi" },
];

export const PLANET_HOUSE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Any house" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  })),
];

function assignYesNo(
  q: ProfilesQuery,
  key: keyof ProfilesQuery,
  val: string,
) {
  if (val === "yes") (q as Record<string, unknown>)[key] = "true";
  else if (val === "no") (q as Record<string, unknown>)[key] = "false";
}

export function profileSearchToQuery(
  filters: ProfileSearchFiltersState,
  paging?: { page?: number; page_size?: number },
): ProfilesQuery {
  const q: ProfilesQuery = {
    page: paging?.page,
    page_size: paging?.page_size,
  };

  const assign = (key: keyof ProfilesQuery, val: unknown) => {
    if (val == null) return;
    if (typeof val === "string" && val.trim() === "") return;
    (q as Record<string, unknown>)[key] = val;
  };

  assign("matri_id", filters.matri_id.trim());
  assign("name", filters.name.trim());
  const phoneRaw = filters.phone.trim();
  if (phoneRaw) {
    assign("phone", normalizePhoneQuery(phoneRaw) || phoneRaw);
  }
  if (filters.age_from.trim()) assign("age_from", filters.age_from.trim());
  if (filters.age_to.trim()) assign("age_to", filters.age_to.trim());
  if (filters.religion_id) assign("religion_id", Number(filters.religion_id));
  if (filters.caste_id) assign("caste_id", Number(filters.caste_id));
  if (filters.pr_star) assign("pr_star", filters.pr_star);
  if (filters.state_id) assign("state_id", Number(filters.state_id));
  if (filters.district_id) assign("district_id", Number(filters.district_id));
  if (filters.education_id) assign("education_id", Number(filters.education_id));
  if (filters.occupation_id) assign("occupation_id", Number(filters.occupation_id));
  if (filters.marital_status_id) assign("marital_status_id", Number(filters.marital_status_id));
  if (filters.staff_id) assign("staff_id", Number(filters.staff_id));
  if (filters.plan_id) assign("plan_id", filters.plan_id);
  if (filters.has_photo === "yes") assign("has_photo", "true");
  if (filters.has_photo === "no") assign("has_photo", "false");

  if (filters.height_from_cm.trim()) assign("height_from_cm", filters.height_from_cm.trim());
  if (filters.height_to_cm.trim()) assign("height_to_cm", filters.height_to_cm.trim());
  if (filters.income_id) assign("income_id", Number(filters.income_id));
  if (filters.registered_from.trim()) assign("registered_from", filters.registered_from.trim());
  if (filters.registered_to.trim()) assign("registered_to", filters.registered_to.trim());
  if (filters.rasi_id) assign("rasi_id", Number(filters.rasi_id));
  assignYesNo(q, "has_horoscope", filters.has_horoscope);
  if (filters.planet.trim() && filters.planet_house.trim()) {
    assign("planet", filters.planet.trim());
    assign("planet_house", filters.planet_house.trim());
  }
  if (filters.rajju.trim()) assign("rajju", filters.rajju.trim());
  assignYesNo(q, "dosham", filters.dosham);

  if (filters.match_matri_id.trim()) assign("match_matri_id", filters.match_matri_id.trim());
  if (filters.min_porutham_count.trim()) assign("min_porutham_count", filters.min_porutham_count.trim());
  if (filters.rajju_match) assign("rajju_match", filters.rajju_match);
  if (filters.horoscope_match) assign("horoscope_match", filters.horoscope_match);
  if (filters.star_match) assign("star_match", filters.star_match);

  if (filters.profile_status && filters.profile_status !== "all") {
    q.filter = filters.profile_status as ProfilesQuery["filter"];
  }

  return q;
}

export function hasActiveProfileSearch(filters: ProfileSearchFiltersState): boolean {
  return (
    !!filters.matri_id.trim()
    || !!filters.name.trim()
    || !!filters.phone.trim()
    || !!filters.age_from.trim()
    || !!filters.age_to.trim()
    || !!filters.religion_id
    || !!filters.caste_id
    || !!filters.pr_star
    || !!filters.state_id
    || !!filters.district_id
    || !!filters.education_id
    || !!filters.occupation_id
    || !!filters.marital_status_id
    || (filters.profile_status && filters.profile_status !== "all")
    || !!filters.staff_id
    || !!filters.plan_id
    || !!filters.has_photo
    || !!filters.height_from_cm.trim()
    || !!filters.height_to_cm.trim()
    || !!filters.income_id
    || !!filters.registered_from.trim()
    || !!filters.registered_to.trim()
    || !!filters.rasi_id
    || !!filters.has_horoscope
    || (!!filters.planet && !!filters.planet_house)
    || !!filters.rajju.trim()
    || !!filters.dosham
    || !!filters.match_matri_id.trim()
    || !!filters.min_porutham_count.trim()
    || !!filters.rajju_match
    || !!filters.horoscope_match
    || !!filters.star_match
  );
}
