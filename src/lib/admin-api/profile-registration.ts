/**
 * Builds the multipart FormData payload for staff/admin member registration from the
 * AddProfileWizard form. Shared by staff "My Profiles" and admin "Profile Admin" so both
 * create flows stay in sync with the backend `registration` contract.
 */
import { formatPhoneForApi, digitsOnlyMobile } from "@/lib/phone";
import { compressProfileUploadFile } from "@/lib/compressImage";
import {
  EMPTY_FAMILY_FIELDS,
  type FamilyFormFields,
} from "@/components/profile/FamilyDetailsSection";
import {
  EMPTY_PARTNER_PREFERENCE_FIELDS,
  type PartnerPreferenceFields,
  type PartnerPreferenceType,
} from "@/components/profile/PartnerPreferenceSection";

const FILE_KEYS = [
  "full_photo",
  "passport_photo",
  "profile_photo",
  "selfie_photo",
  "family_photo",
  "aadhaar_front",
  "aadhaar_back",
] as const;

async function appendCompressedFiles(
  fd: FormData,
  source: Record<string, unknown>,
): Promise<void> {
  await Promise.all(
    FILE_KEYS.map(async (k) => {
      const f = source[k];
      if (!(f instanceof File)) return;
      const compressed = await compressProfileUploadFile(k, f);
      fd.append(k, compressed);
    }),
  );
}

function isoToDDMMYYYY(iso: string): string {
  // iso expected: YYYY-MM-DD
  const [y, m, d] = String(iso ?? "").split("-");
  if (!y || !m || !d) return String(iso ?? "");
  return `${d}-${m}-${y}`;
}

function parentStatusToApi(ui: string): string | undefined {
  if (!ui) return undefined;
  const s = ui.trim().toLowerCase();
  if (s === "deceased" || s === "late") return "Late";
  if (s === "alive") return "Alive";
  return ui;
}

function parentStatusToUi(api: unknown): string {
  const s = String(api ?? "").trim().toLowerCase();
  if (!s) return "Alive";
  if (s === "deceased" || s === "late") return "Late";
  if (s === "alive") return "Alive";
  return String(api ?? "").trim() || "Alive";
}

function phoneFromApi(value: unknown): string {
  const s = String(value ?? "").trim();
  if (!s) return "";
  return digitsOnlyMobile(s);
}

export function buildFamilyDetailsPayload(form: FamilyFormFields): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    father_name: form.fatherName.trim() || undefined,
    father_occupation: form.fatherOccupation.trim() || undefined,
    father_status: parentStatusToApi(form.fatherStatus),
    mother_name: form.motherName.trim() || undefined,
    mother_occupation: form.motherOccupation.trim() || undefined,
    mother_status: parentStatusToApi(form.motherStatus),
    brothers: form.brothersCount !== "" ? Number(form.brothersCount) : undefined,
    married_brothers: form.marriedBrothersCount !== "" ? Number(form.marriedBrothersCount) : undefined,
    sisters: form.sistersCount !== "" ? Number(form.sistersCount) : undefined,
    married_sisters: form.marriedSistersCount !== "" ? Number(form.marriedSistersCount) : undefined,
    brother_occupation: form.brotherOccupation.trim() || undefined,
    sister_occupation: form.sisterOccupation.trim() || undefined,
    family_type: form.familyType || undefined,
    family_status: form.familyStatus || undefined,
    family_contact: form.familyContact ? formatPhoneForApi(form.familyContact) : undefined,
    family_contact_2: form.familyContact2 ? formatPhoneForApi(form.familyContact2) : undefined,
    about_family: form.aboutFamily.trim() || undefined,
  };
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
}

export function mapFamilyDetailsToForm(family: Record<string, unknown> | undefined): FamilyFormFields {
  const f = family ?? {};
  return {
    fatherName: String(f.father_name ?? ""),
    fatherOccupation: String(f.father_occupation ?? ""),
    fatherStatus: parentStatusToUi(f.father_status),
    motherName: String(f.mother_name ?? ""),
    motherOccupation: String(f.mother_occupation ?? ""),
    motherStatus: parentStatusToUi(f.mother_status),
    brothersCount: f.brothers != null ? String(f.brothers) : "",
    marriedBrothersCount: f.married_brothers != null ? String(f.married_brothers) : "",
    sistersCount: f.sisters != null ? String(f.sisters) : "",
    marriedSistersCount: f.married_sisters != null ? String(f.married_sisters) : "",
    brotherOccupation: String(f.brother_occupation ?? ""),
    sisterOccupation: String(f.sister_occupation ?? ""),
    familyType: String(f.family_type ?? ""),
    familyStatus: String(f.family_status ?? ""),
    familyContact: phoneFromApi(f.family_contact),
    familyContact2: phoneFromApi(f.family_contact_2),
    aboutFamily: String(f.about_family ?? ""),
  };
}

