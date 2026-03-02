import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { commissions as initialCommissions } from "@/data/mockData";
import { Search, Download, CheckSquare, Wallet } from "lucide-react";
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
        <CardHeader className="pb-3">
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={selectAll} /></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Sale Amt</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggleSelect(c.id)} /></TableCell>
                  <TableCell>{c.date}</TableCell>
                  <TableCell className="font-medium">{c.staff}</TableCell>
                  <TableCell>{c.customer}</TableCell>
                  <TableCell>{c.plan}</TableCell>
                  <TableCell>₹{c.saleAmount.toLocaleString()}</TableCell>
                  <TableCell>{c.rate}%</TableCell>
                  <TableCell className="font-semibold">₹{c.commission.toLocaleString()}</TableCell>
                  <TableCell><Badge className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
