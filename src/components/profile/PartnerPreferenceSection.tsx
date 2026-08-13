import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, CheckSquare, Globe, Home } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import FormSectionCard from "@/components/profile/FormSectionCard";
import ProfileFormField, {
  fieldError,
  invalidInputClass,
  type ProfileFieldErrors,
} from "@/components/profile/ProfileFormField";
import { fetchCastes } from "@/lib/admin-api/master";
import { validatePartnerFieldErrors } from "@/lib/profile-validation";
import { cn } from "@/lib/utils";

export type PartnerPreferenceType = "own_religion_only" | "open_to_all" | "specific_religions";

export interface PartnerPreferenceFields {
  partnerPreferenceType: PartnerPreferenceType;
  partnerReligionIds: string[];
  partnerCastePreferences: Record<string, number[]>;
  partnerAgeFrom: string;
  partnerAgeTo: string;
}

export const EMPTY_PARTNER_PREFERENCE_FIELDS: PartnerPreferenceFields = {
  partnerPreferenceType: "own_religion_only",
  partnerReligionIds: [],
  partnerCastePreferences: {},
  partnerAgeFrom: "",
  partnerAgeTo: "",
};

const PREFERENCE_CARDS: {
  key: PartnerPreferenceType;
  icon: ReactNode;
  label: string;
  desc: string;
}[] = [
  {
    key: "own_religion_only",
    icon: <Home className="h-5 w-5" />,
    label: "Own Religion Only",
    desc: "Same religion profiles only",
  },
  {
    key: "open_to_all",
    icon: <Globe className="h-5 w-5" />,
    label: "Open to All Religions",
    desc: "No restriction at all",
  },
  {
    key: "specific_religions",
    icon: <CheckSquare className="h-5 w-5" />,
    label: "Specific Religions",
    desc: "I'll choose which ones",
  },
];

interface ReligionOption {
  id: number;
  name: string;
}

interface PartnerPreferenceSectionProps {
  religionId: string;
  casteId: string;
  religionName: string;
  religions: ReligionOption[];
  values: PartnerPreferenceFields;
  onChange: <K extends keyof PartnerPreferenceFields>(
    field: K,
    value: PartnerPreferenceFields[K],
  ) => void;
  onBatchChange?: (updates: Partial<PartnerPreferenceFields>) => void;
  errors?: ProfileFieldErrors;
}

/** @deprecated Use validatePartnerFieldErrors from @/lib/profile-validation */
export function validatePartnerPreference(
  values: PartnerPreferenceFields,
  religionId: string,
): string | null {
  const errs = validatePartnerFieldErrors(values, religionId);
  const first = Object.values(errs)[0];
  return first ?? null;
}

function pillClass(selected: boolean) {
  return cn(
    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
    selected
      ? "bg-primary text-primary-foreground"
      : "bg-muted text-foreground hover:bg-primary/10",
  );
}

