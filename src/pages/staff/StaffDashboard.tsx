import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { fetchStaffDashboardRecentActivity, fetchStaffDashboardSummary } from "@/lib/admin-api/staff-dashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, Loader2 } from "lucide-react";

export default function StaffDashboard() {
  const { userName } = useRole();

  const summaryQ = useQuery({
    queryKey: ["staff", "dashboard", "summary"],
    queryFn: () => fetchStaffDashboardSummary(),
  });

  const activityQ = useQuery({
    queryKey: ["staff", "dashboard", "recent-activity"],
    queryFn: () => fetchStaffDashboardRecentActivity(),
  });

  const d = summaryQ.data;
  const commissionByMonth = [{ month: "This month", commission: d?.commission_earned.amount ?? 0 }];

  const kpis = [
    {
      label: "My Profiles",
      value: d ? String(d.my_profiles.count) : "—",
      change: d?.my_profiles.growth_pct ?? "—",
      trend: "neutral" as const,
      icon: "Users",
    },
    {
      label: "Subscriptions This Month",
      value: d ? String(d.subscriptions_this_month.count) : "—",
      change: d?.subscriptions_this_month.growth_pct ?? "—",
      trend: "neutral" as const,
      icon: "CreditCard",
    },
    {
      label: "Commission Earned",
      value: d ? `₹${Number(d.commission_earned.amount).toLocaleString()}` : "—",
      change: d?.commission_earned.growth_pct ?? "—",
      trend: "neutral" as const,
      icon: "Wallet",
    },
    {
      label: "Branch",
      value: d?.branch ?? "—",
      change: "—",
      trend: "neutral" as const,
      icon: "IndianRupee",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Staff Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back{userName ? `, ${userName}` : ""}
        </p>
      </div>

      {(summaryQ.isLoading || activityQ.isLoading) && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {(summaryQ.error || activityQ.error) && (
        <p className="text-destructive text-sm">
          {((summaryQ.error || activityQ.error) as Error).message}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Commission Earned (this month)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={
                commissionByMonth.length
                  ? commissionByMonth
                  : [{ month: "—", commission: 0 }]
              }
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(333, 15%, 90%)"
              />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(v: number) => [
                  `₹${Number(v).toLocaleString()}`,
                  "Commission",
                ]}
              />
              <Bar
                dataKey="commission"
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
            <Activity className="h-4 w-4 text-primary" /> Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(activityQ.data?.items?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activityQ.data!.items.map((it) => (
                <div key={it.id} className="flex items-start justify-between gap-4 border-b border-border/50 pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{it.action_display}</p>
                    <p className="text-xs text-muted-foreground truncate">{it.details}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      {it.resource}{it.ip_address ? ` • ${it.ip_address}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{it.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
