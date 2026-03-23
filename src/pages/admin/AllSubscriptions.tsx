import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportSubscriptionsCsv, fetchAdminSubscriptions } from "@/lib/admin-api/subscriptions";
import { Search, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  active: "bg-success text-success-foreground",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function AllSubscriptions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "subscriptions", search, statusFilter, paymentFilter],
    queryFn: () =>
      fetchAdminSubscriptions({
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        payment_mode: paymentFilter === "all" ? undefined : paymentFilter.toLowerCase(),
      }),
  });

  const rows = data?.results ?? [];

  const exportMut = useMutation({
    mutationFn: () =>
      exportSubscriptionsCsv({
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        payment_mode: paymentFilter === "all" ? undefined : paymentFilter.toLowerCase(),
      }),
    onSuccess: () => toast({ title: "Export started", description: "Check your downloads" }),
    onError: (e: Error) => toast({ title: "Export failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Subscriptions</h1>
          <p className="text-muted-foreground text-sm mt-1">System-wide subscription ledger</p>
        </div>
        <Button variant="outline" onClick={() => exportMut.mutate()} disabled={exportMut.isPending} className="gap-2">
          {exportMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export CSV
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="netbanking">Netbanking</SelectItem>
              </SelectContent>
            </Select>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Matri ID</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.customer}</TableCell>
                  <TableCell className="font-mono text-xs">{s.matri_id}</TableCell>
                  <TableCell>{s.plan}</TableCell>
                  <TableCell>₹{Number(s.amount).toLocaleString()}</TableCell>
                  <TableCell>{s.payment_mode}</TableCell>
                  <TableCell>{s.staff}</TableCell>
                  <TableCell>{s.branch}</TableCell>
                  <TableCell className="text-xs">
                    {s.start_date} → {s.expiry_date}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[s.status] ?? ""}>{s.status}</Badge>
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
