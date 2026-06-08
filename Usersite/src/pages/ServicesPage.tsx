"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Users, Camera, Crown, Heart, MessageCircle, Search, Shield, Sparkles, ArrowRight, Star } from "lucide-react";

const services = [
  { icon: Users, title: "Browse Profiles", description: "Explore 1200+ verified profiles with detailed information, photos, and preferences.", count: "1200+ Profiles", iconColor: "text-rose-600", iconBg: "bg-rose-200", cardBg: "bg-gradient-to-br from-rose-100 via-rose-50 to-orange-50", borderColor: "border-rose-300" },
  { icon: Heart, title: "Matchmaking", description: "Our advanced algorithm matches you with compatible profiles based on your preferences.", count: "Smart Matching", iconColor: "text-pink-600", iconBg: "bg-pink-200", cardBg: "bg-gradient-to-br from-pink-100 via-fuchsia-50 to-rose-50", borderColor: "border-pink-300" },
  { icon: Camera, title: "Photo Gallery", description: "View and share beautiful wedding photos and moments from our successful couples.", count: "1000+ Photos", iconColor: "text-amber-600", iconBg: "bg-amber-200", cardBg: "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50", borderColor: "border-amber-300" },
  { icon: Crown, title: "Premium Plans", description: "Get access to exclusive features with our premium membership plans.", count: "4 Plans", iconColor: "text-orange-600", iconBg: "bg-orange-200", cardBg: "bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-50", borderColor: "border-orange-300" },
  { icon: MessageCircle, title: "Chat & Connect", description: "Communicate with your matches through our secure messaging platform.", count: "Real-time Chat", iconColor: "text-teal-600", iconBg: "bg-teal-200", cardBg: "bg-gradient-to-br from-teal-100 via-emerald-50 to-green-50", borderColor: "border-teal-300" },
  { icon: Shield, title: "Verified Profiles", description: "All profiles go through a thorough verification process for your safety.", count: "100% Verified", iconColor: "text-green-600", iconBg: "bg-green-200", cardBg: "bg-gradient-to-br from-green-100 via-emerald-50 to-teal-50", borderColor: "border-green-300" },
  { icon: Search, title: "Advanced Search", description: "Find your perfect match using our detailed search filters and preferences.", count: "20+ Filters", iconColor: "text-blue-600", iconBg: "bg-blue-200", cardBg: "bg-gradient-to-br from-blue-100 via-sky-50 to-indigo-50", borderColor: "border-blue-300" },
  { icon: Star, title: "Horoscope Matching", description: "Traditional horoscope compatibility analysis for a perfect match.", count: "Vedic Analysis", iconColor: "text-purple-600", iconBg: "bg-purple-200", cardBg: "bg-gradient-to-br from-purple-100 via-violet-50 to-pink-50", borderColor: "border-purple-300" },
];

const ServicesPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero with wedding background */}
      <section className="pt-28 pb-20 relative overflow-hidden min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <img src="/images/Screenshot%202026-03-10%20115018.png" alt="Beach wedding setup" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
        </div>
        <div className="absolute top-10 left-10 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-sm border border-primary/10 mb-4 shadow-soft animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-secondary animate-sparkle" />
            <span className="text-sm font-medium text-primary">What We Offer</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in-up drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]" style={{ animationDelay: "0.1s" }}>
            Explore Our <span className="text-[#FCD34D] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">Offerings</span>
          </h1>
          <p className="text-white max-w-2xl mx-auto text-lg animate-fade-in-up drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" style={{ animationDelay: "0.2s" }}>
            Comprehensive matrimony services designed to help you find your perfect life partner
          </p>
        </div>
      </section>

      {/* Services Grid - colorful, NO shimmer/blinking */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-3xl p-6 text-center border-2 ${service.cardBg} ${service.borderColor} hover-lift group`}
              >
                <div className={`w-16 h-16 mx-auto rounded-2xl ${service.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <service.icon className={`w-8 h-8 ${service.iconColor}`} />
                </div>
                <h3 className="font-serif text-lg font-bold text-foreground mb-2">{service.title}</h3>
                <p className={`${service.iconColor} text-xs font-medium mb-3`}>{service.count}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="hero" size="lg" className="gap-2 group" onClick={() => router.push("/auth")}>
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServicesPage;
