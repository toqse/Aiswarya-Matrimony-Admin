import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRole } from "@/contexts/RoleContext";
import { fetchBranchStaffList } from "@/lib/admin-api/staff";
import { Search, Download, Target, Users, TrendingUp, Award, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function num(s: string) {
  const n = parseFloat(String(s).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function BranchStaffPerformance() {
  const { branch } = useRole();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["branch", "staff", "performance"],
    queryFn: () => fetchBranchStaffList({ page_size: 200 }),
  });

  const rows = useMemo(() => {
    const list = data?.results ?? [];
    return list.map((s) => {
      const basic = num(s.basic_salary);
      const rate = num(s.commission_rate);
      const { achieved, target } = s.target_progress;
      const pct = target > 0 ? (achieved / target) * 100 : 0;
      return {
        id: s.id,
        name: s.name,
        basic,
        commissionRate: rate,
        achieved,
        target,
        pct,
        is_active: s.is_active,
        designation: s.designation,
      };
    });
  }, [data?.results]);

  const filtered = rows.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const totalBasic = rows.reduce((s, r) => s + r.basic, 0);
  const totalAchieved = rows.reduce((s, r) => s + r.achieved, 0);
  const avgConversion =
    rows.length > 0 ? (rows.reduce((s, r) => s + (r.target > 0 ? (r.achieved / r.target) * 100 : 0), 0) / rows.length).toFixed(1) : "0";

  const kpis = [
    { label: "Staff (listed)", value: rows.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Target units (Σ achieved)", value: totalAchieved, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Basic salary (Σ)", value: `₹${Math.round(totalBasic).toLocaleString()}`, icon: Target, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Avg target progress", value: `${avgConversion}%`, icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const barData = filtered.map((s) => ({
    name: s.name.length > 18 ? `${s.name.slice(0, 16)}…` : s.name,
    basic: Math.round(s.basic),
    rate: Math.round(s.commissionRate * 100) / 100,
  }));

  const exportCSV = () => {
    const headers = "Name,Designation,BasicSalary,CommissionRate%,Target,Achieved,Progress%\n";
    const body = rows
      .map(
        (s) =>
          `"${s.name.replace(/"/g, '""')}",${s.designation},${s.basic},${s.commissionRate},${s.target},${s.achieved},${s.pct.toFixed(1)}`
      )
      .join("\n");
    const blob = new Blob([headers + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "branch-staff-performance.csv";
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
          <p className="text-muted-foreground text-sm mt-1">
            {branch?.name ?? "Branch"} — from <code className="text-xs">GET v1/branch/staff/</code>
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2" disabled={!rows.length}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
        </div>
      )}
      {isError && <p className="text-sm text-destructive">Could not load branch staff.</p>}

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Basic salary & commission rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="basic" name="Basic (₹)" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="rate" name="Comm. rate" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Target vs achieved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5 pt-2 max-h-[300px] overflow-y-auto pr-1">
              {filtered.map((s) => {
                const pct = s.target > 0 ? (s.achieved / s.target) * 100 : 0;
                const isAbove = pct >= 100;
                return (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold ${isAbove ? "text-emerald-600" : "text-amber-600"}`}>
                          {s.achieved}/{s.target}
                        </span>
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

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Branch staff</CardTitle>
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
                <TableHead>Staff</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-center">Comm. rate</TableHead>
                <TableHead className="text-center">Target vs actual</TableHead>
                <TableHead className="text-center">Progress</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const convRate = s.target > 0 ? ((s.achieved / s.target) * 100).toFixed(1) : "0.0";
                const isAbove = parseFloat(convRate) >= 100;
                const isGood = parseFloat(convRate) >= 80;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.designation}</TableCell>
                    <TableCell className="text-right">₹{Math.round(s.basic).toLocaleString()}</TableCell>
                    <TableCell className="text-center">{s.commissionRate}%</TableCell>
                    <TableCell className="text-center text-sm">
                      {s.achieved} / {s.target}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          isAbove
                            ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                            : isGood
                              ? "border-blue-300 text-blue-700 bg-blue-50"
                              : "border-amber-300 text-amber-700 bg-amber-50"
                        }
                      >
                        {convRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={s.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}>
                        {s.is_active ? "Active" : "Inactive"}
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
