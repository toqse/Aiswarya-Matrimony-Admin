import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface MasterSearchItem {
  id: number;
  name: string;
}

interface MasterSearchComboboxProps {
  value: string;
  onValueChange: (id: string, name?: string) => void;
  queryKey: unknown[];
  fetchItems: (search: string) => Promise<{ results: MasterSearchItem[] }>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowAll?: boolean;
  allLabel?: string;
  enabled?: boolean;
  disabled?: boolean;
  formatOptionLabel?: (name: string) => string;
  initialLabel?: string;
}

export default function MasterSearchCombobox({
  value,
  onValueChange,
  queryKey,
  fetchItems,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results found.",
  allowAll = false,
  allLabel = "All",
  enabled = true,
  disabled = false,
  formatOptionLabel,
  initialLabel,
}: MasterSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [labels, setLabels] = useState<Record<string, string>>(() =>
    value && initialLabel ? { [value]: initialLabel } : {},
  );

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (value && initialLabel) {
      setLabels((prev) => ({ ...prev, [value]: initialLabel }));
    }
  }, [value, initialLabel]);

  const queryEnabled = enabled && !disabled && (open || !!value);

  const q = useQuery({
    queryKey: [...queryKey, debounced],
    queryFn: () => fetchItems(debounced),
    enabled: queryEnabled,
  });

  useEffect(() => {
    const rows = q.data?.results ?? [];
    if (rows.length === 0) return;
    setLabels((prev) => {
      const next = { ...prev };
      for (const row of rows) next[String(row.id)] = row.name;
      return next;
    });
  }, [q.data]);

  const items = q.data?.results ?? [];
  const showAllSelected = allowAll && !disabled && (value === "all" || value === "");
  const rawLabel = showAllSelected ? allLabel : value ? (labels[value] ?? "") : "";
  const selectedDisplay = rawLabel && formatOptionLabel ? formatOptionLabel(rawLabel) : rawLabel;
  const showListSpinner = q.isFetching && items.length === 0;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selectedDisplay && "text-muted-foreground")}>
            {selectedDisplay || placeholder}
          </span>
          {open && q.isFetching ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-70" />
          ) : (
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[200] w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {showListSpinner ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading options…
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {q.isFetching && items.length > 0 ? (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">Updating list…</p>
                  ) : null}
                  {allowAll ? (
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        onValueChange("all");
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === "all" || value === "" ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {allLabel}
                    </CommandItem>
                  ) : null}
                  {items.map((row) => (
                    <CommandItem
                      key={row.id}
                      value={`${row.id}-${row.name}`}
                      onSelect={() => {
                        onValueChange(String(row.id), row.name);
                        setLabels((prev) => ({ ...prev, [String(row.id)]: row.name }));
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === String(row.id) ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {formatOptionLabel ? formatOptionLabel(row.name) : row.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
