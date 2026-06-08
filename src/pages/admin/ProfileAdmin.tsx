import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Eye, Trash2, Ban, Loader2, UserPlus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import {
  fetchCastes,
  fetchCities,
  fetchCountries,
  fetchDistricts,
  fetchEducations,
  fetchEducationSubjects,
  fetchEmploymentStatuses,
  fetchIncomeRanges,
  fetchMaritalStatuses,
  fetchMotherTongues,
  fetchOccupations,
  fetchReligions,
  fetchStates,
} from "@/lib/admin-api/master";
import {
  deleteAdminProfile,
  fetchAdminProfileDetail,
  fetchAdminProfiles,
  looksLikePhone,
  normalizePhoneQuery,
  patchAdminProfileAbout,
  patchAdminProfileBasic,
  patchAdminProfileEducation,
  patchAdminProfileLocation,
  patchAdminProfilePersonal,
  patchAdminProfilePhotos,
  patchAdminProfileReligion,
  patchProfileAssignStaff,
  fetchStaffProfiles,
  patchProfileBlock,
  type ProfileListRow,
} from "@/lib/admin-api/profiles";
import { fetchAdminStaffList } from "@/lib/admin-api/staff";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PendingAction = { kind: "block"; row: ProfileListRow } | { kind: "delete"; row: ProfileListRow } | null;

type SelectOpt = { label: string; value: string };

const GENDER_OPTIONS: SelectOpt[] = [
  { label: "Male", value: "M" },
  { label: "Female", value: "F" },
  { label: "Other", value: "O" },
];

const PROFILE_FOR_OPTIONS: SelectOpt[] = [
  { label: "Myself", value: "myself" },
  { label: "Son", value: "son" },
  { label: "Daughter", value: "daughter" },
  { label: "Brother", value: "brother" },
  { label: "Sister", value: "sister" },
  { label: "Friend", value: "friend" },
  { label: "Relative", value: "relative" },
];

const PARTNER_PREF_TYPE_OPTIONS: SelectOpt[] = [
  { label: "Own religion only", value: "own_religion_only" },
  { label: "Open to all", value: "open_to_all" },
  { label: "Specific religions", value: "specific_religions" },
];

const PARTNER_CASTE_PREF_OPTIONS: SelectOpt[] = [
  { label: "Any", value: "any" },
  { label: "Own caste only", value: "own_caste_only" },
];

function displayOrDash(v: unknown): string {
  if (v == null || v === "") return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
  return String(v);
}

/** Divorced / widowed / separated require has_children (and children_count when yes). */
function maritalStatusNameRequiresChildren(name: string): boolean {
  const n = name.trim().toLowerCase().replace(/_/g, " ");
  return n === "divorced" || n === "widowed" || n === "separated";
}

function maritalRowRequiresChildren(
  maritalStatusId: string,
  rows: { id: number; name: string }[] | undefined,
): boolean {
  if (!maritalStatusId?.trim() || !rows?.length) return false;
  const sel = rows.find((m) => String(m.id) === maritalStatusId);
  return sel ? maritalStatusNameRequiresChildren(sel.name) : false;
}

function parseHasChildrenFromApi(raw: unknown): "" | "yes" | "no" {
  if (raw === true || raw === "true" || raw === 1 || raw === "1") return "yes";
  if (raw === false || raw === "false" || raw === 0 || raw === "0") return "no";
  return "";
}

function coerceNumericId(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string") {
    const t = v.trim();
    if (/^\d+$/.test(t)) return t;
  }
  if (typeof v === "object" && v !== null && "id" in v) {
    const id = (v as { id: unknown }).id;
    if (typeof id === "number" && Number.isFinite(id)) return String(id);
    if (typeof id === "string" && /^\d+$/.test(id.trim())) return id.trim();
  }
  return "";
}

function genderFormToApi(g: string): "male" | "female" | "other" | undefined {
  if (g === "M") return "male";
  if (g === "F") return "female";
  if (g === "O") return "other";
  return undefined;
}

function normalizeGenderFromApi(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const u = s.toUpperCase();
  const lower = s.toLowerCase();
  if (u === "M" || u === "MALE" || lower === "male") return "M";
  if (u === "F" || u === "FEMALE" || lower === "female") return "F";
  if (u === "O" || u === "OTHER" || lower === "other") return "O";
  return "";
}

function normalizeProfileForFromApi(raw: unknown): string {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  const allowed = PROFILE_FOR_OPTIONS.map((o) => o.value);
  return allowed.includes(s) ? s : "myself";
}

