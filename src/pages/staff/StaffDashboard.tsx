import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { staffKPIs, revenueData, commissions } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Activity } from "lucide-react";

const commissionByMonth = revenueData.map((d) => ({
  month: d.month,
  commission: Math.round(d.revenue * 0.08),
}));

const leadSources = [
  { name: "Website", value: 35 },
  { name: "Walk-in", value: 25 },
  { name: "Phone", value: 20 },
  { name: "WhatsApp", value: 12 },
  { name: "Email", value: 8 },
];

const COLORS = ["hsl(333, 60%, 34%)", "hsl(40, 100%, 58%)", "hsl(8, 100%, 85%)", "hsl(160, 60%, 45%)", "hsl(220, 60%, 50%)"];

export default function StaffDashboard() {
  const myCommissions = commissions.filter((c) => c.staff === "Anitha Lakshmi");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Staff Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back, Anitha Lakshmi</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {staffKPIs.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Commission */}
        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Commission (12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={commissionByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Commission"]} />
                <Bar dataKey="commission" fill="hsl(40, 100%, 58%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={leadSources} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {leadSources.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> My Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: "Created profile for Suresh M", time: "1 hr ago" },
              { action: "Sold Gold subscription to Priya Sharma", time: "3 hrs ago" },
              { action: "Updated enquiry status for Kavitha R", time: "5 hrs ago" },
              { action: "Added follow-up note for Ravi P", time: "Yesterday" },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                <span className="text-foreground">{a.action}</span>
                <span className="text-muted-foreground text-xs">{a.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
