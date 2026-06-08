import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  fetchGrowthReport,
  fetchPlanPopularityReport,
  fetchProductivityReport,
  fetchProfileCompletionReport,
} from "@/lib/admin-api/reports";
import { useQueries } from "@tanstack/react-query";
import {
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
  const reportingMonth = new Date().toISOString().slice(0, 7);

  const [productivityQ, growthQ, profileQ, planQ] = useQueries({
    queries: [
      {
        queryKey: ["admin", "reports", "productivity", reportingMonth],
        queryFn: () =>
          fetchProductivityReport({
            month: reportingMonth,
            branch_id: undefined,
          }),
      },
      {
        queryKey: ["admin", "reports", "growth"],
        queryFn: () =>
          fetchGrowthReport({
            period: "monthly",
            branch_id: undefined,
          }),
      },
      {
        queryKey: ["admin", "reports", "profile-completion"],
        queryFn: () => fetchProfileCompletionReport({ branch_id: undefined }),
      },
      {
        queryKey: ["admin", "reports", "plan-popularity"],
        queryFn: () => fetchPlanPopularityReport({ branch_id: undefined }),
      },
    ],
  });

  const loading =
    productivityQ.isLoading ||
    growthQ.isLoading ||
    profileQ.isLoading ||
    planQ.isLoading;
  const err =
    productivityQ.error ||
    growthQ.error ||
    profileQ.error ||
    planQ.error;

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

  const communityPieData =
    communityData.length > 0 ? communityData : [{ name: "No Data", value: 100 }];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Comprehensive business intelligence
        </p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Staff Productivity */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="text-base">Staff Productivity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
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
          <CardContent className="pt-0">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="mx-auto h-[240px] w-full max-w-[260px] shrink-0 sm:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={communityPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      paddingAngle={1}
                      dataKey="value"
                      nameKey="name"
                      label={false}
                    >
                      {communityPieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${Number(value).toFixed(1)}%`, "Share"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {communityData.length > 0 ? (
                <ul className="min-w-0 flex-1 space-y-2.5 text-sm sm:max-w-[min(100%,18rem)]">
                  {communityData.map((row, i) => (
                    <li
                      key={`${row.name}-${i}`}
                      className="flex items-center justify-between gap-4 border-b border-border/60 pb-2.5 last:border-0 last:pb-0"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          aria-hidden
                        />
                        <span className="truncate text-foreground">{row.name}</span>
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-muted-foreground">
                        {Number(row.value).toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="text-base">Plan Popularity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
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
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
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
