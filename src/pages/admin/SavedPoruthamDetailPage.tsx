import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PoruthamResultView } from "@/components/horoscope/PoruthamResultView";
import { ProfileDetailPanel } from "@/components/profile/ProfileDetailPanel";
import { useRole } from "@/contexts/RoleContext";
import { getApiErrorMessage } from "@/lib/admin-api/http";
import {
  deleteSavedPoruthamMatches,
  fetchSavedPoruthamMatchesPage,
  normalizePoruthamMode,
  postHoroscopePorutham,
  type SavedPoruthamMatchRow,
} from "@/lib/admin-api/horoscope";
import {
  fetchAdminProfileDetail,
  fetchBranchMyProfileDetail,
  fetchStaffProfileDetail,
} from "@/lib/admin-api/profiles";
import { formatDateTime } from "@/lib/format-date";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@/types/user-role";

const PAGE_SIZE = 20;

function fetchMemberProfileDetail(role: UserRole, matriId: string) {
  if (role === "branch-manager") return fetchBranchMyProfileDetail(matriId);
  if (role === "staff") return fetchStaffProfileDetail(matriId);
  return fetchAdminProfileDetail(matriId);
}

function profileLabel(name: string, matriId: string): string {
  const n = name.trim();
  const m = matriId.trim();
  if (n && m) return `${n} · ${m}`;
  return n || m || "—";
}

function partnerRole(mode: string): string {
  return normalizePoruthamMode(mode) === "fixed-groom" ? "Bride" : "Groom";
}

function isExcellent(result: string): boolean {
  return result.trim().toLowerCase() === "excellent";
}

