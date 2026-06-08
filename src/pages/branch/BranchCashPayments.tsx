import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Banknote, Smartphone, CreditCard, TrendingUp, Search, Eye, RefreshCw,
  Download, CheckCircle, Clock, Shield, AlertTriangle, FileText, ArrowUpRight,
  Users, Receipt, Lock, CalendarClock, Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const staffData = [
  { name: "Priya Kumar", txns: 28, revenue: 62000, cash: 18000, digital: 44000, target: 70000, achieved: 65100 },
  { name: "Ravi Sharma", txns: 22, revenue: 48000, cash: 15000, digital: 33000, target: 60000, achieved: 48000 },
  { name: "Anita Desai", txns: 18, revenue: 35000, cash: 12000, digital: 23000, target: 50000, achieved: 35000 },
];

const staffCashBreakdown = [
  { name: "Priya Kumar", txns: 12, systemAmt: 18000, submittedAmt: 18000, verified: true },
  { name: "Ravi Sharma", txns: 8, systemAmt: 15000, submittedAmt: 15000, verified: true },
  { name: "Anita Desai", txns: 4, systemAmt: 12000, submittedAmt: 12000, verified: true },
];

const transactions = [
  { id: 1, time: "10:35 AM", receiptId: "BR01-2026-00852", customer: "Ravi Kumar", customerId: "MAT-00123", plan: "Gold 6M", amount: 4500, mode: "cash" as const, staff: "Priya Kumar", status: "verified" as const, cashierReceipt: "CSH-CHN-014", otpVerified: true, commission: 450, upiRef: "", cardType: "", cardLast4: "", authCode: "" },
  { id: 2, time: "10:48 AM", receiptId: "PAY-2026-00145", customer: "Meera S", customerId: "MAT-00456", plan: "Platinum 12M", amount: 7500, mode: "upi" as const, staff: "Priya Kumar", status: "verified" as const, cashierReceipt: "", otpVerified: true, commission: 750, upiRef: "UPI-REF-9876543210", cardType: "", cardLast4: "", authCode: "" },
  { id: 3, time: "11:05 AM", receiptId: "CRD-2026-00067", customer: "Ganesh T", customerId: "MAT-00789", plan: "Diamond 24M", amount: 7500, mode: "card" as const, staff: "Ravi Sharma", status: "verified" as const, cashierReceipt: "", otpVerified: true, commission: 750, upiRef: "", cardType: "Visa", cardLast4: "4567", authCode: "AUTH-99234" },
  { id: 4, time: "11:22 AM", receiptId: "BR01-2026-00853", customer: "Saranya P", customerId: "MAT-00234", plan: "Silver 3M", amount: 1000, mode: "cash" as const, staff: "Anita Desai", status: "pending" as const, cashierReceipt: "", otpVerified: false, commission: 100, upiRef: "", cardType: "", cardLast4: "", authCode: "" },
  { id: 5, time: "11:40 AM", receiptId: "PAY-2026-00146", customer: "Vijay N", customerId: "MAT-00567", plan: "Gold 6M", amount: 2500, mode: "upi" as const, staff: "Priya Kumar", status: "verified" as const, cashierReceipt: "", otpVerified: true, commission: 250, upiRef: "UPI-REF-1234567890", cardType: "", cardLast4: "", authCode: "" },
  { id: 6, time: "12:10 PM", receiptId: "PAY-2026-00147", customer: "Lakshmi R", customerId: "MAT-00345", plan: "Gold 6M", amount: 2500, mode: "upi" as const, staff: "Ravi Sharma", status: "verified" as const, cashierReceipt: "", otpVerified: true, commission: 250, upiRef: "UPI-REF-5678901234", cardType: "", cardLast4: "", authCode: "" },
  { id: 7, time: "12:30 PM", receiptId: "BR01-2026-00854", customer: "Arun S", customerId: "MAT-00678", plan: "Gold 6M", amount: 2500, mode: "cash" as const, staff: "Anita Desai", status: "verified" as const, cashierReceipt: "CSH-CHN-015", otpVerified: true, commission: 250, upiRef: "", cardType: "", cardLast4: "", authCode: "" },
  { id: 8, time: "01:15 PM", receiptId: "CRD-2026-00068", customer: "Suresh M", customerId: "MAT-00901", plan: "Diamond 24M", amount: 7500, mode: "card" as const, staff: "Priya Kumar", status: "verified" as const, cashierReceipt: "", otpVerified: true, commission: 750, upiRef: "", cardType: "Mastercard", cardLast4: "8901", authCode: "AUTH-77812" },
];

