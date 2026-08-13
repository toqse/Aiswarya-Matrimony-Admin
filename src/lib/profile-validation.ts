import type { FamilyFormFields } from "@/components/profile/FamilyDetailsSection";
import type { PartnerPreferenceFields } from "@/components/profile/PartnerPreferenceSection";
import type { ProfileFieldErrors } from "@/components/profile/ProfileFormField";

export interface ProfileValidationForm
  extends FamilyFormFields,
    PartnerPreferenceFields {
  profileFor?: string;
  fullName: string;
  mobile?: string;
  dob: string;
  gender: string;
  religionId: string;
  maritalStatus: string;
  reasonForDivorce: string;
  height: string;
  highestEducationId: string;
  employmentStatus: string;
  hasHoroscope: boolean;
  timeOfBirth: string;
  placeOfBirth: string;
}

export interface ProfileValidationOptions {
  requireProfileFor?: boolean;
  requireMobile?: boolean;
}

export function validateFamilyFieldErrors(values: FamilyFormFields): ProfileFieldErrors {
  const errs: ProfileFieldErrors = {};

  if (values.aboutFamily.length > 500) {
    errs.aboutFamily = "About My Family must be 500 characters or fewer.";
  }
  if (values.familyContact && values.familyContact.length !== 10) {
    errs.familyContact = "Family Contact Number must be a 10-digit mobile number.";
  }
  if (values.familyContact2 && values.familyContact2.length !== 10) {
    errs.familyContact2 = "Family Contact Number 2 must be a 10-digit mobile number.";
  }

  const countOrNull = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const brothers = countOrNull(values.brothersCount);
  const marriedBrothers = countOrNull(values.marriedBrothersCount);
  const sisters = countOrNull(values.sistersCount);
  const marriedSisters = countOrNull(values.marriedSistersCount);

  if (brothers != null && marriedBrothers != null && marriedBrothers > brothers) {
    errs.marriedBrothersCount = "Married brothers cannot exceed total brothers.";
  }
  if (sisters != null && marriedSisters != null && marriedSisters > sisters) {
    errs.marriedSistersCount = "Married sisters cannot exceed total sisters.";
  }

  return errs;
}

export function validatePartnerFieldErrors(
  values: PartnerPreferenceFields,
  religionId: string,
): ProfileFieldErrors {
  const errs: ProfileFieldErrors = {};

  if (
    values.partnerPreferenceType === "specific_religions" &&
    values.partnerReligionIds.length === 0
  ) {
    errs.partnerReligionIds = "Select at least one partner religion.";
  }

  const ageFrom = values.partnerAgeFrom.trim()
    ? Number(values.partnerAgeFrom)
    : null;
  const ageTo = values.partnerAgeTo.trim() ? Number(values.partnerAgeTo) : null;

  if (ageFrom != null && (!Number.isInteger(ageFrom) || ageFrom < 18 || ageFrom > 80)) {
    errs.partnerAgeFrom = "Partner age from must be between 18 and 80.";
  }
  if (ageTo != null && (!Number.isInteger(ageTo) || ageTo < 18 || ageTo > 80)) {
    errs.partnerAgeTo = "Partner age to must be between 18 and 80.";
  }
  if (ageFrom != null && ageTo != null && ageFrom > ageTo) {
    errs.partnerAgeTo = "Partner age to cannot be less than age from.";
  }

  if (values.partnerPreferenceType === "own_religion_only" && !religionId) {
    errs.partnerPreferenceType = "Select a religion before setting partner preference.";
  }

  return errs;
}

export function validateProfileForm(
  form: ProfileValidationForm,
  options: ProfileValidationOptions = {},
): ProfileFieldErrors {
  const { requireProfileFor = false, requireMobile = false } = options;
  const errs: ProfileFieldErrors = {};

  if (requireProfileFor && !form.profileFor) {
    errs.profileFor = "Select who this profile is for.";
  }
  if (!form.fullName.trim()) {
    errs.fullName = "Full name is required.";
  }
  if (requireMobile) {
    if (!form.mobile || form.mobile.length !== 10) {
      errs.mobile = "Enter a valid 10-digit mobile number.";
    }
  }
  if (!form.dob) {
    errs.dob = "Date of birth is required.";
  }
  if (!form.gender) {
    errs.gender = "Gender is required.";
  }
  if (!form.religionId) {
    errs.religionId = "Religion is required.";
  }
  if (!form.maritalStatus) {
    errs.maritalStatus = "Marital status is required.";
  }
  if (form.maritalStatus === "Divorced" && !form.reasonForDivorce.trim()) {
    errs.reasonForDivorce = "Reason for divorce is required when marital status is Divorced.";
  }
  if (!form.height.trim()) {
    errs.height = "Height is required.";
  }
  if (!form.highestEducationId) {
    errs.highestEducationId = "Highest education is required.";
  }
  if (!form.employmentStatus) {
    errs.employmentStatus = "Employment status is required.";
  }

  if (form.hasHoroscope) {
    if (!form.dob) {
      errs.dob = "Date of birth is required for horoscope.";
    }
    if (!form.timeOfBirth) {
      errs.timeOfBirth = "Time of birth is required.";
    }
    if (!form.placeOfBirth.trim()) {
      errs.placeOfBirth = "Place of birth is required.";
    }
  }

  Object.assign(errs, validateFamilyFieldErrors(form));
  Object.assign(errs, validatePartnerFieldErrors(form, form.religionId));

  return errs;
}

export function firstErrorField(errors: ProfileFieldErrors): string | undefined {
  return Object.keys(errors)[0];
}
