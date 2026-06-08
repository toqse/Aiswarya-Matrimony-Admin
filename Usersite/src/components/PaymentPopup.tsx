import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Smartphone, Building2, Wallet, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { purchasePlan, type PaymentMethod, type AvailablePlan } from "@/lib/plansApi";
import { toast } from "sonner";

interface PaymentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Real API plan object (preferred over defaultPlanId). */
  apiPlan?: AvailablePlan;
  /** Legacy: 0-based index into static plansData (ignored when apiPlan is set). */
  defaultPlanId?: number;
  /** Called after a successful purchase (e.g. refetch my plan + plans list). */
  onPurchaseSuccess?: () => void | Promise<void>;
}

const paymentMethods = [
  { id: "upi", label: "UPI", icon: Smartphone, desc: "GPay, PhonePe, Paytm" },
  { id: "card", label: "Card", icon: CreditCard, desc: "Credit / Debit card" },
  { id: "netbanking", label: "Net Banking", icon: Building2, desc: "All major banks" },
  { id: "wallet", label: "Wallet", icon: Wallet, desc: "Paytm, Amazon Pay" },
];

const formatPrice = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

const buildApiFeatures = (plan: AvailablePlan): string[] => {
  const list: string[] = [];
  if (plan.profile_view_limit > 0) list.push(`${plan.profile_view_limit} Profile Views`);
  if (plan.interest_limit > 0) list.push(`${plan.interest_limit} Interest Sends`);
  if (plan.contact_view_limit > 0) list.push(`${plan.contact_view_limit} Contact Views`);
  if (plan.chat_limit > 0) list.push(`${plan.chat_limit} Chat Starts`);
  if (plan.horoscope_match_limit > 0) list.push(`${plan.horoscope_match_limit} Horoscope Matches`);
  return list;
};

const PaymentPopup = ({ open, onOpenChange, apiPlan, onPurchaseSuccess }: PaymentPopupProps) => {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedPayment(null);
    setSubmitting(false);
  }, [apiPlan, open]);

  if (!apiPlan) return null;

  const priceLabel = formatPrice(apiPlan.price);
  const activationLabel = apiPlan.first_payment > 0
    ? formatPrice(apiPlan.first_payment)
    : priceLabel;

  const features = buildApiFeatures(apiPlan);

  const handlePay = async () => {
    if (!selectedPayment || !apiPlan) return;
    setSubmitting(true);
    try {
      const res = await purchasePlan(apiPlan.id, selectedPayment);
      toast.success(res.message ?? "Plan purchased successfully.");
      await onPurchaseSuccess?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to purchase plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-3xl p-0 gap-0 border-0 shadow-elevated">
        <DialogHeader className="p-6 pb-4 border-b border-primary/10">
          <DialogTitle className="font-serif text-xl font-bold text-secondary">
            Complete your purchase
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 min-h-[420px]">
          {/* Left: selected plan summary */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-primary/10 bg-accent-rose/5 flex flex-col">
            <h3 className="font-serif font-bold text-foreground mb-4">Selected plan</h3>
            <div className="rounded-2xl border-2 border-primary bg-white shadow-soft p-4 flex flex-col gap-3">
              <span className="font-serif font-bold text-foreground text-lg">{apiPlan.name}</span>
              {apiPlan.description && (
                <p className="text-sm text-muted-foreground">{apiPlan.description}</p>
              )}
              <div>
                <p className="font-serif text-2xl font-bold text-primary">{priceLabel}</p>
                {apiPlan.duration_days > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Valid for {apiPlan.duration_days} days
                  </p>
                )}
              </div>
              {apiPlan.first_payment > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800">
                  <span className="font-semibold">Pay now:</span> {formatPrice(apiPlan.first_payment)}<br />
                  <span className="text-green-600">
                    Remaining service charge: {formatPrice(apiPlan.service_charge_remaining)}
                  </span>
                </div>
              )}
              <ul className="space-y-1 text-sm text-foreground">
                {features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: payment method */}
          <div className="p-6 flex flex-col">
            <h3 className="font-serif font-bold text-foreground mb-4">Payment method</h3>
            <div className="grid grid-cols-2 gap-3 flex-1 content-start">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id as PaymentMethod)}
                  className={cn(
                    "rounded-2xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all min-h-[100px]",
                    selectedPayment === method.id
                      ? "border-primary bg-accent-rose/30 shadow-soft"
                      : "border-primary/10 bg-white hover:border-primary/30"
                  )}
                >
                  <method.icon className="w-8 h-8 text-primary" />
                  <span className="font-medium text-sm text-foreground">{method.label}</span>
                  <span className="text-xs text-muted-foreground">{method.desc}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>Secure payment. Your data is encrypted.</span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Button
                variant="hero"
                className="flex-1"
                disabled={!selectedPayment || submitting}
                onClick={handlePay}
              >
                {submitting ? "Processing..." : `Pay ${activationLabel}`}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentPopup;
