import { useState, type ComponentType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpRight,
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  Smartphone,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPaymentDetail,
  fetchPayments,
  fetchPaymentsSummary,
  rejectPayment,
  type PaymentListRow,
  type PaymentMode,
  type PaymentStatus,
  verifyPayment,
} from "@/lib/admin-api/payments";

const modeConfig: Record<
  PaymentMode,
  {
    label: string;
    icon: ComponentType<{ className?: string }>;
    color: string;
    dot: string;
  }
> = {
  cash: {
    label: "Cash",
    icon: Banknote,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  upi: {
    label: "UPI",
    icon: Smartphone,
    color: "bg-violet-100 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
  card: {
    label: "Card",
    icon: CreditCard,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  netbanking: {
    label: "Netbanking",
    icon: CreditCard,
    color: "bg-sky-100 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
};

function formatMoney(value: number | string) {
  const n = typeof value === "number" ? value : Number(value || 0);
  return `₹${n.toLocaleString()}`;
}

/** Table date/time: use `created_at` when present; else date from filter + API `time`. */
function paymentRowDateTime(row: PaymentListRow, dateFilterYmd: string) {
  if (row.created_at) {
    const d = new Date(row.created_at);
    if (!Number.isNaN(d.getTime())) {
      return {
        dateLine: d.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        timeLine: d.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };
    }
  }
  if (dateFilterYmd) {
    const d = new Date(`${dateFilterYmd}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return {
        dateLine: d.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        timeLine: row.time,
      };
    }
  }
  return { dateLine: null as string | null, timeLine: row.time };
}

function paymentRowDateOnly(row: PaymentListRow, dateFilterYmd: string) {
  const { dateLine } = paymentRowDateTime(row, dateFilterYmd);
  return dateLine ?? "—";
}

export default function CashPayments() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [modeFilter, setModeFilter] = useState<"all" | PaymentMode>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [branchIdFilter, setBranchIdFilter] = useState("");
  const [staffIdFilter, setStaffIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const queryParams = {
    mode: modeFilter === "all" ? undefined : modeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchTerm.trim() || undefined,
    date: dateFilter || undefined,
    branch_id: branchIdFilter ? Number(branchIdFilter) : undefined,
    staff_id: staffIdFilter ? Number(staffIdFilter) : undefined,
    page,
    page_size: 20,
  };

  const listQuery = useQuery({
    queryKey: ["admin", "payments", queryParams],
    queryFn: () => fetchPayments(queryParams),
  });

  const summaryQuery = useQuery({
    queryKey: ["admin", "payments", "summary", queryParams],
    queryFn: () => fetchPaymentsSummary(queryParams),
  });

  const detailQuery = useQuery({
    queryKey: ["admin", "payments", "detail", selectedId],
    queryFn: () => fetchPaymentDetail(selectedId as number),
    enabled: detailOpen && selectedId != null,
  });

  const verifyMut = useMutation({
    mutationFn: (id: number) => verifyPayment(id),
    onSuccess: () => {
      toast({ title: "Payment verified" });
      qc.invalidateQueries({ queryKey: ["admin", "payments"] });
    },
    onError: (e: Error) =>
      toast({
        title: "Verify failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectPayment(id, reason),
    onSuccess: () => {
      toast({ title: "Payment rejected" });
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["admin", "payments"] });
    },
    onError: (e: Error) =>
      toast({
        title: "Reject failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  const rows = listQuery.data?.results ?? [];
  const totalCount = listQuery.data?.count ?? 0;
  const canPrev = Boolean(listQuery.data?.previous) && page > 1;
  const canNext = Boolean(listQuery.data?.next);
  const summary = summaryQuery.data;
  const selectedTxn = detailQuery.data;

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "payments"] });
    toast({ title: "Refreshing payment data..." });
  };

  const handleExportCsv = () => {
    const header =
      "Receipt ID,Customer,Matri ID,Plan,Amount,Mode,Branch,Staff,Date,Time,Status\n";
    const body = rows
      .map((t) => {
        const { dateLine, timeLine } = paymentRowDateTime(t, dateFilter);
        const dateCol = dateLine ?? "";
        return [
          t.receipt_txn_id,
          t.customer_name,
          t.matri_id,
          t.plan,
          t.amount,
          t.mode,
          t.branch,
          t.staff,
          dateCol,
          timeLine,
          t.status,
        ]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(",");
      })
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDetails = (txn: PaymentListRow) => {
    setSelectedId(txn.id);
    setRejectReason("");
    setDetailOpen(true);
  };

  const kpis = [
    {
      label: "Cash Payments",
      value: formatMoney(summary?.cash_payments.total ?? 0),
      sub: `${summary?.cash_payments.count ?? 0} transactions`,
      growth: `${(summary?.cash_payments.growth_percent ?? 0) >= 0 ? "+" : ""}${(summary?.cash_payments.growth_percent ?? 0).toFixed(2)}%`,
      icon: Banknote,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      label: "UPI Payments",
      value: formatMoney(summary?.upi_payments.total ?? 0),
      sub: `${summary?.upi_payments.count ?? 0} transactions`,
      growth: `${(summary?.upi_payments.growth_percent ?? 0) >= 0 ? "+" : ""}${(summary?.upi_payments.growth_percent ?? 0).toFixed(2)}%`,
      icon: Smartphone,
      gradient: "from-violet-500 to-violet-600",
    },
    {
      label: "Card Payments",
      value: formatMoney(summary?.card_payments.total ?? 0),
      sub: `${summary?.card_payments.count ?? 0} transactions`,
      growth: `${(summary?.card_payments.growth_percent ?? 0) >= 0 ? "+" : ""}${(summary?.card_payments.growth_percent ?? 0).toFixed(2)}%`,
      icon: CreditCard,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Total Revenue",
      value: formatMoney(summary?.total_revenue.total ?? 0),
      sub: `${summary?.total_revenue.count ?? 0} transactions`,
      growth: `${(summary?.total_revenue.growth_percent ?? 0) >= 0 ? "+" : ""}${(summary?.total_revenue.growth_percent ?? 0).toFixed(2)}%`,
      icon: TrendingUp,
      gradient: "from-primary to-primary/80",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Payment Control Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated:{" "}
            {summary?.last_updated
              ? new Date(summary.last_updated).toLocaleTimeString()
              : "--:--:--"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleRefresh}
          >
            {listQuery.isFetching || summaryQuery.isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}{" "}
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleExportCsv}
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled>
            <FileText className="h-3.5 w-3.5" /> PDF Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="shadow-elegant border-0 overflow-hidden"
          >
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className={`w-1.5 bg-gradient-to-b ${kpi.gradient}`} />
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {kpi.label}
                    </p>
                    <kpi.icon className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {kpi.value}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      {kpi.sub}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" />
                      {kpi.growth}
                    </span>
                  </div>
                  <Badge variant="outline" className="mt-2 text-[10px]">
                    {dateFilter ? "Selected date vs previous day" : "Today vs previous day"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Search className="h-4 w-4" /> Filters:
            </div>
            <Select
              value={modeFilter}
              onValueChange={(v) => {
                setPage(1);
                setModeFilter(v as "all" | PaymentMode);
              }}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="netbanking">Netbanking</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setPage(1);
                setStatusFilter(v as "all" | PaymentStatus);
              }}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Branch ID</Label>
              <Input
                value={branchIdFilter}
                onChange={(e) => {
                  setPage(1);
                  setBranchIdFilter(e.target.value.replace(/\D/g, ""));
                }}
                placeholder="all"
                className="w-20 h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Staff ID</Label>
              <Input
                value={staffIdFilter}
                onChange={(e) => {
                  setPage(1);
                  setStaffIdFilter(e.target.value.replace(/\D/g, ""));
                }}
                placeholder="all"
                className="w-20 h-8 text-xs"
              />
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setPage(1);
                setDateFilter(e.target.value);
              }}
              className="w-40 h-8 text-xs"
            />
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search receipt, customer, or matri ID..."
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="pl-9 h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> All Transactions (
              {rows.length})
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {totalCount} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Receipt/TXN ID</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Plan</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Mode</TableHead>
                <TableHead className="text-xs">Branch</TableHead>
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const mc = modeConfig[t.mode];
                const dateOnly = paymentRowDateOnly(t, dateFilter);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {t.receipt_txn_id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{t.customer_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {t.matri_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{t.plan}</TableCell>
                    <TableCell className="font-bold text-sm">
                      {formatMoney(t.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] gap-1 ${mc.color}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${mc.dot}`}
                        />
                        {mc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{t.branch}</TableCell>
                    <TableCell className="text-xs">{t.staff}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {dateOnly}
                    </TableCell>
                    <TableCell>
                      {t.status === "verified" && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] gap-1">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </Badge>
                      )}
                      {t.status === "pending" && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] gap-1">
                          <Clock className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                      {t.status === "rejected" && (
                        <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] gap-1">
                          <XCircle className="h-3 w-3" /> Rejected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => openDetails(t)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && !listQuery.isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-sm text-muted-foreground py-8"
                  >
                    No payments found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4 pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Showing {rows.length} of {totalCount} transactions
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!canNext}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTxn &&
                (() => {
                  const Icon = modeConfig[selectedTxn.mode].icon;
                  return <Icon className="h-5 w-5" />;
                })()}
              Payment Details
            </DialogTitle>
          </DialogHeader>

          {detailQuery.isLoading && (
            <div className="py-8 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading payment
              details...
            </div>
          )}

          {selectedTxn && !detailQuery.isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">
                    Transaction Time
                  </span>
                  <p className="font-medium">{selectedTxn.time}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Receipt/TXN ID
                  </span>
                  <p className="font-mono font-semibold">
                    {selectedTxn.receipt_txn_id}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Customer
                  </span>
                  <p className="font-medium">{selectedTxn.customer_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Matri ID
                  </span>
                  <p className="font-mono">{selectedTxn.matri_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Plan</span>
                  <p className="font-medium">{selectedTxn.plan}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Amount</span>
                  <p className="font-bold text-lg">
                    {formatMoney(selectedTxn.amount)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Payment Mode
                  </span>
                  <Badge
                    variant="outline"
                    className={`${modeConfig[selectedTxn.mode].color} mt-0.5`}
                  >
                    {modeConfig[selectedTxn.mode].label}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Branch</span>
                  <p className="font-medium">{selectedTxn.branch}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Staff Member
                  </span>
                  <p className="font-medium">{selectedTxn.staff}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Payment Method
                  </span>
                  <p className="font-medium">{selectedTxn.payment_method}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Payment Status
                  </span>
                  <p className="font-medium">{selectedTxn.payment_status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Transaction Type
                  </span>
                  <p className="font-medium">{selectedTxn.transaction_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Created At
                  </span>
                  <p className="font-medium">
                    {new Date(selectedTxn.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedTxn.rejection_reason && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                  <p className="text-xs text-rose-700">Rejection Reason</p>
                  <p className="text-sm font-medium text-rose-800">
                    {selectedTxn.rejection_reason}
                  </p>
                </div>
              )}

              {selectedTxn.mode === "cash" &&
                selectedTxn.status === "pending" && (
                  <div className="space-y-2 border-t pt-3">
                    <Input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (required for reject)"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={rejectMut.isPending || !rejectReason.trim()}
                        onClick={() =>
                          rejectMut.mutate({
                            id: selectedTxn.id,
                            reason: rejectReason.trim(),
                          })
                        }
                      >
                        {rejectMut.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Reject"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        disabled={verifyMut.isPending}
                        onClick={() => verifyMut.mutate(selectedTxn.id)}
                      >
                        {verifyMut.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium">Overall Status</span>
                {selectedTxn.status === "verified" && (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Fully Verified
                  </Badge>
                )}
                {selectedTxn.status === "pending" && (
                  <Badge className="bg-amber-100 text-amber-700">
                    <Clock className="h-3.5 w-3.5 mr-1" /> Pending Verification
                  </Badge>
                )}
                {selectedTxn.status === "rejected" && (
                  <Badge className="bg-rose-100 text-rose-700">
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Rejected
                  </Badge>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
