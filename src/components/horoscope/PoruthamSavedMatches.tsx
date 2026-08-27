import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PoruthamFixedMode, SavedPoruthamMatchRow } from "@/lib/admin-api/horoscope";
import { formatDateTime } from "@/lib/format-date";
import { Bookmark, Eye, Loader2, Trash2 } from "lucide-react";

type PoruthamSavedMatchesProps = {
  mode: PoruthamFixedMode;
  rows: SavedPoruthamMatchRow[];
  loading?: boolean;
  onView: (row: SavedPoruthamMatchRow) => void;
  onUnsave: (partnerProfileId: number) => void | Promise<void>;
  unsavingId?: number | null;
};

function partnerColumnLabel(mode: PoruthamFixedMode): string {
  return mode === "fixed-bride" ? "Groom" : "Bride";
}

function isExcellent(result: string): boolean {
  return result.trim().toLowerCase() === "excellent";
}

export default function PoruthamSavedMatches({
  mode,
  rows,
  loading = false,
  onView,
  onUnsave,
  unsavingId = null,
}: PoruthamSavedMatchesProps) {
  if (loading) {
    return (
      <Card className="shadow-elegant border-0">
        <CardContent className="py-8 flex justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading saved matches…
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) return null;

  return (
    <Card className="shadow-elegant border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-primary" />
          Saved matches
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Shared for this fixed profile — visible to admin, staff, and branch managers in scope.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{partnerColumnLabel(mode)}</TableHead>
              <TableHead>Matri ID</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Saved by</TableHead>
              <TableHead>Saved at</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const pid = row.partner_profile_id;
              const excellent = isExcellent(row.overall_result);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.partner_name || "—"}</TableCell>
                  <TableCell>{row.partner_matri_id || "—"}</TableCell>
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
                      disabled={pid == null}
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
                      disabled={pid == null || unsavingId === pid}
                      onClick={() => {
                        if (pid != null) void onUnsave(pid);
                      }}
                    >
                      {unsavingId === pid ? (
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
      </CardContent>
    </Card>
  );
}
