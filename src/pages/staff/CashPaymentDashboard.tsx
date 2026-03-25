import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { subscriptionPlans } from "@/data/mockData";
import {
  Banknote, Smartphone, QrCode, IndianRupee, CheckCircle2, Clock, AlertTriangle,
  Plus, Receipt, Search, Download, Eye, ArrowRight, ArrowLeft, User, CreditCard,
  FileText, ShieldCheck, PartyPopper, Send, Timer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchStaffProfiles } from "@/lib/admin-api/profiles";
import {
  createStaffPayment,
  downloadStaffPaymentReceiptPdf,
  fetchStaffPayments,
  fetchStaffPaymentsSummary,
  type StaffPaymentMode,
  type StaffPaymentStatus,
} from "@/lib/admin-api/staff-payments";

interface PaymentRecord {
  receiptNo: string;
  customerName: string;
  profileId: string;
  plan: string;
  amount: number;
  discount: number;
  finalAmount: number;
  paymentMode: "Cash" | "GPay/UPI";
  upiRefNo: string;
  physicalReceiptNo: string;
  cashierReceiptNo: string;
  date: string;
  status: "completed" | "pending" | "verified";
  notes: string;
}

const STEPS_CASH = ["Customer Details", "Plan Selection", "Receipt & Cashier", "OTP Verification", "Confirmation"];
const STEPS_UPI = ["Customer Details", "Plan Selection", "UPI Payment", "Verification", "Confirmation"];

