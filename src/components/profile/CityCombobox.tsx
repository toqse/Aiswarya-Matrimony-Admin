import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { fetchCities } from "@/lib/admin-api/master";
import {
  isExactCityMatch,
  rankCitySuggestions,
  sanitizeCityName,
} from "@/lib/cityMatch";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

export type CitySelection = {
  cityId: string;
  cityName: string;
};

interface Props {
  districtId: string;
  cityId: string;
  cityName: string;
  disabled?: boolean;
  onChange: (next: CitySelection) => void;
}

export default function CityCombobox({
  districtId,
  cityId,
  cityName,
  disabled,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(cityName || "");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    setInput(cityName || "");
  }, [cityName, cityId, districtId]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input]);

  const citiesQ = useQuery({
    queryKey: ["master", "cities", "combobox", districtId, debounced],
    queryFn: () =>
      fetchCities({
        district_id: Number(districtId),
        search: debounced.trim() || undefined,
        page_size: 100,
      }),
    enabled: !!districtId && Number(districtId) > 0,
    retry: 1,
  });

  const cities = citiesQ.data?.results ?? [];
  const loadError = citiesQ.isError;
  const loading = citiesQ.isFetching;
  const districtEmpty =
    !debounced.trim() && !loading && !loadError && cities.length === 0 && !!districtId;

  const ranked = useMemo(() => rankCitySuggestions(input, cities), [input, cities]);
  const query = sanitizeCityName(input);
  const hasExact = ranked.exact.length > 0;
  // Always offer manual entry when typed text has no exact master match.
  const showManual = !!query && !hasExact;

  const commitMaster = useCallback(
    (id: number, name: string) => {
      onChange({ cityId: String(id), cityName: name });
      setInput(name);
      setOpen(false);
    },
    [onChange],
  );

  const commitManual = useCallback(
    (name: string) => {
      const cleaned = sanitizeCityName(name);
      if (!cleaned) return;
      onChange({ cityId: "", cityName: cleaned });
      setInput(cleaned);
      setOpen(false);
    },
    [onChange],
  );

  const clear = () => {
    onChange({ cityId: "", cityName: "" });
    setInput("");
  };

  const display =
    cityName ||
    (cityId ? cities.find((c) => String(c.id) === cityId)?.name : "") ||
    "Search or enter city";

  return (
    <div className="space-y-1.5">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            const cleaned = sanitizeCityName(input);
            if (!cleaned) return;
            const exactHit = cities.find((c) => isExactCityMatch(cleaned, c.name));
            if (exactHit) {
              commitMaster(exactHit.id, exactHit.name);
              return;
            }
            if (!cityId || cityName !== cleaned) {
              commitManual(cleaned);
            }
          }
        }}
      >
        <div className="flex gap-1">
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled || !districtId}
              className={cn(
                "w-full justify-between font-normal",
                !cityId && !cityName && "text-muted-foreground",
              )}
            >
              <span className="truncate">{districtId ? display : "Select district first"}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          {(cityId || cityName) && !disabled ? (
            <Button type="button" variant="ghost" size="icon" onClick={clear} aria-label="Clear city">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="p-2 border-b">
            <Input
              value={input}
              placeholder="Search or enter city"
              onChange={(e) => {
                const v = e.target.value;
                setInput(v);
                // Keep draft city_name so save works without an extra click.
                onChange({ cityId: "", cityName: sanitizeCityName(v) });
              }}
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {loading && cities.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : null}
            {loadError && !loading ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">
                Unable to load city suggestions. You can enter your city manually.
              </p>
            ) : null}
            {!loadError && districtEmpty && !query ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">
                No cities are currently listed for this district. You can enter your city
                manually.
              </p>
            ) : null}

            {ranked.exact.length > 0 ? (
              <p className="px-2 pt-1 text-xs text-muted-foreground">Exact match</p>
            ) : null}
            {ranked.exact.map((c) => (
              <button
                key={`e-${c.id}`}
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => commitMaster(c.id, c.name)}
              >
                <Check className="h-4 w-4 text-primary" />
                {c.name}
              </button>
            ))}

            {ranked.fuzzy.length > 0 ? (
              <p className="px-2 pt-2 text-xs text-muted-foreground">Did you mean?</p>
            ) : null}
            {ranked.fuzzy.map((c) => (
              <button
                key={`f-${c.id}`}
                type="button"
                className="flex w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => commitMaster(c.id, c.name)}
              >
                {c.name}
              </button>
            ))}

            {ranked.rest.map((c) => (
              <button
                key={`r-${c.id}`}
                type="button"
                className="flex w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => commitMaster(c.id, c.name)}
              >
                {c.name}
              </button>
            ))}

            {showManual && query ? (
              <>
                {ranked.fuzzy.length + ranked.rest.length === 0 && !loadError && !districtEmpty ? (
                  <p className="px-2 pt-2 text-xs text-muted-foreground">No matching city found.</p>
                ) : null}
                <button
                  type="button"
                  className="flex w-full rounded-sm px-2 py-2 text-sm font-medium text-primary hover:bg-accent"
                  onClick={() => commitManual(query)}
                >
                  + Use &quot;{query}&quot; as city
                </button>
                <p className="px-2 pb-2 text-xs text-muted-foreground">
                  Please check the spelling before continuing.
                </p>
              </>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      {cityId ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Check className="h-3.5 w-3.5 text-primary" /> {cityName}
        </p>
      ) : null}
      {!cityId && cityName ? (
        <p className="text-xs text-amber-700">
          City not found in our list. Please check the spelling before continuing.
        </p>
      ) : null}
    </div>
  );
}
