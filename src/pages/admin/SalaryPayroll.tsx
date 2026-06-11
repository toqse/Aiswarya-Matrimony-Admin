import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  approvePayroll,
  downloadSalarySlip,
  fetchPayrollList,
  fetchPayrollSummary,
  generatePayroll,
  markPayrollPaid,
} from "@/lib/admin-api/payroll";
import {
  Download,
  CheckSquare,
  IndianRupee,
  Users,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-info text-info-foreground",
  paid: "bg-success text-success-foreground",
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function SalaryPayroll() {
  const [month, setMonth] = useState(currentMonth());
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [genMonth, setGenMonth] = useState(currentMonth());
  const [pendingAction, setPendingAction] = useState<
    | { kind: "generate"; month: string }
    | {
        kind: "approve" | "paid" | "slip";
        id: number;
        staff: string;
        month: string;
        amount: number;
      }
    | null
  >(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ["admin", "payroll", "summary", month],
    queryFn: () => fetchPayrollSummary({ month }),
  });

  const listQuery = useQuery({
    queryKey: ["admin", "payroll", "list", month],
    queryFn: () => fetchPayrollList({ month }),
  });

  const summary = summaryQuery.data;
  const records = listQuery.data?.results ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "payroll"] });
  };

  const genMut = useMutation({
    mutationFn: () => generatePayroll({ month: genMonth }),
    onSuccess: (r) => {
      const skipped = r.skipped_existing ?? 0;
      const description =
        r.records_created > 0
          ? `Added ${r.records_created} record(s) for ${r.month}${
              skipped > 0 ? `. ${skipped} already existed.` : ""
            }`
          : `All eligible staff already have records for ${r.month}.`;
      toast({
        title: r.records_created > 0 ? "Payroll updated" : "No new records",
        description,
      });
      setShowGenerateDialog(false);
      setPendingAction(null);
      invalidate();
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => approvePayroll(id),
    onSuccess: () => {
      toast({ title: "Approved" });
      setPendingAction(null);
      invalidate();
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const paidMut = useMutation({
    mutationFn: (id: number) => markPayrollPaid(id),
    onSuccess: () => {
      toast({ title: "Marked paid" });
      setPendingAction(null);
      invalidate();
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const slipMut = useMutation({
    mutationFn: (id: number) => downloadSalarySlip(id),
    onSuccess: () => {
      setPendingAction(null);
    },
    onError: (e: Error) =>
      toast({
        title: "Download failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  const kpis = [
    {
      label: "Total Net Payroll",
      value: summary
        ? `₹${Number(summary.total_net_payroll).toLocaleString()}`
        : "—",
      icon: IndianRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Gross",
      value: summary ? `₹${Number(summary.total_gross).toLocaleString()}` : "—",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Staff Count",
      value: summary?.staff_count ?? "—",
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Pending Drafts",
      value: summary?.pending_drafts ?? "—",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Salary & Payroll</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate, approve, and pay salaries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Month</Label>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-40"
          />
          <Button onClick={() => setShowGenerateDialog(true)}>
            Generate payroll
          </Button>
        </div>
      </div>

      {(summaryQuery.error || listQuery.error) && (
        <p className="text-destructive text-sm">
          {((summaryQuery.error || listQuery.error) as Error).message}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {kpis.map((c) => (
          <Card key={c.label} className="shadow-elegant border-0">
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center ${c.color}`}
              >
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle className="text-base">Payroll records</CardTitle>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.staff}</TableCell>
                  <TableCell>{r.branch}</TableCell>
                  <TableCell>{r.month}</TableCell>
                  <TableCell>₹{Number(r.net).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[r.status] ?? ""}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setPendingAction({
                              kind: "approve",
                              id: r.id,
                              staff: r.staff,
                              month: r.month,
                              amount: Number(r.net) || 0,
                            })
                          }
                          title="Approve"
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                      )}
                      {r.status === "approved" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setPendingAction({
                              kind: "paid",
                              id: r.id,
                              staff: r.staff,
                              month: r.month,
                              amount: Number(r.net) || 0,
                            })
                          }
                          title="Mark paid"
                        >
                          <IndianRupee className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setPendingAction({
                            kind: "slip",
                            id: r.id,
                            staff: r.staff,
                            month: r.month,
                            amount: Number(r.net) || 0,
                          })
                        }
                        title="Download slip"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate payroll</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Month (YYYY-MM)</Label>
            <Input
              type="month"
              value={genMonth}
              onChange={(e) => setGenMonth(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                setPendingAction({ kind: "generate", month: genMonth })
              }
              disabled={genMut.isPending}
            >
              {genMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Generate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingAction != null}
        onOpenChange={(o) => !o && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.kind === "generate" && "Generate payroll?"}
              {pendingAction?.kind === "approve" && "Approve payroll record?"}
              {pendingAction?.kind === "paid" && "Mark payroll as paid?"}
              {pendingAction?.kind === "slip" && "Download salary slip?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.kind === "generate" &&
                `This will generate payroll records for ${pendingAction.month}.`}
              {pendingAction?.kind === "approve" &&
                `Approve payroll for ${pendingAction.staff} (${pendingAction.month}) with net ₹${pendingAction.amount.toLocaleString()}.`}
              {pendingAction?.kind === "paid" &&
                `Mark payroll as paid for ${pendingAction.staff} (${pendingAction.month}) with net ₹${pendingAction.amount.toLocaleString()}.`}
              {pendingAction?.kind === "slip" &&
                `Download slip for ${pendingAction.staff} (${pendingAction.month}).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingAction) return;
                if (pendingAction.kind === "generate") genMut.mutate();
                if (pendingAction.kind === "approve")
                  approveMut.mutate(pendingAction.id);
                if (pendingAction.kind === "paid")
                  paidMut.mutate(pendingAction.id);
                if (pendingAction.kind === "slip")
                  slipMut.mutate(pendingAction.id);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