function mapProfileDetailToEditForm(d: Record<string, unknown>, row: ProfileListRow) {
  const b = (d.basic_details as Record<string, unknown> | undefined) ?? {};
  const loc = (d.location_details as Record<string, unknown> | undefined) ?? {};
  const rel = (d.religion_details as Record<string, unknown> | undefined) ?? {};
  const per = (d.personal_details as Record<string, unknown> | undefined) ?? {};
  const edu = (d.education_details as Record<string, unknown> | undefined) ?? {};

  return {
    profileFor: normalizeProfileForFromApi(d.profile_for ?? b.profile_for),
    fullName: String(b.name ?? row.name ?? ""),
    email: String(b.email ?? ""),
    gender: normalizeGenderFromApi(b.gender ?? row.gender),
    countryId: coerceNumericId(loc.country_id ?? loc.country),
    stateId: coerceNumericId(loc.state_id ?? loc.state),
    districtId: coerceNumericId(loc.district_id ?? loc.district),
    cityId: coerceNumericId(loc.city_id ?? loc.city),
    address: String(loc.address ?? ""),
    religionId: coerceNumericId(rel.religion_id),
    casteId: coerceNumericId(rel.caste_id),
    motherTongueId: coerceNumericId(rel.mother_tongue_id),
    partnerPreferenceType: String(rel.partner_preference_type ?? "own_religion_only"),
    partnerCastePreference: String(rel.partner_caste_preference ?? "any"),
    maritalStatusId: coerceNumericId(per.marital_status_id),
    hasChildren: parseHasChildrenFromApi(per.has_children),
    childrenCount:
      per.children_count != null && String(per.children_count).trim() !== ""
        ? String(per.children_count)
        : per.number_of_children != null && String(per.number_of_children).trim() !== ""
          ? String(per.number_of_children)
          : "",
    height: per.height_cm != null ? String(per.height_cm) : "",
    weight: per.weight_kg != null ? String(per.weight_kg) : "",
    complexion: String(per.complexion ?? per.colour ?? ""),
    annualIncomeId: coerceNumericId(edu.annual_income_id),
    highestEducationId: coerceNumericId(edu.highest_education_id),
    educationSubjectId: coerceNumericId(edu.education_subject_id),
    employmentStatusId: coerceNumericId(edu.employment_status_id),
    occupationId: coerceNumericId(edu.occupation_id),
    aboutMe: String(d.about_me ?? ""),
    aadhaarNumber: String(d.aadhaar_number ?? ""),
  };
}