export { EMPTY_FAMILY_FIELDS, EMPTY_PARTNER_PREFERENCE_FIELDS };

function normalizePartnerCastePreferences(raw: unknown): Record<string, number[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: Record<string, number[]> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(val)) continue;
    const ids = val.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0);
    if (ids.length) result[String(key)] = ids;
  }
  return result;
}

export function buildPartnerReligionDetails(form: {
  religionId: string;
  partnerPreferenceType: PartnerPreferenceType;
  partnerReligionIds: string[];
  partnerCastePreferences: Record<string, number[]>;
  partnerAgeFrom: string;
  partnerAgeTo: string;
}): Record<string, unknown> {
  const religionId = form.religionId ? Number(form.religionId) : 0;
  const prefType = form.partnerPreferenceType;
  const rawCastePreferences = form.partnerCastePreferences ?? {};

  const partnerAgeFrom = form.partnerAgeFrom.trim() ? Number(form.partnerAgeFrom) : undefined;
  const partnerAgeTo = form.partnerAgeTo.trim() ? Number(form.partnerAgeTo) : undefined;

  let partnerReligionIds: number[] | undefined;
  let partnerCastePreferences: Record<string, number[]> | undefined;

  if (prefType === "specific_religions") {
    partnerReligionIds = form.partnerReligionIds
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n) && n > 0);
    const selectedSet = new Set(partnerReligionIds.map(String));
    partnerCastePreferences = Object.fromEntries(
      Object.entries(rawCastePreferences).filter(([key]) => selectedSet.has(String(key))),
    );
  } else if (prefType === "own_religion_only") {
    partnerCastePreferences = Object.fromEntries(
      Object.entries(rawCastePreferences).filter(([key]) => Number(key) === religionId),
    );
  } else {
    partnerReligionIds = [];
    partnerCastePreferences = {};
  }

  const payload: Record<string, unknown> = {
    partner_preference_type: prefType || undefined,
    partner_religion_ids: partnerReligionIds,
    partner_caste_preferences: partnerCastePreferences,
    partner_age_from: partnerAgeFrom,
    partner_age_to: partnerAgeTo,
  };
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
}

