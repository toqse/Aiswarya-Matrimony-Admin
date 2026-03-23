import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  fetchBranchPerformance,
  fetchDashboardSummary,
  fetchMonthlyRevenue,
  fetchRecentActivity,
  fetchSubscriptionGrowth,
} from "@/lib/admin-api/dashboard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import {
  Activity,
  TrendingUp,
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
  Settings,
  ClipboardList,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";

const activityIcons: Record<string, string> = {
  profile: "🧑",
  subscription: "💳",
  commission: "💰",
  report: "📊",
  cash: "💵",
  enquiry: "📝",
  salary: "🏦",
  notification: "📧",
};

const quickLinks = [
  {
    title: "Branch Management",
    desc: "Create, edit, activate/deactivate branches",
    icon: Building2,
    url: "/branches",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Staff Management",
    desc: "Staff accounts, salary & commission rates",
    icon: Users,
    url: "/staff",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    title: "Subscription Plans",
    desc: "Create, edit, price plans",
    icon: CreditCard,
    url: "/plans",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "All Subscriptions",
    desc: "System-wide ledger with filters",
    icon: Receipt,
    url: "/subscriptions",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "All Commissions",
    desc: "Commission ledger with bulk actions",
    icon: Wallet,
    url: "/commissions",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    title: "Salary & Payroll",
    desc: "Generate, approve, mark-paid workflow",
    icon: IndianRupee,
    url: "/salary",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    title: "Profile Administration",
    desc: "View, edit, verify, merge profiles",
    icon: UserCircle,
    url: "/profiles",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    title: "Horoscope Management",
    desc: "Jathagam, Porutham, PDF generation",
    icon: Sparkles,
    url: "/horoscope",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Bulk Upload",
    desc: "CSV/Excel mass profile creation",
    icon: Upload,
    url: "/bulk-upload",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    title: "Enquiry Overview",
    desc: "System-wide lead pipeline & assignment",
    icon: MessageSquare,
    url: "/enquiries",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Cash Payments",
    desc: "Cash receipt tracking & verification",
    icon: Banknote,
    url: "/cash-payments",
    color: "text-lime-600",
    bg: "bg-lime-50",
  },
  {
    title: "Email Templates",
    desc: "Registration, match, expiry templates",
    icon: Mail,
    url: "/email-templates",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    title: "Reports & Analytics",
    desc: "Revenue, productivity, growth reports",
    icon: BarChart3,
    url: "/reports",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    title: "System Settings",
    desc: "OTP, match thresholds, maintenance",
    icon: Settings,
    url: "/settings",
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
  {
    title: "Audit Log",
    desc: "Immutable record with timestamps & IP",
    icon: ClipboardList,
    url: "/audit-log",
    color: "text-stone-600",
    bg: "bg-stone-50",
  },
];

function formatMonthLabel(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return iso;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString(undefined, { month: "short", year: "2-digit" });
}

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [summaryQ, revenueQ, growthQ, branchQ, activityQ] = useQueries({
    queries: [
      {
        queryKey: ["admin", "dashboard", "summary"],
        queryFn: fetchDashboardSummary,
      },
      {
        queryKey: ["admin", "dashboard", "monthly-revenue"],
        queryFn: fetchMonthlyRevenue,
      },
      {
        queryKey: ["admin", "dashboard", "subscription-growth"],
        queryFn: fetchSubscriptionGrowth,
      },
      {
        queryKey: ["admin", "dashboard", "branch-performance"],
        queryFn: fetchBranchPerformance,
      },
      {
        queryKey: ["admin", "dashboard", "recent-activity"],
        queryFn: fetchRecentActivity,
      },
    ],
  });

  const loading =
    summaryQ.isLoading ||
    revenueQ.isLoading ||
    growthQ.isLoading ||
    branchQ.isLoading ||
    activityQ.isLoading;
  const err =
    summaryQ.error ||
    revenueQ.error ||
    growthQ.error ||
    branchQ.error ||
    activityQ.error;

  const summary = summaryQ.data;
  const revenueSeries = revenueQ.data?.series ?? [];
  const growthSeries = growthQ.data?.series ?? [];
  const branchRows = branchQ.data?.branches ?? [];
  const logs = activityQ.data?.logs ?? [];

  const revenueChart = revenueSeries.map((p) => ({
    month: formatMonthLabel(p.month),
    revenue: p.total_revenue,
  }));

  const growthChart = growthSeries.map((p) => ({
    month: formatMonthLabel(p.month),
    subscriptions: p.subscriptions,
  }));

  const branchChart = branchRows.map((r) => ({
    branch: r.branch.name,
    profiles: r.total_users,
    subscriptions: r.active_subscriptions,
    revenue: r.total_revenue,
  }));

  const kpis = summary
    ? [
        {
          label: "Total Users",
          value: summary.total_users.toLocaleString(),
          change: "—",
          trend: "neutral" as const,
          icon: "Users",
        },
        {
          label: "Total Subscriptions",
          value: summary.total_subscriptions.toLocaleString(),
          change: "—",
          trend: "neutral" as const,
          icon: "CreditCard",
        },
        {
          label: "MRR",
          value: formatINR(summary.mrr),
          change: "—",
          trend: "neutral" as const,
          icon: "TrendingUp",
        },
        {
          label: "Active Profiles",
          value: summary.active_profiles.toLocaleString(),
          change: "—",
          trend: "neutral" as const,
          icon: "UserCheck",
        },
        {
          label: "Today's Registrations",
          value: String(summary.todays_registrations),
          change: "—",
          trend: "neutral" as const,
          icon: "UserPlus",
        },
        {
          label: "Total Revenue",
          value: formatINR(summary.total_revenue),
          change: "—",
          trend: "neutral" as const,
          icon: "IndianRupee",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete system overview at a glance
        </p>
      </div>

      {err && (
        <Alert variant="destructive">
          <AlertTitle>Could not load dashboard</AlertTitle>
          <AlertDescription>{(err as Error).message}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard data…
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Monthly Revenue (Last 12 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={
                  revenueChart.length
                    ? revenueChart
                    : [{ month: "—", revenue: 0 }]
                }
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(333, 60%, 34%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(333, 60%, 34%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(333, 15%, 90%)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(333, 10%, 46%)"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(333, 10%, 46%)"
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(v: number) => [
                    `₹${Number(v).toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(333, 60%, 34%)"
                  fill="url(#revGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Subscription Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={
                  growthChart.length
                    ? growthChart
                    : [{ month: "—", subscriptions: 0 }]
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(333, 15%, 90%)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(333, 10%, 46%)"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="subscriptions"
                  stroke="hsl(40, 100%, 58%)"
                  strokeWidth={2.5}
                  dot={{ fill: "hsl(40, 100%, 58%)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Branch Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={
                  branchChart.length
                    ? branchChart
                    : [{ branch: "—", profiles: 0, subscriptions: 0 }]
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(333, 15%, 90%)"
                />
                <XAxis
                  dataKey="branch"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(333, 10%, 46%)"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" />
                <Tooltip />
                <Bar
                  dataKey="profiles"
                  name="Users"
                  fill="hsl(333, 60%, 34%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="subscriptions"
                  name="Active subs"
                  fill="hsl(40, 100%, 58%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {logs.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">
                  No recent activity.
                </p>
              )}
              {logs.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <span className="text-lg shrink-0">
                    {activityIcons[a.type] ?? activityIcons.notification}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {a.subject ||
                        `${a.channel} · ${a.success ? "sent" : "failed"}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.recipient} · {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access — Admin Sections */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Admin Sections — Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickLinks.map((link) => (
              <button
                key={link.url}
                onClick={() => navigate(link.url)}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/50 hover:shadow-md transition-all text-left group"
              >
                <div
                  className={`h-10 w-10 rounded-lg ${link.bg} flex items-center justify-center shrink-0`}
                >
                  <link.icon className={`h-5 w-5 ${link.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground">
                    {link.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {link.desc}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
