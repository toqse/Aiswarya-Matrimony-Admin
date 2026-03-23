import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";
import { getAuthApiErrorMessage } from "@/lib/auth-api";

export interface BranchSummaryKpis {
  total_branches: number;
  total_staff: number;
  total_revenue: number;
}

export interface BranchRow {
  id: number;
  name: string;
  code: string;
  city: string;
  phone: string;
  email: string;
  address?: string;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  /** May be omitted on list serializers */
  profiles_count?: number;
  /** May be omitted on list serializers */
  revenue?: number;
  status: string;
}

export interface BranchListData {
  summary: BranchSummaryKpis;
  count: number;
  next: string | null;
  previous: string | null;
  results: BranchRow[];
}

const emptyList = (): BranchListData => ({
  summary: { total_branches: 0, total_staff: 0, total_revenue: 0 },
  count: 0,
  next: null,
  previous: null,
  results: [],
});

/** Coerce various backend list shapes into BranchListData (always `results: BranchRow[]`). */
export function normalizeBranchListData(payload: unknown): BranchListData {
  if (payload == null) return emptyList();

  if (Array.isArray(payload)) {
    const results = payload as BranchRow[];
    return {
      ...emptyList(),
      count: results.length,
      results,
    };
  }

  if (typeof payload !== "object") return emptyList();

  let p = payload as Record<string, unknown>;

  // e.g. { success, data: { count, results, summary } } after partial unwrap
  if (
    p.data &&
    typeof p.data === "object" &&
    p.data !== null &&
    !Array.isArray(p.data) &&
    ("results" in (p.data as object) || "summary" in (p.data as object))
  ) {
    p = p.data as Record<string, unknown>;
  }

  let resultsRaw: unknown = p.results;
  let nestedSummary: Record<string, unknown> | null = null;

  // Shape from backend: { count, results: { summary: {...}, results: BranchRow[] } }
  if (
    resultsRaw &&
    typeof resultsRaw === "object" &&
    !Array.isArray(resultsRaw) &&
    Array.isArray((resultsRaw as Record<string, unknown>).results)
  ) {
    const inner = resultsRaw as Record<string, unknown>;
    nestedSummary =
      inner.summary && typeof inner.summary === "object" && inner.summary !== null
        ? (inner.summary as Record<string, unknown>)
        : null;
    resultsRaw = inner.results;
  } else if (!Array.isArray(resultsRaw) && resultsRaw && typeof resultsRaw === "object") {
    // Id-keyed map of rows (fallback)
    resultsRaw = Object.values(resultsRaw as Record<string, unknown>);
  }

  const results = Array.isArray(resultsRaw) ? (resultsRaw as BranchRow[]) : [];

  const topSum = p.summary && typeof p.summary === "object" && p.summary !== null ? (p.summary as Record<string, unknown>) : null;
  const sum = topSum ?? nestedSummary;

  return {
    summary: {
      total_branches: Number(sum?.total_branches) || 0,
      total_staff: Number(sum?.total_staff) || 0,
      total_revenue: Number(sum?.total_revenue) || 0,
    },
    count: typeof p.count === "number" ? p.count : results.length,
    next: (p.next as string | null | undefined) ?? null,
    previous: (p.previous as string | null | undefined) ?? null,
    results,
  };
}

/** List includes embedded summary per apidoc */
export async function fetchBranchList(params?: { search?: string; page?: number; page_size?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const path = qs ? `v1/admin/branches/?${qs}` : "v1/admin/branches/";
  const res = await adminRequest<BranchListData>(path);
  const unwrapped = await unwrap(res);
  return normalizeBranchListData(unwrapped);
}

export async function fetchBranchSummaryOnly() {
  const res = await adminRequest<BranchSummaryKpis>("v1/admin/branches/summary/");
  return unwrap(res);
}

export async function createBranch(body: {
  name: string;
  city: string;
  phone: string;
  email: string;
  address?: string;
  code?: string;
}) {
  const res = await adminRequest<BranchRow>("v1/admin/branches/", { method: "POST", body });
  return unwrap(res);
}

export async function updateBranch(
  id: number,
  body: Partial<{ name: string; city: string; phone: string; email: string; address: string; code: string; is_active: boolean }>,
) {
  const res = await adminRequest<BranchRow>(`v1/admin/branches/${id}/`, { method: "PATCH", body });
  return unwrap(res);
}

/** API returns `{ success, status }` at top level (no `data` wrapper). */
export async function toggleBranchStatus(id: number) {
  const res = await adminRequest<never>(`v1/admin/branches/${id}/toggle-status/`, { method: "PATCH" });
  const raw = res.data as unknown as { success?: boolean; status?: string };
  if (!res.ok || raw.success === false) {
    throw new Error(getAuthApiErrorMessage(res.data));
  }
  return { status: raw.status ?? "active" };
}

export async function deleteBranch(id: number) {
  const res = await adminRequest<unknown>(`v1/admin/branches/${id}/`, { method: "DELETE" });
  if (!res.ok || res.data.success === false) {
    throw new Error(getAuthApiErrorMessage(res.data));
  }
}