/** Convert the wizard form object into a ready-to-POST FormData (registration JSON + files). */
export async function buildProfileRegistrationFormData(
  form: Record<string, unknown>,
): Promise<FormData> {
  const gender = form.gender === "Male" ? "M" : form.gender === "Female" ? "F" : "O";
  const birthTime = String(form.timeOfBirth ?? "").trim();
  const birthPlace = String(form.placeOfBirth ?? "").trim();
  const birthDate = isoToDDMMYYYY(String(form.dob ?? ""));
  const horoscopeDetails = form.hasHoroscope
    ? {
        date_of_birth: birthDate || undefined,
        pr_dob: birthDate || undefined,
        time_of_birth: birthTime || undefined,
        birth_time: birthTime || undefined,
        pr_tob: birthTime || undefined,
        country_id: form.countryId ? Number(form.countryId) : undefined,
        state_id: form.stateId ? Number(form.stateId) : undefined,
        district_id: form.districtId ? Number(form.districtId) : undefined,
        place_of_birth: birthPlace || undefined,
        birth_place: birthPlace || undefined,
        pr_pob: birthPlace || undefined,
        latitude: form.birthLatitude ? Number(form.birthLatitude) : undefined,
        longitude: form.birthLongitude ? Number(form.birthLongitude) : undefined,
        timezone: form.birthTimezone || undefined,
      }
    : undefined;

  const registration = {
    name: String(form.name ?? form.fullName ?? "").trim(),
    phone_number: formatPhoneForApi(String(form.mobile ?? "")),
    gender,
    dob: birthDate,
    email: form.email ? String(form.email).trim() : undefined,
    terms_accepted: true,
    profile_for: String(form.profileFor ?? "myself").toLowerCase(),
    has_horoscope: !!form.hasHoroscope,
    horoscope_details: horoscopeDetails,
    time_of_birth: form.hasHoroscope ? birthTime || undefined : undefined,
    birth_time: form.hasHoroscope ? birthTime || undefined : undefined,
    pr_tob: form.hasHoroscope ? birthTime || undefined : undefined,
    place_of_birth: form.hasHoroscope ? birthPlace || undefined : undefined,
    birth_place: form.hasHoroscope ? birthPlace || undefined : undefined,
    pr_pob: form.hasHoroscope ? birthPlace || undefined : undefined,
    latitude: form.hasHoroscope && form.birthLatitude ? Number(form.birthLatitude) : undefined,
    longitude: form.hasHoroscope && form.birthLongitude ? Number(form.birthLongitude) : undefined,
    timezone: form.hasHoroscope ? form.birthTimezone || undefined : undefined,
    location_details: {
      country_id: form.countryId ? Number(form.countryId) : undefined,
      state_id: form.stateId ? Number(form.stateId) : undefined,
      district_id: form.districtId ? Number(form.districtId) : undefined,
      city: form.city ? String(form.city).trim() : undefined,
      address: form.address || undefined,
    },
    religion_details: {
      religion_id: form.religionId ? Number(form.religionId) : undefined,
      caste_id: form.casteId ? Number(form.casteId) : undefined,
      mother_tongue_id: form.motherTongueId ? Number(form.motherTongueId) : undefined,
      ...buildPartnerReligionDetails({
        religionId: String(form.religionId ?? ""),
        partnerPreferenceType: (form.partnerPreferenceType as PartnerPreferenceType) ?? "own_religion_only",
        partnerReligionIds: Array.isArray(form.partnerReligionIds)
          ? (form.partnerReligionIds as string[])
          : [],
        partnerCastePreferences: (form.partnerCastePreferences as Record<string, number[]>) ?? {},
        partnerAgeFrom: String(form.partnerAgeFrom ?? ""),
        partnerAgeTo: String(form.partnerAgeTo ?? ""),
      }),
    },
    personal_details: {
      marital_status: form.maritalStatus || undefined,
      height_cm: form.height ? Number(form.height) : undefined,
      weight_kg: form.weight || undefined,
      complexion: form.complexion || undefined,
      reason_for_divorce:
        form.maritalStatus === "Divorced" && form.reasonForDivorce
          ? String(form.reasonForDivorce).trim()
          : undefined,
    },
    education_details: {
      highest_education_id: form.highestEducationId ? Number(form.highestEducationId) : undefined,
      education_subject_id: form.educationSubjectId ? Number(form.educationSubjectId) : undefined,
      employment_status: form.employmentStatus || undefined,
      occupation_id: form.occupationId ? Number(form.occupationId) : undefined,
      annual_income_id: form.annualIncomeId ? Number(form.annualIncomeId) : undefined,
    },
    family_details: buildFamilyDetailsPayload(form as unknown as FamilyFormFields),
    about_me: form.aboutMe || undefined,
  } as Record<string, unknown>;

  const fd = new FormData();
  fd.append("registration", JSON.stringify(registration));
  await appendCompressedFiles(fd, form);
  return fd;
}

/** Shared form shape consumed by the EditProfileWizard. */
export interface WizardFormValues extends FamilyFormFields, PartnerPreferenceFields {
  profileFor: string;
  fullName: string;
  mobile: string;
  email: string;
  dob: string;
  gender: string;
  hasHoroscope: boolean;
  timeOfBirth: string;
  placeOfBirth: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
  countryId: string;
  stateId: string;
  districtId: string;
  cityId: string;
  address: string;
  religionId: string;
  casteId: string;
  motherTongueId: string;
  maritalStatus: string;
  reasonForDivorce: string;
  hasChildren: boolean;
  numberOfMarriages: string;
  numberOfChildren: string;
  height: string;
  weight: string;
  complexion: string;
  annualIncomeId: string;
  highestEducationId: string;
  educationSubjectId: string;
  employmentStatus: string;
  occupationId: string;
  occupationName?: string;
  aboutMe: string;
  full_photo: File | null;
  passport_photo: File | null;
  profile_photo: File | null;
  selfie_photo: File | null;
  family_photo: File | null;
  aadhaar_front: File | null;
  aadhaar_back: File | null;
  /** Absolute URLs of images already uploaded (edit flow only). */
  existingPhotos?: Partial<Record<(typeof FILE_KEYS)[number], string | null>>;
}

