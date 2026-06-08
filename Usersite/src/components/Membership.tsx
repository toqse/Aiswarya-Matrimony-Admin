import { Check, Crown, Sparkles, Star, Zap, Heart, Shield, ArrowRight, Award } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  icon: typeof Crown;
  isPopular: boolean;
  variant: "outline" | "hero" | "gold";
  highlightFeature?: string;
  contactView?: string;
  badge?: string;
  badgeColor?: string;
  cardAccent?: string;
  cardBg?: string;
  iconBg?: string;
}

export const plansData: Plan[] = [
  {
    name: "Special Offer",
    price: "₹499",
    period: "/month",
    description: "Quick trial plan",
    features: [
      "6 Horoscope Matching",
      "6 Up to Contact View",
      "Send interests to profiles",
      "Chat with matches",
      "Profile visibility",
    ],
    icon: Zap,
    isPopular: false,
    variant: "outline",
    badge: "SPECIAL OFFER",
    badgeColor: "bg-red-500 text-white",
    cardAccent: "border-pink-300",
    cardBg: "bg-gradient-to-b from-pink-100 via-pink-50 to-rose-50",
    iconBg: "bg-gradient-to-br from-pink-400 to-pink-600",
  },
  {
    name: "Silver",
    price: "₹999",
    period: "/3 months",
    description: "Perfect to get started",
    features: [
      "15 Horoscope Matching",
      "15 Up to Contact View",
      "Send interests to profiles",
      "Chat with matches",
      "Profile visibility",
    ],
    icon: Star,
    isPopular: false,
    variant: "outline",
    cardAccent: "border-blue-300",
    cardBg: "bg-gradient-to-b from-sky-100 via-blue-50 to-indigo-50/90",
    iconBg: "bg-gradient-to-b from-sky-200 to-blue-500",
  },
  {
    name: "Gold",
    price: "₹1,499",
    period: "/6 months",
    description: "Most popular choice",
    features: [
      "30 Horoscope Matching",
      "30 Up to Contact View",
      "Send interests to profiles",
      "Chat with matches",
      "Profile visibility",
    ],
    icon: Crown,
    isPopular: true,
    variant: "hero",
    cardAccent: "border-amber-300",
    cardBg: "bg-gradient-to-b from-amber-50 via-[#FFFEE8] to-amber-50/95",
    iconBg: "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500",
  },
  {
    name: "Premium",
    price: "₹1,999",
    period: "/year",
    description: "Most popular choice",
    features: [
      "60 Horoscope Matching",
      "60 Up to Contact View",
      "Send interests to profiles",
      "Chat with matches",
      "Profile visibility",
      "Everything in Gold",
      "Dedicated support",
      "Best value for 1 year",
    ],
    icon: Sparkles,
    isPopular: true,
    variant: "hero",
    cardAccent: "border-orange-200",
    cardBg: "bg-[#FFF6EE]",
    iconBg: "bg-gradient-to-b from-[#FFC75E] to-[#FFA500]",
  },
  {
    name: "Ultimate",
    price: "₹2,999",
    period: "/1 Year",
    description: "Best value for serious seekers",
    features: [
      "70 Horoscope Matching",
      "70 Up to Contact View",
      "Send interests to profiles",
      "Chat with matches",
      "Profile visibility",
      "Everything in Premium",
      "Dedicated support",
      "Customer care Assistance",
    ],
    icon: Award,
    isPopular: false,
    variant: "gold",
    badge: "TOP RECOMMENDED",
    badgeColor: "bg-purple-600 text-white",
    cardAccent: "border-purple-300",
    cardBg: "bg-gradient-to-b from-purple-100 via-purple-50 to-violet-50",
    iconBg: "bg-gradient-to-br from-purple-500 to-purple-400",
  },
];

