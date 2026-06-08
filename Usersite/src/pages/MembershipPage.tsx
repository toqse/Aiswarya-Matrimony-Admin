"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeroBanner from "@/components/PageHeroBanner";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Star, Zap, Heart, Shield, ArrowRight, HelpCircle, ChevronDown, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { getWebsitePlans, type WebsitePlan } from "@/lib/plansApi";
import { WEBSITE_PLANS_FALLBACK } from "@/lib/websitePlansFallback";

const faqs: { question: string; answer: string | string[] }[] = [
  {
    question: "Why is Toqse Matrimonial better compared to other matrimonial websites?",
    answer:
      "M/s Aiswarya Vivaha Bureau is following remarkable way of operations, that is I any customer can enter at any time of our schedule and collect all details and either accept or reject asper their desire. Our collection of data, newly implementing way of approach (different sources of information from rural, urban, city & abroad ) on the light of the above our website is outstanding than that of other websites.",
  },
  {
    question: "Is Toqse Matrimonial a trustworthy matchmaking platform?",
    answer:
      'Yes, our website is chiefly operating on the base of customer\'s trust and their evaluation. Our website promote different choices and making "Newly Constructive Attitude". So we have an opinion that the dream of customers will be materializing on the base of our offering.',
  },
  {
    question: "What is the difference between free membership vs paid membership?",
    answer:
      "Our website stands for the satisfaction of customers by choosing there database collection. But we allow all details except key point.",
  },
  {
    question: "What additional benefits do I get as a Premium Member?",
    answer:
      "Surely our customers will get maximum benefit at the time of there contact with the attempt, surprise benefit, extraordinary offerings and benefits will be releasing to the eligible customers.",
  },
  {
    question: "How can I contact other members Toqse Matrimonial?",
    answer: [
      "No wonder our website is everywhere and easy to open without any obstacle if the customers are ready to contact with our website. The meaning is the M/s Aiswarya Vivaha Bureau and its operation is as omni present.",
      "In shot our reputed website is a remedy for the customers those who are interested to select marriage alliance and share with us, maximum level of co-operation constructive attitude and spontaneous way of behavior. Our motto is maximum satisfaction with minimum level of customers attitude.",
      "A significant merit is Rs. 499/- (as fees) no other website can clarify because they are imposing than that of this amount. We had had 37 years experiences, during this experiences which proves the original quality of website and how can maintain a website (Vivaha bureau). With full meaning full level.",
    ],
  },
];

