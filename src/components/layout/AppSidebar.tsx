import {
  LayoutDashboard, Building2, Users, CreditCard, Receipt, Wallet, IndianRupee,
  UserCircle, Upload, MessageSquare, Banknote, BarChart3, Mail, Settings,
  ClipboardList, Target, CheckSquare, CalendarClock, Activity, FileText, Sparkles
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const adminItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Branch Management", url: "/branches", icon: Building2 },
  { title: "Staff Management", url: "/staff", icon: Users },
  { title: "Subscription Plans", url: "/plans", icon: CreditCard },
  { title: "All Subscriptions", url: "/subscriptions", icon: Receipt },
  { title: "All Commissions", url: "/commissions", icon: Wallet },
  { title: "Salary & Payroll", url: "/salary", icon: IndianRupee },
  { title: "Profile Admin", url: "/profiles", icon: UserCircle },
  { title: "Horoscope", url: "/horoscope", icon: Sparkles },
  { title: "Bulk Upload", url: "/bulk-upload", icon: Upload },
  { title: "Enquiries", url: "/enquiries", icon: MessageSquare },
  { title: "Cash Payments", url: "/cash-payments", icon: Banknote },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Email Templates", url: "/email-templates", icon: Mail },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Audit Log", url: "/audit-log", icon: ClipboardList },
];

const staffItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Commissions", url: "/my-commissions", icon: Wallet },
  { title: "My Salary", url: "/my-salary", icon: IndianRupee },
  { title: "My Profiles", url: "/my-profiles", icon: UserCircle },
  { title: "Horoscope", url: "/horoscope", icon: Sparkles },
  { title: "Enquiries", url: "/my-enquiries", icon: MessageSquare },
  { title: "Subscriptions", url: "/my-subscriptions", icon: CreditCard },
  { title: "Cash Payment Entry", url: "/cash-entry", icon: Banknote },
  { title: "Activity Log", url: "/activity-log", icon: Activity },
];

const branchManagerItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Staff Performance", url: "/staff-performance", icon: Target },
  { title: "Enquiry Overview", url: "/branch-enquiries", icon: MessageSquare },
  { title: "Commission Approval", url: "/commission-approval", icon: CheckSquare },
  { title: "Salary Management", url: "/branch-salary", icon: IndianRupee },
  { title: "Day-Close", url: "/day-close", icon: CalendarClock },
  { title: "My Commissions", url: "/my-commissions", icon: Wallet },
  { title: "My Salary", url: "/my-salary", icon: IndianRupee },
  { title: "My Profiles", url: "/my-profiles", icon: UserCircle },
  { title: "Horoscope", url: "/horoscope", icon: Sparkles },
];

const roleLabels = { admin: "Admin Panel", staff: "Staff Panel", "branch-manager": "Branch Manager" };

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role } = useRole();

  const items = role === "admin" ? adminItems : role === "staff" ? staffItems : branchManagerItems;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-sidebar-border ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center font-bold text-sidebar-primary-foreground text-sm shrink-0">
            AM
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-base leading-tight">AIswarya</h2>
              <p className="text-[11px] opacity-70">{roleLabels[role]}</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] tracking-wider">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title + item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
