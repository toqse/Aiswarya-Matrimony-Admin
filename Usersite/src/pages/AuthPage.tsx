"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Phone,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import {
  registerMobile,
  verifyMobile,
  register as registerApi,
  verifyOtp,
  resendOtp,
  normalizeRegisterProfileFor,
  type VerifyMobileData,
  type VerifyMobileProfile,
} from "@/lib/authApi";
import { getGenderFromProfileFor } from "@/lib/profileForGender";
import { ApiError, getDisplayErrorMessage } from "@/lib/apiErrors";
import {
  postLocation,
  postReligion,
  postPersonal,
  postEducation,
  getGenerateAbout,
  postAbout,
  postPhotos,
  fetchAndSyncMeProfile,
  getProfileReligion,
  getPartnerPreferences,
} from "@/lib/profileApi";
import SignupStepIndicator, {
  SIGNUP_STEPS,
} from "@/components/signup/SignupStepIndicator";
import ProfileForStep from "@/components/signup/steps/ProfileForStep";
import BasicInfoStep from "@/components/signup/steps/BasicInfoStep";
import LocationStep from "@/components/signup/steps/LocationStep";
import ReligiousStep from "@/components/signup/steps/ReligiousStep";
import PersonalStep from "@/components/signup/steps/PersonalStep";
import EducationStep from "@/components/signup/steps/EducationStep";
import AboutMeStep from "@/components/signup/steps/AboutMeStep";
import PhotosStep from "@/components/signup/steps/PhotosStep";

type AuthMode = "login" | "signup";
const SIGNUP_DRAFT_STORAGE_KEY = "matrimony_signup_draft_v1";
const AUTH_RETURN_STATE_STORAGE_KEY = "matrimony_auth_return_state_v1";

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const PROFILE_STEP_TO_SIGNUP_INDEX: Record<string, number> = {
  location: 2,
  religion: 3,
  personal: 4,
  education: 5,
  about: 6,
  photos: 7,
};

const PROFILE_STEP_ORDER: string[] = [
  "location",
  "religion",
  "personal",
  "education",
  "about",
  "photos",
];
const MARITAL_OPTIONS = [
  "Awaiting Divorce",
  "Never Married",
  "Married",
  "Divorced",
  "Widowed",
  "Separated",
] as const;
const COLOR_OPTIONS = [
  "White",
  "Medium",
  "Black",
  "Very Fair",
  "Fair",
  "Wheatish",
  "Wheatish Brown",
  "Dark",
] as const;
const EMPLOYMENT_OPTIONS = [
  "Employed",
  "Self-Employed",
  "Business",
  "Unemployed",
  "Student",
  "Freelancer",
] as const;
const INCOME_RANGES = [
  "Not specified",
  "Below 1 Lakh",
  "1-2 Lakh",
  "2-5 Lakh",
  "5-10 Lakh",
  "10-25 Lakh",
  "25 Lakh+",
] as const;
const REQUIRED_SIGNUP_PHOTO_KEYS = ["full", "passport"] as const;

const normalizeToken = (v: string) => v.toLowerCase().replace(/[_\-\s]+/g, "");

const matchOption = (value: unknown, options: readonly string[]): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const normalized = normalizeToken(raw);
  const exact = options.find((opt) => normalizeToken(opt) === normalized);
  if (exact) return exact;
  // Fallback for API values like "employment_status"
  if (normalized === "selfemployed") return "Self-Employed";
  return raw;
};

const normalizeDateForInput = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return "";
};

const normalizeNumberForInput = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "";
  const raw = String(value).trim();
  if (!raw) return "";
  const direct = Number(raw);
  if (Number.isFinite(direct)) return String(direct);
  const match = raw.match(/\d+(\.\d+)?/);
  if (!match) return "";
  const n = Number(match[0]);
  return Number.isFinite(n) ? String(n) : "";
};

const parsePartnerCastePreferences = (
  raw: string | undefined,
): Record<string, number[]> => {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number[]> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!Array.isArray(value)) continue;
      const ids = value
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0);
      if (ids.length > 0) out[String(key)] = ids;
    }
    return out;
  } catch {
    return {};
  }
};

const otpDigitsFromResponse = (
  payload: unknown,
): [string, string, string, string, string, string] | null => {
  const root =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;
  const nested =
    root?.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;
  const rawOtp = nested?.otp ?? root?.otp;
  const otp = typeof rawOtp === "string" ? rawOtp.replace(/\D/g, "") : "";
  if (otp.length !== 6) return null;
  return otp.split("") as [string, string, string, string, string, string];
};

const isProfileFullyCompleted = (data?: VerifyMobileData): boolean => {
  if (!data) return false;
  if (data.is_registration_profile_completed) return true;
  const steps = data.profile_steps ?? {};
  if (PROFILE_STEP_ORDER.every((key) => steps[key] === true)) return true;
  return false;
};

const getNextSignupStepFromProfile = (
  data?: VerifyMobileData,
): number | null => {
  if (!data) return null;
  const steps = data.profile_steps ?? {};

  if (data.next_step && PROFILE_STEP_TO_SIGNUP_INDEX[data.next_step] != null) {
    if (!steps[data.next_step]) {
      return PROFILE_STEP_TO_SIGNUP_INDEX[data.next_step];
    }
  }

  for (const key of PROFILE_STEP_ORDER) {
    const flag = (steps as Record<string, boolean | undefined>)[key];
    if (!flag) {
      return PROFILE_STEP_TO_SIGNUP_INDEX[key];
    }
  }

  return null;
};

