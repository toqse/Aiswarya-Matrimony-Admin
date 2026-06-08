import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lock, CreditCard, Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import PaymentSuccessView from "@/components/PaymentSuccessView";

const PLANS = [
  {
    id: "silver",
    name: "Silver",
    price: "₹499",
    duration: "3 Months",
    features: ["View 10 contacts/day", "Send 10 Interests", "Basic Chat"],
    popular: false,
  },
  {
    id: "gold",
    name: "Gold",
    price: "₹999",
    duration: "6 Months",
    features: ["All Silver +", "Horoscope Access", "50 Interests/day", "Priority Listing"],
    popular: true,
  },
  {
    id: "diamond",
    name: "Diamond",
    price: "₹1999",
    duration: "12 Months",
    features: ["All Gold +", "Unlimited Contacts", "Unlimited Interests", "Porutham Score Matching", "Dedicated Manager"],
    popular: false,
  },
] as const;

const PAYMENT_METHODS = [
  { id: "gpay", label: "GPay", letter: "G" },
  { id: "phonepe", label: "PhonePe", letter: "P" },
  { id: "paytm", label: "Paytm", letter: "P" },
  { id: "credit", label: "Credit Card", icon: CreditCard },
  { id: "debit", label: "Debit Card", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", icon: Building2 },
] as const;

type Step = "choose" | "processing" | "success";

const PAYMENT_LABELS: Record<string, string> = {
  gpay: "GPay",
  phonepe: "PhonePe",
  paytm: "Paytm",
  credit: "Credit Card",
  debit: "Debit Card",
  netbanking: "Net Banking",
};

interface ChoosePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaySuccess?: () => void;
}

export default function ChoosePlanModal({
  open,
  onOpenChange,
  onPaySuccess,
}: ChoosePlanModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [progress, setProgress] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("gold");
  const [selectedPayment, setSelectedPayment] = useState<string>("gpay");

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) ?? PLANS[1];
  const paymentLabel = PAYMENT_LABELS[selectedPayment] ?? selectedPayment;

  // Reset step when modal opens/closes
  useEffect(() => {
    if (open) setStep("choose");
    else setProgress(0);
  }, [open]);

  // Processing: animate progress then show success
  useEffect(() => {
    if (step !== "processing") return;
    const start = Date.now();
    const duration = 2500;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(tick);
      else {
        setStep("success");
        const planName = PLANS.find((p) => p.id === selectedPlanId)?.name ?? "Gold";
        useAuthStore.getState().setPlan(planName);
        onPaySuccess?.();
      }
    };
    requestAnimationFrame(tick);
  }, [step, selectedPlanId, onPaySuccess]);

  const handlePayNow = () => {
    setStep("processing");
    setProgress(0);
  };

  const handleClose = () => {
    setStep("choose");
    onOpenChange(false);
  };

  const handleSetupHoroscope = () => {
    onOpenChange(false);
    router.push("/dashboard/jathagam");
  };

  if (step === "processing") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-2xl p-8 border border-primary/20 shadow-elevated bg-background">
          <div className="text-center py-6">
            <div className="inline-flex w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-4">
              <span className="text-2xl animate-spin">⟳</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-foreground">Processing payment...</h3>
            <p className="text-sm text-muted-foreground mt-1">Please wait</p>
            <Progress value={progress} className="mt-6 h-2" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === "success") {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl p-0 gap-0 border border-primary/20 shadow-elevated bg-background">
          <PaymentSuccessView
            planName={selectedPlan.name}
            price={selectedPlan.price}
            duration={selectedPlan.duration}
            transactionId={`TXN${Math.floor(10000000 + Math.random() * 90000000)}`}
            paymentVia={paymentLabel}
            features={[...selectedPlan.features]}
            showHoroscopeBanner
            onSetupHoroscope={handleSetupHoroscope}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl p-0 gap-0 border border-primary/20 shadow-elevated bg-background">
        <DialogHeader className="p-6 pb-2 border-b border-primary/10 relative">
          <DialogTitle className="font-serif text-2xl font-bold text-primary pr-10">
            Choose Your Plan
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Unlock unlimited matches, contacts and Horoscope access.
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-2 min-h-[420px]">
          {/* Left: SELECT PLAN */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-primary/10 bg-muted/30">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Select Plan
            </h3>
            <div className="space-y-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "w-full text-left rounded-xl border-2 p-4 transition-all relative",
                    selectedPlanId === plan.id && plan.popular
                      ? "border-secondary bg-white shadow-md"
                      : selectedPlanId === plan.id
                        ? "border-primary bg-white shadow-soft"
                        : "border-border bg-white/80 hover:border-primary/30"
                  )}
                >
                  {plan.popular && (
                    <span className="absolute top-2 right-2 px-2.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full">
                      POPULAR
                    </span>
                  )}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-serif font-bold text-foreground">{plan.name}</p>
                      <p className="text-lg font-bold text-primary mt-0.5">{plan.price}</p>
                      <p className="text-xs text-muted-foreground">{plan.duration}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {plan.features.map((f, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-foreground"
                        >
                          {f.includes("Horoscope") && (
                            <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
                          )}
                          {f}
                        </span>
                      ))}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-amber-100/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 flex gap-2">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">
                Gold &amp; Diamond plans include Horoscope access — Jathagam
                charts and Porutham scores for your matches.
              </p>
            </div>
          </div>

          {/* Right: PAYMETHOD */}
          <div className="p-6 flex flex-col">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Pay method
            </h3>
            <div className="grid grid-cols-3 gap-3 flex-1 content-start">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedPayment(method.id)}
                  className={cn(
                    "rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-1 transition-all min-h-[90px]",
                    selectedPayment === method.id
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  {"letter" in method ? (
                    <>
                      <span className={cn(
                        "text-2xl font-bold",
                        selectedPayment === method.id ? "text-primary" : "text-muted-foreground"
                      )}>
                        {method.letter}
                      </span>
                      <span className={cn(
                        "text-xs font-medium",
                        selectedPayment === method.id ? "text-primary" : "text-muted-foreground"
                      )}>
                        {method.label}
                      </span>
                    </>
                  ) : (
                    <>
                      <method.icon className={cn(
                        "w-8 h-8",
                        selectedPayment === method.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-xs font-medium",
                        selectedPayment === method.id ? "text-primary" : "text-muted-foreground"
                      )}>
                        {method.label}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Summary + Pay button */}
            <div className="mt-6 pt-4 border-t border-primary/10 space-y-3">
              <div>
                <p className="text-sm font-semibold text-primary">Selected: {selectedPlan.name} Plan</p>
                <p className="text-lg font-bold text-primary">{selectedPlan.price}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedPlan.duration} · Auto-renewal off · Instant activation
                </p>
              </div>
              <Button
                variant="default"
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold py-6"
                onClick={handlePayNow}
              >
                Pay Now {selectedPlan.price} →
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span>100% Secure Payment</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
