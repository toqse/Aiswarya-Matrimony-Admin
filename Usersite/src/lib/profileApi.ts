import { BASE_URL } from "./config";
import { memberFetchWithAuthRetry } from "@/lib/memberAuthedFetch";
import { useAuthStore } from "@/stores/authStore";

/** GET v1/profile/ response */
export interface ProfileData {
  id?: string;
  matri_id?: string;
  basic_details?: {
    name?: string;
    gender?: string;
    dob?: string;
    email?: string;
    phone?: string;
  };
  photos?: Record<string, string | null>;
  religion_details?: {
    religion_id?: number;
    religion?: string;
    caste_id?: number;
    caste?: string;
    mother_tongue_id?: number;
    mother_tongue?: string;
    partner_preference_type?: string;
    partner_religion_ids?: Array<
      number | { id?: number; name?: string; religion?: string }
    >;
    partner_religion_preference?: Array<{
      religion_id?: number;
      religion?: string;
    }>;
    partner_caste_preferences?: Record<string, number[]>;
    partner_age_from?: number | null;
    partner_age_to?: number | null;
  };
  personal_details?: {
    marital_status_id?: number | string;
    marital_status?: string;
    has_children?: boolean;
    number_of_children?: number;
    children_count?: number;
    height_cm?: string;
    /** Some API responses use `height` / `weight` instead of *_cm / *_kg. */
    height?: string;
    weight_kg?: string;
    weight?: string;
    colour?: string;
    complexion?: string;
    blood_group?: string;
  };
  location_details?: {
    country_id?: number;
    country?: string;
    state_id?: number;
    state?: string;
    district_id?: number;
    district?: string;
    city_id?: number;
    city?: string;
    address?: string;
  };
  family_details?: Record<string, unknown> & {
    father_name?: string;
    father_status?: string;
    father_occupation?: string;
    mother_name?: string;
    mother_status?: string;
    mother_occupation?: string;
    brothers?: number;
    married_brothers?: number;
    sisters?: number;
    married_sisters?: number;
    about_family?: string;
    family_type?: string;
    family_status?: string;
  };
  education_details?: {
    highest_education_id?: number;
    highest_education?: string;
    education_subject_id?: number;
    education_subject?: string;
    employment_status_id?: number;
    employment_status?: string;
    occupation_id?: number;
    occupation?: string;
    annual_income_id?: number;
    annual_income?: string;
    income_range_id?: number;
  };
  about_me?: string;
  /** Flattened height/weight keys occasionally returned on the profile root. */
  height_cm?: string;
  height?: string;
  weight_kg?: string;
  weight?: string;
  blood_group?: string;
}

export interface ProfileResponse {
  success: boolean;
  data: ProfileData;
}

/** GET/POST v1/profile/birth-details/ */
export interface BirthDetailsData {
  time_of_birth?: string;
  place_of_birth?: string;
}

export interface BirthDetailsGetResponse {
  success: boolean;
  data: BirthDetailsData;
}

export interface BirthDetailsPostResponse {
  success: boolean;
  message?: string;
  data: BirthDetailsData;
}

export interface BirthDetailsBody {
  time_of_birth: string;
  place_of_birth: string;
}

export interface LocationBody {
  country_id: number;
  state_id: number;
  district_id: number;
  city_id: number;
  address: string;
}

export interface ReligionBody {
  religion_id?: number;
  caste_id?: number | null;
  mother_tongue_id?: number;
  partner_religion_preference?: string;
  partner_preference_type?:
    | "own_religion_only"
    | "open_to_all"
    | "specific_religions";
  partner_religion_ids?: number[];
  partner_caste_preferences?: Record<string, number[]>;
  partner_age_from?: number | null;
  partner_age_to?: number | null;
}

export interface PersonalBody {
  marital_status: string;
  has_children: boolean;
  number_of_children: number | null;
  height_cm: number;
  weight_kg: number | null;
  complexion: string;
  blood_group: string;
}

export interface EducationBody {
  highest_education: string;
  education_subject: string;
  employment: string;
  occupation: string;
  annual_income: string;
}

export interface GenerateAboutResponse {
  success: boolean;
  data: {
    about_me: string;
    suggestions: string[];
  };
}

export interface AboutBody {
  about_me: string;
}

/** PATCH v1/profile/basic/ — name, gender, dob, email only */
export interface BasicBody {
  name: string;
  gender: string;
  dob: string;
  email: string;
}

