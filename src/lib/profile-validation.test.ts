import { describe, expect, it } from "vitest";
import { EMPTY_FAMILY_FIELDS } from "@/components/profile/FamilyDetailsSection";
import { EMPTY_PARTNER_PREFERENCE_FIELDS } from "@/components/profile/PartnerPreferenceSection";
import {
  validateProfileForm,
  type ProfileValidationForm,
} from "@/lib/profile-validation";

function validForm(overrides: Partial<ProfileValidationForm> = {}): ProfileValidationForm {
  return {
    ...EMPTY_FAMILY_FIELDS,
    ...EMPTY_PARTNER_PREFERENCE_FIELDS,
    partnerPreferenceType: "open_to_all",
    fullName: "Test User",
    dob: "2000-01-15",
    gender: "Male",
    religionId: "1",
    maritalStatus: "Never Married",
    reasonForDivorce: "",
    height: "170",
    highestEducationId: "1",
    employmentStatus: "Employed",
    hasHoroscope: false,
    timeOfBirth: "",
    placeOfBirth: "",
    ...overrides,
  };
}

describe("validateProfileForm photos", () => {
  it("does not require photos by default", () => {
    expect(validateProfileForm(validForm())).toEqual({});
  });

  it("requires profile_photo and full_photo on create", () => {
    const errs = validateProfileForm(validForm(), { requirePhotos: true });
    expect(errs.profile_photo).toBe("Profile Photo is required.");
    expect(errs.full_photo).toBe("Full Photo is required.");
  });

  it("accepts new File uploads for required photos", () => {
    const errs = validateProfileForm(
      validForm({
        profile_photo: new File(["x"], "profile.jpg", { type: "image/jpeg" }),
        full_photo: new File(["y"], "full.jpg", { type: "image/jpeg" }),
      }),
      { requirePhotos: true },
    );
    expect(errs.profile_photo).toBeUndefined();
    expect(errs.full_photo).toBeUndefined();
  });

  it("accepts existing URLs on edit instead of a new file", () => {
    const errs = validateProfileForm(
      validForm({
        existingPhotos: {
          profile_photo: "https://cdn.example/profile.jpg",
          full_photo: "https://cdn.example/full.jpg",
        },
      }),
      { requirePhotos: true },
    );
    expect(errs).toEqual({});
  });

  it("still requires a missing photo on edit when no existing URL", () => {
    const errs = validateProfileForm(
      validForm({
        existingPhotos: {
          profile_photo: "https://cdn.example/profile.jpg",
        },
      }),
      { requirePhotos: true },
    );
    expect(errs.profile_photo).toBeUndefined();
    expect(errs.full_photo).toBe("Full Photo is required.");
  });
});
