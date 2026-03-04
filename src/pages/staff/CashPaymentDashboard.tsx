import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { subscriptionPlans, profiles } from "@/data/mockData";
import {
  Banknote, Smartphone, QrCode, IndianRupee, CheckCircle2, Clock, AlertTriangle,
  Plus, Receipt, CreditCard, Search, Download, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentRecord {
  id: number;
  receiptNo: string;
  customerName: string;
  profileId: string;
  plan: string;
  amount: number;
  paymentMode: "Cash" | "GPay/UPI";
  upiRefNo: string;
  date: string;
  status: "completed" | "pending" | "verified";
  notes: string;
}

const initialPayments: PaymentRecord[] = [
  { id: 1, receiptNo: "RCP-2026-001", customerName: "Priya Sharma", profileId: "AMP001", plan: "Gold", amount: 9000, paymentMode: "Cash", upiRefNo: "", date: "2026-03-04 10:30 AM", status: "verified", notes: "" },
  { id: 2, receiptNo: "RCP-2026-002", customerName: "Rajesh Kumar", profileId: "AMP002", plan: "Platinum", amount: 15000, paymentMode: "GPay/UPI", upiRefNo: "UPI-38472910384", date: "2026-03-04 11:15 AM", status: "completed", notes: "" },
  { id: 3, receiptNo: "RCP-2026-003", customerName: "Deepa Rajan", profileId: "AMP003", plan: "Silver", amount: 5000, paymentMode: "Cash", upiRefNo: "", date: "2026-03-03 02:45 PM", status: "pending", notes: "Awaiting manager verification" },
  { id: 4, receiptNo: "RCP-2026-004", customerName: "Karthik M", profileId: "AMP004", plan: "Diamond", amount: 25000, paymentMode: "GPay/UPI", upiRefNo: "UPI-58291037462", date: "2026-03-03 04:10 PM", status: "verified", notes: "" },
  { id: 5, receiptNo: "RCP-2026-005", customerName: "Arun S", profileId: "AMP005", plan: "Gold", amount: 9000, paymentMode: "Cash", upiRefNo: "", date: "2026-03-02 09:20 AM", status: "completed", notes: "" },
];

export default function CashPaymentDashboard() {
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showViewReceipt, setShowViewReceipt] = useState(false);
  const [viewPayment, setViewPayment] = useState<PaymentRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("All");
  const { toast } = useToast();

  // New payment form
  const [newPayment, setNewPayment] = useState({
    customerName: "",
    profileId: "",
    plan: "",
    paymentMode: "" as "Cash" | "GPay/UPI" | "",
    upiRefNo: "",
    amount: 0,
    notes: "",
    otpSent: false,
    otpVerified: false,
    otp: "",
  });

  const todaysCash = payments.filter(p => p.paymentMode === "Cash" && p.date.includes("2026-03-04")).reduce((s, p) => s + p.amount, 0);
  const todaysUPI = payments.filter(p => p.paymentMode === "GPay/UPI" && p.date.includes("2026-03-04")).reduce((s, p) => s + p.amount, 0);
  const pendingCount = payments.filter(p => p.status === "pending").length;
  const todaysTotal = todaysCash + todaysUPI;

  const filtered = payments.filter(p => {
    const matchSearch = p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
      p.profileId.toLowerCase().includes(search.toLowerCase());
    if (filterMode === "All") return matchSearch;
    if (filterMode === "Cash") return matchSearch && p.paymentMode === "Cash";
    if (filterMode === "GPay/UPI") return matchSearch && p.paymentMode === "GPay/UPI";
    return matchSearch;
  });

  const handleNewPayment = () => {
    if (!newPayment.customerName || !newPayment.plan || !newPayment.paymentMode) return;
    const plan = subscriptionPlans.find(p => p.name === newPayment.plan);
    const record: PaymentRecord = {
      id: payments.length + 1,
      receiptNo: `RCP-2026-${String(payments.length + 1).padStart(3, "0")}`,
      customerName: newPayment.customerName,
      profileId: newPayment.profileId || "N/A",
      plan: newPayment.plan,
      amount: plan?.price || newPayment.amount,
      paymentMode: newPayment.paymentMode as "Cash" | "GPay/UPI",
      upiRefNo: newPayment.upiRefNo,
      date: new Date().toLocaleString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      status: newPayment.otpVerified ? "completed" : "pending",
      notes: newPayment.notes,
    };
    setPayments([record, ...payments]);
    setShowNewPayment(false);
    setNewPayment({ customerName: "", profileId: "", plan: "", paymentMode: "", upiRefNo: "", amount: 0, notes: "", otpSent: false, otpVerified: false, otp: "" });
    toast({ title: "Payment Recorded", description: `Receipt ${record.receiptNo} created for ₹${record.amount.toLocaleString()}` });
  };

  const sendOtp = () => {
    setNewPayment(p => ({ ...p, otpSent: true }));
    toast({ title: "OTP Sent", description: "Customer verification OTP sent successfully" });
  };

  const verifyOtp = () => {
    if (newPayment.otp.length >= 4) {
      setNewPayment(p => ({ ...p, otpVerified: true }));
      toast({ title: "Verified", description: "Customer OTP verified successfully" });
    }
  };

  const downloadReceipt = (p: PaymentRecord) => {
    const text = `=== AISWARYA MATRIMONY - PAYMENT RECEIPT ===\nReceipt No: ${p.receiptNo}\nDate: ${p.date}\nCustomer: ${p.customerName}\nProfile ID: ${p.profileId}\nPlan: ${p.plan}\nAmount: ₹${p.amount.toLocaleString()}\nPayment Mode: ${p.paymentMode}\n${p.upiRefNo ? `UPI Ref: ${p.upiRefNo}\n` : ""}Status: ${p.status}\n=============================================`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.receiptNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: `Receipt ${p.receiptNo} downloaded` });
  };

  const kpis = [
    { label: "Today's Cash", value: `₹${todaysCash.toLocaleString()}`, icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Today's UPI/GPay", value: `₹${todaysUPI.toLocaleString()}`, icon: Smartphone, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Total Today", value: `₹${todaysTotal.toLocaleString()}`, icon: IndianRupee, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending Verification", value: String(pendingCount), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cash & Digital Payment Entry</h1>
          <p className="text-muted-foreground text-sm mt-1">Record cash and GPay/UPI payments from customers</p>
        </div>
        <Button onClick={() => setShowNewPayment(true)} className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4" /> New Payment Entry
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="shadow-elegant border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${k.bg} flex items-center justify-center`}>
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

      {/* Payment Records */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Payment Records</CardTitle>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, receipt, or profile ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {["All", "Cash", "GPay/UPI"].map(f => (
                <Button key={f} variant={filterMode === f ? "default" : "outline"} size="sm" onClick={() => setFilterMode(f)} className="text-xs">
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Profile ID</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.receiptNo}</TableCell>
                  <TableCell className="font-medium">{p.customerName}</TableCell>
                  <TableCell className="font-mono text-xs">{p.profileId}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{p.plan}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">₹{p.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={p.paymentMode === "Cash" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}>
                      {p.paymentMode === "Cash" ? <Banknote className="h-3 w-3 mr-1" /> : <QrCode className="h-3 w-3 mr-1" />}
                      {p.paymentMode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.date}</TableCell>
                  <TableCell>
                    <Badge className={
                      p.status === "verified" ? "bg-success text-success-foreground" :
                      p.status === "completed" ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }>
                      {p.status === "verified" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {p.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-violet-500/10" title="View Receipt"
                        onClick={() => { setViewPayment(p); setShowViewReceipt(true); }}>
                        <Eye className="h-3.5 w-3.5 text-violet-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-500/10" title="Download Receipt"
                        onClick={() => downloadReceipt(p)}>
                        <Download className="h-3.5 w-3.5 text-emerald-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Payment Dialog */}
      <Dialog open={showNewPayment} onOpenChange={setShowNewPayment}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Payment Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Payment Mode Selection */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Payment Mode *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { value: "Cash" as const, label: "Cash Payment", icon: Banknote, color: "border-emerald-500 bg-emerald-50 text-emerald-700" },
                  { value: "GPay/UPI" as const, label: "GPay / UPI", icon: QrCode, color: "border-violet-500 bg-violet-50 text-violet-700" },
                ].map(m => (
                  <button
                    key={m.value}
                    onClick={() => setNewPayment(p => ({ ...p, paymentMode: m.value }))}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      newPayment.paymentMode === m.value ? m.color : "border-border hover:border-primary/30"
                    }`}
                  >
                    <m.icon className="h-6 w-6" />
                    <span className="font-semibold text-sm">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Customer Name *</Label>
                <Input value={newPayment.customerName} onChange={(e) => setNewPayment(p => ({ ...p, customerName: e.target.value }))} placeholder="Enter customer name" />
              </div>
              <div>
                <Label>Profile ID</Label>
                <Select value={newPayment.profileId} onValueChange={(v) => {
                  const prof = profiles.find(p => p.id === v);
                  setNewPayment(p => ({ ...p, profileId: v, customerName: prof?.name || p.customerName }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Select profile" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.id} — {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subscription Plan *</Label>
                <Select value={newPayment.plan} onValueChange={(v) => {
                  const plan = subscriptionPlans.find(p => p.name === v);
                  setNewPayment(p => ({ ...p, plan: v, amount: plan?.price || 0 }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                  <SelectContent>
                    {subscriptionPlans.filter(p => p.status === "active").map(p => (
                      <SelectItem key={p.name} value={p.name}>{p.name} — ₹{p.price.toLocaleString()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newPayment.plan && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 text-sm">
                  <p className="font-semibold">Amount: ₹{newPayment.amount.toLocaleString()}</p>
                </CardContent>
              </Card>
            )}

            {newPayment.paymentMode === "GPay/UPI" && (
              <div>
                <Label>UPI Transaction Reference No *</Label>
                <Input value={newPayment.upiRefNo} onChange={(e) => setNewPayment(p => ({ ...p, upiRefNo: e.target.value }))}
                  placeholder="Enter UPI ref / transaction ID" />
                <div className="mt-3 p-4 border-2 border-dashed border-violet-300 rounded-xl bg-violet-50 text-center">
                  <QrCode className="h-16 w-16 mx-auto text-violet-400 mb-2" />
                  <p className="text-sm font-semibold text-violet-700">Scan QR Code to Pay</p>
                  <p className="text-xs text-violet-500 mt-1">UPI ID: aiswarya.matrimony@upi</p>
                </div>
              </div>
            )}

            {/* Customer OTP Verification */}
            <div className="border rounded-xl p-4 bg-card space-y-3">
              <p className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Customer Verification (OTP)
              </p>
              {!newPayment.otpVerified ? (
                <div className="flex gap-2">
                  <Input placeholder="Enter customer mobile" className="flex-1" />
                  {!newPayment.otpSent ? (
                    <Button onClick={sendOtp} size="sm">Send OTP</Button>
                  ) : (
                    <div className="flex gap-2">
                      <Input value={newPayment.otp} onChange={(e) => setNewPayment(p => ({ ...p, otp: e.target.value }))}
                        placeholder="Enter OTP" className="w-28" />
                      <Button onClick={verifyOtp} size="sm" className="bg-success text-success-foreground">Verify</Button>
                    </div>
                  )}
                </div>
              ) : (
                <Badge className="bg-success text-success-foreground gap-1"><CheckCircle2 className="h-3 w-3" /> Customer Verified</Badge>
              )}
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea value={newPayment.notes} onChange={(e) => setNewPayment(p => ({ ...p, notes: e.target.value }))} placeholder="Any additional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPayment(false)}>Cancel</Button>
            <Button onClick={handleNewPayment}
              disabled={!newPayment.customerName || !newPayment.plan || !newPayment.paymentMode}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white gap-1">
              <Receipt className="h-3.5 w-3.5" /> Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Receipt Dialog */}
      <Dialog open={showViewReceipt} onOpenChange={setShowViewReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Receipt — {viewPayment?.receiptNo}</DialogTitle></DialogHeader>
          {viewPayment && (
            <div className="space-y-3 text-sm">
              <div className="text-center border-b pb-3">
                <h3 className="font-bold text-lg">Aiswarya Matrimony</h3>
                <p className="text-xs text-muted-foreground">Payment Receipt</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Receipt No</Label><p className="font-mono font-bold">{viewPayment.receiptNo}</p></div>
                <div><Label className="text-muted-foreground text-xs">Date</Label><p>{viewPayment.date}</p></div>
                <div><Label className="text-muted-foreground text-xs">Customer</Label><p className="font-semibold">{viewPayment.customerName}</p></div>
                <div><Label className="text-muted-foreground text-xs">Profile ID</Label><p className="font-mono">{viewPayment.profileId}</p></div>
                <div><Label className="text-muted-foreground text-xs">Plan</Label><p>{viewPayment.plan}</p></div>
                <div><Label className="text-muted-foreground text-xs">Amount</Label><p className="font-bold text-lg">₹{viewPayment.amount.toLocaleString()}</p></div>
                <div><Label className="text-muted-foreground text-xs">Payment Mode</Label>
                  <Badge className={viewPayment.paymentMode === "Cash" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}>
                    {viewPayment.paymentMode}
                  </Badge>
                </div>
                <div><Label className="text-muted-foreground text-xs">Status</Label>
                  <Badge className={viewPayment.status === "verified" ? "bg-success text-success-foreground" : viewPayment.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}>
                    {viewPayment.status}
                  </Badge>
                </div>
                {viewPayment.upiRefNo && (
                  <div className="col-span-2"><Label className="text-muted-foreground text-xs">UPI Reference</Label><p className="font-mono">{viewPayment.upiRefNo}</p></div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewReceipt(false)}>Close</Button>
            {viewPayment && (
              <Button onClick={() => downloadReceipt(viewPayment)} className="gap-1">
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
