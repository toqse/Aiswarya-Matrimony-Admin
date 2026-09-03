import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Receipt,
  Wallet,
  IndianRupee,
  UserCircle,
  Upload,
  MessageSquare,
  Banknote,
  BarChart3,
  Mail,
  ClipboardList,
  Target,
  CheckSquare,
  FileText,
  Quote,
  Sparkles,
  MapPinned,
  Church,
  ScrollText,
  Languages,
  GraduationCap,
  BookOpen,
  Briefcase,
  Smartphone,
  MessageSquare,
  Globe,
  MapPin,
  Landmark,
  Building,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useRole } from "@/contexts/RoleContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = { title: string; url: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const adminGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Profile Admin", url: "/profiles", icon: UserCircle },
      { title: "Horoscope", url: "/horoscope", icon: Sparkles },
      { title: "Bulk Upload", url: "/bulk-upload", icon: Upload },
      { title: "Enquiries", url: "/enquiries", icon: MessageSquare },
      { title: "Success Stories", url: "/success-stories", icon: FileText },
      { title: "Testimonials", url: "/testimonials", icon: Quote },
      { title: "Newsletter", url: "/newsletter", icon: Mail },
      { title: "Cash Payments", url: "/cash-payments", icon: Banknote },
    ],
  },
  {
    label: "Organisation",
    items: [
      { title: "Branch Management", url: "/branches", icon: Building2 },
      { title: "Staff Management", url: "/staff", icon: Users },
    ],
  },
  {
    label: "Billing",
    items: [
      { title: "Subscription Plans", url: "/plans", icon: CreditCard },
      { title: "All Subscriptions", url: "/subscriptions", icon: Receipt },
      { title: "All Commissions", url: "/commissions", icon: Wallet },
      { title: "Salary & Payroll", url: "/salary", icon: IndianRupee },
    ],
  },
  {
    label: "Location",
    items: [
      { title: "Country", url: "/country", icon: Globe },
      { title: "State", url: "/state", icon: Landmark },
      { title: "District", url: "/district", icon: MapPin },
      { title: "City", url: "/city", icon: Building },
    ],
  },
  {
    label: "Profile masters",
    items: [
      { title: "Religion", url: "/religion", icon: Church },
      { title: "Caste", url: "/caste", icon: ScrollText },
      { title: "Mother Tongue", url: "/mother-tongue", icon: Languages },
    ],
  },
  {
    label: "Education and work",
    items: [
      { title: "Education", url: "/education", icon: GraduationCap },
      { title: "Education Subject", url: "/education-subject", icon: BookOpen },
      { title: "Occupation", url: "/occupation", icon: Briefcase },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", url: "/reports", icon: BarChart3 },
      { title: "District Analysis", url: "/district-analysis", icon: MapPinned },
      { title: "Audit Log", url: "/audit-log", icon: ClipboardList },
    ],
  },
  {
    label: "System",
    items: [
      { title: "App Versions", url: "/app-config", icon: Smartphone },
      { title: "MSG Settings", url: "/msg-settings", icon: MessageSquare },
    ],
  },
];

const staffGroups: NavGroup[] = [
  {
    label: "Navigation",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "My Commissions", url: "/my-commissions", icon: Wallet },
      { title: "My Salary", url: "/my-salary", icon: IndianRupee },
      { title: "My Profiles", url: "/my-profiles", icon: UserCircle },
      { title: "Horoscope", url: "/horoscope", icon: Sparkles },
      { title: "Enquiries", url: "/my-enquiries", icon: MessageSquare },
      { title: "Subscriptions", url: "/my-subscriptions", icon: CreditCard },
      { title: "Cash Payment Entry", url: "/cash-entry", icon: Banknote },
    ],
  },
];

const branchManagerGroups: NavGroup[] = [
  {
    label: "Navigation",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Staff Performance", url: "/staff-performance", icon: Target },
      { title: "Enquiry Overview", url: "/branch-enquiries", icon: MessageSquare },
      { title: "Commission Approval", url: "/commission-approval", icon: CheckSquare },
      { title: "Salary Management", url: "/branch-salary", icon: IndianRupee },
      { title: "My Commissions", url: "/my-commissions", icon: Wallet },
      { title: "My Salary", url: "/my-salary", icon: IndianRupee },
      { title: "My Profiles", url: "/my-profiles", icon: UserCircle },
      { title: "Horoscope", url: "/horoscope", icon: Sparkles },
    ],
  },
];

const roleLabels = {
  admin: "Admin Panel",
  staff: "Staff Panel",
  "branch-manager": "Branch Manager",
};

function groupLabelForPath(groups: NavGroup[], pathname: string): string {
  const match = groups.find((group) =>
    group.items.some((item) => (item.url === "/" ? pathname === "/" : pathname === item.url)),
  );
  return match?.label ?? "";
}

function NavItemList({ items, collapsed }: { items: NavItem[]; collapsed: boolean }) {
  return (
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
  );
}

function SidebarNavGroups({ groups, collapsed }: { groups: NavGroup[]; collapsed: boolean }) {
  const { pathname } = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const active = groupLabelForPath(groups, pathname);
    return active ? [active] : groups[0] ? [groups[0].label] : [];
  });

  useEffect(() => {
    const active = groupLabelForPath(groups, pathname);
    if (!active) return;
    setOpenGroups((prev) => (prev.includes(active) ? prev : [...prev, active]));
  }, [groups, pathname]);

  const toggleGroup = (label: string, open: boolean) => {
    setOpenGroups((prev) => {
      if (open) return prev.includes(label) ? prev : [...prev, label];
      return prev.filter((item) => item !== label);
    });
  };

  if (collapsed || groups.length === 1) {
    return (
      <>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && groups.length === 1 && (
              <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] tracking-wider">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <NavItemList items={group.items} collapsed={collapsed} />
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </>
    );
  }

  return (
    <>
      {groups.map((group) => {
        const isOpen = openGroups.includes(group.label);
        return (
          <Collapsible
            key={group.label}
            open={isOpen}
            onOpenChange={(open) => toggleGroup(group.label, open)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="h-8 cursor-pointer text-[10px] uppercase tracking-wider text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              >
                <CollapsibleTrigger className="flex w-full items-center gap-2">
                  <span className="flex-1 truncate text-left">{group.label}</span>
                  <ChevronDown
                    className="ml-auto h-4 w-4 shrink-0 text-sidebar-foreground/80 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
                    aria-hidden
                  />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <NavItemList items={group.items} collapsed={false} />
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        );
      })}
    </>
  );
}

export { adminGroups, staffGroups, branchManagerGroups };
export type { NavGroup, NavItem };

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role } = useRole();

  const groups =
    role === "admin" ? adminGroups : role === "staff" ? staffGroups : branchManagerGroups;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <div
          className={`flex px-4 py-4 border-b border-sidebar-border ${collapsed ? "flex-col items-center justify-center" : "flex-col items-center gap-2"}`}
        >
          <div
            className={`${collapsed ? "w-16 h-16" : "w-32 h-32"} rounded-lg bg-[#fbe2e6] flex items-center justify-center shrink-0 p-1`}
          >
            <img
              src="/WhatsApp_Image_2026-03-04_at_10.28.26_AM-removebg-preview.png"
              alt="AVB Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {!collapsed && (
            <p className="text-sm font-medium text-sidebar-foreground/90 text-center">
              {roleLabels[role] ?? "Panel"}
            </p>
          )}
        </div>

        <SidebarNavGroups groups={groups} collapsed={collapsed} />
      </SidebarContent>
    </Sidebar>
  );
}
