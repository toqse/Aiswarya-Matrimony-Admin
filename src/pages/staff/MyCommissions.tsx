import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { commissions as initialCommissions, revenueData } from "@/data/mockData";
import {
  Search, Download, Wallet, Clock, CheckCircle2, XCircle, Eye
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  approved: "bg-info text-info-foreground",
  paid: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function MyCommissions() {
  const staffName = "Anitha Lakshmi";
  const myComms = initialCommissions.filter((c) => c.staff === staffName);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const { toast } = useToast();

  const filtered = myComms.filter((c) => {
    const matchSearch = c.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchPlan = planFilter === "all" || c.plan === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  const totalPending = myComms.filter(c => c.status === "pending").reduce((s, c) => s + c.commission, 0);
  const totalApproved = myComms.filter(c => c.status === "approved").reduce((s, c) => s + c.commission, 0);
  const totalPaid = myComms.filter(c => c.status === "paid").reduce((s, c) => s + c.commission, 0);
  const totalAll = myComms.reduce((s, c) => s + c.commission, 0);

  const commissionByMonth = revenueData.map((d) => ({
    month: d.month,
    commission: Math.round(d.revenue * 0.08),
  }));

  const uniquePlans = [...new Set(myComms.map(c => c.plan))];

  const exportData = () => {
    const header = "Date,Customer,Plan,Sale Amount,Rate %,Commission,Status\n";
    const rows = filtered.map(c => `${c.date},${c.customer},${c.plan},${c.saleAmount},${c.rate},${c.commission},${c.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "my-commissions.csv"; a.click();
    toast({ title: "Exported", description: "Commission statement downloaded" });
  };

  const summaryCards = [
    { label: "Pending", value: `₹${totalPending.toLocaleString()}`, icon: Clock, color: "text-warning" },
    { label: "Approved", value: `₹${totalApproved.toLocaleString()}`, icon: CheckCircle2, color: "text-info" },
    { label: "Paid", value: `₹${totalPaid.toLocaleString()}`, icon: Wallet, color: "text-success" },
    { label: "Total", value: `₹${totalAll.toLocaleString()}`, icon: Wallet, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Commissions</h1>
          <p className="text-muted-foreground text-sm mt-1">Detailed commission records for {staffName}</p>
        </div>
        <Button variant="outline" onClick={exportData} className="gap-2">
          <Download className="h-4 w-4" /> Export PDF/CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Commission Chart */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Monthly Commission (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={commissionByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Commission"]} />
              <Bar dataKey="commission" fill="hsl(40, 100%, 58%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Commission Table with Filters */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {uniquePlans.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Sale Amount</TableHead>
                <TableHead>Rate %</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.date}</TableCell>
                  <TableCell className="font-medium">{c.customer}</TableCell>
                  <TableCell><Badge className="bg-accent text-accent-foreground">{c.plan}</Badge></TableCell>
                  <TableCell>₹{c.saleAmount.toLocaleString()}</TableCell>
                  <TableCell>{c.rate}%</TableCell>
                  <TableCell className="font-bold">₹{c.commission.toLocaleString()}</TableCell>
                  <TableCell><Badge className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                      onClick={() => toast({ title: "Details", description: `Commission #${c.id}: ${c.customer} — ${c.plan} — ₹${c.commission}` })}>
                      <Eye className="h-3 w-3" /> View
                    </Button>
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
