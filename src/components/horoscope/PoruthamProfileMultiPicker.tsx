import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  fetchHoroscopeRecords,
  rowToPoruthamSelection,
  type PoruthamNavSelectionItem,
} from "@/lib/admin-api/horoscope";
import type { UserRole } from "@/types/user-role";

function formatOptionLabel(item: PoruthamNavSelectionItem): string {
  return `${item.profile_name || "—"} (${item.matri_id || "—"}) — ${item.profile_id}`;
}

type PoruthamProfileMultiPickerProps = {
  selected: PoruthamNavSelectionItem[];
  onSelectedChange: (next: PoruthamNavSelectionItem[]) => void;
  placeholder: string;
  role: UserRole;
  branchId: number | undefined;
  tabActive: boolean;
  instanceId: "bride" | "groom";
};

export default function PoruthamProfileMultiPicker({
  selected,
  onSelectedChange,
  placeholder,
  role,
  branchId,
  tabActive,
  instanceId,
}: PoruthamProfileMultiPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [manualId, setManualId] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchDraft.trim()), 400);
    return () => clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    if (!open) setSearchDraft("");
  }, [open]);

  const gender = instanceId === "bride" ? "F" : "M";
  const selectedIds = new Set(selected.map((s) => s.profile_id));

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["horoscope", role, "porutham-picker", instanceId, branchId, debouncedSearch, gender],
    queryFn: () =>
      fetchHoroscopeRecords(role, {
        page: 1,
        page_size: 100,
        branch_id: branchId,
        search: debouncedSearch || undefined,
        gender,
        exe_done: true,
      }),
    enabled: tabActive && open,
  });

  const rows = (data?.results ?? []).filter((r) => r.profile_id != null);

  const toggle = (item: PoruthamNavSelectionItem) => {
    if (selectedIds.has(item.profile_id)) {
      onSelectedChange(selected.filter((s) => s.profile_id !== item.profile_id));
      return;
    }
    onSelectedChange([...selected, item]);
  };

  const remove = (profileId: number) => {
    onSelectedChange(selected.filter((s) => s.profile_id !== profileId));
  };

  const addManualId = () => {
    const n = Number(manualId.trim());
    if (!Number.isFinite(n) || n < 1) return;
    if (selectedIds.has(n)) {
      setManualId("");
      return;
    }
    onSelectedChange([
      ...selected,
      { profile_id: n, matri_id: "", profile_name: `Profile ${n}` },
    ]);
    setManualId("");
  };

  const triggerLabel =
    selected.length === 0
      ? null
      : selected.length === 1
        ? formatOptionLabel(selected[0]!)
        : `${selected.length} profiles selected`;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal h-10 px-3"
          >
            <span className="truncate text-left">
              {triggerLabel ?? <span className="text-muted-foreground">{placeholder}</span>}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0" align="start">
          <div className="flex items-center border-b px-2 py-1.5 gap-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              className="h-9 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Search by name…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto p-1">
            {isLoading || isFetching ? (
              <div className="flex justify-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No profiles found.</p>
            ) : (
              rows.map((r) => {
                const item = rowToPoruthamSelection(r);
                if (!item) return null;
                const lab = formatOptionLabel(item);
                const checked = selectedIds.has(item.profile_id);
                return (
                  <button
                    key={`${instanceId}-${item.profile_id}`}
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      checked && "bg-accent/60",
                    )}
                    onClick={() => toggle(item)}
                  >
                    <Checkbox checked={checked} className="pointer-events-none" aria-hidden />
                    <span className="flex-1 min-w-0 truncate">{lab}</span>
                    {checked ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t px-2 py-2 flex gap-2">
            <Input
              type="number"
              className="h-9"
              placeholder="Or profile_id"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addManualId();
                }
              }}
            />
            <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={addManualId}>
              Add
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <Badge key={item.profile_id} variant="secondary" className="gap-1 pr-1 font-normal max-w-full">
              <span className="truncate max-w-[200px]">{formatOptionLabel(item)}</span>
              <button
                type="button"
                className="rounded-sm hover:bg-muted p-0.5"
                onClick={() => remove(item.profile_id)}
                aria-label={`Remove ${item.profile_name || item.profile_id}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
