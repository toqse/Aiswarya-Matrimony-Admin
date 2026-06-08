import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface AuditLogActionOption {
  value: string;
  label: string;
}

export interface AuditLogRow {
  id: number;
  timestamp: string;
  actor_name: string;
  actor_role: "admin" | "branch_manager" | "staff" | string;
  action: string;
  action_display: string;
  resource: string;
  details: string;
  ip_address: string;
  /** Branch label when provided by API */
  branch_name: string;
  /** Acting staff display name when distinct from actor */
  staff_name: string;
  /** Target profile / entity display name */
  target_profile: string;
}

export interface AuditLogListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLogRow[];
}

export interface AuditLogFilters {
  search?: string;
  action?: string;
  role?: "admin" | "branch_manager" | "staff";
  /** When supported by backend */
  branch_id?: number | string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

function pickFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function nestedName(obj: unknown): string {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return "";
  const o = obj as Record<string, unknown>;
  return pickFirstString(o.name, o.title, o.label);
}

function normalizeAuditLogRow(row: unknown, index: number): AuditLogRow {
  const source = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
  const actorRole = pickFirstString(source.actor_role, source.role);
  const action = pickFirstString(source.action, source.action_type);
  const actionDisplay = pickFirstString(source.action_display, source.action_label, action);
  const idValue = source.id;
  const id = typeof idValue === "number" ? idValue : index + 1;

  let branch_name = pickFirstString(
    source.branch_name,
    source.branch_title,
    typeof source.branch === "string" ? source.branch : "",
  );
  if (!branch_name) branch_name = nestedName(source.branch);

  let staff_name = pickFirstString(source.staff_name, typeof source.staff === "string" ? source.staff : "");
  if (!staff_name) staff_name = nestedName(source.staff);

  const target_profile = pickFirstString(
    source.target_profile,
    source.profile_name,
    source.target_name,
    source.subject_name,
    source.profile_display_name,
  );

  return {
    id,
    timestamp: pickFirstString(source.timestamp, source.created_at, source.time),
    actor_name: pickFirstString(
      source.actor_name,
      source.user,
      source.username,
      source.user_name,
      source.actor,
    ),
    actor_role: actorRole,
    action,
    action_display: actionDisplay,
    resource: pickFirstString(source.resource, source.resource_name),
    details: pickFirstString(
      source.details,
      source.description,
      source.message,
      typeof source.details === "object" ? JSON.stringify(source.details) : "",
    ),
    ip_address: pickFirstString(source.ip_address, source.ip, source.client_ip),
    branch_name,
    staff_name,
    target_profile,
  };
}

function toQs(params?: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v));
    });
  }
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchAuditLogs(filters?: AuditLogFilters) {
  const res = await adminRequest<AuditLogListData>(`v1/admin/audit-log/${toQs(filters)}`);
  const payload = await unwrap(res);
  const results = Array.isArray(payload?.results)
    ? payload.results.map((row, index) => normalizeAuditLogRow(row, index))
    : [];

  return {
    count: typeof payload?.count === "number" ? payload.count : results.length,
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
    results,
  };
}

export async function fetchAuditLogActions() {
  const res = await adminRequest<
    AuditLogActionOption[] | { data?: AuditLogActionOption[]; results?: AuditLogActionOption[]; actions?: AuditLogActionOption[] }
  >("v1/admin/audit-log/actions/");
  const payload = await unwrap(res);
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.actions)) return payload.actions;
  }
  return [];
}
