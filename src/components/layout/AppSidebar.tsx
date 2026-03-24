import {
  LayoutDashboard, Building2, Users, CreditCard, Receipt, Wallet, IndianRupee,
  UserCircle, Upload, MessageSquare, Banknote, BarChart3, Mail, Settings,
  ClipboardList, Target, CheckSquare, CalendarClock, Activity, FileText, Sparkles, MapPinned,
  Church, ScrollText, Languages
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
  { title: "Success Stories", url: "/success-stories", icon: FileText },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "District Analysis", url: "/district-analysis", icon: MapPinned },
  //{ title: "Email Templates", url: "/email-templates", icon: Mail },
  //{ title: "Settings", url: "/settings", icon: Settings },
  { title: "Audit Log", url: "/audit-log", icon: ClipboardList },
  { title: "Caste", url: "/caste", icon: ScrollText },
  { title: "Religion", url: "/religion", icon: Church },
  { title: "Mother Tongue", url: "/mother-tongue", icon: Languages },
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
  //{ title: "Day-Close", url: "/day-close", icon: CalendarClock },
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
        <div className={`flex px-4 py-4 border-b border-sidebar-border ${collapsed ? "flex-col items-center justify-center" : "flex-col items-center gap-2"}`}>
          <div className={`${collapsed ? "w-16 h-16" : "w-32 h-32"} rounded-lg bg-[#fbe2e6] flex items-center justify-center shrink-0 p-1`}>
            <img src="/WhatsApp_Image_2026-03-04_at_10.28.26_AM-removebg-preview.png" alt="AVB Logo" className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <p className="text-sm font-medium text-sidebar-foreground/90 text-center">{roleLabels[role]}</p>
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
