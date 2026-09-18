import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PoruthamFixedMode, PoruthamNavSelectionItem } from "@/lib/admin-api/horoscope";
import { BookmarkCheck, Loader2, Trash2, User } from "lucide-react";

export type GeneralMarkedSelection = {
  partner: PoruthamNavSelectionItem;
};

type GeneralCollectedSelectionsProps = {
  mode: PoruthamFixedMode;
  fixed: PoruthamNavSelectionItem;
  selections: GeneralMarkedSelection[];
  onRemove: (partnerProfileId: number) => void;
  onSaveSelected: (partnerProfileIds: number[]) => void | Promise<void>;
  saving?: boolean;
  savedPartnerIds?: Set<number>;
  saveGeneration?: number;
};

function fixedLabel(mode: PoruthamFixedMode): string {
  return mode === "fixed-bride" ? "Fixed bride" : "Fixed groom";
}

function partnerColumnLabel(mode: PoruthamFixedMode): string {
  return mode === "fixed-bride" ? "Groom" : "Bride";
}

export default function GeneralCollectedSelections({
  mode,
  fixed,
  selections,
  onRemove,
  onSaveSelected,
  saving = false,
  savedPartnerIds,
  saveGeneration = 0,
}: GeneralCollectedSelectionsProps) {
  const [tickIds, setTickIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setTickIds(new Set());
  }, [saveGeneration]);

  const tickableIds = useMemo(
    () => selections.map((s) => s.partner.profile_id),
    [selections],
  );

  const allTicked =
    tickableIds.length > 0 && tickableIds.every((id) => tickIds.has(id));

  if (selections.length === 0) return null;

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
    if (allTicked) setTickIds(new Set());
    else setTickIds(new Set(tickableIds));
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
              {selections.length} selection{selections.length === 1 ? "" : "s"} marked
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
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>{partnerColumnLabel(mode)}</TableHead>
              <TableHead>Matri ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selections.map((row) => {
              const id = row.partner.profile_id;
              const alreadySaved = savedPartnerIds?.has(id);
              return (
                <TableRow key={id}>
                  <TableCell>
                    <Checkbox
                      checked={tickIds.has(id)}
                      onCheckedChange={() => toggleTick(id)}
                      aria-label={`Select ${row.partner.profile_name || id}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.partner.profile_name || "—"}
                    {alreadySaved ? (
                      <Badge variant="outline" className="ml-2 text-[10px] font-normal">
                        Saved
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {row.partner.matri_id || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onRemove(id)}
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
