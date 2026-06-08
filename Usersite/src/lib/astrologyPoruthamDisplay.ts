import type { MatchBlock, PoruthamDetailedItem } from "@/lib/astrologyApi";

const PORUTHAM_DISPLAY_ORDER = [
  "rasi",
  "rasyadhip",
  "vasyam",
  "deergaham",
  "dinam",
  "mahendra",
  "ganam",
  "yoni",
  "rajju_dosham",
  "vedham",
  "kuja_dosham",
  "dasa_sandhi",
  "papam_samyom",
] as const;

export function normalizePoruthamKey(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, string> = {
    rasiyadhip: "rasyadhip",
    rasyadhip: "rasyadhip",
    rajju: "rajju_dosham",
    reju_dosham: "rajju_dosham",
    rejju_dosham: "rajju_dosham",
    papam_samyam: "papam_samyom",
    kuja_alignment: "kuja_dosham",
  };
  return aliases[key] ?? key;
}

function sortPoruthamRows(rows: PoruthamDetailedItem[]): PoruthamDetailedItem[] {
  const order = new Map<string, number>(
    PORUTHAM_DISPLAY_ORDER.map((key, idx) => [key, idx]),
  );
  const resolveOrderKey = (item: PoruthamDetailedItem): string => {
    const candidates = [
      normalizePoruthamKey(item.key ?? ""),
      normalizePoruthamKey(item.label ?? ""),
    ];
    for (const c of candidates) {
      if (order.has(c)) return c;
      if (
        c.includes("rasyadhip") ||
        c.includes("rasyadip") ||
        c.includes("rasiyadhip")
      )
        return "rasyadhip";
      if (c.includes("deerg") || c.includes("deergh")) return "deergaham";
      if (c.includes("dinam") || c === "dina") return "dinam";
      if (c.includes("mahendra")) return "mahendra";
      if (c.includes("ganam") || c.includes("gan")) return "ganam";
      if (c.includes("yoni")) return "yoni";
      if (c.includes("rajju") || c.includes("rejju") || c.includes("reju"))
        return "rajju_dosham";
      if (c.includes("vedham") || c.includes("veda")) return "vedham";
      if (c.includes("kuja")) return "kuja_dosham";
      if (c.includes("dasa") && c.includes("sandhi")) return "dasa_sandhi";
      if (c.includes("papam") && (c.includes("samy") || c.includes("samo")))
        return "papam_samyom";
      if (c === "rasi") return "rasi";
      if (c.includes("vasyam") || c.includes("vashyam")) return "vasyam";
    }
    return "";
  };
  return [...rows].sort((a, b) => {
    const aPos = order.get(resolveOrderKey(a)) ?? 999;
    const bPos = order.get(resolveOrderKey(b)) ?? 999;
    return aPos - bPos;
  });
}

export function poruthamRowsFromMatch(match: MatchBlock): PoruthamDetailedItem[] {
  if (match.poruthams_detailed?.length)
    return sortPoruthamRows(match.poruthams_detailed);
  const p = match.poruthams;
  if (!p || typeof p !== "object") return [];
  const generated = Object.entries(p).map(([key, matched]) => ({
    key,
    label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    matched: Boolean(matched),
    severity: "low",
    is_critical: key === "rajju",
  }));
  return sortPoruthamRows(generated);
}

/** 10 poruthams + Kuja / Dasa Sandhi / Papam Samyom from `match.flags` (PairMaker-style checklist). */
export function extendedPoruthamChecklist(
  match: MatchBlock,
): PoruthamDetailedItem[] {
  const base = poruthamRowsFromMatch(match);
  const withPoints = base.map((item) => ({
    ...item,
    points: match.koota_points?.[item.key] ?? item.points,
  }));
  const f = match.flags;
  if (!f) return withPoints;
  const kujaAligned = f.kuja_dosham_bride === f.kuja_dosham_groom;
  const extra: PoruthamDetailedItem[] = [
    {
      key: "kuja_alignment",
      label: "Kuja Dosham",
      matched: kujaAligned,
      severity: "medium",
      is_critical: false,
      description: "Matched when both charts share the same Kuja pattern",
    },
    {
      key: "dasa_sandhi",
      label: "Dasa Sandhi",
      matched: !f.dasa_sandhi,
      severity: "low",
      is_critical: false,
      description:
        "Favorable when neither side is at a major mahadasha boundary",
    },
    {
      key: "papam_samyam",
      label: "Papam Samyom",
      matched: Boolean(f.papam_samyam_matched),
      severity: "low",
      is_critical: false,
      description: "Kendra malefic alignment between charts",
    },
  ];
  return sortPoruthamRows([...withPoints, ...extra]);
}