export default function SavedPoruthamDetailPage() {
  const { fixedProfileId: rawId } = useParams();
  const fixedProfileId = Number(rawId);
  const { role } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [unsavingId, setUnsavingId] = useState<number | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [poruthamResultOpen, setPoruthamResultOpen] = useState(false);
  const [poruthamResult, setPoruthamResult] = useState<unknown>(null);
  const [viewRow, setViewRow] = useState<SavedPoruthamMatchRow | null>(null);
  const [profileMatriId, setProfileMatriId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");

  const validId = Number.isFinite(fixedProfileId) && fixedProfileId > 0;
  const isAdmin = role === "admin";

  const queryKey = [
    "horoscope",
    role,
    "porutham-saved",
    fixedProfileId,
    page,
    PAGE_SIZE,
    search,
  ];

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchSavedPoruthamMatchesPage(role, {
        fixed_profile_id: fixedProfileId,
        page,
        page_size: PAGE_SIZE,
        search: search || undefined,
      }),
    enabled: validId,
  });

  const rows = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));
  const headerRow = rows[0];
  const errMsg = error ? getApiErrorMessage(error) : "";

  const viewRowIndex = useMemo(() => {
    if (!viewRow) return -1;
    return rows.findIndex((r) => r.id === viewRow.id);
  }, [rows, viewRow]);

  const detailBrideMatri = useMemo(() => {
    if (!viewRow) return "";
    return normalizePoruthamMode(viewRow.mode) === "fixed-groom"
      ? viewRow.partner_matri_id
      : viewRow.fixed_matri_id;
  }, [viewRow]);
  const detailGroomMatri = useMemo(() => {
    if (!viewRow) return "";
    return normalizePoruthamMode(viewRow.mode) === "fixed-groom"
      ? viewRow.fixed_matri_id
      : viewRow.partner_matri_id;
  }, [viewRow]);
  const detailBrideName = useMemo(() => {
    if (!viewRow) return "";
    return normalizePoruthamMode(viewRow.mode) === "fixed-groom"
      ? viewRow.partner_name
      : viewRow.fixed_name;
  }, [viewRow]);
  const detailGroomName = useMemo(() => {
    if (!viewRow) return "";
    return normalizePoruthamMode(viewRow.mode) === "fixed-groom"
      ? viewRow.fixed_name
      : viewRow.partner_name;
  }, [viewRow]);

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

  const handlePoruthamResultOpenChange = useCallback((open: boolean) => {
    setPoruthamResultOpen(open);
    if (!open) {
      setPoruthamResult(null);
      setViewRow(null);
    }
  }, []);

  const handleView = useCallback(
    async (row: SavedPoruthamMatchRow) => {
      if (row.fixed_profile_id == null || row.partner_profile_id == null) return;
      const mode = normalizePoruthamMode(row.mode) ?? "fixed-bride";
      setViewLoading(true);
      try {
        const bride_profile_id =
          mode === "fixed-bride" ? row.fixed_profile_id : row.partner_profile_id;
        const groom_profile_id =
          mode === "fixed-bride" ? row.partner_profile_id : row.fixed_profile_id;
        const payload = await postHoroscopePorutham(role, { bride_profile_id, groom_profile_id });
        setViewRow(row);
        setPoruthamResult(payload);
        setPoruthamResultOpen(true);
      } catch (e) {
        toast({
          title: "Could not load match",
          description: getApiErrorMessage(e),
          variant: "destructive",
        });
      } finally {
        setViewLoading(false);
      }
    },
    [role, toast],
  );

  const handleDetailNav = useCallback(
    (delta: -1 | 1) => {
      if (viewRowIndex < 0) return;
      const next = viewRowIndex + delta;
      if (next < 0 || next >= rows.length) return;
      void handleView(rows[next]!);
    },
    [viewRowIndex, rows, handleView],
  );

  const handleUnsave = useCallback(
    async (row: SavedPoruthamMatchRow) => {
      if (row.fixed_profile_id == null || row.partner_profile_id == null) return;
      setUnsavingId(row.id);
      try {
        await deleteSavedPoruthamMatches(role, {
          fixed_profile_id: row.fixed_profile_id,
          partner_profile_ids: [row.partner_profile_id],
        });
        await queryClient.invalidateQueries({ queryKey: ["horoscope", role, "porutham-saved"] });
        toast({ title: "Match removed from saved list" });
      } catch (e) {
        toast({
          title: "Unsave failed",
          description: getApiErrorMessage(e),
          variant: "destructive",
        });
      } finally {
        setUnsavingId(null);
      }
    },
    [role, queryClient, toast],
  );

  const handleRemoveFromDialog = useCallback(async () => {
    if (!viewRow || viewRow.fixed_profile_id == null || viewRow.partner_profile_id == null) return;
    const removedAt = rows.findIndex((r) => r.id === viewRow.id);
    const nextRows = rows.filter((r) => r.id !== viewRow.id);

    setUnsavingId(viewRow.id);
    try {
      await deleteSavedPoruthamMatches(role, {
        fixed_profile_id: viewRow.fixed_profile_id,
        partner_profile_ids: [viewRow.partner_profile_id],
      });
      await queryClient.invalidateQueries({ queryKey: ["horoscope", role, "porutham-saved"] });
      toast({ title: "Match removed from saved list" });

      if (nextRows.length === 0) {
        handlePoruthamResultOpenChange(false);
        return;
      }

      // Prefer the partner that was after the removed one; else the previous.
      const pick =
        removedAt >= 0 && removedAt < nextRows.length
          ? removedAt
          : Math.max(0, nextRows.length - 1);
      await handleView(nextRows[pick]!);
    } catch (e) {
      toast({
        title: "Unsave failed",
        description: getApiErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setUnsavingId(null);
    }
  }, [viewRow, rows, role, queryClient, toast, handlePoruthamResultOpenChange, handleView]);

  if (!validId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Invalid saved profile.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/horoscope/saved-porutham">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to saved matches
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link to="/horoscope/saved-porutham">
              <ArrowLeft className="h-4 w-4 mr-1" /> All saved profiles
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Heart className="h-6 w-6 text-accent" />
            {headerRow
              ? profileLabel(headerRow.fixed_name, headerRow.fixed_matri_id)
              : "Saved porutham matches"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All saved partners for this profile. View opens full porutham details.
          </p>
        </div>
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-base">Saved matches</CardTitle>
            <form
              className="relative w-full sm:w-72"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchDraft.trim());
                setPage(1);
              }}
            >
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search partner name or Matri ID…"
                className="pl-8 h-9"
              />
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 flex justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading matches…
            </div>
          ) : errMsg ? (
            <p className="text-sm text-destructive py-6 text-center">{errMsg}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {search
                ? `No saved matches match “${search}”.`
                : "No saved porutham matches for this profile."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Saved by</TableHead>
                    <TableHead>Saved at</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const canAct = row.fixed_profile_id != null && row.partner_profile_id != null;
                    const excellent = isExcellent(row.overall_result);
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-medium">
                            {profileLabel(row.partner_name, row.partner_matri_id)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {partnerRole(row.mode)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.score % 1 ? row.score.toFixed(1) : row.score}/{row.max_score}
                        </TableCell>
                        <TableCell>
                          {excellent ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 font-normal">
                              {row.overall_result}
                            </Badge>
                          ) : (
                            row.overall_result || "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.saved_by_name || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.updated_at ? formatDateTime(row.updated_at) : "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!canAct}
                            onClick={() => void handleView(row)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={!canAct || unsavingId === row.id}
                            onClick={() => void handleUnsave(row)}
                          >
                            {unsavingId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-1" />
                            )}
                            Unsave
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>
                  Page {page} of {totalPages}
                  {data?.count ? ` · ${data.count} matches` : null}
                  {isFetching && !isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin inline ml-2" />
                  ) : null}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isFetching}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={poruthamResultOpen} onOpenChange={handlePoruthamResultOpenChange}>
        <DialogContent className="w-[96vw] max-w-6xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Porutham result</DialogTitle>
          </DialogHeader>
          {viewLoading && poruthamResult == null ? (
            <div className="py-10 flex justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading match…
            </div>
          ) : poruthamResult != null ? (
            <PoruthamResultView
              result={poruthamResult}
              role={role}
              brideMatriId={detailBrideMatri}
              groomMatriId={detailGroomMatri}
              onViewBrideProfile={
                detailBrideMatri
                  ? () => openMemberProfile(detailBrideMatri, detailBrideName)
                  : undefined
              }
              onViewGroomProfile={
                detailGroomMatri
                  ? () => openMemberProfile(detailGroomMatri, detailGroomName)
                  : undefined
              }
              headerActions={
                viewRow ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={unsavingId === viewRow.id || viewLoading}
                    onClick={() => void handleRemoveFromDialog()}
                  >
                    {unsavingId === viewRow.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    Remove
                  </Button>
                ) : null
              }
            />
          ) : null}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
            {rows.length > 1 && viewRowIndex >= 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={viewRowIndex <= 0 || viewLoading || unsavingId != null}
                  onClick={() => handleDetailNav(-1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous match
                </Button>
                <span className="text-xs text-muted-foreground">
                  {viewRowIndex + 1} / {rows.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    viewRowIndex >= rows.length - 1 || viewLoading || unsavingId != null
                  }
                  onClick={() => handleDetailNav(1)}
                >
                  Next match <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ) : (
              <span />
            )}
            <Button
              variant="outline"
              disabled={unsavingId != null}
              onClick={() => handlePoruthamResultOpenChange(false)}
            >
              Close
            </Button>
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
              <p className="text-sm text-destructive py-4">{getApiErrorMessage(memberProfileError)}</p>
            ) : memberProfile ? (
              <ProfileDetailPanel detail={memberProfile} showAdmin={isAdmin} />
            ) : (
              <p className="text-sm text-muted-foreground py-4">No profile found.</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
