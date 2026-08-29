import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProfileSearchFilters from "@/components/profile/ProfileSearchFilters";
import { ProfileDetailPanel } from "@/components/profile/ProfileDetailPanel";
import { EMPTY_PROFILE_SEARCH, profileSearchToQuery } from "@/lib/profileSearch";
import AddProfileWizard from "@/components/profile/AddProfileWizard";
import EditProfileWizard from "@/components/profile/EditProfileWizard";
import {
  buildProfileEditFormData,
  buildProfileRegistrationFormData,
  mapDetailToWizardForm,
  type WizardFormValues,
} from "@/lib/admin-api/profile-registration";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createBranchMyProfile,
  fetchBranchMyProfileDetail,
  fetchBranchMyProfileDocuments,
  fetchBranchMyProfiles,
  fetchBranchMyProfilesSummary,
  patchBranchMyProfile,
  patchProfileAssignStaff,
  patchBranchMyProfileVerify,
  profileListRowStub,
  type ProfileListRow,
} from "@/lib/admin-api/profiles";
import { fetchBranchStaffList } from "@/lib/admin-api/staff";
import { cn } from "@/lib/utils";
import {
  Eye,
  Edit,
  BadgeCheck,
  BadgeX,
  FileText,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BranchMyProfiles() {
  const [filters, setFilters] = useState(EMPTY_PROFILE_SEARCH);
  const [applied, setApplied] = useState(EMPTY_PROFILE_SEARCH);
  const [page, setPage] = useState(1);
  const [viewProfile, setViewProfile] = useState<ProfileListRow | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [assignStaffId, setAssignStaffId] = useState<string>("");
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfile, setEditProfile] = useState<ProfileListRow | null>(null);
  const [editInitial, setEditInitial] = useState<WizardFormValues | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const openedDeepLink = useRef("");

  const deepLinkMatri = (searchParams.get("matri_id") || "").trim();
  useEffect(() => {
    if (!deepLinkMatri || openedDeepLink.current === deepLinkMatri) return;
    openedDeepLink.current = deepLinkMatri;
    const next = { ...EMPTY_PROFILE_SEARCH, matri_id: deepLinkMatri };
    setFilters(next);
    setApplied(next);
    setPage(1);
    setViewProfile(profileListRowStub(deepLinkMatri));
  }, [deepLinkMatri]);

  const summaryQ = useQuery({
    queryKey: ["branch", "my-profiles", "summary"],
    queryFn: () => fetchBranchMyProfilesSummary(),
  });
  const listQ = useQuery({
    queryKey: ["branch", "my-profiles", "list", applied, page],
    queryFn: () =>
      fetchBranchMyProfiles(
        profileSearchToQuery(applied, { page, page_size: 20 }),
      ),
  });

  const viewDetailQ = useQuery({
    queryKey: ["branch", "my-profiles", "detail", viewProfile?.matri_id],
    queryFn: () => fetchBranchMyProfileDetail(String(viewProfile?.matri_id ?? "")),
    enabled: !!viewProfile?.matri_id,
  });

  const docsQ = useQuery({
    queryKey: ["branch", "my-profiles", "documents", docId],
    queryFn: () => fetchBranchMyProfileDocuments(docId as string),
    enabled: !!docId,
  });
  const staffQ = useQuery({
    queryKey: ["branch", "staff", "active-for-profile-assignment"],
    queryFn: () =>
      fetchBranchStaffList({ status: "active", page: 1, page_size: 100 }),
  });

  const verifyMut = useMutation({
    mutationFn: ({ matriId }: { matriId: string }) =>
      patchBranchMyProfileVerify(matriId),
    onSuccess: () => {
      toast({ title: "Verification status updated" });
      qc.invalidateQueries({ queryKey: ["branch", "my-profiles"] });
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const assignMut = useMutation({
    mutationFn: ({ matriId, staffId }: { matriId: string; staffId: number }) =>
      patchProfileAssignStaff(matriId, staffId),
    onSuccess: () => {
      toast({ title: "Staff assigned successfully" });
      setAssignId(null);
      setAssignStaffId("");
      qc.invalidateQueries({ queryKey: ["branch", "my-profiles"] });
    },
    onError: (e: Error) =>
      toast({
        title: "Assign failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  const createMut = useMutation({
    mutationFn: async (form: Record<string, unknown>) => {
      const payload = await buildProfileRegistrationFormData(form);
      return createBranchMyProfile(payload);
    },
    onSuccess: (res) => {
      const matriId = String((res as { matri_id?: string }).matri_id ?? "");
      toast({
        title: "Profile created successfully",
        description: matriId ? `Matri ID: ${matriId}` : undefined,
      });
      setShowAddProfile(false);
      void qc.invalidateQueries({ queryKey: ["branch", "my-profiles"] });
    },
    onError: (e: Error) =>
      toast({
        title: "Create failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  const patchMut = useMutation({
    mutationFn: async ({
      matriId,
      form,
    }: {
      matriId: string;
      form: WizardFormValues;
    }) => {
      const body = await buildProfileEditFormData(form);
      return patchBranchMyProfile(matriId, body);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Changes saved successfully.",
      });
      setShowEditProfile(false);
      void qc.invalidateQueries({ queryKey: ["branch", "my-profiles"] });
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
      const detail = await fetchBranchMyProfileDetail(p.matri_id);
      setEditInitial(mapDetailToWizardForm(detail as Record<string, unknown>, p));
    } catch (e) {
      toast({
        title: "Could not load full profile details",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const rows = listQ.data?.results ?? [];
  const total = listQ.data?.count ?? 0;
  const canPrev = Boolean(listQ.data?.previous) && page > 1;
  const canNext = Boolean(listQ.data?.next);
  const incompleteMsg = summaryQ.data?.incomplete_message;
  const normalizedRows = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        planText: r.subscription_plan ?? r.plan ?? "None",
        verifiedFlag: Boolean(r.is_verified ?? r.verified),
        completenessPct: Number(r.completeness ?? r.completion_percent ?? 0),
      })),
    [rows],
  );

  const actionIconBtn =
    "h-8 w-8 shrink-0 rounded-full border-0 shadow-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-60";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profiles</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse and manage all platform profiles
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">
              {summaryQ.data?.total_profiles ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Verified</p>
            <p className="text-xl font-bold">
              {summaryQ.data?.verified ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Unverified</p>
            <p className="text-xl font-bold">
              {summaryQ.data?.unverified ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Subscribed</p>
            <p className="text-xl font-bold">
              {summaryQ.data?.subscribed ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>
      {incompleteMsg && (
        <Card className="border-warning/40">
          <CardContent className="py-3 text-sm text-warning">
            {incompleteMsg}
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
        role="branch-manager"
      />

      <Card className="shadow-elegant border-0">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button onClick={() => setShowAddProfile(true)}>Add Profile</Button>
            {(listQ.isLoading || summaryQ.isLoading) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matri ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {normalizedRows.map((r) => (
                <TableRow key={r.matri_id}>
                  <TableCell>{r.matri_id}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.gender}</TableCell>
                  <TableCell>{r.age}</TableCell>
                  <TableCell>{r.planText}</TableCell>
                  <TableCell>
                    <Badge variant={r.is_blocked ? "destructive" : "secondary"}>
                      {r.is_blocked ? "Blocked" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="View"
                        aria-label="View"
                        className={cn(
                          actionIconBtn,
                          "bg-purple-100 text-purple-600 hover:bg-purple-200 hover:text-purple-700 focus-visible:ring-purple-400",
                        )}
                        onClick={() => setViewProfile(r)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Edit"
                        aria-label="Edit"
                        className={cn(
                          actionIconBtn,
                          "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 focus-visible:ring-blue-400",
                        )}
                        onClick={() => void openEdit(r)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {/* Temporarily disabled: Verify/Unverify action
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title={r.verifiedFlag ? "Unverify" : "Verify"}
                        aria-label={r.verifiedFlag ? "Unverify" : "Verify"}
                        className={cn(
                          actionIconBtn,
                          r.verifiedFlag
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800 focus-visible:ring-amber-400"
                            : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:text-emerald-700 focus-visible:ring-emerald-400",
                        )}
                        onClick={() =>
                          verifyMut.mutate({ matriId: r.matri_id })
                        }
                        disabled={verifyMut.isPending}
                      >
                        {r.verifiedFlag ? (
                          <BadgeX className="h-4 w-4" />
                        ) : (
                          <BadgeCheck className="h-4 w-4" />
                        )}
                      </Button>
                      */}
                      {/* Temporarily disabled: Documents action
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Documents"
                        aria-label="Documents"
                        className={cn(
                          actionIconBtn,
                          "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-800 focus-visible:ring-slate-400",
                        )}
                        onClick={() => setDocId(r.matri_id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      */}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Assign"
                        aria-label="Assign"
                        className={cn(
                          actionIconBtn,
                          "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-800 focus-visible:ring-indigo-400",
                        )}
                        onClick={() => {
                          setAssignId(r.matri_id);
                          const pre = staffQ.data?.results.find(
                            (s) => s.name === r.assigned_staff,
                          );
                          setAssignStaffId(pre ? String(pre.id) : "");
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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

      {/* View Profile Dialog */}
      <Dialog
        open={!!viewProfile}
        onOpenChange={(o) => {
          if (!o) setViewProfile(null);
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
                <ProfileDetailPanel detail={viewDetailQ.data} showAdmin={false} />

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!viewProfile) return;
                      const vp = viewProfile;
                      setViewProfile(null);
                      void openEdit(vp);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!docId} onOpenChange={(o) => !o && setDocId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Documents</DialogTitle>
          </DialogHeader>
          {docsQ.isLoading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
          {docsQ.data && (
            <pre className="text-xs max-h-96 overflow-auto">
              {JSON.stringify(docsQ.data, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!assignId}
        onOpenChange={(o) => {
          if (!o) {
            setAssignId(null);
            setAssignStaffId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff</DialogTitle>
          </DialogHeader>
          <Select value={assignStaffId} onValueChange={setAssignStaffId}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  staffQ.isLoading ? "Loading staff..." : "Select staff"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {(staffQ.data?.results ?? []).map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name} ({s.emp_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignId(null)}
              disabled={assignMut.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                assignId &&
                assignStaffId &&
                assignMut.mutate({
                  matriId: assignId,
                  staffId: Number(assignStaffId),
                })
              }
              disabled={!assignStaffId || assignMut.isPending}
            >
              {assignMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Assign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            form,
          });
        }}
      />

      <AddProfileWizard
        open={showAddProfile}
        onOpenChange={setShowAddProfile}
        submitting={createMut.isPending}
        onComplete={(form: Record<string, unknown>) => {
          createMut.mutate(form);
        }}
      />
    </div>
  );
}
