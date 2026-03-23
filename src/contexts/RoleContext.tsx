import React, { createContext, useContext, useState, ReactNode } from "react";
import { mapApiRoleToUserRole } from "@/lib/role-mapping";
import {
  clearMatrimonyAdminSession,
  getMatrimonyAdminSession,
  setMatrimonyAdminSession,
  type AdminBranchRef,
  type MatrimonyAdminSession,
} from "@/lib/matrimony-admin-storage";
import type { UserRole } from "@/types/user-role";

export type { UserRole };

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoggedIn: boolean;
  userName: string | null;
  branch: AdminBranchRef | null;
  permissions: string[];
  login: (session: MatrimonyAdminSession) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(() => {
    const s = getMatrimonyAdminSession();
    return s?.access_token ? mapApiRoleToUserRole(s.role) : "admin";
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getMatrimonyAdminSession()?.access_token);
  const [userName, setUserName] = useState<string | null>(() => getMatrimonyAdminSession()?.name ?? null);
  const [branch, setBranch] = useState<AdminBranchRef | null>(() => getMatrimonyAdminSession()?.branch ?? null);
  const [permissions, setPermissions] = useState<string[]>(() => getMatrimonyAdminSession()?.permissions ?? []);

  const login = (session: MatrimonyAdminSession) => {
    setMatrimonyAdminSession(session);
    setRole(mapApiRoleToUserRole(session.role));
    setIsLoggedIn(true);
    setUserName(session.name);
    setBranch(session.branch ?? null);
    setPermissions(session.permissions ?? []);
  };

  const logout = () => {
    clearMatrimonyAdminSession();
    setIsLoggedIn(false);
    setUserName(null);
    setBranch(null);
    setPermissions([]);
  };

  return (
    <RoleContext.Provider
      value={{ role, setRole, isLoggedIn, userName, branch, permissions, login, logout }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
