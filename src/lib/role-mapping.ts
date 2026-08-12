import type { UserRole } from "@/types/user-role";

/** Maps UI role to API `role` string expected by v1/admin/auth endpoints. */
export function userRoleToApiRole(role: UserRole): string {
  if (role === "branch-manager") return "branch_manager";
  return role;
}

/**
 * Maps API `role` from verify response / JWT / localStorage to UI role.
 * Never throws — missing/invalid values fall back to "staff".
 */
export function mapApiRoleToUserRole(apiRole: unknown): UserRole {
  const r = String(apiRole ?? "")
    .trim()
    .toLowerCase();
  if (r === "admin") return "admin";
  if (r === "staff") return "staff";
  if (r === "branch_manager" || r === "branch-manager") return "branch-manager";
  return "staff";
}
