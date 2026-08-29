import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Trash2, Ban, Loader2, UserPlus, Edit, Plus } from "lucide-react";
import { nakshatraDisplayFromStar } from "@/components/horoscope/horoscope-i18n";
import ProfileSearchFilters from "@/components/profile/ProfileSearchFilters";
import { EMPTY_PROFILE_SEARCH, profileSearchToQuery } from "@/lib/profileSearch";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import AddProfileWizard from "@/components/profile/AddProfileWizard";
import EditProfileWizard from "@/components/profile/EditProfileWizard";
import { ProfileDetailPanel, displayOrDash } from "@/components/profile/ProfileDetailPanel";
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
  patchAdminProfile,
  patchProfileAssignStaff,
  fetchStaffProfiles,
  patchProfileBlock,
  profileListRowStub,
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

function displayStar(row: ProfileListRow): string {
  if (row.star?.trim()) return row.star.trim();
  const fromNumber = nakshatraDisplayFromStar(row.pr_star, null, "ml");
  return fromNumber || "—";
}

export default function ProfileAdmin() {
  const { role } = useRole();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(EMPTY_PROFILE_SEARCH);
  const [applied, setApplied] = useState(EMPTY_PROFILE_SEARCH);
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
  const openedDeepLink = useRef("");

  const listQuery = useQuery({
    queryKey: ["admin", "profiles", role, applied, page, pageSize],
    queryFn: () => {
      const args = profileSearchToQuery(applied, {
        page,
        page_size: Number(pageSize),
      });
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
    mutationFn: async (form: Record<string, unknown>) => {
      const payload = await buildProfileRegistrationFormData(form);
      return createAdminProfile(payload);
    },
    onSuccess: (res) => {
      const matriId = String((res as { matri_id?: string }).matri_id ?? "");
      toast({
        title: "Profile created",
        description: matriId ? `Created successfully: ${matriId}` : "Created successfully",
      });
      setShowAddProfile(false);
      void invalidate();
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
    mutationFn: async ({
      matriId,
      form,
    }: {
      matriId: string;
      form: Parameters<typeof buildProfileEditFormData>[0];
    }) => {
      const body = await buildProfileEditFormData(form);
      return patchAdminProfile(matriId, body);
    },
    onSuccess: () => {
      toast({ title: "Profile updated" });
      setEditRow(null);
      setEditInitial(null);
      void invalidate();
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

  const deepLinkMatri = (searchParams.get("matri_id") || "").trim();
  useEffect(() => {
    if (!deepLinkMatri || openedDeepLink.current === deepLinkMatri) return;
    openedDeepLink.current = deepLinkMatri;
    const next = { ...EMPTY_PROFILE_SEARCH, matri_id: deepLinkMatri };
    setFilters(next);
    setApplied(next);
    setPage(1);
    void openView(profileListRowStub(deepLinkMatri));
  }, [deepLinkMatri]);

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

      <ProfileSearchFilters
        value={filters}
        onChange={setFilters}
        onSearch={() => {
          setApplied({ ...filters });
          setPage(1);
        }}
        onReset={() => {
          setFilters(EMPTY_PROFILE_SEARCH);
          setApplied(EMPTY_PROFILE_SEARCH);
          setPage(1);
        }}
        role={role}
      />

      <Card className="shadow-elegant border-0">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrimony ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Religion</TableHead>
                <TableHead>Caste</TableHead>
                <TableHead>Star</TableHead>
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
                  <TableCell colSpan={12} className="text-center text-muted-foreground">
                    Loading profiles...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground py-6">
                    <p>No profiles found.</p>
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
                  <TableCell>{displayStar(p)}</TableCell>
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
                {viewDetail && <ProfileDetailPanel detail={detail} showAdmin />}

                {!viewDetail && viewProfile && (
                  <div className="grid grid-cols-2 gap-3 opacity-80">
                    {[
                      ["Name", viewProfile.name],
                      ["Gender", viewProfile.gender],
                      ["Age", viewProfile.age],
                      ["Religion", viewProfile.religion],
                      ["Caste", viewProfile.caste],
                      ["Star", displayStar(viewProfile)],
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
          editMut.mutate({ matriId: editRow.matri_id, form });
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
          createMut.mutate(form);
        }}
      />
    </div>
  );
}