export default function ProfileAdmin() {
  const { role } = useRole();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("20");
  const [viewProfile, setViewProfile] = useState<ProfileListRow | null>(null);
  const [viewDetail, setViewDetail] = useState<Record<string, unknown> | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [assignRow, setAssignRow] = useState<ProfileListRow | null>(null);
  const [assignStaffId, setAssignStaffId] = useState<string>("");

  const [editRow, setEditRow] = useState<ProfileListRow | null>(null);
  const [editDetail, setEditDetail] = useState<Record<string, unknown> | null>(null);
  const [editForm, setEditForm] = useState({
    profileFor: "myself",
    fullName: "",
    email: "",
    gender: "",
    countryId: "",
    stateId: "",
    districtId: "",
    cityId: "",
    address: "",
    religionId: "",
    casteId: "",
    motherTongueId: "",
    partnerPreferenceType: "own_religion_only",
    partnerCastePreference: "any",
    maritalStatusId: "",
    hasChildren: "" as "" | "yes" | "no",
    childrenCount: "",
    height: "",
    weight: "",
    complexion: "",
    annualIncomeId: "",
    highestEducationId: "",
    educationSubjectId: "",
    employmentStatusId: "",
    occupationId: "",
    aboutMe: "",
    aadhaarNumber: "",
    full_photo: null as File | null,
    passport_photo: null as File | null,
    profile_photo: null as File | null,
    selfie_photo: null as File | null,
    family_photo: null as File | null,
    aadhaar_front: null as File | null,
    aadhaar_back: null as File | null,
  });

  const listQuery = useQuery({
    queryKey: ["admin", "profiles", role, search, page, pageSize],
    queryFn: () => {
      const trimmed = search.trim();
      const phone = normalizePhoneQuery(trimmed);
      const args = {
        search: trimmed || undefined,
        phone: phone || undefined,
        page,
        page_size: Number(pageSize),
      };
      return role === "staff" ? fetchStaffProfiles(args) : fetchAdminProfiles(args);
    },
  });

  const rows = listQuery.data?.results ?? [];
  const total = listQuery.data?.count ?? 0;
  const canPrev = Boolean(listQuery.data?.previous) && page > 1;
  const canNext = Boolean(listQuery.data?.next);
  const staffQuery = useQuery({
    enabled: !!assignRow && role === "admin",
    queryKey: ["admin", "staff", "active-for-assignment"],
    queryFn: () => fetchAdminStaffList({ status: "active", page: 1, page_size: 100 }),
  });
  const staffRows = staffQuery.data?.results ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "profiles"] });

  const blockMut = useMutation({
    mutationFn: (r: ProfileListRow) => patchProfileBlock(r.matri_id, !r.is_blocked),
    onSuccess: () => {
      toast({ title: "Block status updated" });
      setPendingAction(null);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const assignMut = useMutation({
    mutationFn: ({ matriId, staffId }: { matriId: string; staffId: number }) =>
      patchProfileAssignStaff(matriId, staffId),
    onSuccess: () => {
      toast({ title: "Staff assigned successfully" });
      setAssignRow(null);
      setAssignStaffId("");
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (matriId: string) => deleteAdminProfile(matriId),
    onSuccess: () => {
      toast({ title: "Profile deleted" });
      setPendingAction(null);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  type EditFormSnapshot = typeof editForm;

  const editMut = useMutation({
    mutationFn: async ({
      matriId,
      row,
      detail,
      form,
      requiresChildrenInfo,
    }: {
      matriId: string;
      row: ProfileListRow;
      detail: Record<string, unknown>;
      form: EditFormSnapshot;
      requiresChildrenInfo: boolean;
    }) => {
      const b = (detail.basic_details as Record<string, unknown> | undefined) ?? {};
      const rel = (detail.religion_details as Record<string, unknown> | undefined) ?? {};
      const per = (detail.personal_details as Record<string, unknown> | undefined) ?? {};

      const num = (s: string) => {
        const n = Number(s);
        return Number.isFinite(n) ? n : undefined;
      };

      const basicBody: Record<string, unknown> = {
        name: form.fullName.trim(),
        email: form.email.trim() || undefined,
        gender: genderFormToApi(form.gender),
        profile_for: form.profileFor || undefined,
        dob: b.dob != null && String(b.dob).trim() !== "" ? String(b.dob) : undefined,
        phone: b.phone != null && String(b.phone).trim() !== "" ? String(b.phone) : undefined,
      };
      if (form.aadhaarNumber.trim() !== "") {
        basicBody.aadhaar_number = form.aadhaarNumber.trim();
      }
      Object.keys(basicBody).forEach((k) => basicBody[k] === undefined && delete basicBody[k]);

      const locationBody: Record<string, unknown> = {
        country_id: form.countryId ? num(form.countryId) : undefined,
        state_id: form.stateId ? num(form.stateId) : undefined,
        district_id: form.districtId ? num(form.districtId) : undefined,
        city_id: form.cityId ? num(form.cityId) : undefined,
        address: form.address.trim() || undefined,
      };
      Object.keys(locationBody).forEach((k) => locationBody[k] === undefined && delete locationBody[k]);

      const religionBody: Record<string, unknown> = {
        religion_id: form.religionId ? num(form.religionId) : undefined,
        caste_id: form.casteId ? num(form.casteId) : undefined,
        mother_tongue_id: form.motherTongueId ? num(form.motherTongueId) : undefined,
        partner_preference_type: form.partnerPreferenceType || undefined,
        partner_caste_preference: form.partnerCastePreference || undefined,
        partner_religion_preference:
          rel.partner_religion_preference != null && String(rel.partner_religion_preference).trim() !== ""
            ? String(rel.partner_religion_preference)
            : undefined,
        partner_religion_ids: Array.isArray(rel.partner_religion_ids) ? rel.partner_religion_ids : undefined,
      };
      Object.keys(religionBody).forEach((k) => religionBody[k] === undefined && delete religionBody[k]);

      const weightRaw = form.weight.trim();
      const personalBody: Record<string, unknown> = {
        marital_status_id: form.maritalStatusId ? num(form.maritalStatusId) : undefined,
        height_cm: form.height ? num(form.height) : undefined,
        weight_kg: weightRaw !== "" ? weightRaw : undefined,
        colour: form.complexion.trim() || undefined,
        blood_group: per.blood_group != null && String(per.blood_group).trim() !== "" ? String(per.blood_group) : undefined,
      };
      if (requiresChildrenInfo) {
        if (form.hasChildren === "yes") {
          personalBody.has_children = true;
          const cc = num(form.childrenCount);
          if (cc !== undefined) personalBody.children_count = cc;
        } else if (form.hasChildren === "no") {
          personalBody.has_children = false;
        }
      }
      Object.keys(personalBody).forEach((k) => personalBody[k] === undefined && delete personalBody[k]);

      const educationBody: Record<string, unknown> = {
        highest_education_id: form.highestEducationId ? num(form.highestEducationId) : undefined,
        education_subject_id: form.educationSubjectId ? num(form.educationSubjectId) : undefined,
        employment_status_id: form.employmentStatusId ? num(form.employmentStatusId) : undefined,
        occupation_id: form.occupationId ? num(form.occupationId) : undefined,
        annual_income_id: form.annualIncomeId ? num(form.annualIncomeId) : undefined,
      };
      Object.keys(educationBody).forEach((k) => educationBody[k] === undefined && delete educationBody[k]);

      const aboutBody: Record<string, unknown> = {
        about_me: form.aboutMe,
      };

      await patchAdminProfileBasic(matriId, basicBody);
      await patchAdminProfileLocation(matriId, locationBody);
      await patchAdminProfileReligion(matriId, religionBody);
      await patchAdminProfilePersonal(matriId, personalBody);
      await patchAdminProfileEducation(matriId, educationBody);
      await patchAdminProfileAbout(matriId, aboutBody);

      const photoFd = new FormData();
      const photoKeys = [
        "full_photo",
        "passport_photo",
        "profile_photo",
        "selfie_photo",
        "family_photo",
        "aadhaar_front",
        "aadhaar_back",
      ] as const;
      for (const key of photoKeys) {
        const f = form[key];
        if (f) photoFd.append(key, f);
      }
      console.log("formData", photoFd);
      await patchAdminProfilePhotos(matriId, photoFd);

      return { matriId, row };
    },
    onSuccess: async () => {
      toast({ title: "Profile updated" });
      await invalidate();
      setEditRow(null);
      setEditDetail(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openView = async (row: ProfileListRow) => {
    setViewProfile(row);
    setViewDetail(null);
    try {
      const d = await fetchAdminProfileDetail(row.matri_id);
      setViewDetail(d);
    } catch {
      setViewDetail(null);
    }
  };

  const openEdit = async (row: ProfileListRow) => {
    setEditRow(row);
    setEditDetail(null);
    setEditForm((prev) => ({
      ...prev,
      profileFor: "myself",
      fullName: row.name ?? "",
      email: "",
      gender: normalizeGenderFromApi(row.gender),
      countryId: "",
      stateId: "",
      districtId: "",
      cityId: "",
      address: "",
      religionId: "",
      casteId: "",
      motherTongueId: "",
      partnerPreferenceType: "own_religion_only",
      partnerCastePreference: "any",
      maritalStatusId: "",
      hasChildren: "" as "" | "yes" | "no",
      childrenCount: "",
      height: "",
      weight: "",
      complexion: "",
      annualIncomeId: "",
      highestEducationId: "",
      educationSubjectId: "",
      employmentStatusId: "",
      occupationId: "",
      aboutMe: "",
      aadhaarNumber: "",
      full_photo: null,
      passport_photo: null,
      profile_photo: null,
      selfie_photo: null,
      family_photo: null,
      aadhaar_front: null,
      aadhaar_back: null,
    }));
    try {
      const d = await fetchAdminProfileDetail(row.matri_id);
      setEditDetail(d);
      setEditForm((prev) => ({ ...prev, ...mapProfileDetailToEditForm(d as Record<string, unknown>, row) }));
    } catch {
      setEditDetail(null);
    }
  };

  const editCountriesQ = useQuery({
    queryKey: ["master", "countries", "admin-edit-profile"],
    queryFn: () => fetchCountries({ page_size: 200 }),
    enabled: !!editRow,
  });
  const editStatesQ = useQuery({
    queryKey: ["master", "states", "admin-edit-profile", editForm.countryId],
    queryFn: () => fetchStates({ country_id: Number(editForm.countryId), page_size: 200 }),
    enabled: !!editRow && !!editForm.countryId,
  });
  const editDistrictsQ = useQuery({
    queryKey: ["master", "districts", "admin-edit-profile", editForm.stateId],
    queryFn: () => fetchDistricts({ state_id: Number(editForm.stateId), page_size: 200 }),
    enabled: !!editRow && !!editForm.stateId,
  });
  const editCitiesQ = useQuery({
    queryKey: ["master", "cities", "admin-edit-profile", editForm.districtId],
    queryFn: () => fetchCities({ district_id: Number(editForm.districtId), page_size: 200 }),
    enabled: !!editRow && !!editForm.districtId,
  });

  const editReligionsQ = useQuery({
    queryKey: ["master", "religions", "admin-edit-profile"],
    queryFn: () => fetchReligions({ page_size: 200 }),
    enabled: !!editRow,
  });
  const editCastesQ = useQuery({
    queryKey: ["master", "castes", "admin-edit-profile", editForm.religionId],
    queryFn: () => fetchCastes({ religion_id: Number(editForm.religionId), page_size: 500 }),
    enabled: !!editRow && !!editForm.religionId,
  });
  const editMotherTonguesQ = useQuery({
    queryKey: ["master", "mother-tongues", "admin-edit-profile"],
    queryFn: () => fetchMotherTongues({ page_size: 500 }),
    enabled: !!editRow,
  });
  const editEducationsQ = useQuery({
    queryKey: ["master", "educations", "admin-edit-profile"],
    queryFn: () => fetchEducations({ page_size: 500 }),
    enabled: !!editRow,
  });
  const editSubjectsQ = useQuery({
    queryKey: ["master", "education-subjects", "admin-edit-profile", editForm.highestEducationId],
    queryFn: () => fetchEducationSubjects({ education_id: Number(editForm.highestEducationId), page_size: 500 }),
    enabled: !!editRow && !!editForm.highestEducationId,
  });
  const editOccupationsQ = useQuery({
    queryKey: ["master", "occupations", "admin-edit-profile"],
    queryFn: () => fetchOccupations({ page_size: 500 }),
    enabled: !!editRow,
  });
  const editEmploymentQ = useQuery({
    queryKey: ["master", "employment-statuses", "admin-edit-profile"],
    queryFn: () => fetchEmploymentStatuses({ page_size: 200 }),
    enabled: !!editRow,
  });
  const editIncomeRangesQ = useQuery({
    queryKey: ["master", "income-ranges", "admin-edit-profile"],
    queryFn: () => fetchIncomeRanges({ page_size: 200 }),
    enabled: !!editRow,
  });
  const editMaritalStatusesQ = useQuery({
    queryKey: ["master", "marital-status", "admin-edit-profile"],
    queryFn: () => fetchMaritalStatuses({ page_size: 100 }),
    enabled: !!editRow,
  });

  /** When API returns location names instead of numeric IDs, resolve IDs from master lists. */
  useEffect(() => {
    if (!editDetail || !editRow) return;
    const loc = (editDetail.location_details as Record<string, unknown> | undefined) ?? {};
    const countries = editCountriesQ.data?.results;
    if (!countries?.length) return;
    setEditForm((prev) => {
      if (prev.countryId) return prev;
      const cVal = loc.country;
      if (typeof cVal === "string" && cVal.trim() && !/^\d+$/.test(cVal.trim())) {
        const found = countries.find((c) => c.name === cVal.trim());
        if (found) return { ...prev, countryId: String(found.id), stateId: "", districtId: "", cityId: "" };
      }
      return prev;
    });
  }, [editDetail, editRow, editCountriesQ.data]);

  useEffect(() => {
    if (!editDetail || !editForm.countryId) return;
    const loc = (editDetail.location_details as Record<string, unknown> | undefined) ?? {};
    const states = editStatesQ.data?.results;
    if (!states?.length) return;
    setEditForm((prev) => {
      if (prev.stateId) return prev;
      const sVal = loc.state;
      if (typeof sVal === "string" && sVal.trim() && !/^\d+$/.test(sVal.trim())) {
        const found = states.find((s) => s.name === sVal.trim());
        if (found) return { ...prev, stateId: String(found.id), districtId: "", cityId: "" };
      }
      return prev;
    });
  }, [editDetail, editForm.countryId, editStatesQ.data]);

  useEffect(() => {
    if (!editDetail || !editForm.stateId) return;
    const loc = (editDetail.location_details as Record<string, unknown> | undefined) ?? {};
    const districts = editDistrictsQ.data?.results;
    if (!districts?.length) return;
    setEditForm((prev) => {
      if (prev.districtId) return prev;
      const dVal = loc.district;
      if (typeof dVal === "string" && dVal.trim() && !/^\d+$/.test(dVal.trim())) {
        const found = districts.find((x) => x.name === dVal.trim());
        if (found) return { ...prev, districtId: String(found.id), cityId: "" };
      }
      return prev;
    });
  }, [editDetail, editForm.stateId, editDistrictsQ.data]);

  useEffect(() => {
    if (!editDetail || !editForm.districtId) return;
    const loc = (editDetail.location_details as Record<string, unknown> | undefined) ?? {};
    const cities = editCitiesQ.data?.results;
    if (!cities?.length) return;
    setEditForm((prev) => {
      if (prev.cityId) return prev;
      const cVal = loc.city;
      if (typeof cVal === "string" && cVal.trim() && !/^\d+$/.test(cVal.trim())) {
        const found = cities.find((x) => x.name === cVal.trim());
        if (found) return { ...prev, cityId: String(found.id) };
      }
      return prev;
    });
  }, [editDetail, editForm.districtId, editCitiesQ.data]);

  /** When API returns marital_status label but no id, resolve marital_status_id from master list. */
  useEffect(() => {
    if (!editDetail || !editRow) return;
    const per = (editDetail.personal_details as Record<string, unknown> | undefined) ?? {};
    const rows = editMaritalStatusesQ.data?.results;
    if (!rows?.length) return;
    setEditForm((prev) => {
      if (prev.maritalStatusId) return prev;
      const label = String(per.marital_status ?? "").trim();
      if (!label) return prev;
      const found = rows.find((m) => m.name.trim().toLowerCase() === label.toLowerCase());
      if (!found) return prev;
      return { ...prev, maritalStatusId: String(found.id) };
    });
  }, [editDetail, editRow, editMaritalStatusesQ.data]);

  /**
   * Education mapping:
   * Backend sometimes returns names (eg `employment_status`) without corresponding `*_id`.
   * Resolve missing ids from master lists so Selects show the correct value.
   */
  useEffect(() => {
    if (!editDetail || !editRow) return;
    const edu = (editDetail.education_details as Record<string, unknown> | undefined) ?? {};
    const rows = editEducationsQ.data?.results;
    if (!rows?.length) return;
    setEditForm((prev) => {
      if (prev.highestEducationId) return prev;
      const label = String(edu.highest_education ?? "").trim();
      if (!label) return prev;
      const found = rows.find((e) => e.name.trim().toLowerCase() === label.toLowerCase());
      if (!found) return prev;
      return { ...prev, highestEducationId: String(found.id) };
    });
  }, [editDetail, editRow, editEducationsQ.data]);

  useEffect(() => {
    if (!editDetail || !editRow) return;
    const edu = (editDetail.education_details as Record<string, unknown> | undefined) ?? {};
    const rows = editEmploymentQ.data?.results;
    if (!rows?.length) return;
    setEditForm((prev) => {
      if (prev.employmentStatusId) return prev;
      const label = String(edu.employment_status ?? "").trim();
      if (!label) return prev;
      const found = rows.find((e) => e.name.trim().toLowerCase() === label.toLowerCase());
      if (!found) return prev;
      return { ...prev, employmentStatusId: String(found.id) };
    });
  }, [editDetail, editRow, editEmploymentQ.data]);

  useEffect(() => {
    if (!editDetail || !editRow) return;
    const edu = (editDetail.education_details as Record<string, unknown> | undefined) ?? {};
    const rows = editOccupationsQ.data?.results;
    if (!rows?.length) return;
    setEditForm((prev) => {
      if (prev.occupationId) return prev;
      const label = String(edu.occupation ?? "").trim();
      if (!label) return prev;
      const found = rows.find((o) => o.name.trim().toLowerCase() === label.toLowerCase());
      if (!found) return prev;
      return { ...prev, occupationId: String(found.id) };
    });
  }, [editDetail, editRow, editOccupationsQ.data]);

  useEffect(() => {
    if (!editDetail || !editRow) return;
    const edu = (editDetail.education_details as Record<string, unknown> | undefined) ?? {};
    const rows = editIncomeRangesQ.data?.results;
    if (!rows?.length) return;
    setEditForm((prev) => {
      if (prev.annualIncomeId) return prev;
      const label = String(edu.annual_income ?? "").trim();
      if (!label) return prev;
      const found = rows.find((r) => r.name.trim().toLowerCase() === label.toLowerCase());
      if (!found) return prev;
      return { ...prev, annualIncomeId: String(found.id) };
    });
  }, [editDetail, editRow, editIncomeRangesQ.data]);

  useEffect(() => {
    if (!editDetail || !editRow) return;
    if (!editForm.highestEducationId) return;
    const edu = (editDetail.education_details as Record<string, unknown> | undefined) ?? {};
    const rows = editSubjectsQ.data?.results;
    if (!rows?.length) return;
    setEditForm((prev) => {
      if (prev.educationSubjectId) return prev;
      const label = String(edu.education_subject ?? "").trim();
      if (!label) return prev;
      const found = rows.find((s) => s.name.trim().toLowerCase() === label.toLowerCase());
      if (!found) return prev;
      return { ...prev, educationSubjectId: String(found.id) };
    });
  }, [editDetail, editRow, editForm.highestEducationId, editSubjectsQ.data]);

  const saveEditProfile = () => {
    if (!editRow || !editDetail) return;
    const requiresChildrenInfo = maritalRowRequiresChildren(
      editForm.maritalStatusId,
      editMaritalStatusesQ.data?.results,
    );
    if (requiresChildrenInfo) {
      if (editForm.hasChildren !== "yes" && editForm.hasChildren !== "no") {
        toast({
          title: "Has children required",
          description: "For Divorced, Widowed, or Separated, select whether the member has children.",
          variant: "destructive",
        });
        return;
      }
      if (editForm.hasChildren === "yes") {
        if (editForm.childrenCount.trim() === "") {
          toast({
            title: "Children count required",
            description: "Enter the number of children when Has children is Yes.",
            variant: "destructive",
          });
          return;
        }
        const n = Number(editForm.childrenCount);
        if (!Number.isFinite(n) || n < 0) {
          toast({
            title: "Invalid children count",
            description: "Enter a valid number of children (0 or greater).",
            variant: "destructive",
          });
          return;
        }
      }
    }
    editMut.mutate({
      matriId: editRow.matri_id,
      row: editRow,
      detail: editDetail,
      form: editForm,
      requiresChildrenInfo,
    });
  };

  const detail = viewDetail ?? {};
  const basic = (detail.basic_details as Record<string, unknown> | undefined) ?? {};
  const photos = (detail.photos as Record<string, string | null> | undefined) ?? {};
  const religion = (detail.religion_details as Record<string, unknown> | undefined) ?? {};
  const personal = (detail.personal_details as Record<string, unknown> | undefined) ?? {};
  const location = (detail.location_details as Record<string, unknown> | undefined) ?? {};
  const education = (detail.education_details as Record<string, unknown> | undefined) ?? {};
  const family = (detail.family_details as Record<string, unknown> | undefined) ?? {};
  const admin = (detail.admin as Record<string, unknown> | undefined) ?? {};

  const showValue = (value: unknown) => displayOrDash(value);

  function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {children}
      </div>
    );
  }

  function FieldGrid({ rows }: { rows: [string, unknown][] }) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-md border bg-card p-3">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="font-medium text-sm break-words">{showValue(v)}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Administration</h1>
        <p className="text-muted-foreground text-sm mt-1">Admin/staff scoped profile management</p>
      </div>

      {listQuery.error && <p className="text-destructive text-sm">{(listQuery.error as Error).message}</p>}

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="space-y-1.5 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, Matrimony ID, or phone…"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="pl-9"
              />
            </div>
            {looksLikePhone(search.trim()) ? (
              <p className="text-[11px] text-muted-foreground pl-1">
                Searching by phone — if there are no matches, the backend may need to include
                <code className="mx-1 px-1 rounded bg-muted text-[10px]">phone</code>
                in its profile search/filter fields.
              </p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <Select
              value={pageSize}
              onValueChange={(v) => {
                setPage(1);
                setPageSize(v);
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
            {(listQuery.isLoading || listQuery.isFetching) && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrimony ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Religion</TableHead>
                <TableHead>Caste</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Assigned Staff</TableHead>
                <TableHead>Complete</TableHead>
                <TableHead>Blocked</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    Loading profiles...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-6">
                    <p>No profiles found.</p>
                    {looksLikePhone(search.trim()) ? (
                      <p className="text-xs mt-2">
                        Phone search returned 0 results. Confirm the backend allows phone in its
                        profile search/filter fields (e.g. add <code className="px-1 rounded bg-muted">"phone"</code> to
                        the ViewSet&apos;s <code className="px-1 rounded bg-muted">search_fields</code>).
                      </p>
                    ) : null}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((p) => (
                <TableRow key={p.matri_id} className={!p.is_active ? "opacity-60" : ""}>
                  <TableCell className="font-mono text-xs">{p.matri_id}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.gender}</TableCell>
                  <TableCell>{p.age}</TableCell>
                  <TableCell>{p.religion}</TableCell>
                  <TableCell>{p.caste}</TableCell>
                  <TableCell><Badge variant="outline">{p.plan || "—"}</Badge></TableCell>
                  <TableCell>{p.assigned_staff || "—"}</TableCell>
                  <TableCell>{p.completion_percent}%</TableCell>
                  <TableCell>
                    <Badge variant={p.is_blocked ? "destructive" : "secondary"}>{p.is_blocked ? "Blocked" : "Active"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => void openView(p)}>
                        <Eye className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      {role === "admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Edit"
                          onClick={() => void openEdit(p)}
                        >
                          <Edit className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Block / Unblock" onClick={() => setPendingAction({ kind: "block", row: p })}>
                        <Ban className={`h-3.5 w-3.5 ${p.is_blocked ? "text-success" : "text-destructive"}`} />
                      </Button>
                      {role === "admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Assign Staff"
                          onClick={() => {
                            setAssignRow(p);
                            const pre = staffRows.find((s) => s.name === p.assigned_staff);
                            setAssignStaffId(pre ? String(pre.id) : "");
                          }}
                        >
                          <UserPlus className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      )}
                      {role === "admin" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Delete" onClick={() => setPendingAction({ kind: "delete", row: p })}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {rows.length} of {total} records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!canNext}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewProfile} onOpenChange={() => { setViewProfile(null); setViewDetail(null); }}>
        <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>Profile Details — {viewProfile?.matri_id}</DialogTitle>
            <DialogDescription className="sr-only">
              View complete profile details.
            </DialogDescription>
            {viewDetail?.id != null && (
              <p className="text-xs text-muted-foreground font-mono">Record ID: {String(detail.id)}</p>
            )}
          </DialogHeader>
          {viewProfile && (
            <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
              <div className="space-y-5 text-sm pr-3">
                {!viewDetail && (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading profile from GET v1/admin/profiles/&lt;matri_id&gt;/…
                  </div>
                )}
                {viewDetail && (
                  <>
                    <Section title="Basic details">
                      <FieldGrid
                        rows={[
                          ["Name", basic.name],
                          ["Gender", basic.gender],
                          ["Date of birth", basic.dob],
                          ["Email", basic.email],
                          ["Phone", basic.phone],
                          ["Profile for", basic.profile_for],
                        ]}
                      />
                    </Section>

                    <Separator />

                    <Section title="Photos">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(photos).map(([key, url]) => {
                          if (!url) return null;
                          const label = key.replace(/_/g, " ");
                          return (
                            <div key={key} className="rounded-md border overflow-hidden bg-muted/30">
                              <p className="text-xs text-muted-foreground px-2 pt-2 capitalize">{label}</p>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="block p-2">
                                <img
                                  src={url}
                                  alt={label}
                                  className="w-full max-h-36 object-contain rounded"
                                />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                      {Object.values(photos).every((u) => !u) && (
                        <p className="text-muted-foreground text-sm">No photos uploaded.</p>
                      )}
                    </Section>

                    <Separator />

                    <Section title="Religion & partner preference">
                      <FieldGrid
                        rows={[
                          ["Religion", religion.religion ?? religion.religion_id],
                          ["Caste", religion.caste ?? religion.caste_id],
                          ["Mother tongue", religion.mother_tongue ?? religion.mother_tongue_id],
                          ["Partner religion preference", religion.partner_religion_preference],
                          ["Partner preference type", religion.partner_preference_type],
                          ["Partner religion IDs", religion.partner_religion_ids],
                          ["Partner caste preference", religion.partner_caste_preference],
                        ]}
                      />
                    </Section>

                    <Separator />

                    <Section title="Personal">
                      <FieldGrid
                        rows={[
                          ["Marital status", personal.marital_status ?? personal.marital_status_id],
                          ["Children count", personal.children_count ?? personal.number_of_children],
                          ["Height", personal.height_cm],
                          ["Weight (kg)", personal.weight_kg],
                          ["Complexion", personal.colour ?? personal.complexion],
                          ["Blood group", personal.blood_group],
                        ]}
                      />
                    </Section>

                    <Separator />

                    <Section title="Location">
                      <FieldGrid
                        rows={[
                          ["Country", location.country ?? location.country_id],
                          ["State", location.state ?? location.state_id],
                          ["District", location.district ?? location.district_id],
                          ["City", location.city ?? location.city_id],
                          ["Address", location.address],
                        ]}
                      />
                    </Section>

                    <Separator />

                    <Section title="Education & career">
                      <FieldGrid
                        rows={[
                          ["Highest education", education.highest_education ?? education.highest_education_id],
                          ["Subject", education.education_subject ?? education.education_subject_id],
                          ["Employment status", education.employment_status],
                          ["Occupation", education.occupation ?? education.occupation_id],
                          ["Annual income", education.annual_income ?? education.annual_income_id],
                        ]}
                      />
                    </Section>

                    <Separator />

                    <Section title="Family">
                      <FieldGrid
                        rows={[
                          ["Father", family.father_name],
                          ["Father occupation", family.father_occupation],
                          ["Mother", family.mother_name],
                          ["Mother occupation", family.mother_occupation],
                          ["Brothers", family.brothers],
                          ["Married brothers", family.married_brothers],
                          ["Sisters", family.sisters],
                          ["Married sisters", family.married_sisters],
                          ["About family", family.about_family],
                        ]}
                      />
                    </Section>

                    {detail.about_me != null && String(detail.about_me).trim() !== "" && (
                      <>
                        <Separator />
                        <Section title="About me">
                          <div className="rounded-md border bg-card p-3">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{String(detail.about_me)}</p>
                          </div>
                        </Section>
                      </>
                    )}

                    <Separator />

                    <Section title="Admin">
                      <FieldGrid
                        rows={[
                          ["Profile status", admin.profile_status],
                          ["Completion %", admin.profile_completion_percentage],
                          ["Admin verified", admin.admin_verified],
                          ["Horoscope available", admin.has_horoscope],
                          ["Blocked", admin.is_blocked],
                        ]}
                      />
                    </Section>
                  </>
                )}

                {!viewDetail && viewProfile && (
                  <div className="grid grid-cols-2 gap-3 opacity-80">
                    {[
                      ["Name", viewProfile.name],
                      ["Gender", viewProfile.gender],
                      ["Age", viewProfile.age],
                      ["Religion", viewProfile.religion],
                      ["Caste", viewProfile.caste],
                      ["Marital status", viewProfile.marital_status],
                      ["Plan", displayOrDash(viewProfile.plan)],
                      ["Assigned staff", displayOrDash(viewProfile.assigned_staff)],
                    ].map(([k, v]) => (
                      <div key={String(k)} className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">{k}</p>
                        <p className="font-medium">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editRow}
        onOpenChange={(o) => {
          if (!o) {
            setEditRow(null);
            setEditDetail(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile — {editRow?.matri_id}</DialogTitle>
            <DialogDescription className="sr-only">
              Update profile registration fields and save changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {!editDetail && editRow && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading profile…
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Profile For</Label>
                <Select
                  value={editForm.profileFor || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, profileFor: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFILE_FOR_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={editForm.fullName} onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={editForm.gender || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, gender: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Select
                  value={editForm.countryId || undefined}
                  onValueChange={(v) =>
                    setEditForm((p) => ({ ...p, countryId: v, stateId: "", districtId: "", cityId: "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editCountriesQ.data?.results ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select
                  value={editForm.stateId || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, stateId: v, districtId: "", cityId: "" }))}
                  disabled={!editForm.countryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editStatesQ.data?.results ?? []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Select
                  value={editForm.districtId || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, districtId: v, cityId: "" }))}
                  disabled={!editForm.stateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editDistrictsQ.data?.results ?? []).map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Select
                  value={editForm.cityId || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, cityId: v }))}
                  disabled={!editForm.districtId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editCitiesQ.data?.results ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Religion</Label>
                <Select
                  value={editForm.religionId || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, religionId: v, casteId: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editReligionsQ.isLoading ? "Loading…" : "Select religion"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(editReligionsQ.data?.results ?? []).map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Caste</Label>
                <Select
                  value={editForm.casteId || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, casteId: v }))}
                  disabled={!editForm.religionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editCastesQ.isLoading ? "Loading…" : "Select caste"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(editCastesQ.data?.results ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mother Tongue</Label>
                <Select
                  value={editForm.motherTongueId || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, motherTongueId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editMotherTonguesQ.isLoading ? "Loading…" : "Select mother tongue"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(editMotherTonguesQ.data?.results ?? []).map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Partner preference</Label>
                <Select
                  value={editForm.partnerPreferenceType || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, partnerPreferenceType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTNER_PREF_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Partner caste preference</Label>
                <Select
                  value={editForm.partnerCastePreference || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, partnerCastePreference: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTNER_CASTE_PREF_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marital Status</Label>
                <Select
                  value={editForm.maritalStatusId || undefined}
                  onValueChange={(v) => {
                    const rows = editMaritalStatusesQ.data?.results;
                    const sel = rows?.find((m) => String(m.id) === v);
                    const req = sel ? maritalStatusNameRequiresChildren(sel.name) : false;
                    setEditForm((p) => ({
                      ...p,
                      maritalStatusId: v,
                      ...(!req ? { hasChildren: "" as const, childrenCount: "" } : {}),
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editMaritalStatusesQ.isLoading ? "Loading…" : "Select marital status"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(editMaritalStatusesQ.data?.results ?? []).map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {maritalRowRequiresChildren(editForm.maritalStatusId, editMaritalStatusesQ.data?.results) && (
                <>
                  <div className="space-y-2">
                    <Label>Has children</Label>
                    <Select
                      value={editForm.hasChildren || undefined}
                      onValueChange={(v) =>
                        setEditForm((p) => ({
                          ...p,
                          hasChildren: v as "yes" | "no",
                          childrenCount: v === "no" ? "" : p.childrenCount,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editForm.hasChildren === "yes" && (
                    <div className="space-y-2">
                      <Label>Number of children</Label>
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={editForm.childrenCount}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            childrenCount: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                      />
                    </div>
                  )}
                </>
              )}
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input value={editForm.height} onChange={(e) => setEditForm((p) => ({ ...p, height: e.target.value.replace(/[^0-9]/g, "") }))} />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input value={editForm.weight} onChange={(e) => setEditForm((p) => ({ ...p, weight: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Complexion</Label>
                <Input value={editForm.complexion} onChange={(e) => setEditForm((p) => ({ ...p, complexion: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Annual Income</Label>
                <Select
                  value={editForm.annualIncomeId || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, annualIncomeId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editIncomeRangesQ.isLoading ? "Loading…" : "Select income range"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(editIncomeRangesQ.data?.results ?? []).map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Highest Education</Label>
                <Select
                  value={editForm.highestEducationId || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, highestEducationId: v, educationSubjectId: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editEducationsQ.isLoading ? "Loading…" : "Select education"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(editEducationsQ.data?.results ?? []).map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Education Subject</Label>
                <Select
                  value={editForm.educationSubjectId || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, educationSubjectId: v }))}
                  disabled={!editForm.highestEducationId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editSubjectsQ.isLoading ? "Loading…" : "Select subject"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(editSubjectsQ.data?.results ?? []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Employment Status</Label>
                <Select
                  value={editForm.employmentStatusId || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, employmentStatusId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editEmploymentQ.isLoading ? "Loading…" : "Select employment"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(editEmploymentQ.data?.results ?? []).map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Occupation</Label>
                <Select
                  value={editForm.occupationId || undefined}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, occupationId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editOccupationsQ.isLoading ? "Loading…" : "Select occupation"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(editOccupationsQ.data?.results ?? []).map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>About Me</Label>
                <Textarea value={editForm.aboutMe} onChange={(e) => setEditForm((p) => ({ ...p, aboutMe: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Aadhaar Number</Label>
                <Input value={editForm.aadhaarNumber} onChange={(e) => setEditForm((p) => ({ ...p, aadhaarNumber: e.target.value }))} />
              </div>

              <div className="sm:col-span-2 space-y-3 pt-2 border-t">
                <p className="text-sm font-medium">Photos &amp; documents</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      ["full_photo", "Full photo"],
                      ["passport_photo", "Passport photo"],
                      ["profile_photo", "Profile photo"],
                      ["selfie_photo", "Selfie photo"],
                      ["family_photo", "Family photo"],
                      ["aadhaar_front", "Aadhaar front"],
                      ["aadhaar_back", "Aadhaar back"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        className="text-xs"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          setEditForm((p) => ({ ...p, [key]: f ?? null } as typeof p));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditRow(null);
                  setEditDetail(null);
                }}
                disabled={editMut.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={saveEditProfile}
                disabled={!editRow || !editDetail || editMut.isPending || editForm.fullName.trim() === ""}
              >
                {editMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingAction != null} onOpenChange={(o) => !o && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.kind === "block" && `${pendingAction.row.is_blocked ? "Unblock" : "Block"} profile?`}
              {pendingAction?.kind === "delete" && "Delete profile?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.row && `Profile: ${pendingAction.row.matri_id} · ${pendingAction.row.name}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingAction) return;
                if (pendingAction.kind === "block") blockMut.mutate(pendingAction.row);
                if (pendingAction.kind === "delete") deleteMut.mutate(pendingAction.row.matri_id);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!assignRow}
        onOpenChange={(o) => {
          if (!o) {
            setAssignRow(null);
            setAssignStaffId("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Profile: <span className="font-medium text-foreground">{assignRow?.matri_id} · {assignRow?.name}</span>
            </p>
            <Select value={assignStaffId} onValueChange={setAssignStaffId}>
              <SelectTrigger>
                <SelectValue placeholder={staffQuery.isLoading ? "Loading staff..." : "Select staff"} />
              </SelectTrigger>
              <SelectContent>
                {staffRows.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} ({s.emp_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {staffQuery.error && <p className="text-xs text-destructive">{(staffQuery.error as Error).message}</p>}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setAssignRow(null)} disabled={assignMut.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                assignRow &&
                assignStaffId &&
                assignMut.mutate({ matriId: assignRow.matri_id, staffId: Number(assignStaffId) })
              }
              disabled={!assignStaffId || assignMut.isPending}
            >
              {assignMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
