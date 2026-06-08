import { BASE_URL } from "./config";

export interface Country {
  id: number;
  name: string;
  code: string;
}

export interface State {
  id: number;
  name: string;
  code: string;
  country: number;
}

export interface District {
  id: number;
  name: string;
  state: number;
}

export interface City {
  id: number;
  name: string;
  district: number;
}

export interface Religion {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Caste {
  id: number;
  name: string;
  is_active: boolean;
  religion: number;
}

export interface MotherTongue {
  id: number;
  name: string;
  is_active: boolean;
}

export interface EducationMaster {
  id: number;
  name: string;
  is_active?: boolean;
}

export interface EducationSubjectMaster {
  id: number;
  name: string;
  education?: number;
  education_id?: number;
  is_active?: boolean;
}

export interface OccupationMaster {
  id: number;
  name: string;
  is_active?: boolean;
}

export interface EmploymentStatusMaster {
  id: number;
  name: string;
  is_active?: boolean;
}

export interface IncomeRangeMaster {
  id: number;
  name: string;
  is_active?: boolean;
}

export interface MaritalStatusMaster {
  id: number;
  name: string;
  is_active?: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

async function getPaginated<T>(path: string, search?: string): Promise<T[]> {
  const base = path.startsWith("http") ? path : `${BASE_URL}${path.replace(/^\//, "")}`;
  const perPageLimit = 50;
  let page = 1;
  const allResults: T[] = [];

  // Uses explicit page+limit params as requested:
  // /api/v1/master/.../?page=1&limit=50
  // and continues page-by-page until server indicates no next page.
  while (true) {
    const url = new URL(base);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(perPageLimit));
    if (search != null && search.trim() !== "") {
      url.searchParams.set("search", search.trim());
    }
    const res = await fetch(url.toString());
    const data = (await res.json().catch(() => ({}))) as PaginatedResponse<T>;
    if (!res.ok)
      throw new Error((data as { detail?: string })?.detail ?? "Request failed");
    if (Array.isArray(data.results)) allResults.push(...data.results);
    if (!data.next) break;
    page += 1;
  }

  return allResults;
}

/** GET v1/master/countries?search= */
export async function getCountries(search?: string): Promise<Country[]> {
  const path = "v1/master/countries";
  const results = await getPaginated<Country>(path, search);
  console.log("[masterApi] getCountries response:", { search, results });
  return results;
}

/** GET v1/master/states/?country_id=<id>&search= */
export async function getStates(countryId: number, search?: string): Promise<State[]> {
  const path = `v1/master/states/?country_id=${countryId}`;
  const results = await getPaginated<State>(path, search);
  console.log("[masterApi] getStates response:", { countryId, search, results });
  return results;
}

/** GET v1/master/districts/?state_id=<id>&search= */
export async function getDistricts(stateId: number, search?: string): Promise<District[]> {
  const path = `v1/master/districts/?state_id=${stateId}`;
  const results = await getPaginated<District>(path, search);
  console.log("[masterApi] getDistricts response:", { stateId, search, results });
  return results;
}

/** GET v1/master/cities/?district_id=<id>&search= */
export async function getCities(districtId: number, search?: string): Promise<City[]> {
  const path = `v1/master/cities/?district_id=${districtId}`;
  const results = await getPaginated<City>(path, search);
  console.log("[masterApi] getCities response:", { districtId, search, results });
  return results;
}

/** GET v1/master/religions?search= */
export async function getReligions(search?: string): Promise<Religion[]> {
  const path = "v1/master/religions";
  const results = await getPaginated<Religion>(path, search);
  console.log("[masterApi] getReligions response:", { search, results });
  return results;
}

/** GET v1/master/castes/?religion_id=<id>&search= */
export async function getCastes(religionId: number, search?: string): Promise<Caste[]> {
  const path = `v1/master/castes/?religion_id=${religionId}`;
  const base = `${BASE_URL}${path.replace(/^\//, "")}`;
  const requestUrl = new URL(base);
  requestUrl.searchParams.set("page", "1");
  requestUrl.searchParams.set("limit", "50");
  if (search != null && search.trim() !== "") {
    requestUrl.searchParams.set("search", search.trim());
  }
  console.log("[masterApi] getCastes url:", requestUrl.toString());
  const results = await getPaginated<Caste>(path, search);
  console.log("[masterApi] getCastes response:", { religionId, search, results });
  return results;
}

/** GET v1/master/mother-tongues/?search= */
export async function getMotherTongues(search?: string): Promise<MotherTongue[]> {
  const path = "v1/master/mother-tongues/";
  const results = await getPaginated<MotherTongue>(path, search);
  console.log("[masterApi] getMotherTongues response:", { search, results });
  return results;
}

/** GET v1/master/educations/ */
export async function getEducations(search?: string): Promise<EducationMaster[]> {
  const path = "v1/master/educations/";
  const results = await getPaginated<EducationMaster>(path, search);
  console.log("[masterApi] getEducations response:", { search, results });
  return results;
}

/** GET v1/master/education-subjects/?education_id=<id> */
export async function getEducationSubjects(
  educationId: number,
  search?: string,
): Promise<EducationSubjectMaster[]> {
  const path = `v1/master/education-subjects/?education_id=${educationId}`;
  const results = await getPaginated<EducationSubjectMaster>(path, search);
  console.log("[masterApi] getEducationSubjects response:", {
    educationId,
    search,
    results,
  });
  return results;
}

/** GET v1/master/occupations/ */
export async function getOccupations(
  search?: string,
): Promise<OccupationMaster[]> {
  const path = "v1/master/occupations/";
  const results = await getPaginated<OccupationMaster>(path, search);
  console.log("[masterApi] getOccupations response:", { search, results });
  return results;
}

/** GET v1/master/employment-statuses/ */
export async function getEmploymentStatuses(
  search?: string,
): Promise<EmploymentStatusMaster[]> {
  const path = "v1/master/employment-statuses/";
  const results = await getPaginated<EmploymentStatusMaster>(path, search);
  console.log("[masterApi] getEmploymentStatuses response:", { search, results });
  return results;
}

/** GET v1/master/income-ranges/ */
export async function getIncomeRanges(
  search?: string,
): Promise<IncomeRangeMaster[]> {
  const path = "v1/master/income-ranges/";
  const results = await getPaginated<IncomeRangeMaster>(path, search);
  console.log("[masterApi] getIncomeRanges response:", { search, results });
  return results;
}

/** GET v1/master/marital-status/ */
export async function getMaritalStatuses(
  search?: string,
): Promise<MaritalStatusMaster[]> {
  const path = "v1/master/marital-status/";
  const results = await getPaginated<MaritalStatusMaster>(path, search);
  console.log("[masterApi] getMaritalStatuses response:", { search, results });
  return results;
}
