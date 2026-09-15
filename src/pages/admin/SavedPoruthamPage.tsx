import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bookmark, ChevronLeft, ChevronRight, Heart, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRole } from "@/contexts/RoleContext";
import { getApiErrorMessage } from "@/lib/admin-api/http";
import {
  fetchSavedPoruthamGroups,
  normalizePoruthamMode,
} from "@/lib/admin-api/horoscope";
import { formatDateTime } from "@/lib/format-date";

const PAGE_SIZE = 20;

function profileLabel(name: string, matriId: string): string {
  const n = name.trim();
  const m = matriId.trim();
  if (n && m) return `${n} · ${m}`;
  return n || m || "—";
}

function modeLabel(mode: string): string {
  return normalizePoruthamMode(mode) === "fixed-groom" ? "Fixed groom" : "Fixed bride";
}

export default function SavedPoruthamPage() {
  const { role } = useRole();
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["horoscope", role, "porutham-saved-groups", page, PAGE_SIZE, search],
    queryFn: () =>
      fetchSavedPoruthamGroups(role, {
        page,
        page_size: PAGE_SIZE,
        search: search || undefined,
      }),
  });

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));
  const rows = data?.results ?? [];
  const errMsg = useMemo(
    () => (error ? getApiErrorMessage(error) : ""),
    [error],
  );

  const applySearch = () => {
    setSearch(searchDraft.trim());
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Heart className="h-6 w-6 text-accent" /> Saved porutham matches
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Each member appears once. Open View all to see every saved partner and porutham details.
        </p>
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-primary" />
              Saved profiles
            </CardTitle>
            <form
              className="relative w-full sm:w-72"
              onSubmit={(e) => {
                e.preventDefault();
                applySearch();
              }}
            >
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search name or Matri ID…"
                className="pl-8 h-9"
              />
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 flex justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading saved matches…
            </div>
          ) : errMsg ? (
            <p className="text-sm text-destructive py-6 text-center">{errMsg}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {search
                ? `No saved profiles match “${search}”.`
                : "No saved porutham matches yet. Calculate on Horoscope, tick rows, then Save selected."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Matches</TableHead>
                    <TableHead>Last saved</TableHead>
                    <TableHead>Saved by</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const id = row.fixed_profile_id;
                    return (
                      <TableRow key={id ?? row.fixed_user_id}>
                        <TableCell className="font-medium">
                          {profileLabel(row.fixed_name, row.fixed_matri_id)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {modeLabel(row.mode)}
                        </TableCell>
                        <TableCell>{row.match_count}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.last_saved_at ? formatDateTime(row.last_saved_at) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.saved_by_name || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {id == null ? (
                            <Button variant="ghost" size="sm" disabled>
                              View all
                            </Button>
                          ) : (
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/horoscope/saved-porutham/${id}`}>View all</Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>
                  Page {page} of {totalPages}
                  {data?.count ? ` · ${data.count} profiles` : null}
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
