import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { useRole } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/user-role";
import {
  fetchHoroscopeRecordDetail,
  fetchHoroscopeRecords,
  fetchHoroscopeSummary,
  fetchJathakamPdfs,
  normalizeHoroscopeRecord,
  postHoroscopePorutham,
  postHoroscopeRegenerate,
  type HoroscopeRecordRow,
} from "@/lib/admin-api/horoscope";
import { fetchBranchList } from "@/lib/admin-api/branches";
import { adminFetchBlob, downloadBlob } from "@/lib/api-client";
import { API_BASE_URL } from "@/lib/config";
import {
  Star, Eye, FileText, Download, RefreshCw, Search,
  CheckCircle, Clock, XCircle, AlertTriangle, Heart, Sparkles,
  Shield, Loader2, ChevronLeft, ChevronRight, ExternalLink, Link2, ChevronsUpDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PoruthamResultView } from "@/components/horoscope/PoruthamResultView";
import {
  HoroscopeChart,
  extractHoroscopeCharts,
  t as horoscopeT,
  MALAYALAM_FONT,
  type HoroscopeLang,
} from "@/components/horoscope/HoroscopeChart";
import { signNameFromChartString } from "@/components/horoscope/horoscope-i18n";

const jathagamStatusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  generated: { icon: CheckCircle, color: "bg-success/10 text-success", label: "Generated" },
  pending: { icon: Clock, color: "bg-warning/10 text-warning", label: "Pending" },
  failed: { icon: XCircle, color: "bg-destructive/10 text-destructive", label: "Failed" },
  "not-applicable": { icon: AlertTriangle, color: "bg-muted text-muted-foreground", label: "N/A" },
};

