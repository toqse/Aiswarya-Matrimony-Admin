export const MATRIMONY_ADMIN_KEY = "Matrimony_Admin";

/** Matches verify-otp `branch` in apidoc. */
export interface AdminBranchRef {
  id: number | null;
  name: string;
}

export interface MatrimonyAdminSession {
  access_token: string;
  refresh_token: string;
  role: string;
  name: string;
  branch: AdminBranchRef | null;
  permissions: string[];
}

function normalizeBranch(raw: unknown): AdminBranchRef | null {
  if (raw == null) return null;
  if (typeof raw === "string") return { id: null, name: raw };
  if (typeof raw === "object" && raw !== null && "name" in raw) {
    const o = raw as AdminBranchRef;
    return { id: o.id ?? null, name: String(o.name) };
  }
  return null;
}

export function getMatrimonyAdminSession(): MatrimonyAdminSession | null {
  try {
    const raw = localStorage.getItem(MATRIMONY_ADMIN_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const row =
      Array.isArray(parsed) && parsed[0] && typeof parsed[0] === "object"
        ? (parsed[0] as MatrimonyAdminSession)
        : parsed && typeof parsed === "object" && "access_token" in (parsed as object)
          ? (parsed as MatrimonyAdminSession)
          : null;
    if (!row?.access_token) return null;
    return { ...row, branch: normalizeBranch(row.branch) };
  } catch {
    return null;
  }
}

/** Persists session as a one-element array under `Matrimony_Admin`. */
export function setMatrimonyAdminSession(session: MatrimonyAdminSession): void {
  localStorage.setItem(MATRIMONY_ADMIN_KEY, JSON.stringify([session]));
}

export function clearMatrimonyAdminSession(): void {
  localStorage.removeItem(MATRIMONY_ADMIN_KEY);
}
