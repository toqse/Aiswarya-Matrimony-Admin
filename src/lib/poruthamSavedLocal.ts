import type { PoruthamFixedMode, SavedPoruthamMatchRow } from "@/lib/admin-api/horoscope";

const STORAGE_KEY = "aiswarya.admin.savedPoruthamMatches.v1";

type LocalStore = Record<string, SavedPoruthamMatchRow[]>;

function storeKey(fixedProfileId: number): string {
  return String(fixedProfileId);
}

function readStore(): LocalStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as LocalStore;
  } catch {
    return {};
  }
}

function writeStore(store: LocalStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function listLocalSavedPoruthamMatches(fixedProfileId: number): SavedPoruthamMatchRow[] {
  const rows = readStore()[storeKey(fixedProfileId)] ?? [];
  return [...rows].sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
}

export type LocalSavePartnerInput = {
  profile_id: number;
  matri_id?: string;
  profile_name?: string;
  score?: number;
  max_score?: number;
  overall_result?: string;
  uthamam_count?: number | null;
};

export function saveLocalPoruthamMatches(options: {
  mode: PoruthamFixedMode;
  fixed_profile_id: number;
  partners: LocalSavePartnerInput[];
  saved_by_name?: string;
}): SavedPoruthamMatchRow[] {
  const { mode, fixed_profile_id, partners, saved_by_name = "" } = options;
  const store = readStore();
  const key = storeKey(fixed_profile_id);
  const existing = store[key] ?? [];
  const byPartner = new Map(
    existing
      .filter((r) => r.partner_profile_id != null)
      .map((r) => [r.partner_profile_id as number, r]),
  );
  const now = new Date().toISOString();
  const saved: SavedPoruthamMatchRow[] = [];

  for (const p of partners) {
    const prev = byPartner.get(p.profile_id);
    const row: SavedPoruthamMatchRow = {
      id: prev?.id ?? Date.now() + p.profile_id,
      mode: mode === "fixed-bride" ? "fixed_bride" : "fixed_groom",
      partner_profile_id: p.profile_id,
      partner_matri_id: p.matri_id ?? prev?.partner_matri_id ?? "",
      partner_name: p.profile_name ?? prev?.partner_name ?? `Profile ${p.profile_id}`,
      score: p.score ?? prev?.score ?? 0,
      max_score: p.max_score ?? prev?.max_score ?? 10,
      overall_result: p.overall_result ?? prev?.overall_result ?? "",
      uthamam_count: p.uthamam_count ?? prev?.uthamam_count ?? null,
      saved_by_name: saved_by_name || prev?.saved_by_name || "",
      created_at: prev?.created_at ?? now,
      updated_at: now,
    };
    byPartner.set(p.profile_id, row);
    saved.push(row);
  }

  store[key] = Array.from(byPartner.values());
  writeStore(store);
  return saved;
}

export function deleteLocalSavedPoruthamMatches(
  fixedProfileId: number,
  partnerProfileIds: number[],
): number {
  const store = readStore();
  const key = storeKey(fixedProfileId);
  const existing = store[key] ?? [];
  const remove = new Set(partnerProfileIds);
  const next = existing.filter(
    (r) => r.partner_profile_id == null || !remove.has(r.partner_profile_id),
  );
  const deleted = existing.length - next.length;
  if (next.length === 0) delete store[key];
  else store[key] = next;
  writeStore(store);
  return deleted;
}
