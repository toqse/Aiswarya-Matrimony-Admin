import { Check, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaymentSuccessViewProps {
  planName: string;
  price: string;
  duration: string;
  transactionId: string;
  paymentVia: string;
  features: string[];
  /** Show Horoscope Access Unlocked banner and "Set Up My Horoscope Now". */
  showHoroscopeBanner: boolean;
  onSetupHoroscope: () => void;
  onClose: () => void;
}

export default function PaymentSuccessView({
  planName,
  price,
  duration,
  transactionId,
  paymentVia,
  features,
  showHoroscopeBanner,
  onSetupHoroscope,
  onClose,
}: PaymentSuccessViewProps) {
  return (
    <div className="rounded-2xl overflow-hidden bg-background">
      {/* Green header */}
      <div className="bg-green-600 text-white text-center py-8 px-6">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
          <Check className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-serif">Payment Successful!</h2>
        <p className="text-white/90 text-sm mt-1">
          {planName} Plan - {price} - {duration}
        </p>
      </div>

      {/* Transaction summary card */}
      <div className="p-6 bg-accent-rose/10 border-b border-primary/10">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <p className="text-muted-foreground uppercase text-xs font-semibold">Plan</p>
            <p className="font-bold text-foreground">{planName}</p>
          </div>
          <div>
            <p className="text-muted-foreground uppercase text-xs font-semibold">Amount</p>
            <p className="font-bold text-foreground">{price}</p>
          </div>
          <div>
            <p className="text-muted-foreground uppercase text-xs font-semibold">Duration</p>
            <p className="font-bold text-foreground">{duration}</p>
          </div>
          <div>
            <p className="text-muted-foreground uppercase text-xs font-semibold">Payment Via</p>
            <p className="font-bold text-foreground">{paymentVia}</p>
          </div>
          <div>
            <p className="text-muted-foreground uppercase text-xs font-semibold">Transaction ID</p>
            <p className="font-bold text-foreground">{transactionId}</p>
          </div>
          <div>
            <p className="text-muted-foreground uppercase text-xs font-semibold">Status</p>
            <p className="font-bold text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Confirmed
            </p>
          </div>
        </div>
      </div>

      {/* Features Unlocked */}
      <div className="p-6 border-b border-primary/10">
        <h3 className="font-serif font-bold text-foreground mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-secondary" />
          Features Unlocked:
        </h3>
        <ul className="space-y-2">
          {features.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-2 py-2 px-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/30"
            >
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-foreground flex items-center gap-1">
                {f.includes("Horoscope") && <Sparkles className="w-4 h-4 text-primary" />}
                {f}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Horoscope Access Unlocked */}
      {showHoroscopeBanner && (
        <div className="p-6 bg-primary text-primary-foreground">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">Horoscope Access Unlocked for You!</h3>
              <p className="text-sm text-white/90 mt-1">
                Add Rasi, Nakshatra, and birth details to generate your Jathagam
                PDF and get Porutham compatibility scores with your matches.
              </p>
              <Button
                variant="gold"
                size="lg"
                className="mt-4 gap-2 font-semibold"
                onClick={onSetupHoroscope}
              >
                <Sparkles className="w-5 h-5" />
                Set Up My Horoscope Now →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6 flex flex-wrap gap-3">
        {!showHoroscopeBanner && (
          <Button variant="hero" className="flex-1" onClick={onClose}>
            Go to Dashboard
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          {showHoroscopeBanner ? "Close" : "Done"}
        </Button>
      </div>
    </div>
  );
}
