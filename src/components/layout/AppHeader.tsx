import { Bell, Search, Moon, Sun, ChevronDown, User, UserCircle, Settings, LogOut } from "lucide-react";
import { useRole, UserRole } from "@/contexts/RoleContext";
import { postAdminLogout } from "@/lib/auth-api";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "branch-manager", label: "Branch Manager" },
];

export function AppHeader() {
  const { role, logout } = useRole();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  const currentRole = roleOptions.find((r) => r.value === role)!;

  return (
    <header className="h-14 border-b bg-card flex items-center gap-3 px-4 shrink-0">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      {/* Search */}
      <div className="relative flex-1 max-w-md hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search profiles, staff, subscriptions..." className="pl-9 h-9 bg-muted/50 border-0" />
      </div>

      <div className="flex-1" />

      {/* Role Display (read-only) */}
      <div className="px-3 py-1.5 rounded-md border border-primary/20 text-primary text-sm font-medium">
        {currentRole.label}
      </div>

      {/* Dark Mode */}
      <Button variant="ghost" size="icon" onClick={toggleDark} className="h-9 w-9">
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="h-9 w-9 relative">
        <Bell className="h-4 w-4" />
        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground border-0">
          5
        </Badge>
      </Button>

      {/* Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer gap-2">
            <UserCircle className="h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              try {
                await postAdminLogout();
              } catch {
                /* still clear local session */
              }
              logout();
              navigate("/login", { replace: true });
            }}
            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
