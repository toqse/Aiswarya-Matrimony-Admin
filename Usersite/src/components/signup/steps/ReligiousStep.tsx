import { useCallback, useEffect, useState } from "react";
import { labelClass, inputClass } from "../SignupFormFields";
import { Home, Globe, CheckSquare, Check } from "lucide-react";
import { motion } from "framer-motion";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { withMinDuration } from "@/lib/withMinDuration";
import { getReligions, getCastes, getMotherTongues, type Religion, type Caste, type MotherTongue } from "@/lib/masterApi";

interface Props {
  formData: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  interCaste: boolean;
  setInterCaste: (v: boolean) => void;
}

type PartnerPrefKey = "own" | "open" | "specific";

const prefKeyToApi: Record<PartnerPrefKey, "own_religion_only" | "open_to_all" | "specific_religions"> = {
  own: "own_religion_only",
  open: "open_to_all",
  specific: "specific_religions",
};

const ReligiousStep = ({ formData, onChange }: Props) => {
  const [religions, setReligions] = useState<Religion[]>([]);
  const [castes, setCastes] = useState<Caste[]>([]);
  const [motherTongues, setMotherTongues] = useState<MotherTongue[]>([]);
  const [loadingReligions, setLoadingReligions] = useState(false);
  const [loadingCastes, setLoadingCastes] = useState(false);
  const [loadingMotherTongues, setLoadingMotherTongues] = useState(false);

  const [prefKey, setPrefKey] = useState<PartnerPrefKey>("open");
  const [partnerReligionIds, setPartnerReligionIds] = useState<number[]>([]);
  const [partnerCastesByReligion, setPartnerCastesByReligion] = useState<
    Record<number, Caste[]>
  >({});
  const [loadingPartnerCastes, setLoadingPartnerCastes] = useState<
    Record<number, boolean>
  >({});
  const [partnerCastePreferences, setPartnerCastePreferences] = useState<
    Record<string, number[]>
  >({});
  const [partnerCasteAllByReligion, setPartnerCasteAllByReligion] = useState<
    Record<string, boolean>
  >({});

  const religionId = formData.religion_id ? Number(formData.religion_id) : 0;

  const emitChange = (name: string, value: string) => {
    onChange({ target: { name, value } } as React.ChangeEvent<HTMLInputElement>);
  };

  const emitPartnerCastePreferences = (next: Record<string, number[]>) => {
    emitChange("partner_caste_preferences", JSON.stringify(next));
  };

  const loadReligions = useCallback(async (search: string) => {
    setLoadingReligions(true);
    try {
      const list = await withMinDuration(180, getReligions(search || undefined));
      setReligions(list);
    } catch {
      setReligions([]);
    } finally {
      setLoadingReligions(false);
    }
  }, []);

  const loadCastes = useCallback(
    async (search: string) => {
      if (!religionId) return;
      setLoadingCastes(true);
      try {
        const list = await withMinDuration(
          180,
          getCastes(religionId, search || undefined),
        );
        setCastes(list);
      } catch {
        setCastes([]);
      } finally {
        setLoadingCastes(false);
      }
    },
    [religionId]
  );

  const loadMotherTongues = useCallback(async (search: string) => {
    setLoadingMotherTongues(true);
    try {
      const list = await withMinDuration(
        180,
        getMotherTongues(search || undefined),
      );
      setMotherTongues(list);
    } catch {
      setMotherTongues([]);
    } finally {
      setLoadingMotherTongues(false);
    }
  }, []);

  useEffect(() => {
    // Initial load of religions and mother tongues
    loadReligions("");
    loadMotherTongues("");
  }, [loadReligions, loadMotherTongues]);

  useEffect(() => {
    // Reset castes when religion changes
    setCastes([]);
    if (religionId) loadCastes("");
  }, [religionId, loadCastes]);

  useEffect(() => {
    const pref = formData.partner_preference_type;
    if (pref === "own_religion_only") setPrefKey("own");
    else if (pref === "specific_religions") setPrefKey("specific");
    else setPrefKey("open");

    const ids = (formData.partner_religion_ids || "")
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    setPartnerReligionIds(ids);
  }, [formData.partner_preference_type, formData.partner_religion_ids]);

  useEffect(() => {
    const raw = formData.partner_caste_preferences;
    if (!raw?.trim()) {
      setPartnerCastePreferences({});
      setPartnerCasteAllByReligion({});
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const normalized: Record<string, number[]> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (!Array.isArray(value)) continue;
        const ids = value
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0);
        if (ids.length) normalized[String(key)] = ids;
      }
      setPartnerCastePreferences(normalized);
      setPartnerCasteAllByReligion({});
    } catch {
      setPartnerCastePreferences({});
      setPartnerCasteAllByReligion({});
    }
  }, [formData.partner_caste_preferences]);

  useEffect(() => {
    if (prefKey !== "specific" || partnerReligionIds.length === 0) {
      setLoadingPartnerCastes({});
      return;
    }

    const missingReligionIds = partnerReligionIds.filter(
      (id) => !partnerCastesByReligion[id],
    );
    if (!missingReligionIds.length) return;

    let cancelled = false;
    missingReligionIds.forEach((id) =>
      setLoadingPartnerCastes((prev) => ({ ...prev, [id]: true })),
    );

    Promise.all(
      missingReligionIds.map(async (id) => {
        try {
          const list = await withMinDuration(180, getCastes(id));
          return { id, list };
        } catch {
          return { id, list: [] as Caste[] };
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
    });

    return () => {
      cancelled = true;
    };
  }, [prefKey, partnerReligionIds, partnerCastesByReligion]);

  useEffect(() => {
    if (prefKey !== "own" || !religionId) return;
    const ownKey = String(religionId);
    const ownOnly = Object.fromEntries(
      Object.entries(partnerCastePreferences).filter(([key]) => key === ownKey),
    );
    const selectedCasteId = formData.caste_id ? Number(formData.caste_id) : 0;
    if (
      !ownOnly[ownKey]?.length &&
      Number.isFinite(selectedCasteId) &&
      selectedCasteId > 0
    ) {
      ownOnly[ownKey] = [selectedCasteId];
    }
    setPartnerCastePreferences(ownOnly);
    emitPartnerCastePreferences(ownOnly);
  }, [prefKey, religionId, formData.caste_id]);

  const handleSelectReligion = (name: string, value: string) => {
    const id = Number(value);
    const rel = religions.find((r) => r.id === id);
    emitChange("religion_id", value);
    emitChange("religion", rel?.name ?? "");
    // Clear caste when religion changes
    emitChange("caste_id", "");
    emitChange("caste", "");
  };

  const handleSelectCaste = (name: string, value: string) => {
    const id = Number(value);
    const caste = castes.find((c) => c.id === id);
    emitChange("caste_id", value);
    emitChange("caste", caste?.name ?? "");
  };

  const handleSelectMotherTongue = (name: string, value: string) => {
    const id = Number(value);
    const mt = motherTongues.find((m) => m.id === id);
    emitChange("mother_tongue_id", value);
    emitChange("motherTongue", mt?.name ?? "");
  };

  const castePreferenceOptions: { key: PartnerPrefKey; icon: React.ReactNode; label: string; desc: string }[] = [
    { key: "own", icon: <Home className="w-5 h-5" />, label: "Own Religion Only", desc: "Same religion profiles only" },
    { key: "open", icon: <Globe className="w-5 h-5" />, label: "Open to All Religions", desc: "No restriction at all" },
    { key: "specific", icon: <CheckSquare className="w-5 h-5" />, label: "Specific Religions", desc: "I'll choose which ones" },
  ];

  const handlePrefClick = (key: PartnerPrefKey) => {
    setPrefKey(key);
    if (key !== "specific") {
      setPartnerReligionIds([]);
      setPartnerCastePreferences({});
      setPartnerCasteAllByReligion({});
      emitChange("partner_religion_ids", "");
      emitPartnerCastePreferences({});
    }
    emitChange("partner_preference_type", prefKeyToApi[key]);
  };

  const togglePartnerReligion = (id: number) => {
    setPartnerReligionIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      const nextCastePrefs = Object.fromEntries(
        Object.entries(partnerCastePreferences).filter(([key]) =>
          next.includes(Number(key)),
        ),
      );
      const nextAllByReligion = Object.fromEntries(
        Object.entries(partnerCasteAllByReligion).filter(([key]) =>
          next.includes(Number(key)),
        ),
      );
      // Update parent AFTER computing next list (outside render/updater of parent)
      queueMicrotask(() => {
        emitChange("partner_religion_ids", next.join(","));
        emitPartnerCastePreferences(nextCastePrefs);
      });
      setPartnerCastePreferences(nextCastePrefs);
      setPartnerCasteAllByReligion(nextAllByReligion);
      return next;
    });
  };

  const togglePartnerCaste = (religionIdForCaste: number, casteId: number) => {
    setPartnerCastePreferences((prev) => {
      const key = String(religionIdForCaste);
      const existing = prev[key] ?? [];
      const exists = existing.includes(casteId);
      const nextIds = exists
        ? existing.filter((id) => id !== casteId)
        : [...existing, casteId];
      const next = { ...prev };
      if (nextIds.length > 0) next[key] = nextIds;
      else delete next[key];
      queueMicrotask(() => emitPartnerCastePreferences(next));
      return next;
    });
    setPartnerCasteAllByReligion((prev) => ({
      ...prev,
      [String(religionIdForCaste)]: false,
    }));
  };

  const selectAllCastes = (religionIdForCaste: number) => {
    setPartnerCastePreferences((prev) => {
      const key = String(religionIdForCaste);
      const next = { ...prev };
      delete next[key];
      queueMicrotask(() => emitPartnerCastePreferences(next));
      return next;
    });
    setPartnerCasteAllByReligion((prev) => ({
      ...prev,
      [String(religionIdForCaste)]: true,
    }));
  };

  const activeReligionName = formData.religion;
  const partnerAgeFrom = formData.partner_age_from || "";
  const partnerAgeTo = formData.partner_age_to || "";

  const handleAgeInput = (name: "partner_age_from" | "partner_age_to", raw: string) => {
    const digits = raw.replace(/[^\d]/g, "").slice(0, 2);
    emitChange(name, digits);
  };

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-1">Religious Details</h1>
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <SearchableSelect
            name="religion_id"
            value={formData.religion_id || ""}
            options={religions}
            loading={loadingReligions}
            label="Religion *"
            placeholder="Select Religion"
            initialDisplayLabel={formData.religion || undefined}
            onSearch={loadReligions}
            onSelect={handleSelectReligion}
          />
          {religionId ? (
            <SearchableSelect
              name="caste_id"
              value={formData.caste_id || ""}
              options={castes}
              loading={loadingCastes}
              label="Caste"
              placeholder="Select Caste"
              initialDisplayLabel={formData.caste || undefined}
              onSearch={loadCastes}
              onSelect={handleSelectCaste}
            />
          ) : null}
        </div>

        <SearchableSelect
          name="mother_tongue_id"
          value={formData.mother_tongue_id || ""}
          options={motherTongues}
          loading={loadingMotherTongues}
          label="Mother Tongue *"
          placeholder="Select Mother Tongue"
          initialDisplayLabel={formData.motherTongue || undefined}
          onSearch={loadMotherTongues}
          onSelect={handleSelectMotherTongue}
        />

        {/* Partner Religion Preference - only when a religion is selected */}
        {activeReligionName && (
          <div className="pt-2">
            <div className="border-t border-primary/10 pt-4">
              <h3 className="font-serif text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                🤝 Partner Religion Preference
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Which {activeReligionName} groups are you open to?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {castePreferenceOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handlePrefClick(opt.key)}
                    className={`p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                      prefKey === opt.key
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-primary/10 hover:border-primary/30 bg-card"
                    }`}
                  >
                    <span className={prefKey === opt.key ? "text-primary" : "text-muted-foreground"}>{opt.icon}</span>
                    <p className={`text-xs font-bold ${prefKey === opt.key ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    {prefKey === opt.key && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>

              {prefKey === "specific" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-4 rounded-xl border border-primary/10 bg-card"
                >
                  <p className="text-sm font-bold text-foreground mb-2">Select religions you're open to:</p>
                  <p className="text-xs text-muted-foreground mb-3">You can select one or more</p>
                  <div className="flex flex-wrap gap-2">
                    {religions.map((rel) => (
                      <button
                        key={rel.id}
                        type="button"
                        onClick={() => togglePartnerReligion(rel.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          partnerReligionIds.includes(rel.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground hover:bg-primary/10"
                        }`}
                      >
                        {rel.name}
                      </button>
                    ))}
                  </div>
                  {partnerReligionIds.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-bold text-foreground">
                        Select preferred castes (optional)
                      </p>
                      {partnerReligionIds.map((selectedReligionId) => {
                        const rel = religions.find(
                          (r) => r.id === selectedReligionId,
                        );
                        const relCastes =
                          partnerCastesByReligion[selectedReligionId] ?? [];
                        const relLoading =
                          loadingPartnerCastes[selectedReligionId] ?? false;
                        const selectedCastes =
                          partnerCastePreferences[String(selectedReligionId)] ??
                          [];
                        const isAllSelected =
                          partnerCasteAllByReligion[String(selectedReligionId)] ??
                          false;

                        return (
                          <div
                            key={selectedReligionId}
                            className="rounded-lg border border-primary/10 p-3"
                          >
                            <p className="text-sm font-semibold text-foreground mb-2">
                              {rel?.name ?? `Religion ${selectedReligionId}`}
                            </p>
                            {relLoading ? (
                              <p className="text-xs text-muted-foreground">
                                Loading castes...
                              </p>
                            ) : relCastes.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                No castes found for this religion.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => selectAllCastes(selectedReligionId)}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    isAllSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-foreground hover:bg-primary/10"
                                  }`}
                                >
                                  All
                                </button>
                                {relCastes.map((caste) => {
                                  const isSelected = selectedCastes.includes(
                                    caste.id,
                                  );
                                  return (
                                    <button
                                      key={`${selectedReligionId}-${caste.id}`}
                                      type="button"
                                      onClick={() =>
                                        togglePartnerCaste(
                                          selectedReligionId,
                                          caste.id,
                                        )
                                      }
                                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                        isSelected
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted text-foreground hover:bg-primary/10"
                                      }`}
                                    >
                                      {caste.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {prefKey === "own" && religionId > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-4 rounded-xl border border-primary/10 bg-card"
                >
                  <p className="text-sm font-bold text-foreground mb-2">
                    Select preferred castes in your religion (optional)
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    These preferences apply only within {activeReligionName}
                  </p>
                  {loadingCastes ? (
                    <p className="text-xs text-muted-foreground">
                      Loading castes...
                    </p>
                  ) : castes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No castes found for this religion.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => selectAllCastes(religionId)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          (partnerCasteAllByReligion[String(religionId)] ?? false)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground hover:bg-primary/10"
                        }`}
                      >
                        All
                      </button>
                      {castes.map((caste) => {
                        const isSelected = (
                          partnerCastePreferences[String(religionId)] ?? []
                        ).includes(caste.id);
                        return (
                          <button
                            key={`own-${religionId}-${caste.id}`}
                            type="button"
                            onClick={() =>
                              togglePartnerCaste(religionId, caste.id)
                            }
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground hover:bg-primary/10"
                            }`}
                          >
                            {caste.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              <div className="mt-4 p-4 rounded-xl border border-primary/10 bg-card">
                <p className="text-sm font-bold text-foreground mb-2">
                  Partner Age Preference (optional)
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Enter preferred age range between 18 and 80
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Age From</label>
                    <input
                      type="number"
                      min={18}
                      max={80}
                      step={1}
                      value={partnerAgeFrom}
                      onChange={(e) =>
                        handleAgeInput("partner_age_from", e.target.value)
                      }
                      placeholder="18"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Age To</label>
                    <input
                      type="number"
                      min={18}
                      max={80}
                      step={1}
                      value={partnerAgeTo}
                      onChange={(e) =>
                        handleAgeInput("partner_age_to", e.target.value)
                      }
                      placeholder="80"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReligiousStep;
