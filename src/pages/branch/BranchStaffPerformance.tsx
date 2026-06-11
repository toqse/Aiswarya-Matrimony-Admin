import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { formatPhoneForApi } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from "@/contexts/RoleContext";
import { fetchBranchList } from "@/lib/admin-api/branches";
import {
  fetchBranchStaffPerformanceChart,
  fetchBranchStaffPerformanceList,
  fetchBranchStaffPerformanceSummary,
  fetchBranchStaffPerformanceTargets,
} from "@/lib/admin-api/reports";
import { createStaff } from "@/lib/admin-api/staff";
import { Search, Target, Users, TrendingUp, Award, ArrowUpRight, ArrowDownRight, Loader2, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

function toFiniteNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function BranchStaffPerformance() {
  const { branch, role } = useRole();
  const [search, setSearch] = useState("");
  const [month] = useState(() => new Date().toISOString().slice(0, 7));
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    mobile: "",
    email: "",
    role: "staff" as "staff" | "branch_manager",
    branchId: branch?.id ? String(branch.id) : "",
    designation: "",
    department: "",
    joiningDate: "",
    basicSalary: "",
    commissionRate: "",
    monthlyTarget: "",
  });
  const { toast } = useToast();
  const qc = useQueryClient();

  const summaryQ = useQuery({
    queryKey: ["branch", "staff-performance", "summary", month],
    queryFn: () => fetchBranchStaffPerformanceSummary({ month }),
  });
  const chartQ = useQuery({
    queryKey: ["branch", "staff-performance", "chart", month],
    queryFn: () => fetchBranchStaffPerformanceChart({ month }),
  });
  const targetsQ = useQuery({
    queryKey: ["branch", "staff-performance", "targets", month],
    queryFn: () => fetchBranchStaffPerformanceTargets({ month }),
  });
  const listQ = useQuery({
    queryKey: ["branch", "staff-performance", "list", month, search],
    queryFn: () => fetchBranchStaffPerformanceList({ month, page_size: 200, search: search.trim() || undefined }),
  });
  const branchesQ = useQuery({
    queryKey: ["admin", "branches", "dropdown"],
    queryFn: () => fetchBranchList({ page_size: 200 }),
    enabled: role === "admin",
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const branchId = Number(addForm.branchId || branch?.id);
      if (!addForm.name || !addForm.mobile || !branchId || !addForm.designation) {
        throw new Error("Name, mobile, branch, and designation are required");
      }
      return createStaff({
        name: addForm.name.trim(),
        mobile: formatPhoneForApi(addForm.mobile),
        email: addForm.email.trim() || undefined,
        role: role === "admin" ? addForm.role : "staff",
        branch: branchId,
        designation: addForm.designation.trim(),
        department: addForm.department.trim() || undefined,
        joining_date: addForm.joiningDate || undefined,
        basic_salary: Number(addForm.basicSalary || 0),
        commission_rate: Number(addForm.commissionRate || 0),
        monthly_target: Number(addForm.monthlyTarget || 0),
      });
    },
    onSuccess: () => {
      toast({ title: "Staff created" });
      setAddOpen(false);
      setAddForm({
        name: "",
        mobile: "",
        email: "",
        role: "staff",
        branchId: branch?.id ? String(branch.id) : "",
        designation: "",
        department: "",
        joiningDate: "",
        basicSalary: "",
        commissionRate: "",
        monthlyTarget: "",
      });
      qc.invalidateQueries({ queryKey: ["branch", "staff-performance"] });
    },
    onError: (e: Error) => {
      toast({ title: "Create staff failed", description: e.message, variant: "destructive" });
    },
  });

  const rows = useMemo(() => {
    const list = listQ.data?.results ?? [];
    return list.map((s, idx) => {
      return {
        id: s.staff_id ?? `row-${idx}`,
        name: s.staff_name,
        basic: toFiniteNumber(s.revenue),
        commissionRate: toFiniteNumber(s.commission_earned),
        achieved: toFiniteNumber(s.achieved_target),
        target: toFiniteNumber(s.monthly_target),
        pct: toFiniteNumber(s.target_progress),
        is_active: true,
        designation: s.designation,
      };
    });
  }, [listQ.data?.results]);

  const totalBasic = rows.reduce((s, r) => s + toFiniteNumber(r.basic), 0);
  const totalAchieved = rows.reduce((s, r) => s + toFiniteNumber(r.achieved), 0);
  const avgConversion = toFiniteNumber(summaryQ.data?.avg_target_progress).toFixed(1);

  const kpis = [
    { label: "Staff (listed)", value: summaryQ.data?.total_staff ?? rows.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Target units (Σ achieved)", value: totalAchieved, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    {
      label: "Revenue (Σ)",
      value: `₹${Math.round(toFiniteNumber(summaryQ.data?.total_revenue) || totalBasic).toLocaleString()}`,
      icon: Target,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    { label: "Avg target progress", value: `${avgConversion}%`, icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const barData = (chartQ.data?.staff ?? []).map((s) => ({
    name: s.staff_name.length > 18 ? `${s.staff_name.slice(0, 16)}…` : s.staff_name,
    basic: Math.round(toFiniteNumber(s.revenue)),
    rate: Math.round(toFiniteNumber(s.commission) * 100) / 100,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Performance</h1>
          <p className="text-muted-foreground text-sm mt-1">{branch?.name ?? "Branch"} — branch staff-performance endpoints</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        </div>
      </div>

      {(summaryQ.isLoading || chartQ.isLoading || targetsQ.isLoading || listQ.isLoading) && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
        </div>
      )}
      {(summaryQ.isError || chartQ.isError || targetsQ.isError || listQ.isError) && (
        <p className="text-sm text-destructive">Could not load branch staff performance.</p>
      )}

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
              {(targetsQ.data?.staff ?? []).map((s, idx) => {
                const achieved = toFiniteNumber(s.achieved_target);
                const target = toFiniteNumber(s.monthly_target);
                const pct = target > 0 ? (achieved / target) * 100 : 0;
                const isAbove = pct >= 100;
                return (
                  <div key={`target-${s.staff_id ?? s.staff_name ?? idx}`} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.staff_name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold ${isAbove ? "text-emerald-600" : "text-amber-600"}`}>
                          {achieved}/{target}
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
              {rows.map((s, idx) => {
                const convRate = s.target > 0 ? ((s.achieved / s.target) * 100).toFixed(1) : "0.0";
                const isAbove = parseFloat(convRate) >= 100;
                const isGood = parseFloat(convRate) >= 80;
                return (
                  <TableRow key={`staff-row-${String(s.id)}-${idx}`}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.designation}</TableCell>
                    <TableCell className="text-right">₹{Math.round(s.basic).toLocaleString()}</TableCell>
                    <TableCell className="text-center">₹{Math.round(s.commissionRate).toLocaleString()}</TableCell>
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Staff</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} placeholder="Staff name" />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile *</Label>
              <PhoneInput value={addForm.mobile} onChange={(v) => setAddForm((p) => ({ ...p, mobile: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} placeholder="staff@aiswarya.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select
                value={role === "admin" ? addForm.role : "staff"}
                onValueChange={(value) => setAddForm((p) => ({ ...p, role: value as "staff" | "branch_manager" }))}
                disabled={role !== "admin"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="branch_manager">Branch Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Branch *</Label>
              <Select
                value={addForm.branchId}
                onValueChange={(value) => setAddForm((p) => ({ ...p, branchId: value }))}
                disabled={role !== "admin"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {(branchesQ.data?.results ?? []).map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                  {role !== "admin" && branch?.id != null && (
                    <SelectItem value={String(branch.id)}>{branch.name}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Designation *</Label>
              <Input value={addForm.designation} onChange={(e) => setAddForm((p) => ({ ...p, designation: e.target.value }))} placeholder="Senior Consultant" />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={addForm.department} onChange={(e) => setAddForm((p) => ({ ...p, department: e.target.value }))} placeholder="Sales" />
            </div>
            <div className="space-y-1.5">
              <Label>Joining Date</Label>
              <Input type="date" value={addForm.joiningDate} onChange={(e) => setAddForm((p) => ({ ...p, joiningDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Basic Salary</Label>
              <Input type="number" value={addForm.basicSalary} onChange={(e) => setAddForm((p) => ({ ...p, basicSalary: e.target.value }))} placeholder="35000" />
            </div>
            <div className="space-y-1.5">
              <Label>Commission Rate</Label>
              <Input type="number" value={addForm.commissionRate} onChange={(e) => setAddForm((p) => ({ ...p, commissionRate: e.target.value }))} placeholder="10" />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly Target</Label>
              <Input type="number" value={addForm.monthlyTarget} onChange={(e) => setAddForm((p) => ({ ...p, monthlyTarget: e.target.value }))} placeholder="20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => addMut.mutate()} disabled={addMut.isPending}>
              {addMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
