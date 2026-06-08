import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRole } from "@/contexts/RoleContext";
import {
  approveBranchPayroll,
  downloadBranchSalarySlip,
  fetchBranchPayrollList,
  fetchBranchPayrollSummary,
} from "@/lib/admin-api/payroll";
import { Check, FileText, IndianRupee, Users, Loader2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BranchSalary() {
  const { branch } = useRole();
  const { toast } = useToast();
  const qc = useQueryClient();
  const summaryQ = useQuery({
    queryKey: ["branch", "payroll", "summary"],
    queryFn: () => fetchBranchPayrollSummary(),
  });

  const listQ = useQuery({
    queryKey: ["branch", "payroll", "list"],
    queryFn: () => fetchBranchPayrollList(),
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => approveBranchPayroll(id),
    onSuccess: () => {
      toast({ title: "Payroll approved" });
      qc.invalidateQueries({ queryKey: ["branch", "payroll"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const downloadMut = useMutation({
    mutationFn: (id: number) => downloadBranchSalarySlip(id),
    onError: (e: Error) => toast({ title: "Download failed", description: e.message, variant: "destructive" }),
  });

  const rows = (listQ.data?.results ?? []) as Array<Record<string, unknown>>;
  const summary = summaryQ.data;
  const excludedField = (key: string) => key.toLowerCase().includes("download") || key.toLowerCase().includes("url");
  const allColumns = Array.from(
    rows.reduce((acc, row) => {
      Object.keys(row).forEach((k) => {
        if (!excludedField(k)) acc.add(k);
      });
      return acc;
    }, new Set<string>()),
  );

  const actionIconBtn =
    "h-8 w-8 shrink-0 rounded-full border-0 shadow-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-1";

  const kpis = [
    { label: "Branch Net Payroll", value: summary ? `₹${Number(summary.branch_net_payroll).toLocaleString()}` : "—", icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Staff", value: summary?.total_staff ?? "—", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Approved", value: summary?.approved_count ?? "—", icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Draft", value: summary?.draft_count ?? "—", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Branch salary snapshot</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {branch?.name ?? "Branch"} — salary management from <code className="text-xs">GET v1/branch/payroll/</code>
        </p>
      </div>
      {(listQ.isLoading || summaryQ.isLoading) && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading payroll…
        </div>
      )}
      {(listQ.isError || summaryQ.isError) && <p className="text-sm text-destructive">Could not load branch payroll.</p>}

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
                {allColumns.map((col) => (
                  <TableHead key={col}>{col.replace(/_/g, " ")}</TableHead>
                ))}
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, rowIdx) => (
                <TableRow key={String(r.id ?? rowIdx)}>
                  {allColumns.map((col) => {
                    const value = r[col];
                    if (col === "status") {
                      const status = String(value ?? "");
                      return (
                        <TableCell key={`${rowIdx}-${col}`}>
                          <Badge className={status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}>
                            {status || "—"}
                          </Badge>
                        </TableCell>
                      );
                    }
                    return <TableCell key={`${rowIdx}-${col}`}>{value == null ? "—" : String(value)}</TableCell>;
                  })}
                  <TableCell className="text-center">
                    <div className="flex gap-1 justify-center">
                      {String(r.status ?? "").toLowerCase() === "draft" && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          title="Approve"
                          aria-label="Approve"
                          className={`${actionIconBtn} bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:text-emerald-700 focus-visible:ring-emerald-400`}
                          onClick={() => {
                            const id = Number(r.id);
                            if (Number.isFinite(id)) approveMut.mutate(id);
                          }}
                          disabled={approveMut.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Slip"
                        aria-label="Slip"
                        className={`${actionIconBtn} bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700 focus-visible:ring-slate-400`}
                        onClick={() => {
                          const id = Number(r.id);
                          if (!Number.isFinite(id)) return;
                          downloadMut.mutate(id);
                        }}
                        disabled={downloadMut.isPending}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
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
