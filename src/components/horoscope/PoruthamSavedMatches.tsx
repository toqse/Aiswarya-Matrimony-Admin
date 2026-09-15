import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  normalizePoruthamMode,
  type SavedPoruthamMatchRow,
} from "@/lib/admin-api/horoscope";
import { formatDateTime } from "@/lib/format-date";
import { Bookmark, Eye, Loader2, Search, Trash2 } from "lucide-react";

type PoruthamSavedMatchesProps = {
  rows: SavedPoruthamMatchRow[];
  loading?: boolean;
  onView: (row: SavedPoruthamMatchRow) => void;
  onUnsave: (row: SavedPoruthamMatchRow) => void | Promise<void>;
  unsavingId?: number | null;
};

function isExcellent(result: string): boolean {
  return result.trim().toLowerCase() === "excellent";
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

function fixedRole(mode: string): string {
  return normalizePoruthamMode(mode) === "fixed-groom" ? "Fixed groom" : "Fixed bride";
}

export default function PoruthamSavedMatches({
  rows,
  loading = false,
  onView,
  onUnsave,
  unsavingId = null,
}: PoruthamSavedMatchesProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const hay = [
        row.fixed_name,
        row.fixed_matri_id,
        row.partner_name,
        row.partner_matri_id,
        row.overall_result,
        row.saved_by_name,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  return (
    <Card className="shadow-elegant border-0">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-primary" />
              Saved porutham matches
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Matches saved for later review. Open this tab anytime to view them — no need to
              re-select the fixed profile.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or Matri ID…"
              className="pl-8 h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading saved matches…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No saved porutham matches yet. Calculate, tick rows, then Save selected.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No saved matches match “{search.trim()}”.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fixed profile</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Saved by</TableHead>
                <TableHead>Saved at</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const excellent = isExcellent(row.overall_result);
                const canAct = row.fixed_profile_id != null && row.partner_profile_id != null;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">
                        {profileLabel(row.fixed_name, row.fixed_matri_id)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{fixedRole(row.mode)}</div>
                    </TableCell>
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
                        onClick={() => onView(row)}
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
                        onClick={() => {
                          void onUnsave(row);
                        }}
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
        )}
      </CardContent>
    </Card>
  );
}
