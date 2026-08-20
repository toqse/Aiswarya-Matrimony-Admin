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
import { fetchOccupations } from "@/lib/admin-api/master";
import { displayOccupationName } from "@/lib/displayOccupationName";
import { cn } from "@/lib/utils";

interface OccupationComboboxProps {
  value: string;
  onValueChange: (id: string) => void;
  initialLabel?: string;
}

export default function OccupationCombobox({
  value,
  onValueChange,
  initialLabel,
}: OccupationComboboxProps) {
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

  const q = useQuery({
    queryKey: ["master", "occupations", "combobox", debounced],
    queryFn: () => fetchOccupations({ search: debounced || undefined, limit: 200 }),
  });

  useEffect(() => {
    const rows = q.data?.results ?? [];
    if (rows.length === 0) return;
    setLabels((prev) => {
      const next = { ...prev };
      for (const o of rows) next[String(o.id)] = o.name;
      return next;
    });
  }, [q.data]);

  const items = q.data?.results ?? [];
  const selectedName = value ? labels[value] : "";
  const selectedDisplay = selectedName ? displayOccupationName(selectedName) : "";
  const showListSpinner = q.isFetching && items.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selectedDisplay && "text-muted-foreground")}>
            {selectedDisplay || "Select occupation"}
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
            placeholder="Search occupation..."
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
                <CommandEmpty>No occupation found.</CommandEmpty>
                <CommandGroup>
                  {q.isFetching && items.length > 0 ? (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">Updating list…</p>
                  ) : null}
                  {items.map((o) => (
                    <CommandItem
                      key={o.id}
                      value={String(o.id)}
                      onSelect={() => {
                        onValueChange(String(o.id));
                        setLabels((prev) => ({ ...prev, [String(o.id)]: o.name }));
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === String(o.id) ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {displayOccupationName(o.name)}
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