const MembershipPage = () => {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [plans, setPlans] = useState<WebsitePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  /** Shown when API is empty or fails; we still render default plan cards. */
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  const ICONS = [Zap, Star, Crown, Sparkles, Award];
  const CARD_ACCENTS = [
    "border-pink-300",
    "border-blue-300",
    "border-amber-300",
    "border-orange-200",
    "border-purple-300",
  ];
  const CARD_BGS = [
    "bg-gradient-to-b from-pink-100 via-pink-50 to-rose-50",
    "bg-gradient-to-b from-sky-100 via-blue-50 to-indigo-50/90",
    "bg-gradient-to-b from-amber-50 via-[#FFFEE8] to-amber-50/95",
    "bg-[#FFF6EE]",
    "bg-gradient-to-b from-purple-100 via-purple-50 to-violet-50",
  ];
  const ICON_BGS = [
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-b from-sky-200 to-blue-500",
    "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500",
    "bg-gradient-to-b from-[#FFC75E] to-[#FFA500]",
    "bg-gradient-to-br from-purple-500 to-purple-400",
  ];

  const formatCurrency = (value: number) =>
    `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0)}`;

  const formatDuration = (days: number) => {
    if (!days || days <= 0) return "";
    if (days % 365 === 0) return `/${days / 365} year${days / 365 > 1 ? "s" : ""}`;
    if (days % 30 === 0) return `/${days / 30} month${days / 30 > 1 ? "s" : ""}`;
    return `/${days} days`;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingPlans(true);
        setFallbackNotice(null);
        const res = await getWebsitePlans();
        const raw = res.data?.plans ?? [];
        if (!cancelled) {
          if (raw.length > 0) {
            setPlans(raw);
          } else {
            setPlans(WEBSITE_PLANS_FALLBACK);
            setFallbackNotice(
              "The server returned no membership plans. Showing default pricing until plans are published in the admin."
            );
          }
        }
      } catch (e) {
        if (!cancelled) {
          setPlans(WEBSITE_PLANS_FALLBACK);
          setFallbackNotice(
            e instanceof Error ? e.message : "Could not load plans from the server. Showing default pricing."
          );
        }
      } finally {
        if (!cancelled) setLoadingPlans(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero banner (same style as Contact page) */}
      <PageHeroBanner
        tagLabel="Premium Memberships"
        TagIcon={Crown}
        titlePart1="Invest in Your"
        titleHighlight="Love Story"
        description="Choose the perfect plan to accelerate your journey towards finding your soulmate"
        backgroundImage="/images/Close%20Up%20Wedding%20Couple%20Hands%20with%20Gold%20Rings%20and%20Bouquet%20_%20Luxury%20Bridal%20Jewelry%20Inspiration%202026%20(1).jpg"
      />

      {/* Pricing Cards Section */}
      <section className="py-16 relative overflow-hidden" style={{ backgroundColor: "var(--membership-section-bg)" }}>
        <div className="container mx-auto px-4 relative z-10">
          {loadingPlans ? (
            <div className="text-center py-10 text-muted-foreground">Loading membership plans...</div>
          ) : null}

          {!loadingPlans && fallbackNotice ? (
            <div
              className="mb-8 max-w-3xl mx-auto rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
              role="status"
            >
              {fallbackNotice}
            </div>
          ) : null}

          {/* Pricing Cards - 5 columns */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-[90rem] mx-auto">
            {!loadingPlans && plans.map((plan, index) => {
              const Icon = ICONS[index % ICONS.length];
              const features = [
                `${plan.horoscope_match_limit} Horoscope Matching`,
                `${plan.contact_view_limit} Up to Contact View`,
                `${plan.interest_limit} Send interests`,
                `${plan.chat_limit} Chat with matches`,
                `${plan.profile_view_limit} Profile visibility`,
              ];
              return (
              <div
                key={plan.id}
                className="relative animate-fade-in-up flex"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div
                  className={`h-full w-full rounded-3xl p-6 transition-all duration-500 hover-lift group flex flex-col shadow-card border-2 ${CARD_BGS[index % CARD_BGS.length]} ${CARD_ACCENTS[index % CARD_ACCENTS.length]}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)] ${ICON_BGS[index % ICON_BGS.length]}`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="font-serif text-xl font-bold mb-1" style={{ color: "var(--membership-title)" }}>{plan.name}</h3>
                  <p className="text-xs mb-3" style={{ color: "var(--membership-desc)" }}>{plan.description || "Membership plan"}</p>
                  
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="font-serif text-3xl font-bold" style={{ color: "var(--membership-price)" }}>{formatCurrency(plan.price)}</span>
                    <span className="text-sm" style={{ color: "var(--membership-period)" }}>{formatDuration(plan.duration_days)}</span>
                  </div>

                  {typeof plan.total_price?.female === "number" && (
                    <p className="text-sm font-medium mb-1 underline underline-offset-2" style={{ color: "var(--membership-feature)" }}>
                      Total starts at {formatCurrency(plan.total_price.female)}
                    </p>
                  )}

                  {typeof plan.service_charge?.female === "number" && (
                    <p className="text-sm font-bold mb-4" style={{ color: "var(--membership-title)" }}>
                      Service charge {formatCurrency(plan.service_charge.female)} onwards
                    </p>
                  )}

                  <ul className="mb-6 flex-1">
                    {features.map((feature, i) => (
                      <li key={i} className="flex flex-col">
                        <div className="flex items-start gap-2.5 py-3">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#6A3266]/15">
                            <Check className="w-3 h-3" style={{ color: "var(--membership-check)" }} />
                          </div>
                          <span className="text-sm flex-1" style={{ color: "var(--membership-feature)" }}>{feature}</span>
                        </div>
                        {i < features.length - 1 && <div className="mx-2 border-b" style={{ borderColor: "var(--membership-divider)" }} />}
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full group/btn border-0 text-white hover:opacity-95"
                    style={{ background: "#b23272", boxShadow: "0 4px 14px -2px rgba(178, 50, 114, 0.35)" }}
                    onClick={() => router.push("/auth")}
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
              );
            })}
            {!loadingPlans && plans.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-6">No plans to display.</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-gradient-romantic">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Shield, label: "Secure Payments", desc: "256-bit SSL encryption" },
              { icon: Zap, label: "Instant Activation", desc: "Start immediately" },
              { icon: Heart, label: "Money-back Guarantee", desc: "30-day refund policy" },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-soft hover-lift">
                <div className="w-12 h-12 rounded-xl bg-accent-gold flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-rose border border-primary/10 mb-4">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Got Questions?</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Frequently Asked <span className="text-gradient-primary">Questions</span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gradient-card rounded-2xl border border-primary/5 overflow-hidden shadow-card hover-lift">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-medium text-foreground pr-4">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-primary transition-transform flex-shrink-0 ${openFaq === index ? "rotate-180" : ""}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 pt-0 animate-fade-in-up space-y-3">
                    {(Array.isArray(faq.answer) ? faq.answer : [faq.answer]).map((para, i) => (
                      <p key={i} className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MembershipPage;