const Membership = () => {
  const router = useRouter();

  return (
    <section id="membership" className="py-24 bg-gradient-romantic relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-white" style={{ clipPath: "ellipse(70% 100% at 50% 0%)" }} />
      <div className="absolute top-20 right-10 w-48 h-48 bg-secondary/25 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-float-delayed" />

      <div className="container mx-auto px-4 relative z-10 pt-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary/10 mb-4 animate-fade-in-up shadow-soft">
            <Crown className="w-4 h-4 text-secondary animate-bounce-soft" />
            <span className="text-sm font-medium text-primary">Membership Plans</span>
            <Star className="w-4 h-4 text-secondary fill-secondary animate-sparkle" />
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Choose Your <span className="text-gradient-gold">Perfect Plan</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Invest in your love story with our premium features designed to help you find your soulmate faster
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-[90rem] mx-auto">
          {plansData.map((plan, index) => (
            <div
              key={plan.name}
              className="relative animate-fade-in-up flex"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              {plan.badge && (
                <div className={`absolute -top-1 z-10 ${plan.badge === "SPECIAL OFFER" ? "left-0 -translate-x-0.5" : "right-0 translate-x-0.5"}`}>
                  {plan.badge === "SPECIAL OFFER" ? (
                    <div className="relative" style={{ transform: "rotate(-8deg)" }}>
                      <div className="relative bg-red-600 text-white font-bold uppercase text-center shadow-[0_3px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]" style={{ padding: "6px 14px 8px 12px", textShadow: "0 1px 2px rgba(0,0,0,0.4)", clipPath: "polygon(0 0, 100% 0, 98% 100%, 2% 100%)" }}>
                        <div className="text-[10px] leading-tight tracking-wider">SPECIAL</div>
                        <div className="text-xs leading-tight tracking-wider">OFFER</div>
                      </div>
                      <div className="absolute bottom-0 right-0 w-8 h-3 bg-amber-400 opacity-95" style={{ clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 60%)", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} aria-hidden />
                    </div>
                  ) : plan.badge === "TOP RECOMMENDED" ? (
                    <div className="inline-flex flex-col items-end">
                      <div className="bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 text-center border-b border-blue-500/50" style={{ clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)", textShadow: "0 1px 1px rgba(0,0,0,0.3)", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                        RECOMMENDED
                      </div>
                      <div className="flex gap-1 justify-center py-0.5">
                        {[1,2,3,4,5].map((i) => <span key={i} className="w-1 h-1 rounded-full bg-white/80" />)}
                      </div>
                      <div className="relative bg-red-600 text-white text-lg font-black uppercase tracking-widest py-1.5 px-5 text-center border-l-2 border-r-2 border-red-700/60" style={{ clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)", textShadow: "0 1px 2px rgba(0,0,0,0.4)", boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
                        TOP
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                          {[1,2,3].map((i) => <span key={i} className="w-0.5 h-0.5 rounded-full bg-white/70" />)}
                        </div>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                          {[1,2,3].map((i) => <span key={i} className="w-0.5 h-0.5 rounded-full bg-white/70" />)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`px-3 py-1.5 ${plan.badgeColor} text-xs font-bold rounded-full shadow-md flex items-center gap-1 whitespace-nowrap`}>
                      <Star className="w-3 h-3 fill-current" />
                      {plan.badge}
                    </div>
                  )}
                </div>
              )}

              <div
                className={`h-full w-full rounded-3xl p-5 transition-all duration-500 hover-lift group flex flex-col shadow-card border-2 ${plan.cardBg || "bg-white"} ${plan.cardAccent || "border-primary/10"}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)] ${plan.iconBg || "bg-accent-rose"}`}>
                  <plan.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="font-serif text-lg font-bold mb-1" style={{ color: "var(--membership-title)" }}>{plan.name}</h3>
                <p className="text-xs mb-3" style={{ color: "var(--membership-desc)" }}>{plan.description}</p>
                
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-serif text-2xl font-bold" style={{ color: "var(--membership-price)" }}>{plan.price}</span>
                  {plan.period && <span className="text-xs" style={{ color: "var(--membership-period)" }}>{plan.period}</span>}
                </div>

                {plan.highlightFeature && (
                  <p className="text-xs font-medium mb-1 underline underline-offset-2" style={{ color: "var(--membership-feature)" }}>
                    {plan.highlightFeature}
                  </p>
                )}

                {plan.contactView && (
                  <p className="text-xs font-bold mb-3" style={{ color: "var(--membership-title)" }}>
                    {plan.contactView}
                  </p>
                )}

                <ul className="mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex flex-col">
                      <div className="flex items-start gap-2 py-2.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#6A3266]/15">
                          <Check className="w-2.5 h-2.5" style={{ color: "var(--membership-check)" }} />
                        </div>
                        <span className="text-xs flex-1" style={{ color: "var(--membership-feature)" }}>{feature}</span>
                      </div>
                      {i < plan.features.length - 1 && <div className="mx-2 border-b" style={{ borderColor: "var(--membership-divider)" }} />}
                    </li>
                  ))}
                </ul>

                <Button 
                  variant="hero" 
                  size="default" 
                  className="w-full group/btn mt-auto border-0 text-white hover:opacity-95"
                  style={{ background: "#b23272", boxShadow: "0 4px 14px -2px rgba(178, 50, 114, 0.35)" }}
                  onClick={() => router.push("/auth")}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-6 mt-16">
          {[
            { icon: Shield, text: "Secure Payments" },
            { icon: Zap, text: "Instant Activation" },
            { icon: Heart, text: "Money-back Guarantee" },
          ].map((badge, index) => (
            <div key={index} className="flex items-center gap-2 text-muted-foreground bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft hover-lift cursor-pointer">
              <badge.icon className="w-5 h-5 text-secondary animate-pulse-soft" />
              <span className="text-sm font-medium">{badge.text}</span>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button 
            variant="outline" 
            size="lg" 
            className="group"
            onClick={() => router.push("/membership")}
          >
            Compare All Plans
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Membership;
