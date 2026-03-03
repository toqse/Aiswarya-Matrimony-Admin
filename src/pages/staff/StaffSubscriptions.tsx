import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { subscriptions as initialSubs, subscriptionPlans, profiles } from "@/data/mockData";
import {
  Search, Plus, RefreshCw, AlertTriangle, CreditCard, Download,
  CheckCircle2, Clock, XCircle, TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  active: "bg-success text-success-foreground",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function StaffSubscriptions() {
  const staffName = "Anitha Lakshmi";
  const [subs, setSubs] = useState(initialSubs.filter(s => s.staff === staffName));
  const [allSubs, setAllSubs] = useState<any[]>(initialSubs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddSub, setShowAddSub] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState<typeof subs[0] | null>(null);
  const [newSub, setNewSub] = useState({ customer: "", plan: "", paymentMode: "Cash" as const });
  const { toast } = useToast();

  const mySubs = allSubs.filter(s => s.staff === staffName);
  const filtered = mySubs.filter((s) => {
    const matchSearch = s.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Expiry alerts — subscriptions expiring in next 30 days
  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 86400000);
  const expiringSoon = mySubs.filter((s) => {
    const exp = new Date(s.expiryDate);
    return s.status === "active" && exp >= today && exp <= in30Days;
  });

  const activePlans = subscriptionPlans.filter(p => p.status === "active");

  const selectedPlan = activePlans.find(p => p.name === newSub.plan);
  const autoCommission = selectedPlan ? Math.round(selectedPlan.price * 0.1) : 0;

  const addSubscription = () => {
    const plan = activePlans.find(p => p.name === newSub.plan);
    if (!plan) return;
    const id = Math.max(...allSubs.map(s => s.id)) + 1;
    const startDate = new Date().toISOString().split("T")[0];
    const months = parseInt(plan.duration) || 6;
    const expiry = new Date(today.getTime() + months * 30 * 86400000).toISOString().split("T")[0];
    const newRecord = {
      id, customer: newSub.customer, plan: plan.name, amount: plan.price,
      paymentMode: newSub.paymentMode as any, staff: staffName, branch: "Chennai Central",
      startDate, expiryDate: expiry, status: "active" as const,
    };
    setAllSubs([...allSubs, newRecord]);
    setShowAddSub(false);
    setNewSub({ customer: "", plan: "", paymentMode: "Cash" });
    toast({ title: "Subscription Created", description: `${newSub.customer} → ${plan.name} (₹${plan.price.toLocaleString()}) | Commission: ₹${autoCommission.toLocaleString()}` });
  };

  const renewSubscription = () => {
    if (!showRenewDialog) return;
    setAllSubs(allSubs.map(s => s.id === showRenewDialog.id ? {
      ...s, status: "active" as const,
      startDate: new Date().toISOString().split("T")[0],
      expiryDate: new Date(today.getTime() + 180 * 86400000).toISOString().split("T")[0],
    } : s));
    toast({ title: "Renewed!", description: `${showRenewDialog.customer}'s subscription renewed` });
    setShowRenewDialog(null);
  };

  const exportCSV = () => {
    const header = "Customer,Plan,Amount,Payment,Start,Expiry,Status\n";
    const rows = filtered.map(s => `${s.customer},${s.plan},${s.amount},${s.paymentMode},${s.startDate},${s.expiryDate},${s.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "my-subscriptions.csv"; a.click();
    toast({ title: "Exported", description: "CSV downloaded" });
  };

  const kpis = [
    { label: "Total Sold", value: mySubs.length, icon: CreditCard, color: "text-primary" },
    { label: "Active", value: mySubs.filter(s => s.status === "active").length, icon: CheckCircle2, color: "text-success" },
    { label: "Expired", value: mySubs.filter(s => s.status === "expired").length, icon: Clock, color: "text-warning" },
    { label: "Revenue", value: `₹${mySubs.reduce((s, c) => s + c.amount, 0).toLocaleString()}`, icon: TrendingUp, color: "text-accent-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Subscriptions sold by you</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2"><Download className="h-4 w-4" /> Export</Button>
          <Button onClick={() => setShowAddSub(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg">
            <Plus className="h-4 w-4" /> Add Subscription
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
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

      {/* Expiry Alerts */}
      {expiringSoon.length > 0 && (
        <Card className="border-l-4 border-l-warning bg-warning/5 shadow-elegant border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <p className="font-semibold text-sm text-warning">Expiry Alerts — {expiringSoon.length} subscription(s) expiring in 30 days</p>
            </div>
            <div className="space-y-1">
              {expiringSoon.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm bg-warning/10 rounded px-3 py-1.5">
                  <span>{s.customer} — {s.plan} (expires {s.expiryDate})</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                    onClick={() => setShowRenewDialog(s)}>
                    <RefreshCw className="h-3 w-3" /> Renew
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions Table */}
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
                <TableHead>Start</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className={
                  s.status === "active" && new Date(s.expiryDate) <= in30Days ? "bg-warning/5" : ""
                }>
                  <TableCell className="font-medium">{s.customer}</TableCell>
                  <TableCell><Badge className="bg-accent text-accent-foreground">{s.plan}</Badge></TableCell>
                  <TableCell>₹{s.amount.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{s.paymentMode}</Badge></TableCell>
                  <TableCell>{s.startDate}</TableCell>
                  <TableCell>{s.expiryDate}</TableCell>
                  <TableCell><Badge className={statusColors[s.status]}>{s.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                      onClick={() => setShowRenewDialog(s)}>
                      <RefreshCw className="h-3 w-3" /> Renew
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Subscription Dialog */}
      <Dialog open={showAddSub} onOpenChange={setShowAddSub}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Offline Subscription</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Customer *</Label>
              <Select value={newSub.customer} onValueChange={(v) => setNewSub({ ...newSub, customer: v })}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => <SelectItem key={p.id} value={p.name}>{p.name} ({p.id})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan *</Label>
              <Select value={newSub.plan} onValueChange={(v) => setNewSub({ ...newSub, plan: v })}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  {activePlans.map((p) => <SelectItem key={p.id} value={p.name}>{p.name} — ₹{p.price.toLocaleString()} ({p.duration})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Mode *</Label>
              <Select value={newSub.paymentMode} onValueChange={(v) => setNewSub({ ...newSub, paymentMode: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Netbanking">Netbanking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedPlan && (
              <Card className="bg-muted/50 border-0">
                <CardContent className="p-3 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Amount:</span> <span className="font-bold">₹{selectedPlan.price.toLocaleString()}</span></p>
                  <p><span className="text-muted-foreground">Auto Commission (10%):</span> <span className="font-bold text-success">₹{autoCommission.toLocaleString()}</span></p>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSub(false)}>Cancel</Button>
            <Button onClick={addSubscription} disabled={!newSub.customer || !newSub.plan}>Create Subscription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Dialog */}
      <Dialog open={!!showRenewDialog} onOpenChange={() => setShowRenewDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renew Subscription</DialogTitle></DialogHeader>
          {showRenewDialog && (
            <div className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">Customer:</span> {showRenewDialog.customer}</p>
              <p><span className="text-muted-foreground">Current Plan:</span> {showRenewDialog.plan}</p>
              <p><span className="text-muted-foreground">Expires:</span> {showRenewDialog.expiryDate}</p>
              <Card className="bg-success/10 border-0"><CardContent className="p-3 text-sm">
                <p className="font-medium text-success">Renewal will extend by 6 months from today</p>
              </CardContent></Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenewDialog(null)}>Cancel</Button>
            <Button onClick={renewSubscription}>Confirm Renewal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
