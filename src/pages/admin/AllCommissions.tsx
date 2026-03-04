import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { commissions as initialCommissions } from "@/data/mockData";
import { Search, Download, CheckSquare, Wallet, Eye, XCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  approved: "bg-info text-info-foreground",
  paid: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function AllCommissions() {
  const [comms, setComms] = useState(initialCommissions);
  const [selected, setSelected] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewSale, setViewSale] = useState<typeof initialCommissions[0] | null>(null);
  const { toast } = useToast();

  const filtered = comms.filter((c) => {
    const matchSearch = c.staff.toLowerCase().includes(search.toLowerCase()) || c.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleSelect = (id: number) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const selectAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((c) => c.id));

  const bulkAction = (action: "approved" | "paid") => {
    setComms((prev) => prev.map((c) => selected.includes(c.id) ? { ...c, status: action as any } : c));
    toast({ title: `${selected.length} commissions ${action}` });
    setSelected([]);
  };

  const singleAction = (id: number, action: "approved" | "paid" | "cancelled") => {
    setComms(prev => prev.map(c => c.id === id ? { ...c, status: action as any } : c));
    toast({ title: `Commission #${id} ${action}` });
  };

  const exportSingle = (c: typeof initialCommissions[0]) => {
    const csv = `Date,Staff,Branch,Customer,Plan,Sale Amount,Rate,Commission,Status\n${c.date},${c.staff},${c.branch},${c.customer},${c.plan},${c.saleAmount},${c.rate}%,${c.commission},${c.status}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `commission-${c.id}.csv`; a.click();
    toast({ title: "Exported" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Commissions</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage staff commissions</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <>
              <Button variant="outline" onClick={() => bulkAction("approved")} className="gap-2"><CheckSquare className="h-4 w-4" /> Approve ({selected.length})</Button>
              <Button onClick={() => bulkAction("paid")} className="gap-2"><Wallet className="h-4 w-4" /> Mark Paid ({selected.length})</Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Pending", value: `₹${comms.filter((c) => c.status === "pending").reduce((s, c) => s + c.commission, 0).toLocaleString()}`, color: "text-warning" },
          { label: "Approved", value: `₹${comms.filter((c) => c.status === "approved").reduce((s, c) => s + c.commission, 0).toLocaleString()}`, color: "text-info" },
          { label: "Paid", value: `₹${comms.filter((c) => c.status === "paid").reduce((s, c) => s + c.commission, 0).toLocaleString()}`, color: "text-success" },
          { label: "Total", value: `₹${comms.reduce((s, c) => s + c.commission, 0).toLocaleString()}`, color: "text-primary" },
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
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={selectAll} /></TableHead>
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
                  <TableCell><Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggleSelect(c.id)} /></TableCell>
                  <TableCell>{c.date}</TableCell>
                  <TableCell className="font-medium">{c.staff}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{c.branch}</Badge></TableCell>
                  <TableCell>{c.customer}</TableCell>
                  <TableCell>{c.plan}</TableCell>
                  <TableCell>₹{c.saleAmount.toLocaleString()}</TableCell>
                  <TableCell>{c.rate}%</TableCell>
                  <TableCell className="font-semibold">₹{c.commission.toLocaleString()}</TableCell>
                  <TableCell><Badge className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="View Sale" onClick={() => setViewSale(c)}>
                        <Eye className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      {c.status === "pending" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Approve" onClick={() => singleAction(c.id, "approved")}>
                          <CheckSquare className="h-3.5 w-3.5 text-info" />
                        </Button>
                      )}
                      {(c.status === "pending" || c.status === "approved") && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Mark Paid" onClick={() => singleAction(c.id, "paid")}>
                          <Wallet className="h-3.5 w-3.5 text-success" />
                        </Button>
                      )}
                      {c.status !== "cancelled" && c.status !== "paid" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Cancel" onClick={() => singleAction(c.id, "cancelled")}>
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Export" onClick={() => exportSingle(c)}>
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Sale Dialog */}
      <Dialog open={!!viewSale} onOpenChange={() => setViewSale(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Sale Details — Commission #{viewSale?.id}</DialogTitle></DialogHeader>
          {viewSale && (
            <div className="grid gap-2 text-sm">
              {[
                { l: "Date", v: viewSale.date },
                { l: "Staff", v: viewSale.staff },
                { l: "Branch", v: viewSale.branch },
                { l: "Customer", v: viewSale.customer },
                { l: "Plan", v: viewSale.plan },
                { l: "Sale Amount", v: `₹${viewSale.saleAmount.toLocaleString()}` },
                { l: "Commission Rate", v: `${viewSale.rate}%` },
                { l: "Commission", v: `₹${viewSale.commission.toLocaleString()}` },
                { l: "Status", v: viewSale.status },
              ].map(r => (
                <div key={r.l} className="flex justify-between border-b border-border/50 pb-1">
                  <span className="text-muted-foreground">{r.l}</span>
                  <span className="font-medium">{r.v}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSale(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