function mapProfileToFormData(
  profile: VerifyMobileProfile | null | undefined,
): { form: Partial<Record<string, string>>; hasChildren?: "yes" | "no" } {
  if (!profile) return { form: {} };
  const b = profile.basic_details;
  const loc = profile.location_details;
  const rel = profile.religion_details;
  const pers = (profile.personal_details ?? {}) as Record<string, unknown>;
  const edu = (profile.education_details ?? {}) as Record<string, unknown>;
  const phoneStr = b?.phone ?? "";
  const phoneDigits = phoneStr
    .replace(/\D/g, "")
    .replace(/^91/, "")
    .slice(0, 10);
  const genderRaw = String(b?.gender ?? "").trim();
  const genderToken = genderRaw.toLowerCase();
  const genderDisplay =
    genderToken === "f" || genderToken === "female" || genderToken === "g"
      ? "Female"
      : genderToken === "m" || genderToken === "male"
        ? "Male"
        : genderRaw;
  const childrenCount = Number(
    pers.number_of_children ?? pers.children_count ?? 0,
  );
  const hasChildrenValue =
    Number.isFinite(childrenCount) && childrenCount > 0 ? "yes" : "no";

  return {
    form: {
      ...(b?.name != null && b.name !== "" && { name: b.name }),
      ...(phoneDigits !== "" && { phone: phoneDigits }),
      ...(b?.email != null && b.email !== "" && { email: b.email }),
      ...(b?.dob != null &&
        b.dob !== "" && { dob: normalizeDateForInput(b.dob) }),
      ...(genderDisplay !== "" && { gender: genderDisplay }),
      ...(loc?.country_id != null && { country_id: String(loc.country_id) }),
      ...(loc?.country != null &&
        loc.country !== "" && { country: loc.country }),
      ...(loc?.state_id != null && { state_id: String(loc.state_id) }),
      ...(loc?.state != null && loc.state !== "" && { state: loc.state }),
      ...(loc?.district_id != null && { district_id: String(loc.district_id) }),
      ...(loc?.district != null &&
        loc.district !== "" && { district: loc.district }),
      ...(loc?.city_id != null && { city_id: String(loc.city_id) }),
      ...(loc?.city != null && loc.city !== "" && { city: loc.city }),
      ...(loc?.address != null &&
        loc.address !== "" && { address: loc.address }),
      ...(rel?.religion_id != null && { religion_id: String(rel.religion_id) }),
      ...(rel?.religion != null &&
        rel.religion !== "" && { religion: rel.religion }),
      ...(rel?.caste_id != null && { caste_id: String(rel.caste_id) }),
      ...(rel?.caste != null && rel.caste !== "" && { caste: rel.caste }),
      ...(rel?.mother_tongue_id != null && {
        mother_tongue_id: String(rel.mother_tongue_id),
      }),
      ...(rel?.mother_tongue != null &&
        rel.mother_tongue !== "" && { motherTongue: rel.mother_tongue }),
      ...(typeof rel?.partner_preference_type === "string" &&
        rel.partner_preference_type !== "" && {
          partner_preference_type: rel.partner_preference_type,
        }),
      ...(Array.isArray(rel?.partner_religion_ids) && {
        partner_religion_ids: rel.partner_religion_ids
          .map((item) =>
            typeof item === "number" ? item : Number(item?.id ?? 0),
          )
          .filter((id) => Number.isFinite(id) && id > 0)
          .join(","),
      }),
      ...(rel &&
        typeof rel === "object" &&
        "partner_caste_preferences" in (rel as Record<string, unknown>) && {
          partner_caste_preferences: JSON.stringify(
            (rel as Record<string, unknown>).partner_caste_preferences ?? {},
          ),
        }),
      ...(rel?.partner_age_from != null && {
        partner_age_from: String(rel.partner_age_from),
      }),
      ...(rel?.partner_age_to != null && {
        partner_age_to: String(rel.partner_age_to),
      }),
      ...(pers.marital_status != null &&
        String(pers.marital_status) !== "" && {
          maritalStatus: matchOption(pers.marital_status, MARITAL_OPTIONS),
        }),
      ...((pers.height ?? pers.height_cm) != null && {
        height: normalizeNumberForInput(pers.height ?? pers.height_cm),
      }),
      ...((pers.weight ?? pers.weight_kg) != null && {
        weight: normalizeNumberForInput(pers.weight ?? pers.weight_kg),
      }),
      ...((pers.complexion ?? pers.colour) != null &&
        String(pers.complexion ?? pers.colour) !== "" && {
          skinTone: matchOption(pers.complexion ?? pers.colour, COLOR_OPTIONS),
        }),
      ...(pers.blood_group != null &&
        String(pers.blood_group) !== "" && {
          bloodGroup: String(pers.blood_group),
        }),
      ...(pers.number_of_children != null && {
        numberOfChildren: String(pers.number_of_children),
      }),
      ...(pers.children_count != null && {
        numberOfChildren: String(pers.children_count),
      }),
      ...(edu.highest_education != null &&
        String(edu.highest_education) !== "" && {
          education: String(edu.highest_education),
        }),
      ...(edu.education_subject != null &&
        String(edu.education_subject) !== "" && {
          educationSubject: String(edu.education_subject),
        }),
      ...((edu.employment ?? edu.employment_status) != null &&
        String(edu.employment ?? edu.employment_status) !== "" && {
          employmentStatus: matchOption(
            edu.employment ?? edu.employment_status,
            EMPLOYMENT_OPTIONS,
          ),
        }),
      ...(edu.occupation != null &&
        String(edu.occupation) !== "" && {
          occupation: String(edu.occupation),
        }),
      ...(edu.annual_income != null &&
        String(edu.annual_income) !== "" && {
          annualIncome: matchOption(edu.annual_income, INCOME_RANGES),
        }),
      ...(profile.about_me != null &&
        profile.about_me !== "" && { aboutMe: profile.about_me }),
    },
    hasChildren: hasChildrenValue,
  };
}

