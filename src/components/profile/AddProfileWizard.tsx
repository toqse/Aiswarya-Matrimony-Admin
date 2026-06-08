import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Sparkles } from "lucide-react";
import PlacesAutocomplete from "@/components/profile/PlacesAutocomplete";
import { useToast } from "@/hooks/use-toast";
import {
  fetchCastes,
  fetchCountries,
  fetchDistricts,
  fetchEducations,
  fetchEducationSubjects,
  fetchEmploymentStatuses,
  fetchIncomeRanges,
  fetchOccupations,
  fetchPublicMotherTongues,
  fetchReligions,
  fetchStates,
} from "@/lib/admin-api/master";

const profileForOptions = ["Myself", "Son", "Daughter", "Brother", "Sister", "Friend", "Relative"];

interface AddProfileWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (profile: any) => void;
}

export default function AddProfileWizard({ open, onOpenChange, onComplete }: AddProfileWizardProps) {
  const { toast } = useToast();
  const [horoExpanded, setHoroExpanded] = useState(true);
  const [form, setForm] = useState({
    profileFor: "",
    fullName: "",
    mobile: "",
    email: "",
    dob: "",
    gender: "",
    hasHoroscope: false,
    timeOfBirth: "",
    horoCountryId: "",
    horoStateId: "",
    horoDistrictId: "",
    placeOfBirth: "",
    birthLatitude: "",
    birthLongitude: "",
    birthTimezone: "",
    countryId: "",
    stateId: "",
    districtId: "",
    cityId: "",
    address: "",
    religionId: "",
    casteId: "",
    motherTongueId: "",
    maritalStatus: "",
    partnerPreferenceType: "own_religion_only" as "own_religion_only" | "open_to_all" | "specific_religions",
    partnerReligionIds: [] as string[],
    partnerCastePreference: "any" as "any" | "own_caste_only",
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
    state: "",
    city: "",
    aboutMe: "",
    aadhaarNumber: "",
    full_photo: null as File | null,
    passport_photo: null as File | null,
    profile_photo: null as File | null,
    selfie_photo: null as File | null,
    family_photo: null as File | null,
    aadhaar_front: null as File | null,
    aadhaar_back: null as File | null,
    termsAgreed: false,
  });

  const horoscopeValid =
    !form.hasHoroscope || (!!form.dob && !!form.timeOfBirth && !!form.placeOfBirth);

  const canSubmit =
    !!form.profileFor &&
    !!form.fullName &&
    form.mobile.length === 10 &&
    !!form.dob &&
    !!form.gender &&
    !!form.religionId &&
    !!form.maritalStatus &&
    !!form.height &&
    !!form.highestEducationId &&
    !!form.employmentStatus &&
    horoscopeValid &&
    form.termsAgreed;

  const update = (field: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const reset = () =>
    setForm({
      profileFor: "",
      fullName: "",
      mobile: "",
      email: "",
      dob: "",
      gender: "",
      hasHoroscope: false,
      timeOfBirth: "",
      horoCountryId: "",
      horoStateId: "",
      horoDistrictId: "",
      placeOfBirth: "",
      birthLatitude: "",
      birthLongitude: "",
      birthTimezone: "",
      countryId: "",
      stateId: "",
      districtId: "",
      cityId: "",
      address: "",
      religionId: "",
      casteId: "",
      motherTongueId: "",
      maritalStatus: "",
      partnerPreferenceType: "own_religion_only",
      partnerReligionIds: [],
      partnerCastePreference: "any",
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
      state: "",
      city: "",
      aboutMe: "",
      aadhaarNumber: "",
      full_photo: null,
      passport_photo: null,
      profile_photo: null,
      selfie_photo: null,
      family_photo: null,
      aadhaar_front: null,
      aadhaar_back: null,
      termsAgreed: false,
    });

  const submit = () => {
    if (!canSubmit) {
      const description =
        form.hasHoroscope && !horoscopeValid
          ? "Horoscope is enabled — Date of Birth, Time of Birth and Place of Birth are required."
          : "Please fill all required fields.";
      toast({ title: "Missing fields", description, variant: "destructive" });
      return;
    }

    onComplete({
      profileFor: form.profileFor,
      fullName: form.fullName,
      mobile: form.mobile,
      email: form.email,
      dob: form.dob,
      gender: form.gender,
      hasHoroscope: form.hasHoroscope,
      timeOfBirth: form.timeOfBirth,
      horoCountryId: form.horoCountryId,
      horoStateId: form.horoStateId,
      horoDistrictId: form.horoDistrictId,
      placeOfBirth: form.placeOfBirth,
      birthLatitude: form.birthLatitude,
      birthLongitude: form.birthLongitude,
      birthTimezone: form.birthTimezone,
      countryId: form.countryId,
      stateId: form.stateId,
      districtId: form.districtId,
      cityId: form.cityId,
      address: form.address,
      religionId: form.religionId,
      casteId: form.casteId,
      motherTongueId: form.motherTongueId,
      maritalStatus: form.maritalStatus,
      partnerPreferenceType: form.partnerPreferenceType,
      partnerReligionIds: form.partnerReligionIds,
      partnerCastePreference: form.partnerCastePreference,
      hasChildren: form.hasChildren,
      numberOfMarriages: form.numberOfMarriages,
      numberOfChildren: form.numberOfChildren,
      height: form.height,
      weight: form.weight,
      complexion: form.complexion,
      annualIncomeId: form.annualIncomeId,
      highestEducationId: form.highestEducationId,
      educationSubjectId: form.educationSubjectId,
      employmentStatus: form.employmentStatus,
      occupationId: form.occupationId,
      state: form.state,
      city: form.city,
      aboutMe: form.aboutMe,
      aadhaarNumber: form.aadhaarNumber,
      full_photo: form.full_photo,
      passport_photo: form.passport_photo,
      profile_photo: form.profile_photo,
      selfie_photo: form.selfie_photo,
      family_photo: form.family_photo,
      aadhaar_front: form.aadhaar_front,
      aadhaar_back: form.aadhaar_back,
    });

    // Do NOT reset here: keep all entered values if the backend rejects the
    // submission. The form is reset on dialog close (see Dialog onOpenChange),
    // which fires only after a successful create closes the wizard.
  };

  const religionsQ = useQuery({
    queryKey: ["master", "religions", "profile-form"],
    queryFn: () => fetchReligions({ page_size: 200 }),
  });

  const castesQ = useQuery({
    queryKey: ["master", "castes", "profile-form", form.religionId],
    queryFn: () => fetchCastes({ religion_id: Number(form.religionId), page_size: 500 }),
    enabled: !!form.religionId,
  });

  const motherTonguesQ = useQuery({
    queryKey: ["master", "mother-tongues", "profile-form"],
    queryFn: () => fetchPublicMotherTongues({ page_size: 500 }),
  });

  const countriesQ = useQuery({
    queryKey: ["master", "countries", "profile-form"],
    queryFn: () => fetchCountries({ page_size: 200 }),
  });

  const statesQ = useQuery({
    queryKey: ["master", "states", "profile-form", form.countryId],
    queryFn: () => fetchStates({ country_id: Number(form.countryId), page_size: 200 }),
    enabled: !!form.countryId,
  });

  const districtsQ = useQuery({
    queryKey: ["master", "districts", "profile-form", form.stateId],
    queryFn: () => fetchDistricts({ state_id: Number(form.stateId), page_size: 200 }),
    enabled: !!form.stateId,
  });

  const horoStatesQ = useQuery({
    queryKey: ["master", "states", "profile-form", "horo", form.horoCountryId],
    queryFn: () => fetchStates({ country_id: Number(form.horoCountryId), page_size: 200 }),
    enabled: form.hasHoroscope && !!form.horoCountryId,
  });

  const horoDistrictsQ = useQuery({
    queryKey: ["master", "districts", "profile-form", "horo", form.horoStateId],
    queryFn: () => fetchDistricts({ state_id: Number(form.horoStateId), page_size: 200 }),
    enabled: form.hasHoroscope && !!form.horoStateId,
  });

  const educationsQ = useQuery({
    queryKey: ["master", "educations", "profile-form"],
    queryFn: () => fetchEducations({ page_size: 500 }),
  });

  const subjectsQ = useQuery({
    queryKey: ["master", "education-subjects", "profile-form", form.highestEducationId],
    queryFn: () => fetchEducationSubjects({ education_id: Number(form.highestEducationId), page_size: 500 }),
    enabled: !!form.highestEducationId,
  });

  const occupationsQ = useQuery({
    queryKey: ["master", "occupations", "profile-form"],
    queryFn: () => fetchOccupations({ page_size: 500 }),
  });

  const employmentQ = useQuery({
    queryKey: ["master", "employment-statuses", "profile-form"],
    queryFn: () => fetchEmploymentStatuses({ page_size: 200 }),
  });

  const incomeQ = useQuery({
    queryKey: ["master", "income-ranges", "profile-form"],
    queryFn: () => fetchIncomeRanges({ page_size: 200 }),
  });

  const togglePartnerReligion = (id: string, checked: boolean) => {
    setForm((p) => {
      const next = new Set(p.partnerReligionIds);
      if (checked) next.add(id);
      else next.delete(id);
      return { ...p, partnerReligionIds: Array.from(next) };
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label>Profile For *</Label>
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
            <div>
              <Label>Full Name *</Label>
              <Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
            </div>
            <div>
              <Label>Mobile *</Label>
              <Input
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10 digit number"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div>
              <Label>Date of Birth *</Label>
              <Input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} />
              <label className="mt-2 flex items-center gap-2 text-sm cursor-pointer select-none">
                <Checkbox
                  checked={form.hasHoroscope}
                  onCheckedChange={(v) => update("hasHoroscope", !!v)}
                />
                <span>I have horoscope details</span>
              </label>
            </div>
            <div>
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Country</Label>
              <Select
                value={form.countryId}
                onValueChange={(v) => {
                  setForm((p) => ({
                    ...p,
                    countryId: v,
                    stateId: "",
                    districtId: "",
                    cityId: "",
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {(countriesQ.data?.results ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>State</Label>
              <Select
                value={form.stateId}
                onValueChange={(v) => {
                  setForm((p) => ({
                    ...p,
                    stateId: v,
                    districtId: "",
                    cityId: "",
                  }));
                }}
                disabled={!form.countryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {(statesQ.data?.results ?? []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>District</Label>
              <Select
                value={form.districtId}
                onValueChange={(v) => {
                  setForm((p) => ({
                    ...p,
                    districtId: v,
                    cityId: "",
                  }));
                }}
                disabled={!form.stateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {(districtsQ.data?.results ?? []).map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
            </div>
            <div>
              <Label>Religion *</Label>
              <Select
                value={form.religionId}
                onValueChange={(v) => {
                  setForm((p) => ({
                    ...p,
                    religionId: v,
                    casteId: "",
                    partnerReligionIds:
                      p.partnerPreferenceType === "specific_religions" ? [] : p.partnerReligionIds,
                  }));
                }}
              >
                <SelectTrigger>
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
            </div>
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
            <div>
              <Label>Marital Status *</Label>
              <Select value={form.maritalStatus} onValueChange={(v) => update("maritalStatus", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Never Married">Never Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                  <SelectItem value="Awaiting Divorce">Awaiting Divorce</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Partner Preference Type</Label>
              <Select
                value={form.partnerPreferenceType}
                onValueChange={(v) => {
                  const nv = v as typeof form.partnerPreferenceType;
                  setForm((p) => ({
                    ...p,
                    partnerPreferenceType: nv,
                    partnerReligionIds: nv === "specific_religions" ? p.partnerReligionIds : [],
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="own_religion_only">Own religion only</SelectItem>
                  <SelectItem value="open_to_all">Open to all</SelectItem>
                  <SelectItem value="specific_religions">Specific religions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Partner Caste Preference</Label>
              <Select value={form.partnerCastePreference} onValueChange={(v) => update("partnerCastePreference", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="own_caste_only">Own caste only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.partnerPreferenceType === "specific_religions" && (
              <div className="sm:col-span-2 border rounded-md p-3 space-y-2">
                <p className="text-sm font-medium">Partner Religions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-auto pr-1">
                  {(religionsQ.data?.results ?? []).map((r) => {
                    const checked = form.partnerReligionIds.includes(String(r.id));
                    return (
                      <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => togglePartnerReligion(String(r.id), !!v)}
                        />
                        <span>{r.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {form.partnerReligionIds.length}
                </p>
              </div>
            )}
            {["Divorced", "Widowed", "Awaiting Divorce"].includes(form.maritalStatus) && (
              <div className="sm:col-span-2 border rounded-md p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Checkbox checked={form.hasChildren} onCheckedChange={(v) => update("hasChildren", !!v)} />
                  <span className="text-sm">Has Children</span>
                </div>
                {form.hasChildren && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>No. of Marriages</Label>
                      <Input value={form.numberOfMarriages} onChange={(e) => update("numberOfMarriages", e.target.value.replace(/\D/g, ""))} />
                    </div>
                    <div>
                      <Label>No. of Children</Label>
                      <Input value={form.numberOfChildren} onChange={(e) => update("numberOfChildren", e.target.value.replace(/\D/g, ""))} />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div>
              <Label>Height (cm) *</Label>
              <Input value={form.height} onChange={(e) => update("height", e.target.value)} />
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input value={form.weight} onChange={(e) => update("weight", e.target.value)} />
            </div>
            <div>
              <Label>Complexion</Label>
              <Select value={form.complexion} onValueChange={(v) => update("complexion", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select complexion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Wheatish">Wheatish</SelectItem>
                  <SelectItem value="Dark">Dark</SelectItem>
                  <SelectItem value="Very Fair">Very Fair</SelectItem>
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
            <div>
              <Label>Highest Education *</Label>
              <Select
                value={form.highestEducationId}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    highestEducationId: v,
                    educationSubjectId: "",
                  }))
                }
              >
                <SelectTrigger>
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
            </div>
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
            <div>
              <Label>Employment Status *</Label>
              <Select value={form.employmentStatus} onValueChange={(v) => update("employmentStatus", v)}>
                <SelectTrigger>
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
            </div>
            <div>
              <Label>Occupation</Label>
              <Select value={form.occupationId} onValueChange={(v) => update("occupationId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select occupation" />
                </SelectTrigger>
                <SelectContent>
                  {(occupationsQ.data?.results ?? []).map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.hasHoroscope && (
            <Collapsible
              open={horoExpanded}
              onOpenChange={setHoroExpanded}
              className="rounded-lg border border-border bg-muted/30"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                >
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
                    <div>
                      <Label>Time of Birth *</Label>
                      <Input
                        type="time"
                        value={form.timeOfBirth}
                        onChange={(e) => update("timeOfBirth", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Country *</Label>
                      <Select
                        value={form.horoCountryId}
                        onValueChange={(v) =>
                          setForm((p) => ({
                            ...p,
                            horoCountryId: v,
                            horoStateId: "",
                            horoDistrictId: "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {(countriesQ.data?.results ?? []).map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Select
                        value={form.horoStateId}
                        onValueChange={(v) =>
                          setForm((p) => ({ ...p, horoStateId: v, horoDistrictId: "" }))
                        }
                        disabled={!form.horoCountryId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {(horoStatesQ.data?.results ?? []).map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>District *</Label>
                      <Select
                        value={form.horoDistrictId}
                        onValueChange={(v) => update("horoDistrictId", v)}
                        disabled={!form.horoStateId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                        <SelectContent>
                          {(horoDistrictsQ.data?.results ?? []).map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Place of Birth *</Label>
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
                    </div>
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
            <Label>Aadhaar Number</Label>
            <Input
              value={form.aadhaarNumber}
              onChange={(e) => update("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="12 digit Aadhaar number"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>full_photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setForm((p) => ({ ...p, full_photo: e.target.files?.[0] ?? null }))} />
            </div>
            <div>
              <Label>passport_photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setForm((p) => ({ ...p, passport_photo: e.target.files?.[0] ?? null }))} />
            </div>
            <div>
              <Label>profile_photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setForm((p) => ({ ...p, profile_photo: e.target.files?.[0] ?? null }))} />
            </div>
            <div>
              <Label>selfie_photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setForm((p) => ({ ...p, selfie_photo: e.target.files?.[0] ?? null }))} />
            </div>
            <div>
              <Label>family_photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setForm((p) => ({ ...p, family_photo: e.target.files?.[0] ?? null }))} />
            </div>
            <div>
              <Label>aadhaar_front</Label>
              <Input type="file" accept="image/*" onChange={(e) => setForm((p) => ({ ...p, aadhaar_front: e.target.files?.[0] ?? null }))} />
            </div>
            <div className="sm:col-span-2">
              <Label>aadhaar_back</Label>
              <Input type="file" accept="image/*" onChange={(e) => setForm((p) => ({ ...p, aadhaar_back: e.target.files?.[0] ?? null }))} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={form.termsAgreed} onCheckedChange={(v) => update("termsAgreed", !!v)} />
            <span className="text-sm">I agree to Terms & Conditions and Privacy Policy *</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={!canSubmit}>
              Create Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