function ddmmyyyyToIso(value: unknown): string {
  const s = String(value ?? "").trim();
  if (!s) return "";
  // Already ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Day-first API / typed values: 6/3/2000, 06-03-2000, 06/03/2000
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return s;
}

function idToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  const s = String(value).trim();
  return /^\d+$/.test(s) ? s : "";
}

function titleCaseProfileFor(value: unknown): string {
  const s = String(value ?? "myself").trim();
  if (!s) return "Myself";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function normalizeGenderLabel(value: unknown): string {
  const s = String(value ?? "").trim().toLowerCase();
  if (s === "male" || s === "m") return "Male";
  if (s === "female" || s === "f") return "Female";
  return "";
}

/** Map a profile detail GET response into the EditProfileWizard form shape. */
export function mapDetailToWizardForm(
  detail: Record<string, unknown>,
  row?: { name?: string; gender?: string },
): WizardFormValues {
  const basic = (detail.basic_details as Record<string, unknown> | undefined) ?? {};
  const location = (detail.location_details as Record<string, unknown> | undefined) ?? {};
  const religion = (detail.religion_details as Record<string, unknown> | undefined) ?? {};
  const personal = (detail.personal_details as Record<string, unknown> | undefined) ?? {};
  const education = (detail.education_details as Record<string, unknown> | undefined) ?? {};
  const family = (detail.family_details as Record<string, unknown> | undefined) ?? {};
  const horo = (detail.horoscope_details as Record<string, unknown> | undefined) ?? {};

  const partnerType = String(religion.partner_preference_type ?? "own_religion_only");
  const partnerReligionIds = Array.isArray(religion.partner_religion_ids)
    ? (religion.partner_religion_ids as unknown[]).map((v) => String(v))
    : [];

  const lat = horo.birth_latitude;
  const lon = horo.birth_longitude;
  const tz = horo.birth_timezone;

  const photos = (detail.photos as Record<string, unknown> | undefined) ?? {};
  const photoUrl = (key: string): string | null => {
    const v = photos[key];
    return typeof v === "string" && v.trim() !== "" ? v : null;
  };
  const existingPhotos = FILE_KEYS.reduce<Partial<Record<(typeof FILE_KEYS)[number], string | null>>>(
    (acc, key) => {
      acc[key] = photoUrl(key);
      return acc;
    },
    {},
  );

  return {
    profileFor: titleCaseProfileFor(detail.profile_for ?? basic.profile_for),
    fullName: String(basic.name ?? row?.name ?? ""),
    mobile: String(basic.phone ?? ""),
    email: String(basic.email ?? ""),
    dob: ddmmyyyyToIso(basic.dob),
    gender: normalizeGenderLabel(basic.gender ?? row?.gender),
    hasHoroscope: Boolean(horo.has_horoscope),
    timeOfBirth: String(horo.time_of_birth ?? ""),
    placeOfBirth: String(horo.place_of_birth ?? ""),
    birthLatitude: lat != null ? String(lat) : "",
    birthLongitude: lon != null ? String(lon) : "",
    birthTimezone: tz != null ? String(tz) : "",
    countryId: idToString(location.country_id),
    stateId: idToString(location.state_id),
    districtId: idToString(location.district_id),
    cityId: idToString(location.city_id),
    address: String(location.address ?? ""),
    religionId: idToString(religion.religion_id),
    casteId: idToString(religion.caste_id),
    motherTongueId: idToString(religion.mother_tongue_id),
    maritalStatus: String(personal.marital_status ?? ""),
    reasonForDivorce: String(personal.reason_for_divorce ?? ""),
    partnerPreferenceType:
      partnerType === "open_to_all" || partnerType === "specific_religions"
        ? (partnerType as WizardFormValues["partnerPreferenceType"])
        : "own_religion_only",
    partnerReligionIds,
    partnerCastePreferences: normalizePartnerCastePreferences(religion.partner_caste_preferences),
    partnerAgeFrom:
      religion.partner_age_from != null && String(religion.partner_age_from).trim() !== ""
        ? String(religion.partner_age_from)
        : "",
    partnerAgeTo:
      religion.partner_age_to != null && String(religion.partner_age_to).trim() !== ""
        ? String(religion.partner_age_to)
        : "",
    hasChildren: Boolean(personal.has_children),
    numberOfMarriages: "",
    numberOfChildren:
      personal.children_count != null && String(personal.children_count).trim() !== ""
        ? String(personal.children_count)
        : "",
    height: personal.height_cm != null ? String(personal.height_cm) : "",
    weight: personal.weight_kg != null ? String(personal.weight_kg) : "",
    complexion: String(personal.colour ?? personal.complexion ?? ""),
    annualIncomeId: idToString(education.annual_income_id),
    highestEducationId: idToString(education.highest_education_id),
    educationSubjectId: idToString(education.education_subject_id),
    employmentStatus: String(education.employment_status ?? ""),
    occupationId: idToString(education.occupation_id),
    occupationName: String(education.occupation ?? ""),
    aboutMe: String(detail.about_me ?? ""),
    ...mapFamilyDetailsToForm(family),
    full_photo: null,
    passport_photo: null,
    profile_photo: null,
    selfie_photo: null,
    family_photo: null,
    aadhaar_front: null,
    aadhaar_back: null,
    existingPhotos,
  };
}

/**
 * Build the PATCH FormData for editing an existing member. Unlike the create
 * builder, identity fields (name/email/gender/dob/profile_for) go inside
 * basic_details because the edit pipeline applies section handlers and skips
 * top-level identity keys.
 */
export async function buildProfileEditFormData(form: WizardFormValues): Promise<FormData> {
  const gender = form.gender === "Male" ? "M" : form.gender === "Female" ? "F" : "O";
  const birthTime = String(form.timeOfBirth ?? "").trim();
  const birthPlace = String(form.placeOfBirth ?? "").trim();

  const horoscopeDetails = form.hasHoroscope
    ? {
        time_of_birth: birthTime || undefined,
        birth_time: birthTime || undefined,
        place_of_birth: birthPlace || undefined,
        birth_place: birthPlace || undefined,
        latitude: form.birthLatitude ? Number(form.birthLatitude) : undefined,
        longitude: form.birthLongitude ? Number(form.birthLongitude) : undefined,
        timezone: form.birthTimezone || undefined,
      }
    : undefined;

  const registration = {
    profile_for: String(form.profileFor ?? "myself").toLowerCase() || undefined,
    basic_details: {
      name: form.fullName?.trim() || undefined,
      email: form.email ? String(form.email).trim() : undefined,
      gender: gender !== "O" ? gender : undefined,
      dob: form.dob || undefined,
      profile_for: String(form.profileFor ?? "myself").toLowerCase() || undefined,
    },
    location_details: {
      country_id: form.countryId ? Number(form.countryId) : undefined,
      state_id: form.stateId ? Number(form.stateId) : undefined,
      district_id: form.districtId ? Number(form.districtId) : undefined,
      city_id: form.cityId ? Number(form.cityId) : undefined,
      address: form.address || undefined,
    },
    religion_details: {
      religion_id: form.religionId ? Number(form.religionId) : undefined,
      caste_id: form.casteId ? Number(form.casteId) : undefined,
      mother_tongue_id: form.motherTongueId ? Number(form.motherTongueId) : undefined,
      ...buildPartnerReligionDetails(form),
    },
    personal_details: {
      marital_status: form.maritalStatus || undefined,
      height_cm: form.height ? Number(form.height) : undefined,
      weight_kg: form.weight || undefined,
      complexion: form.complexion || undefined,
      has_children: form.hasChildren,
      number_of_children: form.hasChildren && form.numberOfChildren ? Number(form.numberOfChildren) : undefined,
      reason_for_divorce:
        form.maritalStatus === "Divorced" && form.reasonForDivorce
          ? String(form.reasonForDivorce).trim()
          : undefined,
    },
    education_details: {
      highest_education_id: form.highestEducationId ? Number(form.highestEducationId) : undefined,
      education_subject_id: form.educationSubjectId ? Number(form.educationSubjectId) : undefined,
      employment_status: form.employmentStatus || undefined,
      occupation_id: form.occupationId ? Number(form.occupationId) : undefined,
      annual_income_id: form.annualIncomeId ? Number(form.annualIncomeId) : undefined,
    },
    family_details: buildFamilyDetailsPayload(form),
    about_me: form.aboutMe || undefined,
    has_horoscope: !!form.hasHoroscope,
    horoscope_details: horoscopeDetails,
  } as Record<string, unknown>;

  const fd = new FormData();
  fd.append("registration", JSON.stringify(registration));
  await appendCompressedFiles(fd, form as unknown as Record<string, unknown>);
  return fd;
}