const AuthPage = () => {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const getProfileIncompleteSignupStep = useAuthStore(
    (s) => s.getProfileIncompleteSignupStep,
  );
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [signupStep, setSignupStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isProfileResumeFlow, setIsProfileResumeFlow] = useState(false);

  const profilePrefill = useAuthStore((s) => s.profilePrefill);

  useEffect(() => {
    if (!accessToken) return;
    const step = getProfileIncompleteSignupStep();
    if (step != null) {
      setMode("signup");
      setIsProfileResumeFlow(true);
      setPhoneVerified(true);
      setDirection(1);
      setSignupStep(Math.max(2, step));
      const prefill = mapProfileToFormData(profilePrefill);
      if (Object.keys(prefill.form).length > 0) {
        setFormData((prev) => ({ ...prev, ...prefill.form }));
      }
      if (prefill.hasChildren) {
        setHasChildren(prefill.hasChildren);
      }
    }
  }, [accessToken, getProfileIncompleteSignupStep, profilePrefill]);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [hasChildren, setHasChildren] = useState<"yes" | "no">("no");
  const [interCaste, setInterCaste] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [signupSendingOtp, setSignupSendingOtp] = useState(false);
  const [signupOtp, setSignupOtp] = useState(["", "", "", "", "", ""]);
  const [photos, setPhotos] = useState<
    Record<string, { file: File; previewUrl: string }>
  >({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendOtpLoading, setResendOtpLoading] = useState(false);
  const [aboutSuggestions, setAboutSuggestions] = useState<string[]>([]);
  const [aboutSuggestionIndex, setAboutSuggestionIndex] = useState(0);
  const [signupErrors, setSignupErrors] = useState<{
    email?: string;
    dob?: string;
    phone?: string;
    general?: string;
  }>({});

  const [formData, setFormData] = useState({
    profileFor: "",
    name: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    password: "",
    country: "",
    state: "",
    district: "",
    city: "",
    address: "",
    addressType: "",
    country_id: "",
    state_id: "",
    district_id: "",
    city_id: "",
    religion: "",
    religion_id: "",
    caste: "",
    caste_id: "",
    subCaste: "",
    motherTongue: "",
    mother_tongue_id: "",
    partner_preference_type: "",
    partner_religion_ids: "",
    partner_caste_preferences: "",
    partner_age_from: "",
    partner_age_to: "",
    maritalStatus: "",
    numberOfChildren: "",
    height: "",
    weight: "",
    skinTone: "",
    bloodGroup: "",
    familyType: "",
    fathersName: "",
    fathersOccupation: "",
    mothersName: "",
    mothersOccupation: "",
    familyStatus: "",
    numberOfBrothers: "",
    numberOfMarriedBrothers: "",
    numberOfSisters: "",
    numberOfMarriedSisters: "",
    aboutMyFamily: "",
    education: "",
    educationSubject: "",
    employmentStatus: "",
    occupation: "",
    annualIncome: "",
    aboutMe: "",
  });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SIGNUP_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        formData?: Record<string, string>;
        hasChildren?: "yes" | "no";
      };
      if (parsed.formData && typeof parsed.formData === "object") {
        setFormData((prev) => ({ ...prev, ...parsed.formData }));
      }
      if (parsed.hasChildren === "yes" || parsed.hasChildren === "no") {
        setHasChildren(parsed.hasChildren);
      }
    } catch {
      // ignore malformed draft data
    }

    try {
      const rawReturnState = sessionStorage.getItem(
        AUTH_RETURN_STATE_STORAGE_KEY,
      );
      if (!rawReturnState) return;
      sessionStorage.removeItem(AUTH_RETURN_STATE_STORAGE_KEY);
      const parsedReturnState = JSON.parse(rawReturnState) as {
        mode?: AuthMode;
        signupStep?: number;
        agreeTerms?: boolean;
        phoneVerified?: boolean;
      };
      if (parsedReturnState.mode !== "signup") return;
      const nextSignupStep =
        typeof parsedReturnState.signupStep === "number"
          ? Math.min(
              Math.max(0, parsedReturnState.signupStep),
              SIGNUP_STEPS.length - 1,
            )
          : 1;
      setMode("signup");
      setDirection(1);
      setSignupStep(nextSignupStep);
      setAgreeTerms(Boolean(parsedReturnState.agreeTerms));
      setPhoneVerified(Boolean(parsedReturnState.phoneVerified));
    } catch {
      // ignore malformed return state
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        SIGNUP_DRAFT_STORAGE_KEY,
        JSON.stringify({
          formData,
          hasChildren,
        }),
      );
    } catch {
      // ignore localStorage errors
    }
  }, [formData, hasChildren]);

  useEffect(() => {
    if (signupStep !== 1) return;
    const { locked, gender } = getGenderFromProfileFor(formData.profileFor);
    if (!locked || !gender || formData.gender === gender) return;
    setFormData((prev) => ({ ...prev, gender }));
  }, [signupStep, formData.profileFor, formData.gender]);

  useEffect(() => {
    if (signupStep !== 3 || !accessToken) return;
    let cancelled = false;

    (async () => {
      try {
        const [religionRes, prefRes] = await Promise.all([
          getProfileReligion(),
          getPartnerPreferences().catch(() => null),
        ]);
        if (cancelled) return;
        const religionData = religionRes?.data ?? {};
        const partnerData = prefRes?.data ?? {};
        setFormData((prev) => ({
          ...prev,
          ...(religionData.religion_id != null && {
            religion_id: String(religionData.religion_id),
          }),
          ...(religionData.religion != null &&
            religionData.religion !== "" && {
              religion: religionData.religion,
            }),
          ...(religionData.caste_id != null && {
            caste_id: String(religionData.caste_id),
          }),
          ...(religionData.caste != null &&
            religionData.caste !== "" && { caste: religionData.caste }),
          ...(religionData.mother_tongue_id != null && {
            mother_tongue_id: String(religionData.mother_tongue_id),
          }),
          ...(religionData.mother_tongue != null &&
            religionData.mother_tongue !== "" && {
              motherTongue: religionData.mother_tongue,
            }),
          partner_preference_type:
            partnerData.partner_preference_type ??
            religionData.partner_preference_type ??
            prev.partner_preference_type,
          partner_religion_ids: (
            partnerData.partner_religion_ids ??
            religionData.partner_religion_ids ??
            []
          )
            .filter(
              (id): id is number =>
                Number.isFinite(Number(id)) && Number(id) > 0,
            )
            .map((id) => String(id))
            .join(","),
          partner_caste_preferences: JSON.stringify(
            partnerData.partner_caste_preferences ??
              religionData.partner_caste_preferences ??
              {},
          ),
          partner_age_from: String(
            partnerData.partner_age_from ??
              religionData.partner_age_from ??
              prev.partner_age_from ??
              "",
          ),
          partner_age_to: String(
            partnerData.partner_age_to ??
              religionData.partner_age_to ??
              prev.partner_age_to ??
              "",
          ),
        }));
      } catch {
        // Keep existing prefill if this request fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [signupStep, accessToken]);

  useEffect(() => {
    const clearSignupDraft = () => {
      try {
        sessionStorage.removeItem(SIGNUP_DRAFT_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    };
    window.addEventListener("beforeunload", clearSignupDraft);
    return () => {
      window.removeEventListener("beforeunload", clearSignupDraft);
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
      setSignupErrors((prev) => ({
        ...prev,
        phone: undefined,
        general: undefined,
      }));
      return;
    }
    if (name === "dob") {
      const cleaned = value.slice(0, 10);
      const [y = "", m = "", d = ""] = cleaned.split("-");
      const safeYear = y.slice(0, 4);
      const nextDob = safeYear && m && d ? `${safeYear}-${m}-${d}` : cleaned;
      setFormData((prev) => ({ ...prev, dob: nextDob }));
      setSignupErrors((prev) => ({
        ...prev,
        dob: undefined,
        general: undefined,
      }));
      return;
    }
    if (name === "religion") {
      setFormData((prev) => ({ ...prev, religion: value, caste: "" }));
      return;
    }
    if (name === "country_id") {
      setFormData((prev) => ({
        ...prev,
        country_id: value,
        state_id: "",
        district_id: "",
        city_id: "",
      }));
      return;
    }
    if (name === "state_id") {
      setFormData((prev) => ({
        ...prev,
        state_id: value,
        district_id: "",
        city_id: "",
      }));
      return;
    }
    if (name === "district_id") {
      setFormData((prev) => ({ ...prev, district_id: value, city_id: "" }));
      return;
    }
    if (
      name === "gender" &&
      getGenderFromProfileFor(formData.profileFor).locked
    ) {
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email") {
      setSignupErrors((prev) => ({
        ...prev,
        email: undefined,
        general: undefined,
      }));
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) {
      toast.error("Please enter your phone number");
      return;
    }
    const digits = formData.phone.replace(/\D/g, "");
    const len = digits.length;
    if (len !== 10) {
      toast.error("Phone number must be 10 digits");
      return;
    }
    const mobile = "+91" + digits;
    try {
      const res = await registerMobile({ mobile });
      setOtpSent(true);
      setOtp(otpDigitsFromResponse(res) ?? ["", "", "", "", "", ""]);
      toast.success("OTP sent to your phone");
    } catch (err) {
      toast.error(getDisplayErrorMessage(err));
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5)
      document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    const digits = formData.phone.replace(/\D/g, "");
    const mobile = "+91" + digits;
    try {
      const response = await verifyMobile({ mobile, otp: otpCode });
      const data = response.data;
      if (!response.success || !data) {
        toast.error("Failed to verify OTP");
        return;
      }

      useAuthStore.getState().setAuthFromVerify(mobile, data);
      setOtpSent(false);
      setOtp(["", "", "", "", "", ""]);

      await fetchAndSyncMeProfile();

      if (isProfileFullyCompleted(data)) {
        toast.success("OTP verified! Welcome back! 💕");
        router.push("/dashboard");
        return;
      }

      const nextStepIndex = getNextSignupStepFromProfile(data) ?? 2;

      toast.success("OTP verified. Please complete your profile.");
      setMode("signup");
      setIsProfileResumeFlow(true);
      setPhoneVerified(true);
      setDirection(1);
      setSignupStep(Math.max(2, nextStepIndex));
      const prefill = mapProfileToFormData(data.profile);
      if (Object.keys(prefill.form).length > 0) {
        setFormData((prev) => ({ ...prev, ...prefill.form }));
      }
      if (prefill.hasChildren) {
        setHasChildren(prefill.hasChildren);
      }
    } catch (err) {
      toast.error(getDisplayErrorMessage(err));
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
  };

  const getPhoneNumberE164 = (): string | null => {
    const digits = formData.phone.replace(/\D/g, "");
    if (digits.length !== 10) return null;
    return "+91" + digits;
  };

  const handleLoginResendOtp = async () => {
    const phone_number = getPhoneNumberE164();
    if (!phone_number) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setResendOtpLoading(true);
    try {
      const res = await resendOtp({ phone_number });
      setOtp(otpDigitsFromResponse(res) ?? ["", "", "", "", "", ""]);
      toast.success(
        typeof res.message === "string" && res.message.trim()
          ? res.message
          : "OTP has been sent to your phone number.",
      );
    } catch (err) {
      toast.error(getDisplayErrorMessage(err));
    } finally {
      setResendOtpLoading(false);
    }
  };

  const handleSignupResendOtp = async () => {
    const phone_number = getPhoneNumberE164();
    if (!phone_number) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setResendOtpLoading(true);
    try {
      const res = await resendOtp({ phone_number });
      setSignupOtp(otpDigitsFromResponse(res) ?? ["", "", "", "", "", ""]);
      toast.success(
        typeof res.message === "string" && res.message.trim()
          ? res.message
          : "OTP has been sent to your phone number.",
      );
    } catch (err) {
      toast.error(getDisplayErrorMessage(err));
    } finally {
      setResendOtpLoading(false);
    }
  };

  const handleSignupSendOtp = async () => {
    if (signupSendingOtp) return;
    if (!formData.name?.trim()) {
      toast.error("Please enter full name");
      return;
    }
    const digits = formData.phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      toast.error("Phone number must be 10 digits");
      return;
    }
    if (!formData.dob?.trim()) {
      toast.error("Please enter date of birth");
      return;
    }
    if (!formData.gender?.trim()) {
      toast.error("Please select gender");
      return;
    }
    if (!agreeTerms) {
      toast.error("Please agree to Terms & Conditions and Privacy Policy");
      return;
    }
    const phone_number = "+91" + digits;
    // Convert yyyy-mm-dd (input type="date") to DD-MM-YYYY
    const [y, m, d] = formData.dob.split("-");
    const dob = d && m && y ? `${d}-${m}-${y}` : formData.dob;
    const g = formData.gender.toLowerCase();
    const gender: "M" | "F" | "O" = g.startsWith("f")
      ? "F"
      : g.startsWith("o")
        ? "O"
        : "M";
    const profile_for = normalizeRegisterProfileFor(formData.profileFor);
    setSignupSendingOtp(true);
    try {
      const res = await registerApi({
        name: formData.name.trim(),
        phone_number,
        ...(formData.email?.trim() ? { email: formData.email.trim() } : {}),
        dob,
        gender,
        ...(profile_for ? { profile_for } : {}),
      });
      setSignupOtpSent(true);
      setSignupOtp(otpDigitsFromResponse(res) ?? ["", "", "", "", "", ""]);
      toast.success("OTP sent to +91 " + formData.phone);
    } catch (err) {
      const nextErrors: {
        email?: string;
        dob?: string;
        phone?: string;
        general?: string;
      } = {};
      if (err instanceof ApiError) {
        // Actual API error response: map it to the relevant field when possible.
        const msg = err.message;
        const lower = msg.toLowerCase();
        if (lower.includes("email")) nextErrors.email = msg;
        else if (
          lower.includes("dob") ||
          lower.includes("birth") ||
          lower.includes("age")
        )
          nextErrors.dob = msg;
        else if (lower.includes("phone") || lower.includes("already registered"))
          nextErrors.phone = msg;
        else nextErrors.general = msg;
      } else {
        // Network/timeout -> "Network error"; anything else -> generic message.
        nextErrors.general = getDisplayErrorMessage(err);
      }
      setSignupErrors(nextErrors);
    } finally {
      setSignupSendingOtp(false);
    }
  };

  const handleSignupVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = signupOtp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    const digits = formData.phone.replace(/\D/g, "");
    const mobile = "+91" + digits;
    try {
      const response = await verifyOtp({ mobile, otp: otpCode });
      if (response.data?.access_token) {
        useAuthStore.getState().setAuthFromVerify(mobile, response.data);
        await fetchAndSyncMeProfile();
      }
      setPhoneVerified(true);
      setSignupOtpSent(false);
      setSignupOtp(["", "", "", "", "", ""]);
      setDirection(1);
      setSignupStep(2);
      toast.success("Phone verified!");
    } catch (err) {
      toast.error(getDisplayErrorMessage(err));
    }
  };

  const handleSignupOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...signupOtp];
    next[index] = value.slice(-1);
    setSignupOtp(next);
    if (value && index < 5)
      (
        document.getElementById(`signup-otp-${index + 1}`) as HTMLInputElement
      )?.focus();
  };

  const handleSignupOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !signupOtp[index] && index > 0)
      (
        document.getElementById(`signup-otp-${index - 1}`) as HTMLInputElement
      )?.focus();
  };

  const handleSignupBackFromOtp = () => {
    setSignupOtpSent(false);
    setSignupOtp(["", "", "", "", "", ""]);
  };

  const handleSignupNext = async () => {
    if (signupStep === 0 && !formData.profileFor) {
      toast.error("Please select who this profile is for");
      return;
    }
    if (signupStep === 1) {
      if (!phoneVerified) {
        toast.error("Please verify your phone with OTP first");
        return;
      }
      if (!formData.name?.trim() || !formData.dob || !formData.gender) {
        toast.error("Please fill name, date of birth, and gender");
        return;
      }
      if (!agreeTerms) {
        toast.error("Please agree to Terms & Conditions");
        return;
      }
    }
    if (signupStep === 2) {
      const cid = formData.country_id ? Number(formData.country_id) : 0;
      const sid = formData.state_id ? Number(formData.state_id) : 0;
      const did = formData.district_id ? Number(formData.district_id) : 0;
      const cityId = formData.city_id ? Number(formData.city_id) : 0;
      if (!cid || !sid || !did || !cityId) {
        toast.error("Please select Country, State, District and City");
        return;
      }
      if (!formData.address?.trim()) {
        toast.error("Please enter your address");
        return;
      }
      try {
        await postLocation({
          country_id: cid,
          state_id: sid,
          district_id: did,
          city_id: cityId,
          address: formData.address.trim(),
        });
        useAuthStore.getState().markProfileStepComplete("location");
        toast.success("Location saved");
        setDirection(1);
        setSignupStep(3);
      } catch (err) {
        toast.error(
          getDisplayErrorMessage(err),
        );
      }
      return;
    }
    if (signupStep === 3) {
      const religionId = formData.religion_id
        ? Number(formData.religion_id)
        : 0;
      const casteId = formData.caste_id ? Number(formData.caste_id) : 0;
      const motherTongueId = formData.mother_tongue_id
        ? Number(formData.mother_tongue_id)
        : 0;
      if (!religionId) {
        toast.error("Please select your religion");
        return;
      }
      if (!motherTongueId) {
        toast.error("Please select your mother tongue");
        return;
      }
      const prefType = (formData.partner_preference_type || "open_to_all") as
        | "own_religion_only"
        | "open_to_all"
        | "specific_religions";
      const partnerAgeFrom = formData.partner_age_from.trim()
        ? Number(formData.partner_age_from)
        : null;
      const partnerAgeTo = formData.partner_age_to.trim()
        ? Number(formData.partner_age_to)
        : null;
      if (
        partnerAgeFrom != null &&
        (!Number.isInteger(partnerAgeFrom) ||
          partnerAgeFrom < 18 ||
          partnerAgeFrom > 80)
      ) {
        toast.error("Partner age from must be between 18 and 80");
        return;
      }
      if (
        partnerAgeTo != null &&
        (!Number.isInteger(partnerAgeTo) || partnerAgeTo < 18 || partnerAgeTo > 80)
      ) {
        toast.error("Partner age to must be between 18 and 80");
        return;
      }
      if (
        partnerAgeFrom != null &&
        partnerAgeTo != null &&
        partnerAgeFrom > partnerAgeTo
      ) {
        toast.error("Partner age from cannot be greater than age to");
        return;
      }
      const selectedPartnerReligionIds =
        formData.partner_religion_ids
          ?.split(",")
          .map((v) => Number(v.trim()))
          .filter((n) => Number.isFinite(n) && n > 0) ?? [];
      const rawCastePreferences = parsePartnerCastePreferences(
        formData.partner_caste_preferences,
      );

      let partnerReligionIds: number[] | undefined;
      let partnerCastePreferences: Record<string, number[]> | undefined;

      if (prefType === "specific_religions") {
        if (selectedPartnerReligionIds.length === 0) {
          toast.error("Select at least one partner religion");
          return;
        }
        partnerReligionIds = selectedPartnerReligionIds;
        const selectedSet = new Set(selectedPartnerReligionIds.map(String));
        partnerCastePreferences = Object.fromEntries(
          Object.entries(rawCastePreferences).filter(([key]) =>
            selectedSet.has(String(key)),
          ),
        );
      } else if (prefType === "own_religion_only") {
        // API ignores partner_religion_ids in this mode.
        partnerCastePreferences = Object.fromEntries(
          Object.entries(rawCastePreferences).filter(
            ([key]) => Number(key) === religionId,
          ),
        );
      } else {
        // open_to_all clears partner religion/caste filters.
        partnerReligionIds = [];
        partnerCastePreferences = {};
      }
      try {
        await postReligion({
          religion_id: religionId,
          caste_id: casteId || null,
          mother_tongue_id: motherTongueId,
          partner_preference_type: prefType,
          partner_religion_ids: partnerReligionIds,
          partner_caste_preferences: partnerCastePreferences,
          partner_age_from: partnerAgeFrom,
          partner_age_to: partnerAgeTo,
        });
        useAuthStore.getState().markProfileStepComplete("religion");
        toast.success("Religious details saved");
        setDirection(1);
        setSignupStep(4);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to save religious details",
        );
      }
      return;
    }
    if (signupStep === 4) {
      if (!formData.maritalStatus) {
        toast.error("Please select marital status");
        return;
      }
      if (!formData.height?.trim()) {
        toast.error("Please enter your height");
        return;
      }
      if (!formData.skinTone) {
        toast.error("Please select complexion / color");
        return;
      }

      const maritalStatus = formData.maritalStatus;
      const isStatusWithChildren =
        maritalStatus === "Awaiting Divorce" ||
        maritalStatus === "Divorced" ||
        maritalStatus === "Widowed" ||
        maritalStatus === "Separated";

      const hasChildrenFlag = isStatusWithChildren
        ? hasChildren === "yes"
        : false;

      let numberOfChildren: number | null = null;
      if (hasChildrenFlag) {
        const n = Number(formData.numberOfChildren);
        if (!Number.isFinite(n) || n <= 0) {
          toast.error("Please enter number of children");
          return;
        }
        numberOfChildren = n;
      }

      const heightNumber = Number(formData.height);
      if (!Number.isFinite(heightNumber) || heightNumber <= 0) {
        toast.error("Please enter a valid height");
        return;
      }

      const weightNumber = formData.weight ? Number(formData.weight) : NaN;

      try {
        await postPersonal({
          marital_status: maritalStatus,
          has_children: hasChildrenFlag,
          number_of_children: numberOfChildren,
          height_cm: heightNumber,
          weight_kg: Number.isFinite(weightNumber) ? weightNumber : null,
          complexion: formData.skinTone,
          blood_group: formData.bloodGroup || "",
        });
        useAuthStore.getState().markProfileStepComplete("personal");
        toast.success("Personal details saved");
        setDirection(1);
        setSignupStep(5);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to save personal details",
        );
      }
      return;
    }
    if (signupStep === 5) {
      if (!formData.education) {
        toast.error("Please select highest education");
        return;
      }
      if (!formData.educationSubject) {
        toast.error("Please select subject");
        return;
      }
      if (!formData.employmentStatus) {
        toast.error("Please select employment");
        return;
      }
      if (!formData.occupation?.trim()) {
        toast.error("Please enter occupation");
        return;
      }
      if (!formData.annualIncome) {
        toast.error("Please select annual income");
        return;
      }

      try {
        await postEducation({
          highest_education: formData.education,
          education_subject: formData.educationSubject,
          employment: formData.employmentStatus,
          occupation: formData.occupation.trim(),
          annual_income: formData.annualIncome,
        });
        useAuthStore.getState().markProfileStepComplete("education");
        toast.success("Education details saved");
        setDirection(1);
        setSignupStep(6);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to save education details",
        );
      }
      return;
    }
    if (signupStep === 6) {
      try {
        await postAbout({ about_me: formData.aboutMe || "" });
        useAuthStore.getState().markProfileStepComplete("about");
        toast.success("About me saved");
        setDirection(1);
        setSignupStep(7);
      } catch (err) {
        toast.error(
          getDisplayErrorMessage(err),
        );
      }
      return;
    }
    if (signupStep < SIGNUP_STEPS.length - 1) {
      if (signupStep === 0) {
        const { locked, gender } = getGenderFromProfileFor(formData.profileFor);
        if (locked && gender) {
          setFormData((prev) => ({ ...prev, gender }));
        }
      }
      setDirection(1);
      setSignupStep(signupStep + 1);
    } else {
      if (isCreatingAccount) return;
      setIsCreatingAccount(true);
      let shouldReset = true;
      try {
        const missingRequiredPhotos = REQUIRED_SIGNUP_PHOTO_KEYS.filter(
          (key) => !photos[key]?.file,
        );
        if (missingRequiredPhotos.length > 0) {
          toast.error("Full Photo and Passport Photo are mandatory");
          return;
        }

        const hasAnyPhoto = Object.keys(photos).length > 0;
        if (hasAnyPhoto) {
          await postPhotos({
            // Full photo is the primary profile photo; passport is stored as full_photo.
            profile_photo: photos.full?.file,
            full_photo: photos.passport?.file,
            selfie_photo: photos.selfie?.file,
            family_photo: photos.family?.file,
            aadhaar_front: photos.aadhaar_front?.file,
            aadhaar_back: photos.aadhaar_back?.file,
          });
          toast.success("Photos uploaded successfully");
        }

        const { loginWithProfile, clearProfileIncomplete } =
          useAuthStore.getState();
        loginWithProfile({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          religion: formData.religion || "",
          location:
            [formData.city, formData.state].filter(Boolean).join(", ") ||
            undefined,
        });
        clearProfileIncomplete();
        try {
          sessionStorage.removeItem(SIGNUP_DRAFT_STORAGE_KEY);
        } catch {
          // ignore localStorage errors
        }
        await fetchAndSyncMeProfile();
        toast.success("Account created successfully! 🎉", {
          description: "Welcome to Toqse Matrimony!",
        });
        shouldReset = false;
        router.push("/dashboard");
      } catch (err) {
        toast.error(
          getDisplayErrorMessage(err),
        );
      } finally {
        if (shouldReset) setIsCreatingAccount(false);
      }
    }
  };

  const handleAboutHelpMeWrite = async () => {
    try {
      let suggestions = aboutSuggestions;
      if (!suggestions.length) {
        const res = await getGenerateAbout();
        suggestions =
          res.data.suggestions && res.data.suggestions.length
            ? res.data.suggestions
            : [res.data.about_me];
        setAboutSuggestions(suggestions);
        setAboutSuggestionIndex(0);
      }
      const index = aboutSuggestionIndex % suggestions.length;
      const text = suggestions[index];
      setFormData((prev) => ({ ...prev, aboutMe: text }));
      setAboutSuggestionIndex(index + 1);
      toast.success("Suggestion added. You can edit it.");
    } catch (err) {
      toast.error(
        getDisplayErrorMessage(err),
      );
    }
  };

  const handleAboutSkip = () => {
    setFormData((prev) => ({ ...prev, aboutMe: "" }));
    toast.success("Skipped. You can add this later.");
  };

  const minSignupStep = isProfileResumeFlow ? 2 : 0;

  const handleSignupPrev = () => {
    if (signupStep > minSignupStep) {
      setDirection(-1);
      setSignupStep(signupStep - 1);
    }
  };

  const handleSignupTermsClick = () => {
    try {
      sessionStorage.setItem(
        AUTH_RETURN_STATE_STORAGE_KEY,
        JSON.stringify({
          mode: "signup",
          signupStep,
          agreeTerms,
          phoneVerified,
        }),
      );
    } catch {
      // ignore storage errors
    }
  };

  const canSendSignupOtp =
    !!formData.name?.trim() &&
    formData.phone.replace(/\D/g, "").length === 10 &&
    !!formData.dob?.trim() &&
    !!formData.gender?.trim() &&
    agreeTerms;
  const hasRequiredSignupPhotos = REQUIRED_SIGNUP_PHOTO_KEYS.every(
    (key) => !!photos[key]?.file,
  );

  const renderStep = () => {
    const props = { formData, onChange: handleChange };
    switch (signupStep) {
      case 0:
        return (
          <ProfileForStep
            profileFor={formData.profileFor}
            onChange={(v) =>
              setFormData((prev) => ({ ...prev, profileFor: v }))
            }
          />
        );
      case 1:
        return (
          <BasicInfoStep
            {...props}
            profileFor={formData.profileFor}
            agreeTerms={agreeTerms}
            setAgreeTerms={setAgreeTerms}
            otpSent={signupOtpSent}
            otp={signupOtp}
            onSendOtp={handleSignupSendOtp}
            onVerifyOtp={handleSignupVerifyOtp}
            onOtpChange={handleSignupOtpChange}
            onOtpKeyDown={handleSignupOtpKeyDown}
            onBackFromOtp={handleSignupBackFromOtp}
            onResendOtp={handleSignupResendOtp}
            resendOtpLoading={resendOtpLoading}
            phoneVerified={phoneVerified}
            canSendOtp={canSendSignupOtp}
            sendingOtp={signupSendingOtp}
            fieldErrors={signupErrors}
            onTermsClick={handleSignupTermsClick}
          />
        );
      case 2:
        return <LocationStep {...props} />;
      case 3:
        return (
          <ReligiousStep
            {...props}
            interCaste={false}
            setInterCaste={() => {}}
          />
        );
      case 4:
        return (
          <PersonalStep
            {...props}
            hasChildren={hasChildren}
            setHasChildren={setHasChildren}
          />
        );
      case 5:
        return <EducationStep {...props} />;
      case 6:
        return (
          <AboutMeStep
            {...props}
            onHelpMeWrite={handleAboutHelpMeWrite}
            onSkip={handleAboutSkip}
          />
        );
      case 7:
        return <PhotosStep photos={photos} setPhotos={setPhotos} />;
      default:
        return null;
    }
  };

  const canShowContinue = signupStep !== 1 || phoneVerified;

  // ---- LOGIN VIEW ----
  if (mode === "login") {
    return (
      <div className="h-screen min-h-0 flex relative overflow-hidden">
        {/* Left side - Couple Image */}
        <div className="hidden lg:flex w-1/2 relative min-h-0">
          <img
            src="/images/login.jpg"
            alt="Happy Indian wedding couple"
            className="w-full h-full object-cover object-[center_40%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[hsl(340,60%,93%)/0.3]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <h2 className="font-serif text-3xl font-bold mb-2 drop-shadow-lg">
              Find Your Soulmate
            </h2>
            <p className="text-white/90 text-sm drop-shadow-md">
              39 Years of Trust & Tradition — Join millions of happy couples
            </p>
          </div>
        </div>

        {/* Right side - Login Form with ring background */}
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/images/ring.jpg"
              alt=""
              className="w-full h-full object-cover object-center"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-primary/25" />
          </div>
          <div className="absolute top-10 left-10 w-48 h-48 bg-rose-300/40 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-amber-300/35 rounded-full blur-3xl animate-float-delayed" />

          <div className="flex-1 min-h-0 overflow-hidden flex items-start justify-center pt-0 pb-6 px-3 sm:px-4 relative z-10">
            <div className="w-full max-w-xl min-w-0">
              <div className="flex justify-center mb-0">
                <img
                  src="/images/WhatsApp_Image_2026-03-04_at_10.28.26_AM-removebg-preview.png"
                  alt="AVB - 39 Years of Trust & Tradition"
                  className="h-36 sm:h-44 md:h-52 w-auto object-contain"
                />
              </div>
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors mb-1 sm:mb-2 group"
              >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform shrink-0" />
                <span className="font-medium text-lg">Back to Home</span>
              </button>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-elevated p-5 sm:p-8 md:p-10 border border-primary/5"
              >
                <div className="text-center mb-6 sm:mb-10">
                  <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
                    <div className="relative">
                      <Heart className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary fill-primary animate-heart-beat" />
                      <Sparkles className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-6 sm:h-6 text-secondary animate-sparkle" />
                    </div>
                    <span className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-primary">
                      Toqse <span className="text-secondary">Matrimony</span>
                    </span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
                    Welcome Back
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Sign in to continue your journey
                  </p>
                </div>

                {!otpSent ? (
                  <>
                    <form onSubmit={handleSendOtp} className="space-y-6">
                      <div className="relative flex items-center border-2 border-primary/10 rounded-2xl bg-white focus-within:border-primary transition-colors">
                        <Phone className="absolute left-6 w-7 h-7 text-primary/50" />
                        <span className="pl-16 pr-2 text-lg text-foreground">
                          +91
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Phone Number"
                          minLength={10}
                          maxLength={10}
                          inputMode="numeric"
                          pattern="[0-9]{10}"
                          className="flex-1 px-3 py-5 text-lg rounded-r-2xl focus:ring-0 border-0 bg-transparent"
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="hero"
                        size="xl"
                        className="w-full gap-2 text-lg py-7"
                      >
                        Send OTP <ArrowRight className="w-6 h-6" />
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-lg mb-4 text-center">
                      Enter the 6-digit OTP sent to{" "}
                      <span className="font-medium text-foreground">
                        +91 {formData.phone}
                      </span>
                    </p>
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                      <div className="flex justify-center gap-2 sm:gap-3">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                              handleOtpChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-14 h-16 sm:w-16 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white transition-colors"
                          />
                        ))}
                      </div>
                      <p className="text-center text-base text-foreground -mt-2">
                        <span className="text-muted-foreground">
                          Didn&apos;t receive the code?{" "}
                        </span>
                        <button
                          type="button"
                          onClick={handleLoginResendOtp}
                          disabled={resendOtpLoading}
                          className="font-semibold text-primary underline underline-offset-2 hover:text-primary/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                        >
                          {resendOtpLoading ? "Sending…" : "Resend OTP"}
                        </button>
                      </p>
                      <Button
                        type="submit"
                        variant="hero"
                        size="lg"
                        className="w-full gap-2 text-lg py-7"
                      >
                        Verify & Continue <ArrowRight className="w-6 h-6" />
                      </Button>
                      <button
                        type="button"
                        onClick={handleBackToPhone}
                        className="w-full text-center text-lg text-muted-foreground hover:text-primary transition-colors"
                      >
                        Change number
                      </button>
                    </form>
                  </>
                )}

                {!otpSent && (
                  <>
                    <div className="my-6 sm:my-8 flex items-center gap-4">
                      <div className="flex-1 border-t border-primary/10" />
                      <span className="text-lg text-muted-foreground">OR</span>
                      <div className="flex-1 border-t border-primary/10" />
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-lg">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setMode("signup");
                            setIsProfileResumeFlow(false);
                            setSignupStep(0);
                            setPhoneVerified(false);
                            setSignupOtpSent(false);
                            setSignupOtp(["", "", "", "", "", ""]);
                          }}
                          className="text-primary font-bold hover:text-primary-dark transition-colors"
                        >
                          Register free
                        </button>
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- SIGNUP VIEW ----
  return (
    <div className="h-screen min-h-0 flex overflow-hidden">
      {/* Left side - Wedding image (desktop) */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-2/5 relative min-h-0 shrink-0">
        <img
          src="/images/image2.jpg"
          alt="Wedding couple"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Right side - Signup form with background image */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden py-4 sm:py-6 md:py-8 px-3 sm:px-4">
        <div className="absolute inset-0">
          <img
            src="/images/image2.jpg"
            alt=""
            className="w-full h-full object-cover object-center"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/75 to-primary/20" />
        </div>
        <div className="absolute top-10 left-10 w-48 h-48 bg-secondary/25 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-float-delayed" />

        <div className="w-full max-w-4xl relative z-10 min-w-0">
          <div className="flex justify-center mb-0">
            <img
              src="/images/WhatsApp_Image_2026-03-04_at_10.28.26_AM-removebg-preview.png"
              alt="AVB - 39 Years of Trust & Tradition"
              className="h-28 sm:h-36 md:h-40 w-auto object-contain"
            />
          </div>
          {signupStep === 0 ? (
            <button
              onClick={() => setMode("login")}
              className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors mb-1 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Sign In</span>
            </button>
          ) : signupStep > minSignupStep ? (
            <button
              onClick={handleSignupPrev}
              className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors mb-1 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Previous Step</span>
            </button>
          ) : (
            <div className="mb-1" />
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-elevated p-4 sm:p-6 md:p-8 border border-primary/5"
          >
            <SignupStepIndicator currentStep={signupStep} />

            <div className="min-h-[320px] sm:min-h-[380px] max-h-[50vh] sm:max-h-[55vh] overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={signupStep}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 space-y-3">
              {canShowContinue && (
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleSignupNext}
                  disabled={
                    (signupStep === SIGNUP_STEPS.length - 1 &&
                      isCreatingAccount) ||
                    (signupStep === SIGNUP_STEPS.length - 1 &&
                      !hasRequiredSignupPhotos)
                  }
                >
                  {signupStep === SIGNUP_STEPS.length - 1 ? (
                    isCreatingAccount ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              )}
              {signupStep > minSignupStep && (
                <button
                  onClick={handleSignupPrev}
                  className="w-full text-center text-foreground font-medium hover:text-primary transition-colors py-2"
                >
                  Previous
                </button>
              )}
            </div>

            {signupStep === 0 && (
              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-primary font-bold hover:text-primary-dark transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
