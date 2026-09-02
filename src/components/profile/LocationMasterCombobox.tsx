import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
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
import {
  fetchCountries,
  fetchDistricts,
  fetchStates,
  MASTER_LIST_PAGE_SIZE,
  type PaginatedMaster,
} from "@/lib/admin-api/master";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;
const SCROLL_LOAD_THRESHOLD_PX = 48;

type LocationKind = "country" | "state" | "district";

interface LocationItem {
  id: number;
  name: string;
}

interface LocationMasterComboboxProps {
  kind: LocationKind;
  value: string;
  onValueChange: (id: string) => void;
  parentId?: number;
  disabled?: boolean;
  placeholder?: string;
  initialLabel?: string;
  allowAll?: boolean;
  allLabel?: string;
}

function fetchLocationPage(
  kind: LocationKind,
  parentId: number | undefined,
  search: string,
  page: number,
): Promise<PaginatedMaster<LocationItem>> {
  const params = {
    search: search || undefined,
    page,
    limit: MASTER_LIST_PAGE_SIZE,
  };
  if (kind === "country") return fetchCountries(params);
  if (kind === "state") {
    if (!parentId) return Promise.resolve({ count: 0, next: null, previous: null, results: [] });
    return fetchStates({ country_id: parentId, ...params });
  }
  if (!parentId) return Promise.resolve({ count: 0, next: null, previous: null, results: [] });
  return fetchDistricts({ state_id: parentId, ...params });
}

export default function LocationMasterCombobox({
  kind,
  value,
  onValueChange,
  parentId,
  disabled = false,
  placeholder,
  initialLabel,
  allowAll = false,
  allLabel = "All",
}: LocationMasterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [labels, setLabels] = useState<Record<string, string>>(() =>
    value && initialLabel ? { [value]: initialLabel } : {},
  );

  const defaultPlaceholder =
    kind === "country" ? "Select country" : kind === "state" ? "Select state" : "Select district";

  const enabled = kind === "country" ? open : open && !!parentId;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (value && initialLabel) {
      setLabels((prev) => ({ ...prev, [value]: initialLabel }));
    }
  }, [value, initialLabel]);

  const q = useInfiniteQuery({
    queryKey: ["master", "location", kind, parentId ?? null, debounced],
    queryFn: ({ pageParam }) => fetchLocationPage(kind, parentId, debounced, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
    enabled,
  });

  useEffect(() => {
    const pages = q.data?.pages ?? [];
    if (pages.length === 0) return;
    setLabels((prev) => {
      const next = { ...prev };
      for (const page of pages) {
        for (const row of page.results) next[String(row.id)] = row.name;
      }
      return next;
    });
  }, [q.data]);

  const items = useMemo(() => {
    const seen = new Set<number>();
    const rows: LocationItem[] = [];
    for (const page of q.data?.pages ?? []) {
      for (const row of page.results) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        rows.push(row);
      }
    }
    return rows;
  }, [q.data]);

  const selectedDisplay =
    allowAll && (value === "all" || value === "")
      ? allLabel
      : value
        ? (labels[value] ?? "")
        : "";

  const showListSpinner = q.isFetching && items.length === 0;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = q;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!hasNextPage || isFetchingNextPage) return;
      const el = e.currentTarget;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_LOAD_THRESHOLD_PX) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

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
            {selectedDisplay || placeholder || defaultPlaceholder}
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
            placeholder={`Search ${kind}...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList onScroll={handleScroll}>
            {showListSpinner ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading options…
              </div>
            ) : (
              <>
                <CommandEmpty>No {kind} found.</CommandEmpty>
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
                      value={String(row.id)}
                      onSelect={() => {
                        onValueChange(String(row.id));
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
                      {row.name}
                    </CommandItem>
                  ))}
                  {hasNextPage ? (
                    <button
                      type="button"
                      className="w-full px-2 py-2 text-center text-xs text-muted-foreground hover:bg-accent rounded-sm"
                      onClick={() => void fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading more…
                        </span>
                      ) : (
                        "Load more"
                      )}
                    </button>
                  ) : null}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
