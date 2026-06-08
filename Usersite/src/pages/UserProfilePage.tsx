"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import PhotoCropDialog, {
  type PhotoCropDialogState,
} from "@/components/signup/steps/PhotoCropDialog";
import { useAuthStore } from "@/stores/authStore";
import {
  Edit,
  Eye,
  Home,
  Globe,
  CheckSquare,
  Check,
  UsersRound,
  User,
  BookOpen,
  GraduationCap,
  Image,
  MapPin,
  UserCircle,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getProfile,
  patchBasic,
  patchLocation,
  patchReligion,
  patchPersonal,
  patchEducation,
  patchAbout,
  patchFamily,
  getProfileFamily,
  postPhotos,
  type ProfileData,
  type LocationBody,
  type ReligionBody,
  type PersonalBody,
  type EducationBody,
  type FamilyBody,
} from "@/lib/profileApi";
import { cn, formatDateDdMmYyyy } from "@/lib/utils";
import {
  getCountries,
  getStates,
  getDistricts,
  getCities,
  getReligions,
  getCastes,
  getMotherTongues,
  getEducations,
  getEducationSubjects,
  getEmploymentStatuses,
  getOccupations,
  getIncomeRanges,
  getMaritalStatuses,
} from "@/lib/masterApi";
import { withMinDuration } from "@/lib/withMinDuration";
import type {
  Country,
  State,
  District,
  City,
  Religion,
  Caste,
  MotherTongue,
  EducationMaster,
  EducationSubjectMaster,
  EmploymentStatusMaster,
  OccupationMaster,
  IncomeRangeMaster,
} from "@/lib/masterApi";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { BASE_URL } from "@/lib/config";

const PARENT_LIFE_STATUS_OPTIONS = ["Alive", "Late"];
const PARTNER_RELIGION_OPTIONS = [
  "Same Religion Only",
  "Open to All Religions",
  "No Preference",
  "Other",
];
const BLOOD_GROUP_OPTIONS = [
  "A+",
  "A-ve",
  "A-",
  "B+",
  "B-ve",
  "B-",
  "AB+",
  "AB-ve",
  "AB-",
  "O+",
  "O+ve",
  "O-ve",
  "O-",
];
const MARITAL_STATUS_OPTIONS = [
  "Never Married",
  "Divorced",
  "Widowed",
  "Separated",
  "Spearated",
];
const COLOR_OPTIONS = [
  "White",
  "Medium",
  "Black",
  "Very Fair",
  "Fair",
  "Wheatish",
  "Wheatish Brown",
  "Dark",
];
function normalizeDobForDateInput(value: string): string {
  const v = value.trim();
  if (!v) return "";
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  const dmy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(v);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return v;
}

function normalizeDobForApi(value: string): string {
  const v = value.trim();
  if (!v) return "";
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (ymd) return `${ymd[3]}-${ymd[2]}-${ymd[1]}`;
  const dmy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(v);
  if (dmy) return `${dmy[1]}-${dmy[2]}-${dmy[3]}`;
  return v;
}

const GENDER_VALUES = ["male", "female", "other"] as const;

function normalizeGenderValue(value: string): string {
  const v = value.trim().toLowerCase();
  const normalized =
    v === "m" || v === "male"
      ? "male"
      : v === "f" || v === "female" || v === "g"
        ? "female"
        : v;
  return (GENDER_VALUES as readonly string[]).includes(normalized)
    ? normalized
    : "";
}

function formatGenderLabel(value: string): string {
  const v = value.trim().toLowerCase();
  if (v === "m" || v === "male") return "Male";
  if (v === "f" || v === "female" || v === "g") return "Female";
  if (v === "other") return "Other";
  return value.trim();
}

const genderSelectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

type SectionKey =
  | "Basic Info"
  | "Religion"
  | "Education"
  | "Photos"
  | "Location"
  | "Personal"
  | "Family"
  | "About Me"
  | "Horoscope";

const allProfileSections: {
  title: SectionKey;
  description: string;
  icon?: LucideIcon;
}[] = [
  {
    title: "Basic Info",
    description: "Name, Gender, DOB, Phone, Email",
    icon: User,
  },
  {
    title: "Religion",
    description: "Religion, Caste, Mother Tongue, Partner Preference",
    icon: BookOpen,
  },
  {
    title: "Education",
    description: "Qualification, Subject, Employment, Job, Income",
    icon: GraduationCap,
  },
  {
    title: "Photos",
    description: "Profile photos and verification",
    icon: Image,
  },
  {
    title: "Location",
    description: "Country, State, District, City, Address",
    icon: MapPin,
  },
  {
    title: "Personal",
    description:
      "Marital Status, Children, Height, Weight, Colour, Blood Group",
    icon: UserCircle,
  },
  {
    title: "Family",
    description: "Family type, parents, siblings",
    icon: UsersRound,
  },
  { title: "About Me", description: "Bio", icon: FileText },
];

// Profile form data (display + ids for PATCH bodies)
interface ProfileFormData {
  name: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  religion: string;
  caste: string;
  motherTongue: string;
  partnerReligionPreference: string;
  partner_preference_type?:
    | "own_religion_only"
    | "open_to_all"
    | "specific_religions";
  partner_religion_ids?: Array<
    number | { id?: number; name?: string; religion?: string }
  >;
  partner_religion_names?: string[];
  partner_caste_preferences?: Record<string, number[]>;
  qualification: string;
  education_id?: number;
  educationSubject: string;
  education_subject_id?: number;
  employmentStatus: string;
  employment_status_id?: number;
  job: string;
  occupation_id?: number;
  income: string;
  income_range_id?: number;
  country: string;
  state: string;
  city: string;
  district: string;
  address: string;
  country_id?: number;
  state_id?: number;
  district_id?: number;
  city_id?: number;
  religion_id?: number;
  caste_id?: number | null;
  mother_tongue_id?: number;
  height: string;
  weight: string;
  maritalStatus: string;
  hasChildren: string;
  numberOfChildren: string;
  color: string;
  bloodGroup: string;
  fathersName: string;
  fathersOccupation: string;
  fatherLifeStatus: string;
  mothersName: string;
  mothersOccupation: string;
  motherLifeStatus: string;
  numberOfBrothers: string;
  numberOfMarriedBrothers: string;
  numberOfSisters: string;
  numberOfMarriedSisters: string;
  aboutMyFamily: string;
  familyType: string;
  familyStatus: string;
  bio: string;
  rashi: string;
  nakshatra: string;
  manglikStatus: string;
}

/** Map GET v1/profile/ data to form state (including ids for PATCH). */
function mapProfileDataToForm(
  data: ProfileData,
  user: {
    name?: string;
    phone?: string;
    email?: string;
    location?: string;
  } | null,
): ProfileFormData {
  const basic = data.basic_details ?? {};
  const religion = data.religion_details ?? {};
  const personal = data.personal_details ?? {};
  const location = data.location_details ?? {};
  const family = data.family_details ?? {};
  const pickParentLifeStatus = (value: unknown): string => {
    const normalized = String(value ?? "")
      .trim()
      .toLowerCase();
    if (!normalized) return "";
    if (normalized === "late" || normalized === "deceased") return "Late";
    return "Alive";
  };
  const education = data.education_details ?? {};
  const raw = (v: unknown) => (v != null ? String(v) : "");
  const children = personal.number_of_children ?? personal.children_count ?? 0;
  const heightStr =
    personal.height_cm ?? personal.height ?? data.height_cm ?? data.height ?? "";
  const heightParsed = parseInt(String(heightStr).replace(/\D/g, ""), 10);
  const heightForm = Number.isFinite(heightParsed) ? String(heightParsed) : "";
  const weightSource =
    personal.weight_kg ?? personal.weight ?? data.weight_kg ?? data.weight;
  const weightRaw =
    weightSource != null && String(weightSource).trim() !== ""
      ? String(weightSource)
      : "";
  const weightParsed = parseFloat(weightRaw.replace(/[^\d.]/g, ""));
  const weightForm = Number.isFinite(weightParsed) ? String(weightParsed) : "";
  const namesFromPreference = Array.isArray(
    religion.partner_religion_preference,
  )
    ? religion.partner_religion_preference
        .map((item) =>
          item?.religion != null ? String(item.religion).trim() : "",
        )
        .filter(Boolean)
    : [];

  const namesFromIds = Array.isArray(religion.partner_religion_ids)
    ? religion.partner_religion_ids
        .map((item) => {
          if (typeof item === "number") return "";
          if (!item || typeof item !== "object") return "";
          return String(item.name ?? item.religion ?? "").trim();
        })
        .filter(Boolean)
    : [];

  const partnerReligionNames = Array.from(
    new Set([...namesFromPreference, ...namesFromIds]),
  );

  const preferenceType =
    (religion.partner_preference_type as ProfileFormData["partner_preference_type"]) ||
    "open_to_all";

  const preferenceLabelMap: Record<
    NonNullable<ProfileFormData["partner_preference_type"]>,
    string
  > = {
    own_religion_only: "Same Religion Only",
    open_to_all: "Open to All Religions",
    specific_religions: "Specific Religions",
  };
  return {
    name: raw(basic.name) || (user?.name ?? ""),
    phone: raw(basic.phone) || (user?.phone ?? ""),
    email: raw(basic.email) || (user?.email ?? ""),
    dob: normalizeDobForDateInput(raw(basic.dob)),
    gender: normalizeGenderValue(raw(basic.gender)),
    religion: raw(religion.religion),
    caste: raw(religion.caste),
    motherTongue: raw(religion.mother_tongue),
    partnerReligionPreference:
      preferenceLabelMap[preferenceType] ||
      raw(religion.partner_preference_type).replace(/_/g, " "),
    partner_preference_type: preferenceType,
    partner_religion_ids: (religion.partner_religion_ids ?? [])
      .map((item) => (typeof item === "number" ? item : (item?.id ?? 0)))
      .filter((id): id is number => Number.isFinite(id) && id > 0),
    partner_religion_names: partnerReligionNames,
    partner_caste_preferences:
      religion.partner_caste_preferences &&
      typeof religion.partner_caste_preferences === "object"
        ? religion.partner_caste_preferences
        : {},
    qualification: raw(education.highest_education),
    education_id:
      typeof education.highest_education_id === "number"
        ? education.highest_education_id
        : undefined,
    educationSubject: raw(education.education_subject),
    education_subject_id:
      typeof education.education_subject_id === "number"
        ? education.education_subject_id
        : undefined,
    employmentStatus: raw(education.employment_status),
    employment_status_id:
      typeof education.employment_status_id === "number"
        ? education.employment_status_id
        : undefined,
    job: raw(education.occupation),
    occupation_id:
      typeof education.occupation_id === "number"
        ? education.occupation_id
        : undefined,
    income: raw(education.annual_income),
    income_range_id:
      typeof education.income_range_id === "number"
        ? education.income_range_id
        : undefined,
    country: raw(location.country),
    state: raw(location.state),
    city: raw(location.city),
    district: raw(location.district),
    address: raw(location.address),
    country_id: location.country_id,
    state_id: location.state_id,
    district_id: location.district_id,
    city_id: location.city_id,
    religion_id: religion.religion_id,
    caste_id: religion.caste_id ?? null,
    mother_tongue_id: religion.mother_tongue_id,
    height: heightForm,
    weight: weightForm,
    maritalStatus: raw(personal.marital_status ?? personal.marital_status_id),
    hasChildren:
      personal.has_children != null
        ? personal.has_children
          ? "yes"
          : "no"
        : children > 0
          ? "yes"
          : "no",
    numberOfChildren: String(children),
    color: raw(personal.complexion ?? personal.colour),
    bloodGroup: raw(personal.blood_group ?? data.blood_group),
    fathersName: raw(family.father_name),
    fathersOccupation: raw(family.father_occupation),
    fatherLifeStatus: pickParentLifeStatus(
      family.father_life_status ??
        family.father_status ??
        family.father_alive_status,
    ),
    mothersName: raw(family.mother_name),
    mothersOccupation: raw(family.mother_occupation),
    motherLifeStatus: pickParentLifeStatus(
      family.mother_life_status ??
        family.mother_status ??
        family.mother_alive_status,
    ),
    numberOfBrothers: family.brothers != null ? String(family.brothers) : "",
    numberOfMarriedBrothers:
      family.married_brothers != null ? String(family.married_brothers) : "",
    numberOfSisters: family.sisters != null ? String(family.sisters) : "",
    numberOfMarriedSisters:
      family.married_sisters != null ? String(family.married_sisters) : "",
    aboutMyFamily: raw(family.about_family),
    familyType: raw(family.family_type),
    familyStatus: raw(family.family_status),
    bio: raw(data.about_me),
    rashi: "",
    nakshatra: "",
    manglikStatus: "",
  };
}

