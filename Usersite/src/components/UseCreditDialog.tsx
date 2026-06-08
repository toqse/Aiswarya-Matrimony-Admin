import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle } from "lucide-react";

export type CreditDialogVariant = "horoscope" | "contact";

interface UseCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remaining: number;
  quota: number;
  variant: CreditDialogVariant;
  onConfirm: () => void;
  onUpgrade: () => void;
}

const label = (v: CreditDialogVariant) =>
  v === "horoscope" ? "horoscope matches" : "contact views";

export default function UseCreditDialog({
  open,
  onOpenChange,
  remaining,
  quota,
  variant,
  onConfirm,
  onUpgrade,
}: UseCreditDialogProps) {
  const isExhausted = remaining <= 0;
  const isLow = remaining > 0 && remaining <= 2;

  const handleUseOne = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleUpgrade = () => {
    onOpenChange(false);
    onUpgrade();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            {isExhausted ? (
              <AlertTriangle className="w-5 h-5 text-secondary" />
            ) : (
              <Sparkles className="w-5 h-5 text-primary" />
            )}
            {isExhausted
              ? `No ${label(variant)} left`
              : isLow
                ? `Only ${remaining} ${label(variant)} remaining` 
                : `Use 1 ${label(variant).replace("es", "").replace("s", "")}?`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {isExhausted && (
            <p className="text-sm text-muted-foreground">
              You&apos;ve used all {quota} {label(variant)}. Upgrade your plan to
              continue.
            </p>
          )}
          {isLow && !isExhausted && (
            <p className="text-sm text-muted-foreground">
              Only {remaining} {label(variant)} remaining! Upgrade to Gold for 30{" "}
              {variant === "horoscope" ? "matches" : "views"}.
            </p>
          )}
          {!isExhausted && !isLow && (
            <p className="text-sm text-muted-foreground">
              You have {remaining} {label(variant)} remaining. Use one now?
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {!isExhausted && (
              <Button variant="hero" size="sm" onClick={handleUseOne}>
                Use 1
              </Button>
            )}
            <Button
              variant={isExhausted ? "hero" : "outline"}
              size="sm"
              onClick={handleUpgrade}
            >
              {isExhausted ? "Upgrade plan" : "Upgrade"}
            </Button>
            {!isExhausted && !isLow && (
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
