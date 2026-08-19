import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CollectedPoruthamMatch, PoruthamFixedMode, PoruthamNavSelectionItem } from "@/lib/admin-api/horoscope";
import { Eye, Trash2, User } from "lucide-react";

type PoruthamCollectedMatchesProps = {
  mode: PoruthamFixedMode;
  fixed: PoruthamNavSelectionItem;
  matches: CollectedPoruthamMatch[];
  onView: (index: number) => void;
  onRemove: (partnerProfileId: number) => void;
};

function fixedLabel(mode: PoruthamFixedMode): string {
  return mode === "fixed-bride" ? "Fixed bride" : "Fixed groom";
}

function partnerColumnLabel(mode: PoruthamFixedMode): string {
  return mode === "fixed-bride" ? "Groom" : "Bride";
}

export default function PoruthamCollectedMatches({
  mode,
  fixed,
  matches,
  onView,
  onRemove,
}: PoruthamCollectedMatchesProps) {
  if (matches.length === 0) return null;

  const successCount = matches.filter((m) => !m.error).length;
  const failCount = matches.length - successCount;

  return (
    <Card className="shadow-elegant border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex flex-wrap items-center gap-2">
          <User className="h-4 w-4 text-primary shrink-0" />
          <span>{fixedLabel(mode)}</span>
          <Badge variant="secondary" className="font-normal">
            {fixed.profile_name || "—"} · {fixed.matri_id || "—"}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {successCount} match{successCount === 1 ? "" : "es"} collected
          {failCount > 0 ? ` · ${failCount} failed` : ""}
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match, index) => (
              <TableRow key={match.partner.profile_id}>
                <TableCell className="font-medium">{match.partner.profile_name || "—"}</TableCell>
                <TableCell>{match.partner.matri_id || "—"}</TableCell>
                <TableCell>
                  {match.error ? (
                    <span className="text-destructive text-sm">—</span>
                  ) : (
                    `${match.score % 1 ? match.score.toFixed(1) : match.score}/${match.max_score}`
                  )}
                </TableCell>
                <TableCell>
                  {match.error ? (
                    <span className="text-destructive text-sm" title={match.error}>
                      Error
                    </span>
                  ) : (
                    match.overall_result
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={Boolean(match.error)}
                    onClick={() => onView(index)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onRemove(match.partner.profile_id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