const defaultProfileData = (
  user: {
    name?: string;
    phone?: string;
    email?: string;
    location?: string;
  } | null,
): ProfileFormData => ({
  name: user?.name ?? "",
  phone: user?.phone ?? "",
  email: user?.email ?? "",
  dob: "",
  gender: "",
  religion: "",
  caste: "",
  motherTongue: "",
  partnerReligionPreference: "",
  partner_caste_preferences: {},
  qualification: "",
  educationSubject: "",
  employmentStatus: "",
  job: "",
  income: "",
  country: "India",
  state: "",
  city: user?.location?.split(",")[0]?.trim() ?? "",
  district: "",
  address: "",
  height: "",
  weight: "",
  maritalStatus: "",
  hasChildren: "no",
  numberOfChildren: "",
  color: "",
  bloodGroup: "",
  fathersName: "",
  fathersOccupation: "",
  fatherLifeStatus: "Alive",
  mothersName: "",
  mothersOccupation: "",
  motherLifeStatus: "Alive",
  numberOfBrothers: "",
  numberOfMarriedBrothers: "",
  numberOfSisters: "",
  numberOfMarriedSisters: "",
  aboutMyFamily: "",
  familyType: "",
  familyStatus: "",
  bio: "",
  rashi: "",
  nakshatra: "",
  manglikStatus: "",
});