function apiPathFromAbsolutePdfUrl(url: string): string | null {
  if (!url.startsWith("http")) return null;
  const base = API_BASE_URL.replace(/\/?$/, "/");
  const idx = url.indexOf("/api/");
  if (idx === -1) return null;
  const rest = url.slice(idx + "/api/".length).replace(/^\//, "");
  if (!rest) return null;
  return rest;
}

async function downloadPdfAuthenticated(url: string, fallbackName: string) {
  const path = apiPathFromAbsolutePdfUrl(url);
  if (path) {
    const { ok, blob, filename } = await adminFetchBlob(path);
    if (ok) {
      downloadBlob(blob, filename || fallbackName);
      return;
    }
  }
  if (url.startsWith("http")) window.open(url, "_blank", "noopener,noreferrer");
}

/** Branch manager / staff: profile list route; admin uses Profile Admin. */
function profilesListPath(role: "admin" | "staff" | "branch-manager"): string {
  if (role === "admin") return "/profiles";
  return "/my-profiles";
}

function formatLastEdited(label: string): string {
  if (!label.trim()) return "—";
  const parts = label.split(" · ").map((p) => p.trim());
  if (parts.length >= 2) {
    const tail = parts[parts.length - 1]!;
    const d = new Date(tail);
    if (!Number.isNaN(d.getTime())) {
      parts[parts.length - 1] = d.toLocaleString();
      return parts.join(" · ");
    }
  }
  const d = new Date(label);
  if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  return label;
}

function formatPoruthamOptionLabel(r: HoroscopeRecordRow): string | null {
  if (r.profile_id == null) return null;
  return `${r.profile_name || "—"} (${r.matri_id || "—"}) — ${r.profile_id}`;
}

function PoruthamProfilePicker({
  value,
  onValueChange,
  placeholder,
  role,
  branchId,
  tabActive,
  instanceId,
}: {
  value: string;
  onValueChange: (id: string) => void;
  placeholder: string;
  role: UserRole;
  branchId: number | undefined;
  tabActive: boolean;
  instanceId: "bride" | "groom";
}) {
  const [open, setOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [labelSnap, setLabelSnap] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchDraft.trim()), 400);
    return () => clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    if (!open) setSearchDraft("");
  }, [open]);

  useEffect(() => {
    setLabelSnap((prev) => {
      if (!value) return null;
      if (prev && prev.id !== value) return null;
      return prev;
    });
  }, [value]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["horoscope", role, "porutham-picker", instanceId, branchId, debouncedSearch],
    queryFn: () =>
      fetchHoroscopeRecords(role, {
        page: 1,
        page_size: 100,
        branch_id: branchId,
        search: debouncedSearch || undefined,
      }),
    enabled: tabActive && open,
  });

  const rows = (data?.results ?? []).filter((r) => r.profile_id != null);
  const matchInRows = rows.find((r) => String(r.profile_id) === value);
  const fromRow = matchInRows ? formatPoruthamOptionLabel(matchInRows) : null;
  const triggerLabel =
    fromRow || (labelSnap?.id === value ? labelSnap.label : null) || (value ? `Profile ID ${value}` : null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-10 px-3"
        >
          <span className="truncate text-left">
            {triggerLabel ?? <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
        <div className="flex items-center border-b px-2 py-1.5 gap-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            className="h-9 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Search by name…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto p-1">
          {isLoading || isFetching ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No profiles found.</p>
          ) : (
            rows.map((r) => {
              const pid = String(r.profile_id);
              const lab = formatPoruthamOptionLabel(r);
              if (!lab) return null;
              return (
                <button
                  key={`${instanceId}-${pid}`}
                  type="button"
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === pid && "bg-accent",
                  )}
                  onClick={() => {
                    onValueChange(pid);
                    setLabelSnap({ id: pid, label: lab });
                    setOpen(false);
                  }}
                >
                  {lab}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function HoroscopeManagement() {
  const { role, branch } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("horoscopes");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewUserUuid, setViewUserUuid] = useState<string | null>(null);

  const [poruthamBride, setPoruthamBride] = useState<string>("");
  const [poruthamGroom, setPoruthamGroom] = useState<string>("");
  const [poruthamResultOpen, setPoruthamResultOpen] = useState(false);
  const [poruthamResult, setPoruthamResult] = useState<unknown>(null);

  const isAdmin = role === "admin";
  const isBranchManager = role === "branch-manager";

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const branchIdParam = useMemo(() => {
    if (!isAdmin || branchFilter === "all") return undefined;
    const n = Number(branchFilter);
    return Number.isFinite(n) ? n : undefined;
  }, [isAdmin, branchFilter]);

  /** Admin: from filter. Branch manager: JWT branch (master id) when present. Staff: omit (server scope). */
  const horoscopeBranchId = useMemo(() => {
    if (isAdmin) return branchIdParam;
    if (isBranchManager && typeof branch?.id === "number" && Number.isFinite(branch.id)) return branch.id;
    return undefined;
  }, [isAdmin, isBranchManager, branch?.id, branchIdParam]);

  const profilesPath = profilesListPath(role);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, branchFilter, horoscopeBranchId]);

  const { data: branchListData } = useQuery({
    queryKey: ["admin", "branches", "horoscope-filter"],
    queryFn: () => fetchBranchList({ page: 1, page_size: 100 }),
    enabled: isAdmin,
  });

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ["horoscope", role, "summary", horoscopeBranchId],
    queryFn: () => fetchHoroscopeSummary(role, { branch_id: horoscopeBranchId }),
  });

  const {
    data: recordsPage,
    isLoading: recordsLoading,
    isFetching: recordsFetching,
    error: recordsError,
  } = useQuery({
    queryKey: ["horoscope", role, "records", debouncedSearch, horoscopeBranchId, page, pageSize],
    queryFn: () =>
      fetchHoroscopeRecords(role, {
        search: debouncedSearch || undefined,
        branch_id: horoscopeBranchId,
        page,
        page_size: pageSize,
      }),
  });

  const { data: detailPayload, isLoading: detailLoading } = useQuery({
    queryKey: ["horoscope", role, "detail", viewUserUuid],
    queryFn: () => fetchHoroscopeRecordDetail(role, viewUserUuid!),
    enabled: viewOpen && !!viewUserUuid && !viewUserUuid.startsWith("row-"),
  });

  const { data: jathakamRows, isLoading: jathakamLoading, error: jathakamError } = useQuery({
    queryKey: ["horoscope", role, "jathakam-pdfs", horoscopeBranchId],
    queryFn: () => fetchJathakamPdfs(role, { branch_id: horoscopeBranchId }),
    enabled: activeTab === "jathagam",
  });

  const regenerateMut = useMutation({
    mutationFn: (userUuid: string) => postHoroscopeRegenerate(role, userUuid),
    onSuccess: () => {
      toast({ title: "Regenerate queued", description: "Chart refresh has been requested." });
      queryClient.invalidateQueries({ queryKey: ["horoscope", role] });
    },
    onError: (e: Error) => {
      toast({ title: "Regenerate failed", description: e.message, variant: "destructive" });
    },
  });

  const poruthamMut = useMutation({
    mutationFn: (body: { bride_profile_id: number; groom_profile_id: number }) => postHoroscopePorutham(role, body),
    onSuccess: (data) => {
      setPoruthamResult(data);
      setPoruthamResultOpen(true);
      toast({ title: "Porutham calculated", description: "See result details." });
      queryClient.invalidateQueries({ queryKey: ["horoscope", role, "summary"] });
    },
    onError: (e: Error) => {
      toast({ title: "Porutham failed", description: e.message, variant: "destructive" });
    },
  });

  const openView = (row: HoroscopeRecordRow) => {
    setViewUserUuid(row.user_uuid);
    setViewOpen(true);
  };

  const canRegenerate = (row: HoroscopeRecordRow) => !row.user_uuid.startsWith("row-");

  const totalPages = Math.max(1, Math.ceil((recordsPage?.count ?? 0) / pageSize));

  const handlePoruthamSubmit = () => {
    const b = Number(poruthamBride);
    const g = Number(poruthamGroom);
    if (!Number.isFinite(b) || !Number.isFinite(g)) {
      toast({ title: "Select profiles", description: "Choose bride and groom profile IDs from the lists.", variant: "destructive" });
      return;
    }
    if (b === g) {
      toast({ title: "Invalid pair", description: "Bride and groom must be different profiles.", variant: "destructive" });
      return;
    }
    poruthamMut.mutate({ bride_profile_id: b, groom_profile_id: g });
  };

  function errMsg(e: unknown): string {
    return e instanceof Error ? e.message : String(e ?? "Request failed");
  }

  useEffect(() => {
    if (summaryError) toast({ title: "Summary error", description: errMsg(summaryError), variant: "destructive" });
  }, [summaryError, toast]);

  useEffect(() => {
    if (recordsError) toast({ title: "Records error", description: errMsg(recordsError), variant: "destructive" });
  }, [recordsError, toast]);

  useEffect(() => {
    if (jathakamError) toast({ title: "Jathakam list error", description: errMsg(jathakamError), variant: "destructive" });
  }, [jathakamError, toast]);

  const kpis = summary
    ? [
        { label: "Total Horoscopes", value: summary.total_horoscopes, icon: Star, color: "text-accent" },
        { label: "Jathagam Generated", value: summary.jathagam_generated, icon: FileText, color: "text-success" },
        { label: "Pending Generation", value: summary.pending_generation, icon: Clock, color: "text-warning" },
        { label: "Match Calculations", value: summary.match_calculations, icon: Heart, color: "text-primary" },
        { label: "Mangal Dosham", value: summary.mangal_dosham, icon: AlertTriangle, color: "text-destructive" },
      ]
    : [
        { label: "Total Horoscopes", value: 0, icon: Star, color: "text-accent" },
        { label: "Jathagam Generated", value: 0, icon: FileText, color: "text-success" },
        { label: "Pending Generation", value: 0, icon: Clock, color: "text-warning" },
        { label: "Match Calculations", value: 0, icon: Heart, color: "text-primary" },
        { label: "Mangal Dosham", value: 0, icon: AlertTriangle, color: "text-destructive" },
      ];

  const detailRow = detailPayload ? normalizeHoroscopeRecord(detailPayload, 0) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" /> Horoscope Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin ? "System-wide horoscope management — all branches" :
             isBranchManager ? "Branch horoscope management — your branch" :
             "Manage horoscopes for your branch profiles"}
          </p>
          {isBranchManager && branch?.name ? (
            <p className="text-xs text-muted-foreground mt-1">Branch: {branch.name}</p>
          ) : null}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Badge className="bg-primary/10 text-primary px-3 py-1">
              <Shield className="h-3 w-3 mr-1" /> Super Admin Access
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-elegant border-0">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1 flex items-center gap-2">
                    {summaryLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : kpi.value}
                  </p>
                </div>
                <kpi.icon className={`h-7 w-7 ${kpi.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="horoscopes" className="text-xs gap-1"><Star className="h-3 w-3" /> Horoscopes</TabsTrigger>
          <TabsTrigger value="matches" className="text-xs gap-1"><Heart className="h-3 w-3" /> Porutham Matches</TabsTrigger>
          <TabsTrigger value="jathagam" className="text-xs gap-1"><FileText className="h-3 w-3" /> Jathagam PDFs</TabsTrigger>
        </TabsList>

        <TabsContent value="horoscopes" className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">Horoscope Records</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search profile, rasi…"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-9 w-56"
                    />
                  </div>
                  {isAdmin && (
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                      <SelectTrigger className="w-52"><SelectValue placeholder="All Branches" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {(branchListData?.results ?? []).map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Religion</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Rasi</TableHead>
                      <TableHead>Nakshatram</TableHead>
                      <TableHead>Dosham</TableHead>
                      <TableHead>Mangal</TableHead>
                      <TableHead>Jathagam</TableHead>
                      <TableHead>Last Edited</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordsLoading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin inline mr-2" /> Loading…
                        </TableCell>
                      </TableRow>
                    ) : (recordsPage?.results ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No records</TableCell>
                      </TableRow>
                    ) : (
                      (recordsPage?.results ?? []).map((h) => {
                        const jConfig = jathagamStatusConfig[h.jathagam_status] ?? jathagamStatusConfig.pending;
                        const JIcon = jConfig.icon;
                        return (
                          <TableRow key={`${h.user_uuid}-${h.matri_id}`}>
                            <TableCell>
                              <span className="font-medium">{h.profile_name || "—"}</span>
                              <br /><span className="text-xs text-muted-foreground font-mono">{h.matri_id || "—"}</span>
                              {h.profile_id != null && (
                                <><br /><span className="text-[10px] text-muted-foreground">ID {h.profile_id}</span></>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{h.branch || "—"}</TableCell>
                            <TableCell className="text-sm">{h.religion || "—"}</TableCell>
                            <TableCell className="text-sm">{h.dob || "—"}</TableCell>
                            <TableCell className="text-sm font-medium">{h.rasi || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="text-sm">{h.nakshatram || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell>
                              {h.dosham ? (
                                <Badge className={h.dosham.toLowerCase().includes("no") ? "bg-success/10 text-success text-[10px]" : "bg-warning/10 text-warning text-[10px]"}>
                                  {h.dosham}
                                </Badge>
                              ) : <span className="text-muted-foreground text-xs">—</span>}
                            </TableCell>
                            <TableCell>
                              {h.mangal ? (
                                <Badge variant="destructive" className="text-[10px]">Yes</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">No</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${jConfig.color} text-[10px] gap-1`}><JIcon className="h-3 w-3" /> {jConfig.label}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                              {formatLastEdited(h.last_edited_label || "")}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {h.matri_id ? (
                                  <Button variant="ghost" size="icon" asChild title={isAdmin ? "Open in Profile Admin" : "Open in My Profiles"}>
                                    <Link to={profilesPath}>
                                      <Link2 className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                ) : null}
                                <Button variant="ghost" size="icon" onClick={() => openView(h)} title="View"><Eye className="h-4 w-4" /></Button>
                                {canRegenerate(h) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={regenerateMut.isPending}
                                    onClick={() => regenerateMut.mutate(h.user_uuid)}
                                    title="Regenerate chart"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>
                  Page {page} of {totalPages}
                  {recordsPage?.count ? ` · ${recordsPage.count} records` : null}
                  {recordsFetching && !recordsLoading ? <Loader2 className="h-4 w-4 animate-spin inline ml-2" /> : null}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || recordsFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || recordsFetching}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Porutham (compatibility)</CardTitle>
              <CardDescription>
                Run a match calculation for two member profiles. Uses POST <code className="text-xs">porutham/</code> with numeric profile IDs from your directory.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bride profile ID</Label>
                  <PoruthamProfilePicker
                    value={poruthamBride}
                    onValueChange={setPoruthamBride}
                    placeholder="Search and select…"
                    role={role}
                    branchId={horoscopeBranchId}
                    tabActive={activeTab === "matches"}
                    instanceId="bride"
                  />
                  <Input
                    type="number"
                    placeholder="Or enter bride profile_id"
                    value={poruthamBride}
                    onChange={(e) => setPoruthamBride(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Groom profile ID</Label>
                  <PoruthamProfilePicker
                    value={poruthamGroom}
                    onValueChange={setPoruthamGroom}
                    placeholder="Search and select…"
                    role={role}
                    branchId={horoscopeBranchId}
                    tabActive={activeTab === "matches"}
                    instanceId="groom"
                  />
                  <Input
                    type="number"
                    placeholder="Or enter groom profile_id"
                    value={poruthamGroom}
                    onChange={(e) => setPoruthamGroom(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handlePoruthamSubmit} disabled={poruthamMut.isPending}>
                {poruthamMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Calculate porutham
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jathagam" className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Jathagam PDFs</CardTitle>
              <CardDescription>From GET <code className="text-xs">jathakam-pdfs/</code></CardDescription>
            </CardHeader>
            <CardContent>
              {jathakamLoading ? (
                <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(jathakamRows ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No PDF rows returned</TableCell>
                      </TableRow>
                    ) : (
                      (jathakamRows ?? []).map((row, idx) => (
                        <TableRow key={`${row.matri_id}-${idx}`}>
                          <TableCell>
                            <span className="font-medium">{row.profile_name || "—"}</span>
                            <br /><span className="text-xs font-mono text-muted-foreground">{row.matri_id || "—"}</span>
                          </TableCell>
                          <TableCell className="text-sm">{row.branch || "—"}</TableCell>
                          <TableCell><Badge variant="outline">{row.status}</Badge></TableCell>
                          <TableCell className="text-xs font-mono max-w-[200px] truncate">{row.pdf_url || "—"}</TableCell>
                          <TableCell>
                            {row.pdf_url ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Download"
                                onClick={() => downloadPdfAuthenticated(row.pdf_url, `${row.matri_id || "jathakam"}.pdf`)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={viewOpen} onOpenChange={(o) => { setViewOpen(o); if (!o) setViewUserUuid(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-accent" /> Horoscope record
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : detailRow ? (
            <HoroscopeDetailBody
              detailPayload={detailPayload}
              detailRow={detailRow}
              profilesPath={profilesPath}
              isAdmin={isAdmin}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No detail returned.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={poruthamResultOpen} onOpenChange={setPoruthamResultOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Porutham result</DialogTitle>
          </DialogHeader>
          {poruthamResult != null ? <PoruthamResultView result={poruthamResult} /> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPoruthamResultOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function pickStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

/** Coerce any primitive into a display string; `null`/`undefined`/empty → "—". */
function displayVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "—";
  if (typeof v === "string") return v.trim() ? v : "—";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function formatMaybeDate(v: unknown): string {
  if (typeof v !== "string" || !v.trim()) return displayVal(v);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

function KV({
  label,
  value,
  labelStyle,
}: {
  label: string;
  value: React.ReactNode;
  labelStyle?: React.CSSProperties;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground" style={labelStyle}>
        {label}
      </div>
      <div className="text-sm font-medium break-words">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 border-b pb-1">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
        {children}
      </div>
    </div>
  );
}

interface HoroscopeDetailBodyProps {
  detailPayload: Record<string, unknown> | undefined;
  detailRow: ReturnType<typeof normalizeHoroscopeRecord>;
  profilesPath: string;
  isAdmin: boolean;
}

function HoroscopeDetailBody({
  detailPayload,
  detailRow,
  profilesPath,
  isAdmin,
}: HoroscopeDetailBodyProps) {
  const payload = (detailPayload ?? {}) as Record<string, unknown>;
  const record = (payload.record && typeof payload.record === "object" && !Array.isArray(payload.record)
    ? (payload.record as Record<string, unknown>)
    : payload) as Record<string, unknown>;
  const horoscope = (payload.horoscope && typeof payload.horoscope === "object" && !Array.isArray(payload.horoscope)
    ? (payload.horoscope as Record<string, unknown>)
    : ({} as Record<string, unknown>));

  const charts = extractHoroscopeCharts(horoscope);
  const dasaFromCharts = charts?.dasa ?? null;
  const chartSource = {
    rasiString: horoscope.pr_rasi ?? record.pr_rasi ?? payload.pr_rasi,
    amsaString: horoscope.pr_amsa ?? record.pr_amsa ?? payload.pr_amsa,
    bhavaString: horoscope.pr_bhav ?? horoscope.pr_bhava ?? record.pr_bhav ?? record.pr_bhava ?? payload.pr_bhav ?? payload.pr_bhava,
    starNumber: horoscope.pr_star ?? record.pr_star ?? payload.pr_star,
    starName: record.nakshatram ?? horoscope.star_name ?? record.star_name ?? payload.star_name,
    pada: horoscope.nakshatra_pada ?? horoscope.pr_pada ?? record.nakshatra_pada ?? record.pr_pada ?? payload.pr_pada,
    dasaLord: horoscope.pr_dasalord ?? horoscope.pr_dasa_lord ?? horoscope.dasa_lord ?? record.pr_dasalord ?? record.pr_dasa_lord ?? record.dasa_lord ?? payload.pr_dasalord ?? payload.pr_dasa_lord ?? dasaFromCharts?.lord,
    dasaBalanceDays: horoscope.pr_dasabalance ?? horoscope.pr_dasa_balance ?? record.pr_dasabalance ?? record.pr_dasa_balance ?? payload.pr_dasabalance ?? payload.pr_dasa_balance,
    dasaBalanceText: dasaFromCharts?.balance_text,
  };
  const [lang, setLang] = useState<HoroscopeLang>("ml");
  const mlFont = lang === "ml" ? MALAYALAM_FONT : undefined;

  return (
    <div className="space-y-5 text-sm">
      <Section title="Profile">
        <KV label="Name" value={displayVal(record.name ?? horoscope.pr_name ?? detailRow.profile_name)} />
        <KV label="Matri ID" value={<span className="font-mono">{displayVal(record.matri_id)}</span>} />
        <KV label="Profile ID" value={displayVal(record.profile_id)} />
        <KV label="User ID" value={<span className="font-mono text-xs break-all">{displayVal(record.user_id)}</span>} />
        <KV label="Branch" value={displayVal(record.branch)} />
        <KV label="Religion" value={displayVal(record.religion)} />
      </Section>

      <Section title="Birth Details">
        <KV label="Date of birth" value={formatMaybeDate(record.dob ?? horoscope.pr_dob)} />
        <KV label="Time of birth" value={displayVal(horoscope.pr_tob)} />
        <KV
          label={horoscopeT(lang, "latitude")}
          labelStyle={{ fontFamily: mlFont }}
          value={displayVal(horoscope.pr_lat)}
        />
        <KV
          label={horoscopeT(lang, "longitude")}
          labelStyle={{ fontFamily: mlFont }}
          value={displayVal(horoscope.pr_lon)}
        />
        <KV
          label={horoscopeT(lang, "time_zone")}
          labelStyle={{ fontFamily: mlFont }}
          value={displayVal(horoscope.pr_tz)}
        />
      </Section>

      <Section title="Astrology">
        <KV label="Rasi" value={displayVal(record.rasi || horoscope.rasi_sign || signNameFromChartString(chartSource.rasiString, 2, lang))} />
        <KV label="Rasi (input)" value={displayVal(horoscope.pr_rasi)} />
        <KV label="Lagnam" value={displayVal(horoscope.lagnam || signNameFromChartString(chartSource.rasiString, 0, lang))} />
        <KV label="Nakshatram" value={displayVal(record.nakshatram || horoscope.star_name)} />
        <KV label="Star (input)" value={displayVal(horoscope.pr_star)} />
        <KV label="Nakshatra pada" value={displayVal(horoscope.nakshatra_pada ?? horoscope.pr_pada)} />
        <KV label="Amsa" value={displayVal(horoscope.pr_amsa)} />
        <KV label="Bhava" value={displayVal(horoscope.pr_bhav)} />
        <KV label="Gana" value={displayVal(horoscope.gana)} />
        <KV label="Yoni" value={displayVal(horoscope.yoni)} />
        <KV label="Rajju" value={displayVal(horoscope.rajju)} />
        <KV label="Dasa balance" value={displayVal(horoscope.pr_dasabalance)} />
      </Section>

      <Section title="Dosham & Jathagam">
        <KV label="Dosham" value={displayVal(record.dosham)} />
        <KV
          label="Mangal"
          value={
            <Badge
              variant={record.mangal ? "destructive" : "outline"}
              className="text-[10px]"
            >
              {displayVal(record.mangal)}
            </Badge>
          }
        />
        <KV label="Jathagam" value={<Badge variant="outline" className="text-[10px]">{displayVal(record.jathagam)}</Badge>} />
      </Section>

      <Section title="Calculation & Timestamps">
        <KV
          label="Is calculated"
          value={
            <Badge
              variant={horoscope.is_calculated ? "default" : "outline"}
              className="text-[10px]"
            >
              {displayVal(horoscope.is_calculated)}
            </Badge>
          }
        />
        <KV label="Calculated at" value={formatMaybeDate(horoscope.calculated_at)} />
        <KV label="Last edited" value={formatMaybeDate(record.last_edited_at)} />
        <KV label="Created at" value={formatMaybeDate(horoscope.created_at)} />
        <KV label="Updated at" value={formatMaybeDate(horoscope.updated_at)} />
        <KV label="Horoscope ID" value={displayVal(horoscope.id)} />
      </Section>

      <div className="pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Horoscope chart
        </h3>
        <HoroscopeChart charts={charts} source={chartSource} lang={lang} onLangChange={setLang} />
      </div>

      {detailRow.matri_id ? (
        <Button variant="outline" size="sm" asChild>
          <Link to={profilesPath} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            {isAdmin ? "Open Profile Admin" : "Open My Profiles"} ({detailRow.matri_id})
          </Link>
        </Button>
      ) : null}

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">Raw JSON</summary>
        <pre className="mt-2 p-2 rounded bg-muted overflow-x-auto max-h-60">
          {JSON.stringify(detailPayload, null, 2)}
        </pre>
      </details>
    </div>
  );
}
