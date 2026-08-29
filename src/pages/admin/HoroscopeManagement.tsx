import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRole } from "@/contexts/RoleContext";
import { getApiErrorMessage } from "@/lib/admin-api/http";
import {
  fetchHoroscopeRecordDetail,
  fetchHoroscopeRecords,
  fetchHoroscopeSummary,
  fetchSavedPoruthamMatches,
  deleteSavedPoruthamMatches,
  normalizeHoroscopeRecord,
  postHoroscopePorutham,
  runPoruthamBatch,
  savePoruthamMatches,
  type CollectedPoruthamMatch,
  type HoroscopeRecordRow,
  type PoruthamFixedMode,
  type PoruthamNavSelectionItem,
  type SavedPoruthamMatchRow,
} from "@/lib/admin-api/horoscope";
import {
  Star, Eye, FileText,
  Clock, Heart, Sparkles,
  Shield, Loader2, ChevronLeft, ChevronRight, ExternalLink, Link2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import HoroscopeSearchFilters from "@/components/horoscope/HoroscopeSearchFilters";
import PoruthamProfileMultiPicker from "@/components/horoscope/PoruthamProfileMultiPicker";
import PoruthamPartnerFilters from "@/components/horoscope/PoruthamPartnerFilters";
import PoruthamCollectedMatches from "@/components/horoscope/PoruthamCollectedMatches";
import PoruthamSavedMatches from "@/components/horoscope/PoruthamSavedMatches";
import { PoruthamResultView } from "@/components/horoscope/PoruthamResultView";
import { JathagamTab } from "@/components/horoscope/JathagamTab";
import { ProfileDetailPanel } from "@/components/profile/ProfileDetailPanel";
import {
  fetchAdminProfileDetail,
  fetchBranchMyProfileDetail,
  fetchStaffProfileDetail,
} from "@/lib/admin-api/profiles";
import type { UserRole } from "@/types/user-role";
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
import {
  emptyPoruthamPartnerFilters,
  type PoruthamPartnerFiltersState,
} from "@/lib/poruthamPartnerFilters";

/** Branch manager / staff: profile list route; admin uses Profile Admin. */
function fetchMemberProfileDetail(role: UserRole, matriId: string) {
  if (role === "branch-manager") return fetchBranchMyProfileDetail(matriId);
  if (role === "staff") return fetchStaffProfileDetail(matriId);
  return fetchAdminProfileDetail(matriId);
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
  const [profileMatriId, setProfileMatriId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");

  const [selectedBrides, setSelectedBrides] = useState<PoruthamNavSelectionItem[]>([]);
  const [selectedGrooms, setSelectedGrooms] = useState<PoruthamNavSelectionItem[]>([]);
  const [poruthamMode, setPoruthamMode] = useState<PoruthamFixedMode>("fixed-bride");
  const [collectedMatches, setCollectedMatches] = useState<CollectedPoruthamMatch[]>([]);
  const [collectedFixed, setCollectedFixed] = useState<PoruthamNavSelectionItem | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [poruthamResultOpen, setPoruthamResultOpen] = useState(false);
  const [poruthamResult, setPoruthamResult] = useState<unknown>(null);
  const [collectedDetailIndex, setCollectedDetailIndex] = useState<number | null>(null);
  const [partnerFilterDraft, setPartnerFilterDraft] = useState<PoruthamPartnerFiltersState>(
    emptyPoruthamPartnerFilters,
  );
  const [partnerFilterApplied, setPartnerFilterApplied] = useState<PoruthamPartnerFiltersState>(
    emptyPoruthamPartnerFilters,
  );
  const [partnerFilterVersion, setPartnerFilterVersion] = useState(0);
  const [savingMatches, setSavingMatches] = useState(false);
  const [unsavingPartnerId, setUnsavingPartnerId] = useState<number | null>(null);
  const [saveGeneration, setSaveGeneration] = useState(0);

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

  const fixedProfile = poruthamMode === "fixed-bride" ? selectedBrides[0] ?? null : selectedGrooms[0] ?? null;
  const partnerProfiles = poruthamMode === "fixed-bride" ? selectedGrooms : selectedBrides;
  const eligiblePartners = useMemo(
    () =>
      fixedProfile
        ? partnerProfiles.filter((p) => p.profile_id !== fixedProfile.profile_id)
        : partnerProfiles,
    [fixedProfile, partnerProfiles],
  );

  const detailMatch =
    collectedDetailIndex != null ? collectedMatches[collectedDetailIndex] ?? null : null;
  const viewableMatchIndices = useMemo(
    () => collectedMatches.map((m, i) => (m.error ? -1 : i)).filter((i) => i >= 0),
    [collectedMatches],
  );
  const detailViewPosition = detailMatch
    ? viewableMatchIndices.indexOf(collectedDetailIndex!)
    : -1;

  const handlePoruthamModeChange = useCallback((mode: PoruthamFixedMode) => {
    setPoruthamMode(mode);
    setSelectedBrides([]);
    setSelectedGrooms([]);
    setCollectedMatches([]);
    setCollectedFixed(null);
    setBatchProgress(null);
    setCollectedDetailIndex(null);
    setPoruthamResult(null);
    setPartnerFilterDraft(emptyPoruthamPartnerFilters());
    setPartnerFilterApplied(emptyPoruthamPartnerFilters());
    setPartnerFilterVersion((v) => v + 1);
  }, []);

  const handlePoruthamResultOpenChange = useCallback((open: boolean) => {
    setPoruthamResultOpen(open);
    if (!open) {
      setCollectedDetailIndex(null);
      setPoruthamResult(null);
    }
  }, []);

  const handleViewCollectedMatch = useCallback(
    (index: number) => {
      const match = collectedMatches[index];
      if (!match || match.error) return;
      setCollectedDetailIndex(index);
      setPoruthamResult(match.payload);
      setPoruthamResultOpen(true);
    },
    [collectedMatches],
  );

  const handleRemoveCollectedMatch = useCallback(
    (partnerProfileId: number) => {
      setCollectedMatches((prev) => prev.filter((m) => m.partner.profile_id !== partnerProfileId));
      if (poruthamMode === "fixed-bride") {
        setSelectedGrooms((prev) => prev.filter((p) => p.profile_id !== partnerProfileId));
      } else {
        setSelectedBrides((prev) => prev.filter((p) => p.profile_id !== partnerProfileId));
      }
      if (collectedDetailIndex != null) {
        const current = collectedMatches[collectedDetailIndex];
        if (current?.partner.profile_id === partnerProfileId) {
          handlePoruthamResultOpenChange(false);
        }
      }
    },
    [poruthamMode, collectedDetailIndex, collectedMatches, handlePoruthamResultOpenChange],
  );

  const handleCollectedDetailNav = useCallback(
    (direction: -1 | 1) => {
      if (detailViewPosition < 0) return;
      const nextPos = detailViewPosition + direction;
      if (nextPos < 0 || nextPos >= viewableMatchIndices.length) return;
      const nextIndex = viewableMatchIndices[nextPos]!;
      handleViewCollectedMatch(nextIndex);
    },
    [detailViewPosition, viewableMatchIndices, handleViewCollectedMatch],
  );

  const handlePoruthamBatch = useCallback(async () => {
    if (!fixedProfile) {
      toast({
        title: "Select fixed profile",
        description:
          poruthamMode === "fixed-bride"
            ? "Choose exactly one bride profile."
            : "Choose exactly one groom profile.",
        variant: "destructive",
      });
      return;
    }
    if (eligiblePartners.length === 0) {
      toast({
        title: "Select partners",
        description:
          poruthamMode === "fixed-bride"
            ? "Choose at least one groom profile."
            : "Choose at least one bride profile.",
        variant: "destructive",
      });
      return;
    }

    setBatchRunning(true);
    setBatchProgress({ current: 0, total: eligiblePartners.length });
    setCollectedMatches([]);
    setCollectedFixed(fixedProfile);
    setCollectedDetailIndex(null);
    setPoruthamResult(null);

    try {
      const results = await runPoruthamBatch({
        role,
        mode: poruthamMode,
        fixed: fixedProfile,
        partners: eligiblePartners,
        onProgress: (current, total) => setBatchProgress({ current, total }),
      });
      setCollectedMatches(results);
      queryClient.invalidateQueries({ queryKey: ["horoscope", role, "summary"] });
      const ok = results.filter((r) => !r.error).length;
      const failed = results.length - ok;
      toast({
        title: "Porutham calculated",
        description:
          failed > 0
            ? `${ok} match${ok === 1 ? "" : "es"} collected · ${failed} failed`
            : `${ok} match${ok === 1 ? "" : "es"} collected under ${fixedProfile.profile_name || fixedProfile.matri_id}.`,
      });
    } catch (e) {
      toast({
        title: "Porutham batch failed",
        description: e instanceof Error ? e.message : "Request failed",
        variant: "destructive",
      });
    } finally {
      setBatchRunning(false);
      setBatchProgress(null);
    }
  }, [fixedProfile, eligiblePartners, poruthamMode, role, queryClient, toast]);

  const savedMatchesQueryKey = ["horoscope", role, "porutham-saved", fixedProfile?.profile_id];

  const {
    data: savedMatches = [],
    isLoading: savedMatchesLoading,
    refetch: refetchSavedMatches,
  } = useQuery({
    queryKey: savedMatchesQueryKey,
    queryFn: () => fetchSavedPoruthamMatches(role, fixedProfile!.profile_id),
    enabled: activeTab === "matches" && fixedProfile != null,
  });

  const savedPartnerIds = useMemo(
    () =>
      new Set(
        savedMatches
          .map((r) => r.partner_profile_id)
          .filter((id): id is number => id != null),
      ),
    [savedMatches],
  );

  const handleSaveSelectedMatches = useCallback(
    async (partnerProfileIds: number[]) => {
      if (!fixedProfile) return;
      setSavingMatches(true);
      try {
        const idSet = new Set(partnerProfileIds);
        const partners = collectedMatches
          .filter((m) => !m.error && idSet.has(m.partner.profile_id))
          .map((m) => ({
            profile_id: m.partner.profile_id,
            matri_id: m.partner.matri_id,
            profile_name: m.partner.profile_name,
            score: m.score,
            max_score: m.max_score,
            overall_result: m.overall_result,
          }));
        await savePoruthamMatches(role, {
          mode: poruthamMode,
          fixed_profile_id: fixedProfile.profile_id,
          partner_profile_ids: partnerProfileIds,
          partners,
        });
        await refetchSavedMatches();
        setSaveGeneration((g) => g + 1);
        toast({
          title: "Matches saved",
          description: `${partnerProfileIds.length} match${partnerProfileIds.length === 1 ? "" : "es"} saved for later review.`,
        });
      } catch (e) {
        toast({
          title: "Save failed",
          description: getApiErrorMessage(e),
          variant: "destructive",
        });
      } finally {
        setSavingMatches(false);
      }
    },
    [fixedProfile, collectedMatches, poruthamMode, role, refetchSavedMatches, toast],
  );

  const handleUnsaveMatch = useCallback(
    async (partnerProfileId: number) => {
      if (!fixedProfile) return;
      setUnsavingPartnerId(partnerProfileId);
      try {
        await deleteSavedPoruthamMatches(role, {
          fixed_profile_id: fixedProfile.profile_id,
          partner_profile_ids: [partnerProfileId],
        });
        await refetchSavedMatches();
        toast({ title: "Match removed from saved list" });
      } catch (e) {
        toast({
          title: "Unsave failed",
          description: getApiErrorMessage(e),
          variant: "destructive",
        });
      } finally {
        setUnsavingPartnerId(null);
      }
    },
    [fixedProfile, role, refetchSavedMatches, toast],
  );

  const handleViewSavedMatch = useCallback(
    async (row: SavedPoruthamMatchRow) => {
      if (!fixedProfile || row.partner_profile_id == null) return;
      try {
        const bride_profile_id =
          poruthamMode === "fixed-bride" ? fixedProfile.profile_id : row.partner_profile_id;
        const groom_profile_id =
          poruthamMode === "fixed-bride" ? row.partner_profile_id : fixedProfile.profile_id;
        const payload = await postHoroscopePorutham(role, { bride_profile_id, groom_profile_id });
        setCollectedDetailIndex(null);
        setPoruthamResult(payload);
        setPoruthamResultOpen(true);
      } catch (e) {
        toast({
          title: "Could not load match",
          description: getApiErrorMessage(e),
          variant: "destructive",
        });
      }
    },
    [fixedProfile, poruthamMode, role, toast],
  );

  const detailBrideMatri =
    poruthamMode === "fixed-bride"
      ? collectedFixed?.matri_id ?? ""
      : detailMatch?.partner.matri_id ?? "";
  const detailGroomMatri =
    poruthamMode === "fixed-groom"
      ? collectedFixed?.matri_id ?? ""
      : detailMatch?.partner.matri_id ?? "";

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
    queryKey: ["horoscope", role, "records", applied, page, pageSize, horoscopeBranchId],
    queryFn: () =>
      fetchHoroscopeRecords(role, {
        ...horoscopeSearchToQuery(applied, { page, page_size: pageSize }),
        ...(horoscopeBranchId != null ? { branch_id: horoscopeBranchId } : {}),
      }),
  });

  const { data: detailPayload, isLoading: detailLoading, error: detailError } = useQuery({
    queryKey: ["horoscope", role, "detail", viewUserUuid],
    queryFn: () => fetchHoroscopeRecordDetail(role, viewUserUuid!),
    enabled: viewOpen && !!viewUserUuid && !viewUserUuid.startsWith("row-"),
  });

  const openView = (row: HoroscopeRecordRow) => {
    setViewUserUuid(row.user_uuid);
    setViewRow(row);
    setViewOpen(true);
  };

  const openMemberProfile = useCallback((matriId: string, name?: string) => {
    const id = (matriId || "").trim();
    if (!id) return;
    setProfileMatriId(id);
    setProfileName((name || "").trim() || id);
  }, []);

  const { data: memberProfile, isLoading: memberProfileLoading, error: memberProfileError } = useQuery({
    queryKey: ["horoscope", role, "member-profile", profileMatriId],
    queryFn: () => fetchMemberProfileDetail(role, profileMatriId!),
    enabled: !!profileMatriId,
  });

  const totalPages = Math.max(1, Math.ceil((recordsPage?.count ?? 0) / pageSize));

  const canCalculatePorutham =
    Boolean(fixedProfile) && eligiblePartners.length > 0 && !batchRunning;

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
      ]
    : [
        { label: "Total Horoscopes", value: 0, icon: Star, color: "text-accent" },
        { label: "Thalakkuri Generated", value: 0, icon: FileText, color: "text-success" },
        { label: "Pending Generation", value: 0, icon: Clock, color: "text-warning" },
        { label: "Match Calculations", value: 0, icon: Heart, color: "text-primary" },
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <TabsTrigger value="jathagam" className="text-xs gap-1"><FileText className="h-3 w-3" /> Thalakkuri</TabsTrigger>
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
                      <TableHead>Last Edited</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin inline mr-2" /> Loading…
                        </TableCell>
                      </TableRow>
                    ) : (recordsPage?.results ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No records</TableCell>
                      </TableRow>
                    ) : (
                      (recordsPage?.results ?? []).map((h) => (
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
                            <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                              {formatLastEdited(h.last_edited_label || "")}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {h.matri_id ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="View member profile"
                                    onClick={() => openMemberProfile(h.matri_id, h.profile_name)}
                                  >
                                    <Link2 className="h-4 w-4" />
                                  </Button>
                                ) : null}
                                <Button variant="ghost" size="icon" onClick={() => openView(h)} title="View"><Eye className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                      ))
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
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground max-w-3xl">
                Pick one fixed profile, filter partners by religion/caste/horoscope details, select many,
                calculate porutham, tick the matches you want to keep, and save for later review.
              </p>

              <div className="space-y-2 max-w-3xl">
                <Label>Match mode</Label>
                <RadioGroup
                  value={poruthamMode}
                  onValueChange={(v) => handlePoruthamModeChange(v as PoruthamFixedMode)}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed-bride" id="porutham-fixed-bride" />
                    <Label htmlFor="porutham-fixed-bride" className="font-normal cursor-pointer">
                      Fixed bride — match many grooms
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed-groom" id="porutham-fixed-groom" />
                    <Label htmlFor="porutham-fixed-groom" className="font-normal cursor-pointer">
                      Fixed groom — match many brides
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <p className="text-xs text-muted-foreground -mt-2">
                Star, rasi, and rajju apply as soon as you choose them — open either list to see matching profiles.
              </p>

              <PoruthamPartnerFilters
                key={partnerFilterVersion}
                value={partnerFilterDraft}
                onChange={(next) => {
                  setPartnerFilterDraft(next);
                  setPartnerFilterApplied({ ...next });
                }}
                onApply={() => {
                  setPartnerFilterApplied({ ...partnerFilterDraft });
                  setPartnerFilterVersion((v) => v + 1);
                }}
                onReset={() => {
                  const empty = emptyPoruthamPartnerFilters();
                  setPartnerFilterDraft(empty);
                  setPartnerFilterApplied(empty);
                  setPartnerFilterVersion((v) => v + 1);
                }}
              />

              <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
                <div className="space-y-2">
                  <Label>
                    {poruthamMode === "fixed-bride" ? "Fixed bride (select one)" : "Partner brides (select many)"}
                  </Label>
                  <PoruthamProfileMultiPicker
                    selected={selectedBrides}
                    onSelectedChange={setSelectedBrides}
                    placeholder={
                      poruthamMode === "fixed-bride"
                        ? "Search and select one bride…"
                        : "Search and select brides…"
                    }
                    role={role}
                    branchId={horoscopeBranchId}
                    tabActive={activeTab === "matches"}
                    instanceId="bride"
                    maxSelection={poruthamMode === "fixed-bride" ? 1 : undefined}
                    partnerFilters={partnerFilterApplied}
                    filterVersion={partnerFilterVersion}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {poruthamMode === "fixed-groom" ? "Fixed groom (select one)" : "Partner grooms (select many)"}
                  </Label>
                  <PoruthamProfileMultiPicker
                    selected={selectedGrooms}
                    onSelectedChange={setSelectedGrooms}
                    placeholder={
                      poruthamMode === "fixed-groom"
                        ? "Search and select one groom…"
                        : "Search and select grooms…"
                    }
                    role={role}
                    branchId={horoscopeBranchId}
                    tabActive={activeTab === "matches"}
                    instanceId="groom"
                    maxSelection={poruthamMode === "fixed-groom" ? 1 : undefined}
                    partnerFilters={partnerFilterApplied}
                    filterVersion={partnerFilterVersion}
                  />
                </div>
              </div>

              <div className="max-w-3xl space-y-2">
                <Button onClick={() => void handlePoruthamBatch()} disabled={!canCalculatePorutham}>
                  {batchRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Calculate porutham
                </Button>
                {batchProgress ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Calculating {batchProgress.current} of {batchProgress.total}…
                    </p>
                    <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-2" />
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {collectedFixed && collectedMatches.length > 0 ? (
            <PoruthamCollectedMatches
              mode={poruthamMode}
              fixed={collectedFixed}
              matches={collectedMatches}
              onView={handleViewCollectedMatch}
              onRemove={handleRemoveCollectedMatch}
              onSaveSelected={handleSaveSelectedMatches}
              saving={savingMatches}
              savedPartnerIds={savedPartnerIds}
              saveGeneration={saveGeneration}
            />
          ) : null}

          {fixedProfile ? (
            <PoruthamSavedMatches
              mode={poruthamMode}
              rows={savedMatches}
              loading={savedMatchesLoading}
              onView={handleViewSavedMatch}
              onUnsave={handleUnsaveMatch}
              unsavingId={unsavingPartnerId}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="jathagam" className="space-y-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Thalakkuri
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Download Thalakkuri documents for members</p>
          </div>
          <JathagamTab
            active={activeTab === "jathagam"}
            role={role}
            branchId={horoscopeBranchId}
            summary={summary}
            summaryLoading={summaryLoading}
          />
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
              onOpenMemberProfile={openMemberProfile}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No detail returned.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!profileMatriId}
        onOpenChange={(o) => {
          if (!o) {
            setProfileMatriId(null);
            setProfileName("");
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>Profile Details — {profileMatriId}</DialogTitle>
            <DialogDescription className="sr-only">
              View {profileName || "member"} profile.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
            {memberProfileLoading ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
              </div>
            ) : memberProfileError ? (
              <p className="text-sm text-destructive py-4">{errMsg(memberProfileError)}</p>
            ) : memberProfile ? (
              <ProfileDetailPanel detail={memberProfile} showAdmin={isAdmin} />
            ) : (
              <p className="text-sm text-muted-foreground py-4">No profile found.</p>
            )}
          </ScrollArea>
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
              brideMatriId={detailBrideMatri}
              groomMatriId={detailGroomMatri}
            />
          ) : null}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
            {viewableMatchIndices.length > 1 && collectedDetailIndex != null ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={detailViewPosition <= 0}
                  onClick={() => handleCollectedDetailNav(-1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous match
                </Button>
                <span className="text-xs text-muted-foreground">
                  {detailViewPosition + 1} / {viewableMatchIndices.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={detailViewPosition >= viewableMatchIndices.length - 1}
                  onClick={() => handleCollectedDetailNav(1)}
                >
                  Next match <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ) : (
              <span />
            )}
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
  onOpenMemberProfile: (matriId: string, name?: string) => void;
}

function HoroscopeDetailBody({
  detailPayload,
  detailRow,
  detailError,
  horoscopeAvailable,
  onOpenMemberProfile,
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
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onOpenMemberProfile(detailRow.matri_id, detailRow.profile_name)}
        >
          <ExternalLink className="h-4 w-4" />
          View profile ({detailRow.matri_id})
        </Button>
      ) : null}
    </div>
  );
}