export default function PartnerPreferenceSection({
  religionId,
  casteId,
  religionName,
  religions,
  values,
  onChange,
  onBatchChange,
  errors,
}: PartnerPreferenceSectionProps) {
  const ownReligionId = religionId ? Number(religionId) : 0;
  const ownCasteId = casteId ? Number(casteId) : 0;
  const selectedType = values.partnerPreferenceType;
  const partnerReligionIdsKey = values.partnerReligionIds.join(",");
  const selectedPartnerReligionIds = useMemo(
    () =>
      values.partnerReligionIds
        .map((id) => Number(id))
        .filter((n) => Number.isFinite(n) && n > 0),
    [partnerReligionIdsKey],
  );
  const ownCastePrefKey =
    values.partnerCastePreferences[String(ownReligionId)]?.join(",") ?? "";

  const [partnerCastesByReligion, setPartnerCastesByReligion] = useState<
    Record<number, { id: number; name: string }[]>
  >({});
  const [loadingPartnerCastes, setLoadingPartnerCastes] = useState<Record<number, boolean>>(
    {},
  );
  const [partnerCasteAllByReligion, setPartnerCasteAllByReligion] = useState<
    Record<string, boolean>
  >({});
  const fetchingPartnerCastesRef = useRef<Set<number>>(new Set());

  const ownCastesQ = useQuery({
    queryKey: ["master", "castes", "own-religion", religionId],
    queryFn: () => fetchCastes({ religion_id: ownReligionId, page_size: 500 }),
    enabled: ownReligionId > 0,
  });

  const apply = (updates: Partial<PartnerPreferenceFields>) => {
    if (onBatchChange) {
      onBatchChange(updates);
      return;
    }
    (Object.entries(updates) as [keyof PartnerPreferenceFields, PartnerPreferenceFields[keyof PartnerPreferenceFields]][]).forEach(
      ([key, val]) => onChange(key, val),
    );
  };

  const setPreferenceType = (nextType: PartnerPreferenceType) => {
    if (nextType === "open_to_all") {
      apply({
        partnerPreferenceType: nextType,
        partnerReligionIds: [],
        partnerCastePreferences: {},
      });
      setPartnerCasteAllByReligion({});
      return;
    }
    if (nextType === "own_religion_only") {
      const ownKey = String(ownReligionId);
      const ownOnly = Object.fromEntries(
        Object.entries(values.partnerCastePreferences).filter(([key]) => key === ownKey),
      );
      if (ownReligionId > 0 && !ownOnly[ownKey]?.length && ownCasteId > 0) {
        ownOnly[ownKey] = [ownCasteId];
      }
      apply({
        partnerPreferenceType: nextType,
        partnerReligionIds: [],
        partnerCastePreferences: ownOnly,
      });
      setPartnerCasteAllByReligion({});
      return;
    }
    apply({
      partnerPreferenceType: nextType,
      partnerCastePreferences: values.partnerCastePreferences,
    });
  };

  const toggleSpecificReligion = (religionIdNum: number) => {
    const idStr = String(religionIdNum);
    const next = values.partnerReligionIds.includes(idStr)
      ? values.partnerReligionIds.filter((id) => id !== idStr)
      : [...values.partnerReligionIds, idStr];
    const nextNum = next.map((id) => Number(id)).filter((n) => Number.isFinite(n));
    const nextCasteMap = Object.fromEntries(
      Object.entries(values.partnerCastePreferences).filter(([key]) =>
        nextNum.includes(Number(key)),
      ),
    );
    apply({
      partnerReligionIds: next,
      partnerCastePreferences: nextCasteMap,
    });
  };

  const togglePartnerCaste = (religionIdForCaste: number, casteIdNum: number) => {
    const key = String(religionIdForCaste);
    const existing = values.partnerCastePreferences[key] ?? [];
    const nextIds = existing.includes(casteIdNum)
      ? existing.filter((id) => id !== casteIdNum)
      : [...existing, casteIdNum];
    const next = { ...values.partnerCastePreferences };
    if (nextIds.length > 0) next[key] = nextIds;
    else delete next[key];
    setPartnerCasteAllByReligion((prev) => ({ ...prev, [key]: false }));
    onChange("partnerCastePreferences", next);
  };

  const selectAllCastes = (religionIdForCaste: number) => {
    const key = String(religionIdForCaste);
    const next = { ...values.partnerCastePreferences };
    delete next[key];
    setPartnerCasteAllByReligion((prev) => ({ ...prev, [key]: true }));
    onChange("partnerCastePreferences", next);
  };

  const handleAgeInput = (field: "partnerAgeFrom" | "partnerAgeTo", raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    onChange(field, digits);
  };

  useEffect(() => {
    if (selectedType !== "specific_religions" || selectedPartnerReligionIds.length === 0) {
      return;
    }
    const missing = selectedPartnerReligionIds.filter(
      (id) =>
        partnerCastesByReligion[id] === undefined &&
        !fetchingPartnerCastesRef.current.has(id),
    );
    if (!missing.length) return;

    let cancelled = false;
    missing.forEach((id) => fetchingPartnerCastesRef.current.add(id));
    setLoadingPartnerCastes((prev) => {
      const next = { ...prev };
      for (const id of missing) next[id] = true;
      return next;
    });

    Promise.all(
      missing.map(async (id) => {
        try {
          const res = await fetchCastes({ religion_id: id, page_size: 500 });
          return { id, list: res.results ?? [] };
        } catch {
          return { id, list: [] as { id: number; name: string }[] };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      setPartnerCastesByReligion((prev) => {
        const next = { ...prev };
        for (const item of results) next[item.id] = item.list;
        return next;
      });
      setLoadingPartnerCastes((prev) => {
        const next = { ...prev };
        for (const item of results) next[item.id] = false;
        return next;
      });
      for (const item of results) fetchingPartnerCastesRef.current.delete(item.id);
    });

    return () => {
      cancelled = true;
      for (const id of missing) fetchingPartnerCastesRef.current.delete(id);
    };
  }, [selectedType, partnerReligionIdsKey, partnerCastesByReligion, selectedPartnerReligionIds]);

  useEffect(() => {
    if (selectedType !== "own_religion_only" || !ownReligionId || ownCasteId <= 0) return;
    const ownKey = String(ownReligionId);
    if (values.partnerCastePreferences[ownKey]?.length) return;

    const ownOnly = Object.fromEntries(
      Object.entries(values.partnerCastePreferences).filter(([key]) => key === ownKey),
    );
    ownOnly[ownKey] = [ownCasteId];
    apply({ partnerCastePreferences: ownOnly });
  }, [selectedType, ownReligionId, ownCasteId, ownCastePrefKey]);

  const ownCastes = ownCastesQ.data?.results ?? [];

  return (
    <FormSectionCard title="Partner Preference">
      {!religionId ? (
        <p className="text-sm text-muted-foreground">
          Select a religion above to configure partner preferences.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">Partner Religion Preference</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Which {religionName || "religion"} groups are you open to?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PREFERENCE_CARDS.map((opt) => {
                const selected = selectedType === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setPreferenceType(opt.key)}
                    className={cn(
                      "p-3 rounded-lg border-2 text-center transition-all flex flex-col items-center gap-1.5",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 bg-card",
                    )}
                  >
                    <span className={selected ? "text-primary" : "text-muted-foreground"}>
                      {opt.icon}
                    </span>
                    <p className={cn("text-xs font-bold", selected ? "text-primary" : "text-foreground")}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
            {fieldError(errors, "partnerPreferenceType") && (
              <p className="mt-2 text-xs text-destructive">
                {fieldError(errors, "partnerPreferenceType")}
              </p>
            )}
          </div>

          {selectedType === "specific_religions" && (
            <div className="space-y-3 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Select religions you&apos;re open to</p>
                <p className="text-xs text-muted-foreground mb-2">You can select one or more</p>
                <div className="flex flex-wrap gap-2">
                  {religions.map((rel) => {
                    const isSelected = values.partnerReligionIds.includes(String(rel.id));
                    return (
                      <button
                        key={rel.id}
                        type="button"
                        onClick={() => toggleSpecificReligion(rel.id)}
                        className={pillClass(isSelected)}
                      >
                        {rel.name}
                      </button>
                    );
                  })}
                </div>
                {fieldError(errors, "partnerReligionIds") && (
                  <p className="mt-2 text-xs text-destructive">
                    {fieldError(errors, "partnerReligionIds")}
                  </p>
                )}
              </div>
              {selectedPartnerReligionIds.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Select preferred castes (optional)</p>
                  {selectedPartnerReligionIds.map((selectedReligionId) => {
                    const rel = religions.find((r) => r.id === selectedReligionId);
                    const relCastes = partnerCastesByReligion[selectedReligionId] ?? [];
                    const relLoading = loadingPartnerCastes[selectedReligionId] ?? false;
                    const selectedCastes =
                      values.partnerCastePreferences[String(selectedReligionId)] ?? [];
                    const isAllSelected =
                      partnerCasteAllByReligion[String(selectedReligionId)] ?? false;

                    return (
                      <div
                        key={selectedReligionId}
                        className="rounded-md border border-input bg-background p-3"
                      >
                        <p className="text-sm font-semibold mb-2">
                          {rel?.name ?? `Religion ${selectedReligionId}`}
                        </p>
                        {relLoading ? (
                          <p className="text-xs text-muted-foreground">Loading castes...</p>
                        ) : relCastes.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No castes found for this religion.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => selectAllCastes(selectedReligionId)}
                              className={pillClass(isAllSelected)}
                            >
                              All
                            </button>
                            {relCastes.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => togglePartnerCaste(selectedReligionId, c.id)}
                                className={pillClass(selectedCastes.includes(c.id))}
                              >
                                {c.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedType === "own_religion_only" && ownReligionId > 0 && (
            <div className="space-y-2 rounded-lg border p-3">
              <Label>Preferred castes in your religion (optional)</Label>
              {ownCastesQ.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading castes...</p>
              ) : ownCastes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No castes found for this religion.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => selectAllCastes(ownReligionId)}
                    className={pillClass(
                      partnerCasteAllByReligion[String(ownReligionId)] ?? false,
                    )}
                  >
                    All
                  </button>
                  {ownCastes.map((c) => {
                    const ownSelected =
                      values.partnerCastePreferences[String(ownReligionId)] ?? [];
                    const isSelected = ownSelected.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => togglePartnerCaste(ownReligionId, c.id)}
                        className={pillClass(isSelected)}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border p-3 space-y-3">
            <div>
              <p className="text-sm font-medium">Partner Age Preference (optional)</p>
              <p className="text-xs text-muted-foreground">Enter preferred age range between 18 and 80</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ProfileFormField
                label="Age From"
                error={fieldError(errors, "partnerAgeFrom")}
              >
                <Input
                  id="partnerAgeFrom"
                  type="number"
                  min={18}
                  max={80}
                  value={values.partnerAgeFrom}
                  onChange={(e) => handleAgeInput("partnerAgeFrom", e.target.value)}
                  placeholder="18"
                  className={invalidInputClass(fieldError(errors, "partnerAgeFrom"))}
                  aria-invalid={Boolean(fieldError(errors, "partnerAgeFrom"))}
                />
              </ProfileFormField>
              <ProfileFormField
                label="Age To"
                error={fieldError(errors, "partnerAgeTo")}
              >
                <Input
                  id="partnerAgeTo"
                  type="number"
                  min={18}
                  max={80}
                  value={values.partnerAgeTo}
                  onChange={(e) => handleAgeInput("partnerAgeTo", e.target.value)}
                  placeholder="80"
                  className={invalidInputClass(fieldError(errors, "partnerAgeTo"))}
                  aria-invalid={Boolean(fieldError(errors, "partnerAgeTo"))}
                />
              </ProfileFormField>
            </div>
          </div>
        </div>
      )}
    </FormSectionCard>
  );
}
