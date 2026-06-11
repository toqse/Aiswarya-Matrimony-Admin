import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Eye, Trash2, Ban, Loader2, UserPlus, Edit, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneDisplay } from "@/lib/phone";
import { useRole } from "@/contexts/RoleContext";
import AddProfileWizard from "@/components/profile/AddProfileWizard";
import EditProfileWizard from "@/components/profile/EditProfileWizard";
import {
  buildProfileEditFormData,
  buildProfileRegistrationFormData,
  mapDetailToWizardForm,
  type WizardFormValues,
} from "@/lib/admin-api/profile-registration";
import {
  createAdminProfile,
  deleteAdminProfile,
  fetchAdminProfileDetail,
  fetchAdminProfiles,
  looksLikePhone,
  normalizePhoneQuery,
  patchAdminProfile,
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

function displayOrDash(v: unknown): string {
  if (v == null || v === "") return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
  return String(v);
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
  const [showAddProfile, setShowAddProfile] = useState(false);

  const [editRow, setEditRow] = useState<ProfileListRow | null>(null);
  const [editInitial, setEditInitial] = useState<WizardFormValues | null>(null);

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

  const createMut = useMutation({
    mutationFn: (payload: FormData) => createAdminProfile(payload),
    onSuccess: async (res) => {
      const matriId = String((res as { matri_id?: string }).matri_id ?? "");
      toast({
        title: "Profile created",
        description: matriId ? `Created successfully: ${matriId}` : "Created successfully",
      });
      setShowAddProfile(false);
      await invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

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

  const editMut = useMutation({
    mutationFn: ({ matriId, body }: { matriId: string; body: FormData }) =>
      patchAdminProfile(matriId, body),
    onSuccess: async () => {
      toast({ title: "Profile updated" });
      await invalidate();
      setEditRow(null);
      setEditInitial(null);
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
    setEditInitial(null);
    try {
      const d = await fetchAdminProfileDetail(row.matri_id);
      setEditInitial(mapDetailToWizardForm(d as Record<string, unknown>, row));
    } catch (e) {
      toast({
        title: "Could not load full profile details",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Profile Administration</h1>
          <p className="text-muted-foreground text-sm mt-1">Admin/staff scoped profile management</p>
        </div>
        {role === "admin" && (
          <Button
            onClick={() => setShowAddProfile(true)}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-4 w-4" /> Add New Profile
          </Button>
        )}
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
                          ["Phone", formatPhoneDisplay(basic.phone)],
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

      <EditProfileWizard
        open={!!editRow}
        onOpenChange={(o) => {
          if (!o) {
            setEditRow(null);
            setEditInitial(null);
          }
        }}
        initial={editInitial}
        submitting={editMut.isPending}
        onComplete={(form) => {
          if (!editRow) return;
          editMut.mutate({ matriId: editRow.matri_id, body: buildProfileEditFormData(form) });
        }}
      />

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

      <AddProfileWizard
        open={showAddProfile}
        onOpenChange={setShowAddProfile}
        submitting={createMut.isPending}
        onComplete={(form) => {
          const fd = buildProfileRegistrationFormData(form);
          createMut.mutate(fd);
        }}
      />
    </div>
  );
}
