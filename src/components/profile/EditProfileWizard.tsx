import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import PlacesAutocomplete from "@/components/profile/PlacesAutocomplete";
import { TimeOfBirthPicker } from "@/components/profile/TimeOfBirthPicker";
import FormSectionCard from "@/components/profile/FormSectionCard";
import FamilyDetailsSection, {
  EMPTY_FAMILY_FIELDS,
  type FamilyFormFields,
} from "@/components/profile/FamilyDetailsSection";
import PartnerPreferenceSection, {
  EMPTY_PARTNER_PREFERENCE_FIELDS,
  type PartnerPreferenceFields,
} from "@/components/profile/PartnerPreferenceSection";
import ProfileFormField, {
  fieldError,
  invalidInputClass,
  invalidSelectClass,
  type ProfileFieldErrors,
} from "@/components/profile/ProfileFormField";
import { ADMIN_PROFILE_FOR_OPTIONS } from "@/lib/profile-for-options";
import { filterValidComplexions, isValidComplexionName, normalizeComplexionOption } from "@/lib/complexion-options";
import OccupationCombobox from "@/components/profile/OccupationCombobox";
import LocationMasterCombobox from "@/components/profile/LocationMasterCombobox";
import type { WizardFormValues } from "@/lib/admin-api/profile-registration";
import { firstErrorField, validateProfileForm } from "@/lib/profile-validation";
import {
  dobInputMax,
  dobInputMin,
  PROFILE_AGE_HINT,
} from "@/lib/profileAge";
import {
  fetchCastes,
  fetchCities,
  fetchComplexions,
  fetchEducations,
  fetchEducationSubjects,
  fetchEmploymentStatuses,
  fetchIncomeRanges,
  fetchMaritalStatuses,
  fetchPublicMotherTongues,
  fetchReligions,
} from "@/lib/admin-api/master";

const profileForOptions = ADMIN_PROFILE_FOR_OPTIONS;

const CHILDREN_MARITAL = ["Divorced", "Widowed", "Awaiting Divorce", "Separated"];

type PhotoKey =
  | "full_photo"
  | "passport_photo"
  | "profile_photo"
  | "selfie_photo"
  | "family_photo"
  | "aadhaar_front"
  | "aadhaar_back";

const PHOTO_FIELDS: { key: PhotoKey; label: string; fullWidth?: boolean }[] = [
  { key: "full_photo", label: "Full Photo" },
  { key: "passport_photo", label: "Passport Photo" },
  { key: "profile_photo", label: "Profile Photo" },
  { key: "selfie_photo", label: "Selfie Photo" },
  { key: "family_photo", label: "Family Photo" },
  { key: "aadhaar_front", label: "Aadhaar Front" },
  { key: "aadhaar_back", label: "Aadhaar Back", fullWidth: true },
];

function PhotoField({
  label,
  file,
  existingUrl,
  onSelect,
}: {
  label: string;
  file: File | null;
  existingUrl?: string | null;
  onSelect: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  const shownUrl = preview ?? existingUrl ?? null;

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex items-start gap-3">
        {shownUrl ? (
          <a href={shownUrl} target="_blank" rel="noreferrer" className="shrink-0">
            <img
              src={shownUrl}
              alt={label}
              className="h-20 w-20 rounded-md border object-cover"
            />
          </a>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-dashed text-center text-[10px] text-muted-foreground">
            No image
          </div>
        )}
        <div className="flex-1">
          <Input type="file" accept="image/*" onChange={(e) => onSelect(e.target.files?.[0] ?? null)} />
          <p className="mt-1 text-xs text-muted-foreground">
            {preview ? "New image selected" : existingUrl ? "Current image" : "No image uploaded"}
          </p>
        </div>
      </div>
    </div>
  );
}

function emptyForm(): WizardFormValues {
  return {
    profileFor: "Myself",
    fullName: "",
    mobile: "",
    email: "",
    dob: "",
    gender: "",
    hasHoroscope: false,
    timeOfBirth: "",
    placeOfBirth: "",
    birthLatitude: "",
    birthLongitude: "",
    birthTimezone: "",
    countryId: "",
    stateId: "",
    districtId: "",
    countryName: "",
    stateName: "",
    districtName: "",
    cityId: "",
    address: "",
    religionId: "",
    casteId: "",
    motherTongueId: "",
    maritalStatus: "",
    reasonForDivorce: "",
    ...EMPTY_PARTNER_PREFERENCE_FIELDS,
    hasChildren: false,
    numberOfMarriages: "",
    numberOfChildren: "",
    height: "",
    weight: "",
    complexion: "",
    annualIncomeId: "",
    highestEducationId: "",
    educationSubjectId: "",
    employmentStatus: "",
    occupationId: "",
    occupationName: "",
    aboutMe: "",
    full_photo: null,
    passport_photo: null,
    profile_photo: null,
    selfie_photo: null,
    family_photo: null,
    aadhaar_front: null,
    aadhaar_back: null,
    existingPhotos: {},
    ...EMPTY_FAMILY_FIELDS,
  };
}

