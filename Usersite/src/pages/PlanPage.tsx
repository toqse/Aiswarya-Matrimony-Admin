"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Star,
  Crown,
  Sparkles,
  ArrowRight,
  Zap,
  Award,
  Check,
  Loader2,
  CalendarDays,
  Eye,
  Heart,
  MessageCircle,
  IndianRupee,
} from "lucide-react";
import PaymentPopup from "@/components/PaymentPopup";
import {
  getAvailablePlans,
  getMyPlan,
  type AvailablePlan,
  type MyPlanDetails,
} from "@/lib/plansApi";
import { formatDateDdMmYyyy } from "@/lib/utils";

/* ─── Styling map by plan name ──────────────────────────────── */
type PlanStyle = {
  icon: React.ElementType;
  iconBg: string;
  cardBg: string;
  cardBorder: string;
  titleColor: string;
  checkColor: string;
  badge: "special" | "best-value" | "top" | null;
};

const getPlanStyle = (
  name: string,
  index: number,
  total: number,
): PlanStyle => {
  const n = name.toLowerCase();

  if (n.includes("special") || n.includes("trial"))
    return {
      icon: Zap,
      iconBg: "bg-gradient-to-br from-pink-400 to-pink-600",
      cardBg: "bg-gradient-to-b from-pink-50 via-rose-50 to-pink-50",
      cardBorder: "border-pink-300",
      titleColor: "text-foreground",
      checkColor: "text-pink-600",
      badge: "special",
    };
  if (n.includes("silver"))
    return {
      icon: Star,
      iconBg: "bg-gradient-to-b from-sky-300 to-blue-500",
      cardBg: "bg-gradient-to-b from-sky-50 via-blue-50 to-indigo-50",
      cardBorder: "border-blue-200",
      titleColor: "text-foreground",
      checkColor: "text-blue-600",
      badge: null,
    };
  if (n.includes("gold"))
    return {
      icon: Crown,
      iconBg: "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500",
      cardBg: "bg-gradient-to-b from-amber-50 via-[#FFFEE8] to-amber-50",
      cardBorder: "border-amber-300",
      titleColor: "text-amber-700",
      checkColor: "text-amber-600",
      badge: "best-value",
    };
  if (n.includes("premium") || n.includes("diamond"))
    return {
      icon: Sparkles,
      iconBg: "bg-gradient-to-b from-[#FFC75E] to-[#FFA500]",
      cardBg: "bg-[#FFF6EE]",
      cardBorder: "border-orange-200",
      titleColor: "text-orange-700",
      checkColor: "text-orange-500",
      badge: "best-value",
    };
  if (n.includes("ultimate") || n.includes("platinum"))
    return {
      icon: Award,
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-400",
      cardBg: "bg-gradient-to-b from-purple-50 via-violet-50 to-purple-50",
      cardBorder: "border-purple-300",
      titleColor: "text-purple-700",
      checkColor: "text-purple-600",
      badge: "top",
    };

  /* fallback: last plan → top badge, middle → best-value */
  const badge =
    index === total - 1
      ? "top"
      : index === Math.floor(total / 2)
        ? "best-value"
        : null;

  return {
    icon: Star,
    iconBg: "bg-gradient-to-br from-primary/80 to-primary",
    cardBg: "bg-white",
    cardBorder: "border-primary/10",
    titleColor: "text-foreground",
    checkColor: "text-primary",
    badge,
  };
};

/* ─── Feature list builder ──────────────────────────────────── */
const buildFeatures = (plan: AvailablePlan) => {
  const list: string[] = [];
  if (plan.horoscope_match_limit > 0)
    list.push(`Up to ${plan.horoscope_match_limit} horoscope matches`);
  if (plan.contact_view_limit > 0)
    list.push(`${plan.contact_view_limit} Up to Contact View`);
  if (plan.interest_limit > 0) list.push("Send interests to profiles");
  if (plan.chat_limit > 0) list.push("Chat with matches");
  list.push("Profile visibility");
  return list;
};

/* ─── Duration label ────────────────────────────────────────── */
const durationLabel = (days: number) => {
  if (!days) return "";
  const months = Math.round(days / 30);
  if (months >= 12) return `/ ${Math.round(months / 12)} Year`;
  if (months === 1) return "/ 1 month";
  return `/ ${months} months`;
};