/** PATCH v1/profile/family/ */
export interface FamilyBody {
  father_name?: string;
  father_status?: "Alive" | "Late";
  father_occupation?: string;
  mother_name?: string;
  mother_status?: "Alive" | "Late";
  mother_occupation?: string;
  brothers?: number;
  married_brothers?: number;
  sisters?: number;
  married_sisters?: number;
  about_family?: string;
  family_type?: string;
  family_status?: string;
}

export interface FamilyDetailsData {
  father_name?: string;
  father_status?: "Alive" | "Late" | "";
  father_occupation?: string;
  mother_name?: string;
  mother_status?: "Alive" | "Late" | "";
  mother_occupation?: string;
  brothers?: number;
  married_brothers?: number;
  sisters?: number;
  married_sisters?: number;
  about_family?: string;
  family_type?: string;
  family_status?: string;
}

export interface FamilyDetailsResponse {
  success: boolean;
  data: FamilyDetailsData;
}

export interface PhotosBody {
  profile_photo?: File;
  full_photo?: File;
  selfie_photo?: File;
  family_photo?: File;
  aadhaar_front?: File;
  aadhaar_back?: File;
}

type ProfileErrorPayload = {
  detail?: string | string[];
  message?: string;
  error?:
    | string
    | {
        message?: string;
        [key: string]: unknown;
      };
  errors?:
    | string
    | string[]
    | Record<
        string,
        | string
        | string[]
        | {
            message?: string;
          }
      >;
  [key: string]: unknown;
};

const getProfileErrorMessage = (
  data: ProfileErrorPayload | unknown,
  fallback: string,
): string => {
  const payload = (data ?? {}) as ProfileErrorPayload;

  if (typeof payload.detail === "string" && payload.detail.trim())
    return payload.detail;
  if (Array.isArray(payload.detail) && payload.detail[0])
    return String(payload.detail[0]);

  if (typeof payload.message === "string" && payload.message.trim())
    return payload.message;
  if (payload.message && typeof payload.message === "object") {
    const msgObj = payload.message as Record<string, unknown>;
    for (const key of Object.keys(msgObj)) {
      const val = msgObj[key];
      if (typeof val === "string" && val.trim()) return val;
      if (Array.isArray(val) && val[0]) return String(val[0]);
    }
  }

  if (typeof payload.error === "string" && payload.error.trim())
    return payload.error;
  if (payload.error && typeof payload.error === "object") {
    const errObj = payload.error as {
      message?: unknown;
      detail?: unknown;
      errors?: unknown;
    };

    if (typeof errObj.message === "string" && errObj.message.trim())
      return errObj.message;
    if (errObj.message && typeof errObj.message === "object") {
      const inner = errObj.message as Record<string, unknown>;
      for (const key of Object.keys(inner)) {
        const val = inner[key];
        if (typeof val === "string" && val.trim()) return val;
        if (Array.isArray(val) && val[0]) return String(val[0]);
      }
    }

    if (typeof errObj.detail === "string" && errObj.detail.trim())
      return errObj.detail;
    if (Array.isArray(errObj.detail) && errObj.detail[0])
      return String(errObj.detail[0]);

    if (typeof errObj.errors === "string" && errObj.errors.trim())
      return errObj.errors;
    if (Array.isArray(errObj.errors) && errObj.errors[0])
      return String(errObj.errors[0]);
  }

  if (typeof payload.errors === "string" && payload.errors.trim())
    return payload.errors;
  if (Array.isArray(payload.errors) && payload.errors[0])
    return String(payload.errors[0]);

  if (payload.errors && typeof payload.errors === "object") {
    for (const key of Object.keys(payload.errors)) {
      const val = (payload.errors as Record<string, unknown>)[key];
      if (typeof val === "string" && val.trim()) return val;
      if (Array.isArray(val) && val[0]) return String(val[0]);
      if (
        val &&
        typeof val === "object" &&
        "message" in (val as { message?: string })
      ) {
        const msg = (val as { message?: string }).message;
        if (msg && msg.trim()) return msg;
      }
    }
  }

  return fallback;
};

function logProfileApiRequest(path: string, method: string, body: unknown | null) {
  const endpoint = `${BASE_URL}${path}`;
  console.log("[profileApi] request", redactSensitive({ endpoint, path, method, body }));
}

function logProfileApiResponse(path: string, method: string, status: number, response: unknown) {
  const endpoint = `${BASE_URL}${path}`;
  console.log("[profileApi] response", redactSensitive({ endpoint, path, method, status, response }));
}

function redactSigInUrl(url: string): string {
  return url.replace(/([?&]sig=)([^&]+)/gi, "$1<redacted>");
}

