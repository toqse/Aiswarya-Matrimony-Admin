import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useRole } from "@/contexts/RoleContext";
import type { UserRole } from "@/types/user-role";
import { getApiErrorMessage } from "@/lib/admin-api/http";
import {
  fetchHoroscopeRecordDetail,
  fetchHoroscopeRecords,
  fetchHoroscopeSummary,
  normalizeHoroscopeRecord,
  postHoroscopePorutham,
  initPoruthamNavFromSelection,
  advancePoruthamNav,
  type HoroscopeRecordRow,
  type PoruthamNavSelectionItem,
  type PoruthamNavWindow,
} from "@/lib/admin-api/horoscope";
import {
  Star, Eye, FileText,
  CheckCircle, Clock, XCircle, AlertTriangle, Heart, Sparkles,
  Shield, Loader2, ChevronLeft, ChevronRight, ExternalLink, Link2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import HoroscopeSearchFilters from "@/components/horoscope/HoroscopeSearchFilters";
import PoruthamProfileMultiPicker from "@/components/horoscope/PoruthamProfileMultiPicker";
import { PoruthamResultView } from "@/components/horoscope/PoruthamResultView";
import { JathagamTab } from "@/components/horoscope/JathagamTab";
import {
  HoroscopeChart,
  extractHoroscopeCharts,
  t as horoscopeT,
  MALAYALAM_FONT,
  type HoroscopeDisplay,
  type HoroscopeLang,
} from "@/components/horoscope/HoroscopeChart";
import {
  signNameFromChartString,
  nakshatraDisplayFromStar,
  dasaLordDisplayFromStar,
  localizeHoroscopeDisplay,
} from "@/components/horoscope/horoscope-i18n";
import { formatDate, formatDateTime } from "@/lib/format-date";
import {
  EMPTY_HOROSCOPE_SEARCH,
  horoscopeSearchToQuery,
  type HoroscopeSearchFiltersState,
} from "@/lib/horoscopeSearch";

const jathagamStatusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  generated: { icon: CheckCircle, color: "bg-success/10 text-success", label: "Generated" },
  pending: { icon: Clock, color: "bg-warning/10 text-warning", label: "Pending" },
  failed: { icon: XCircle, color: "bg-destructive/10 text-destructive", label: "Failed" },
  "not-applicable": { icon: AlertTriangle, color: "bg-muted text-muted-foreground", label: "N/A" },
};

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
      parts[parts.length - 1] = formatDateTime(tail);
      return parts.join(" · ");
    }
  }
  const d = new Date(label);
  if (!Number.isNaN(d.getTime())) return formatDateTime(label);
  return label;
}

function pickPoruthamPair(
  brides: PoruthamNavSelectionItem[],
  grooms: PoruthamNavSelectionItem[],
): { bride: PoruthamNavSelectionItem; groom: PoruthamNavSelectionItem } | null {
  for (const bride of brides) {
    for (const groom of grooms) {
      if (bride.profile_id !== groom.profile_id) {
        return { bride, groom };
      }
    }
  }
  return null;
}

function poruthamNavEligibleCount(
  window: PoruthamNavWindow | null,
  excludeProfileId?: number,
  dismissedIds?: ReadonlySet<number>,
): number {
  if (!window) return 0;
  return window.list.filter((r) => !poruthamProfileSkipped(r.profile_id, excludeProfileId, dismissedIds)).length;
}

function poruthamProfileSkipped(
  profileId: number | null | undefined,
  excludeProfileId?: number,
  dismissedIds?: ReadonlySet<number>,
): boolean {
  if (profileId == null) return true;
  if (excludeProfileId != null && profileId === excludeProfileId) return true;
  return dismissedIds?.has(profileId) ?? false;
}

function poruthamNavCapsWithDismissed(
  window: PoruthamNavWindow | null,
  excludeProfileId?: number,
  dismissedIds?: ReadonlySet<number>,
): { canPrev: boolean; canNext: boolean } {
  if (!window || !window.list.length) return { canPrev: false, canNext: false };
  const skipped = (profileId: number | null | undefined) =>
    poruthamProfileSkipped(profileId, excludeProfileId, dismissedIds);
  const canPrev =
    window.list.slice(0, window.index).some((r) => !skipped(r.profile_id)) || window.hasPrevious;
  const canNext =
    window.list.slice(window.index + 1).some((r) => !skipped(r.profile_id)) || window.hasMore;
  return { canPrev, canNext };
}