interface EditProfileWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: WizardFormValues | null;
  onComplete: (form: WizardFormValues) => void;
  submitting?: boolean;
}

export default function EditProfileWizard({
  open,
  onOpenChange,
  initial,
  onComplete,
  submitting = false,
}: EditProfileWizardProps) {
  const [horoExpanded, setHoroExpanded] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [scrollToField, setScrollToField] = useState<string | null>(null);
  const [form, setForm] = useState<WizardFormValues>(emptyForm());

  // Load the mapped detail into the form whenever a new profile is opened.
  useEffect(() => {
    if (open && initial) {
      setForm({
        ...initial,
        complexion: normalizeComplexionOption(initial.complexion),
      });
      setFieldErrors({});
      setScrollToField(null);
      setHoroExpanded(true);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!scrollToField) return;
    const el = document.getElementById(`profile-field-${scrollToField}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setScrollToField(null);
  }, [scrollToField, fieldErrors]);

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const update = <K extends keyof WizardFormValues>(field: K, value: WizardFormValues[K]) => {
    clearFieldError(String(field));
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePartnerPreference = <K extends keyof PartnerPreferenceFields>(
    field: K,
    value: PartnerPreferenceFields[K],
  ) => {
    clearFieldError(String(field));
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const batchPartnerPreference = (updates: Partial<PartnerPreferenceFields>) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(updates)) delete next[key];
      return next;
    });
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const religionsQ = useQuery({
    queryKey: ["master", "religions", "edit-form"],
    queryFn: () => fetchReligions({ page_size: 200 }),
    enabled: open,
  });
  const castesQ = useQuery({
    queryKey: ["master", "castes", "edit-form", form.religionId],
    queryFn: () => fetchCastes({ religion_id: Number(form.religionId), page_size: 500 }),
    enabled: open && !!form.religionId,
  });
  const motherTonguesQ = useQuery({
    queryKey: ["master", "mother-tongues", "edit-form"],
    queryFn: () => fetchPublicMotherTongues({ page_size: 500 }),
    enabled: open,
  });
  const citiesQ = useQuery({
    queryKey: ["master", "cities", "edit-form", form.districtId],
    queryFn: () => fetchCities({ district_id: Number(form.districtId), page_size: 500 }),
    enabled: open && !!form.districtId,
  });
  const educationsQ = useQuery({
    queryKey: ["master", "educations", "edit-form"],
    queryFn: () => fetchEducations({ page_size: 500 }),
    enabled: open,
  });
  const subjectsQ = useQuery({
    queryKey: ["master", "education-subjects", "edit-form", form.highestEducationId],
    queryFn: () => fetchEducationSubjects({ education_id: Number(form.highestEducationId), page_size: 500 }),
    enabled: open && !!form.highestEducationId,
  });
  const employmentQ = useQuery({
    queryKey: ["master", "employment-statuses", "edit-form"],
    queryFn: () => fetchEmploymentStatuses({ page_size: 200 }),
    enabled: open,
  });
  const incomeQ = useQuery({
    queryKey: ["master", "income-ranges", "edit-form"],
    queryFn: () => fetchIncomeRanges({ page_size: 200 }),
    enabled: open,
  });
  const maritalStatusesQ = useQuery({
    queryKey: ["master", "marital-statuses", "edit-form"],
    queryFn: () => fetchMaritalStatuses({ page_size: 200 }),
    enabled: open,
  });
  const complexionsQ = useQuery({
    queryKey: ["master", "complexions", "edit-form"],
    queryFn: () => fetchComplexions({ page_size: 200 }),
    enabled: open,
  });

  const activeReligionName =
    (religionsQ.data?.results ?? []).find((r) => String(r.id) === form.religionId)?.name ?? "";

  const updateFamily = <K extends keyof FamilyFormFields>(field: K, value: FamilyFormFields[K]) => {
    clearFieldError(String(field));
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = () => {
    const errs = validateProfileForm(form, {
      requireProfileFor: false,
      requireMobile: false,
    });
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (form.hasHoroscope && (errs.timeOfBirth || errs.placeOfBirth || errs.dob)) {
        setHoroExpanded(true);
      }
      const first = firstErrorField(errs);
      if (first) {
        setScrollToField(first);
      }
      return;
    }
    onComplete(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label>Profile For</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {profileForOptions.map((opt) => (
                <Button
                  key={opt}
                  type="button"
                  variant={form.profileFor === opt ? "default" : "outline"}
                  onClick={() => update("profileFor", opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProfileFormField
              label="Full Name"
              required
              error={fieldError(fieldErrors, "fullName")}
            >
              <Input
                id="profile-field-fullName"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className={invalidInputClass(fieldError(fieldErrors, "fullName"))}
                aria-invalid={Boolean(fieldError(fieldErrors, "fullName"))}
              />
            </ProfileFormField>
            <ProfileFormField label="Mobile">
              <Input value={form.mobile} readOnly disabled />
            </ProfileFormField>
            <ProfileFormField label="Email">
              <Input value={form.email} onChange={(e) => update("email", e.target.value)} />
            </ProfileFormField>
            <ProfileFormField
              label="Date of Birth"
              required
              error={fieldError(fieldErrors, "dob")}
            >
              <Input
                id="profile-field-dob"
                type="date"
                min={dobInputMin()}
                max={dobInputMax()}
                value={form.dob}
                onChange={(e) => update("dob", e.target.value)}
                className={invalidInputClass(fieldError(fieldErrors, "dob"))}
                aria-invalid={Boolean(fieldError(fieldErrors, "dob"))}
              />
              <p className="text-xs text-muted-foreground">{PROFILE_AGE_HINT}</p>
              <label className="mt-2 flex items-center gap-2 text-sm cursor-pointer select-none">
                <Checkbox
                  checked={form.hasHoroscope}
                  onCheckedChange={(v) => update("hasHoroscope", !!v)}
                />
                <span>Has horoscope details</span>
              </label>
            </ProfileFormField>
            <ProfileFormField
              label="Gender"
              required
              error={fieldError(fieldErrors, "gender")}
            >
              <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger
                  id="profile-field-gender"
                  className={invalidSelectClass(fieldError(fieldErrors, "gender"))}
                  aria-invalid={Boolean(fieldError(fieldErrors, "gender"))}
                >
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </ProfileFormField>
            <div>
              <Label>Country</Label>
              <LocationMasterCombobox
                kind="country"
                value={form.countryId}
                initialLabel={form.countryName}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    countryId: v,
                    stateId: "",
                    districtId: "",
                    cityId: "",
                    stateName: "",
                    districtName: "",
                  }))
                }
              />
            </div>
            <div>
              <Label>State</Label>
              <LocationMasterCombobox
                kind="state"
                value={form.stateId}
                parentId={form.countryId ? Number(form.countryId) : undefined}
                initialLabel={form.stateName}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    stateId: v,
                    districtId: "",
                    cityId: "",
                    districtName: "",
                  }))
                }
                disabled={!form.countryId}
              />
            </div>
            <div>
              <Label>District</Label>
              <LocationMasterCombobox
                kind="district"
                value={form.districtId}
                parentId={form.stateId ? Number(form.stateId) : undefined}
                initialLabel={form.districtName}
                onValueChange={(v) => setForm((p) => ({ ...p, districtId: v, cityId: "" }))}
                disabled={!form.stateId}
              />
            </div>
            <div>
              <Label>City</Label>
              <Select
                value={form.cityId}
                onValueChange={(v) => update("cityId", v)}
                disabled={!form.districtId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={form.districtId ? "Select city" : "Select district first"} />
                </SelectTrigger>
                <SelectContent>
                  {(citiesQ.data?.results ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
            </div>
            <ProfileFormField label="Religion" required error={fieldError(fieldErrors, "religionId")}>
              <Select
                value={form.religionId}
                onValueChange={(v) => {
                  clearFieldError("religionId");
                  clearFieldError("partnerPreferenceType");
                  setForm((p) => ({
                    ...p,
                    religionId: v,
                    casteId: "",
                    partnerReligionIds:
                      p.partnerPreferenceType === "specific_religions" ? [] : p.partnerReligionIds,
                    partnerCastePreferences: {},
                  }));
                }}
              >
                <SelectTrigger
                  id="profile-field-religionId"
                  className={invalidSelectClass(fieldError(fieldErrors, "religionId"))}
                  aria-invalid={Boolean(fieldError(fieldErrors, "religionId"))}
                >
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent>
                  {(religionsQ.data?.results ?? []).map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ProfileFormField>
            <div>
              <Label>Caste</Label>
              <Select value={form.casteId} onValueChange={(v) => update("casteId", v)} disabled={!form.religionId}>
                <SelectTrigger>
                  <SelectValue placeholder={form.religionId ? "Select caste" : "Select religion first"} />
                </SelectTrigger>
                <SelectContent>
                  {(castesQ.data?.results ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mother Tongue</Label>
              <Select value={form.motherTongueId} onValueChange={(v) => update("motherTongueId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mother tongue" />
                </SelectTrigger>
                <SelectContent>
                  {(motherTonguesQ.data?.results ?? []).map((mt) => (
                    <SelectItem key={mt.id} value={String(mt.id)}>
                      {mt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <FormSectionCard title="Personal Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProfileFormField
              label="Marital Status"
              required
              error={fieldError(fieldErrors, "maritalStatus")}
            >
              <Select
                value={form.maritalStatus}
                onValueChange={(v) => {
                  clearFieldError("maritalStatus");
                  clearFieldError("reasonForDivorce");
                  setForm((prev) => ({
                    ...prev,
                    maritalStatus: v,
                    reasonForDivorce:
                      v === "Divorced" ? prev.reasonForDivorce : "",
                  }));
                }}
              >
                <SelectTrigger
                  id="profile-field-maritalStatus"
                  className={invalidSelectClass(fieldError(fieldErrors, "maritalStatus"))}
                  aria-invalid={Boolean(fieldError(fieldErrors, "maritalStatus"))}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {(maritalStatusesQ.data?.results ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ProfileFormField>
            {form.maritalStatus === "Divorced" && (
              <ProfileFormField
                label="Reason for Divorce"
                required
                className="sm:col-span-2"
                error={fieldError(fieldErrors, "reasonForDivorce")}
              >
                <Input
                  id="profile-field-reasonForDivorce"
                  value={form.reasonForDivorce}
                  onChange={(e) => update("reasonForDivorce", e.target.value)}
                  placeholder="e.g. Mutual consent"
                  className={invalidInputClass(fieldError(fieldErrors, "reasonForDivorce"))}
                  aria-invalid={Boolean(fieldError(fieldErrors, "reasonForDivorce"))}
                />
              </ProfileFormField>
            )}
            {CHILDREN_MARITAL.includes(form.maritalStatus) && (
              <div className="sm:col-span-2 border rounded-md p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Checkbox checked={form.hasChildren} onCheckedChange={(v) => update("hasChildren", !!v)} />
                  <span className="text-sm">Has Children</span>
                </div>
                {form.hasChildren && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>No. of Children</Label>
                      <Input
                        value={form.numberOfChildren}
                        onChange={(e) => update("numberOfChildren", e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            <ProfileFormField
              label="Height (cm)"
              required
              error={fieldError(fieldErrors, "height")}
            >
              <Input
                id="profile-field-height"
                value={form.height}
                onChange={(e) => update("height", e.target.value)}
                className={invalidInputClass(fieldError(fieldErrors, "height"))}
                aria-invalid={Boolean(fieldError(fieldErrors, "height"))}
              />
            </ProfileFormField>
            <div>
              <Label>Weight (kg)</Label>
              <Input value={form.weight} onChange={(e) => update("weight", e.target.value)} />
            </div>
            <div>
              <Label>Complexion</Label>
              <Select
                value={isValidComplexionName(form.complexion) ? form.complexion : undefined}
                onValueChange={(v) => update("complexion", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select complexion" />
                </SelectTrigger>
                <SelectContent>
                  {filterValidComplexions(complexionsQ.data?.results ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Annual Income</Label>
              <Select value={form.annualIncomeId} onValueChange={(v) => update("annualIncomeId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select annual income" />
                </SelectTrigger>
                <SelectContent>
                  {(incomeQ.data?.results ?? []).map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ProfileFormField
              label="Highest Education"
              required
              error={fieldError(fieldErrors, "highestEducationId")}
            >
              <Select
                value={form.highestEducationId}
                onValueChange={(v) => {
                  clearFieldError("highestEducationId");
                  setForm((p) => ({ ...p, highestEducationId: v, educationSubjectId: "" }));
                }}
              >
                <SelectTrigger
                  id="profile-field-highestEducationId"
                  className={invalidSelectClass(fieldError(fieldErrors, "highestEducationId"))}
                  aria-invalid={Boolean(fieldError(fieldErrors, "highestEducationId"))}
                >
                  <SelectValue placeholder="Select highest education" />
                </SelectTrigger>
                <SelectContent>
                  {(educationsQ.data?.results ?? []).map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ProfileFormField>
            <div>
              <Label>Education Subject</Label>
              <Select
                value={form.educationSubjectId}
                onValueChange={(v) => update("educationSubjectId", v)}
                disabled={!form.highestEducationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={form.highestEducationId ? "Select subject" : "Select education first"} />
                </SelectTrigger>
                <SelectContent>
                  {(subjectsQ.data?.results ?? []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ProfileFormField
              label="Employment Status"
              required
              error={fieldError(fieldErrors, "employmentStatus")}
            >
              <Select value={form.employmentStatus} onValueChange={(v) => update("employmentStatus", v)}>
                <SelectTrigger
                  id="profile-field-employmentStatus"
                  className={invalidSelectClass(fieldError(fieldErrors, "employmentStatus"))}
                  aria-invalid={Boolean(fieldError(fieldErrors, "employmentStatus"))}
                >
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  {(employmentQ.data?.results ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ProfileFormField>
            <div>
              <Label>Occupation</Label>
              <OccupationCombobox
                value={form.occupationId}
                onValueChange={(v) => update("occupationId", v)}
                initialLabel={form.occupationName}
              />
            </div>
            </div>
          </FormSectionCard>

          <FamilyDetailsSection values={form} onChange={updateFamily} errors={fieldErrors} />

          <PartnerPreferenceSection
            religionId={form.religionId}
            casteId={form.casteId}
            religionName={activeReligionName}
            religions={religionsQ.data?.results ?? []}
            values={form}
            onChange={updatePartnerPreference}
            onBatchChange={batchPartnerPreference}
            errors={fieldErrors}
          />

          {form.hasHoroscope && (
            <Collapsible
              open={horoExpanded}
              onOpenChange={setHoroExpanded}
              className="rounded-lg border border-border bg-muted/30"
            >
              <CollapsibleTrigger asChild>
                <button type="button" className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Horoscope Information
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      horoExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border p-4">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Horoscope Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProfileFormField
                      label="Time of Birth"
                      required
                      error={fieldError(fieldErrors, "timeOfBirth")}
                    >
                      <TimeOfBirthPicker
                        value={form.timeOfBirth}
                        onChange={(v) => update("timeOfBirth", v)}
                      />
                    </ProfileFormField>
                    <ProfileFormField
                      label="Place of Birth"
                      required
                      className="sm:col-span-2"
                      error={fieldError(fieldErrors, "placeOfBirth")}
                    >
                      <PlacesAutocomplete
                        value={form.placeOfBirth}
                        onChange={(v) => update("placeOfBirth", v)}
                        onPlaceSelect={(place) =>
                          setForm((p) => ({
                            ...p,
                            placeOfBirth: place.placeName || p.placeOfBirth,
                            birthLatitude: place.latitude != null ? String(place.latitude) : p.birthLatitude,
                            birthLongitude: place.longitude != null ? String(place.longitude) : p.birthLongitude,
                            birthTimezone: place.timezone || p.birthTimezone,
                          }))
                        }
                        placeholder="Start typing the birth place..."
                      />
                    </ProfileFormField>
                    <div>
                      <Label>Latitude</Label>
                      <Input value={form.birthLatitude} readOnly placeholder="Auto-filled" />
                    </div>
                    <div>
                      <Label>Longitude</Label>
                      <Input value={form.birthLongitude} readOnly placeholder="Auto-filled" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Timezone</Label>
                      <Input value={form.birthTimezone} readOnly placeholder="Auto-filled" />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div>
            <Label>About Me</Label>
            <Textarea value={form.aboutMe} onChange={(e) => update("aboutMe", e.target.value)} rows={4} />
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">Photos &amp; Documents</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PHOTO_FIELDS.map(({ key, label, fullWidth }) => (
                <div key={key} className={fullWidth ? "sm:col-span-2" : undefined}>
                  <PhotoField
                    label={label}
                    file={form[key]}
                    existingUrl={form.existingPhotos?.[key] ?? null}
                    onSelect={(file) => update(key, file)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {Object.keys(fieldErrors).length > 0 && (
              <p className="w-full rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                Please complete all required fields. {Object.keys(fieldErrors).length} field
                {Object.keys(fieldErrors).length === 1 ? "" : "s"} need attention — see errors above.
              </p>
            )}
            <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" variant="default" onClick={submit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
