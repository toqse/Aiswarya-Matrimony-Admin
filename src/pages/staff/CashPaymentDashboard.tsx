import { useState, useEffect, useMemo, useCallback, type ClipboardEvent, type KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { digitsOnlyMobile, formatPhoneForApi } from "@/lib/phone";
import { formatDateTime } from "@/lib/format-date";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Banknote,
  Smartphone,
  QrCode,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Receipt,
  Search,
  Download,
  Eye,
  ArrowRight,
  ArrowLeft,
  User,
  CreditCard,
  FileText,
  ShieldCheck,
  PartyPopper,
  Send,
  Timer,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchPlans, type PlanRow } from "@/lib/admin-api/plans";
import {
  createPayment,
  downloadPaymentReceiptPdf,
  fetchPaymentCustomerLookup,
  fetchPaymentDetail,
  fetchPaymentsList,
  fetchPaymentsSummary,
  postPaymentCustomerOtpSend,
  postPaymentCustomerOtpVerify,
  postPaymentQuote,
  type StaffPaymentDetail,
  type StaffPaymentRow,
} from "@/lib/admin-api/staff-payments";
import { useRole } from "@/contexts/RoleContext";
import type { UserRole } from "@/types/user-role";
import { useLocation, useNavigate } from "react-router-dom";

export type CashEntryLocationState = {
  renewProfile?: { matri_id: string; name: string };
};

const STEPS_CASH = ["Customer Details", "Plan Selection", "Receipt & Cashier", "OTP Verification", "Confirmation"];
const STEPS_UPI = ["Customer Details", "Plan Selection", "UPI Payment", "Verification", "Confirmation"];

const PAYMENT_OTP_LENGTH = 6;

