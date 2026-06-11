import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  downloadStaffSalarySlip,
  fetchMySalaryCurrent,
  fetchMySalaryHistory,
  fetchMySalarySummary,
} from "@/lib/admin-api/staff-salary";
import { fetchStaffCommissions } from "@/lib/admin-api/scoped";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { IndianRupee, TrendingUp, Wallet, Calendar, Download, Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-info text-info-foreground",
  paid: "bg-success text-success-foreground",
};

export default function MySalary() {
  const { role } = useRole();
  const { toast } = useToast();
  const salaryScope = role === "branch-manager" ? "branch-manager" : "staff";
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (id: number) => {
    if (downloadingId !== null) return;
    setDownloadingId(id);
    try {
      await downloadStaffSalarySlip(id, salaryScope);
    } catch {
      toast({
        title: "Download failed",
        description: "Could not download the salary slip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };
  const today = useMemo(() => new Date(), []);
  const currentMonthKey = useMemo(
    () => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
    [today],
  );

  const summaryQ = useQuery({
    queryKey: ["staff", "salary", "summary", salaryScope],
    queryFn: () => fetchMySalarySummary(salaryScope),
  });

  const currentQ = useQuery({
    queryKey: ["staff", "salary", "current", salaryScope],
    queryFn: () => fetchMySalaryCurrent(salaryScope),
  });

  // Fallback: if backend salary record doesn't include current approved commissions yet,
  // compute from staff commissions list for the current calendar month.
  const approvedCommissionsQ = useQuery({
    queryKey: ["staff", "commissions", "approved", "for-salary-preview"],
    queryFn: () => fetchStaffCommissions({ status: "approved" }),
  });

  const historyQ = useQuery({
    queryKey: ["staff", "salary", "history", year, salaryScope],
    queryFn: () => fetchMySalaryHistory({ year }, salaryScope),
  });

  const rows = historyQ.data?.results ?? [];

  const summaryCards = [
    {
      label: "YTD Gross Pay",
      value: summaryQ.data ? `₹${Number(summaryQ.data.ytd_gross_pay).toLocaleString()}` : "—",
      icon: IndianRupee,
      color: "text-primary",
    },
    {
      label: "YTD Net Pay",
      value: summaryQ.data ? `₹${Number(summaryQ.data.ytd_net_pay).toLocaleString()}` : "—",
      icon: TrendingUp,
      color: "text-success",
    },
    {
      label: "Records",
      value: summaryQ.data ? summaryQ.data.records_count : rows.length,
      icon: Calendar,
      color: "text-info",
    },
    {
      label: "YTD Commission",
      value: summaryQ.data ? `₹${Number(summaryQ.data.ytd_commission).toLocaleString()}` : "—",
      icon: Wallet,
      color: "text-accent-foreground",
    },
  ];

  const approvedCommissionThisMonth = useMemo(() => {
    const rows = approvedCommissionsQ.data?.results ?? [];
    if (!rows.length) return 0;
    let sum = 0;
    for (const c of rows) {
      const d = String((c as { date?: string }).date ?? "");
      if (!d) continue;
      // Expecting YYYY-MM-DD, but tolerate other formats by Date.parse.
      const ym = /^\d{4}-\d{2}/.test(d) ? d.slice(0, 7) : null;
      if (ym ? ym !== currentMonthKey : false) continue;
      if (!ym) {
        const parsed = new Date(d);
        if (Number.isNaN(parsed.getTime())) continue;
        const pKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
        if (pKey !== currentMonthKey) continue;
      }
      const commissionRaw = (c as { commission?: string | number }).commission ?? 0;
      const commission = typeof commissionRaw === "number" ? commissionRaw : Number(commissionRaw);
      if (!Number.isFinite(commission)) continue;
      sum += commission;
    }
    return sum;
  }, [approvedCommissionsQ.data, currentMonthKey]);

  const commissionForPreview =
    currentQ.data && Number(currentQ.data.commission_approved) > 0
      ? Number(currentQ.data.commission_approved)
      : approvedCommissionThisMonth;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Salary</h1>
        <p className="text-muted-foreground text-sm mt-1">Salary summary, current month preview, and history</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
          className="w-[180px]"
          min={1900}
          max={2100}
        />
      </div>

      {(summaryQ.error || currentQ.error || historyQ.error) && (
        <p className="text-destructive text-sm">{((summaryQ.error || currentQ.error || historyQ.error) as Error).message}</p>
      )}
      {(summaryQ.isLoading || currentQ.isLoading || historyQ.isLoading) && <Loader2 className="h-5 w-5 animate-spin" />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className={`h-5 w-5 ${k.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle className="text-base">Current Month Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {!currentQ.data ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Month</p><p className="font-semibold">{currentQ.data.month}</p></div>
              <div><p className="text-xs text-muted-foreground">Basic</p><p className="font-semibold">₹{Number(currentQ.data.basic).toLocaleString()}</p></div>
              <div>
                <p className="text-xs text-muted-foreground">Commission (approved)</p>
                <p className="font-semibold">₹{Number(commissionForPreview).toLocaleString()}</p>
                {Number(currentQ.data.commission_approved) === 0 && approvedCommissionThisMonth > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    From approved commissions this month (salary preview not generated yet)
                  </p>
                )}
              </div>
              <div><p className="text-xs text-muted-foreground">Allowances</p><p className="font-semibold">₹{Number(currentQ.data.allowances).toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Deductions</p><p className="font-semibold">₹{Number(currentQ.data.deductions).toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Net Pay</p><p className="font-semibold">₹{Number(currentQ.data.net_pay).toLocaleString()}</p></div>
              <div className="col-span-2 sm:col-span-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={currentQ.data.status ? (statusColors[currentQ.data.status] ?? "") : "bg-muted text-muted-foreground"}>
                  {currentQ.data.status ?? "—"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 && !historyQ.isLoading ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No salary records found for the selected year.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Slip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.month}</TableCell>
                    <TableCell>{r.year}</TableCell>
                    <TableCell>₹{Number(r.gross).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(r.net).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[r.status] ?? ""}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={r.status === "draft" || downloadingId !== null}
                        onClick={() => handleDownload(r.id)}
                        title={r.status === "draft" ? "Available only for approved/paid" : "Download PDF"}
                      >
                        {downloadingId === r.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" /> Download
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
