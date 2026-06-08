import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import type { BranchDashboardGrowth, BranchDashboardSummary } from "@/lib/admin-api/dashboard";
import { fetchBranchDashboardSummary } from "@/lib/admin-api/dashboard";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { BarChart3, Loader2, TrendingUp } from "lucide-react";

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function growthKpi(growth: BranchDashboardGrowth | undefined, key: keyof BranchDashboardGrowth) {
  if (!growth) return { change: "—", trend: "neutral" as const };
  const pct = growth[key];
  if (pct === 0) return { change: "0% vs previous period", trend: "neutral" as const };
  const sign = pct > 0 ? "+" : "";
  return {
    change: `${sign}${pct}% vs previous period`,
    trend: pct > 0 ? ("up" as const) : ("down" as const),
  };
}

function volumeChartData(summary: BranchDashboardSummary | undefined) {
  if (!summary) return [];
  return [
    { label: "Subscriptions", value: summary.total_subscriptions },
    { label: "Staff", value: summary.total_staff },
    { label: "Profiles", value: summary.total_profiles },
  ];
}

function growthChartData(growth: BranchDashboardGrowth | undefined) {
  if (!growth) return [];
  return [
    { label: "Subscriptions", value: growth.subscriptions },
    { label: "Revenue", value: growth.revenue },
    { label: "Staff", value: growth.staff },
    { label: "Profiles", value: growth.profiles },
  ];
}

function revenueVsCountsData(summary: BranchDashboardSummary | undefined) {
  if (!summary) return [];
  return [
    { name: "Subscriptions", count: summary.total_subscriptions, revenue: 0 },
    { name: "Staff", count: summary.total_staff, revenue: 0 },
    { name: "Profiles", count: summary.total_profiles, revenue: 0 },
    { name: "Revenue (₹)", count: 0, revenue: summary.total_revenue },
  ];
}

function BranchManagerDashboard() {
  const { branch } = useRole();

  const summaryQ = useQuery({
    queryKey: ["branch", "dashboard", "summary"],
    queryFn: () => fetchBranchDashboardSummary(),
  });

  const s = summaryQ.data;
  const growth = s?.growth;

  const volData = useMemo(() => volumeChartData(s), [s]);
  const growthData = useMemo(() => growthChartData(growth), [growth]);
  const mixData = useMemo(() => revenueVsCountsData(s), [s]);

  const kpis = [
    {
      label: "Branch subscriptions",
      value: String(s?.total_subscriptions ?? "—"),
      ...growthKpi(growth, "subscriptions"),
      icon: "CreditCard" as const,
    },
    {
      label: "Branch revenue",
      value: s !== undefined ? formatINR(s.total_revenue) : "—",
      ...growthKpi(growth, "revenue"),
      icon: "IndianRupee" as const,
    },
    {
      label: "Branch staff",
      value: String(s?.total_staff ?? "—"),
      ...growthKpi(growth, "staff"),
      icon: "Users" as const,
    },
    {
      label: "Your branch",
      value: branch?.name ?? "—",
      change: "—",
      trend: "neutral" as const,
      icon: "UserCheck" as const,
    },
    {
      label: "Branch profiles",
      value: String(s?.total_profiles ?? s?.active_enquiries ?? "—"),
      ...growthKpi(growth, "profiles"),
      icon: "UserPlus" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Branch Manager Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{branch?.name ?? "Branch"} — Overview</p>
      </div>

      {summaryQ.isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {summaryQ.isError && (
        <p className="text-sm text-destructive">Could not load branch data. Check your session and API access.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      {s && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-elegant border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Branch counts
              </CardTitle>
              <p className="text-xs text-muted-foreground font-normal">Subscriptions, staff, and profiles from the summary endpoint.</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RechartsBarChart data={volData.length ? volData : [{ label: "—", value: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString("en-IN"), "Count"]} />
                  <Bar dataKey="value" name="Count" fill="hsl(333, 60%, 34%)" radius={[6, 6, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Period growth (%)
              </CardTitle>
              <p className="text-xs text-muted-foreground font-normal">Change vs previous period from the API growth fields.</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RechartsBarChart data={growthData.length ? growthData : [{ label: "No growth data", value: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Change"]} />
                  <ReferenceLine y={0} stroke="hsl(333, 10%, 46%)" strokeDasharray="4 4" />
                  <Bar dataKey="value" name="Growth %" radius={[6, 6, 0, 0]}>
                    {(growthData.length ? growthData : [{ value: 0 }]).map((entry, index) => (
                      <Cell
                        key={`g-${index}`}
                        fill={
                          entry.value > 0
                            ? "hsl(142, 55%, 40%)"
                            : entry.value < 0
                              ? "hsl(0, 72%, 50%)"
                              : "hsl(333, 12%, 65%)"
                        }
                      />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-0 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Revenue vs counts
              </CardTitle>
              <p className="text-xs text-muted-foreground font-normal">
                Headcount-style metrics on the left axis; branch revenue in rupees on the right. The last category is total revenue only.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={mixData.length ? mixData : [{ name: "—", count: 0, revenue: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" allowDecimals={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(333, 10%, 46%)"
                    tickFormatter={(v) => {
                      const n = Number(v);
                      if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
                      if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
                      return `₹${n}`;
                    }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === "Revenue (₹)" || name === "revenue"
                        ? [formatINR(value), "Revenue"]
                        : [value.toLocaleString("en-IN"), "Count"]
                    }
                  />
                  <Bar yAxisId="left" dataKey="count" name="Count" fill="hsl(333, 60%, 34%)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="revenue" name="Revenue (₹)" fill="hsl(40, 90%, 48%)" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default BranchManagerDashboard;
