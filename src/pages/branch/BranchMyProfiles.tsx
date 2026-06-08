import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  patchProfileAssignStaff,
  patchBranchMyProfileVerify,
  refreshBranchMyProfile,
  sendBranchMyProfileEmail,
  toggleBranchMyProfileWishlist,
  type ProfilesQuery,
} from "@/lib/admin-api/profiles";
import { fetchBranchStaffList } from "@/lib/admin-api/staff";
import { cn } from "@/lib/utils";
import {
  Eye,
  BadgeCheck,
  BadgeX,
  FileText,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getPath(obj: unknown, path: Array<string | number>): unknown {
  let cur: any = obj;
  for (const key of path) {
    if (cur == null) return undefined;
    cur = cur[key as any];
  }
  return cur;
}

function asString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() ? v : null;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function formatMaybe(v: unknown): string {
  return asString(v) ?? "—";
}

export default function BranchMyProfiles() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<NonNullable<ProfilesQuery["filter"]>>("all");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [assignStaffId, setAssignStaffId] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    phone_number: "",
    gender: "F" as "M" | "F" | "O",
    dob: "",
    email: "",
  });
  const qc = useQueryClient();
  const { toast } = useToast();

  const summaryQ = useQuery({
    queryKey: ["branch", "my-profiles", "summary"],
    queryFn: () => fetchBranchMyProfilesSummary(),
  });
  const listQ = useQuery({
    queryKey: ["branch", "my-profiles", "list", search, filter, page],
    queryFn: () =>
      fetchBranchMyProfiles({
        search: search.trim() || undefined,
        filter,
        page,
        page_size: 20,
      }),
  });

  const detailQ = useQuery({
    queryKey: ["branch", "my-profiles", "detail", detailId],
    queryFn: () => fetchBranchMyProfileDetail(detailId as string),
    enabled: !!detailId,
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

  const refreshMut = useMutation({
    mutationFn: (matriId: string) => refreshBranchMyProfile(matriId),
    onSuccess: () => {
      toast({ title: "Profile completion refreshed" });
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
    mutationFn: () =>
      createBranchMyProfile({
        name: createForm.name.trim(),
        phone_number: createForm.phone_number.trim(),
        gender: createForm.gender,
        dob: createForm.dob.trim(),
        email: createForm.email.trim() || undefined,
      }),
    onSuccess: () => {
      toast({ title: "Profile created successfully" });
      setCreateOpen(false);
      setCreateForm({
        name: "",
        phone_number: "",
        gender: "F",
        dob: "",
        email: "",
      });
      qc.invalidateQueries({ queryKey: ["branch", "my-profiles"] });
    },
    onError: (e: Error) =>
      toast({
        title: "Create failed",
        description: e.message,
        variant: "destructive",
      }),
  });

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
          Profiles in your branch from `/v1/branch/my-profiles/`
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

      <Card className="shadow-elegant border-0">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search name or matri ID..."
              className="max-w-sm"
            />
            <Select
              value={filter}
              onValueChange={(v) => {
                setPage(1);
                setFilter(v as NonNullable<ProfilesQuery["filter"]>);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all</SelectItem>
                <SelectItem value="incomplete">incomplete</SelectItem>
                <SelectItem value="complete">complete</SelectItem>
                <SelectItem value="subscribed">subscribed</SelectItem>
                <SelectItem value="unsubscribed">unsubscribed</SelectItem>
                <SelectItem value="verified">verified</SelectItem>
                <SelectItem value="unverified">unverified</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateOpen(true)}>Add Profile</Button>
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
                <TableHead>Verified</TableHead>
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
                    <Badge variant={r.verifiedFlag ? "default" : "outline"}>
                      {r.verifiedFlag ? "Verified" : "Unverified"}
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
                        onClick={() => setDetailId(r.matri_id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile Detail</DialogTitle>
          </DialogHeader>
          {detailQ.isLoading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
          {detailQ.data && (() => {
            const d = detailQ.data as unknown;
            const matriId =
              asString(getPath(d, ["matri_id"])) ??
              asString(getPath(d, ["matriId"])) ??
              detailId ??
              "—";
            const basic = getPath(d, ["basic_details"]);
            const photos = getPath(d, ["photos"]);

            const name = asString(getPath(basic, ["name"])) ?? asString(getPath(d, ["name"]));
            const gender = asString(getPath(basic, ["gender"])) ?? asString(getPath(d, ["gender"]));
            const dob = asString(getPath(basic, ["dob"])) ?? asString(getPath(d, ["dob"]));
            const email = asString(getPath(basic, ["email"])) ?? asString(getPath(d, ["email"]));
            const phone =
              asString(getPath(basic, ["phone"])) ??
              asString(getPath(basic, ["phone_number"])) ??
              asString(getPath(d, ["phone"])) ??
              asString(getPath(d, ["phone_number"]));
            const profileFor = asString(getPath(basic, ["profile_for"])) ?? asString(getPath(d, ["profile_for"]));

            const photoItems = [
              { key: "profile_photo", label: "Profile Photo" },
              { key: "full_photo", label: "Full Photo" },
              { key: "selfie_photo", label: "Selfie Photo" },
              { key: "family_photo", label: "Family Photo" },
              { key: "aadhaar_front", label: "Aadhaar Front" },
              { key: "aadhaar_back", label: "Aadhaar Back" },
            ]
              .map((p) => ({
                ...p,
                url: asString(getPath(photos, [p.key])),
              }))
              .filter((p) => !!p.url);

            return (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Matri ID</Label>
                    <p className="font-mono">{matriId}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{formatMaybe(name)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Gender</Label>
                    <p>{formatMaybe(gender)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">DOB</Label>
                    <p>{formatMaybe(dob)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p>{formatMaybe(phone)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="break-all">{formatMaybe(email)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-muted-foreground">Profile For</Label>
                    <p>{formatMaybe(profileFor)}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Photos</Label>
                  {photoItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No photos uploaded.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {photoItems.map((p) => (
                        <a
                          key={p.key}
                          href={p.url as string}
                          target="_blank"
                          rel="noreferrer"
                          className="group rounded-md border overflow-hidden bg-muted/20 hover:bg-muted/40 transition-colors"
                          title="Open image"
                        >
                          <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                            <img
                              src={p.url as string}
                              alt={p.label}
                              className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">{p.label}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Name"
            />
            <Input
              value={createForm.phone_number}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, phone_number: e.target.value }))
              }
              placeholder="Phone number"
            />
            <Select
              value={createForm.gender}
              onValueChange={(v) =>
                setCreateForm((p) => ({ ...p, gender: v as "M" | "F" | "O" }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="F">F</SelectItem>
                <SelectItem value="O">O</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={createForm.dob}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, dob: e.target.value }))
              }
              placeholder="DOB (DD-MM-YYYY)"
            />
            <Input
              value={createForm.email}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="Email (optional)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={
                createMut.isPending ||
                !createForm.name.trim() ||
                !createForm.phone_number.trim() ||
                !createForm.dob.trim()
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
