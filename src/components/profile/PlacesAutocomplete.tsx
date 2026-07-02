import { useCallback, useEffect, useRef, useState } from "react";
import tzlookup from "tz-lookup";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SelectedPlace {
  /** Human readable place description (formatted address / name). */
  placeName: string;
  latitude: number | null;
  longitude: number | null;
  /** IANA timezone id, e.g. "Asia/Kolkata". Empty when it could not be resolved. */
  timezone: string;
}

interface PlacesAutocompleteProps {
  value: string;
  /** Fires on every keystroke so the parent keeps the typed text. */
  onChange: (value: string) => void;
  /** Fires when the user picks a suggestion; carries lat/lng/timezone. */
  onPlaceSelect: (place: SelectedPlace) => void;
  placeholder?: string;
  id?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3;

function resolveTimezone(lat: number, lon: number): string {
  try {
    return tzlookup(lat, lon);
  } catch {
    return "";
  }
}

export default function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  id,
}: PlacesAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;

  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    setLoading(false);
  }, []);

  const pickSuggestion = useCallback(
    (result: NominatimResult) => {
      const lat = Number(result.lat);
      const lon = Number(result.lon);
      const placeName = result.display_name;
      const timezone = Number.isFinite(lat) && Number.isFinite(lon) ? resolveTimezone(lat, lon) : "";

      onChange(placeName);
      onPlaceSelectRef.current({
        placeName,
        latitude: Number.isFinite(lat) ? lat : null,
        longitude: Number.isFinite(lon) ? lon : null,
        timezone,
      });
      clearSuggestions();
    },
    [onChange, clearSuggestions],
  );

  const searchPlaces = useCallback(
    async (query: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setOpen(true);

      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          addressdetails: "1",
          limit: "5",
          q: query,
        });
        const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Nominatim request failed");
        const data = (await res.json()) as NominatimResult[];
        if (controller.signal.aborted) return;
        setSuggestions(Array.isArray(data) ? data : []);
        setActiveIndex(-1);
        setOpen(true);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSuggestions([]);
        setOpen(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      clearSuggestions();
      return;
    }

    debounceRef.current = setTimeout(() => {
      void searchPlaces(trimmed);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, searchPlaces, clearSuggestions]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        clearSuggestions();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [clearSuggestions]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (event.key === "Escape") clearSuggestions();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      pickSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      clearSuggestions();
    }
  };

  const showDropdown = open && value.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Start typing a place..."}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls={showDropdown ? `${id ?? "place"}-listbox` : undefined}
      />

      {showDropdown && (
        <ul
          id={`${id ?? "place"}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
        >
          {loading && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Searching...</li>
          )}
          {!loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">No results</li>
          )}
          {!loading &&
            suggestions.map((result, index) => (
              <li
                key={`${result.lat}-${result.lon}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                  index === activeIndex && "bg-accent text-accent-foreground",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickSuggestion(result)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {result.display_name}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
