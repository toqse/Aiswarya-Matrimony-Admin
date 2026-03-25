import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { subscriptionPlans } from "@/data/mockData";
import {
  Search, Plus, Eye, Edit, RefreshCw, Heart, Mail, StickyNote,
  UserCheck, UserX, AlertTriangle, Users, CreditCard, CheckCircle2, XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddProfileWizard from "@/components/profile/AddProfileWizard";
import type { ProfileListRow, ProfilesQuery } from "@/lib/admin-api/profiles";
import {
  createStaffProfile,
  fetchStaffMyProfilesSummary,
  fetchStaffProfiles,
  fetchStaffProfileDetail,
  patchStaffProfile,
  refreshStaffProfile,
  sendStaffProfileEmail,
  toggleStaffProfileWishlist,
} from "@/lib/admin-api/profiles";
import { fetchCities, fetchCountries, fetchDistricts, fetchStates } from "@/lib/admin-api/master";

const statusFilters = ["All", "Incomplete", "Complete", "Subscribed", "Unsubscribed", "Verified", "Unverified"];

function filterToApi(filter: string): ProfilesQuery["filter"] {
  switch (filter) {
    case "Incomplete":
      return "incomplete";
    case "Complete":
      return "complete";
    case "Subscribed":
      return "subscribed";
    case "Unsubscribed":
      return "unsubscribed";
    case "Verified":
      return "verified";
    case "Unverified":
      return "unverified";
    default:
      return "all";
  }
}

function isoToDDMMYYYY(iso: string): string {
  // iso expected: YYYY-MM-DD
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

function showValue(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value);
}

export default function MyProfiles() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewProfile, setViewProfile] = useState<ProfileListRow | null>(null);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfile, setEditProfile] = useState<ProfileListRow | null>(null);
  const [editForm, setEditForm] = useState({
    profileFor: "myself",
    fullName: "",
    mobile: "",
    email: "",
    dob: "",
    gender: "",
    countryId: "",
    stateId: "",
    districtId: "",
    cityId: "",
    address: "",
    religion: "",
    motherTongue: "",
    maritalStatus: "",
    hasChildren: false,
    numberOfMarriages: "",
    numberOfChildren: "",
    height: "",
    weight: "",
    complexion: "",
    annualIncome: "",
    highestEducation: "",
    educationSubject: "",
    employmentStatus: "",
    occupation: "",
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
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteTarget, setNoteTarget] = useState<string>("");
  const [noteText, setNoteText] = useState("");
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [renewTarget, setRenewTarget] = useState<ProfileListRow | null>(null);
  const [renewPlan, setRenewPlan] = useState("");
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [matchTarget, setMatchTarget] = useState<ProfileListRow | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTarget, setEmailTarget] = useState<ProfileListRow | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const summaryQ = useQuery({
    queryKey: ["staff", "profiles", "summary"],
    queryFn: () => fetchStaffMyProfilesSummary(),
  });

  const listQ = useQuery({
    queryKey: ["staff", "profiles", "list", search, statusFilter],
    queryFn: () =>
      fetchStaffProfiles({
        search: search.trim() || undefined,
        filter: filterToApi(statusFilter),
        page: 1,
      }),
  });

  const profiles = listQ.data?.results ?? [];

  const viewDetailQ = useQuery({
    queryKey: ["staff", "profiles", "detail", viewProfile?.matri_id],
    queryFn: () => fetchStaffProfileDetail(String(viewProfile?.matri_id ?? "")),
    enabled: !!viewProfile?.matri_id,
  });

  const expiringProfiles = useMemo(
    () => profiles.filter((p) => (p.subscription_plan ?? "") !== "" && (p.completeness ?? p.completion_percent ?? 0) < 80),
    [profiles],
  );

  const createMut = useMutation({
    mutationFn: (payload: FormData | Record<string, unknown>) => createStaffProfile(payload),
    onSuccess: async (res) => {
      const matriId = String((res as { matri_id?: string }).matri_id ?? "");
      toast({
        title: "Profile Created",
        description: matriId ? `Created successfully: ${matriId}` : "Created successfully",
      });
      setShowAddProfile(false);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["staff", "profiles", "summary"] }),
        qc.invalidateQueries({ queryKey: ["staff", "profiles", "list"] }),
      ]);
    },
    onError: (e) => toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }),
  });

  const editCountriesQ = useQuery({
    queryKey: ["master", "countries", "edit-profile"],
    queryFn: () => fetchCountries({ page_size: 200 }),
    enabled: showEditProfile,
  });
  const editStatesQ = useQuery({
    queryKey: ["master", "states", "edit-profile", editForm.countryId],
    queryFn: () => fetchStates({ country_id: Number(editForm.countryId), page_size: 200 }),
    enabled: showEditProfile && !!editForm.countryId,
  });
  const editDistrictsQ = useQuery({
    queryKey: ["master", "districts", "edit-profile", editForm.stateId],
    queryFn: () => fetchDistricts({ state_id: Number(editForm.stateId), page_size: 200 }),
    enabled: showEditProfile && !!editForm.stateId,
  });
  const editCitiesQ = useQuery({
    queryKey: ["master", "cities", "edit-profile", editForm.districtId],
    queryFn: () => fetchCities({ district_id: Number(editForm.districtId), page_size: 200 }),
    enabled: showEditProfile && !!editForm.districtId,
  });

  const patchMut = useMutation({
    mutationFn: ({ matriId, body }: { matriId: string; body: FormData }) => patchStaffProfile(matriId, body),
    onSuccess: async () => {
      toast({ title: "Profile Updated", description: "Changes saved successfully." });
      setShowEditProfile(false);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["staff", "profiles", "summary"] }),
        qc.invalidateQueries({ queryKey: ["staff", "profiles", "list"] }),
      ]);
    },
    onError: (e) => toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }),
  });

  const openEdit = (p: ProfileListRow) => {
    setEditProfile(p);
    setEditForm((prev) => ({
      ...prev,
      fullName: p.name ?? "",
      gender: p.gender ?? "",
      religion: p.religion ?? "",
      maritalStatus: p.marital_status ?? "",
    }));
    setShowEditProfile(true);
  };

  const saveEditProfile = () => {
    if (!editProfile) return;
    const gender = editForm.gender === "Male" ? "M" : editForm.gender === "Female" ? "F" : "O";
    const registration = {
      profile_for: editForm.profileFor || undefined,
      basic_details: {
        name: editForm.fullName || undefined,
        email: editForm.email || undefined,
        gender: gender !== "O" ? gender : undefined,
      },
      location_details: {
        country_id: editForm.countryId ? Number(editForm.countryId) : undefined,
        state_id: editForm.stateId ? Number(editForm.stateId) : undefined,
        district_id: editForm.districtId ? Number(editForm.districtId) : undefined,
        city_id: editForm.cityId ? Number(editForm.cityId) : undefined,
        address: editForm.address || undefined,
      },
      religion_details: {
        religion: editForm.religion || undefined,
        mother_tongue: editForm.motherTongue || undefined,
      },
      personal_details: {
        marital_status: editForm.maritalStatus || undefined,
        height_cm: editForm.height ? Number(editForm.height) : undefined,
        weight_kg: editForm.weight || undefined,
        complexion: editForm.complexion || undefined,
      },
      education_details: {
        highest_education: editForm.highestEducation || undefined,
        education_subject: editForm.educationSubject || undefined,
        employment_status: editForm.employmentStatus || undefined,
        occupation: editForm.occupation || undefined,
        annual_income: editForm.annualIncome || undefined,
      },
      about_me: editForm.aboutMe || undefined,
      aadhaar_number: editForm.aadhaarNumber || undefined,
    } as Record<string, unknown>;

    const fd = new FormData();
    fd.append("registration", JSON.stringify(registration));
    (
      [
        "full_photo",
        "passport_photo",
        "profile_photo",
        "selfie_photo",
        "family_photo",
        "aadhaar_front",
        "aadhaar_back",
      ] as const
    ).forEach((k) => {
      const f = editForm[k];
      if (f instanceof File) fd.append(k, f);
    });
    patchMut.mutate({ matriId: editProfile.matri_id, body: fd });
  };

  const addNote = () => {
    toast({ title: "Note Added", description: `Note added to ${noteTarget}` });
    setShowNoteDialog(false);
    setNoteText("");
  };

  const handleRenew = () => {
    if (!renewTarget || !renewPlan) return;
    const plan = subscriptionPlans.find(p => p.name === renewPlan);
    setShowRenewDialog(false);
    setRenewPlan("");
    toast({ title: "Subscription Renewed", description: `${renewTarget.name} upgraded to ${renewPlan} plan (₹${plan?.price || 0})` });
  };

  const getMatches = (profile: ProfileListRow) =>
    profiles.filter((p) => p.matri_id !== profile.matri_id && p.gender !== profile.gender && p.religion === profile.religion);

  const handleSendEmail = () => {
    if (!emailTarget || !emailSubject) return;
    // Staff API supports template_id only; map current UI to a default template.
    sendEmailMut.mutate({ matriId: emailTarget.matri_id, templateId: 1 });
  };

  const refreshMut = useMutation({
    mutationFn: (matriId: string) => refreshStaffProfile(matriId),
    onSuccess: async () => {
      toast({ title: "Refreshed", description: "Profile completeness refreshed." });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["staff", "profiles", "summary"] }),
        qc.invalidateQueries({ queryKey: ["staff", "profiles", "list"] }),
      ]);
    },
    onError: (e) => toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }),
  });

  const wishlistMut = useMutation({
    mutationFn: (matriId: string) => toggleStaffProfileWishlist(matriId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["staff", "profiles", "list"] });
    },
    onError: (e) => toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }),
  });

  const sendEmailMut = useMutation({
    mutationFn: ({ matriId, templateId }: { matriId: string; templateId: number }) =>
      sendStaffProfileEmail(matriId, { template_id: templateId }),
    onSuccess: () => {
      toast({ title: "Email Sent", description: "Email sent successfully." });
      setShowEmailDialog(false);
      setEmailSubject("");
      setEmailBody("");
    },
    onError: (e) => toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }),
  });

  const kpis = [
    { label: "Total Profiles", value: summaryQ.data?.total_profiles ?? profiles.length, icon: Users, color: "text-primary" },
    { label: "Verified", value: summaryQ.data?.verified ?? profiles.filter(p => (p.is_verified ?? p.verified) === true).length, icon: CheckCircle2, color: "text-success" },
    { label: "Unverified", value: summaryQ.data?.unverified ?? profiles.filter(p => (p.is_verified ?? p.verified) !== true).length, icon: XCircle, color: "text-warning" },
    { label: "Subscribed", value: summaryQ.data?.subscribed ?? profiles.filter(p => (p.subscription_plan ?? p.plan ?? "") !== "").length, icon: CreditCard, color: "text-info" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profiles</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage profiles created or assigned to you</p>
        </div>
        <Button onClick={() => setShowAddProfile(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4" /> Add New Profile
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Alert */}
      {(summaryQ.data?.incomplete_count ?? expiringProfiles.length) > 0 && (
        <Card className="border-l-4 border-l-warning bg-warning/5 shadow-elegant border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="font-semibold text-sm text-warning">Subscription Alert</p>
              <p className="text-xs text-muted-foreground">
                {summaryQ.data?.incomplete_message ?? `${expiringProfiles.length} profile(s) with incomplete data need attention`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {statusFilters.map((f) => (
                <Button key={f} variant={statusFilter === f ? "default" : "outline"} size="sm"
                  onClick={() => setStatusFilter(f)} className="text-xs">
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profile ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Religion / Caste</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completeness</TableHead>
                <TableHead>Quick Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => (
                <TableRow
                  key={p.matri_id}
                  className={(p.completeness ?? p.completion_percent ?? 0) < 50 ? "bg-warning/5" : ""}
                >
                  <TableCell className="font-mono text-xs">{p.matri_id}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.gender}</TableCell>
                  <TableCell>{p.age}</TableCell>
                  <TableCell className="text-sm">{p.religion} / {p.caste}</TableCell>
                  <TableCell>
                    <Badge
                      variant={(p.subscription_plan ?? "") ? "default" : "outline"}
                      className={(p.subscription_plan ?? "") ? "bg-accent text-accent-foreground" : ""}
                    >
                      {p.subscription_plan ?? "None"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(p.is_verified ?? p.verified) ? (
                      <Badge className="bg-success text-success-foreground gap-1"><UserCheck className="h-3 w-3" /> Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground gap-1"><UserX className="h-3 w-3" /> Unverified</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress value={p.completeness ?? p.completion_percent ?? 0} className="h-2 flex-1" />
                      <span className="text-xs font-medium text-muted-foreground">{p.completeness ?? p.completion_percent ?? 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-500/10" title="Edit Profile"
                        onClick={() => openEdit(p)}>
                        <Edit className="h-3.5 w-3.5 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-violet-500/10" title="View Profile"
                        onClick={() => setViewProfile(p)}>
                        <Eye className="h-3.5 w-3.5 text-violet-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-500/10" title="Renew Subscription"
                        onClick={() => { setRenewTarget(p); setRenewPlan((p.subscription_plan ?? "") || ""); setShowRenewDialog(true); }}>
                        <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-pink-500/10" title="View Matches"
                        onClick={() => { setMatchTarget(p); setShowMatchDialog(true); }}>
                        <Heart className="h-3.5 w-3.5 text-pink-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-amber-500/10" title="Send Email"
                        onClick={() => { setEmailTarget(p); setShowEmailDialog(true); }}>
                        <Mail className="h-3.5 w-3.5 text-amber-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-teal-500/10" title="Add Note"
                        onClick={() => { setNoteTarget(p.name); setShowNoteDialog(true); }}>
                        <StickyNote className="h-3.5 w-3.5 text-teal-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        title="Refresh completeness"
                        onClick={() => refreshMut.mutate(p.matri_id)}
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Profile Dialog */}
      <Dialog
        open={!!viewProfile}
        onOpenChange={(o) => {
          if (!o) setViewProfile(null);
        }}
      >
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>
              Profile Details — {viewProfile?.matri_id}
            </DialogTitle>
            {!!viewProfile?.name && (
              <p className="text-xs text-muted-foreground">{viewProfile.name}</p>
            )}
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 pb-6">
            {viewDetailQ.isLoading && (
              <p className="text-sm text-muted-foreground py-6">Loading profile…</p>
            )}
            {viewDetailQ.error && (
              <p className="text-sm text-destructive py-6">{(viewDetailQ.error as Error).message}</p>
            )}

            {viewDetailQ.data && (
              <div className="space-y-5 text-sm pr-3">
                {(() => {
                  const detail = viewDetailQ.data ?? {};
                  const basic = (detail.basic_details as Record<string, unknown> | undefined) ?? {};
                  const religion = (detail.religion_details as Record<string, unknown> | undefined) ?? {};
                  const personal = (detail.personal_details as Record<string, unknown> | undefined) ?? {};
                  const location = (detail.location_details as Record<string, unknown> | undefined) ?? {};
                  const education = (detail.education_details as Record<string, unknown> | undefined) ?? {};
                  const family = (detail.family_details as Record<string, unknown> | undefined) ?? {};
                  const admin = (detail.admin as Record<string, unknown> | undefined) ?? {};
                  const photos = (detail.photos as Record<string, string | null> | undefined) ?? {};

                  const FieldGrid = ({ rows }: { rows: [string, unknown][] }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rows.map(([k, v]) => (
                        <div key={k} className="rounded-md border bg-card p-3">
                          <p className="text-xs text-muted-foreground">{k}</p>
                          <p className="font-medium text-sm break-words">{showValue(v)}</p>
                        </div>
                      ))}
                    </div>
                  );

                  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                      {children}
                    </div>
                  );

                  return (
                    <>
                      <Section title="Record">
                        <FieldGrid
                          rows={[
                            ["Matrimony ID", detail.matri_id],
                            ["Profile UUID", detail.id],
                          ]}
                        />
                      </Section>

                      <Separator />

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

                      {Object.values(photos).some(Boolean) && (
                        <>
                          <Separator />
                          <Section title="Photos">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {Object.entries(photos).map(([key, url]) => {
                                if (!url) return null;
                                return (
                                  <a
                                    key={key}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-md border bg-card p-2 hover:bg-muted/40 transition-colors"
                                  >
                                    <p className="text-xs text-muted-foreground mb-2 capitalize">{key.replace(/_/g, " ")}</p>
                                    <img
                                      src={url}
                                      alt={key}
                                      className="w-full h-24 object-cover rounded"
                                    />
                                  </a>
                                );
                              })}
                            </div>
                          </Section>
                        </>
                      )}

                      {typeof detail.about_me === "string" && detail.about_me.trim() !== "" && (
                        <>
                          <Separator />
                          <Section title="About me">
                            <div className="rounded-md border bg-card p-3">
                              <p className="text-sm whitespace-pre-wrap">{detail.about_me}</p>
                            </div>
                          </Section>
                        </>
                      )}

                      {Object.keys(family).length > 0 && (
                        <>
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
                        </>
                      )}
                    </>
                  );
                })()}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!viewProfile) return;
                      setViewProfile(null);
                      setEditProfile(viewProfile);
                      setShowEditProfile(true);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!viewProfile) return;
                      setViewProfile(null);
                      setRenewTarget(viewProfile);
                      setShowRenewDialog(true);
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Renew
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!viewProfile) return;
                      setViewProfile(null);
                      setMatchTarget(viewProfile);
                      setShowMatchDialog(true);
                    }}
                  >
                    <Heart className="h-3.5 w-3.5 mr-1" /> Matches
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add New Profile Wizard */}
      <AddProfileWizard
        open={showAddProfile}
        onOpenChange={setShowAddProfile}
        onComplete={(form: any) => {
          const gender = form.gender === "Male" ? "M" : form.gender === "Female" ? "F" : "O";
          const registration = {
            name: String(form.name ?? form.fullName ?? "").trim(),
            phone_number: String(form.mobile ?? "").trim(),
            gender,
            dob: isoToDDMMYYYY(String(form.dob ?? "")),
            email: form.email ? String(form.email).trim() : undefined,
            terms_accepted: true,
            profile_for: String(form.profileFor ?? "myself").toLowerCase(),
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
              partner_preference_type: form.partnerPreferenceType || undefined,
              partner_religion_ids: Array.isArray(form.partnerReligionIds)
                ? form.partnerReligionIds.map((id: unknown) => Number(id)).filter((n: number) => Number.isFinite(n))
                : undefined,
              partner_caste_preference: form.partnerCastePreference || undefined,
            },
            personal_details: {
              marital_status: form.maritalStatus || undefined,
              height_cm: form.height ? Number(form.height) : undefined,
              weight_kg: form.weight || undefined,
              complexion: form.complexion || undefined,
            },
            education_details: {
              highest_education_id: form.highestEducationId ? Number(form.highestEducationId) : undefined,
              education_subject_id: form.educationSubjectId ? Number(form.educationSubjectId) : undefined,
              employment_status: form.employmentStatus || undefined,
              occupation_id: form.occupationId ? Number(form.occupationId) : undefined,
              annual_income_id: form.annualIncomeId ? Number(form.annualIncomeId) : undefined,
            },
            about_me: form.aboutMe || undefined,
            aadhaar_number: form.aadhaarNumber || undefined,
          } as Record<string, unknown>;

          const fd = new FormData();
          fd.append("registration", JSON.stringify(registration));

          const fileKeys = [
            "full_photo",
            "passport_photo",
            "profile_photo",
            "selfie_photo",
            "family_photo",
            "aadhaar_front",
            "aadhaar_back",
          ] as const;

          fileKeys.forEach((k) => {
            const f = form[k];
            if (f instanceof File) fd.append(k, f);
          });

          createMut.mutate(fd);
        }}
      />

      {/* Edit Profile Dialog — Full Fields */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Profile — {editProfile?.id}</DialogTitle></DialogHeader>
          {editProfile && (
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Profile For</Label>
                  <Select value={editForm.profileFor} onValueChange={(v) => setEditForm((p) => ({ ...p, profileFor: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["myself", "son", "daughter", "brother", "sister", "friend", "relative"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>Full Name</Label>
                    <Input value={editForm.fullName} onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={editForm.gender} onValueChange={(v) => setEditForm((p) => ({ ...p, gender: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Country</Label>
                    <Select
                      value={editForm.countryId}
                      onValueChange={(v) => setEditForm((p) => ({ ...p, countryId: v, stateId: "", districtId: "", cityId: "" }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        {(editCountriesQ.data?.results ?? []).map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select
                      value={editForm.stateId}
                      onValueChange={(v) => setEditForm((p) => ({ ...p, stateId: v, districtId: "", cityId: "" }))}
                      disabled={!editForm.countryId}
                    >
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {(editStatesQ.data?.results ?? []).map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>District</Label>
                    <Select
                      value={editForm.districtId}
                      onValueChange={(v) => setEditForm((p) => ({ ...p, districtId: v, cityId: "" }))}
                      disabled={!editForm.stateId}
                    >
                      <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                      <SelectContent>
                        {(editDistrictsQ.data?.results ?? []).map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>City</Label>
                    <Select
                      value={editForm.cityId}
                      onValueChange={(v) => setEditForm((p) => ({ ...p, cityId: v }))}
                      disabled={!editForm.districtId}
                    >
                      <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                      <SelectContent>
                        {(editCitiesQ.data?.results ?? []).map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Address</Label>
                    <Input value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Religion</Label>
                    <Input value={editForm.religion} onChange={(e) => setEditForm((p) => ({ ...p, religion: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Mother Tongue</Label>
                    <Input value={editForm.motherTongue} onChange={(e) => setEditForm((p) => ({ ...p, motherTongue: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Marital Status</Label>
                    <Select value={editForm.maritalStatus} onValueChange={(v) => setEditForm((p) => ({ ...p, maritalStatus: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Never Married">Never Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                        <SelectItem value="Awaiting Divorce">Awaiting Divorce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Height (cm)</Label>
                    <Input value={editForm.height} onChange={(e) => setEditForm((p) => ({ ...p, height: e.target.value.replace(/[^0-9]/g, "") }))} />
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input value={editForm.weight} onChange={(e) => setEditForm((p) => ({ ...p, weight: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Complexion</Label>
                    <Input value={editForm.complexion} onChange={(e) => setEditForm((p) => ({ ...p, complexion: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Annual Income</Label>
                    <Input value={editForm.annualIncome} onChange={(e) => setEditForm((p) => ({ ...p, annualIncome: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Highest Education</Label>
                    <Input value={editForm.highestEducation} onChange={(e) => setEditForm((p) => ({ ...p, highestEducation: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Education Subject</Label>
                    <Input value={editForm.educationSubject} onChange={(e) => setEditForm((p) => ({ ...p, educationSubject: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Employment Status</Label>
                    <Input value={editForm.employmentStatus} onChange={(e) => setEditForm((p) => ({ ...p, employmentStatus: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Occupation</Label>
                    <Input value={editForm.occupation} onChange={(e) => setEditForm((p) => ({ ...p, occupation: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <Label>About Me</Label>
                  <Textarea value={editForm.aboutMe} onChange={(e) => setEditForm((p) => ({ ...p, aboutMe: e.target.value }))} rows={4} />
                </div>

                <div>
                  <Label>Aadhaar Number</Label>
                  <Input
                    value={editForm.aadhaarNumber}
                    onChange={(e) => setEditForm((p) => ({ ...p, aadhaarNumber: e.target.value.replace(/\\D/g, "").slice(0, 12) }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>full_photo</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setEditForm((p) => ({ ...p, full_photo: e.target.files?.[0] ?? null }))} />
                  </div>
                  <div>
                    <Label>passport_photo</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setEditForm((p) => ({ ...p, passport_photo: e.target.files?.[0] ?? null }))} />
                  </div>
                  <div>
                    <Label>profile_photo</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setEditForm((p) => ({ ...p, profile_photo: e.target.files?.[0] ?? null }))} />
                  </div>
                  <div>
                    <Label>selfie_photo</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setEditForm((p) => ({ ...p, selfie_photo: e.target.files?.[0] ?? null }))} />
                  </div>
                  <div>
                    <Label>family_photo</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setEditForm((p) => ({ ...p, family_photo: e.target.files?.[0] ?? null }))} />
                  </div>
                  <div>
                    <Label>aadhaar_front</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setEditForm((p) => ({ ...p, aadhaar_front: e.target.files?.[0] ?? null }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>aadhaar_back</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setEditForm((p) => ({ ...p, aadhaar_back: e.target.files?.[0] ?? null }))} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProfile(false)}>Cancel</Button>
            <Button onClick={saveEditProfile} disabled={patchMut.isPending}>
              {patchMut.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Subscription Dialog */}
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Renew Subscription — {renewTarget?.name}</DialogTitle></DialogHeader>
          {renewTarget && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs">Current Plan</Label>
                <p className="font-semibold">{renewTarget.subscription === "None" ? "No active plan" : renewTarget.subscription}</p>
              </div>
              <div>
                <Label>Select New Plan</Label>
                <Select value={renewPlan} onValueChange={setRenewPlan}>
                  <SelectTrigger><SelectValue placeholder="Choose a plan" /></SelectTrigger>
                  <SelectContent>
                    {subscriptionPlans.filter(p => p.status === "active").map(p => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name} — ₹{p.price.toLocaleString()} ({p.duration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {renewPlan && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3 text-sm space-y-1">
                    {(() => {
                      const plan = subscriptionPlans.find(p => p.name === renewPlan);
                      return plan ? (
                        <>
                          <p><span className="text-muted-foreground">Plan:</span> <strong>{plan.name}</strong></p>
                          <p><span className="text-muted-foreground">Duration:</span> {plan.duration}</p>
                          <p><span className="text-muted-foreground">Price:</span> <strong>₹{plan.price.toLocaleString()}</strong></p>
                          <p><span className="text-muted-foreground">Interests:</span> {plan.interests === -1 ? "Unlimited" : plan.interests}</p>
                          <p><span className="text-muted-foreground">Contact Views:</span> {plan.contactViews === -1 ? "Unlimited" : plan.contactViews}</p>
                        </>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenewDialog(false)}>Cancel</Button>
            <Button onClick={handleRenew} disabled={!renewPlan} className="bg-emerald-600 hover:bg-emerald-700 text-white">Confirm Renewal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Match Viewer Dialog */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Matches for {matchTarget?.name}</DialogTitle></DialogHeader>
          {matchTarget && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Showing compatible profiles (opposite gender, same religion)</p>
              {getMatches(matchTarget).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No matches found for the current criteria.</p>
              ) : (
                getMatches(matchTarget).map(m => (
                  <Card key={m.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                          <Heart className="h-4 w-4 text-pink-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.age}y · {m.religion} / {m.caste} · {m.maritalStatus}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={m.verified ? "default" : "outline"} className={m.verified ? "bg-success text-success-foreground" : ""}>
                          {m.verified ? "Verified" : "Unverified"}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => { setShowMatchDialog(false); setViewProfile(m); }}>
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Send Email to {emailTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject *</Label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Enter email subject..." />
            </div>
            <div>
              <Label>Quick Templates</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  { label: "Profile Incomplete", subj: "Please Complete Your Profile", body: "Dear {name},\n\nWe noticed your profile is incomplete. Please log in and update your details to improve your match rate.\n\nBest Regards,\nAiswarya Matrimony" },
                  { label: "Subscription Reminder", subj: "Subscription Renewal Reminder", body: "Dear {name},\n\nYour subscription is expiring soon. Renew now to continue receiving match suggestions.\n\nBest Regards,\nAiswarya Matrimony" },
                  { label: "New Match", subj: "You Have a New Match!", body: "Dear {name},\n\nGreat news! We found a potential match for you. Log in to view the profile.\n\nBest Regards,\nAiswarya Matrimony" },
                ].map(t => (
                  <Button key={t.label} size="sm" variant="outline" className="text-xs"
                    onClick={() => { setEmailSubject(t.subj); setEmailBody(t.body.replace("{name}", emailTarget?.name || "")); }}>
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Type your message..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={!emailSubject} className="bg-amber-600 hover:bg-amber-700 text-white gap-1">
              <Mail className="h-3.5 w-3.5" /> Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Note — {noteTarget}</DialogTitle></DialogHeader>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Enter your note..." rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>Cancel</Button>
            <Button onClick={addNote} disabled={!noteText}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
