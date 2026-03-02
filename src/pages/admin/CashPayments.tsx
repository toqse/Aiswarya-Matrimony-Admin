import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  cashCollections, cashReceipts, receiptBooks, staffCashPerformance,
  discrepancyHistory, bankDeposits, commissionReleaseFlow, cashPolicyRules
} from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import {
  AlertTriangle, Banknote, CheckCircle, Clock, Shield, FileText,
  BookOpen, Eye, Search, Receipt, Building2, Upload, Lock, Unlock,
  TrendingUp, ArrowRight, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusIcons: Record<string, any> = { settled: CheckCircle, shortage: AlertTriangle, pending: Clock };
const statusColors: Record<string, string> = {
  settled: "bg-success text-success-foreground",
  shortage: "bg-destructive text-destructive-foreground",
  pending: "bg-warning text-warning-foreground"
};

const cashVsDigital = [
  { branch: "Chennai", cash: 45000, digital: 85000 },
  { branch: "Coimbatore", cash: 32000, digital: 68000 },
  { branch: "Madurai", cash: 18000, digital: 42000 },
  { branch: "Trichy", cash: 12000, digital: 35000 },
];

const anomalies = [
  { id: 1, type: "High Cash Ratio", branch: "Trichy Office", details: "Cash payments exceed 60% of total — unusual pattern", severity: "high" as const, suggestedAction: "Request receipt book audit" },
  { id: 2, type: "Receipt Gap", branch: "Coimbatore Main", details: "Missing receipts R045-R047 in Staff: Karthik sequence", severity: "medium" as const, suggestedAction: "Request explanation for missing receipt numbers" },
  { id: 3, type: "Delayed Deposit", branch: "Salem Center", details: "₹15,000 cash not deposited for 3 days", severity: "high" as const, suggestedAction: "Commission freeze; admin investigation" },
  { id: 4, type: "No Cashier Receipt", branch: "Chennai Central", details: "Cash entered but no Cashier Receipt within 30 min (EMP002)", severity: "medium" as const, suggestedAction: "Confirm cash was handed to cashier" },
  { id: 5, type: "Round Amount Pattern", branch: "Coimbatore Main", details: "3 cash transactions by EMP004 today — all ending in round amounts", severity: "low" as const, suggestedAction: "Possible under-recording; verify receipts" },
  { id: 6, type: "After-Hours Entry", branch: "Trichy Office", details: "Cash subscription entered at 9:45 PM — after working hours", severity: "medium" as const, suggestedAction: "Verify legitimacy" },
];

const commissionStageLabels = [
  "Cash Entry", "OTP Confirmed", "Cashier Verified", "Day-Close Settled", "Deposit Uploaded", "Admin Verified", "Released — Paid"
];

const COLORS = ["hsl(333, 60%, 34%)", "hsl(40, 100%, 58%)", "hsl(0, 80%, 90%)", "hsl(150, 60%, 40%)"];

const paymentBreakdownData = [
  { name: "Cash", value: 107000, color: "hsl(40, 100%, 58%)" },
  { name: "UPI", value: 145000, color: "hsl(333, 60%, 34%)" },
  { name: "Card", value: 68000, color: "hsl(0, 80%, 90%)" },
  { name: "Netbanking", value: 42000, color: "hsl(150, 60%, 40%)" },
];

export default function CashPayments() {
  const [activeTab, setActiveTab] = useState("overview");
  const [receiptDetailOpen, setReceiptDetailOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<typeof cashReceipts[0] | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const viewReceiptTrail = (receipt: typeof cashReceipts[0]) => {
    setSelectedReceipt(receipt);
    setReceiptDetailOpen(true);
  };

  const verifyDeposit = (id: number) => {
    toast({ title: "Deposit Verified", description: `Bank deposit #${id} verified by admin` });
  };

  const filteredReceipts = cashReceipts.filter(r =>
    (branchFilter === "all" || r.branch === branchFilter) &&
    (searchTerm === "" || r.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) || r.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cash Payment Control Center</h1>
          <p className="text-muted-foreground text-sm mt-1">8-Layer Fraud Prevention & Control System</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setPolicyOpen(true)}>
          <Shield className="h-4 w-4" /> Cash Policy Rules
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="overview" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="receipts" className="text-xs">Receipts</TabsTrigger>
          <TabsTrigger value="receipt-books" className="text-xs">Receipt Books</TabsTrigger>
          <TabsTrigger value="deposits" className="text-xs">Bank Deposits</TabsTrigger>
          <TabsTrigger value="staff-cash" className="text-xs">Staff Cash</TabsTrigger>
          <TabsTrigger value="discrepancies" className="text-xs">Discrepancies</TabsTrigger>
          <TabsTrigger value="commission-flow" className="text-xs">Commission Flow</TabsTrigger>
        </TabsList>

        {/* ══════ TAB 1: OVERVIEW DASHBOARD ══════ */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Today's Cash", value: `₹${cashCollections.reduce((s, c) => s + c.physical, 0).toLocaleString()}`, icon: Banknote, color: "text-accent" },
              { label: "Pending Deposits", value: bankDeposits.filter(d => d.status === "pending" || d.status === "overdue").length.toString(), icon: Clock, color: "text-warning" },
              { label: "Discrepancies (MTD)", value: discrepancyHistory.filter(d => d.status !== "resolved").length.toString(), icon: AlertTriangle, color: "text-destructive" },
              { label: "Receipt Gaps", value: receiptBooks.filter(r => r.gaps > 0).length.toString(), icon: BookOpen, color: "text-primary" },
            ].map((kpi) => (
              <Card key={kpi.label} className="shadow-elegant border-0">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                    </div>
                    <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Today's Cash Collections */}
          <Card className="shadow-elegant border-0">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Banknote className="h-4 w-4 text-primary" /> Today's Cash Collections — Branch Wise</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead><TableHead>Expected (₹)</TableHead><TableHead>Physical (₹)</TableHead><TableHead>Deposited (₹)</TableHead><TableHead>Discrepancy</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashCollections.map((c) => {
                    const Icon = statusIcons[c.status];
                    return (
                      <TableRow key={c.branch}>
                        <TableCell className="font-medium">{c.branch}</TableCell>
                        <TableCell>₹{c.expected.toLocaleString()}</TableCell>
                        <TableCell>₹{c.physical.toLocaleString()}</TableCell>
                        <TableCell>₹{c.deposited.toLocaleString()}</TableCell>
                        <TableCell className={c.expected - c.physical !== 0 ? "text-destructive font-medium" : "text-success"}>
                          {c.expected - c.physical !== 0 ? `-₹${(c.expected - c.physical).toLocaleString()}` : "₹0"}
                        </TableCell>
                        <TableCell><Badge className={statusColors[c.status]}><Icon className="h-3 w-3 mr-1" /> {c.status}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash vs Digital */}
            <Card className="shadow-elegant border-0">
              <CardHeader><CardTitle className="text-base">Monthly Cash vs Digital Payments</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={cashVsDigital}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
                    <XAxis dataKey="branch" tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
                    <Bar dataKey="cash" name="Cash" fill="hsl(40, 100%, 58%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="digital" name="Digital" fill="hsl(333, 60%, 34%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Mode Breakdown */}
            <Card className="shadow-elegant border-0">
              <CardHeader><CardTitle className="text-base">Payment Mode Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={paymentBreakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {paymentBreakdownData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Anomaly Alerts */}
          <Card className="shadow-elegant border-0">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Automated Anomaly Alerts (Layer 8)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {anomalies.map((a) => (
                  <div key={a.id} className={`p-4 rounded-lg border ${a.severity === "high" ? "border-destructive/30 bg-destructive/5" : a.severity === "medium" ? "border-warning/30 bg-warning/5" : "border-muted bg-muted/30"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{a.type}</span>
                      <Badge variant={a.severity === "high" ? "destructive" : a.severity === "medium" ? "secondary" : "outline"} className="text-[10px]">{a.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{a.branch} — {a.details}</p>
                    <p className="text-xs font-medium text-primary">→ {a.suggestedAction}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ TAB 2: RECEIPTS (Layer 1 + 2 + 3) ══════ */}
        <TabsContent value="receipts" className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Cash Receipt Audit Trail</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search receipt or customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-60" />
                  </div>
                  <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="All Branches" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      <SelectItem value="Chennai Central">Chennai Central</SelectItem>
                      <SelectItem value="Coimbatore Main">Coimbatore Main</SelectItem>
                      <SelectItem value="Madurai Branch">Madurai Branch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Cashier Receipt</TableHead>
                    <TableHead>OTP</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-semibold">{r.receiptNo}</TableCell>
                      <TableCell><span className="text-xs">{r.staffName}<br/><span className="text-muted-foreground">{r.staffCode}</span></span></TableCell>
                      <TableCell className="font-medium">{r.customerName}</TableCell>
                      <TableCell className="text-xs">{r.plan}</TableCell>
                      <TableCell className="font-semibold">₹{r.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {r.cashierReceiptNo ? (
                          <Badge className="bg-success/10 text-success text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />{r.cashierReceiptNo}</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.customerOtpConfirmed ? (
                          <Badge className="bg-success/10 text-success text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]"><Clock className="h-3 w-3 mr-1" />Awaiting</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          r.commissionStatus === "released" ? "bg-success/10 text-success" :
                          r.commissionStatus === "approved" ? "bg-primary/10 text-primary" :
                          r.commissionStatus === "pending" ? "bg-warning/10 text-warning" :
                          "bg-muted text-muted-foreground"
                        } variant="outline">
                          {r.commissionStatus === "locked" ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                          {r.commissionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => viewReceiptTrail(r)}><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ TAB 3: RECEIPT BOOKS (Layer 1) ══════ */}
        <TabsContent value="receipt-books" className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Receipt Book Registry — Staff Assignments</CardTitle>
              <CardDescription>Pre-printed serial receipt books assigned to each staff. Gaps indicate missing receipts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Range Start</TableHead>
                    <TableHead>Range End</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Gaps</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receiptBooks.map((rb) => (
                    <TableRow key={rb.id}>
                      <TableCell><span className="font-medium">{rb.staffName}</span><br/><span className="text-xs text-muted-foreground">{rb.staffCode}</span></TableCell>
                      <TableCell className="text-sm">{rb.branch}</TableCell>
                      <TableCell className="font-mono text-xs">{rb.rangeStart}</TableCell>
                      <TableCell className="font-mono text-xs">{rb.rangeEnd}</TableCell>
                      <TableCell className="font-semibold">{rb.used}</TableCell>
                      <TableCell>{rb.remaining}</TableCell>
                      <TableCell>
                        {rb.gaps > 0 ? (
                          <Badge variant="destructive" className="text-xs">{rb.gaps} gaps</Badge>
                        ) : (
                          <span className="text-success text-xs">None</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{rb.lastUsed}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={(rb.used / rb.totalReceipts) * 100} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground">{Math.round((rb.used / rb.totalReceipts) * 100)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          rb.status === "gap-alert" ? "bg-destructive text-destructive-foreground" :
                          rb.status === "exhausted" ? "bg-warning text-warning-foreground" :
                          "bg-success text-success-foreground"
                        }>{rb.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ TAB 4: BANK DEPOSITS (Layer 6) ══════ */}
        <TabsContent value="deposits" className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Bank Deposits — 24-Hour Compliance</CardTitle>
              <CardDescription>All cash must be deposited within 24 hours. Deposit slip must be uploaded same day.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead>Deposited By</TableHead>
                    <TableHead>Day-Close Date</TableHead>
                    <TableHead>Deposit Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Slip Uploaded</TableHead>
                    <TableHead>Admin Verified</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankDeposits.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.branch}</TableCell>
                      <TableCell className="text-sm">{d.depositedBy}</TableCell>
                      <TableCell className="text-sm">{d.dayCloseDate}</TableCell>
                      <TableCell className="text-sm">{d.depositDate || <span className="text-destructive">Not deposited</span>}</TableCell>
                      <TableCell className="font-semibold">{d.amount > 0 ? `₹${d.amount.toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="text-sm">{d.bankName || "—"}</TableCell>
                      <TableCell>
                        {d.depositSlipUploaded ? (
                          <Badge className="bg-success/10 text-success text-[10px]"><Upload className="h-3 w-3 mr-1" />Uploaded</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">Missing</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {d.verifiedByAdmin ? (
                          <Badge className="bg-success/10 text-success text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          d.status === "verified" ? "bg-success text-success-foreground" :
                          d.status === "overdue" ? "bg-destructive text-destructive-foreground" :
                          d.status === "mismatch" ? "bg-warning text-warning-foreground" :
                          "bg-muted"
                        }>{d.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {!d.verifiedByAdmin && d.depositSlipUploaded && (
                          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => verifyDeposit(d.id)}>
                            <CheckCircle className="h-3 w-3" /> Verify
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ TAB 5: STAFF CASH PERFORMANCE ══════ */}
        <TabsContent value="staff-cash" className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Staff Cash Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Total Cash Collected</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Avg Transaction</TableHead>
                    <TableHead>Discrepancies</TableHead>
                    <TableHead>Last Discrepancy</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffCashPerformance.map((s) => (
                    <TableRow key={s.staffCode}>
                      <TableCell><span className="font-medium">{s.staffName}</span><br/><span className="text-xs text-muted-foreground">{s.staffCode}</span></TableCell>
                      <TableCell className="text-sm">{s.branch}</TableCell>
                      <TableCell className="font-semibold">₹{s.totalCashCollected.toLocaleString()}</TableCell>
                      <TableCell>{s.totalTransactions}</TableCell>
                      <TableCell>₹{s.avgTransaction.toLocaleString()}</TableCell>
                      <TableCell>
                        {s.discrepancyCount > 0 ? (
                          <Badge variant="destructive">{s.discrepancyCount}</Badge>
                        ) : (
                          <Badge className="bg-success/10 text-success">0</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.lastDiscrepancyDate ? (
                          <span className="text-destructive">₹{s.lastDiscrepancyAmount.toLocaleString()} on {s.lastDiscrepancyDate}</span>
                        ) : (
                          <span className="text-success">Clean record</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          s.discrepancyCount >= 2 ? "bg-destructive text-destructive-foreground" :
                          s.discrepancyCount === 1 ? "bg-warning text-warning-foreground" :
                          "bg-success text-success-foreground"
                        }>
                          {s.discrepancyCount >= 2 ? "High" : s.discrepancyCount === 1 ? "Medium" : "Low"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ TAB 6: DISCREPANCY HISTORY ══════ */}
        <TabsContent value="discrepancies" className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Discrepancy History Log</CardTitle>
              <CardDescription>All past shortages with staff names, amounts, explanations, and resolutions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Shortage</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Explanation</TableHead>
                    <TableHead>Resolution</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discrepancyHistory.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm">{d.date}</TableCell>
                      <TableCell className="text-sm">{d.branch}</TableCell>
                      <TableCell className="font-medium">{d.staffName}</TableCell>
                      <TableCell>₹{d.expectedAmount.toLocaleString()}</TableCell>
                      <TableCell>₹{d.actualAmount.toLocaleString()}</TableCell>
                      <TableCell className={d.shortage > 0 ? "text-destructive font-semibold" : "text-success"}>
                        {d.shortage > 0 ? `-₹${d.shortage.toLocaleString()}` : "₹0"}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          d.severity === "critical" ? "bg-destructive text-destructive-foreground" :
                          d.severity === "medium" ? "bg-warning text-warning-foreground" :
                          "bg-muted"
                        }>{d.severity}</Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{d.explanation}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{d.resolution || "—"}</TableCell>
                      <TableCell>
                        <Badge className={
                          d.status === "resolved" ? "bg-success/10 text-success" :
                          d.status === "investigating" ? "bg-warning/10 text-warning" :
                          "bg-destructive/10 text-destructive"
                        } variant="outline">{d.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ TAB 7: COMMISSION RELEASE FLOW (Layer 7) ══════ */}
        <TabsContent value="commission-flow" className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Commission Release Flow — Cash Payments (Layer 7)</CardTitle>
              <CardDescription>Commission is locked until the full audit trail is verified: OTP → Cashier → Day-Close → Deposit → Admin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {commissionReleaseFlow.map((c) => (
                <div key={c.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">{c.receiptNo}</span>
                      <p className="font-semibold">{c.staffName} → {c.customer}</p>
                      <p className="text-sm text-muted-foreground">₹{c.amount.toLocaleString()} | Commission: ₹{c.commissionAmount.toLocaleString()}</p>
                    </div>
                    <Badge className={
                      c.stage >= 6 ? "bg-success text-success-foreground" :
                      c.stage >= 4 ? "bg-primary text-primary-foreground" :
                      "bg-warning text-warning-foreground"
                    }>{c.stageName}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {commissionStageLabels.map((label, i) => (
                      <div key={i} className="flex items-center gap-1 flex-1">
                        <div className={`h-2 flex-1 rounded-full ${i < c.stage ? "bg-success" : i === c.stage ? "bg-accent animate-pulse" : "bg-muted"}`} />
                        {i < commissionStageLabels.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {commissionStageLabels.map((label, i) => (
                      <span key={i} className={`text-[9px] flex-1 text-center ${i < c.stage ? "text-success" : i === c.stage ? "text-accent font-semibold" : "text-muted-foreground"}`}>{label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══════ RECEIPT DETAIL DIALOG ══════ */}
      <Dialog open={receiptDetailOpen} onOpenChange={setReceiptDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Cash Audit Trail</DialogTitle></DialogHeader>
          {selectedReceipt && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border font-mono text-xs">
                <p className="text-base font-bold mb-2 font-sans">Receipt: {selectedReceipt.receiptNo}</p>
                {[
                  ["Staff", `${selectedReceipt.staffName} (${selectedReceipt.staffCode})`],
                  ["Branch", selectedReceipt.branch],
                  ["Customer", `${selectedReceipt.customerName} — ${selectedReceipt.profileId}`],
                  ["Plan", selectedReceipt.plan],
                  ["Amount", `₹${selectedReceipt.amount.toLocaleString()}`],
                  ["Receipt Date", selectedReceipt.receiptDate],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-sans">{k}</span>
                    <span className="font-semibold font-sans">{v}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Verification Trail:</p>
                {[
                  { label: "Cashier Receipt", value: selectedReceipt.cashierReceiptNo || "Pending", done: !!selectedReceipt.cashierReceiptNo, time: selectedReceipt.cashierVerifiedAt },
                  { label: "Customer OTP", value: selectedReceipt.customerOtpConfirmed ? "Confirmed" : "Awaiting", done: selectedReceipt.customerOtpConfirmed, time: selectedReceipt.customerOtpConfirmedAt },
                  { label: "Subscription", value: selectedReceipt.subscriptionId || "Not Created", done: !!selectedReceipt.subscriptionId },
                  { label: "Commission", value: selectedReceipt.commissionStatus, done: selectedReceipt.commissionStatus === "released" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-2 rounded border bg-card">
                    {item.done ? <CheckCircle className="h-4 w-4 text-success shrink-0" /> : <Clock className="h-4 w-4 text-warning shrink-0" />}
                    <div className="flex-1">
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.time && <span className="text-xs text-muted-foreground ml-2">{item.time}</span>}
                    </div>
                    <span className="text-xs font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════ CASH POLICY RULES DIALOG ══════ */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Cash Handling Policy Rules</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Rule No.</TableHead>
                <TableHead>Policy Rule</TableHead>
                <TableHead>Consequence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashPolicyRules.map((r) => (
                <TableRow key={r.ruleNo}>
                  <TableCell className="font-mono font-bold text-primary">{r.ruleNo}</TableCell>
                  <TableCell className="text-sm">{r.rule}</TableCell>
                  <TableCell className="text-sm text-destructive">{r.consequence}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}