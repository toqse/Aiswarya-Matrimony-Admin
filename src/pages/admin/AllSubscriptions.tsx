import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subscriptions as initialSubs } from "@/data/mockData";
import { Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  active: "bg-success text-success-foreground",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function AllSubscriptions() {
  const [subs] = useState(initialSubs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const { toast } = useToast();

  const filtered = subs.filter((s) => {
    const matchSearch = s.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchPayment = paymentFilter === "all" || s.paymentMode === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  const exportCSV = () => {
    const header = "Customer,Plan,Amount,Payment Mode,Staff,Branch,Start,Expiry,Status\n";
    const rows = filtered.map((s) => `${s.customer},${s.plan},${s.amount},${s.paymentMode},${s.staff},${s.branch},${s.startDate},${s.expiryDate},${s.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "subscriptions.csv"; a.click();
    toast({ title: "Exported", description: "CSV downloaded" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Subscriptions</h1>
          <p className="text-muted-foreground text-sm mt-1">System-wide subscription ledger</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Netbanking">Netbanking</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.customer}</TableCell>
                  <TableCell>{s.plan}</TableCell>
                  <TableCell>₹{s.amount.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{s.paymentMode}</Badge></TableCell>
                  <TableCell>{s.staff}</TableCell>
                  <TableCell>{s.branch}</TableCell>
                  <TableCell>{s.startDate}</TableCell>
                  <TableCell>{s.expiryDate}</TableCell>
                  <TableCell><Badge className={statusColors[s.status]}>{s.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
