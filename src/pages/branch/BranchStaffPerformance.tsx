import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { staffPerformance } from "@/data/mockData";
import { Search, Download, Target, Users, TrendingUp, Award, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

export default function BranchStaffPerformance() {
  const [search, setSearch] = useState("");

  const filtered = staffPerformance.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalProfiles = staffPerformance.reduce((s, r) => s + r.profilesCreated, 0);
  const totalSubs = staffPerformance.reduce((s, r) => s + r.subscriptionsSold, 0);
  const totalRevenue = staffPerformance.reduce((s, r) => s + r.revenue, 0);
  const totalCommission = staffPerformance.reduce((s, r) => s + r.commission, 0);
  const avgConversion = staffPerformance.length > 0
    ? (staffPerformance.reduce((s, r) => s + (r.target > 0 ? (r.achieved / r.target) * 100 : 0), 0) / staffPerformance.length).toFixed(1)
    : "0";

  const kpis = [
    { label: "Total Profiles Created", value: totalProfiles, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Subscriptions Sold", value: totalSubs, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Branch Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: Target, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Avg Conversion Rate", value: `${avgConversion}%`, icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  // Radar chart data for staff comparison
  const radarData = staffPerformance.map((s) => ({
    name: s.name.split(" ")[0],
    profiles: s.profilesCreated,
    subscriptions: s.subscriptionsSold * 3,
    revenue: Math.round(s.revenue / 10000),
    conversion: s.target > 0 ? Math.round((s.achieved / s.target) * 100) : 0,
  }));

  const exportCSV = () => {
    const headers = "Name,Profiles Created,Subscriptions Sold,Revenue,Commission,Target,Achieved,Conversion Rate\n";
    const rows = staffPerformance.map((s) =>
      `${s.name},${s.profilesCreated},${s.subscriptionsSold},${s.revenue},${s.commission},${s.target},${s.achieved},${s.target > 0 ? ((s.achieved / s.target) * 100).toFixed(1) : 0}%`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staff-performance.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Performance</h1>
          <p className="text-muted-foreground text-sm mt-1">Chennai Central — All staff performance metrics</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0 hover:shadow-lg transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue & Commission by Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={staffPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="commission" name="Commission" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Target vs Achieved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5 pt-2">
              {staffPerformance.map((s) => {
                const pct = s.target > 0 ? (s.achieved / s.target) * 100 : 0;
                const isAbove = pct >= 100;
                return (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold ${isAbove ? "text-emerald-600" : "text-amber-600"}`}>{s.achieved}/{s.target}</span>
                        {isAbove ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> : <ArrowDownRight className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-2.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Staff Performance Table */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Detailed Staff Performance</CardTitle>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead className="text-center">Profiles Created</TableHead>
                <TableHead className="text-center">Subscriptions Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Commission Earned</TableHead>
                <TableHead className="text-center">Conversion Rate</TableHead>
                <TableHead className="text-center">Target vs Actual</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const convRate = s.target > 0 ? ((s.achieved / s.target) * 100).toFixed(1) : "0.0";
                const isAbove = parseFloat(convRate) >= 100;
                const isGood = parseFloat(convRate) >= 80;
                return (
                  <TableRow key={s.name}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-center">{s.profilesCreated}</TableCell>
                    <TableCell className="text-center font-semibold">{s.subscriptionsSold}</TableCell>
                    <TableCell className="text-right font-medium">₹{s.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">₹{s.commission.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={isAbove ? "border-emerald-300 text-emerald-700 bg-emerald-50" : isGood ? "border-blue-300 text-blue-700 bg-blue-50" : "border-amber-300 text-amber-700 bg-amber-50"}>
                        {convRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs text-muted-foreground">{s.achieved}</span>
                        <span className="text-xs text-muted-foreground">/</span>
                        <span className="text-xs font-medium">{s.target}</span>
                        {isAbove ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={isAbove ? "bg-emerald-100 text-emerald-700" : isGood ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}>
                        {isAbove ? "Exceeded" : isGood ? "On Track" : "Behind"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
