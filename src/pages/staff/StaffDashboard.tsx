import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import {
  fetchStaffCommissions,
  fetchStaffSubscriptions,
} from "@/lib/admin-api/scoped";
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

  const subsQ = useQuery({
    queryKey: ["staff", "subscriptions", "dash"],
    queryFn: () => fetchStaffSubscriptions({ page_size: 1 }),
  });

  const commQ = useQuery({
    queryKey: ["staff", "commissions", "dash"],
    queryFn: () => fetchStaffCommissions({ page_size: 100 }),
  });

  const subCount = subsQ.data?.count ?? 0;
  const s = commQ.data?.summary;

  const commissionByMonth = (() => {
    const rows = commQ.data?.results ?? [];
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const m = r.date?.slice(0, 7) || "unknown";
      map.set(m, (map.get(m) ?? 0) + Number(r.commission));
    });
    return Array.from(map.entries())
      .map(([month, commission]) => ({ month, commission }))
      .slice(-12);
  })();

  const kpis = [
    {
      label: "Assigned subscriptions",
      value: String(subCount),
      change: "—",
      trend: "neutral" as const,
      icon: "Users",
    },
    {
      label: "Pending commission",
      value: s ? `₹${Number(s.total_pending).toLocaleString()}` : "—",
      change: "—",
      trend: "neutral" as const,
      icon: "Wallet",
    },
    {
      label: "Approved",
      value: s ? `₹${Number(s.approved).toLocaleString()}` : "—",
      change: "—",
      trend: "neutral" as const,
      icon: "CreditCard",
    },
    {
      label: "Paid",
      value: s ? `₹${Number(s.paid).toLocaleString()}` : "—",
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

      {(subsQ.isLoading || commQ.isLoading) && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Commission by month (from ledger)
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
          <p className="text-sm text-muted-foreground">
            Recent activity feed is not available from the API in this build.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