/* ─── Badge components ──────────────────────────────────────── */
const SpecialOfferBadge = () => (
  <div
    className="absolute -top-1 left-0 z-10"
    style={{ transform: "rotate(-8deg)" }}
  >
    <div
      className="relative bg-red-600 text-white font-bold uppercase text-center shadow-[0_3px_8px_rgba(0,0,0,0.35)]"
      style={{
        padding: "6px 14px 8px 12px",
        clipPath: "polygon(0 0, 100% 0, 98% 100%, 2% 100%)",
      }}
    >
      <div className="text-[10px] leading-tight tracking-wider">SPECIAL</div>
      <div className="text-xs leading-tight tracking-wider">OFFER</div>
    </div>
    <div
      className="absolute bottom-0 right-0 w-8 h-3 bg-amber-400"
      style={{ clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 60%)" }}
      aria-hidden
    />
  </div>
);

const BestValueBadge = () => (
  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
    <div className="bg-secondary text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap border-2 border-white">
      <Star className="w-3 h-3 fill-current" /> Best Value
    </div>
  </div>
);

const TopBadge = () => (
  <div className="absolute -top-1 right-0 z-10 translate-x-0.5">
    <div className="inline-flex flex-col items-end">
      <div
        className="bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1"
        style={{
          clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
        }}
      >
        RECOMMENDED
      </div>
      <div className="flex gap-1 justify-center py-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="w-1 h-1 rounded-full bg-blue-300" />
        ))}
      </div>
      <div
        className="relative bg-red-600 text-white text-lg font-black uppercase tracking-widest py-1.5 px-5"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)" }}
      >
        TOP
      </div>
    </div>
  </div>
);

/* ─── Plan card ─────────────────────────────────────────────── */
interface PlanCardProps {
  plan: AvailablePlan;
  style: PlanStyle;
  onChoose: (plan: AvailablePlan) => void;
}

