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
import {
  Plus,
  Eye,
  Edit,
  RefreshCw,
  StickyNote,
  AlertTriangle,
  Users,
  CreditCard,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import type { ProfileListRow } from "@/lib/admin-api/profiles";
import {
  createStaffProfile,
  fetchStaffMyProfilesSummary,
  fetchStaffProfiles,
  fetchStaffProfileDetail,
  patchStaffProfile,
  toggleStaffProfileWishlist,
} from "@/lib/admin-api/profiles";

export default function MyProfiles() {
  const [filters, setFilters] = useState(EMPTY_PROFILE_SEARCH);
  const [applied, setApplied] = useState(EMPTY_PROFILE_SEARCH);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("20");
  const [viewProfile, setViewProfile] = useState<ProfileListRow | null>(null);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfile, setEditProfile] = useState<ProfileListRow | null>(null);
  const [editInitial, setEditInitial] = useState<WizardFormValues | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteTarget, setNoteTarget] = useState<string>("");
  const [noteText, setNoteText] = useState("");
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
    queryKey: ["staff", "profiles", "detail", viewProfile?.matri_id],
    queryFn: () => fetchStaffProfileDetail(String(viewProfile?.matri_id ?? "")),
    enabled: !!viewProfile?.matri_id,
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
    mutationFn: async (form: Record<string, unknown>) => {
      const payload = await buildProfileRegistrationFormData(form);
      return createStaffProfile(payload);
    },
    onSuccess: (res) => {
      const matriId = String((res as { matri_id?: string }).matri_id ?? "");
      toast({
        title: "Profile Created",
        description: matriId
          ? `Created successfully: ${matriId}`
          : "Created successfully",
      });
      setShowAddProfile(false);
      void Promise.all([
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
    mutationFn: async ({
      matriId,
      form,
    }: {
      matriId: string;
      form: WizardFormValues;
    }) => {
      const body = await buildProfileEditFormData(form);
      return patchStaffProfile(matriId, body);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Changes saved successfully.",
      });
      setShowEditProfile(false);
      void Promise.all([
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
            Manage all platform profiles
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
        showAssignedStaff={true}
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
                <ProfileDetailPanel detail={viewDetailQ.data} showAdmin={false} />

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
        submitting={createMut.isPending}
        onComplete={(form: Record<string, unknown>) => {
          createMut.mutate(form);
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
            form,
          });
        }}
      />

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
