import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CollectedPoruthamMatch, PoruthamFixedMode, PoruthamNavSelectionItem } from "@/lib/admin-api/horoscope";
import { BookmarkCheck, Eye, Loader2, Trash2, User } from "lucide-react";

type PoruthamCollectedMatchesProps = {
  mode: PoruthamFixedMode;
  fixed: PoruthamNavSelectionItem;
  matches: CollectedPoruthamMatch[];
  onView: (index: number) => void;
  onRemove: (partnerProfileId: number) => void;
  onSaveSelected: (partnerProfileIds: number[]) => void | Promise<void>;
  saving?: boolean;
  savedPartnerIds?: Set<number>;
  /** Increment after successful save to clear tick selection. */
  saveGeneration?: number;
};

function fixedLabel(mode: PoruthamFixedMode): string {
  return mode === "fixed-bride" ? "Fixed bride" : "Fixed groom";
}

function partnerColumnLabel(mode: PoruthamFixedMode): string {
  return mode === "fixed-bride" ? "Groom" : "Bride";
}

function isExcellent(result: string): boolean {
  return result.trim().toLowerCase() === "excellent";
}

export default function PoruthamCollectedMatches({
  mode,
  fixed,
  matches,
  onView,
  onRemove,
  onSaveSelected,
  saving = false,
  savedPartnerIds,
  saveGeneration = 0,
}: PoruthamCollectedMatchesProps) {
  const [tickIds, setTickIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setTickIds(new Set());
  }, [saveGeneration]);

  const successMatches = useMemo(
    () => matches.filter((m) => !m.error),
    [matches],
  );

  const tickableIds = useMemo(
    () => successMatches.map((m) => m.partner.profile_id),
    [successMatches],
  );

  const allTicked =
    tickableIds.length > 0 && tickableIds.every((id) => tickIds.has(id));

  if (matches.length === 0) return null;

  const successCount = successMatches.length;
  const failCount = matches.length - successCount;
  const tickCount = tickableIds.filter((id) => tickIds.has(id)).length;

  const toggleTick = (profileId: number) => {
    setTickIds((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  };

  const toggleAll = () => {
    if (allTicked) {
      setTickIds(new Set());
    } else {
      setTickIds(new Set(tickableIds));
    }
  };

  const handleSave = () => {
    const ids = tickableIds.filter((id) => tickIds.has(id));
    if (ids.length === 0) return;
    void onSaveSelected(ids);
  };

  return (
    <Card className="shadow-elegant border-0">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex flex-wrap items-center gap-2">
              <User className="h-4 w-4 text-primary shrink-0" />
              <span>{fixedLabel(mode)}</span>
              <Badge variant="secondary" className="font-normal">
                {fixed.profile_name || "—"} · {fixed.matri_id || "—"}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {successCount} match{successCount === 1 ? "" : "es"} collected
              {failCount > 0 ? ` · ${failCount} failed` : ""}
              {tickCount > 0 ? ` · ${tickCount} selected to save` : ""}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={tickCount === 0 || saving}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <BookmarkCheck className="h-4 w-4 mr-1" />}
            Save selected
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allTicked}
                  onCheckedChange={toggleAll}
                  aria-label="Select all successful matches"
                  disabled={tickableIds.length === 0}
                />
              </TableHead>
              <TableHead>{partnerColumnLabel(mode)}</TableHead>
              <TableHead>Matri ID</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match, index) => {
              const alreadySaved = savedPartnerIds?.has(match.partner.profile_id);
              const ticked = tickIds.has(match.partner.profile_id);
              const excellent = !match.error && isExcellent(match.overall_result);
              return (
                <TableRow key={match.partner.profile_id}>
                  <TableCell>
                    <Checkbox
                      checked={ticked}
                      disabled={Boolean(match.error)}
                      onCheckedChange={() => toggleTick(match.partner.profile_id)}
                      aria-label={`Select ${match.partner.profile_name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      {match.partner.profile_name || "—"}
                      {alreadySaved ? (
                        <Badge variant="outline" className="text-[10px] font-normal">
                          Saved
                        </Badge>
                      ) : null}
                    </span>
                  </TableCell>
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
                    ) : excellent ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 font-normal">
                        {match.overall_result}
                      </Badge>
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
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
