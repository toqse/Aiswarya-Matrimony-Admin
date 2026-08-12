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

type BootSession = {
  role: UserRole;
  isLoggedIn: boolean;
  userName: string | null;
  branch: AdminBranchRef | null;
  permissions: string[];
};

function readBootSession(): BootSession {
  try {
    const s = getMatrimonyAdminSession();
    if (!s?.access_token) {
      return {
        role: "admin",
        isLoggedIn: false,
        userName: null,
        branch: null,
        permissions: [],
      };
    }
    return {
      role: mapApiRoleToUserRole(s.role),
      isLoggedIn: true,
      userName: s.name ?? null,
      branch: s.branch ?? null,
      permissions: Array.isArray(s.permissions) ? s.permissions : [],
    };
  } catch (err) {
    console.warn("[RoleProvider] bad session; clearing", err);
    try {
      clearMatrimonyAdminSession();
    } catch {
      /* ignore */
    }
    return {
      role: "admin",
      isLoggedIn: false,
      userName: null,
      branch: null,
      permissions: [],
    };
  }
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(readBootSession);
  const [role, setRole] = useState<UserRole>(boot.role);
  const [isLoggedIn, setIsLoggedIn] = useState(boot.isLoggedIn);
  const [userName, setUserName] = useState<string | null>(boot.userName);
  const [branch, setBranch] = useState<AdminBranchRef | null>(boot.branch);
  const [permissions, setPermissions] = useState<string[]>(boot.permissions);

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
