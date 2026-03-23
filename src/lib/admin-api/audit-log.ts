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
  actor_role: "admin" | "branch_manager" | "staff";
  action: string;
  action_display: string;
  resource: string;
  details: string;
  ip_address: string;
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
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
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
  return unwrap(res);
}

export async function fetchAuditLogActions() {
  const res = await adminRequest<AuditLogActionOption[]>("v1/admin/audit-log/actions/");
  return unwrap(res);
}
