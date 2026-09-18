import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRole } from "@/contexts/RoleContext";
import { getApiErrorMessage } from "@/lib/admin-api/http";
import {
  deleteGeneralSelections,
  fetchGeneralSelectionsPage,
  normalizePoruthamMode,
  type GeneralSelectionRow,
} from "@/lib/admin-api/horoscope";
import { formatDateTime } from "@/lib/format-date";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 20;

function profileLabel(name: string, matriId: string): string {
  const n = name.trim();
  const m = matriId.trim();
  if (n && m) return `${n} · ${m}`;
  return n || m || "—";
}

function partnerRole(mode: string): string {
  return normalizePoruthamMode(mode) === "fixed-groom" ? "Bride" : "Groom";
}

export default function SavedSelectionsDetailPage() {
  const { fixedProfileId: rawId } = useParams();
  const fixedProfileId = Number(rawId);
  const { role } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [unsavingId, setUnsavingId] = useState<number | null>(null);

  const validId = Number.isFinite(fixedProfileId) && fixedProfileId > 0;

  const queryKey = [
    "horoscope",
    role,
    "general-selections",
    fixedProfileId,
    page,
    PAGE_SIZE,
    search,
  ];

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchGeneralSelectionsPage(role, {
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

  const handleUnsave = useCallback(
    async (row: GeneralSelectionRow) => {
      if (row.fixed_profile_id == null || row.partner_profile_id == null) return;
      setUnsavingId(row.id);
      try {
        await deleteGeneralSelections(role, {
          fixed_profile_id: row.fixed_profile_id,
          partner_profile_ids: [row.partner_profile_id],
        });
        await queryClient.invalidateQueries({ queryKey: ["horoscope", role, "general-selections"] });
        await queryClient.invalidateQueries({
          queryKey: ["horoscope", role, "general-selection-groups"],
        });
        toast({ title: "Selection removed from saved list" });
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

  if (!validId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Invalid saved profile.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/horoscope/saved-selections">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to saved selections
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
            <Link to="/horoscope/saved-selections">
              <ArrowLeft className="h-4 w-4 mr-1" /> All saved profiles
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-accent" />
            {headerRow
              ? profileLabel(headerRow.fixed_name, headerRow.fixed_matri_id)
              : "Saved general selections"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All shortlisted partners for this profile (no porutham scores).
          </p>
        </div>
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-base">Saved selections</CardTitle>
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
              Loading selections…
            </div>
          ) : errMsg ? (
            <p className="text-sm text-destructive py-6 text-center">{errMsg}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {search ? `No partners match “${search}”.` : "No saved partners for this profile."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{headerRow ? partnerRole(headerRow.mode) : "Partner"}</TableHead>
                    <TableHead>Matri ID</TableHead>
                    <TableHead>Saved</TableHead>
                    <TableHead>Saved by</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.partner_name || "—"}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {row.partner_matri_id || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.updated_at ? formatDateTime(row.updated_at) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.saved_by_name || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={unsavingId === row.id}
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
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>
                  Page {page} of {totalPages}
                  {data?.count ? ` · ${data.count} partners` : null}
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
    </div>
  );
}