function ProfileSectionCard({
  title,
  icon: Icon,
  summary,
  onView,
  onEdit,
}: {
  title: string;
  icon?: LucideIcon;
  summary?: string;
  onView: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="flex gap-3 min-w-0 flex-1">
        {Icon && (
          <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-secondary" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-bold text-foreground">
            {title}
          </h3>
          {summary && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {summary}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onView();
          }}
          className="inline-flex items-center justify-center gap-1.5 h-9 rounded-md px-3 text-sm font-medium border-2 border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 relative z-10"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          className="inline-flex items-center justify-center gap-1.5 h-9 rounded-md px-3 text-sm font-medium border-2 border-accent-rose/50 text-primary bg-accent-rose/10 hover:bg-accent-rose/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 relative z-10"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>
    </div>
  );
}

const PHOTO_KEYS = [
  "profile_photo",
  "full_photo",
  "selfie_photo",
  "family_photo",
  "aadhaar_front",
  "aadhaar_back",
] as const;

const PHOTO_LABELS: Record<string, string> = {
  profile_photo: "Profile Photo",
  full_photo: "Full Photo",
  selfie_photo: "Selfie Photo",
  family_photo: "Family Photo",
  aadhaar_front: "Aadhaar (Front)",
  aadhaar_back: "Aadhaar (Back)",
};

/** Same tolerances and ratios as signup `PhotosStep` (see `PhotoCropDialog`). */
const PHOTO_ASPECT_TOLERANCE = 0.02;
const PHOTO_SLOT_ASPECTS: Partial<Record<(typeof PHOTO_KEYS)[number], number>> =
  {
    profile_photo: 4 / 5,
    full_photo: 1,
    selfie_photo: 1,
    family_photo: 20 / 9,
  };

function PhotoSlotPreview({
  file,
  existingPath,
  label,
}: {
  file: File | null | undefined;
  existingPath: string | null | undefined;
  label: string;
}) {
  const [objectUrl, setObjectUrl] = useState("");
  useEffect(() => {
    if (!file) {
      setObjectUrl("");
      return;
    }
    const u = URL.createObjectURL(file);
    setObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const previewUrl = file
    ? objectUrl
    : existingPath
      ? getMediaUrl(existingPath)
      : "";
  if (!previewUrl) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-muted/30 w-full max-w-[200px] aspect-[3/4]">
      <img
        src={previewUrl}
        alt={label}
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
}

function EditSectionForm({
  section,
  data,
  onChange,
  maritalStatusOptions,
  locationOptions,
  locationLoading,
  locationLoaders,
  onLocationChange,
  religionOptions,
  religionLoading,
  religionLoaders,
  onReligionChange,
  educationOptions,
  educationLoading,
  educationLoaders,
  onEducationChange,
  photoFiles,
  existingPhotos,
  onPhotoChange,
}: {
  section: SectionKey;
  data: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
  maritalStatusOptions?: string[];
  locationOptions?: {
    countries: Country[];
    states: State[];
    districts: District[];
    cities: City[];
  };
  locationLoading?: {
    countries: boolean;
    states: boolean;
    districts: boolean;
    cities: boolean;
  };
  locationLoaders?: {
    loadCountries: (search: string) => void;
    loadStates: (search: string) => void;
    loadDistricts: (search: string) => void;
    loadCities: (search: string) => void;
  };
  onLocationChange?: (updates: Partial<ProfileFormData>) => void;
  religionOptions?: {
    religions: Religion[];
    castes: Caste[];
    motherTongues: MotherTongue[];
  };
  religionLoading?: {
    religions: boolean;
    castes: boolean;
    motherTongues: boolean;
  };
  religionLoaders?: {
    loadReligions: (search: string) => void;
    loadCastes: (search: string) => void;
    loadMotherTongues: (search: string) => void;
  };
  onReligionChange?: (updates: Partial<ProfileFormData>) => void;
  educationOptions?: {
    educations: EducationMaster[];
    educationSubjects: EducationSubjectMaster[];
    employmentStatuses: EmploymentStatusMaster[];
    occupations: OccupationMaster[];
    incomeRanges: IncomeRangeMaster[];
  };
  educationLoading?: {
    educations: boolean;
    educationSubjects: boolean;
    employmentStatuses: boolean;
    occupations: boolean;
    incomeRanges: boolean;
  };
  educationLoaders?: {
    loadEducations: (search: string) => void;
    loadEducationSubjects: (search: string) => void;
    loadEmploymentStatuses: (search: string) => void;
    loadOccupations: (search: string) => void;
    loadIncomeRanges: (search: string) => void;
  };
  onEducationChange?: (updates: Partial<ProfileFormData>) => void;
  photoFiles?: Record<string, File | null>;
  existingPhotos?: Record<string, string | null>;
  onPhotoChange?: (key: string, file: File | null) => void;
}) {
  const [cropState, setCropState] = useState<PhotoCropDialogState | null>(null);
  const [partnerCastesByReligion, setPartnerCastesByReligion] = useState<
    Record<number, Caste[]>
  >({});
  const [loadingPartnerCastes, setLoadingPartnerCastes] = useState<
    Record<number, boolean>
  >({});

  const dismissCrop = useCallback(() => {
    setCropState((s) => {
      if (s?.src) URL.revokeObjectURL(s.src);
      return null;
    });
  }, []);

  const handleApplyCropped = useCallback(
    (slotKey: string, file: File) => {
      setCropState((s) => {
        if (s?.src) URL.revokeObjectURL(s.src);
        return null;
      });
      onPhotoChange?.(slotKey, file);
    },
    [onPhotoChange],
  );

  useEffect(() => {
    if (section !== "Photos") dismissCrop();
  }, [section, dismissCrop]);

  const processPhotoFile = useCallback(
    (key: string, file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image file.");
        return;
      }
      if (key === "aadhaar_front" || key === "aadhaar_back") {
        onPhotoChange?.(key, file);
        return;
      }
      const aspect = PHOTO_SLOT_ASPECTS[key as keyof typeof PHOTO_SLOT_ASPECTS];
      if (aspect === undefined) {
        onPhotoChange?.(key, file);
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const imageAspect = img.naturalWidth / img.naturalHeight;
        const needsCrop =
          Math.abs(imageAspect - aspect) > PHOTO_ASPECT_TOLERANCE;
        if (needsCrop) {
          setCropState({
            src: url,
            aspect,
            slotKey: key,
            fileName: file.name,
            label: PHOTO_LABELS[key] ?? key.replace(/_/g, " "),
          });
        } else {
          URL.revokeObjectURL(url);
          onPhotoChange?.(key, file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error("Could not read this image.");
      };
      img.src = url;
    },
    [onPhotoChange],
  );

  const update = (key: keyof ProfileFormData, value: string) =>
    onChange({ ...data, [key]: value });

  useEffect(() => {
    if (section !== "Religion") return;
    const selectedPreference = (data.partner_preference_type ??
      "open_to_all") as
      | "own_religion_only"
      | "open_to_all"
      | "specific_religions";
    if (selectedPreference !== "specific_religions") return;

    const selectedPartnerReligionIds = (data.partner_religion_ids ?? [])
      .map((item) => (typeof item === "number" ? item : (item?.id ?? 0)))
      .filter((id): id is number => Number.isFinite(id) && id > 0);
    if (!selectedPartnerReligionIds.length) return;

    const missingReligionIds = selectedPartnerReligionIds.filter(
      (id) => !partnerCastesByReligion[id],
    );
    if (!missingReligionIds.length) return;

    let cancelled = false;
    missingReligionIds.forEach((id) =>
      setLoadingPartnerCastes((prev) => ({ ...prev, [id]: true })),
    );

    Promise.all(
      missingReligionIds.map(async (id) => {
        try {
          const list = await withMinDuration(180, getCastes(id));
          return { id, list };
        } catch {
          return { id, list: [] as Caste[] };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      setPartnerCastesByReligion((prev) => {
        const next = { ...prev };
        for (const item of results) next[item.id] = item.list;
        return next;
      });
      setLoadingPartnerCastes((prev) => {
        const next = { ...prev };
        for (const item of results) next[item.id] = false;
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    section,
    data.partner_preference_type,
    data.partner_religion_ids,
    partnerCastesByReligion,
  ]);

  switch (section) {
    case "Basic Info":
      return (
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              className={cn(genderSelectClassName, "bg-muted/50 cursor-not-allowed")}
              value={data.gender}
              disabled
              aria-readonly="true"
              title="Gender cannot be changed here"
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={data.dob}
              onChange={(e) => update("dob", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={data.phone}
              readOnly
              placeholder="e.g. +91 9876543210"
              title="Phone number cannot be changed here"
              className="bg-muted/50 cursor-default"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="e.g. name@example.com"
            />
          </div>
        </div>
      );
    case "Religion": {
      const religions = religionOptions?.religions ?? [];
      const castes = religionOptions?.castes ?? [];
      const motherTongues = religionOptions?.motherTongues ?? [];
      const loading = religionLoading ?? {
        religions: false,
        castes: false,
        motherTongues: false,
      };
      const loaders = religionLoaders ?? {
        loadReligions: () => {},
        loadCastes: () => {},
        loadMotherTongues: () => {},
      };
      const selectedPreference = (data.partner_preference_type ??
        "open_to_all") as
        | "own_religion_only"
        | "open_to_all"
        | "specific_religions";
      const selectedPartnerReligionIds = (data.partner_religion_ids ?? [])
        .map((item) => (typeof item === "number" ? item : (item?.id ?? 0)))
        .filter((id): id is number => Number.isFinite(id) && id > 0);

      const handleReligionSelect = (_name: string, value: string) => {
        if (!onReligionChange) return;
        const id = Number(value);
        const selected = religions.find((r) => r.id === id);
        onReligionChange({
          religion_id: id,
          religion: selected?.name ?? "",
          caste_id: undefined,
          caste: "",
        });
      };

      const handleCasteSelect = (_name: string, value: string) => {
        if (!onReligionChange) return;
        const id = Number(value);
        const selected = castes.find((c) => c.id === id);
        onReligionChange({ caste_id: id, caste: selected?.name ?? "" });
      };

      const handleMotherTongueSelect = (_name: string, value: string) => {
        if (!onReligionChange) return;
        const id = Number(value);
        const selected = motherTongues.find((m) => m.id === id);
        onReligionChange({
          mother_tongue_id: id,
          motherTongue: selected?.name ?? "",
        });
      };

      const toggleSpecificReligion = (id: number) => {
        if (!onReligionChange) return;
        const next = selectedPartnerReligionIds.includes(id)
          ? selectedPartnerReligionIds.filter((x) => x !== id)
          : [...selectedPartnerReligionIds, id];
        const nextNames = religions
          .filter((r) => next.includes(r.id))
          .map((r) => r.name)
          .filter(Boolean);
        onReligionChange({
          partner_religion_ids: next,
          partner_religion_names: nextNames,
          partner_caste_preferences: Object.fromEntries(
            Object.entries(selectedPartnerCasteMap).filter(([key]) =>
              next.includes(Number(key)),
            ),
          ),
        });
      };

      const castePreferenceOptions: {
        key: "own_religion_only" | "open_to_all" | "specific_religions";
        icon: React.ReactNode;
        label: string;
        desc: string;
      }[] = [
        {
          key: "own_religion_only",
          icon: <Home className="w-5 h-5" />,
          label: "Own Religion Only",
          desc: "Same religion profiles only",
        },
        {
          key: "open_to_all",
          icon: <Globe className="w-5 h-5" />,
          label: "Open to All Religions",
          desc: "No restriction at all",
        },
        {
          key: "specific_religions",
          icon: <CheckSquare className="w-5 h-5" />,
          label: "Specific Religions",
          desc: "I'll choose which ones",
        },
      ];

      const selectedPartnerCasteMap = data.partner_caste_preferences ?? {};

      const setPartnerPreferenceType = (
        nextType: "own_religion_only" | "open_to_all" | "specific_religions",
      ) => {
        if (!onReligionChange) return;
        if (nextType === "open_to_all") {
          onReligionChange({
            partner_preference_type: nextType,
            partner_religion_ids: [],
            partner_religion_names: [],
            partner_caste_preferences: {},
          });
          return;
        }
        if (nextType === "own_religion_only") {
          const ownReligionId = data.religion_id ?? 0;
          const ownKey = String(ownReligionId);
          const ownOnly = Object.fromEntries(
            Object.entries(selectedPartnerCasteMap).filter(
              ([key]) => key === ownKey,
            ),
          );
          const selectedOwnCaste = data.caste_id ?? 0;
          if (
            ownReligionId > 0 &&
            !ownOnly[ownKey]?.length &&
            selectedOwnCaste > 0
          ) {
            ownOnly[ownKey] = [selectedOwnCaste];
          }
          onReligionChange({
            partner_preference_type: nextType,
            partner_religion_ids: [],
            partner_religion_names: [],
            partner_caste_preferences: ownOnly,
          });
          return;
        }
        onReligionChange({
          partner_preference_type: nextType,
          partner_caste_preferences: selectedPartnerCasteMap,
        });
      };

      const togglePartnerCaste = (religionIdForCaste: number, casteId: number) => {
        if (!onReligionChange) return;
        const key = String(religionIdForCaste);
        const existing = selectedPartnerCasteMap[key] ?? [];
        const nextIds = existing.includes(casteId)
          ? existing.filter((id) => id !== casteId)
          : [...existing, casteId];
        const next = { ...selectedPartnerCasteMap };
        if (nextIds.length > 0) next[key] = nextIds;
        else delete next[key];
        onReligionChange({ partner_caste_preferences: next });
      };

      return (
        <div className="grid gap-4 py-2">
          <SearchableSelect
            name="religion_id"
            value={data.religion_id != null ? String(data.religion_id) : ""}
            options={religions}
            loading={loading.religions}
            label="Religion"
            placeholder="Select Religion"
            initialDisplayLabel={data.religion || undefined}
            onSearch={loaders.loadReligions}
            onSelect={handleReligionSelect}
          />
          {(data.religion_id ?? 0) > 0 ? (
            <SearchableSelect
              name="caste_id"
              value={data.caste_id != null ? String(data.caste_id) : ""}
              options={castes}
              loading={loading.castes}
              label="Caste"
              placeholder="Select Caste"
              initialDisplayLabel={data.caste || undefined}
              onSearch={loaders.loadCastes}
              onSelect={handleCasteSelect}
            />
          ) : null}
          <SearchableSelect
            name="mother_tongue_id"
            value={
              data.mother_tongue_id != null ? String(data.mother_tongue_id) : ""
            }
            options={motherTongues}
            loading={loading.motherTongues}
            label="Mother Tongue"
            placeholder="Select Mother Tongue"
            initialDisplayLabel={data.motherTongue || undefined}
            onSearch={loaders.loadMotherTongues}
            onSelect={handleMotherTongueSelect}
          />
          <div className="pt-2">
            <div className="border-t border-primary/10 pt-4">
              <h3 className="font-serif text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                🤝 Partner Religion Preference
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Which {data.religion || "religion"} groups are you open to?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {castePreferenceOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setPartnerPreferenceType(opt.key)}
                    className={`p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                      selectedPreference === opt.key
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-primary/10 hover:border-primary/30 bg-card"
                    }`}
                  >
                    <span
                      className={
                        selectedPreference === opt.key
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      {opt.icon}
                    </span>
                    <p
                      className={`text-xs font-bold ${
                        selectedPreference === opt.key
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {opt.desc}
                    </p>
                    {selectedPreference === opt.key && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {selectedPreference === "specific_religions" ? (
            <div className="grid gap-2">
              <Label>Specific Religions</Label>
              <div className="rounded-md border border-input bg-background p-3">
                {religions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No religions loaded. Search in Religion dropdown first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {religions.map((rel) => {
                      const isSelected = selectedPartnerReligionIds.includes(
                        rel.id,
                      );
                      return (
                        <button
                          key={rel.id}
                          type="button"
                          onClick={() => toggleSpecificReligion(rel.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-primary/10"
                          }`}
                        >
                          {rel.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {selectedPartnerReligionIds.length > 0 ? (
                <div className="space-y-3">
                  <Label>Preferred Castes by Religion (Optional)</Label>
                  {selectedPartnerReligionIds.map((selectedReligionId) => {
                    const selectedReligion = religions.find(
                      (r) => r.id === selectedReligionId,
                    );
                    const partnerCastes =
                      partnerCastesByReligion[selectedReligionId] ?? [];
                    const isLoadingPartnerCastes =
                      loadingPartnerCastes[selectedReligionId] ?? false;
                    const selectedCastes =
                      selectedPartnerCasteMap[String(selectedReligionId)] ?? [];
                    return (
                      <div
                        key={selectedReligionId}
                        className="rounded-md border border-input bg-background p-3"
                      >
                        <p className="text-sm font-semibold mb-2">
                          {selectedReligion?.name ?? `Religion ${selectedReligionId}`}
                        </p>
                        {isLoadingPartnerCastes ? (
                          <p className="text-xs text-muted-foreground">
                            Loading castes...
                          </p>
                        ) : partnerCastes.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No castes available.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {partnerCastes.map((partnerCaste) => {
                              const isSelected = selectedCastes.includes(
                                partnerCaste.id,
                              );
                              return (
                                <button
                                  key={`${selectedReligionId}-${partnerCaste.id}`}
                                  type="button"
                                  onClick={() =>
                                    togglePartnerCaste(
                                      selectedReligionId,
                                      partnerCaste.id,
                                    )
                                  }
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-foreground hover:bg-primary/10"
                                  }`}
                                >
                                  {partnerCaste.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
          {selectedPreference === "own_religion_only" && (data.religion_id ?? 0) > 0 ? (
            <div className="grid gap-2">
              <Label>Preferred Castes in Own Religion (Optional)</Label>
              <div className="rounded-md border border-input bg-background p-3">
                {loading.castes ? (
                  <p className="text-xs text-muted-foreground">
                    Loading castes...
                  </p>
                ) : castes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No castes available.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {castes.map((ownCaste) => {
                      const ownReligionId = data.religion_id ?? 0;
                      const ownSelected =
                        selectedPartnerCasteMap[String(ownReligionId)] ?? [];
                      const isSelected = ownSelected.includes(ownCaste.id);
                      return (
                        <button
                          key={`own-${ownCaste.id}`}
                          type="button"
                          onClick={() =>
                            togglePartnerCaste(ownReligionId, ownCaste.id)
                          }
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-primary/10"
                          }`}
                        >
                          {ownCaste.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      );
    }
    case "Education": {
      const options = educationOptions ?? {
        educations: [],
        educationSubjects: [],
        employmentStatuses: [],
        occupations: [],
        incomeRanges: [],
      };
      const loading = educationLoading ?? {
        educations: false,
        educationSubjects: false,
        employmentStatuses: false,
        occupations: false,
        incomeRanges: false,
      };
      const loaders = educationLoaders ?? {
        loadEducations: () => {},
        loadEducationSubjects: () => {},
        loadEmploymentStatuses: () => {},
        loadOccupations: () => {},
        loadIncomeRanges: () => {},
      };

      const handleEducationSelect = (_name: string, value: string) => {
        if (!onEducationChange) return;
        const id = Number(value);
        const selected = options.educations.find((x) => x.id === id);
        onEducationChange({
          education_id: id,
          qualification: selected?.name ?? "",
          education_subject_id: undefined,
          educationSubject: "",
        });
      };

      const handleEducationSubjectSelect = (_name: string, value: string) => {
        if (!onEducationChange) return;
        const id = Number(value);
        const selected = options.educationSubjects.find((x) => x.id === id);
        onEducationChange({
          education_subject_id: id,
          educationSubject: selected?.name ?? "",
        });
      };

      const handleEmploymentStatusSelect = (_name: string, value: string) => {
        if (!onEducationChange) return;
        const id = Number(value);
        const selected = options.employmentStatuses.find((x) => x.id === id);
        onEducationChange({
          employment_status_id: id,
          employmentStatus: selected?.name ?? "",
        });
      };

      const handleOccupationSelect = (_name: string, value: string) => {
        if (!onEducationChange) return;
        const id = Number(value);
        const selected = options.occupations.find((x) => x.id === id);
        onEducationChange({
          occupation_id: id,
          job: selected?.name ?? "",
        });
      };

      const handleIncomeRangeSelect = (_name: string, value: string) => {
        if (!onEducationChange) return;
        const id = Number(value);
        const selected = options.incomeRanges.find((x) => x.id === id);
        onEducationChange({
          income_range_id: id,
          income: selected?.name ?? "",
        });
      };

      return (
        <div className="grid gap-4 py-2 md:grid-cols-3">
          <div>
            <SearchableSelect
              name="education_id"
              value={data.education_id != null ? String(data.education_id) : ""}
              options={options.educations}
              loading={loading.educations}
              label="Highest Education"
              placeholder="Select education"
              initialDisplayLabel={data.qualification || undefined}
              onSearch={loaders.loadEducations}
              onSelect={handleEducationSelect}
            />
          </div>
          <div>
            {(data.education_id ?? 0) > 0 ? (
              <SearchableSelect
                name="education_subject_id"
                value={
                  data.education_subject_id != null
                    ? String(data.education_subject_id)
                    : ""
                }
                options={options.educationSubjects}
                loading={loading.educationSubjects}
                label="Education Subject"
                placeholder="Select subject"
                initialDisplayLabel={data.educationSubject || undefined}
                onSearch={loaders.loadEducationSubjects}
                onSelect={handleEducationSubjectSelect}
              />
            ) : (
              <div className="h-full" />
            )}
          </div>
          <div>
            <SearchableSelect
              name="employment_status_id"
              value={
                data.employment_status_id != null
                  ? String(data.employment_status_id)
                  : ""
              }
              options={options.employmentStatuses}
              loading={loading.employmentStatuses}
              label="Employment Status"
              placeholder="Select status"
              initialDisplayLabel={data.employmentStatus || undefined}
              onSearch={loaders.loadEmploymentStatuses}
              onSelect={handleEmploymentStatusSelect}
            />
          </div>
          <div>
            <SearchableSelect
              name="occupation_id"
              value={data.occupation_id != null ? String(data.occupation_id) : ""}
              options={options.occupations}
              loading={loading.occupations}
              label="Occupation / Job"
              placeholder="Select occupation"
              initialDisplayLabel={data.job || undefined}
              onSearch={loaders.loadOccupations}
              onSelect={handleOccupationSelect}
            />
          </div>
          <div>
            <SearchableSelect
              name="income_range_id"
              value={
                data.income_range_id != null ? String(data.income_range_id) : ""
              }
              options={options.incomeRanges}
              loading={loading.incomeRanges}
              label="Annual Income"
              placeholder="Select annual income"
              initialDisplayLabel={data.income || undefined}
              onSearch={loaders.loadIncomeRanges}
              onSelect={handleIncomeRangeSelect}
            />
          </div>
        </div>
      );
    }
    case "Photos": {
      const files = photoFiles ?? {};
      const existing = existingPhotos ?? {};
      return (
        <>
          <PhotoCropDialog
            state={cropState}
            onClose={dismissCrop}
            onApplyCropped={handleApplyCropped}
          />
          <div className="grid gap-6 py-2">
            <p className="text-sm text-muted-foreground">
              Upload and manage your profile photos. Verification photos can be
              added for a verified badge. If a photo doesn&apos;t match the
              suggested shape, you can crop it to fit.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PHOTO_KEYS.map((key) => {
                const file = files[key];
                const existingPath = existing[key];
                const label = PHOTO_LABELS[key] ?? key.replace(/_/g, " ");
                return (
                  <div key={key} className="flex flex-col gap-2">
                    <Label className="text-sm font-medium">{label}</Label>
                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                      <label className="cursor-pointer inline-flex items-center justify-center gap-2 h-10 rounded-md px-4 text-sm font-medium border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary border-dashed shrink-0">
                        <Image className="w-4 h-4" />
                        {file ? "Change" : "Choose file"}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            if (f) processPhotoFile(key, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {file && (
                        <button
                          type="button"
                          onClick={() => onPhotoChange?.(key, null)}
                          className="text-sm text-muted-foreground hover:text-destructive underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <PhotoSlotPreview
                      file={file ?? null}
                      existingPath={existingPath ?? null}
                      label={label}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      );
    }
    case "Location": {
      const countries = locationOptions?.countries ?? [];
      const states = locationOptions?.states ?? [];
      const districts = locationOptions?.districts ?? [];
      const cities = locationOptions?.cities ?? [];
      const loading = locationLoading ?? {
        countries: false,
        states: false,
        districts: false,
        cities: false,
      };
      const countryId = data.country_id ?? 0;
      const stateId = data.state_id ?? 0;
      const districtId = data.district_id ?? 0;

      const handleLocationSelect = (name: string, value: string) => {
        if (!onLocationChange) return;
        const id = Number(value);
        if (name === "country_id") {
          const nameStr = countries.find((c) => c.id === id)?.name ?? "";
          onLocationChange({
            country_id: id,
            country: nameStr,
            state_id: undefined,
            state: "",
            district_id: undefined,
            district: "",
            city_id: undefined,
            city: "",
          });
        } else if (name === "state_id") {
          const nameStr = states.find((s) => s.id === id)?.name ?? "";
          onLocationChange({
            state_id: id,
            state: nameStr,
            district_id: undefined,
            district: "",
            city_id: undefined,
            city: "",
          });
        } else if (name === "district_id") {
          const nameStr = districts.find((d) => d.id === id)?.name ?? "";
          onLocationChange({
            district_id: id,
            district: nameStr,
            city_id: undefined,
            city: "",
          });
        } else if (name === "city_id") {
          const nameStr = cities.find((c) => c.id === id)?.name ?? "";
          onLocationChange({ city_id: id, city: nameStr });
        }
      };

      const loaders = locationLoaders ?? {
        loadCountries: () => {},
        loadStates: () => {},
        loadDistricts: () => {},
        loadCities: () => {},
      };

      return (
        <div className="grid gap-4 py-2">
          <SearchableSelect
            name="country_id"
            value={data.country_id != null ? String(data.country_id) : ""}
            options={countries}
            loading={loading.countries}
            label="Country"
            placeholder="Select Country"
            initialDisplayLabel={data.country || undefined}
            onSearch={loaders.loadCountries}
            onSelect={handleLocationSelect}
          />
          {countryId > 0 ? (
            <SearchableSelect
              name="state_id"
              value={data.state_id != null ? String(data.state_id) : ""}
              options={states}
              loading={loading.states}
              label="State"
              placeholder="Select State"
              initialDisplayLabel={data.state || undefined}
              onSearch={loaders.loadStates}
              onSelect={handleLocationSelect}
            />
          ) : null}
          {stateId > 0 ? (
            <SearchableSelect
              name="district_id"
              value={data.district_id != null ? String(data.district_id) : ""}
              options={districts}
              loading={loading.districts}
              label="District"
              placeholder="Select District"
              initialDisplayLabel={data.district || undefined}
              onSearch={loaders.loadDistricts}
              onSelect={handleLocationSelect}
            />
          ) : null}
          {districtId > 0 ? (
            <SearchableSelect
              name="city_id"
              value={data.city_id != null ? String(data.city_id) : ""}
              options={cities}
              loading={loading.cities}
              label="City"
              placeholder="Select City"
              initialDisplayLabel={data.city || undefined}
              onSearch={loaders.loadCities}
              onSelect={handleLocationSelect}
            />
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <textarea
              id="address"
              value={data.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="e.g. House name, street"
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>
      );
    }
    case "Personal":
      return (
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="maritalStatus">Marital Status</Label>
            <select
              id="maritalStatus"
              value={data.maritalStatus}
              onChange={(e) => update("maritalStatus", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select marital status</option>
              {(maritalStatusOptions && maritalStatusOptions.length > 0
                ? maritalStatusOptions
                : MARITAL_STATUS_OPTIONS
              ).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hasChildren">Has Children</Label>
            <select
              id="hasChildren"
              value={data.hasChildren}
              onChange={(e) => {
                const has = e.target.value;
                onChange({
                  ...data,
                  hasChildren: has,
                  numberOfChildren: has === "yes" ? data.numberOfChildren : "0",
                });
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="numberOfChildren">No. of Children</Label>
            <Input
              id="numberOfChildren"
              type="number"
              min={0}
              value={data.numberOfChildren}
              onChange={(e) => update("numberOfChildren", e.target.value)}
              placeholder="0"
              disabled={data.hasChildren !== "yes"}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={data.height}
              onChange={(e) => update("height", e.target.value)}
              placeholder="e.g. 168"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={data.weight}
              onChange={(e) => update("weight", e.target.value)}
              placeholder="e.g. 65"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="color">Colour / Complexion</Label>
            <select
              id="color"
              value={data.color}
              onChange={(e) => update("color", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select colour / complexion</option>
              {COLOR_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <select
              id="bloodGroup"
              value={data.bloodGroup}
              onChange={(e) => update("bloodGroup", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select blood group</option>
              {BLOOD_GROUP_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    case "Family":
      return (
        <div className="grid gap-4 py-2 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="fathersName">Father&apos;s Name</Label>
            <Input
              id="fathersName"
              value={data.fathersName}
              onChange={(e) => update("fathersName", e.target.value)}
              placeholder="e.g. Rajesh Kumar"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fathersOccupation">Father&apos;s Occupation</Label>
            <Input
              id="fathersOccupation"
              value={data.fathersOccupation}
              onChange={(e) => update("fathersOccupation", e.target.value)}
              placeholder="e.g. Government Employee"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fatherLifeStatus">Father&apos;s Status</Label>
            <select
              id="fatherLifeStatus"
              value={data.fatherLifeStatus || "Alive"}
              onChange={(e) => update("fatherLifeStatus", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {PARENT_LIFE_STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mothersName">Mother&apos;s Name</Label>
            <Input
              id="mothersName"
              value={data.mothersName}
              onChange={(e) => update("mothersName", e.target.value)}
              placeholder="e.g. Lakshmi"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mothersOccupation">Mother&apos;s Occupation</Label>
            <Input
              id="mothersOccupation"
              value={data.mothersOccupation}
              onChange={(e) => update("mothersOccupation", e.target.value)}
              placeholder="e.g. Homemaker"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="motherLifeStatus">Mother&apos;s Status</Label>
            <select
              id="motherLifeStatus"
              value={data.motherLifeStatus || "Alive"}
              onChange={(e) => update("motherLifeStatus", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {PARENT_LIFE_STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 md:col-span-3 md:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="numberOfBrothers">No. of Brothers</Label>
              <Input
                id="numberOfBrothers"
                type="number"
                min={0}
                value={data.numberOfBrothers}
                onChange={(e) => update("numberOfBrothers", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="numberOfMarriedBrothers">
                No. of Married Brothers
              </Label>
              <Input
                id="numberOfMarriedBrothers"
                type="number"
                min={0}
                value={data.numberOfMarriedBrothers}
                onChange={(e) =>
                  update("numberOfMarriedBrothers", e.target.value)
                }
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="numberOfSisters">No. of Sisters</Label>
              <Input
                id="numberOfSisters"
                type="number"
                min={0}
                value={data.numberOfSisters}
                onChange={(e) => update("numberOfSisters", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="numberOfMarriedSisters">
                No. of Married Sisters
              </Label>
              <Input
                id="numberOfMarriedSisters"
                type="number"
                min={0}
                value={data.numberOfMarriedSisters}
                onChange={(e) =>
                  update("numberOfMarriedSisters", e.target.value)
                }
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid gap-2 md:col-span-3">
            <Label htmlFor="familyType">Family Type</Label>
            <Input
              id="familyType"
              value={data.familyType}
              onChange={(e) => update("familyType", e.target.value)}
              placeholder="e.g. Nuclear"
            />
          </div>
          <div className="grid gap-2 md:col-span-3">
            <Label htmlFor="familyStatus">Family Status</Label>
            <Input
              id="familyStatus"
              value={data.familyStatus}
              onChange={(e) => update("familyStatus", e.target.value)}
              placeholder="e.g. Upper Middle Class"
            />
          </div>
          <div className="grid gap-2 md:col-span-3">
            <Label htmlFor="aboutMyFamily">About My Family (Optional)</Label>
            <textarea
              id="aboutMyFamily"
              value={data.aboutMyFamily}
              onChange={(e) => update("aboutMyFamily", e.target.value)}
              placeholder="e.g. We are a close-knit family with traditional values."
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>
      );
    case "About Me":
      return (
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={data.bio}
              onChange={(e) => update("bio", e.target.value)}
              placeholder="Tell others about yourself"
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>
      );
    case "Horoscope":
      return (
        <div className="grid gap-4 py-2">
          <p className="text-sm text-muted-foreground">
            Jathagam details are used for Porutham matching (Hindu users).
          </p>
          <div className="grid gap-2">
            <Label htmlFor="rashi">Rashi</Label>
            <Input
              id="rashi"
              value={data.rashi}
              onChange={(e) => update("rashi", e.target.value)}
              placeholder="e.g. Meena (Pisces)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nakshatra">Nakshatra</Label>
            <Input
              id="nakshatra"
              value={data.nakshatra}
              onChange={(e) => update("nakshatra", e.target.value)}
              placeholder="e.g. Revati"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="manglikStatus">Manglik Status</Label>
            <Input
              id="manglikStatus"
              value={data.manglikStatus}
              onChange={(e) => update("manglikStatus", e.target.value)}
              placeholder="e.g. Non-Manglik"
            />
          </div>
        </div>
      );
    default:
      return null;
  }
}

function getSectionSummary(section: SectionKey, data: ProfileFormData): string {
  switch (section) {
    case "Basic Info": {
      const dobDisplay = data.dob.trim()
        ? formatDateDdMmYyyy(data.dob)
        : "";
      return (
        [
          data.name,
          data.gender ? formatGenderLabel(data.gender) : "",
          dobDisplay,
          data.email,
        ]
          .filter(Boolean)
          .join(" · ") || "—"
      );
    }
    case "Religion":
      return (
        [data.religion, data.caste, data.motherTongue]
          .filter(Boolean)
          .join(" · ") || "—"
      );
    case "Education":
      return (
        [data.qualification, data.educationSubject, data.job, data.income]
          .filter(Boolean)
          .join(" · ") || "—"
      );
    case "Photos":
      return "Profile and verification photos";
    case "Location":
      return (
        [data.city, data.state, data.district, data.country]
          .filter(Boolean)
          .join(", ") ||
        data.address ||
        "—"
      );
    case "Personal": {
      const h = data.height.trim();
      const w = data.weight.trim();
      const parts = [
        data.maritalStatus,
        h ? `${h} cm` : "",
        w ? `${w} kg` : "",
        data.color,
        data.bloodGroup,
      ].filter(Boolean);
      return parts.join(" · ") || "—";
    }
    case "Family":
      return (
        [data.fathersName, data.mothersName, data.aboutMyFamily]
          .filter(Boolean)
          .slice(0, 2)
          .join(" · ") || "—"
      );
    case "About Me":
      return data.bio
        ? `${data.bio.slice(0, 80)}${data.bio.length > 80 ? "…" : ""}`
        : "—";
    case "Horoscope":
      return (
        [data.rashi, data.nakshatra, data.manglikStatus]
          .filter(Boolean)
          .join(" · ") || "—"
      );
    default:
      return "";
  }
}

function getMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  const base = BASE_URL.replace(/\/api\/?$/, "");
  return path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

function ViewSectionContent({
  section,
  data,
  photos,
}: {
  section: SectionKey;
  data: ProfileFormData;
  photos?: Record<string, string | null>;
}) {
  const row = (label: string, value: string) => {
    const renderedValue =
      value != null && String(value).trim() !== "" ? String(value).trim() : "N/A";
    return (
      <div
        key={label}
        className="flex flex-wrap gap-x-2 py-1.5 border-b border-border/50 last:border-0"
      >
        <span className="font-medium text-muted-foreground min-w-[140px]">
          {label}
        </span>
        <span className="text-foreground">{renderedValue}</span>
      </div>
    );
  };

  const preferenceLabelMap: Record<
    NonNullable<ProfileFormData["partner_preference_type"]>,
    string
  > = {
    own_religion_only: "Same Religion Only",
    open_to_all: "Open to All Religions",
    specific_religions: "Specific Religions",
  };

  const partnerPreferenceType = data.partner_preference_type;
  const partnerPreferenceLabel =
    (partnerPreferenceType ? preferenceLabelMap[partnerPreferenceType] : "") ||
    data.partnerReligionPreference ||
    "";
  const specificReligionNames = (data.partner_religion_names ?? []).filter(
    (x) => String(x).trim() !== "",
  );

  switch (section) {
    case "Basic Info":
      return (
        <div className="space-y-0 divide-y-0">
          {row("Name", data.name)}
          {row("Gender", formatGenderLabel(data.gender) || "—")}
          {row(
            "Date of Birth",
            data.dob.trim() ? formatDateDdMmYyyy(data.dob) : "",
          )}
          {row("Phone", data.phone)}
          {row("Email", data.email)}
        </div>
      );
    case "Religion":
      return (
        <div className="space-y-0">
          {row("Religion", data.religion)}
          {row("Caste", data.caste)}
          {row("Mother Tongue", data.motherTongue)}
          {row("Partner Religion Preference", partnerPreferenceLabel)}
          {partnerPreferenceType === "specific_religions"
            ? row("Specific Religions", specificReligionNames.join(", "))
            : null}
        </div>
      );
    case "Education":
      return (
        <div className="space-y-0">
          {row("Highest Education", data.qualification)}
          {row("Education Subject", data.educationSubject)}
          {row("Employment Status", data.employmentStatus)}
          {row("Occupation", data.job)}
          {row("Annual Income", data.income)}
        </div>
      );
    case "Photos": {
      const entries = photos
        ? Object.entries(photos).filter(
            ([, path]) => path != null && String(path).trim() !== "",
          )
        : [];
      if (entries.length === 0) {
        return (
          <p className="text-sm text-muted-foreground">
            No photos uploaded yet. Use Edit to upload profile and verification
            photos.
          </p>
        );
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map(([key, path]) => (
            <div key={key} className="flex flex-col gap-2">
              <span className="font-medium text-muted-foreground text-sm">
                {PHOTO_LABELS[key] ?? key.replace(/_/g, " ")}
              </span>
              <a
                href={getMediaUrl(path)}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl overflow-hidden border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <img
                  src={getMediaUrl(path)}
                  alt={PHOTO_LABELS[key] ?? key}
                  className="w-full h-48 object-cover object-center"
                />
              </a>
            </div>
          ))}
        </div>
      );
    }
    case "Location":
      return (
        <div className="space-y-0">
          {row("Country", data.country)}
          {row("State", data.state)}
          {row("District", data.district)}
          {row("City", data.city)}
          {row("Address", data.address)}
        </div>
      );
    case "Personal":
      return (
        <div className="space-y-0">
          {row("Marital Status", data.maritalStatus)}
          {row("Has Children", data.hasChildren === "yes" ? "Yes" : "No")}
          {row("Number of Children", data.numberOfChildren)}
          {row("Height (cm)", data.height)}
          {row("Weight (kg)", data.weight)}
          {row("Colour / Complexion", data.color)}
          {row("Blood Group", data.bloodGroup)}
        </div>
      );
    case "Family":
      return (
        <div className="space-y-0">
          {row("Father's Status", data.fatherLifeStatus || "Alive")}
          {row("Father's Name", data.fathersName)}
          {row("Father's Occupation", data.fathersOccupation)}
          {row("Mother's Status", data.motherLifeStatus || "Alive")}
          {row("Mother's Name", data.mothersName)}
          {row("Mother's Occupation", data.mothersOccupation)}
          {row("Brothers", data.numberOfBrothers)}
          {row("Married Brothers", data.numberOfMarriedBrothers)}
          {row("Sisters", data.numberOfSisters)}
          {row("Married Sisters", data.numberOfMarriedSisters)}
          {row("Family Type", data.familyType)}
          {row("Family Status", data.familyStatus)}
          {row("About Family", data.aboutMyFamily)}
        </div>
      );
    case "About Me":
      return <div className="space-y-0">{row("Bio", data.bio)}</div>;
    case "Horoscope":
      return (
        <div className="space-y-0">
          {row("Rashi", data.rashi)}
          {row("Nakshatra", data.nakshatra)}
          {row("Manglik Status", data.manglikStatus)}
        </div>
      );
    default:
      return null;
  }
}

const UserProfilePage = () => {
  const { user } = useAuthStore();
  const profileSections = allProfileSections;
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [profileData, setProfileData] = useState<ProfileFormData>(() =>
    defaultProfileData(user),
  );
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewingSection, setViewingSection] = useState<SectionKey | null>(null);
  const [profileApiData, setProfileApiData] = useState<ProfileData | null>(
    null,
  );
  const [photoFiles, setPhotoFiles] = useState<Record<string, File | null>>({});
  const editPanelRef = useRef<HTMLDivElement>(null);

  const [locationCountries, setLocationCountries] = useState<Country[]>([]);
  const [locationStates, setLocationStates] = useState<State[]>([]);
  const [locationDistricts, setLocationDistricts] = useState<District[]>([]);
  const [locationCities, setLocationCities] = useState<City[]>([]);
  const [religionOptions, setReligionOptions] = useState<Religion[]>([]);
  const [casteOptions, setCasteOptions] = useState<Caste[]>([]);
  const [motherTongueOptions, setMotherTongueOptions] = useState<
    MotherTongue[]
  >([]);
  const [educationOptions, setEducationOptions] = useState<EducationMaster[]>([]);
  const [educationSubjectOptions, setEducationSubjectOptions] = useState<
    EducationSubjectMaster[]
  >([]);
  const [employmentStatusOptions, setEmploymentStatusOptions] = useState<
    EmploymentStatusMaster[]
  >([]);
  const [occupationOptions, setOccupationOptions] = useState<OccupationMaster[]>(
    [],
  );
  const [incomeRangeOptions, setIncomeRangeOptions] = useState<IncomeRangeMaster[]>(
    [],
  );
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<string[]>(
    MARITAL_STATUS_OPTIONS,
  );
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingReligions, setLoadingReligions] = useState(false);
  const [loadingCastes, setLoadingCastes] = useState(false);
  const [loadingMotherTongues, setLoadingMotherTongues] = useState(false);
  const [loadingEducations, setLoadingEducations] = useState(false);
  const [loadingEducationSubjects, setLoadingEducationSubjects] = useState(false);
  const [loadingEmploymentStatuses, setLoadingEmploymentStatuses] =
    useState(false);
  const [loadingOccupations, setLoadingOccupations] = useState(false);
  const [loadingIncomeRanges, setLoadingIncomeRanges] = useState(false);

  const loadLocationCountries = useCallback(async (search: string) => {
    setLoadingCountries(true);
    try {
      const list = await withMinDuration(180, getCountries(search || undefined));
      setLocationCountries(list);
    } catch {
      setLocationCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  }, []);

  const loadLocationStates = useCallback(
    async (search: string) => {
      const cid = profileData.country_id ?? 0;
      if (!cid) return;
      setLoadingStates(true);
      try {
        const list = await withMinDuration(
          180,
          getStates(cid, search || undefined),
        );
        setLocationStates(list);
      } catch {
        setLocationStates([]);
      } finally {
        setLoadingStates(false);
      }
    },
    [profileData.country_id],
  );

  const loadLocationDistricts = useCallback(
    async (search: string) => {
      const sid = profileData.state_id ?? 0;
      if (!sid) return;
      setLoadingDistricts(true);
      try {
        const list = await withMinDuration(
          180,
          getDistricts(sid, search || undefined),
        );
        setLocationDistricts(list);
      } catch {
        setLocationDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    },
    [profileData.state_id],
  );

  const loadLocationCities = useCallback(
    async (search: string) => {
      const did = profileData.district_id ?? 0;
      if (!did) return;
      setLoadingCities(true);
      try {
        const list = await withMinDuration(
          180,
          getCities(did, search || undefined),
        );
        setLocationCities(list);
      } catch {
        setLocationCities([]);
      } finally {
        setLoadingCities(false);
      }
    },
    [profileData.district_id],
  );

  const loadReligionsList = useCallback(async (search: string) => {
    setLoadingReligions(true);
    try {
      const list = await withMinDuration(180, getReligions(search || undefined));
      setReligionOptions(list);
    } catch {
      setReligionOptions([]);
    } finally {
      setLoadingReligions(false);
    }
  }, []);

  const loadCastesList = useCallback(
    async (search: string) => {
      const rid = profileData.religion_id ?? 0;
      if (!rid) return;
      setLoadingCastes(true);
      try {
        const list = await withMinDuration(
          180,
          getCastes(rid, search || undefined),
        );
        setCasteOptions(list);
      } catch {
        setCasteOptions([]);
      } finally {
        setLoadingCastes(false);
      }
    },
    [profileData.religion_id],
  );

  const loadMotherTonguesList = useCallback(async (search: string) => {
    setLoadingMotherTongues(true);
    try {
      const list = await withMinDuration(
        180,
        getMotherTongues(search || undefined),
      );
      setMotherTongueOptions(list);
    } catch {
      setMotherTongueOptions([]);
    } finally {
      setLoadingMotherTongues(false);
    }
  }, []);

  const loadEducationsList = useCallback(async (search: string) => {
    setLoadingEducations(true);
    try {
      const list = await withMinDuration(180, getEducations(search || undefined));
      setEducationOptions(list);
    } catch {
      setEducationOptions([]);
    } finally {
      setLoadingEducations(false);
    }
  }, []);

  const loadEducationSubjectsList = useCallback(
    async (search: string) => {
      const educationId = profileData.education_id ?? 0;
      if (!educationId) return;
      setLoadingEducationSubjects(true);
      try {
        const list = await withMinDuration(
          180,
          getEducationSubjects(educationId, search || undefined),
        );
        setEducationSubjectOptions(list);
      } catch {
        setEducationSubjectOptions([]);
      } finally {
        setLoadingEducationSubjects(false);
      }
    },
    [profileData.education_id],
  );

  const loadEmploymentStatusesList = useCallback(async (search: string) => {
    setLoadingEmploymentStatuses(true);
    try {
      const list = await withMinDuration(
        180,
        getEmploymentStatuses(search || undefined),
      );
      setEmploymentStatusOptions(list);
    } catch {
      setEmploymentStatusOptions([]);
    } finally {
      setLoadingEmploymentStatuses(false);
    }
  }, []);

  const loadOccupationsList = useCallback(async (search: string) => {
    setLoadingOccupations(true);
    try {
      const list = await withMinDuration(180, getOccupations(search || undefined));
      setOccupationOptions(list);
    } catch {
      setOccupationOptions([]);
    } finally {
      setLoadingOccupations(false);
    }
  }, []);

  const loadIncomeRangesList = useCallback(async (search: string) => {
    setLoadingIncomeRanges(true);
    try {
      const list = await withMinDuration(180, getIncomeRanges(search || undefined));
      setIncomeRangeOptions(list);
    } catch {
      setIncomeRangeOptions([]);
    } finally {
      setLoadingIncomeRanges(false);
    }
  }, []);

  const updateAvatarFromProfile = useCallback((data: ProfileData) => {
    const profilePhoto = data.photos?.profile_photo ?? null;
    if (!profilePhoto) return;
    const url = getMediaUrl(profilePhoto);
    if (!url) return;
    useAuthStore.setState((state) =>
      state.user
        ? {
            user: {
              ...state.user,
              avatar: url,
            },
          }
        : state,
    );
  }, []);

  useEffect(() => {
    if (editingSection !== "Location") return;
    loadLocationCountries("");
  }, [editingSection, loadLocationCountries]);

  useEffect(() => {
    if (editingSection !== "Location") return;
    const cid = profileData.country_id ?? 0;
    if (cid) loadLocationStates("");
  }, [editingSection, profileData.country_id, loadLocationStates]);

  useEffect(() => {
    if (editingSection !== "Location") return;
    const sid = profileData.state_id ?? 0;
    if (sid) loadLocationDistricts("");
  }, [editingSection, profileData.state_id, loadLocationDistricts]);

  useEffect(() => {
    if (editingSection !== "Location") return;
    const did = profileData.district_id ?? 0;
    if (did) loadLocationCities("");
  }, [editingSection, profileData.district_id, loadLocationCities]);

  useEffect(() => {
    if (editingSection !== "Religion") return;
    loadReligionsList("");
    loadMotherTonguesList("");
  }, [editingSection, loadReligionsList, loadMotherTonguesList]);

  useEffect(() => {
    if (editingSection !== "Religion") return;
    const rid = profileData.religion_id ?? 0;
    setCasteOptions([]);
    if (rid) loadCastesList("");
  }, [editingSection, profileData.religion_id, loadCastesList]);

  useEffect(() => {
    if (editingSection !== "Education") return;
    loadEducationsList("");
    loadEmploymentStatusesList("");
    loadOccupationsList("");
    loadIncomeRangesList("");
  }, [
    editingSection,
    loadEducationsList,
    loadEmploymentStatusesList,
    loadOccupationsList,
    loadIncomeRangesList,
  ]);

  useEffect(() => {
    if (editingSection !== "Education") return;
    const educationId = profileData.education_id ?? 0;
    setEducationSubjectOptions([]);
    if (educationId) loadEducationSubjectsList("");
  }, [editingSection, profileData.education_id, loadEducationSubjectsList]);

  useEffect(() => {
    if (editingSection !== "Personal") return;
    let cancelled = false;
    const loadMaritalStatuses = async () => {
      try {
        const statuses = await withMinDuration(180, getMaritalStatuses());
        if (cancelled) return;
        const names = statuses
          .map((status) => status?.name?.trim())
          .filter((name): name is string => !!name);
        if (names.length > 0) {
          setMaritalStatusOptions(Array.from(new Set(names)));
        }
      } catch {
        // Keep fallback options if API fails.
        if (!cancelled) setMaritalStatusOptions(MARITAL_STATUS_OPTIONS);
      }
    };
    void loadMaritalStatuses();
    return () => {
      cancelled = true;
    };
  }, [editingSection]);

  useEffect(() => {
    let cancelled = false;
    setProfileError(null);
    getProfile()
      .then((res) => {
        if (cancelled || !res.success || !res.data) return;
        setProfileApiData(res.data);
        setProfileData(mapProfileDataToForm(res.data, user));
        updateAvatarFromProfile(res.data);
      })
      .catch((e) => {
        if (!cancelled)
          setProfileError(
            e instanceof Error ? e.message : "Failed to load profile",
          );
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.name, user?.phone, user?.email, user?.location]);

  const handleViewSection = (title: SectionKey) => {
    setViewingSection(title);
  };

  const handleEditSection = (title: SectionKey) => {
    setSaveError(null);
    setViewingSection(null);
    if (title !== "Photos") setPhotoFiles({});
    setEditingSection(title);
    if (title === "Family") {
      getProfileFamily()
        .then((res) => {
          const family = res?.data ?? {};
          setProfileData((prev) => ({
            ...prev,
            fathersName: String(family.father_name ?? prev.fathersName ?? ""),
            fathersOccupation: String(
              family.father_occupation ?? prev.fathersOccupation ?? "",
            ),
            fatherLifeStatus: String(
              family.father_status ?? prev.fatherLifeStatus ?? "",
            ),
            mothersName: String(family.mother_name ?? prev.mothersName ?? ""),
            mothersOccupation: String(
              family.mother_occupation ?? prev.mothersOccupation ?? "",
            ),
            motherLifeStatus: String(
              family.mother_status ?? prev.motherLifeStatus ?? "",
            ),
            numberOfBrothers:
              family.brothers != null
                ? String(family.brothers)
                : prev.numberOfBrothers,
            numberOfMarriedBrothers:
              family.married_brothers != null
                ? String(family.married_brothers)
                : prev.numberOfMarriedBrothers,
            numberOfSisters:
              family.sisters != null
                ? String(family.sisters)
                : prev.numberOfSisters,
            numberOfMarriedSisters:
              family.married_sisters != null
                ? String(family.married_sisters)
                : prev.numberOfMarriedSisters,
            aboutMyFamily: String(
              family.about_family ?? prev.aboutMyFamily ?? "",
            ),
            familyType: String(family.family_type ?? prev.familyType ?? ""),
            familyStatus: String(
              family.family_status ?? prev.familyStatus ?? "",
            ),
          }));
        })
        .catch(() => {
          // Keep existing values if family endpoint fails.
        });
    }
  };

  const handlePhotoChange = useCallback((key: string, file: File | null) => {
    setPhotoFiles((prev) => ({ ...prev, [key]: file }));
  }, []);

  useEffect(() => {
    if (editingSection !== "Photos") return;
    editPanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [editingSection, photoFiles]);

  const buildLocationBody = (): LocationBody => ({
    country_id: profileData.country_id ?? 0,
    state_id: profileData.state_id ?? 0,
    district_id: profileData.district_id ?? 0,
    city_id: profileData.city_id ?? 0,
    address: profileData.address ?? "",
  });

  const buildReligionBody = (): ReligionBody => ({
    religion_id: profileData.religion_id ?? 0,
    caste_id: profileData.caste_id ?? null,
    mother_tongue_id: profileData.mother_tongue_id ?? 0,
    partner_preference_type:
      profileData.partner_preference_type ?? "open_to_all",
    partner_religion_ids: (profileData.partner_religion_ids ?? [])
      .map((item) => (typeof item === "number" ? item : (item?.id ?? 0)))
      .filter((id): id is number => Number.isFinite(id) && id > 0),
    partner_caste_preferences: profileData.partner_caste_preferences ?? {},
  });

  const buildPersonalBody = (): PersonalBody => {
    const h = parseInt(String(profileData.height).replace(/\D/g, ""), 10);
    const w = parseFloat(String(profileData.weight).replace(/[^\d.]/g, ""));
    return {
      marital_status: profileData.maritalStatus || "",
      has_children: profileData.hasChildren === "yes",
      number_of_children:
        profileData.hasChildren === "yes"
          ? parseInt(profileData.numberOfChildren, 10) || null
          : null,
      height_cm: Number.isFinite(h) ? h : 0,
      weight_kg: Number.isFinite(w) ? w : null,
      complexion: profileData.color || "",
      blood_group: profileData.bloodGroup || "O+ve",
    };
  };

  const buildEducationBody = (): EducationBody => ({
    highest_education: profileData.qualification || "",
    education_subject: profileData.educationSubject || "",
    employment: profileData.employmentStatus || "",
    occupation: profileData.job || "",
    annual_income: profileData.income || "",
  });

  const buildFamilyBody = (): FamilyBody => ({
    father_status:
      profileData.fatherLifeStatus === "Late" ? "Late" : "Alive",
    father_name: profileData.fathersName || "",
    father_occupation: profileData.fathersOccupation || "",
    mother_status:
      profileData.motherLifeStatus === "Late" ? "Late" : "Alive",
    mother_name: profileData.mothersName || "",
    mother_occupation: profileData.mothersOccupation || "",
    brothers: parseInt(profileData.numberOfBrothers, 10) || 0,
    married_brothers: parseInt(profileData.numberOfMarriedBrothers, 10) || 0,
    sisters: parseInt(profileData.numberOfSisters, 10) || 0,
    married_sisters: parseInt(profileData.numberOfMarriedSisters, 10) || 0,
    about_family: profileData.aboutMyFamily || "",
    family_type: profileData.familyType || "",
    family_status: profileData.familyStatus || "",
  });

  const handleSaveSection = async () => {
    const section = editingSection;
    if (!section) return;
    setSaveError(null);
    try {
      switch (section) {
        case "Basic Info":
          await patchBasic({
            name: profileData.name,
            gender: profileData.gender.trim().toLowerCase(),
            dob: normalizeDobForApi(profileData.dob),
            email: profileData.email,
          });
          if (user) {
            useAuthStore.setState({
              user: {
                ...user,
                name: profileData.name || user.name,
                email: profileData.email || user.email,
              },
            });
          }
          break;
        case "Location":
          await patchLocation(buildLocationBody());
          break;
        case "Religion":
          await patchReligion(buildReligionBody());
          break;
        case "Personal":
          await patchPersonal(buildPersonalBody());
          break;
        case "Education":
          await patchEducation(buildEducationBody());
          break;
        case "About Me":
          await patchAbout({ about_me: profileData.bio || "" });
          break;
        case "Family":
          await patchFamily(buildFamilyBody());
          break;
        case "Photos": {
          const body: {
            profile_photo?: File;
            full_photo?: File;
            selfie_photo?: File;
            family_photo?: File;
            aadhaar_front?: File;
            aadhaar_back?: File;
          } = {};
          PHOTO_KEYS.forEach((k) => {
            const f = photoFiles[k];
            if (f) body[k] = f;
          });
          if (Object.keys(body).length > 0) {
            await postPhotos(body);
            const res = await getProfile();
            if (res.success && res.data) {
              setProfileApiData(res.data);
              setProfileData(mapProfileDataToForm(res.data, user));
            }
          }
          setPhotoFiles({});
          setEditingSection(null);
          return;
        }
        case "Horoscope":
          setEditingSection(null);
          return;
        default:
          setEditingSection(null);
          return;
      }
      const res = await getProfile();
      if (res.success && res.data) {
        setProfileApiData(res.data);
        setProfileData(mapProfileDataToForm(res.data, user));
        updateAvatarFromProfile(res.data);
      }
      setEditingSection(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <div className="space-y-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-secondary">
          My Profile
        </h1>

        {profileError && (
          <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
            {profileError}
          </div>
        )}

        {profileLoading ? (
          <p className="text-muted-foreground">Loading profile…</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              {profileSections.map((section) => (
                <ProfileSectionCard
                  key={section.title}
                  title={section.title}
                  icon={section.icon}
                  summary={getSectionSummary(section.title, profileData)}
                  onView={() => handleViewSection(section.title)}
                  onEdit={() => handleEditSection(section.title)}
                />
              ))}
            </div>

            {viewingSection && (
              <div className="mt-4 bg-white rounded-3xl shadow-card p-6 border border-primary/10">
                <h2 className="font-serif text-xl font-bold text-secondary mb-4">
                  {viewingSection}
                </h2>
                <ViewSectionContent
                  section={viewingSection}
                  data={profileData}
                  photos={profileApiData?.photos}
                />
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setViewingSection(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {editingSection && (
              <div
                ref={editPanelRef}
                className="mt-4 bg-white rounded-3xl shadow-card p-6 border border-primary/10 min-h-[420px] md:min-h-[500px] [&_input]:bg-white [&_select]:bg-white [&_textarea]:bg-white [&_input]:border-border [&_select]:border-border [&_textarea]:border-border"
              >
                <h2 className="font-serif text-xl font-bold text-secondary mb-4">
                  Edit {editingSection}
                </h2>
                {saveError && (
                  <p className="text-sm text-destructive mb-4">{saveError}</p>
                )}
                <EditSectionForm
                  section={editingSection}
                  data={profileData}
                  onChange={setProfileData}
                  maritalStatusOptions={
                    editingSection === "Personal" ? maritalStatusOptions : undefined
                  }
                  locationOptions={
                    editingSection === "Location"
                      ? {
                          countries: locationCountries,
                          states: locationStates,
                          districts: locationDistricts,
                          cities: locationCities,
                        }
                      : undefined
                  }
                  locationLoading={
                    editingSection === "Location"
                      ? {
                          countries: loadingCountries,
                          states: loadingStates,
                          districts: loadingDistricts,
                          cities: loadingCities,
                        }
                      : undefined
                  }
                  locationLoaders={
                    editingSection === "Location"
                      ? {
                          loadCountries: loadLocationCountries,
                          loadStates: loadLocationStates,
                          loadDistricts: loadLocationDistricts,
                          loadCities: loadLocationCities,
                        }
                      : undefined
                  }
                  onLocationChange={
                    editingSection === "Location"
                      ? (updates) =>
                          setProfileData((prev) => ({ ...prev, ...updates }))
                      : undefined
                  }
                  religionOptions={
                    editingSection === "Religion"
                      ? {
                          religions: religionOptions,
                          castes: casteOptions,
                          motherTongues: motherTongueOptions,
                        }
                      : undefined
                  }
                  religionLoading={
                    editingSection === "Religion"
                      ? {
                          religions: loadingReligions,
                          castes: loadingCastes,
                          motherTongues: loadingMotherTongues,
                        }
                      : undefined
                  }
                  religionLoaders={
                    editingSection === "Religion"
                      ? {
                          loadReligions: loadReligionsList,
                          loadCastes: loadCastesList,
                          loadMotherTongues: loadMotherTonguesList,
                        }
                      : undefined
                  }
                  onReligionChange={
                    editingSection === "Religion"
                      ? (updates) =>
                          setProfileData((prev) => ({ ...prev, ...updates }))
                      : undefined
                  }
                  educationOptions={
                    editingSection === "Education"
                      ? {
                          educations: educationOptions,
                          educationSubjects: educationSubjectOptions,
                          employmentStatuses: employmentStatusOptions,
                          occupations: occupationOptions,
                          incomeRanges: incomeRangeOptions,
                        }
                      : undefined
                  }
                  educationLoading={
                    editingSection === "Education"
                      ? {
                          educations: loadingEducations,
                          educationSubjects: loadingEducationSubjects,
                          employmentStatuses: loadingEmploymentStatuses,
                          occupations: loadingOccupations,
                          incomeRanges: loadingIncomeRanges,
                        }
                      : undefined
                  }
                  educationLoaders={
                    editingSection === "Education"
                      ? {
                          loadEducations: loadEducationsList,
                          loadEducationSubjects: loadEducationSubjectsList,
                          loadEmploymentStatuses: loadEmploymentStatusesList,
                          loadOccupations: loadOccupationsList,
                          loadIncomeRanges: loadIncomeRangesList,
                        }
                      : undefined
                  }
                  onEducationChange={
                    editingSection === "Education"
                      ? (updates) =>
                          setProfileData((prev) => ({ ...prev, ...updates }))
                      : undefined
                  }
                  photoFiles={
                    editingSection === "Photos" ? photoFiles : undefined
                  }
                  existingPhotos={
                    editingSection === "Photos"
                      ? profileApiData?.photos
                      : undefined
                  }
                  onPhotoChange={
                    editingSection === "Photos" ? handlePhotoChange : undefined
                  }
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      if (editingSection === "Photos") setPhotoFiles({});
                      setEditingSection(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="hero"
                    type="button"
                    onClick={handleSaveSection}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
};

export default UserProfilePage;