function emptyOtpDigits(): string[] {
  return Array.from({ length: PAYMENT_OTP_LENGTH }, () => "");
}

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatTimer(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function formatPlanDurationDays(days: number) {
  if (!days || days < 0) return "";
  if (days % 365 === 0) return `${days / 365} year${days === 365 ? "" : "s"}`;
  if (days % 30 === 0) return `${days / 30} months`;
  return `${days} days`;
}

function planOptionLabel(p: PlanRow) {
  const dur = formatPlanDurationDays(p.duration_days);
  return dur ? `${p.name} — ${dur} — ${formatInr(Number(p.price))}` : `${p.name} — ${formatInr(Number(p.price))}`;
}

export default function CashPaymentDashboard() {
  const queryClient = useQueryClient();
  const { role } = useRole();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const payRole: UserRole = role === "branch-manager" ? "branch-manager" : "staff";

  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showViewReceipt, setShowViewReceipt] = useState(false);
  const [viewReceiptId, setViewReceiptId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterMode, setFilterMode] = useState("All");
  const [listPage, setListPage] = useState(1);
  const [paymentRecorded, setPaymentRecorded] = useState<StaffPaymentDetail | null>(null);

  const [paymentMode, setPaymentMode] = useState<"Cash" | "GPay/UPI" | "">("");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    profileId: "",
    mobile: "",
    customerMatriId: "",
    customerName: "",
    planId: null as number | null,
    discount: 0,
    physicalReceiptNo: "",
    cashierReceiptNo: "",
    cashCollected: 0 as number | "",
    upiRefNo: "",
    otp: emptyOtpDigits(),
    otpSent: false,
    otpVerified: false,
  });
  const [otpTimer, setOtpTimer] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  /** Open payment wizard when staff arrives from My Profiles → Renew. */
  useEffect(() => {
    const st = location.state as CashEntryLocationState | undefined;
    const rp = st?.renewProfile;
    if (!rp?.matri_id) return;
    setPaymentMode("");
    setStep(0);
    setPaymentRecorded(null);
    setForm({
      profileId: rp.matri_id,
      mobile: "",
      customerMatriId: rp.matri_id,
      customerName: rp.name ?? "",
      planId: null,
      discount: 0,
      physicalReceiptNo: "",
      cashierReceiptNo: "",
      cashCollected: "",
      upiRefNo: "",
      otp: emptyOtpDigits(),
      otpSent: false,
      otpVerified: false,
    });
    setOtpTimer(0);
    setShowNewPayment(true);
    navigate(location.pathname, { replace: true, state: {} });
    toast({
      title: "Record payment",
      description: `Profile ${rp.matri_id} is filled in — choose Cash or UPI and complete the steps.`,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only when location.state includes renewProfile
  }, [location.state, location.pathname, navigate]);

  const modeFilter = useMemo(() => {
    if (filterMode === "Cash") return "cash" as const;
    if (filterMode === "GPay/UPI") return "gpay_upi" as const;
    return undefined;
  }, [filterMode]);

  useEffect(() => {
    setListPage(1);
  }, [debouncedSearch, filterMode]);

  const summaryQuery = useQuery({
    queryKey: ["payments-summary", payRole],
    queryFn: () => fetchPaymentsSummary(payRole),
  });

  const listQuery = useQuery({
    queryKey: ["payments-list", payRole, debouncedSearch, modeFilter, listPage],
    queryFn: () =>
      fetchPaymentsList(payRole, {
        search: debouncedSearch || undefined,
        mode: modeFilter,
        page: listPage,
        page_size: 20,
      }),
  });

  const plansQuery = useQuery({
    queryKey: ["admin-plans", "payment-wizard"],
    queryFn: () => fetchPlans(),
    enabled: showNewPayment && paymentMode !== "",
  });

  const quoteQuery = useQuery({
    queryKey: ["payments-quote", payRole, form.planId, form.discount],
    queryFn: () =>
      postPaymentQuote(payRole, {
        plan_id: form.planId!,
        discount_amount: form.discount > 0 ? form.discount : undefined,
      }),
    enabled: showNewPayment && form.planId != null,
  });

  const detailQuery = useQuery({
    queryKey: ["payments-detail", payRole, viewReceiptId],
    queryFn: () => fetchPaymentDetail(payRole, viewReceiptId!),
    enabled: showViewReceipt && !!viewReceiptId,
  });

  /** Only active plans are offered for new payment entry (admin API also returns inactive). */
  const plans = useMemo(() => (plansQuery.data ?? []).filter((p) => p.is_active), [plansQuery.data]);
  const selectedPlan = useMemo(() => plans.find((p) => p.id === form.planId), [plans, form.planId]);
  const planPrice = selectedPlan != null ? Number(selectedPlan.price) : 0;

  const finalAmount = useMemo(() => {
    if (quoteQuery.isSuccess && quoteQuery.data) {
      const q = quoteQuery.data;
      const t = q.total ?? q.total_payable ?? q.amount;
      if (t != null && !Number.isNaN(Number(t))) return Math.max(0, Number(t));
    }
    return Math.max(0, planPrice - (form.discount || 0));
  }, [quoteQuery.isSuccess, quoteQuery.data, planPrice, form.discount]);

  const planAmountDisplay = useMemo(() => {
    if (quoteQuery.isSuccess && quoteQuery.data) {
      const a = quoteQuery.data.plan_amount ?? quoteQuery.data.plan_price;
      if (a != null && !Number.isNaN(Number(a))) return Number(a);
    }
    return planPrice;
  }, [quoteQuery.isSuccess, quoteQuery.data, planPrice]);

  const discountDisplay = useMemo(() => {
    if (quoteQuery.isSuccess && quoteQuery.data && quoteQuery.data.discount_amount != null) {
      return Number(quoteQuery.data.discount_amount);
    }
    return form.discount || 0;
  }, [quoteQuery.isSuccess, quoteQuery.data, form.discount]);

  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  const steps = paymentMode === "GPay/UPI" ? STEPS_UPI : STEPS_CASH;

  const resetWizard = useCallback(() => {
    setPaymentMode("");
    setStep(0);
    setPaymentRecorded(null);
    setForm({
      profileId: "",
      mobile: "",
      customerMatriId: "",
      customerName: "",
      planId: null,
      discount: 0,
      physicalReceiptNo: "",
      cashierReceiptNo: "",
      cashCollected: "",
      upiRefNo: "",
      otp: emptyOtpDigits(),
      otpSent: false,
      otpVerified: false,
    });
    setOtpTimer(0);
  }, []);

  const openNewPayment = () => {
    resetWizard();
    createMut.reset();
    setShowNewPayment(true);
  };

  const normalizeMobileForLookup = (raw: string) => formatPhoneForApi(digitsOnlyMobile(raw));

  const lookupMut = useMutation({
    mutationFn: (params: { matri_id?: string; mobile?: string }) => fetchPaymentCustomerLookup(payRole, params),
    onSuccess: (c) => {
      setForm((f) => ({
        ...f,
        profileId: c.matri_id ?? f.profileId,
        mobile: c.mobile ?? f.mobile,
        customerName: c.name ?? f.customerName,
        customerMatriId: c.matri_id,
      }));
    },
    onError: (e: Error) =>
      toast({
        title: "Customer lookup failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  const sendOtpMut = useMutation({
    mutationFn: () =>
      postPaymentCustomerOtpSend(payRole, {
        customer_matri_id: form.customerMatriId || form.profileId.trim(),
      }),
    onSuccess: () => {
      setForm((f) => ({ ...f, otpSent: true, otp: emptyOtpDigits() }));
      setOtpTimer(600);
      toast({ title: "OTP sent", description: "Verification code sent to the customer's registered mobile." });
    },
    onError: (e: Error) =>
      toast({ title: "Could not send OTP", description: e.message, variant: "destructive" }),
  });

  const verifyOtpMut = useMutation({
    mutationFn: (otp: string) =>
      postPaymentCustomerOtpVerify(payRole, {
        customer_matri_id: form.customerMatriId || form.profileId.trim(),
        otp,
      }),
    onSuccess: () => {
      setForm((f) => ({ ...f, otpVerified: true }));
      toast({ title: "Verified", description: "Customer OTP verified successfully." });
    },
    onError: (e: Error) =>
      toast({ title: "OTP verification failed", description: e.message, variant: "destructive" }),
  });

  const createMut = useMutation({
    mutationFn: () => {
      const matri = (form.customerMatriId || form.profileId).trim();
      if (!form.planId) throw new Error("Select a subscription plan.");
      const mode = paymentMode === "Cash" ? ("cash" as const) : ("gpay_upi" as const);
      const body = {
        mode,
        customer_matri_id: matri,
        plan_id: form.planId,
        amount: finalAmount,
        discount_amount: form.discount > 0 ? form.discount : undefined,
        ...(mode === "cash"
          ? {
              physical_receipt_no: form.physicalReceiptNo.trim(),
              cashier_receipt_no: form.cashierReceiptNo.trim(),
              otp: form.otp.join(""),
            }
          : { reference_no: form.upiRefNo.trim() }),
      };
      return createPayment(payRole, body);
    },
    onSuccess: (data) => {
      setPaymentRecorded(data);
      queryClient.invalidateQueries({ queryKey: ["payments-list"] });
      queryClient.invalidateQueries({ queryKey: ["payments-summary"] });
      toast({ title: "Payment recorded", description: "The transaction has been saved." });
    },
  });

  const sendOtp = () => {
    const id = (form.customerMatriId || form.profileId).trim();
    if (!id) {
      toast({ title: "Missing customer", description: "Look up the customer first.", variant: "destructive" });
      return;
    }
    sendOtpMut.mutate();
  };

  const verifyOtp = () => {
    const code = form.otp.join("");
    if (code.length < PAYMENT_OTP_LENGTH) return;
    verifyOtpMut.mutate(code);
  };

  const applyOtpDigits = (digits: string, focusIndex?: number) => {
    const clean = digits.replace(/\D/g, "").slice(0, PAYMENT_OTP_LENGTH);
    const newOtp = emptyOtpDigits();
    for (let i = 0; i < clean.length; i++) newOtp[i] = clean[i] ?? "";
    setForm((f) => ({ ...f, otp: newOtp }));
    const next = Math.min(focusIndex ?? clean.length, PAYMENT_OTP_LENGTH - 1);
    requestAnimationFrame(() => document.getElementById(`otp-${next}`)?.focus());
  };

  const handleOtpChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length > 1) {
      applyOtpDigits(digitsOnly, index + digitsOnly.length - 1);
      return;
    }
    const newOtp = [...form.otp];
    newOtp[index] = digitsOnly;
    setForm((f) => ({ ...f, otp: newOtp }));
    if (digitsOnly && index < PAYMENT_OTP_LENGTH - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    const clean = text.replace(/\D/g, "");
    if (clean.length < 2) return;
    e.preventDefault();
    applyOtpDigits(clean, clean.length - 1);
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      e.preventDefault();
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const completePayment = () => {
    if (paymentRecorded) {
      setShowNewPayment(false);
      resetWizard();
      return;
    }
    createMut.mutate();
  };

  const cashCollectedNum =
    form.cashCollected === "" ? finalAmount : Number(form.cashCollected) || 0;

  const canNext = () => {
    if (paymentRecorded) return false;
    if (step === 0) return !!form.customerName.trim() && !!(form.customerMatriId || form.profileId).trim();
    if (step === 1) return form.planId != null;
    if (step === 2 && paymentMode === "Cash")
      return (
        !!form.physicalReceiptNo.trim() &&
        !!form.cashierReceiptNo.trim() &&
        cashCollectedNum > 0 &&
        Math.abs(cashCollectedNum - finalAmount) < 0.01
      );
    if (step === 2 && paymentMode === "GPay/UPI") return !!form.upiRefNo.trim();
    if (step === 3 && paymentMode === "Cash") return form.otpVerified;
    if (step === 3 && paymentMode === "GPay/UPI") return true;
    return true;
  };

  const canSubmitPayment = () => {
    const matri = (form.customerMatriId || form.profileId).trim();
    if (!matri || !form.customerName.trim() || form.planId == null || finalAmount <= 0) return false;
    if (paymentMode === "Cash") {
      return (
        !!form.physicalReceiptNo.trim() &&
        !!form.cashierReceiptNo.trim() &&
        form.otpVerified &&
        form.otp.join("").length >= PAYMENT_OTP_LENGTH &&
        Math.abs(cashCollectedNum - finalAmount) < 0.01
      );
    }
    return !!form.upiRefNo.trim();
  };

  const openDetail = (row: StaffPaymentRow) => {
    setViewReceiptId(row.receipt_id);
    setShowViewReceipt(true);
  };

  const downloadRowPdf = async (receiptId: string) => {
    try {
      await downloadPaymentReceiptPdf(payRole, receiptId);
    } catch (e) {
      toast({
        title: "Download failed",
        description: e instanceof Error ? e.message : "Could not download receipt.",
        variant: "destructive",
      });
    }
  };

  const kpis = useMemo(() => {
    const s = summaryQuery.data;
    return [
      { label: "Today's Cash", value: s ? formatInr(s.today_cash) : "—", icon: Banknote, color: "text-success", bg: "bg-success/10" },
      { label: "Today's UPI/GPay", value: s ? formatInr(s.today_upi_gpay) : "—", icon: Smartphone, color: "text-primary", bg: "bg-primary/10" },
      { label: "Total Today", value: s ? formatInr(s.total_today) : "—", icon: IndianRupee, color: "text-accent-foreground", bg: "bg-accent/20" },
      { label: "Pending", value: s ? String(s.pending_count) : "—", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    ];
  }, [summaryQuery.data]);

  const renderStep = () => {
    if (step === 0)
      return (
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
                <Input
                  placeholder="Enter Profile ID (e.g. AM100001)"
                  value={form.profileId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      profileId: e.target.value,
                      mobile: "",
                    }))
                  }
                />
                <PhoneInput
                  value={form.mobile}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      mobile: v,
                      profileId: "",
                    }))
                  }
                  placeholder="Or enter mobile number"
                />
              </div>
              <div className="flex items-center justify-end mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (form.profileId.trim()) {
                      lookupMut.mutate({ matri_id: form.profileId.trim() });
                      return;
                    }
                    const m = normalizeMobileForLookup(form.mobile);
                    if (m.startsWith("+91") && m.length === 13) {
                      lookupMut.mutate({ mobile: m });
                      return;
                    }
                    toast({
                      title: "Missing input",
                      description: "Enter Profile ID or a valid 10-digit mobile number to look up.",
                      variant: "destructive",
                    });
                  }}
                  disabled={lookupMut.isPending}
                >
                  {lookupMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Lookup
                </Button>
              </div>
              {lookupMut.isPending && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5 animate-spin" />
                  Looking up customer…
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer Name *</Label>
              <Input
                className="mt-1.5"
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                placeholder="Full name of the customer"
              />
            </div>
          </div>
        </div>
      );

    if (step === 1)
      return (
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
            <Select
              value={form.planId != null ? String(form.planId) : ""}
              onValueChange={(v) => {
                const id = Number(v);
                setForm((f) => ({ ...f, planId: Number.isFinite(id) ? id : null }));
              }}
              disabled={plansQuery.isLoading || plans.length === 0}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={plansQuery.isLoading ? "Loading plans…" : "Choose a plan"} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {planOptionLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {plansQuery.isError && (
              <p className="text-xs text-destructive mt-1">Could not load plans. Check your connection or permissions.</p>
            )}
            {plansQuery.isSuccess && (plansQuery.data?.length ?? 0) > 0 && plans.length === 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                No active plans to sell. Plans exist but are inactive — enable at least one plan in admin.
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Discount (₹)</Label>
            <Input
              className="mt-1.5"
              type="number"
              value={form.discount || ""}
              onChange={(e) => setForm((f) => ({ ...f, discount: Number(e.target.value) || 0 }))}
              placeholder="0"
            />
          </div>
          {form.planId != null && (
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Payment Summary</p>
                {quoteQuery.isFetching && <p className="text-xs text-muted-foreground">Updating totals…</p>}
                {quoteQuery.isError && (
                  <p className="text-xs text-destructive">Quote unavailable — totals shown from plan and discount only.</p>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan Amount</span>
                  <span>{formatInr(planAmountDisplay)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-destructive">- {formatInr(discountDisplay)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-base font-bold">
                  <span>Total Payable</span>
                  <span className="text-primary">{formatInr(finalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );

    if (step === 2 && paymentMode === "Cash")
      return (
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
              <Input
                className="mt-1.5"
                value={form.physicalReceiptNo}
                onChange={(e) => setForm((f) => ({ ...f, physicalReceiptNo: e.target.value }))}
                placeholder="From receipt book (e.g. PH-006)"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cashier Receipt Number *</Label>
              <Input
                className="mt-1.5"
                value={form.cashierReceiptNo}
                onChange={(e) => setForm((f) => ({ ...f, cashierReceiptNo: e.target.value }))}
                placeholder="From branch cashier (e.g. CSH-006)"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cash Collected (₹)</Label>
              <Input
                className="mt-1.5"
                type="number"
                value={form.cashCollected === "" ? finalAmount : form.cashCollected}
                onChange={(e) => setForm((f) => ({ ...f, cashCollected: e.target.value === "" ? "" : Number(e.target.value) }))}
              />
              <p className="text-[11px] text-muted-foreground mt-1">Must match total payable ({formatInr(finalAmount)}).</p>
            </div>
          </div>
        </div>
      );

    if (step === 2 && paymentMode === "GPay/UPI")
      return (
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
            <p className="text-xs text-muted-foreground mt-1">Amount due</p>
            <Badge className="mt-2 bg-primary text-primary-foreground">{formatInr(finalAmount)}</Badge>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">UPI transaction reference *</Label>
            <Input
              className="mt-1.5"
              value={form.upiRefNo}
              onChange={(e) => setForm((f) => ({ ...f, upiRefNo: e.target.value }))}
              placeholder="UPI ref / transaction ID from customer app"
            />
          </div>
        </div>
      );

    if (step === 3 && paymentMode === "Cash")
      return (
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
                  <p className="text-sm text-muted-foreground">OTP will be sent to customer&apos;s registered mobile</p>
                  <Button
                    onClick={sendOtp}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground"
                    disabled={sendOtpMut.isPending}
                  >
                    {sendOtpMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send OTP
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-center text-xs text-muted-foreground">Enter the {PAYMENT_OTP_LENGTH}-digit code (you can paste all digits at once)</p>
                  <div
                    className="grid grid-cols-6 gap-1.5 sm:gap-2 max-w-md mx-auto"
                    onPaste={handleOtpPaste}
                  >
                    {form.otp.map((digit, i) => (
                      <Input
                        key={i}
                        id={`otp-${i}`}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        maxLength={1}
                        className="h-11 sm:h-12 min-w-0 w-full px-0 text-center text-lg sm:text-xl font-bold border-2 border-primary/30 focus:border-primary"
                        aria-label={`Digit ${i + 1} of ${PAYMENT_OTP_LENGTH}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span className={otpTimer < 60 ? "text-destructive font-semibold" : ""}>{formatTimer(otpTimer)}</span>
                    </div>
                    {otpTimer === 0 && (
                      <Button variant="ghost" size="sm" onClick={sendOtp} className="text-primary text-xs" disabled={sendOtpMut.isPending}>
                        Resend OTP
                      </Button>
                    )}
                  </div>
                  <div className="text-center">
                    <Button
                      onClick={verifyOtp}
                      disabled={form.otp.join("").length < PAYMENT_OTP_LENGTH || verifyOtpMut.isPending}
                      className="gap-2 bg-success text-success-foreground"
                    >
                      {verifyOtpMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Verify OTP
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

    if (step === 3 && paymentMode === "GPay/UPI")
      return (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
            <ShieldCheck className="h-8 w-8 text-success" />
            <div>
              <p className="font-bold text-foreground">Payment verification</p>
              <p className="text-xs text-muted-foreground">Confirm the UPI reference before recording the payment</p>
            </div>
          </div>
          <div className="rounded-lg border p-4 text-sm space-y-2 bg-muted/30">
            <div className="flex justify-between">
              <span className="text-muted-foreground">UPI reference</span>
              <span className="font-mono font-medium">{form.upiRefNo || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{formatInr(finalAmount)}</span>
            </div>
          </div>
        </div>
      );

    if (step === 4) {
      if (paymentRecorded) {
        const d = paymentRecorded;
        return (
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt No</span>
                  <span className="font-mono font-bold">{d.receipt_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-semibold">{d.customer?.name ?? form.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span>{d.plan?.name ?? selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-bold text-primary">{formatInr(Number(d.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <Badge className={d.mode === "cash" ? "bg-success/20 text-success" : "bg-primary/20 text-primary"}>
                    {d.mode_label || (d.mode === "cash" ? "Cash" : "GPay/UPI")}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-success text-success-foreground gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {d.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-center text-muted-foreground">Customer will receive SMS confirmation shortly</p>
          </div>
        );
      }

      return (
        <div className="space-y-5">
          <div className="text-center py-2">
            <h3 className="text-lg font-bold text-foreground">Review & confirm</h3>
            <p className="text-sm text-muted-foreground mt-1">Check details, then record this payment.</p>
          </div>
          <Card className="border border-border">
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-semibold">{form.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profile ID</span>
                <span className="font-mono">{(form.customerMatriId || form.profileId).trim() || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span>{selectedPlan?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-primary">{formatInr(finalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span>{paymentMode}</span>
              </div>
              {paymentMode === "Cash" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Physical receipt</span>
                    <span className="font-mono text-xs">{form.physicalReceiptNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cashier receipt</span>
                    <span className="font-mono text-xs">{form.cashierReceiptNo}</span>
                  </div>
                </>
              )}
              {paymentMode === "GPay/UPI" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UPI reference</span>
                  <span className="font-mono text-xs">{form.upiRefNo}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return null;
  };

  const results = listQuery.data?.results ?? [];
  const totalCount = listQuery.data?.count ?? 0;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cash & Digital Payment Entry</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {summaryQuery.data?.subtitle ?? "Record cash and GPay/UPI payments from customers"}
          </p>
        </div>
        <Button
          onClick={openNewPayment}
          className="gap-2 bg-gradient-to-r from-success to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="h-4 w-4" /> New Payment Entry
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>
                  {summaryQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin opacity-60" /> : k.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" /> Payment Records
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {["All", "Cash", "GPay/UPI"].map((f) => (
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
                <TableHead>Receipt</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
                    Loading payments…
                  </TableCell>
                </TableRow>
              ) : listQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-destructive py-6">
                    {(listQuery.error as Error)?.message ?? "Failed to load payments."}
                  </TableCell>
                </TableRow>
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No payment records found.
                  </TableCell>
                </TableRow>
              ) : (
                results.map((p) => (
                  <TableRow key={p.receipt_id}>
                    <TableCell className="font-mono text-xs">{p.receipt_id}</TableCell>
                    <TableCell className="font-medium">
                      {p.customer?.name}
                      <span className="block text-[10px] text-muted-foreground font-mono">{p.customer?.matri_id}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.plan?.name}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatInr(Number(p.amount))}</TableCell>
                    <TableCell>
                      <Badge className={p.mode === "cash" ? "bg-success/20 text-success" : "bg-primary/20 text-primary"}>
                        {p.mode === "cash" ? <Banknote className="h-3 w-3 mr-1" /> : <QrCode className="h-3 w-3 mr-1" />}
                        {p.mode_label || (p.mode === "cash" ? "Cash" : "GPay/UPI")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.created_at ? formatDateTime(p.created_at) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          p.status === "verified"
                            ? "bg-success text-success-foreground"
                            : p.status === "completed"
                              ? "bg-info text-info-foreground"
                              : "bg-warning text-warning-foreground"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetail(p)} title="Details">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadRowPdf(p.receipt_id)} title="Receipt PDF">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalCount > pageSize && (
            <div className="flex justify-end items-center gap-2 mt-4 text-sm">
              <Button variant="outline" size="sm" disabled={listPage <= 1} onClick={() => setListPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {listPage} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={listPage >= totalPages} onClick={() => setListPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showNewPayment}
        onOpenChange={(o) => {
          setShowNewPayment(o);
          if (!o) {
            resetWizard();
            createMut.reset();
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
          {paymentMode === "" ? (
            <div className="p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl">New Payment Entry</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Select payment mode to begin</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    value: "Cash" as const,
                    label: "Cash Payment",
                    desc: "Physical cash collection",
                    icon: Banknote,
                    gradient: "from-success/10 to-success/5 border-success/30 hover:border-success",
                  },
                  {
                    value: "GPay/UPI" as const,
                    label: "GPay / UPI",
                    desc: "Company QR code scan",
                    icon: QrCode,
                    gradient: "from-primary/10 to-primary/5 border-primary/30 hover:border-primary",
                  },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPaymentMode(m.value)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 bg-gradient-to-br ${m.gradient} transition-all hover:shadow-lg`}
                  >
                    <m.icon className="h-10 w-10" />
                    <span className="font-bold">{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Step {step + 1} of {steps.length}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {paymentMode}
                  </Badge>
                </div>
                <Progress value={((step + 1) / steps.length) * 100} className="h-2" />
                <div className="flex justify-between mt-2 gap-1 overflow-x-auto">
                  {steps.map((s, i) => (
                    <span key={s} className={`text-[10px] shrink-0 ${i <= step ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 min-h-[340px]">{renderStep()}</div>

              {createMut.isError && (
                <div className="px-6 pb-2">
                  <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      {(createMut.error as Error)?.message ||
                        "Payment failed. Please try again."}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 border-t flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (paymentRecorded) return;
                    if (createMut.isError) createMut.reset();
                    if (step === 0) setPaymentMode("");
                    else {
                      setStep(step - 1);
                      if (step === 4) setPaymentRecorded(null);
                    }
                  }}
                  className="gap-1"
                  disabled={createMut.isPending || !!paymentRecorded}
                >
                  <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Change Mode" : "Back"}
                </Button>
                {step < 4 ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    disabled={!canNext()}
                    className="gap-1 bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={completePayment}
                    disabled={createMut.isPending || (!paymentRecorded && !canSubmitPayment())}
                    className="gap-1 bg-gradient-to-r from-success to-primary text-primary-foreground"
                  >
                    {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {paymentRecorded ? "Done" : "Complete Payment"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showViewReceipt}
        onOpenChange={(o) => {
          setShowViewReceipt(o);
          if (!o) setViewReceiptId(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment — {viewReceiptId}</DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {detailQuery.isError && (
            <p className="text-sm text-destructive">{(detailQuery.error as Error)?.message ?? "Could not load payment."}</p>
          )}
          {detailQuery.data && (
            <div className="space-y-3 text-sm">
              <div className="text-center border-b pb-3">
                <h3 className="font-bold text-lg">Aiswarya Matrimony</h3>
                <p className="text-xs text-muted-foreground">Payment receipt</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Receipt No", v: detailQuery.data.receipt_id },
                  { l: "Date", v: detailQuery.data.created_at ? formatDateTime(detailQuery.data.created_at) : "—" },
                  { l: "Customer", v: detailQuery.data.customer?.name ?? "—" },
                  { l: "Profile ID", v: detailQuery.data.customer?.matri_id ?? "—" },
                  { l: "Plan", v: detailQuery.data.plan?.name ?? "—" },
                  { l: "Amount", v: formatInr(Number(detailQuery.data.amount)) },
                  { l: "Mode", v: detailQuery.data.mode_label ?? detailQuery.data.mode },
                  { l: "Status", v: detailQuery.data.status },
                ].map((r) => (
                  <div key={r.l}>
                    <Label className="text-muted-foreground text-xs">{r.l}</Label>
                    <p className="font-semibold">{r.v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewReceipt(false)}>
              Close
            </Button>
            {viewReceiptId && (
              <Button onClick={() => downloadRowPdf(viewReceiptId)} className="gap-1">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
