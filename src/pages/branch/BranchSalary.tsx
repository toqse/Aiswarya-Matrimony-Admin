import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRole } from "@/contexts/RoleContext";
import { fetchBranchStaffList } from "@/lib/admin-api/staff";
import { IndianRupee, Users, Loader2 } from "lucide-react";

function num(s: string) {
  const n = parseFloat(String(s).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function BranchSalary() {
  const { branch } = useRole();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["branch", "staff", "salary"],
    queryFn: () => fetchBranchStaffList({ page_size: 200 }),
  });

  const rows = useMemo(() => {
    return (data?.results ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      emp_code: s.emp_code,
      basic: num(s.basic_salary),
      commissionRate: num(s.commission_rate),
      designation: s.designation,
      is_active: s.is_active,
    }));
  }, [data?.results]);

  const totalBasic = rows.reduce((s, r) => s + r.basic, 0);
  const activeCount = rows.filter((r) => r.is_active).length;

  const kpis = [
    { label: "Σ basic (listed)", value: `₹${Math.round(totalBasic).toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Staff count", value: rows.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active", value: activeCount, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Inactive", value: rows.length - activeCount, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Branch salary snapshot</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {branch?.name ?? "Branch"} — master fields from <code className="text-xs">GET v1/branch/staff/</code>. Payroll runs use admin APIs only.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}
      {isError && <p className="text-sm text-destructive">Could not load branch staff.</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0">
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

      <Card className="shadow-elegant border-0">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-center">Comm. rate %</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.emp_code}</TableCell>
                  <TableCell>{r.designation}</TableCell>
                  <TableCell className="text-right">₹{Math.round(r.basic).toLocaleString()}</TableCell>
                  <TableCell className="text-center">{r.commissionRate}%</TableCell>
                  <TableCell>
                    <Badge className={r.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}>
                      {r.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
