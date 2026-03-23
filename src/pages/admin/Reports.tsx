import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  fetchGrowthReport,
  fetchPlanPopularityReport,
  fetchProductivityReport,
  fetchProfileCompletionReport,
  fetchRevenueReport,
} from "@/lib/admin-api/reports";
import { useQueries } from "@tanstack/react-query";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2 } from "lucide-react";

const COLORS = [
  "hsl(333, 60%, 34%)",
  "hsl(40, 100%, 58%)",
  "hsl(8, 100%, 85%)",
  "hsl(160, 60%, 45%)",
  "hsl(220, 60%, 50%)",
  "hsl(280, 50%, 50%)",
  "hsl(30, 80%, 50%)",
];

export default function Reports() {
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">(
    "monthly",
  );
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [branchId, setBranchId] = useState<string>("all");

  const [revenueQ, productivityQ, growthQ, profileQ, planQ] = useQueries({
    queries: [
      {
        queryKey: ["admin", "reports", "revenue", period, branchId],
        queryFn: () =>
          fetchRevenueReport({
            period,
            branch_id: branchId === "all" ? undefined : Number(branchId),
          }),
      },
      {
        queryKey: ["admin", "reports", "productivity", month, branchId],
        queryFn: () =>
          fetchProductivityReport({
            month,
            branch_id: branchId === "all" ? undefined : Number(branchId),
          }),
      },
      {
        queryKey: ["admin", "reports", "growth", branchId],
        queryFn: () =>
          fetchGrowthReport({
            period: "monthly",
            branch_id: branchId === "all" ? undefined : Number(branchId),
          }),
      },
      {
        queryKey: ["admin", "reports", "profile-completion", branchId],
        queryFn: () =>
          fetchProfileCompletionReport({
            branch_id: branchId === "all" ? undefined : Number(branchId),
          }),
      },
      {
        queryKey: ["admin", "reports", "plan-popularity", branchId],
        queryFn: () =>
          fetchPlanPopularityReport({
            branch_id: branchId === "all" ? undefined : Number(branchId),
          }),
      },
    ],
  });

  const loading =
    revenueQ.isLoading ||
    productivityQ.isLoading ||
    growthQ.isLoading ||
    profileQ.isLoading ||
    planQ.isLoading;
  const err =
    revenueQ.error ||
    productivityQ.error ||
    growthQ.error ||
    profileQ.error ||
    planQ.error;

  const revenueData = (revenueQ.data?.chart ?? []).map((p) => ({
    month: p.label,
    revenue: p.value,
  }));
  const staffPerformance = (productivityQ.data?.chart ?? []).map((p) => ({
    name: p.label,
    revenue: p.value,
  }));
  const communityData = (profileQ.data?.chart ?? []).map((p) => ({
    name: p.label,
    value: p.percent_of_profiles,
  }));
  const leadSources = (planQ.data?.chart ?? []).map((p) => ({
    name: p.label,
    value: p.value,
  }));
  const branchPerformance = (growthQ.data?.chart ?? []).map((p) => ({
    branch: p.label,
    registrations: p.new_registrations,
    subscriptions: p.new_subscriptions,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Comprehensive business intelligence
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={period}
          onValueChange={(v: "daily" | "monthly" | "yearly") => setPeriod(v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-[180px]"
        />
        <Input
          type="number"
          value={branchId === "all" ? "" : branchId}
          onChange={(e) => setBranchId(e.target.value ? e.target.value : "all")}
          placeholder="Branch ID (optional)"
          className="w-[220px]"
        />
      </div>
      {err && (
        <Alert variant="destructive">
          <AlertTitle>Could not load reports</AlertTitle>
          <AlertDescription>{(err as Error).message}</AlertDescription>
        </Alert>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading reports...
        </div>
      )}

      {/* Revenue Report */}
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle className="text-base">Revenue Report</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={
                revenueData.length ? revenueData : [{ month: "—", revenue: 0 }]
              }
            >
              <defs>
                <linearGradient id="rptRev" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(333, 60%, 34%)"
                fill="url(#rptRev)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Productivity */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="text-base">Staff Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={
                  staffPerformance.length
                    ? staffPerformance
                    : [{ name: "—", revenue: 0 }]
                }
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(333, 15%, 90%)"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(333, 10%, 46%)"
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(333, 10%, 46%)"
                />
                <Tooltip
                  formatter={(v: number) => [`₹${v.toLocaleString()}`]}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="hsl(333, 60%, 34%)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Community Analytics */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="text-base">Community Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={
                    communityData.length
                      ? communityData
                      : [{ name: "No Data", value: 100 }]
                  }
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {communityData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="text-base">Plan Popularity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={
                    leadSources.length
                      ? leadSources
                      : [{ name: "No Data", value: 100 }]
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {leadSources.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Branch Comparison */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="text-base">Growth Report (Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={
                  branchPerformance.length
                    ? branchPerformance
                    : [{ branch: "—", registrations: 0, subscriptions: 0 }]
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
                  dataKey="registrations"
                  name="Registrations"
                  fill="hsl(333, 60%, 34%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="subscriptions"
                  name="Subscriptions"
                  fill="hsl(40, 100%, 58%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
