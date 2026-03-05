import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "staff" | "branch-manager";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoggedIn: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("admin");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = (newRole: UserRole) => {
    setRole(newRole);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  return (
    <RoleContext.Provider value={{ role, setRole, isLoggedIn, login, logout }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