function redactSensitive<T>(value: T): T {
  if (typeof value === "string") return redactSigInUrl(value) as T;
  if (Array.isArray(value)) return value.map((v) => redactSensitive(v)) as T;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = redactSensitive(v);
    return out as T;
  }
  return value;
}

async function authedFetch<TRes = unknown>(
  path: string,
  opts: { method: string; body?: string },
): Promise<TRes> {
  const url = `${BASE_URL}${path}`;

  const bodyParsed: unknown | null =
    opts.body !== undefined ? (JSON.parse(opts.body) as unknown) : null;
  logProfileApiRequest(path, opts.method, bodyParsed);

  const res = await memberFetchWithAuthRetry(url, {
    method: opts.method,
    headers: { "Content-Type": "application/json" },
    ...(opts.body !== undefined && { body: opts.body }),
  });
  const data = (await res.json().catch(() => ({}))) as TRes &
    ProfileErrorPayload;
  logProfileApiResponse(path, opts.method, res.status, data);
  if (!res.ok) throw new Error(getProfileErrorMessage(data, "Request failed"));
  return data;
}

async function authedGet<TRes = unknown>(path: string): Promise<TRes> {
  return authedFetch<TRes>(path, { method: "GET" });
}

async function authedPost<TReq extends object, TRes = unknown>(
  path: string,
  body: TReq,
): Promise<TRes> {
  return authedFetch<TRes>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function authedPatch<TReq extends object, TRes = unknown>(
  path: string,
  body: TReq,
): Promise<TRes> {
  return authedFetch<TRes>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function getProfile(): Promise<ProfileResponse> {
  const path = "v1/profile/";
  const url = `${BASE_URL}${path}`;
  logProfileApiRequest(path, "GET", null);
  const res = await memberFetchWithAuthRetry(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = (await res.json().catch(() => ({}))) as ProfileResponse &
    ProfileErrorPayload;
  logProfileApiResponse(path, "GET", res.status, data);
  if (!res.ok)
    throw new Error(getProfileErrorMessage(data, "Failed to load profile"));
  return data as ProfileResponse;
}

/** Absolute URL for a profile media path from the API. */
export function profileMediaUrl(path: string | null | undefined): string {
  if (path == null || typeof path !== "string") return "";
  const t = path.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  const base = BASE_URL.replace(/\/api\/?$/i, "").replace(/\/$/, "");
  const p = t.startsWith("/") ? t : `/${t}`;
  return `${base}${p}`;
}

/** First available profile photo URL from GET v1/profile `photos`. */
export function pickProfilePrimaryPhoto(photos: ProfileData["photos"]): string {
  if (!photos || typeof photos !== "object") return "";
  const rec = photos as Record<string, string | null | undefined>;
  for (const k of [
    "profile_photo",
    "full_photo",
    "selfie_photo",
    "profile",
  ] as const) {
    const u = rec[k];
    if (typeof u === "string" && u.trim()) return profileMediaUrl(u);
  }
  return "";
}

/** Maps GET v1/profile into auth `user` (name, avatar, location, matri id, religion, etc.). */
export function syncMeProfileToStore(profile: ProfileData): void {
  const b = profile.basic_details;
  const loc = profile.location_details;
  const rel = profile.religion_details;
  const avatar = pickProfilePrimaryPhoto(profile.photos);
  const matriId = profile.matri_id?.trim();
  const displayName =
    (b?.name && String(b.name).trim()) || matriId || undefined;
  const genderRaw = b?.gender != null ? String(b.gender).trim() : "";
  const genderToken = genderRaw.toLowerCase();
  const gender =
    genderToken === "m" || genderToken === "male"
      ? "male"
      : genderToken === "f" || genderToken === "female" || genderToken === "g"
        ? "female"
        : genderToken || undefined;

  useAuthStore.setState((s) => {
    const u = s.user;
    if (!u) return {};
    const location =
      [loc?.city, loc?.state]
        .map((x) => (x != null ? String(x).trim() : ""))
        .filter(Boolean)
        .join(", ") || u.location;

    return {
      user: {
        ...u,
        name: displayName || u.name,
        email: (b?.email && String(b.email).trim()) || u.email,
        phone: (b?.phone && String(b.phone).trim()) || u.phone,
        matriId: matriId || u.matriId,
        location,
        religion: (rel?.religion && String(rel.religion).trim()) || u.religion,
        gender: gender || u.gender,
        avatar: avatar || u.avatar,
      },
    };
  });
}

/** Call after login or when entering dashboard — loads v1/profile and updates store. */
export async function fetchAndSyncMeProfile(): Promise<boolean> {
  try {
    const res = await getProfile();
    const profile =
      res?.data ??
      (typeof res === "object" && res !== null && "basic_details" in res
        ? (res as unknown as ProfileData)
        : null);
    if (!profile || typeof profile !== "object") return false;
    syncMeProfileToStore(profile);
    return true;
  } catch (e) {
    console.warn("[profile] fetchAndSyncMeProfile:", e);
    return false;
  }
}

export async function postLocation(body: LocationBody): Promise<unknown> {
  return authedPost("v1/profile/location/", body);
}

export async function patchBasic(body: BasicBody): Promise<unknown> {
  return authedPatch("v1/profile/basic/", body);
}

export async function patchLocation(body: LocationBody): Promise<unknown> {
  return authedPatch("v1/profile/location/", body);
}

export async function postReligion(body: ReligionBody): Promise<unknown> {
  return authedPost("v1/profile/religion/", body);
}

export async function patchReligion(body: ReligionBody): Promise<unknown> {
  return authedPatch("v1/profile/religion/", body);
}

export async function postPersonal(body: PersonalBody): Promise<unknown> {
  return authedPost("v1/profile/personal/", body);
}

export async function patchPersonal(body: PersonalBody): Promise<unknown> {
  return authedPatch("v1/profile/personal/", body);
}

export async function postEducation(body: EducationBody): Promise<unknown> {
  return authedPost("v1/profile/education/", body);
}

export async function patchEducation(body: EducationBody): Promise<unknown> {
  return authedPatch("v1/profile/education/", body);
}

export async function getGenerateAbout(): Promise<GenerateAboutResponse> {
  const path = "v1/profile/generate-about/";
  const url = `${BASE_URL}${path}`;
  logProfileApiRequest(path, "GET", null);
  const res = await memberFetchWithAuthRetry(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = (await res.json().catch(() => ({}))) as GenerateAboutResponse &
    ProfileErrorPayload;
  logProfileApiResponse(path, "GET", res.status, data);
  if (!res.ok)
    throw new Error(
      getProfileErrorMessage(data, "Failed to generate about me"),
    );
  return data;
}

export async function postAbout(body: AboutBody): Promise<unknown> {
  return authedPost("v1/profile/about/", body);
}

export async function patchAbout(body: AboutBody): Promise<unknown> {
  return authedPatch("v1/profile/about/", body);
}

export async function patchFamily(body: FamilyBody): Promise<unknown> {
  return authedPatch("v1/profile/family/", body);
}

export async function getProfileFamily(): Promise<FamilyDetailsResponse> {
  return authedGet<FamilyDetailsResponse>("v1/profile/family/");
}

export async function getProfileBasic(): Promise<{
  success: boolean;
  data: {
    name?: string;
    gender?: string;
    dob?: string;
    email?: string;
    phone?: string;
    profile_photo?: string | null;
    location?: string | null;
    matri_id?: string;
  };
}> {
  const path = "v1/profile/basic/";
  const url = `${BASE_URL}${path}`;
  logProfileApiRequest(path, "GET", null);
  const res = await memberFetchWithAuthRetry(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = (await res.json().catch(() => ({}))) as {
    success: boolean;
    data: {
      name?: string;
      gender?: string;
      dob?: string;
      email?: string;
      phone?: string;
    };
  } & ProfileErrorPayload;
  logProfileApiResponse(path, "GET", res.status, data);
  if (!res.ok)
    throw new Error(
      getProfileErrorMessage(data, "Failed to load basic profile"),
    );
  return data;
}

export async function getProfileCompletion(): Promise<{
  success: boolean;
  data: { percentage: number; steps_remaining: string[] };
}> {
  return authedFetch("v1/profile/completion/", { method: "GET" });
}

export async function getProfileViews(): Promise<{
  success: boolean;
  data: { total: number };
}> {
  return authedFetch("v1/profile/views/", { method: "GET" });
}

export interface PartnerPreferenceBody {
  partner_preference_type?:
    | "own_religion_only"
    | "open_to_all"
    | "specific_religions";
  partner_religion_ids?: number[];
  partner_caste_preferences?: Record<string, number[]>;
  partner_age_from?: number | null;
  partner_age_to?: number | null;
}

export interface ReligionDetailsData {
  religion_id?: number;
  religion?: string;
  caste_id?: number;
  caste?: string;
  mother_tongue_id?: number;
  mother_tongue?: string;
  partner_religion_preference?: string;
  partner_preference_type?:
    | "own_religion_only"
    | "open_to_all"
    | "specific_religions";
  partner_preference_type_label?: string;
  partner_religion_ids?: number[];
  partner_religion_names?: string[];
  partner_caste_preferences?: Record<string, number[]>;
  partner_age_from?: number | null;
  partner_age_to?: number | null;
}

export interface ReligionDetailsResponse {
  success: boolean;
  data: ReligionDetailsData;
}

export interface PartnerPreferenceData {
  partner_preference_type?:
    | "own_religion_only"
    | "open_to_all"
    | "specific_religions";
  partner_preference_type_label?: string;
  partner_religion_ids?: number[];
  partner_religion_names?: string[];
  partner_caste_preferences?: Record<string, number[]>;
  partner_age_from?: number | null;
  partner_age_to?: number | null;
}

export interface PartnerPreferenceResponse {
  success: boolean;
  data: PartnerPreferenceData;
}

/** GET v1/profile/birth-details/ */
export async function getBirthDetails(): Promise<BirthDetailsGetResponse> {
  return authedGet<BirthDetailsGetResponse>("v1/profile/birth-details/");
}

function birthDetailsPostErrorMessage(data: ProfileErrorPayload & Record<string, unknown>): string {
  const fromStandard = getProfileErrorMessage(data, "");
  if (fromStandard.trim()) return fromStandard;
  for (const key of Object.keys(data)) {
    if (key === "success" || key === "error") continue;
    const val = data[key];
    if (Array.isArray(val) && val.length > 0 && val[0] != null) {
      return String(val[0]);
    }
  }
  return "Request failed";
}

/** POST v1/profile/birth-details/ */
export async function updateBirthDetails(
  body: BirthDetailsBody,
): Promise<BirthDetailsPostResponse> {
  const path = "v1/profile/birth-details/";
  const url = `${BASE_URL}${path}`;
  logProfileApiRequest(path, "POST", body);
  const res = await memberFetchWithAuthRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as ProfileErrorPayload &
    Record<string, unknown>;
  logProfileApiResponse(path, "POST", res.status, data);
  if (!res.ok) {
    throw new Error(birthDetailsPostErrorMessage(data));
  }
  return data as unknown as BirthDetailsPostResponse;
}

export async function postPartnerPreference(
  body: PartnerPreferenceBody,
): Promise<unknown> {
  return authedPost("v1/profile/partner-preference/", body);
}

export async function patchPartnerPreferences(
  body: PartnerPreferenceBody,
): Promise<unknown> {
  return authedPatch("v1/profile/partner-preferences/", body);
}

export async function getProfileReligion(): Promise<ReligionDetailsResponse> {
  return authedGet<ReligionDetailsResponse>("v1/profile/religion/");
}

export async function patchProfileReligion(
  body: ReligionBody,
): Promise<ReligionDetailsResponse> {
  return authedPatch<ReligionBody, ReligionDetailsResponse>(
    "v1/profile/religion/",
    body,
  );
}

export async function getPartnerPreferences(): Promise<PartnerPreferenceResponse> {
  return authedGet<PartnerPreferenceResponse>("v1/profile/partner-preferences/");
}

export async function getPartnerPreference(): Promise<PartnerPreferenceResponse> {
  return authedGet<PartnerPreferenceResponse>("v1/profile/partner-preference/");
}

export async function postPhotos(body: PhotosBody): Promise<unknown> {
  const url = `${BASE_URL}v1/profile/photos/`;
  const formData = new FormData();

  if (body.profile_photo) formData.append("profile_photo", body.profile_photo);
  if (body.full_photo) formData.append("full_photo", body.full_photo);
  if (body.selfie_photo) formData.append("selfie_photo", body.selfie_photo);
  if (body.family_photo) formData.append("family_photo", body.family_photo);
  if (body.aadhaar_front) formData.append("aadhaar_front", body.aadhaar_front);
  if (body.aadhaar_back) formData.append("aadhaar_back", body.aadhaar_back);

  const path = "v1/profile/photos/";
  const bodyLog = {
    has_profile_photo: !!body.profile_photo,
    has_full_photo: !!body.full_photo,
    has_selfie_photo: !!body.selfie_photo,
    has_family_photo: !!body.family_photo,
    has_aadhaar_front: !!body.aadhaar_front,
    has_aadhaar_back: !!body.aadhaar_back,
  };
  logProfileApiRequest(path, "POST", bodyLog);

  const res = await memberFetchWithAuthRetry(url, {
    method: "POST",
    body: formData,
  });

  const data = (await res.json().catch(() => ({}))) as ProfileErrorPayload;
  logProfileApiResponse(path, "POST", res.status, data);

  if (!res.ok) {
    throw new Error(getProfileErrorMessage(data, "Failed to upload photos"));
  }

  return data;
}
