import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  approveCommission,
  bulkApproveCommissions,
  cancelCommission,
  downloadCommissionSlip,
  fetchCommissions,
  markCommissionPaid,
  type CommissionRow,
} from "@/lib/admin-api/commissions";
import { Search, CheckSquare, Wallet, Eye, XCircle, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  approved: "bg-info text-info-foreground",
  paid: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function AllCommissions() {
  const [selected, setSelected] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("20");
  const [viewSale, setViewSale] = useState<CommissionRow | null>(null);
  const [pendingAction, setPendingAction] = useState<
    | { kind: "approve" | "paid" | "cancel" | "slip"; row: CommissionRow }
    | { kind: "bulkApprove"; count: number }
    | null
  >(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "commissions", search, statusFilter, page, pageSize],
    queryFn: () =>
      fetchCommissions({
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: String(page),
        page_size: pageSize,
      }),
  });

  const summary = data?.summary;
  const filtered = data?.results ?? [];
  const total = data?.count ?? 0;
  const canPrev = Boolean(data?.previous) && page > 1;
  const canNext = Boolean(data?.next);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "commissions"] });

  const bulkApproveMut = useMutation({
    mutationFn: () => bulkApproveCommissions(selected),
    onSuccess: (r) => {
      toast({ title: "Bulk approve", description: `Approved ${r.approved_count}` });
      setSelected([]);
      setPendingAction(null);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => approveCommission(id),
    onSuccess: () => {
      toast({ title: "Approved" });
      setPendingAction(null);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const paidMut = useMutation({
    mutationFn: (id: number) => markCommissionPaid(id),
    onSuccess: () => {
      toast({ title: "Marked paid" });
      setPendingAction(null);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelMut = useMutation({
    mutationFn: (id: number) => cancelCommission(id),
    onSuccess: () => {
      toast({ title: "Cancelled" });
      setPendingAction(null);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const slipMut = useMutation({
    mutationFn: (id: number) => downloadCommissionSlip(id),
    onSuccess: () => {
      setPendingAction(null);
    },
    onError: (e: Error) => toast({ title: "Download failed", description: e.message, variant: "destructive" }),
  });

  const toggleSelect = (id: number) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const selectAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((c) => c.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Commissions</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage staff commissions</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setPendingAction({ kind: "bulkApprove", count: selected.length })}
              disabled={bulkApproveMut.isPending}
              className="gap-2"
            >
              {bulkApproveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />} Approve ({selected.length})
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Pending", value: summary ? `₹${Number(summary.total_pending).toLocaleString()}` : "—", color: "text-warning" },
          { label: "Approved", value: summary ? `₹${Number(summary.approved).toLocaleString()}` : "—", color: "text-info" },
          { label: "Paid", value: summary ? `₹${Number(summary.paid).toLocaleString()}` : "—", color: "text-success" },
          { label: "Grand Total", value: summary ? `₹${Number(summary.grand_total).toLocaleString()}` : "—", color: "text-primary" },
        ].map((c) => (
          <Card key={c.label} className="shadow-elegant border-0">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <div className="p-4 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setPage(1);
                setStatusFilter(v);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onCheckedChange={selectAll}
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Sale Amt</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                  </TableCell>
                  <TableCell>{c.date}</TableCell>
                  <TableCell className="font-medium">{c.staff}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {c.branch}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.customer}</TableCell>
                  <TableCell>{c.plan}</TableCell>
                  <TableCell>₹{Number(c.amount).toLocaleString()}</TableCell>
                  <TableCell>{c.rate}%</TableCell>
                  <TableCell className="font-semibold">₹{Number(c.commission).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[c.status]}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => setViewSale(c)}>
                        <Eye className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      {c.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Approve"
                          onClick={() => setPendingAction({ kind: "approve", row: c })}
                        >
                          <CheckSquare className="h-3.5 w-3.5 text-info" />
                        </Button>
                      )}
                      {c.status === "approved" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Mark Paid"
                          onClick={() => setPendingAction({ kind: "paid", row: c })}
                        >
                          <Wallet className="h-3.5 w-3.5 text-success" />
                        </Button>
                      )}
                      {c.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Cancel"
                          onClick={() => setPendingAction({ kind: "cancel", row: c })}
                        >
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                      {/* <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Slip PDF"
                        onClick={() => setPendingAction({ kind: "slip", row: c })}
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button> */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {total} records
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={pageSize}
                onValueChange={(v) => {
                  setPage(1);
                  setPageSize(v);
                }}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
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

      <Dialog open={!!viewSale} onOpenChange={() => setViewSale(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Commission #{viewSale?.id}</DialogTitle>
          </DialogHeader>
          {viewSale && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{viewSale.date || "—"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={statusColors[viewSale.status] ?? "bg-muted text-muted-foreground"}>{viewSale.status}</Badge>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Staff</p>
                  <p className="font-medium">{viewSale.staff || "—"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <p className="font-medium">{viewSale.branch || "—"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{viewSale.customer || "—"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Matrimony ID</p>
                  <p className="font-medium">{viewSale.matri_id || "—"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="font-medium">{viewSale.plan || "—"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Rate</p>
                  <p className="font-medium">{viewSale.rate}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-md border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground">Sale Amount</p>
                  <p className="font-semibold">₹{Number(viewSale.amount).toLocaleString()}</p>
                </div>
                <div className="rounded-md border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground">Commission</p>
                  <p className="font-semibold">₹{Number(viewSale.commission).toLocaleString()}</p>
                </div>
                <div className="rounded-md border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground">Paid Date</p>
                  <p className="font-semibold">{viewSale.paid_date || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingAction != null} onOpenChange={(o) => !o && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.kind === "bulkApprove" && "Approve selected commissions?"}
              {pendingAction?.kind === "approve" && "Approve this commission?"}
              {pendingAction?.kind === "paid" && "Mark this commission as paid?"}
              {pendingAction?.kind === "cancel" && "Cancel this commission?"}
              {pendingAction?.kind === "slip" && "Download commission slip?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.kind === "bulkApprove" &&
                `This will approve ${pendingAction.count} selected commission${pendingAction.count > 1 ? "s" : ""}.`}
              {pendingAction?.kind === "approve" && `Staff: ${pendingAction.row.staff} · Customer: ${pendingAction.row.customer}`}
              {pendingAction?.kind === "paid" && `Staff: ${pendingAction.row.staff} · Commission: ₹${Number(pendingAction.row.commission).toLocaleString()}`}
              {pendingAction?.kind === "cancel" && `This action will cancel commission #${pendingAction.row.id}.`}
              {pendingAction?.kind === "slip" && `Download PDF slip for commission #${pendingAction.row.id}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingAction) return;
                if (pendingAction.kind === "bulkApprove") bulkApproveMut.mutate();
                if (pendingAction.kind === "approve") approveMut.mutate(pendingAction.row.id);
                if (pendingAction.kind === "paid") paidMut.mutate(pendingAction.row.id);
                if (pendingAction.kind === "cancel") cancelMut.mutate(pendingAction.row.id);
                if (pendingAction.kind === "slip") slipMut.mutate(pendingAction.row.id);
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