const PlanCard = ({ plan, style, onChoose }: PlanCardProps) => {
  const Icon = style.icon;
  const features = buildFeatures(plan);
  const dur = durationLabel(plan.duration_days ?? 0);

  return (
    <div
      className={`relative rounded-3xl border-2 p-5 flex flex-col gap-3 shadow-card hover-lift transition-all duration-300 ${style.cardBg} ${style.cardBorder} ${style.badge === "best-value" ? "mt-4" : ""}`}
    >
      {style.badge === "special" && <SpecialOfferBadge />}
      {style.badge === "best-value" && <BestValueBadge />}
      {style.badge === "top" && <TopBadge />}

      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${style.iconBg}`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Name & description */}
      <div>
        <h2 className={`font-serif text-xl font-bold ${style.titleColor}`}>
          {plan.name}
        </h2>
        <p className="text-xs text-muted-foreground">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1">
        <span className="font-serif text-2xl font-bold text-foreground">
          ₹{(plan.price ?? 0).toLocaleString("en-IN")}
        </span>
        {dur && <span className="text-xs text-muted-foreground">{dur}</span>}
      </div>

      {/* Feature list */}
      <ul className="flex-1 space-y-2">
        {features.map((feat, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-foreground"
          >
            <div className="w-4 h-4 rounded-full bg-white/70 border border-current flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className={`w-2.5 h-2.5 ${style.checkColor}`} />
            </div>
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      {/* Customer Care + Service Charge footer */}
      <div className="mt-1 rounded-xl bg-card/70 text-card-foreground border border-border/60 px-3 py-2.5 space-y-1.5 backdrop-blur">
        <p className="text-xs font-semibold">Customer Care Assistance</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Service Charge</span>
          <span className="font-medium text-foreground">
            ₹{(plan.service_charge ?? 0).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="border-t border-border/60 pt-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Remaining (Total)</span>
          <span className="font-bold text-primary">
            ₹{(plan.total_price ?? 0).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="hero"
        className="w-full gap-2 group/btn border-0 text-white"
        style={{
          background: "#b23272",
          boxShadow: "0 4px 14px -2px rgba(178,50,114,0.35)",
        }}
        onClick={() => onChoose(plan)}
      >
        Get Started
        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
};

/* ─── Page ──────────────────────────────────────────────────── */
const CurrentPlanCard = ({ my }: { my: MyPlanDetails }) => {
  const active = my.is_plan_active && my.plan_name;
  const valid = my.valid_until ? formatDateDdMmYyyy(my.valid_until) : "—";

  const rows: {
    icon: React.ElementType;
    label: string;
    value: number | string;
  }[] = [
    {
      icon: Eye,
      label: "Profile views left",
      value: my.profile_views_remaining,
    },
    { icon: Heart, label: "Interests left", value: my.interests_remaining },
    { icon: MessageCircle, label: "Chats left", value: my.chat_remaining },
    {
      icon: Sparkles,
      label: "Horoscope matches left",
      value: my.horoscope_remaining,
    },
  ];

  return (
    <div
      className={`rounded-2xl border-2 p-6 shadow-card ${
        active
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white"
          : "border-dashed border-muted-foreground/25 bg-muted/30"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your membership
          </p>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mt-1">
            {active ? my.plan_name : "No active plan"}
          </h2>
          {active && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <CalendarDays className="w-4 h-4 shrink-0" />
              Valid until <strong className="text-foreground">{valid}</strong>
            </p>
          )}
        </div>
        {active && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shrink-0">
            Active
          </span>
        )}
      </div>

      {!active && (
        <p className="text-sm text-muted-foreground mb-4">
          Purchase a plan below to unlock profile views, interests, chat, and
          more.
        </p>
      )}

      {active && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
            {rows.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl bg-white/80 border border-primary/10 px-3 py-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {label}
                  </p>
                  <p className="font-bold text-foreground tabular-nums">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 pt-3 border-t border-primary/10 text-sm">
            {/* <div className="flex items-center gap-2 text-muted-foreground">
              <IndianRupee className="w-4 h-4" />
              <span>
                Service charge paid:{" "}
                <strong className="text-foreground">
                  ₹{(my.service_charge_paid ?? 0).toLocaleString("en-IN")}
                </strong>
              </span>
            </div> */}
            {(my.service_charge_remaining ?? 0) > 0 && (
              <div className="text-amber-700 font-medium">
                If you require our service, the service fee payable is: ₹
                {my.service_charge_remaining.toLocaleString("en-IN")}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const PlanPage = () => {
  const [apiPlans, setApiPlans] = useState<AvailablePlan[]>([]);
  const [myPlan, setMyPlan] = useState<MyPlanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myPlanError, setMyPlanError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<AvailablePlan | null>(null);

  const refreshPlanData = useCallback(async () => {
    const [plansRes, myRes] = await Promise.allSettled([
      getAvailablePlans(),
      getMyPlan(),
    ]);
    if (plansRes.status === "fulfilled") {
      setApiPlans(plansRes.value.data.plans);
    }
    if (myRes.status === "fulfilled") {
      setMyPlan(myRes.value.data);
      setMyPlanError(null);
    } else {
      setMyPlanError(
        myRes.reason instanceof Error
          ? myRes.reason.message
          : "Could not load your plan",
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      setMyPlanError(null);
      try {
        const [plansRes, myRes] = await Promise.allSettled([
          getAvailablePlans(),
          getMyPlan(),
        ]);
        if (!mounted) return;
        if (plansRes.status === "fulfilled") {
          setApiPlans(plansRes.value.data.plans);
        } else {
          setError(
            plansRes.reason instanceof Error
              ? plansRes.reason.message
              : "Failed to load plans",
          );
        }
        if (myRes.status === "fulfilled") {
          setMyPlan(myRes.value.data);
        } else {
          setMyPlanError(
            myRes.reason instanceof Error
              ? myRes.reason.message
              : "Could not load your plan",
          );
          setMyPlan(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const gridCols =
    apiPlans.length <= 2
      ? "sm:grid-cols-2"
      : apiPlans.length === 3
        ? "sm:grid-cols-2 xl:grid-cols-3"
        : apiPlans.length === 4
          ? "sm:grid-cols-2 xl:grid-cols-4"
          : "sm:grid-cols-2 xl:grid-cols-5";

  return (
    <>
      <div className="space-y-8">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground pb-3 border-b border-gray-200">
          Plans &amp; Pricing
        </h1>
        <p className="text-sm text-muted-foreground -mt-4 mb-2">
          Your purchased plan and usage are loaded from your account. Upgrade or
          renew anytime below.
        </p>

        {myPlanError && (
          <div className="rounded-xl bg-amber-500/10 text-amber-900 dark:text-amber-200 px-4 py-3 text-sm">
            {myPlanError} — catalog below may still load.
          </div>
        )}
        {!loading && myPlan && <CurrentPlanCard my={myPlan} />}

        {error && (
          <div className="rounded-xl bg-destructive/10 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && apiPlans.length > 0 && (
          <h2 className="font-serif text-lg font-semibold text-foreground pt-2">
            Available plans
          </h2>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${gridCols} gap-6 pt-6`}>
            {apiPlans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                style={getPlanStyle(plan.name, index, apiPlans.length)}
                onChoose={(p) => {
                  setSelectedPlan(p);
                  setPaymentOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {selectedPlan && (
        <PaymentPopup
          key={selectedPlan.id}
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          apiPlan={selectedPlan}
          onPurchaseSuccess={refreshPlanData}
        />
      )}
    </>
  );
};

export default PlanPage;
