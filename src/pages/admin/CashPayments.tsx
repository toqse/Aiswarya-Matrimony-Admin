import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Banknote, Smartphone, CreditCard, TrendingUp, Search, Eye, RefreshCw,
  Download, CheckCircle, Clock, Shield, AlertTriangle, FileText, ArrowUpRight,
  Building2, Users, Receipt, Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Mock transaction data ───
const transactions = [
  { id: 1, time: "10:35 AM", receiptId: "BR01-2026-00852", customer: "Ravi Kumar", customerId: "MAT-00123", plan: "Gold 6M", amount: 4500, mode: "cash" as const, branch: "Chennai HQ", staff: "Priya Kumar", status: "verified" as const, cashierReceipt: "CSH-CHN-014", otpVerified: true, commission: 450, upiRef: "", cardType: "", cardLast4: "", authCode: "" },
  { id: 2, time: "10:48 AM", receiptId: "PAY-2026-00145", customer: "Meera S", customerId: "MAT-00456", plan: "Platinum 12M", amount: 7500, mode: "upi" as const, branch: "Chennai HQ", staff: "Priya Kumar", status: "verified" as const, cashierReceipt: "", otpVerified: true, commission: 750, upiRef: "UPI-REF-9876543210", cardType: "", cardLast4: "", authCode: "" },
  { id: 3, time: "11:05 AM", receiptId: "CRD-2026-00067", customer: "Ganesh T", customerId: "MAT-00789", plan: "Diamond 24M", amount: 7500, mode: "card" as const, branch: "Coimbatore", staff: "Ravi Sharma", status: "verified" as const, cashierReceipt: "", otpVerified: true, commission: 750, upiRef: "", cardType: "Visa", cardLast4: "4567", authCode: "AUTH-99234" },
  { id: 4, time: "11:22 AM", receiptId: "BR01-2026-00853", customer: "Saranya P", customerId: "MAT-00234", plan: "Silver 3M", amount: 1000, mode: "cash" as const, branch: "Madurai", staff: "Anita Desai", status: "pending" as const, cashierReceipt: "", otpVerified: false, commission: 100, upiRef: "", cardType: "", cardLast4: "", authCode: "" },
  { id: 5, time: "11:40 AM", receiptId: "PAY-2026-00146", customer: "Vijay N", customerId: "MAT-00567", plan: "Gold 6M", amount: 2500, mode: "upi" as const, branch: "Chennai HQ", staff: "Priya Kumar", status: "verified" as const, cashierReceipt: "", otpVerified: true, commission: 250, upiRef: "UPI-REF-1234567890", cardType: "", cardLast4: "", authCode: "" },
  { id: 6, time: "11:55 AM", receiptId: "CRD-2026-00068", customer: "Kavitha M", customerId: "MAT-00890", plan: "Platinum 12M", amount: 4500, mode: "card" as const, branch: "Trichy", staff: "Deepa S", status: "verified" as const, cashierReceipt: "", otpVerified: true, commission: 450, upiRef: "", cardType: "Mastercard", cardLast4: "8901", authCode: "AUTH-77812" },
  { id: 7, time: "12:10 PM", receiptId: "PAY-2026-00147", customer: "Lakshmi R", customerId: "MAT-00345", plan: "Gold 6M", amount: 2500, mode: "upi" as const, branch: "Coimbatore", staff: "Ravi Sharma", status: "verified" as const, cashierReceipt: "", otpVerified: true, commission: 250, upiRef: "UPI-REF-5678901234", cardType: "", cardLast4: "", authCode: "" },
  { id: 8, time: "12:30 PM", receiptId: "BR01-2026-00854", customer: "Arun S", customerId: "MAT-00678", plan: "Gold 6M", amount: 2500, mode: "cash" as const, branch: "Chennai HQ", staff: "Anita Desai", status: "verified" as const, cashierReceipt: "CSH-CHN-015", otpVerified: true, commission: 250, upiRef: "", cardType: "", cardLast4: "", authCode: "" },
  { id: 9, time: "01:15 PM", receiptId: "PAY-2026-00148", customer: "Suresh M", customerId: "MAT-00901", plan: "Diamond 24M", amount: 7500, mode: "upi" as const, branch: "Madurai", staff: "Deepa S", status: "verified" as const, cashierReceipt: "", otpVerified: true, commission: 750, upiRef: "UPI-REF-3456789012", cardType: "", cardLast4: "", authCode: "" },
  { id: 10, time: "01:45 PM", receiptId: "BR01-2026-00855", customer: "Karthik M", customerId: "MAT-00112", plan: "Platinum 12M", amount: 4500, mode: "cash" as const, branch: "Trichy", staff: "Priya Kumar", status: "pending" as const, cashierReceipt: "", otpVerified: false, commission: 450, upiRef: "", cardType: "", cardLast4: "", authCode: "" },
];

