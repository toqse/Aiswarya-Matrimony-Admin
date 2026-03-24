import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchStaffCommissions } from "@/lib/admin-api/scoped";
import { Search, Wallet, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import { exportMyBranchCommissions, fetchMyBranchCommissionSummary, fetchMyBranchCommissions } from "@/lib/admin-api/commissions";

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  approved: "bg-info text-info-foreground",
  paid: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function MyCommissions() {
  const { role } = useRole();
  const isBranchManager = role === "branch-manager";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: [isBranchManager ? "branch" : "staff", "commissions", search, statusFilter],
    queryFn: () =>
      isBranchManager
        ? fetchMyBranchCommissions({
            search: search.trim() || undefined,
            status: statusFilter === "all" ? undefined : statusFilter,
          })
        : fetchStaffCommissions({
            search: search.trim() || undefined,
            status: statusFilter === "all" ? undefined : statusFilter,
          }),
  });

  const branchSummaryQ = useQuery({
    queryKey: ["branch", "my-commissions", "summary"],
    queryFn: () => fetchMyBranchCommissionSummary(),
    enabled: isBranchManager,
  });

  const summary = isBranchManager ? branchSummaryQ.data : data?.summary;
  const rows = data?.results ?? [];
  const getAmount = (c: Record<string, unknown>) => Number(c.amount ?? c.sale_amount ?? 0);
  const getCommission = (c: Record<string, unknown>) => Number(c.commission ?? 0);
  const getRate = (c: Record<string, unknown>) => Number(c.rate ?? 0);

  const summaryCards = [
    {
      label: "Pending",
      value: summary ? `₹${Number(isBranchManager ? (summary as { pending: number }).pending : (summary as { total_pending: number }).total_pending).toLocaleString()}` : "—",
      icon: Clock,
      color: "text-warning",
    },
    { label: "Approved", value: summary ? `₹${Number(summary.approved).toLocaleString()}` : "—", icon: CheckCircle2, color: "text-info" },
    { label: "Paid", value: summary ? `₹${Number(summary.paid).toLocaleString()}` : "—", icon: Wallet, color: "text-success" },
    {
      label: "Total",
      value: summary ? `₹${Number(isBranchManager ? (summary as { total: number }).total : (summary as { grand_total: number }).grand_total).toLocaleString()}` : "—",
      icon: Wallet,
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Commissions</h1>
          <p className="text-muted-foreground text-sm mt-1">Your commission ledger</p>
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className={`h-8 w-8 ${k.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.date}</TableCell>
                  <TableCell>{c.customer}</TableCell>
                  <TableCell>{c.plan}</TableCell>
                  <TableCell>₹{getAmount(c as Record<string, unknown>).toLocaleString()}</TableCell>
                  <TableCell>₹{getCommission(c as Record<string, unknown>).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[c.status]}>{c.status}</Badge>
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