async function advancePoruthamNavSkippingDismissed(
  role: UserRole,
  branchId: number | undefined,
  input: {
    gender: "F" | "M";
    direction: 1 | -1;
    window: PoruthamNavWindow;
    excludeProfileId?: number;
  },
  dismissedIds: ReadonlySet<number>,
) {
  let window = input.window;
  for (let safety = 0; safety < 200; safety++) {
    const result = await advancePoruthamNav(role, branchId, { ...input, window });
    if (!result.row?.profile_id || !dismissedIds.has(result.row.profile_id)) return result;
    window = result.window;
  }
  return {
    window,
    row: null,
    canPrev: poruthamNavCapsWithDismissed(window, input.excludeProfileId, dismissedIds).canPrev,
    canNext: false,
  };
}

export default function HoroscopeManagement() {
  const { role, branch } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("horoscopes");
  const [filters, setFilters] = useState<HoroscopeSearchFiltersState>(EMPTY_HOROSCOPE_SEARCH);
  const [applied, setApplied] = useState<HoroscopeSearchFiltersState>(EMPTY_HOROSCOPE_SEARCH);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewUserUuid, setViewUserUuid] = useState<string | null>(null);
  const [viewRow, setViewRow] = useState<HoroscopeRecordRow | null>(null);

  const [selectedBrides, setSelectedBrides] = useState<PoruthamNavSelectionItem[]>([]);
  const [selectedGrooms, setSelectedGrooms] = useState<PoruthamNavSelectionItem[]>([]);
  const [poruthamBride, setPoruthamBride] = useState<string>("");
  const [poruthamGroom, setPoruthamGroom] = useState<string>("");
  const [poruthamResultOpen, setPoruthamResultOpen] = useState(false);
  const [poruthamResult, setPoruthamResult] = useState<unknown>(null);
  const [brideNavWindow, setBrideNavWindow] = useState<PoruthamNavWindow | null>(null);
  const [groomNavWindow, setGroomNavWindow] = useState<PoruthamNavWindow | null>(null);
  const [poruthamNavLoading, setPoruthamNavLoading] = useState<"bride" | "groom" | null>(null);
  const [dismissedBrideProfileIds, setDismissedBrideProfileIds] = useState<Set<number>>(() => new Set());
  const [dismissedGroomProfileIds, setDismissedGroomProfileIds] = useState<Set<number>>(() => new Set());
  const [poruthamRemainingCount, setPoruthamRemainingCount] = useState(0);

  const isAdmin = role === "admin";
  const isBranchManager = role === "branch-manager";

  /** Admin: from applied filter. Branch manager: JWT branch (master id) when present. Staff: omit (server scope). */
  const horoscopeBranchId = useMemo(() => {
    if (isAdmin && applied.branch_id) {
      const n = Number(applied.branch_id);
      return Number.isFinite(n) ? n : undefined;
    }
    if (isBranchManager && typeof branch?.id === "number" && Number.isFinite(branch.id)) return branch.id;
    return undefined;
  }, [isAdmin, isBranchManager, branch?.id, applied.branch_id]);

  const poruthamBrideMatri = useMemo(
    () => selectedBrides.find((s) => String(s.profile_id) === poruthamBride)?.matri_id ?? "",
    [selectedBrides, poruthamBride],
  );
  const poruthamGroomMatri = useMemo(
    () => selectedGrooms.find((s) => String(s.profile_id) === poruthamGroom)?.matri_id ?? "",
    [selectedGrooms, poruthamGroom],
  );

  const profilesPath = profilesListPath(role);

  const setupPoruthamNav = useCallback(
    (
      brideId: number,
      groomId: number,
      resultData: unknown,
      brideSelections: PoruthamNavSelectionItem[],
      groomSelections: PoruthamNavSelectionItem[],
    ) => {
      try {
        const brideWin = initPoruthamNavFromSelection(brideSelections, brideId, {
          matriId: brideSelections.find((s) => s.profile_id === brideId)?.matri_id,
          profileName: poruthamPersonName(resultData, "bride"),
        });
        const groomWin = initPoruthamNavFromSelection(groomSelections, groomId, {
          matriId: groomSelections.find((s) => s.profile_id === groomId)?.matri_id,
          profileName: poruthamPersonName(resultData, "groom"),
        });
        setBrideNavWindow(brideWin);
        setGroomNavWindow(groomWin);
        const brideEligible = poruthamNavEligibleCount(brideWin, groomId, new Set());
        const groomEligible = poruthamNavEligibleCount(groomWin, brideId, new Set());
        setPoruthamRemainingCount(brideEligible + groomEligible);
      } catch {
        setBrideNavWindow(null);
        setGroomNavWindow(null);
      }
    },
    [],
  );

  const executePorutham = useCallback(
    async (brideId: number, groomId: number, navSide?: "bride" | "groom") => {
      if (navSide) setPoruthamNavLoading(navSide);
      try {
        const data = await postHoroscopePorutham(role, {
          bride_profile_id: brideId,
          groom_profile_id: groomId,
        });
        setPoruthamResult(data);
        setPoruthamResultOpen(true);
        queryClient.invalidateQueries({ queryKey: ["horoscope", role, "summary"] });
        return data;
      } catch (e) {
        toast({
          title: "Porutham failed",
          description: e instanceof Error ? e.message : "Request failed",
          variant: "destructive",
        });
        throw e;
      } finally {
        setPoruthamNavLoading(null);
      }
    },
    [role, queryClient, toast],
  );

  const resetPoruthamNav = useCallback(() => {
    setBrideNavWindow(null);
    setGroomNavWindow(null);
    setPoruthamNavLoading(null);
    setDismissedBrideProfileIds(new Set());
    setDismissedGroomProfileIds(new Set());
    setPoruthamRemainingCount(0);
  }, []);

  const handlePoruthamResultOpenChange = useCallback(
    (open: boolean) => {
      setPoruthamResultOpen(open);
      if (!open) resetPoruthamNav();
    },
    [resetPoruthamNav],
  );

  const handleBrideNav = useCallback(
    async (direction: 1 | -1) => {
      if (!brideNavWindow || poruthamNavLoading) return;
      const groomId = Number(poruthamGroom);
      if (!Number.isFinite(groomId)) return;
      try {
        const advanced = await advancePoruthamNavSkippingDismissed(
          role,
          horoscopeBranchId,
          {
            gender: "F",
            direction,
            window: brideNavWindow,
            excludeProfileId: groomId,
          },
          dismissedBrideProfileIds,
        );
        if (!advanced.row?.profile_id) return;
        setBrideNavWindow(advanced.window);
        setPoruthamBride(String(advanced.row.profile_id));
        await executePorutham(advanced.row.profile_id, groomId, "bride");
      } catch {
        /* toast shown in executePorutham */
      }
    },
    [
      brideNavWindow,
      poruthamNavLoading,
      poruthamGroom,
      role,
      horoscopeBranchId,
      executePorutham,
      dismissedBrideProfileIds,
    ],
  );

  const handleBrideDismiss = useCallback(async () => {
    if (!brideNavWindow || poruthamNavLoading) return;
    const brideId = Number(poruthamBride);
    const groomId = Number(poruthamGroom);
    if (!Number.isFinite(brideId) || !Number.isFinite(groomId)) return;
    const nextDismissed = new Set(dismissedBrideProfileIds);
    nextDismissed.add(brideId);
    setDismissedBrideProfileIds(nextDismissed);
    setPoruthamRemainingCount((c) => Math.max(0, c - 1));
    try {
      const advanced = await advancePoruthamNavSkippingDismissed(
        role,
        horoscopeBranchId,
        {
          gender: "F",
          direction: 1,
          window: brideNavWindow,
          excludeProfileId: groomId,
        },
        nextDismissed,
      );
      if (!advanced.row?.profile_id) return;
      setBrideNavWindow(advanced.window);
      setPoruthamBride(String(advanced.row.profile_id));
      await executePorutham(advanced.row.profile_id, groomId, "bride");
    } catch {
      /* toast shown in executePorutham */
    }
  }, [
    brideNavWindow,
    poruthamNavLoading,
    poruthamBride,
    poruthamGroom,
    dismissedBrideProfileIds,
    role,
    horoscopeBranchId,
    executePorutham,
  ]);

  const handleGroomNav = useCallback(
    async (direction: 1 | -1) => {
      if (!groomNavWindow || poruthamNavLoading) return;
      const brideId = Number(poruthamBride);
      if (!Number.isFinite(brideId)) return;
      try {
        const advanced = await advancePoruthamNavSkippingDismissed(
          role,
          horoscopeBranchId,
          {
            gender: "M",
            direction,
            window: groomNavWindow,
            excludeProfileId: brideId,
          },
          dismissedGroomProfileIds,
        );
        if (!advanced.row?.profile_id) return;
        setGroomNavWindow(advanced.window);
        setPoruthamGroom(String(advanced.row.profile_id));
        await executePorutham(brideId, advanced.row.profile_id, "groom");
      } catch {
        /* toast shown in executePorutham */
      }
    },
    [
      groomNavWindow,
      poruthamNavLoading,
      poruthamBride,
      role,
      horoscopeBranchId,
      executePorutham,
      dismissedGroomProfileIds,
    ],
  );

  const handleGroomDismiss = useCallback(async () => {
    if (!groomNavWindow || poruthamNavLoading) return;
    const brideId = Number(poruthamBride);
    const groomId = Number(poruthamGroom);
    if (!Number.isFinite(brideId) || !Number.isFinite(groomId)) return;
    const nextDismissed = new Set(dismissedGroomProfileIds);
    nextDismissed.add(groomId);
    setDismissedGroomProfileIds(nextDismissed);
    setPoruthamRemainingCount((c) => Math.max(0, c - 1));
    try {
      const advanced = await advancePoruthamNavSkippingDismissed(
        role,
        horoscopeBranchId,
        {
          gender: "M",
          direction: 1,
          window: groomNavWindow,
          excludeProfileId: brideId,
        },
        nextDismissed,
      );
      if (!advanced.row?.profile_id) return;
      setGroomNavWindow(advanced.window);
      setPoruthamGroom(String(advanced.row.profile_id));
      await executePorutham(brideId, advanced.row.profile_id, "groom");
    } catch {
      /* toast shown in executePorutham */
    }
  }, [
    groomNavWindow,
    poruthamNavLoading,
    poruthamBride,
    poruthamGroom,
    dismissedGroomProfileIds,
    role,
    horoscopeBranchId,
    executePorutham,
  ]);

  const groomProfileIdNum = Number(poruthamGroom);
  const brideProfileIdNum = Number(poruthamBride);
  const brideNavCaps = poruthamNavCapsWithDismissed(
    brideNavWindow,
    Number.isFinite(groomProfileIdNum) ? groomProfileIdNum : undefined,
    dismissedBrideProfileIds,
  );
  const groomNavCaps = poruthamNavCapsWithDismissed(
    groomNavWindow,
    Number.isFinite(brideProfileIdNum) ? brideProfileIdNum : undefined,
    dismissedGroomProfileIds,
  );

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
    queryKey: ["horoscope", role, "records", applied, page, pageSize],
    queryFn: () =>
      fetchHoroscopeRecords(role, horoscopeSearchToQuery(applied, { page, page_size: pageSize })),
  });

  const { data: detailPayload, isLoading: detailLoading, error: detailError } = useQuery({
    queryKey: ["horoscope", role, "detail", viewUserUuid],
    queryFn: () => fetchHoroscopeRecordDetail(role, viewUserUuid!),
    enabled: viewOpen && !!viewUserUuid && !viewUserUuid.startsWith("row-"),
  });

  const poruthamMut = useMutation({
    mutationFn: (body: { bride_profile_id: number; groom_profile_id: number }) => postHoroscopePorutham(role, body),
    onSuccess: async (data, variables) => {
      setPoruthamResult(data);
      setPoruthamResultOpen(true);
      toast({ title: "Porutham calculated", description: "See result details." });
      queryClient.invalidateQueries({ queryKey: ["horoscope", role, "summary"] });
      await setupPoruthamNav(
        variables.bride_profile_id,
        variables.groom_profile_id,
        data,
        selectedBrides,
        selectedGrooms,
      );
    },
    onError: (e: Error) => {
      toast({ title: "Porutham failed", description: e.message, variant: "destructive" });
    },
  });

  const openView = (row: HoroscopeRecordRow) => {
    setViewUserUuid(row.user_uuid);
    setViewRow(row);
    setViewOpen(true);
  };

  const totalPages = Math.max(1, Math.ceil((recordsPage?.count ?? 0) / pageSize));

  const handlePoruthamSubmit = () => {
    if (selectedBrides.length === 0 || selectedGrooms.length === 0) {
      toast({
        title: "Select profiles",
        description: "Choose at least one bride and one groom from the lists.",
        variant: "destructive",
      });
      return;
    }
    const pair = pickPoruthamPair(selectedBrides, selectedGrooms);
    if (!pair) {
      toast({
        title: "Invalid pair",
        description: "Bride and groom must be different profiles.",
        variant: "destructive",
      });
      return;
    }
    setPoruthamBride(String(pair.bride.profile_id));
    setPoruthamGroom(String(pair.groom.profile_id));
    poruthamMut.mutate({
      bride_profile_id: pair.bride.profile_id,
      groom_profile_id: pair.groom.profile_id,
    });
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

  const kpis = summary
    ? [
        { label: "Total Horoscopes", value: summary.total_horoscopes, icon: Star, color: "text-accent" },
        { label: "Thalakkuri Generated", value: summary.jathagam_generated, icon: FileText, color: "text-success" },
        { label: "Pending Generation", value: summary.pending_generation, icon: Clock, color: "text-warning" },
        { label: "Match Calculations", value: summary.match_calculations, icon: Heart, color: "text-primary" },
        { label: "Mangal Dosham", value: summary.mangal_dosham, icon: AlertTriangle, color: "text-destructive" },
      ]
    : [
        { label: "Total Horoscopes", value: 0, icon: Star, color: "text-accent" },
        { label: "Thalakkuri Generated", value: 0, icon: FileText, color: "text-success" },
        { label: "Pending Generation", value: 0, icon: Clock, color: "text-warning" },
        { label: "Match Calculations", value: 0, icon: Heart, color: "text-primary" },
        { label: "Mangal Dosham", value: 0, icon: AlertTriangle, color: "text-destructive" },
      ];

  const detailRow = detailPayload
    ? normalizeHoroscopeRecord(detailPayload, 0)
    : viewRow;
  const horoscopeAvailable = !detailError && !!detailPayload;

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
          <HoroscopeSearchFilters
            value={filters}
            onChange={setFilters}
            onSearch={() => {
              setApplied({ ...filters });
              setPage(1);
            }}
            onReset={() => {
              setFilters(EMPTY_HOROSCOPE_SEARCH);
              setApplied(EMPTY_HOROSCOPE_SEARCH);
              setPage(1);
            }}
            role={role}
          />

          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle className="text-base">Horoscope Records</CardTitle>
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
                      <TableHead>Mangal</TableHead>
                      <TableHead>Jathagam</TableHead>
                      <TableHead>Last Edited</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordsLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin inline mr-2" /> Loading…
                        </TableCell>
                      </TableRow>
                    ) : (recordsPage?.results ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No records</TableCell>
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
                            <TableCell className="text-sm">{formatDate(h.dob)}</TableCell>
                            <TableCell className="text-sm font-medium">{h.rasi || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="text-sm">{h.nakshatram || <span className="text-muted-foreground">—</span>}</TableCell>
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
            </CardHeader>
            <CardContent className="space-y-4 max-w-3xl">
              <p className="text-xs text-muted-foreground">
                Select one or more bride and groom profiles. Porutham results and navigation (prev / next / close) stay
                within your selected lists only.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bride profiles</Label>
                  <PoruthamProfileMultiPicker
                    selected={selectedBrides}
                    onSelectedChange={setSelectedBrides}
                    placeholder="Search and select brides…"
                    role={role}
                    branchId={horoscopeBranchId}
                    tabActive={activeTab === "matches"}
                    instanceId="bride"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Groom profiles</Label>
                  <PoruthamProfileMultiPicker
                    selected={selectedGrooms}
                    onSelectedChange={setSelectedGrooms}
                    placeholder="Search and select grooms…"
                    role={role}
                    branchId={horoscopeBranchId}
                    tabActive={activeTab === "matches"}
                    instanceId="groom"
                  />
                </div>
              </div>
              <Button
                onClick={handlePoruthamSubmit}
                disabled={poruthamMut.isPending || selectedBrides.length === 0 || selectedGrooms.length === 0}
              >
                {poruthamMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Calculate porutham
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jathagam" className="space-y-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Jathagam PDFs
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Download horoscope documents for members</p>
          </div>
          <JathagamTab active={activeTab === "jathagam"} role={role} branchId={horoscopeBranchId} />
        </TabsContent>
      </Tabs>

      <Dialog open={viewOpen} onOpenChange={(o) => { setViewOpen(o); if (!o) { setViewUserUuid(null); setViewRow(null); } }}>
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
              detailError={detailError}
              horoscopeAvailable={horoscopeAvailable}
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

      <Dialog open={poruthamResultOpen} onOpenChange={handlePoruthamResultOpenChange}>
        <DialogContent className="w-[96vw] max-w-6xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Porutham result</DialogTitle>
          </DialogHeader>
          {poruthamResult != null ? (
            <PoruthamResultView
              result={poruthamResult}
              role={role}
              brideMatriId={poruthamBrideMatri}
              groomMatriId={poruthamGroomMatri}
              remainingCount={poruthamRemainingCount}
              personNav={
                brideNavWindow && groomNavWindow
                  ? {
                      bride: {
                        onPrev: () => void handleBrideNav(-1),
                        onNext: () => void handleBrideNav(1),
                        onDismiss: () => void handleBrideDismiss(),
                        canPrev: brideNavCaps.canPrev,
                        canNext: brideNavCaps.canNext,
                        loading: poruthamNavLoading === "bride",
                      },
                      groom: {
                        onPrev: () => void handleGroomNav(-1),
                        onNext: () => void handleGroomNav(1),
                        onDismiss: () => void handleGroomDismiss(),
                        canPrev: groomNavCaps.canPrev,
                        canNext: groomNavCaps.canNext,
                        loading: poruthamNavLoading === "groom",
                      },
                    }
                  : undefined
              }
            />
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => handlePoruthamResultOpenChange(false)}>Close</Button>
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

function pickPada(...vals: unknown[]): string | number | undefined {
  for (const v of vals) {
    if (v == null || v === "") continue;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function poruthamPersonName(data: unknown, side: "bride" | "groom"): string {
  const unwrap = (v: unknown): Record<string, unknown> => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const o = v as Record<string, unknown>;
    if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
      return o.data as Record<string, unknown>;
    }
    return o;
  };
  const root = unwrap(data);
  const key = side === "bride" ? "bride_horoscope" : "groom_horoscope";
  const alt = side === "bride" ? "bride" : "groom";
  const grahanila =
    root.grahanila && typeof root.grahanila === "object" && !Array.isArray(root.grahanila)
      ? (root.grahanila as Record<string, unknown>)
      : null;
  const node = root[key] ?? root[alt] ?? grahanila?.[alt];
  if (node && typeof node === "object" && !Array.isArray(node)) {
    const o = node as Record<string, unknown>;
    const horo =
      o.horoscope && typeof o.horoscope === "object" && !Array.isArray(o.horoscope)
        ? (o.horoscope as Record<string, unknown>)
        : o;
    return pickStr(horo.name, horo.pr_name, horo.profile_name, o.name);
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
  detailError?: unknown;
  horoscopeAvailable: boolean;
  profilesPath: string;
  isAdmin: boolean;
}

function HoroscopeDetailBody({
  detailPayload,
  detailRow,
  detailError,
  horoscopeAvailable,
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
  // Grid (planet placement) only — star/dasa/lagnam/rasi text is taken from the
  // backend display fields (with EXE-matched fallbacks) below.
  const chartSource = {
    rasiString: horoscope.pr_rasi ?? record.pr_rasi ?? payload.pr_rasi,
    amsaString: horoscope.pr_amsa ?? record.pr_amsa ?? payload.pr_amsa,
    bhavaString: horoscope.pr_bhav ?? horoscope.pr_bhava ?? record.pr_bhav ?? record.pr_bhava ?? payload.pr_bhav ?? payload.pr_bhava,
  };

  const [lang, setLang] = useState<HoroscopeLang>("ml");
  const mlFont = lang === "ml" ? MALAYALAM_FONT : undefined;

  const starNumber = horoscope.pr_star ?? record.pr_star ?? payload.pr_star;
  const starPada = pickPada(horoscope.pr_pada, horoscope.nakshatra_pada, record.pr_pada);

  // Prefer the backend's finalized display values; when absent, fall back to the
  // EXE-matched derivation (star name + Vimshottari lord) so Star/Lord/Lagna/Rasi
  // still render. The Dasa balance is always taken from the backend (never recomputed).
  const displayRaw: HoroscopeDisplay = {
    name: pickStr(record.name, horoscope.pr_name, detailRow.profile_name),
    date_of_birth: pickStr(record.dob, horoscope.pr_dob),
    time_of_birth: pickStr(horoscope.pr_tob),
    star_display: pickStr(horoscope.star_display) || nakshatraDisplayFromStar(starNumber, starPada, lang),
    nakshatra_pada: starPada ?? pickPada(horoscope.nakshatra_pada, horoscope.pr_pada),
    dasa_display: pickStr(horoscope.dasa_display),
    dasa_lord: pickStr(horoscope.dasa_lord) || dasaLordDisplayFromStar(starNumber, lang),
    lagnam_display: pickStr(horoscope.lagnam_display) || signNameFromChartString(chartSource.rasiString, 0, lang),
    rasi_display: pickStr(horoscope.rasi_display) || signNameFromChartString(chartSource.rasiString, 2, lang),
  };
  const display = localizeHoroscopeDisplay(displayRaw, lang) ?? displayRaw;

  return (
    <div className="space-y-5 text-sm">
      {!horoscopeAvailable ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
          {getApiErrorMessage(
            detailError,
            "Horoscope has not been generated by the Windows EXE yet.",
          )}
        </div>
      ) : null}

      <Section title="Profile">
        <KV label="Name" value={displayVal(record.name ?? horoscope.pr_name ?? detailRow.profile_name)} />
        <KV label="Matri ID" value={<span className="font-mono">{displayVal(record.matri_id)}</span>} />
        <KV label="Profile ID" value={displayVal(record.profile_id)} />
        <KV label="User ID" value={<span className="font-mono text-xs break-all">{displayVal(record.user_id)}</span>} />
        <KV label="Branch" value={displayVal(record.branch)} />
        <KV label="Religion" value={displayVal(record.religion)} />
      </Section>

      <Section title="Birth Details">
        <KV label="Date of birth" value={formatDate(record.dob ?? horoscope.pr_dob)} />
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
        <KV label="Rasi" value={displayVal(display.rasi_display)} />
        <KV label="Rasi (input)" value={displayVal(horoscope.pr_rasi)} />
        <KV label="Lagnam" value={displayVal(display.lagnam_display)} />
        <KV label="Nakshatram" value={displayVal(display.star_display)} />
        <KV label="Star (input)" value={displayVal(horoscope.pr_star)} />
        <KV label="Nakshatra pada" value={displayVal(horoscope.nakshatra_pada ?? horoscope.pr_pada)} />
        <KV label="Amsa" value={displayVal(horoscope.pr_amsa)} />
        <KV label="Bhava" value={displayVal(horoscope.pr_bhav)} />
        <KV label="Gana" value={displayVal(horoscope.gana)} />
        <KV label="Yoni" value={displayVal(horoscope.yoni)} />
        <KV label="Rajju" value={displayVal(horoscope.rajju)} />
        <KV label="Dasa" value={displayVal(display.dasa_display)} />
        <KV label="Dasa Lord" value={displayVal(display.dasa_lord)} />
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

      {horoscopeAvailable ? (
        <>
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
            <KV label="Calculated at" value={formatDateTime(horoscope.calculated_at)} />
            <KV label="Last edited" value={formatDateTime(record.last_edited_at)} />
            <KV label="Created at" value={formatDateTime(horoscope.created_at)} />
            <KV label="Updated at" value={formatDateTime(horoscope.updated_at)} />
            <KV label="Horoscope ID" value={displayVal(horoscope.id)} />
          </Section>

          <div className="pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Horoscope chart
            </h3>
            <HoroscopeChart charts={charts} source={chartSource} display={display} lang={lang} onLangChange={setLang} />
          </div>
        </>
      ) : (
        <KV label="Last edited" value={formatDateTime(record.last_edited_at)} />
      )}

      {detailRow.matri_id ? (
        <Button variant="outline" size="sm" asChild>
          <Link to={profilesPath} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            {isAdmin ? "Open Profile Admin" : "Open My Profiles"} ({detailRow.matri_id})
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
