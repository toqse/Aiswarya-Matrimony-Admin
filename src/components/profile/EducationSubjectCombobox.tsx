import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { fetchEducationSubjects } from "@/lib/admin-api/master";
import {
  isExactCityMatch,
  rankCitySuggestions,
  sanitizeCityName,
} from "@/lib/cityMatch";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

export type EducationSubjectSelection = {
  subjectId: string;
  subjectName: string;
};

interface Props {
  educationId: string;
  subjectId: string;
  subjectName: string;
  disabled?: boolean;
  onChange: (next: EducationSubjectSelection) => void;
}

/** City-style searchable subject picker with free-text “Use as subject”. */
export default function EducationSubjectCombobox({
  educationId,
  subjectId,
  subjectName,
  disabled,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(subjectName || "");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    setInput(subjectName || "");
  }, [subjectName, subjectId, educationId]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input]);

  const subjectsQ = useQuery({
    queryKey: ["master", "education-subjects", "combobox", educationId, debounced],
    queryFn: () =>
      fetchEducationSubjects({
        education_id: Number(educationId),
        search: debounced.trim() || undefined,
        page_size: 100,
      }),
    enabled: !!educationId && Number(educationId) > 0,
    retry: 1,
  });

  const subjects = subjectsQ.data?.results ?? [];
  const loadError = subjectsQ.isError;
  const loading = subjectsQ.isFetching;
  const educationEmpty =
    !debounced.trim() && !loading && !loadError && subjects.length === 0 && !!educationId;

  const ranked = useMemo(() => rankCitySuggestions(input, subjects), [input, subjects]);
  const query = sanitizeCityName(input);
  const hasExact = ranked.exact.length > 0;
  const showManual = !!query && !hasExact;

  const commitMaster = useCallback(
    (id: number, name: string) => {
      onChange({ subjectId: String(id), subjectName: name });
      setInput(name);
      setOpen(false);
    },
    [onChange],
  );

  const commitManual = useCallback(
    (name: string) => {
      const cleaned = sanitizeCityName(name);
      if (!cleaned) return;
      onChange({ subjectId: "", subjectName: cleaned });
      setInput(cleaned);
      setOpen(false);
    },
    [onChange],
  );

  const clear = () => {
    onChange({ subjectId: "", subjectName: "" });
    setInput("");
  };

  const display =
    subjectName ||
    (subjectId ? subjects.find((s) => String(s.id) === subjectId)?.name : "") ||
    "Search or enter subject";

  return (
    <div className="space-y-1.5">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            const cleaned = sanitizeCityName(input);
            if (!cleaned) return;
            const exactHit = subjects.find((s) => isExactCityMatch(cleaned, s.name));
            if (exactHit) {
              commitMaster(exactHit.id, exactHit.name);
              return;
            }
            if (!subjectId || subjectName !== cleaned) {
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
              disabled={disabled || !educationId}
              className={cn(
                "w-full justify-between font-normal",
                !subjectId && !subjectName && "text-muted-foreground",
              )}
            >
              <span className="truncate">
                {educationId ? display : "Select education first"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          {(subjectId || subjectName) && !disabled ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clear}
              aria-label="Clear education subject"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="p-2 border-b">
            <Input
              value={input}
              placeholder="Search or enter subject"
              onChange={(e) => {
                const v = e.target.value;
                setInput(v);
                onChange({ subjectId: "", subjectName: sanitizeCityName(v) });
              }}
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {loading && subjects.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : null}
            {loadError && !loading ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">
                Unable to load subject suggestions. You can enter a subject manually.
              </p>
            ) : null}
            {!loadError && educationEmpty && !query ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">
                No subjects are currently listed for this education. You can enter a subject
                manually.
              </p>
            ) : null}

            {ranked.exact.length > 0 ? (
              <p className="px-2 pt-1 text-xs text-muted-foreground">Exact match</p>
            ) : null}
            {ranked.exact.map((s) => (
              <button
                key={`e-${s.id}`}
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => commitMaster(s.id, s.name)}
              >
                <Check className="h-4 w-4 text-primary" />
                {s.name}
              </button>
            ))}

            {ranked.fuzzy.length > 0 ? (
              <p className="px-2 pt-2 text-xs text-muted-foreground">Did you mean?</p>
            ) : null}
            {ranked.fuzzy.map((s) => (
              <button
                key={`f-${s.id}`}
                type="button"
                className="flex w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => commitMaster(s.id, s.name)}
              >
                {s.name}
              </button>
            ))}

            {ranked.rest.map((s) => (
              <button
                key={`r-${s.id}`}
                type="button"
                className="flex w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => commitMaster(s.id, s.name)}
              >
                {s.name}
              </button>
            ))}

            {showManual && query ? (
              <>
                {ranked.fuzzy.length + ranked.rest.length === 0 && !loadError && !educationEmpty ? (
                  <p className="px-2 pt-2 text-xs text-muted-foreground">
                    No matching subject found.
                  </p>
                ) : null}
                <button
                  type="button"
                  className="flex w-full rounded-sm px-2 py-2 text-sm font-medium text-primary hover:bg-accent"
                  onClick={() => commitManual(query)}
                >
                  + Use &quot;{query}&quot; as subject
                </button>
                <p className="px-2 pb-2 text-xs text-muted-foreground">
                  Please check the spelling before continuing.
                </p>
              </>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      {subjectId ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Check className="h-3.5 w-3.5 text-primary" /> {subjectName}
        </p>
      ) : null}
      {!subjectId && subjectName ? (
        <p className="text-xs text-amber-700">
          Subject not found in our list. Please check the spelling before continuing.
        </p>
      ) : null}
    </div>
  );
}
