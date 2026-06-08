import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { fetchStaffDashboardSummary } from "@/lib/admin-api/staff-dashboard";
import { fetchStaffCommissionSummary } from "@/lib/admin-api/commissions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

export default function StaffDashboard() {
  const { userName } = useRole();

  const summaryQ = useQuery({
    queryKey: ["staff", "dashboard", "summary"],
    queryFn: () => fetchStaffDashboardSummary(),
  });

  const commissionLedgerQ = useQuery({
    queryKey: ["staff", "commissions", "summary"],
    queryFn: () => fetchStaffCommissionSummary(),
  });

  const d = summaryQ.data;
  const ledger = commissionLedgerQ.data;

  /** Dashboard summary counts approved+paid in the current month only; ledger summary includes pending (all time). */
  const commissionKpiAmount =
    ledger != null
      ? Number(ledger.total)
      : d != null
        ? Number(d.commission_earned.amount)
        : 0;
  const commissionKpiTrend =
    ledger != null && Number(ledger.pending) > 0
      ? `₹${Number(ledger.pending).toLocaleString("en-IN")} pending · ${d?.commission_earned.growth_pct ?? "+0%"}`
      : d?.commission_earned.growth_pct ?? "—";

  const commissionChartData =
    ledger != null
      ? [
          { month: "Pending", commission: Number(ledger.pending) },
          { month: "Approved", commission: Number(ledger.approved) },
          { month: "Paid", commission: Number(ledger.paid) },
        ]
      : [{ month: "This month (paid & approved)", commission: d?.commission_earned.amount ?? 0 }];

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
      label: "Commission (ledger)",
      value: d || ledger ? `₹${Number(commissionKpiAmount).toLocaleString("en-IN")}` : "—",
      change: commissionKpiTrend,
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

      {summaryQ.isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {summaryQ.error && (
        <p className="text-destructive text-sm">{(summaryQ.error as Error).message}</p>
      )}
      {commissionLedgerQ.isError && !summaryQ.error && (
        <p className="text-destructive text-sm">Commission summary: {(commissionLedgerQ.error as Error).message}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {ledger != null ? "Commission by status (ledger)" : "Commission earned (this month, paid & approved)"}
          </CardTitle>
          {ledger != null && d != null && (
            <p className="text-xs text-muted-foreground mt-1">
              Paid &amp; approved this month (dashboard tally): ₹{Number(d.commission_earned.amount).toLocaleString("en-IN")}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={
                commissionChartData.length
                  ? commissionChartData
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
    </div>
  );
}