const modeConfig = {
  cash: { label: "Cash", icon: Banknote, color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  upi: { label: "UPI", icon: Smartphone, color: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  card: { label: "Card", icon: CreditCard, color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
};

export default function BranchCashPayments() {
  const { toast } = useToast();
  const [modeFilter, setModeFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<typeof transactions[0] | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dayCloseOpen, setDayCloseOpen] = useState(false);
  const [physicalCash, setPhysicalCash] = useState("");
  const [varianceReason, setVarianceReason] = useState("");
  const [dayCloseDone, setDayCloseDone] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = transactions.filter(t =>
    (modeFilter === "all" || t.mode === modeFilter) &&
    (staffFilter === "all" || t.staff === staffFilter) &&
    (statusFilter === "all" || t.status === statusFilter) &&
    (searchTerm === "" || t.receiptId.toLowerCase().includes(searchTerm.toLowerCase()) || t.customer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const cashTotal = transactions.filter(t => t.mode === "cash").reduce((s, t) => s + t.amount, 0);
  const upiTotal = transactions.filter(t => t.mode === "upi").reduce((s, t) => s + t.amount, 0);
  const cardTotal = transactions.filter(t => t.mode === "card").reduce((s, t) => s + t.amount, 0);
  const cashCount = transactions.filter(t => t.mode === "cash").length;
  const upiCount = transactions.filter(t => t.mode === "upi").length;
  const cardCount = transactions.filter(t => t.mode === "card").length;
  const expectedCash = cashTotal;
  const physicalNum = parseFloat(physicalCash) || 0;
  const difference = physicalNum - expectedCash;

  const handleDayClose = () => {
    if (difference !== 0 && !varianceReason.trim()) {
      toast({ title: "Variance Explanation Required", description: "Please explain the cash difference before proceeding", variant: "destructive" });
      return;
    }
    setDayCloseDone(true);
    toast({ title: "Day-Close Complete", description: "Bank deposit record created, admin notified, commissions calculated" });
  };

  const handleExport = (format: string) => {
    const header = "Time,Receipt ID,Customer,Plan,Amount,Mode,Staff,Status\n";
    const rows = filtered.map(t => `${t.time},${t.receiptId},${t.customer},${t.plan},${t.amount},${t.mode},${t.staff},${t.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `branch-payments.${format}`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `Branch payment data downloaded as ${format.toUpperCase()}` });
  };

  const viewDetails = (txn: typeof transactions[0]) => { setSelectedTxn(txn); setDetailOpen(true); };

  const branchTarget = 170000;
  const branchActual = cashTotal + upiTotal + cardTotal;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Branch Payment Dashboard</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className="text-xs"><Building2 className="h-3 w-3 mr-1" /> Chennai HQ</Badge>
            <span className="text-xs text-muted-foreground">Updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLastUpdated(new Date())}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport("csv")}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-1.5 bg-primary" onClick={() => { setDayCloseOpen(true); setDayCloseDone(false); setPhysicalCash(""); setVarianceReason(""); }}>
            <CalendarClock className="h-3.5 w-3.5" /> Day-Close
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Cash", value: `₹${cashTotal.toLocaleString()}`, sub: `${cashCount} txns`, growth: "+15%", gradient: "from-emerald-500 to-emerald-600", icon: Banknote },
          { label: "UPI", value: `₹${upiTotal.toLocaleString()}`, sub: `${upiCount} txns`, growth: "+22%", gradient: "from-violet-500 to-violet-600", icon: Smartphone },
          { label: "Card", value: `₹${cardTotal.toLocaleString()}`, sub: `${cardCount} txns`, growth: "+10%", gradient: "from-blue-500 to-blue-600", icon: CreditCard },
          { label: "Total", value: `₹${branchActual.toLocaleString()}`, sub: `Target: ${((branchActual / branchTarget) * 100).toFixed(0)}%`, growth: "+18%", gradient: "from-primary to-primary/80", icon: TrendingUp },
        ].map((kpi) => (
          <Card key={kpi.label} className="shadow-elegant border-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className={`w-1.5 bg-gradient-to-b ${kpi.gradient}`} />
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-muted-foreground">💵 {kpi.label}</p>
                    <kpi.icon className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{kpi.sub}</span>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" />{kpi.growth}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staff Performance Cards */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Staff Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staffData.map((s) => {
              const pct = (s.achieved / s.target) * 100;
              return (
                <Card key={s.name} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{s.name}</span>
                      <Badge variant={pct >= 90 ? "default" : "outline"} className="text-[10px]">{pct.toFixed(0)}%</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Transactions</span><p className="font-bold">{s.txns}</p></div>
                      <div><span className="text-muted-foreground">Revenue</span><p className="font-bold">₹{s.revenue.toLocaleString()}</p></div>
                      <div><span className="text-muted-foreground">Cash</span><p className="font-semibold text-emerald-600">₹{s.cash.toLocaleString()}</p></div>
                      <div><span className="text-muted-foreground">Digital</span><p className="font-semibold text-violet-600">₹{s.digital.toLocaleString()}</p></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Target Progress</span>
                        <span>₹{s.achieved.toLocaleString()} / ₹{s.target.toLocaleString()}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day-Close Cash Control */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Day-Close Cash Reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <p className="text-xs text-muted-foreground">Expected Cash (System)</p>
              <p className="text-2xl font-bold mt-1">₹{expectedCash.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{cashCount} transactions</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <p className="text-xs text-muted-foreground">Physical Count</p>
              <p className="text-2xl font-bold mt-1">₹{physicalNum > 0 ? physicalNum.toLocaleString() : "—"}</p>
              <Input placeholder="Enter cash count" value={physicalCash} onChange={(e) => setPhysicalCash(e.target.value)} className="mt-2 text-center h-8 text-sm" type="number" />
            </div>
            <div className={`rounded-lg border p-4 text-center ${physicalNum === 0 ? "bg-muted/30" : difference === 0 ? "bg-emerald-50 border-emerald-200" : difference > 0 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
              <p className="text-xs text-muted-foreground">Difference</p>
              <p className={`text-2xl font-bold mt-1 ${physicalNum === 0 ? "" : difference === 0 ? "text-emerald-600" : difference > 0 ? "text-amber-600" : "text-red-600"}`}>
                {physicalNum === 0 ? "—" : difference === 0 ? "✓ Matched" : difference > 0 ? `+₹${difference.toLocaleString()} Excess` : `-₹${Math.abs(difference).toLocaleString()} Shortage`}
              </p>
              {physicalNum > 0 && difference === 0 && <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mt-1" />}
              {physicalNum > 0 && difference !== 0 && <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mt-1" />}
            </div>
          </div>

          {/* Staff-wise breakdown */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs">Transactions</TableHead>
                <TableHead className="text-xs">System Amount</TableHead>
                <TableHead className="text-xs">Submitted</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffCashBreakdown.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell className="text-sm">{s.txns} txns</TableCell>
                  <TableCell className="font-semibold text-sm">₹{s.systemAmt.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold text-sm">₹{s.submittedAmt.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="shadow-elegant border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"><Search className="h-4 w-4" /> Filters:</div>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="cash">💵 Cash</SelectItem>
                <SelectItem value="upi">📱 UPI</SelectItem>
                <SelectItem value="card">💳 Card</SelectItem>
              </SelectContent>
            </Select>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staffData.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">✅ Verified</SelectItem>
                <SelectItem value="pending">⏳ Pending</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search receipt or customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-8 text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" /> Branch Transactions ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Time</TableHead>
                <TableHead className="text-xs">Receipt/TXN ID</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Plan</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Mode</TableHead>
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const mc = modeConfig[t.mode];
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs font-mono">{t.time}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{t.receiptId}</TableCell>
                    <TableCell>
                      <div><p className="text-sm font-medium">{t.customer}</p><p className="text-[10px] text-muted-foreground">{t.customerId}</p></div>
                    </TableCell>
                    <TableCell className="text-xs">{t.plan}</TableCell>
                    <TableCell className="font-bold text-sm">₹{t.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] gap-1 ${mc.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${mc.dot}`} />{mc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{t.staff}</TableCell>
                    <TableCell>
                      {t.status === "verified" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1"><CheckCircle className="h-3 w-3" /> Verified</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => viewDetails(t)}>
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedTxn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Time</span><p className="font-medium">{selectedTxn.time}</p></div>
                <div><span className="text-muted-foreground text-xs">Receipt/TXN ID</span><p className="font-mono font-semibold">{selectedTxn.receiptId}</p></div>
                <div><span className="text-muted-foreground text-xs">Customer</span><p className="font-medium">{selectedTxn.customer}</p></div>
                <div><span className="text-muted-foreground text-xs">Customer ID</span><p className="font-mono">{selectedTxn.customerId}</p></div>
                <div><span className="text-muted-foreground text-xs">Plan</span><p>{selectedTxn.plan}</p></div>
                <div><span className="text-muted-foreground text-xs">Amount</span><p className="font-bold text-lg">₹{selectedTxn.amount.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground text-xs">Mode</span>
                  <Badge variant="outline" className={`${modeConfig[selectedTxn.mode].color} mt-0.5`}>{modeConfig[selectedTxn.mode].label}</Badge>
                </div>
                <div><span className="text-muted-foreground text-xs">Staff</span><p>{selectedTxn.staff}</p></div>
              </div>
              <div className="border-t pt-3 space-y-1.5 text-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Verification</p>
                {selectedTxn.mode === "cash" && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Cashier Receipt</span>
                      {selectedTxn.cashierReceipt ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />{selectedTxn.cashierReceipt}</Badge> : <Badge variant="destructive" className="text-[10px]">Pending</Badge>}
                    </div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Customer OTP</span>
                      {selectedTxn.otpVerified ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge> : <Badge variant="destructive" className="text-[10px]">Pending</Badge>}
                    </div>
                  </>
                )}
                {selectedTxn.mode === "upi" && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">UPI Ref</span><span className="font-mono text-xs">{selectedTxn.upiRef}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Auto-Verified</span><Badge className="bg-violet-100 text-violet-700 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Yes</Badge></div>
                  </>
                )}
                {selectedTxn.mode === "card" && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Card</span><span>{selectedTxn.cardType} ****{selectedTxn.cardLast4}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Auth Code</span><span className="font-mono text-xs">{selectedTxn.authCode}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">3D Secure</span><Badge className="bg-blue-100 text-blue-700 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge></div>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day-Close Modal */}
      <Dialog open={dayCloseOpen} onOpenChange={setDayCloseOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Day-Close — Chennai HQ</DialogTitle>
          </DialogHeader>
          {!dayCloseDone ? (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs space-y-1">
                <p className="font-bold text-sm mb-2">━━━ CHENNAI HQ — DAY-CLOSE ━━━</p>
                <p>Date: {new Date().toLocaleDateString()}</p>
                <p>Manager: Ramesh Kumar</p>
                <p className="mt-2 font-bold">CASH RECONCILIATION:</p>
                <p>Expected: ₹{expectedCash.toLocaleString()}</p>
                <p>Physical: ₹{physicalNum > 0 ? physicalNum.toLocaleString() : "Not entered"}</p>
                <p className={difference === 0 ? "text-emerald-600" : "text-red-600"}>
                  Difference: {physicalNum === 0 ? "—" : difference === 0 ? "✓ Matched" : `₹${difference.toLocaleString()}`}
                </p>
                <p className="mt-2 font-bold">PAYMENT BREAKDOWN:</p>
                <p>💵 Cash: ₹{cashTotal.toLocaleString()} ({cashCount} txns)</p>
                <p>📱 UPI: ₹{upiTotal.toLocaleString()} ({upiCount} txns)</p>
                <p>💳 Card: ₹{cardTotal.toLocaleString()} ({cardCount} txns)</p>
                <p className="mt-1 font-bold">━━━━━━━━━━━━━━━━━━━━━━━━━</p>
                <p className="font-bold">TOTAL: ₹{branchActual.toLocaleString()} ({transactions.length} txns)</p>
              </div>

              {physicalNum === 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter Physical Cash Count</label>
                  <Input type="number" placeholder="Enter actual cash counted" value={physicalCash} onChange={(e) => setPhysicalCash(e.target.value)} />
                </div>
              )}

              {physicalNum > 0 && difference !== 0 && (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-xs">Variance detected! Please provide an explanation before confirming day-close.</p>
                  </div>
                  <Textarea placeholder="Explain the cash variance..." value={varianceReason} onChange={(e) => setVarianceReason(e.target.value)} rows={3} />
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setDayCloseOpen(false)}>Cancel</Button>
                <Button onClick={handleDayClose} disabled={physicalNum === 0} className="gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  {difference !== 0 && physicalNum > 0 ? "Confirm with Variance" : "Perform Day-Close"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="text-center space-y-4 py-6">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold">Day-Close Complete!</h3>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>✓ Bank deposit record created</p>
                <p>✓ Day-close report generated</p>
                <p>✓ Admin notification sent</p>
                <p>✓ Commission calculations updated</p>
                {difference !== 0 && <p className="text-amber-600">⚠ Variance reason logged for audit</p>}
              </div>
              <Button onClick={() => setDayCloseOpen(false)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
