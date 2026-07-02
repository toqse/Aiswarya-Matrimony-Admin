import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Eye,
  Edit,
  RefreshCw,
  Heart,
  StickyNote,
  AlertTriangle,
  Users,
  CreditCard,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatDate } from "@/lib/format-date";
import ProfileSearchFilters from "@/components/profile/ProfileSearchFilters";
import { EMPTY_PROFILE_SEARCH, profileSearchToQuery } from "@/lib/profileSearch";
import AddProfileWizard from "@/components/profile/AddProfileWizard";
import EditProfileWizard from "@/components/profile/EditProfileWizard";
import {
  buildPartnerReligionDetails,
  buildProfileEditFormData,
  mapDetailToWizardForm,
  type WizardFormValues,
} from "@/lib/admin-api/profile-registration";
import type { ProfileListRow } from "@/lib/admin-api/profiles";
import {
  createStaffProfile,
  fetchStaffMyProfilesSummary,
  fetchStaffProfiles,
  fetchStaffProfileDetail,
  fetchStaffProfileMatches,
  fetchStaffProfilePublicDetail,
  patchStaffProfile,
  toggleStaffProfileWishlist,
} from "@/lib/admin-api/profiles";

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
  const [filters, setFilters] = useState(EMPTY_PROFILE_SEARCH);
  const [applied, setApplied] = useState(EMPTY_PROFILE_SEARCH);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("20");
  const [viewProfile, setViewProfile] = useState<ProfileListRow | null>(null);
  const [viewIsMatch, setViewIsMatch] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfile, setEditProfile] = useState<ProfileListRow | null>(null);
  const [editInitial, setEditInitial] = useState<WizardFormValues | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteTarget, setNoteTarget] = useState<string>("");
  const [noteText, setNoteText] = useState("");
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [matchTarget, setMatchTarget] = useState<ProfileListRow | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const goToCashPaymentForRenewal = (p: ProfileListRow) => {
    navigate("/cash-entry", {
      state: { renewProfile: { matri_id: p.matri_id, name: p.name } },
    });
  };

  const summaryQ = useQuery({
    queryKey: ["staff", "profiles", "summary"],
    queryFn: () => fetchStaffMyProfilesSummary(),
  });

  const listQ = useQuery({
    queryKey: ["staff", "profiles", "list", applied, page, pageSize],
    queryFn: () =>
      fetchStaffProfiles(
        profileSearchToQuery(applied, {
          page,
          page_size: Number(pageSize),
        }),
      ),
  });

  const profiles = listQ.data?.results ?? [];
  const total = listQ.data?.count ?? 0;
  const canPrev = Boolean(listQ.data?.previous) && page > 1;
  const canNext = Boolean(listQ.data?.next);

  const viewDetailQ = useQuery({
    queryKey: ["staff", "profiles", "detail", viewProfile?.matri_id, viewIsMatch],
    queryFn: () =>
      viewIsMatch
        ? fetchStaffProfilePublicDetail(String(viewProfile?.matri_id ?? ""))
        : fetchStaffProfileDetail(String(viewProfile?.matri_id ?? "")),
    enabled: !!viewProfile?.matri_id,
  });

  const matchesQ = useQuery({
    queryKey: ["staff", "profiles", "matches", matchTarget?.matri_id],
    queryFn: () => fetchStaffProfileMatches(String(matchTarget!.matri_id)),
    enabled: showMatchDialog && !!matchTarget?.matri_id,
  });

  const expiringProfiles = useMemo(
    () =>
      profiles.filter(
        (p) =>
          (p.subscription_plan ?? "") !== "" &&
          (p.completeness ?? p.completion_percent ?? 0) < 80,
      ),
    [profiles],
  );

  const createMut = useMutation({
    mutationFn: (payload: FormData | Record<string, unknown>) =>
      createStaffProfile(payload),
    onSuccess: async (res) => {
      const matriId = String((res as { matri_id?: string }).matri_id ?? "");
      toast({
        title: "Profile Created",
        description: matriId
          ? `Created successfully: ${matriId}`
          : "Created successfully",
      });
      setShowAddProfile(false);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["staff", "profiles", "summary"] }),
        qc.invalidateQueries({ queryKey: ["staff", "profiles", "list"] }),
      ]);
    },
    onError: (e) =>
      toast({
        title: "Failed",
        description: (e as Error).message,
        variant: "destructive",
      }),
  });

  const patchMut = useMutation({
    mutationFn: ({ matriId, body }: { matriId: string; body: FormData }) =>
      patchStaffProfile(matriId, body),
    onSuccess: async () => {
      toast({
        title: "Profile Updated",
        description: "Changes saved successfully.",
      });
      setShowEditProfile(false);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["staff", "profiles", "summary"] }),
        qc.invalidateQueries({ queryKey: ["staff", "profiles", "list"] }),
      ]);
    },
    onError: (e) =>
      toast({
        title: "Failed",
        description: (e as Error).message,
        variant: "destructive",
      }),
  });

  const openEdit = async (p: ProfileListRow) => {
    setEditProfile(p);
    setEditInitial(null);
    setShowEditProfile(true);
    try {
      const detail = await fetchStaffProfileDetail(p.matri_id);
      setEditInitial(mapDetailToWizardForm(detail as Record<string, unknown>, p));
    } catch (e) {
      toast({
        title: "Could not load full profile details",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const addNote = () => {
    toast({ title: "Note Added", description: `Note added to ${noteTarget}` });
    setShowNoteDialog(false);
    setNoteText("");
  };

  const wishlistMut = useMutation({
    mutationFn: (matriId: string) => toggleStaffProfileWishlist(matriId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["staff", "profiles", "list"] });
    },
    onError: (e) =>
      toast({
        title: "Failed",
        description: (e as Error).message,
        variant: "destructive",
      }),
  });

  const kpis = [
    {
      label: "Total Profiles",
      value: summaryQ.data?.total_profiles ?? profiles.length,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Verified",
      value:
        summaryQ.data?.verified ??
        profiles.filter((p) => (p.is_verified ?? p.verified) === true).length,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "Unverified",
      value:
        summaryQ.data?.unverified ??
        profiles.filter((p) => (p.is_verified ?? p.verified) !== true).length,
      icon: XCircle,
      color: "text-warning",
    },
    {
      label: "Subscribed",
      value:
        summaryQ.data?.subscribed ??
        profiles.filter((p) => (p.subscription_plan ?? p.plan ?? "") !== "")
          .length,
      icon: CreditCard,
      color: "text-info",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profiles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage profiles created or assigned to you
          </p>
        </div>
        <Button
          onClick={() => setShowAddProfile(true)}
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="h-4 w-4" /> Add New Profile
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card
            key={k.label}
            className="shadow-elegant border-0 hover:shadow-lg transition-shadow"
          >
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
              <p className="font-semibold text-sm text-warning">
                Subscription Alert
              </p>
              <p className="text-xs text-muted-foreground">
                {summaryQ.data?.incomplete_message ??
                  `${expiringProfiles.length} profile(s) with incomplete data need attention`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <ProfileSearchFilters
        value={filters}
        onChange={setFilters}
        onSearch={() => {
          setApplied(filters);
          setPage(1);
        }}
        onReset={() => {
          setFilters(EMPTY_PROFILE_SEARCH);
          setApplied(EMPTY_PROFILE_SEARCH);
          setPage(1);
        }}
        role="staff"
        showAssignedStaff={false}
      />

      {/* Profiles table */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3 justify-end">
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
                <TableHead>Quick Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => (
                <TableRow key={p.matri_id}>
                  <TableCell className="font-mono text-xs">
                    {p.matri_id}
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.gender}</TableCell>
                  <TableCell>{p.age}</TableCell>
                  <TableCell className="text-sm">
                    {p.religion} / {p.caste}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        (p.subscription_plan ?? "") ? "default" : "outline"
                      }
                      className={
                        (p.subscription_plan ?? "")
                          ? "bg-accent text-accent-foreground"
                          : ""
                      }
                    >
                      {p.subscription_plan ?? "None"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_blocked ? "destructive" : "secondary"}>
                      {p.is_blocked ? "Blocked" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-blue-500/10"
                        title="Edit Profile"
                        onClick={() => void openEdit(p)}
                      >
                        <Edit className="h-3.5 w-3.5 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-violet-500/10"
                        title="View Profile"
                        onClick={() => {
                          setViewIsMatch(false);
                          setViewProfile(p);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 text-violet-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-emerald-500/10"
                        title="Renew subscription — Cash & digital payment"
                        onClick={() => goToCashPaymentForRenewal(p)}
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-pink-500/10"
                        title="View Matches"
                        onClick={() => {
                          setMatchTarget(p);
                          setShowMatchDialog(true);
                        }}
                      >
                        <Heart className="h-3.5 w-3.5 text-pink-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-teal-500/10"
                        title="Add Note"
                        onClick={() => {
                          setNoteTarget(p.name);
                          setShowNoteDialog(true);
                        }}
                      >
                        <StickyNote className="h-3.5 w-3.5 text-teal-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {profiles.length} of {total} records
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

      {/* View Profile Dialog */}
      <Dialog
        open={!!viewProfile}
        onOpenChange={(o) => {
          if (!o) {
            setViewProfile(null);
            setViewIsMatch(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>Profile Details — {viewProfile?.matri_id}</DialogTitle>
            <DialogDescription className="sr-only">
              View complete profile details.
            </DialogDescription>
            {!!viewProfile?.name && (
              <p className="text-xs text-muted-foreground">
                {viewProfile.name}
              </p>
            )}
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 pb-6">
            {viewDetailQ.isLoading && (
              <p className="text-sm text-muted-foreground py-6">
                Loading profile…
              </p>
            )}
            {viewDetailQ.error && (
              <p className="text-sm text-destructive py-6">
                {(viewDetailQ.error as Error).message}
              </p>
            )}

            {viewDetailQ.data && (
              <div className="space-y-5 text-sm pr-3">
                {(() => {
                  const detail = viewDetailQ.data ?? {};
                  const basic =
                    (detail.basic_details as
                      | Record<string, unknown>
                      | undefined) ?? {};
                  const religion =
                    (detail.religion_details as
                      | Record<string, unknown>
                      | undefined) ?? {};
                  const personal =
                    (detail.personal_details as
                      | Record<string, unknown>
                      | undefined) ?? {};
                  const location =
                    (detail.location_details as
                      | Record<string, unknown>
                      | undefined) ?? {};
                  const education =
                    (detail.education_details as
                      | Record<string, unknown>
                      | undefined) ?? {};
                  const family =
                    (detail.family_details as
                      | Record<string, unknown>
                      | undefined) ?? {};
                  const admin =
                    (detail.admin as Record<string, unknown> | undefined) ?? {};
                  const photos =
                    (detail.photos as
                      | Record<string, string | null>
                      | undefined) ?? {};

                  const FieldGrid = ({
                    rows,
                  }: {
                    rows: [string, unknown][];
                  }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rows.map(([k, v]) => (
                        <div key={k} className="rounded-md border bg-card p-3">
                          <p className="text-xs text-muted-foreground">{k}</p>
                          <p className="font-medium text-sm break-words">
                            {showValue(v)}
                          </p>
                        </div>
                      ))}
                    </div>
                  );

                  const Section = ({
                    title,
                    children,
                  }: {
                    title: string;
                    children: React.ReactNode;
                  }) => (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {title}
                      </h3>
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
                            ["Date of birth", formatDate(basic.dob)],
                            ["Age", basic.age],
                            ["Email", basic.email],
                            ["Phone", formatPhoneDisplay(basic.phone)],
                            ["Profile for", basic.profile_for],
                          ]}
                        />
                      </Section>

                      <Separator />

                      <Section title="Location">
                        <FieldGrid
                          rows={[
                            [
                              "Country",
                              location.country ?? location.country_id,
                            ],
                            ["State", location.state ?? location.state_id],
                            [
                              "District",
                              location.district ?? location.district_id,
                            ],
                            ["City", location.city ?? location.city_id],
                            ["Address", location.address],
                          ]}
                        />
                      </Section>

                      <Separator />

                      <Section title="Religion & partner preference">
                        <FieldGrid
                          rows={[
                            [
                              "Religion",
                              religion.religion ?? religion.religion_id,
                            ],
                            ["Caste", religion.caste ?? religion.caste_id],
                            [
                              "Mother tongue",
                              religion.mother_tongue ??
                                religion.mother_tongue_id,
                            ],
                            [
                              "Partner religion preference",
                              religion.partner_religion_preference,
                            ],
                            [
                              "Partner preference type",
                              religion.partner_preference_type,
                            ],
                            [
                              "Partner religion IDs",
                              religion.partner_religion_ids,
                            ],
                            [
                              "Partner caste preference",
                              religion.partner_caste_preference,
                            ],
                          ]}
                        />
                      </Section>

                      <Separator />

                      <Section title="Personal">
                        <FieldGrid
                          rows={[
                            [
                              "Marital status",
                              personal.marital_status ??
                                personal.marital_status_id,
                            ],
                            [
                              "Children count",
                              personal.children_count ??
                                personal.number_of_children,
                            ],
                            ["Height", personal.height_cm],
                            ["Weight (kg)", personal.weight_kg],
                            [
                              "Complexion",
                              personal.colour ?? personal.complexion,
                            ],
                            ["Blood group", personal.blood_group],
                          ]}
                        />
                      </Section>

                      <Separator />

                      <Section title="Education & career">
                        <FieldGrid
                          rows={[
                            [
                              "Highest education",
                              education.highest_education ??
                                education.highest_education_id,
                            ],
                            [
                              "Subject",
                              education.education_subject ??
                                education.education_subject_id,
                            ],
                            ["Employment status", education.employment_status],
                            [
                              "Occupation",
                              education.occupation ?? education.occupation_id,
                            ],
                            [
                              "Annual income",
                              education.annual_income ??
                                education.annual_income_id,
                            ],
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
                                    <p className="text-xs text-muted-foreground mb-2 capitalize">
                                      {key.replace(/_/g, " ")}
                                    </p>
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

                      {typeof detail.about_me === "string" &&
                        detail.about_me.trim() !== "" && (
                          <>
                            <Separator />
                            <Section title="About me">
                              <div className="rounded-md border bg-card p-3">
                                <p className="text-sm whitespace-pre-wrap">
                                  {detail.about_me}
                                </p>
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
                                ["Father status", family.father_status === "Late" ? "Deceased" : family.father_status],
                                ["Father occupation", family.father_occupation],
                                ["Mother", family.mother_name],
                                ["Mother status", family.mother_status === "Late" ? "Deceased" : family.mother_status],
                                ["Mother occupation", family.mother_occupation],
                                ["Brothers", family.brothers],
                                ["Married brothers", family.married_brothers],
                                ["Sisters", family.sisters],
                                ["Married sisters", family.married_sisters],
                                ["Family type", family.family_type],
                                ["Family status", family.family_status],
                                ["Family contact", family.family_contact],
                                ["Family contact 2", family.family_contact_2],
                                ["About family", family.about_family],
                              ]}
                            />
                          </Section>
                        </>
                      )}
                    </>
                  );
                })()}

                {!viewIsMatch && (
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
                        const vp = viewProfile;
                        setViewProfile(null);
                        goToCashPaymentForRenewal(vp);
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
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add New Profile Wizard */}
      <AddProfileWizard
        open={showAddProfile}
        onOpenChange={setShowAddProfile}
        submitting={createMut.isPending}
        onComplete={(form: any) => {
          const gender =
            form.gender === "Male" ? "M" : form.gender === "Female" ? "F" : "O";
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
                country_id: form.countryId
                  ? Number(form.countryId)
                  : undefined,
                state_id: form.stateId
                  ? Number(form.stateId)
                  : undefined,
                district_id: form.districtId
                  ? Number(form.districtId)
                  : undefined,
                place_of_birth: birthPlace || undefined,
                birth_place: birthPlace || undefined,
                pr_pob: birthPlace || undefined,
                latitude: form.birthLatitude
                  ? Number(form.birthLatitude)
                  : undefined,
                longitude: form.birthLongitude
                  ? Number(form.birthLongitude)
                  : undefined,
                timezone: form.birthTimezone || undefined,
              }
            : undefined;
          const registration = {
            name: String(form.name ?? form.fullName ?? "").trim(),
            phone_number: String(form.mobile ?? "").trim(),
            gender,
            dob: birthDate,
            email: form.email ? String(form.email).trim() : undefined,
            terms_accepted: true,
            profile_for: String(form.profileFor ?? "myself").toLowerCase(),
            has_horoscope: !!form.hasHoroscope,
            horoscope_details: horoscopeDetails,
            time_of_birth: form.hasHoroscope
              ? birthTime || undefined
              : undefined,
            birth_time: form.hasHoroscope ? birthTime || undefined : undefined,
            pr_tob: form.hasHoroscope ? birthTime || undefined : undefined,
            place_of_birth: form.hasHoroscope
              ? birthPlace || undefined
              : undefined,
            birth_place: form.hasHoroscope
              ? birthPlace || undefined
              : undefined,
            pr_pob: form.hasHoroscope ? birthPlace || undefined : undefined,
            latitude:
              form.hasHoroscope && form.birthLatitude
                ? Number(form.birthLatitude)
                : undefined,
            longitude:
              form.hasHoroscope && form.birthLongitude
                ? Number(form.birthLongitude)
                : undefined,
            timezone: form.hasHoroscope
              ? form.birthTimezone || undefined
              : undefined,
            location_details: {
              country_id: form.countryId ? Number(form.countryId) : undefined,
              state_id: form.stateId ? Number(form.stateId) : undefined,
              district_id: form.districtId
                ? Number(form.districtId)
                : undefined,
              city: form.city ? String(form.city).trim() : undefined,
              address: form.address || undefined,
            },
            religion_details: {
              religion_id: form.religionId
                ? Number(form.religionId)
                : undefined,
              caste_id: form.casteId ? Number(form.casteId) : undefined,
              mother_tongue_id: form.motherTongueId
                ? Number(form.motherTongueId)
                : undefined,
              ...buildPartnerReligionDetails({
                religionId: String(form.religionId ?? ""),
                partnerPreferenceType: form.partnerPreferenceType ?? "own_religion_only",
                partnerReligionIds: Array.isArray(form.partnerReligionIds)
                  ? form.partnerReligionIds.map(String)
                  : [],
                partnerCastePreferences: form.partnerCastePreferences ?? {},
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
              highest_education_id: form.highestEducationId
                ? Number(form.highestEducationId)
                : undefined,
              education_subject_id: form.educationSubjectId
                ? Number(form.educationSubjectId)
                : undefined,
              employment_status: form.employmentStatus || undefined,
              occupation_id: form.occupationId
                ? Number(form.occupationId)
                : undefined,
              annual_income_id: form.annualIncomeId
                ? Number(form.annualIncomeId)
                : undefined,
            },
            about_me: form.aboutMe || undefined,
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

          const formData = {
            horoscopeFields: [
              {
                uiFieldName: "Time of Birth",
                stateFieldName: "timeOfBirth",
                stateValue: form.timeOfBirth,
                apiPayloadFieldNames: [
                  "registration.time_of_birth",
                  "registration.birth_time",
                  "registration.pr_tob",
                  "registration.horoscope_details.time_of_birth",
                  "registration.horoscope_details.birth_time",
                  "registration.horoscope_details.pr_tob",
                ],
                serializerFieldNames: ["time_of_birth", "birth_time", "pr_tob"],
              },
              {
                uiFieldName: "Place of Birth",
                stateFieldName: "placeOfBirth",
                stateValue: form.placeOfBirth,
                apiPayloadFieldNames: [
                  "registration.place_of_birth",
                  "registration.birth_place",
                  "registration.pr_pob",
                  "registration.horoscope_details.place_of_birth",
                  "registration.horoscope_details.birth_place",
                  "registration.horoscope_details.pr_pob",
                ],
                serializerFieldNames: [
                  "place_of_birth",
                  "birth_place",
                  "pr_pob",
                ],
              },
            ],
            registration,
            formDataEntries: Array.from(fd.entries()).map(([key, value]) => [
              key,
              value instanceof File ? `[File:${value.name}]` : value,
            ]),
          };
          console.log(formData);

          createMut.mutate(fd);
        }}
      />

      {/* Edit Profile Wizard (shared) */}
      <EditProfileWizard
        open={showEditProfile}
        onOpenChange={setShowEditProfile}
        initial={editInitial}
        submitting={patchMut.isPending}
        onComplete={(form) => {
          if (!editProfile) return;
          patchMut.mutate({
            matriId: editProfile.matri_id,
            body: buildProfileEditFormData(form),
          });
        }}
      />

      {/* Match Viewer Dialog */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Matches for {matchTarget?.name}</DialogTitle>
            <DialogDescription className="sr-only">
              View suggested matches for this profile.
            </DialogDescription>
          </DialogHeader>
          {matchTarget && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ranked suggestions from the member pool (partner preferences + match score)
              </p>
              {matchesQ.isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading matches…</p>
              ) : matchesQ.error ? (
                <p className="text-sm text-destructive py-8 text-center">
                  {(matchesQ.error as Error).message}
                </p>
              ) : (matchesQ.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No matches found for the current criteria.
                </p>
              ) : (
                (matchesQ.data ?? []).map((m) => (
                  <Card
                    key={m.matri_id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                          <Heart className="h-4 w-4 text-pink-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.age != null ? `${m.age}y` : "—"} · {m.religion ?? "—"} / {m.caste ?? "—"}
                            {m.marital_status ? ` · ${m.marital_status}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {m.match_percentage}% match
                        </Badge>
                        <Badge
                          variant={m.admin_verified ? "default" : "outline"}
                          className={
                            m.admin_verified
                              ? "bg-success text-success-foreground"
                              : ""
                          }
                        >
                          {m.admin_verified ? "Verified" : "Unverified"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowMatchDialog(false);
                            setViewIsMatch(true);
                            setViewProfile({
                              matri_id: m.matri_id,
                              name: m.name,
                            } as ProfileListRow);
                          }}
                        >
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

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note — {noteTarget}</DialogTitle>
            <DialogDescription className="sr-only">
              Add an internal note for this profile.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter your note..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addNote} disabled={!noteText}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