export default function CashPaymentDashboard() {
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showViewReceipt, setShowViewReceipt] = useState(false);
  const [viewPayment, setViewPayment] = useState<PaymentRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("All");
  const { toast } = useToast();
  const qc = useQueryClient();

  const summaryQ = useQuery({
    queryKey: ["staff", "payments", "summary"],
    queryFn: () => fetchStaffPaymentsSummary(),
  });

  const modeParam: StaffPaymentMode | undefined =
    filterMode === "Cash" ? "cash" : filterMode === "GPay/UPI" ? "gpay_upi" : undefined;

  const listQ = useQuery({
    queryKey: ["staff", "payments", "list", search, filterMode],
    queryFn: () =>
      fetchStaffPayments({
        search: search.trim() || undefined,
        mode: modeParam,
        page_size: 100,
      }),
  });

  const staffProfilesQ = useQuery({
    queryKey: ["staff", "profiles", "list", "payments-picker"],
    queryFn: () => fetchStaffProfiles({ page_size: 100 }),
  });

  const payments: PaymentRecord[] = useMemo(() => {
    const rows = listQ.data?.results ?? [];
    return rows.map((r) => ({
      receiptNo: r.receipt_id,
      customerName: r.customer.name,
      profileId: r.customer.matri_id,
      plan: r.plan.name,
      amount: Number(r.amount),
      discount: 0,
      finalAmount: Number(r.amount),
      paymentMode: r.mode === "cash" ? "Cash" : "GPay/UPI",
      upiRefNo: r.reference_no ?? "",
      physicalReceiptNo: "",
      cashierReceiptNo: "",
      date: new Date(r.created_at).toLocaleString("en-IN"),
      status: r.status,
      notes: r.notes ?? "",
    }));
  }, [listQ.data?.results]);

  // Wizard state
  const [paymentMode, setPaymentMode] = useState<"Cash" | "GPay/UPI" | "">("");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    profileId: "", mobile: "", customerName: "",
    plan: "", amount: 0, discount: 0,
    physicalReceiptNo: "", cashierReceiptNo: "", cashCollected: 0,
    upiRefNo: "",
    otp: ["", "", "", ""],
    otpSent: false, otpVerified: false,
  });
  const [otpTimer, setOtpTimer] = useState(0);
  const [upiVerifying, setUpiVerifying] = useState(false);
  const [upiVerified, setUpiVerified] = useState(false);

  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  const finalAmount = form.amount - form.discount;
  const steps = paymentMode === "GPay/UPI" ? STEPS_UPI : STEPS_CASH;

  const resetWizard = () => {
    setPaymentMode("");
    setStep(0);
    setForm({ profileId: "", mobile: "", customerName: "", plan: "", amount: 0, discount: 0, physicalReceiptNo: "", cashierReceiptNo: "", cashCollected: 0, upiRefNo: "", otp: ["", "", "", ""], otpSent: false, otpVerified: false });
    setOtpTimer(0);
    setUpiVerifying(false);
    setUpiVerified(false);
  };

  const openNewPayment = () => { resetWizard(); setShowNewPayment(true); };

  const sendOtp = () => {
    setForm(f => ({ ...f, otpSent: true }));
    setOtpTimer(600);
    toast({ title: "OTP Sent", description: `Verification OTP sent to ${form.mobile || "customer mobile"}` });
  };

  const verifyOtp = () => {
    const code = form.otp.join("");
    if (code.length === 4) {
      setForm(f => ({ ...f, otpVerified: true }));
      toast({ title: "✓ Verified", description: "Customer OTP verified successfully" });
    }
  };

  const simulateUpiVerification = () => {
    setUpiVerifying(true);
    setTimeout(() => {
      setUpiVerifying(false);
      setUpiVerified(true);
      toast({ title: "✓ Payment Confirmed", description: "UPI payment verified via webhook" });
    }, 2500);
  };

  const createMut = useMutation({
    mutationFn: (body: {
      mode: StaffPaymentMode;
      customer_matri_id: string;
      plan_id: number;
      amount: number;
      reference_no?: string;
      notes?: string;
    }) => createStaffPayment(body),
    onSuccess: async (created) => {
      toast({ title: "Payment Recorded", description: `Receipt ${created.receipt_id}` });
      setShowNewPayment(false);
      resetWizard();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["staff", "payments", "summary"] }),
        qc.invalidateQueries({ queryKey: ["staff", "payments", "list"] }),
      ]);
    },
    onError: (e) => toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }),
  });

  const completePayment = () => {
    const plan = subscriptionPlans.find((p) => p.name === form.plan);
    if (!plan) {
      toast({ title: "Missing plan", description: "Please select a plan.", variant: "destructive" });
      return;
    }
    if (form.discount > 0) {
      toast({
        title: "Discount not supported",
        description: "Backend requires amount to match plan price. Remove discount to continue.",
        variant: "destructive",
      });
      return;
    }
    const mode: StaffPaymentMode = paymentMode === "Cash" ? "cash" : "gpay_upi";
    createMut.mutate({
      mode,
      customer_matri_id: form.profileId,
      plan_id: plan.id,
      amount: plan.price,
      reference_no: form.upiRefNo || undefined,
      notes: "",
    });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...form.otp];
    newOtp[index] = value;
    setForm(f => ({ ...f, otp: newOtp }));
    if (value && index < 3) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const canNext = () => {
    if (step === 0) return !!form.customerName && (!!form.profileId || !!form.mobile);
    if (step === 1) return !!form.plan;
    if (step === 2 && paymentMode === "Cash") return !!form.physicalReceiptNo && !!form.cashierReceiptNo;
    if (step === 2 && paymentMode === "GPay/UPI") return true;
    if (step === 3 && paymentMode === "Cash") return form.otpVerified;
    if (step === 3 && paymentMode === "GPay/UPI") return upiVerified;
    return true;
  };

  const filtered = payments;

  const downloadReceipt = (p: PaymentRecord) => {
    downloadStaffPaymentReceiptPdf(p.receiptNo).catch((e) =>
      toast({ title: "Download failed", description: (e as Error).message, variant: "destructive" }),
    );
  };

  const kpis = [
    { label: "Today's Cash", value: `₹${Number(summaryQ.data?.today_cash ?? 0).toLocaleString()}`, icon: Banknote, color: "text-success", bg: "bg-success/10" },
    { label: "Today's UPI/GPay", value: `₹${Number(summaryQ.data?.today_upi_gpay ?? 0).toLocaleString()}`, icon: Smartphone, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Today", value: `₹${Number(summaryQ.data?.total_today ?? 0).toLocaleString()}`, icon: IndianRupee, color: "text-accent-foreground", bg: "bg-accent/20" },
    { label: "Pending", value: String(summaryQ.data?.pending_count ?? 0), icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  ];

  // ───── Render Step Content ─────
  const renderStep = () => {
    // Step 1: Customer Details
    if (step === 0) return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <User className="h-8 w-8 text-primary" />
          <div>
            <p className="font-bold text-foreground">Customer Details</p>
            <p className="text-xs text-muted-foreground">Enter profile ID or mobile number to identify the customer</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profile ID / Mobile Number</Label>
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <Select
                value={form.profileId}
                onValueChange={(v) => {
                  const prof = staffProfilesQ.data?.results?.find((p) => p.matri_id === v);
                  setForm((f) => ({ ...f, profileId: v, customerName: prof?.name || f.customerName }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select Profile ID" /></SelectTrigger>
                <SelectContent>
                  {(staffProfilesQ.data?.results ?? []).map((p) => (
                    <SelectItem key={p.matri_id} value={p.matri_id}>
                      {p.matri_id} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Or enter mobile number" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer Name *</Label>
            <Input className="mt-1.5" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Full name of the customer" />
          </div>
        </div>
      </div>
    );

    // Step 2: Plan Selection
    if (step === 1) return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20">
          <CreditCard className="h-8 w-8 text-accent-foreground" />
          <div>
            <p className="font-bold text-foreground">Plan Selection</p>
            <p className="text-xs text-muted-foreground">Choose subscription plan and apply discount if any</p>
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subscription Plan *</Label>
          <Select value={form.plan} onValueChange={(v) => {
            const plan = subscriptionPlans.find(p => p.name === v);
            setForm(f => ({ ...f, plan: v, amount: plan?.price || 0 }));
          }}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose a plan" /></SelectTrigger>
            <SelectContent>
              {subscriptionPlans.filter(p => p.status === "active").map(p => (
                <SelectItem key={p.name} value={p.name}>{p.name} — {p.duration} — ₹{p.price.toLocaleString()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Discount (₹)</Label>
          <Input className="mt-1.5" type="number" value={form.discount || ""} onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) || 0 }))} placeholder="0" />
        </div>
        {form.plan && (
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Payment Summary</p>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan Amount</span><span>₹{form.amount.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="text-destructive">- ₹{form.discount.toLocaleString()}</span></div>
              <div className="border-t pt-2 flex justify-between text-base font-bold"><span>Total Payable</span><span className="text-primary">₹{finalAmount.toLocaleString()}</span></div>
            </CardContent>
          </Card>
        )}
      </div>
    );

    // Step 3 for Cash: Receipt & Cashier
    if (step === 2 && paymentMode === "Cash") return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
          <FileText className="h-8 w-8 text-success" />
          <div>
            <p className="font-bold text-foreground">Receipt & Cashier Verification</p>
            <p className="text-xs text-muted-foreground">Enter physical receipt details and cashier confirmation</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-warning font-medium">Issue receipt FIRST, then hand cash to cashier</p>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Physical Receipt Number *</Label>
            <Input className="mt-1.5" value={form.physicalReceiptNo} onChange={e => setForm(f => ({ ...f, physicalReceiptNo: e.target.value }))} placeholder="From receipt book (e.g. PH-006)" />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cashier Receipt Number *</Label>
            <Input className="mt-1.5" value={form.cashierReceiptNo} onChange={e => setForm(f => ({ ...f, cashierReceiptNo: e.target.value }))} placeholder="From branch cashier (e.g. CSH-006)" />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cash Collected (₹)</Label>
            <Input className="mt-1.5" type="number" value={form.cashCollected || finalAmount} onChange={e => setForm(f => ({ ...f, cashCollected: Number(e.target.value) }))} />
          </div>
        </div>
      </div>
    );

    // Step 3 for UPI: QR Payment
    if (step === 2 && paymentMode === "GPay/UPI") return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <QrCode className="h-8 w-8 text-primary" />
          <div>
            <p className="font-bold text-foreground">UPI / GPay Payment</p>
            <p className="text-xs text-muted-foreground">Customer scans company QR code to pay</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive font-semibold">Company UPI ONLY — No staff personal UPI allowed</p>
        </div>
        <div className="mx-auto max-w-[240px] p-6 border-2 border-dashed border-primary/30 rounded-2xl bg-gradient-to-b from-primary/5 to-background text-center">
          <QrCode className="h-24 w-24 mx-auto text-primary/60 mb-3" />
          <p className="font-bold text-foreground">Scan to Pay</p>
          <p className="text-xs text-muted-foreground mt-1">UPI ID: aiswarya.matrimony@upi</p>
          <Badge className="mt-2 bg-primary text-primary-foreground">₹{finalAmount.toLocaleString()}</Badge>
        </div>
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">UPI Transaction Ref (optional)</Label>
          <Input className="mt-1.5" value={form.upiRefNo} onChange={e => setForm(f => ({ ...f, upiRefNo: e.target.value }))} placeholder="Enter UPI transaction reference" />
        </div>
      </div>
    );

    // Step 4 for Cash: OTP Verification
    if (step === 3 && paymentMode === "Cash") return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-info/10 border border-info/20">
          <ShieldCheck className="h-8 w-8 text-info" />
          <div>
            <p className="font-bold text-foreground">Customer OTP Verification</p>
            <p className="text-xs text-muted-foreground">Confirm that customer authorized this payment</p>
          </div>
        </div>
        {!form.otpVerified ? (
          <div className="space-y-4">
            {!form.otpSent ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-muted-foreground">OTP will be sent to customer's registered mobile</p>
                <Button onClick={sendOtp} size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                  <Send className="h-4 w-4" /> Send OTP
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-3">
                  {form.otp.map((digit, i) => (
                    <Input key={i} id={`otp-${i}`} value={digit} onChange={e => handleOtpChange(i, e.target.value)}
                      maxLength={1} className="w-14 h-14 text-center text-2xl font-bold border-2 border-primary/30 focus:border-primary" />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span className={otpTimer < 60 ? "text-destructive font-semibold" : ""}>{formatTimer(otpTimer)}</span>
                  </div>
                  {otpTimer === 0 && (
                    <Button variant="ghost" size="sm" onClick={sendOtp} className="text-primary text-xs">Resend OTP</Button>
                  )}
                </div>
                <div className="text-center">
                  <Button onClick={verifyOtp} disabled={form.otp.join("").length < 4} className="gap-2 bg-success text-success-foreground">
                    <CheckCircle2 className="h-4 w-4" /> Verify OTP
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <p className="font-bold text-success text-lg">Customer Verified</p>
            <p className="text-sm text-muted-foreground">Payment authorization confirmed</p>
          </div>
        )}
      </div>
    );

    // Step 4 for UPI: Auto-verification
    if (step === 3 && paymentMode === "GPay/UPI") return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
          <ShieldCheck className="h-8 w-8 text-success" />
          <div>
            <p className="font-bold text-foreground">Payment Verification</p>
            <p className="text-xs text-muted-foreground">System auto-verifies UPI payment via webhook</p>
          </div>
        </div>
        {!upiVerified ? (
          <div className="text-center py-6 space-y-4">
            {!upiVerifying ? (
              <Button onClick={simulateUpiVerification} size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                <ShieldCheck className="h-4 w-4" /> Verify Payment
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="h-12 w-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Verifying UPI payment...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <p className="font-bold text-success text-lg">Payment Verified</p>
            <p className="text-sm text-muted-foreground">UPI payment confirmed via webhook simulation</p>
          </div>
        )}
      </div>
    );

    // Step 5: Success Confirmation
    if (step === 4) return (
      <div className="space-y-5">
        <div className="text-center py-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-success/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="h-10 w-10 text-success" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Payment Successful!</h3>
          <p className="text-sm text-muted-foreground mt-1">Transaction has been recorded to admin dashboard</p>
        </div>
        <Card className="border-2 border-success/30 bg-gradient-to-br from-success/5 to-background">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Receipt No</span><span className="font-mono font-bold">Auto-generated</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-semibold">{form.customerName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{form.plan}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span className="font-bold text-primary">₹{finalAmount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><Badge className={paymentMode === "Cash" ? "bg-success/20 text-success" : "bg-primary/20 text-primary"}>{paymentMode}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-success text-success-foreground gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</Badge></div>
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground">📱 Customer will receive SMS confirmation shortly</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cash & Digital Payment Entry</h1>
          <p className="text-muted-foreground text-sm mt-1">Record cash and GPay/UPI payments from customers</p>
        </div>
        <Button onClick={openNewPayment} className="gap-2 bg-gradient-to-r from-success to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
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

      {/* Payment Records Table */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Payment Records</CardTitle>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {["All", "Cash", "GPay/UPI"].map(f => (
                <Button key={f} variant={filterMode === f ? "default" : "outline"} size="sm" onClick={() => setFilterMode(f)} className="text-xs">{f}</Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead><TableHead>Customer</TableHead><TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Date</TableHead>
                <TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.receiptNo}>
                  <TableCell className="font-mono text-xs">{p.receiptNo}</TableCell>
                  <TableCell className="font-medium">{p.customerName}</TableCell>
                  <TableCell><Badge variant="outline">{p.plan}</Badge></TableCell>
                  <TableCell className="font-semibold">₹{p.finalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={p.paymentMode === "Cash" ? "bg-success/20 text-success" : "bg-primary/20 text-primary"}>
                      {p.paymentMode === "Cash" ? <Banknote className="h-3 w-3 mr-1" /> : <QrCode className="h-3 w-3 mr-1" />}
                      {p.paymentMode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.date}</TableCell>
                  <TableCell>
                    <Badge className={p.status === "verified" ? "bg-success text-success-foreground" : p.status === "completed" ? "bg-info text-info-foreground" : "bg-warning text-warning-foreground"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setViewPayment(p); setShowViewReceipt(true); }}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadReceipt(p)}><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ───── 5-Step Payment Wizard ───── */}
      <Dialog open={showNewPayment} onOpenChange={setShowNewPayment}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
          {/* Mode Selection */}
          {paymentMode === "" ? (
            <div className="p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl">New Payment Entry</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Select payment mode to begin</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "Cash" as const, label: "Cash Payment", desc: "Physical cash collection", icon: Banknote, gradient: "from-success/10 to-success/5 border-success/30 hover:border-success" },
                  { value: "GPay/UPI" as const, label: "GPay / UPI", desc: "Company QR code scan", icon: QrCode, gradient: "from-primary/10 to-primary/5 border-primary/30 hover:border-primary" },
                ].map(m => (
                  <button key={m.value} onClick={() => setPaymentMode(m.value)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 bg-gradient-to-br ${m.gradient} transition-all hover:shadow-lg`}>
                    <m.icon className="h-10 w-10" />
                    <span className="font-bold">{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Step Progress Header */}
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Step {step + 1} of {steps.length}
                  </p>
                  <Badge variant="outline" className="text-xs">{paymentMode}</Badge>
                </div>
                <Progress value={((step + 1) / steps.length) * 100} className="h-2" />
                <div className="flex justify-between mt-2">
                  {steps.map((s, i) => (
                    <span key={s} className={`text-[10px] ${i <= step ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="p-6 min-h-[340px]">
                {renderStep()}
              </div>

              {/* Navigation */}
              <div className="p-4 border-t flex justify-between">
                <Button variant="outline" onClick={() => step === 0 ? setPaymentMode("") : setStep(step - 1)} className="gap-1">
                  <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Change Mode" : "Back"}
                </Button>
                {step < 4 ? (
                  <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-1 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={completePayment} className="gap-1 bg-gradient-to-r from-success to-primary text-primary-foreground">
                    <CheckCircle2 className="h-4 w-4" /> Complete Payment
                  </Button>
                )}
              </div>
            </div>
          )}
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
                {[
                  { l: "Receipt No", v: viewPayment.receiptNo },
                  { l: "Date", v: viewPayment.date },
                  { l: "Customer", v: viewPayment.customerName },
                  { l: "Profile ID", v: viewPayment.profileId },
                  { l: "Plan", v: viewPayment.plan },
                  { l: "Amount", v: `₹${viewPayment.finalAmount.toLocaleString()}` },
                ].map(r => (
                  <div key={r.l}><Label className="text-muted-foreground text-xs">{r.l}</Label><p className="font-semibold">{r.v}</p></div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewReceipt(false)}>Close</Button>
            {viewPayment && <Button onClick={() => downloadReceipt(viewPayment)} className="gap-1"><Download className="h-3.5 w-3.5" /> Download</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