const branchPerformance = [
  { branch: "Chennai HQ", cash: 45000, cashTxns: 12, upi: 68000, upiTxns: 18, card: 32000, cardTxns: 8, total: 145000, totalTxns: 38, topStaff: "Priya Kumar" },
  { branch: "Coimbatore", cash: 28000, cashTxns: 8, upi: 35000, upiTxns: 10, card: 12000, cardTxns: 4, total: 75000, totalTxns: 22, topStaff: "Ravi Sharma" },
  { branch: "Madurai", cash: 15000, cashTxns: 5, upi: 22000, upiTxns: 7, card: 8000, cardTxns: 2, total: 45000, totalTxns: 14, topStaff: "Deepa S" },
  { branch: "Trichy", cash: 10000, cashTxns: 3, upi: 15000, upiTxns: 5, card: 5000, cardTxns: 1, total: 30000, totalTxns: 9, topStaff: "Anita Desai" },
];

const modeConfig = {
  cash: { label: "Cash", icon: Banknote, color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  upi: { label: "UPI", icon: Smartphone, color: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  card: { label: "Card", icon: CreditCard, color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
};

export default function CashPayments() {
  const { toast } = useToast();
  const [modeFilter, setModeFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<typeof transactions[0] | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const [newPaymentIds, setNewPaymentIds] = useState<number[]>([]);

  // Auto-refresh simulation
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => setLastUpdated(new Date()), 30000);
    return () => clearInterval(interval);
  }, [isLive]);

  const filtered = transactions.filter(t =>
    (modeFilter === "all" || t.mode === modeFilter) &&
    (branchFilter === "all" || t.branch === branchFilter) &&
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

  const handleRefresh = () => {
    setLastUpdated(new Date());
    toast({ title: "Data Refreshed", description: "All payment data updated successfully" });
  };

  const handleExport = (format: string) => {
    const header = "Time,Receipt ID,Customer,Plan,Amount,Mode,Branch,Staff,Status\n";
    const rows = filtered.map(t => `${t.time},${t.receiptId},${t.customer},${t.plan},${t.amount},${t.mode},${t.branch},${t.staff},${t.status}`).join("\n");
    const blob = new Blob([header + rows], { type: format === "csv" ? "text/csv" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `payments-report.${format}`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `Payment report downloaded as ${format.toUpperCase()}` });
  };

  const viewDetails = (txn: typeof transactions[0]) => { setSelectedTxn(txn); setDetailOpen(true); };

  const kpis = [
    { label: "Cash Payments", value: `₹${cashTotal.toLocaleString()}`, sub: `${cashCount} transactions`, growth: "+12%", icon: Banknote, status: "Verified ✓", gradient: "from-emerald-500 to-emerald-600" },
    { label: "UPI Payments", value: `₹${upiTotal.toLocaleString()}`, sub: `${upiCount} transactions`, growth: "+18%", icon: Smartphone, status: "Auto-Verified ✓", gradient: "from-violet-500 to-violet-600" },
    { label: "Card Payments", value: `₹${cardTotal.toLocaleString()}`, sub: `${cardCount} transactions`, growth: "+8%", icon: CreditCard, status: "Approved ✓", gradient: "from-blue-500 to-blue-600" },
    { label: "Total Revenue", value: `₹${(cashTotal + upiTotal + cardTotal).toLocaleString()}`, sub: `${transactions.length} transactions`, growth: "+15%", icon: TrendingUp, status: "All modes", gradient: "from-primary to-primary/80" },
  ];

  return (
    <div className="space-y-6">
      {/* Header with LIVE indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Control Center</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-semibold text-red-600">LIVE</span>
            </div>
            <span className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRefresh}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport("csv")}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport("txt")}>
            <FileText className="h-3.5 w-3.5" /> PDF Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-elegant border-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className={`w-1.5 bg-gradient-to-b ${kpi.gradient}`} />
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                    <kpi.icon className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-muted-foreground">{kpi.sub}</span>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" />{kpi.growth}
                    </span>
                  </div>
                  <Badge variant="outline" className="mt-2 text-[10px]">{kpi.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="shadow-elegant border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Search className="h-4 w-4" /> Filters:
            </div>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Mode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="cash">💵 Cash</SelectItem>
                <SelectItem value="upi">📱 UPI</SelectItem>
                <SelectItem value="card">💳 Card</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="Chennai HQ">Chennai HQ</SelectItem>
                <SelectItem value="Coimbatore">Coimbatore</SelectItem>
                <SelectItem value="Madurai">Madurai</SelectItem>
                <SelectItem value="Trichy">Trichy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Staff" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="Priya Kumar">Priya Kumar</SelectItem>
                <SelectItem value="Ravi Sharma">Ravi Sharma</SelectItem>
                <SelectItem value="Anita Desai">Anita Desai</SelectItem>
                <SelectItem value="Deepa S">Deepa S</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
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

      {/* Transaction Table */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> All Transactions ({filtered.length})
            </CardTitle>
            <Badge variant="outline" className="text-xs">{transactions.length} total today</Badge>
          </div>
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
                <TableHead className="text-xs">Branch</TableHead>
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const mc = modeConfig[t.mode];
                return (
                  <TableRow key={t.id} className={newPaymentIds.includes(t.id) ? "animate-pulse bg-emerald-50/50" : ""}>
                    <TableCell className="text-xs font-mono">{t.time}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{t.receiptId}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{t.customer}</p>
                        <p className="text-[10px] text-muted-foreground">{t.customerId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{t.plan}</TableCell>
                    <TableCell className="font-bold text-sm">₹{t.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] gap-1 ${mc.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${mc.dot}`} />
                        {mc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{t.branch}</TableCell>
                    <TableCell className="text-xs">{t.staff}</TableCell>
                    <TableCell>
                      {t.status === "verified" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] gap-1">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] gap-1">
                          <Clock className="h-3 w-3" /> Pending
                        </Badge>
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

      {/* Branch Performance */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Branch-wise Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Branch</TableHead>
                <TableHead className="text-xs">💵 Cash</TableHead>
                <TableHead className="text-xs">📱 UPI</TableHead>
                <TableHead className="text-xs">💳 Card</TableHead>
                <TableHead className="text-xs">Total Revenue</TableHead>
                <TableHead className="text-xs">Transactions</TableHead>
                <TableHead className="text-xs">Top Staff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchPerformance.map((b) => (
                <TableRow key={b.branch}>
                  <TableCell className="font-semibold text-sm">{b.branch}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <span className="font-semibold">₹{b.cash.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-1">({b.cashTxns})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <span className="font-semibold">₹{b.upi.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-1">({b.upiTxns})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <span className="font-semibold">₹{b.card.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-1">({b.cardTxns})</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-sm">₹{b.total.toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{b.totalTxns}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      <Users className="h-3 w-3 mr-1" /> {b.topStaff}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-bold">
                <TableCell className="font-bold">TOTAL</TableCell>
                <TableCell className="font-bold text-xs">₹{branchPerformance.reduce((s, b) => s + b.cash, 0).toLocaleString()}</TableCell>
                <TableCell className="font-bold text-xs">₹{branchPerformance.reduce((s, b) => s + b.upi, 0).toLocaleString()}</TableCell>
                <TableCell className="font-bold text-xs">₹{branchPerformance.reduce((s, b) => s + b.card, 0).toLocaleString()}</TableCell>
                <TableCell className="font-bold">₹{branchPerformance.reduce((s, b) => s + b.total, 0).toLocaleString()}</TableCell>
                <TableCell className="font-bold">{branchPerformance.reduce((s, b) => s + b.totalTxns, 0)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Security & Verification Summary */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Security & Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-sm">Cash Payments</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-500" /> Physical receipt verified</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-500" /> Cashier receipt validated</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-500" /> Customer OTP confirmed</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-500" /> Staff authorization logged</div>
              </div>
            </div>
            <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-violet-600" />
                <span className="font-semibold text-sm">UPI Payments</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-violet-500" /> Company UPI verified</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-violet-500" /> Amount locked in QR</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-violet-500" /> Webhook auto-verified</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-violet-500" /> Bank reference logged</div>
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-sm">Card Payments</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-blue-500" /> 3D Secure verified</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-blue-500" /> Bank authorization received</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-blue-500" /> PCI compliant process</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-blue-500" /> Terminal receipt generated</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert System */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {transactions.filter(t => t.status === "pending").map(t => (
              <div key={t.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" /> Pending Verification
                  </p>
                  <p className="text-xs text-muted-foreground">{t.customer} — {t.receiptId} — ₹{t.amount.toLocaleString()}</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => viewDetails(t)}>Review</Button>
              </div>
            ))}
            {transactions.filter(t => t.amount >= 7000).map(t => (
              <div key={`high-${t.id}`} className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" /> High-Value Transaction
                  </p>
                  <p className="text-xs text-muted-foreground">{t.customer} — ₹{t.amount.toLocaleString()} — {modeConfig[t.mode].label}</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => viewDetails(t)}>View</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTxn && (() => { const Icon = modeConfig[selectedTxn.mode].icon; return <Icon className="h-5 w-5" />; })()}
              Payment Details
            </DialogTitle>
          </DialogHeader>
          {selectedTxn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Transaction Time</span><p className="font-medium">{selectedTxn.time}</p></div>
                <div><span className="text-muted-foreground text-xs">Receipt/TXN ID</span><p className="font-mono font-semibold">{selectedTxn.receiptId}</p></div>
                <div><span className="text-muted-foreground text-xs">Customer</span><p className="font-medium">{selectedTxn.customer}</p></div>
                <div><span className="text-muted-foreground text-xs">Customer ID</span><p className="font-mono">{selectedTxn.customerId}</p></div>
                <div><span className="text-muted-foreground text-xs">Plan</span><p className="font-medium">{selectedTxn.plan}</p></div>
                <div><span className="text-muted-foreground text-xs">Amount</span><p className="font-bold text-lg">₹{selectedTxn.amount.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground text-xs">Payment Mode</span>
                  <Badge variant="outline" className={`${modeConfig[selectedTxn.mode].color} mt-0.5`}>
                    {modeConfig[selectedTxn.mode].label}
                  </Badge>
                </div>
                <div><span className="text-muted-foreground text-xs">Branch</span><p className="font-medium">{selectedTxn.branch}</p></div>
                <div><span className="text-muted-foreground text-xs">Staff Member</span><p className="font-medium">{selectedTxn.staff}</p></div>
                <div><span className="text-muted-foreground text-xs">Commission</span><p className="font-semibold text-emerald-600">₹{selectedTxn.commission.toLocaleString()}</p></div>
              </div>

              {/* Mode-specific details */}
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Verification Details</p>
                {selectedTxn.mode === "cash" && (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Cashier Receipt</span>
                      {selectedTxn.cashierReceipt ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />{selectedTxn.cashierReceipt}</Badge> : <Badge variant="destructive" className="text-[10px]">Pending</Badge>}
                    </div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Customer OTP</span>
                      {selectedTxn.otpVerified ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge> : <Badge variant="destructive" className="text-[10px]">Pending</Badge>}
                    </div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Security Status</span>
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px]"><Shield className="h-3 w-3 mr-1" />Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Subscription</span>
                      <Badge className="bg-primary/10 text-primary text-[10px]">Active</Badge>
                    </div>
                  </div>
                )}
                {selectedTxn.mode === "upi" && (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">UPI Reference</span><span className="font-mono text-xs">{selectedTxn.upiRef}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Payment ID</span><span className="font-mono text-xs">{selectedTxn.receiptId}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Auto-Verification</span>
                      <Badge className="bg-violet-100 text-violet-700 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Bank Transaction</span>
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Logged</Badge>
                    </div>
                  </div>
                )}
                {selectedTxn.mode === "card" && (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Card Type</span><span className="font-medium">{selectedTxn.cardType}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Last 4 Digits</span><span className="font-mono">****{selectedTxn.cardLast4}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Auth Code</span><span className="font-mono text-xs">{selectedTxn.authCode}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">3D Secure OTP</span>
                      <Badge className="bg-blue-100 text-blue-700 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Processing Fee</span>
                      <span className="text-xs">₹{(selectedTxn.amount * 0.02).toFixed(0)} (2%)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium">Overall Status</span>
                {selectedTxn.status === "verified" ? (
                  <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="h-3.5 w-3.5 mr-1" /> Fully Verified</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3.5 w-3.5 mr-1" /> Pending Verification</Badge>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
