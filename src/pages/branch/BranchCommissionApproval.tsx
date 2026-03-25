import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  approveBranchCommission,
  bulkApproveBranchCommissions,
  cancelBranchCommission,
  downloadBranchCommissionSlip,
  fetchBranchCommissionDetail,
  fetchBranchCommissionSummary,
  fetchBranchCommissions,
} from "@/lib/admin-api/commissions";
import { Check, Eye, FileText, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BranchCommissionApproval() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [staffId, setStaffId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [detailId, setDetailId] = useState<number | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const summaryQ = useQuery({
    queryKey: ["branch", "commissions", "summary"],
    queryFn: () => fetchBranchCommissionSummary(),
  });
  const listQ = useQuery({
    queryKey: ["branch", "commissions", "list", status, search, staffId, branchId],
    queryFn: () =>
      fetchBranchCommissions({
        status: status === "all" ? undefined : status,
        search: search.trim() || undefined,
        staff_id: staffId.trim() || undefined,
        branch_id: branchId.trim() || undefined,
        page: "1",
        page_size: "100",
      }),
  });

  const detailQ = useQuery({
    queryKey: ["branch", "commissions", "detail", detailId],
    queryFn: () => fetchBranchCommissionDetail(detailId as number),
    enabled: detailId != null,
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => approveBranchCommission(id),
    onSuccess: () => {
      toast({ title: "Approved" });
      qc.invalidateQueries({ queryKey: ["branch", "commissions"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelMut = useMutation({
    mutationFn: (id: number) => cancelBranchCommission(id),
    onSuccess: () => {
      toast({ title: "Cancelled" });
      qc.invalidateQueries({ queryKey: ["branch", "commissions"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const bulkMut = useMutation({
    mutationFn: () => bulkApproveBranchCommissions(selected),
    onSuccess: (r) => {
      toast({ title: "Bulk approve complete", description: `Approved ${r.approved_count}` });
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["branch", "commissions"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const slipMut = useMutation({
    mutationFn: (id: number) => downloadBranchCommissionSlip(id),
    onError: (e: Error) => toast({ title: "Slip download failed", description: e.message, variant: "destructive" }),
  });

  const rows = listQ.data?.results ?? [];
  const toggle = (id: number) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commission Approval</h1>
        <p className="text-muted-foreground text-sm mt-1">Branch manager scoped commission actions</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold">₹{Number(summaryQ.data?.total_pending ?? 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Approved</p><p className="text-xl font-bold">₹{Number(summaryQ.data?.approved ?? 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Paid</p><p className="text-xl font-bold">₹{Number(summaryQ.data?.paid ?? 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">₹{Number(summaryQ.data?.total ?? 0).toLocaleString()}</p></CardContent></Card>
      </div>

      <Card className="shadow-elegant border-0">
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="max-w-sm" />
            <Input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="staff_id" className="w-28" />
            <Input value={branchId} onChange={(e) => setBranchId(e.target.value)} placeholder="branch_id" className="w-28" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => bulkMut.mutate()} disabled={!selected.length || bulkMut.isPending}>Bulk approve ({selected.length})</Button>
            {(listQ.isLoading || summaryQ.isLoading) && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggle(r.id)} /></TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.staff}</TableCell>
                  <TableCell>{r.customer}</TableCell>
                  <TableCell>₹{Number(r.commission).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                  <TableCell className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="View"
                      aria-label="View"
                      className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 hover:text-purple-700"
                      onClick={() => setDetailId(r.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {r.status.toLowerCase() === "pending" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Approve"
                        aria-label="Approve"
                        className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:text-emerald-700"
                        onClick={() => approveMut.mutate(r.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {r.status.toLowerCase() === "pending" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Cancel"
                        aria-label="Cancel"
                        className="h-8 w-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700"
                        onClick={() => cancelMut.mutate(r.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Slip"
                      aria-label="Slip"
                      className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700"
                      onClick={() => slipMut.mutate(r.id)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailId != null} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commission Detail</DialogTitle>
          </DialogHeader>
          {detailQ.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {detailQ.data && (
            <div className="text-sm space-y-1">
              <p><b>ID:</b> {detailQ.data.id}</p>
              <p><b>Date:</b> {detailQ.data.date}</p>
              <p><b>Staff:</b> {detailQ.data.staff}</p>
              <p><b>Branch:</b> {detailQ.data.branch}</p>
              <p><b>Customer:</b> {detailQ.data.customer}</p>
              <p><b>Matri ID:</b> {detailQ.data.matri_id}</p>
              <p><b>Plan:</b> {detailQ.data.plan}</p>
              <p><b>Amount:</b> {detailQ.data.amount}</p>
              <p><b>Rate:</b> {detailQ.data.rate}</p>
              <p><b>Commission:</b> {detailQ.data.commission}</p>
              <p><b>Status:</b> {detailQ.data.status}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
