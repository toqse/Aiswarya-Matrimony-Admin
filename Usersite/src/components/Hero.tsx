"use client";

import { Heart, Sparkles, ArrowRight, Star } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { stableUnit } from "@/lib/stableRandom";

const Hero = () => {
  const router = useRouter();
  const petals = Array.from({ length: 20 }, (_, i) => i);
  const sparkles = Array.from({ length: 8 }, (_, i) => i);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image from public/images/hero-bg.png */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/images/hero-bg.png")' }}
        aria-hidden
      />
      {/* Light gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(340,60%,93%)/0.5] via-[hsl(20,100%,94%)/0.4] to-[hsl(45,100%,90%)/0.5]" />
      <div className="absolute inset-0 bg-gradient-to-tr from-[hsl(330,60%,90%)/0.5] via-transparent to-[hsl(40,100%,85%)/0.4]" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[hsl(40,100%,92%)/0.6] to-transparent" />

      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {petals.map((_, i) => (
          <div
            key={`petal-${i}`}
            className="absolute animate-petal-fall"
            style={{
              left: `${stableUnit(`petal-${i}-L`) * 100}%`,
              animationDelay: `${stableUnit(`petal-${i}-D`) * 10}s`,
              animationDuration: `${10 + stableUnit(`petal-${i}-T`) * 8}s`,
            }}
          >
            <Heart
              className="text-primary/20"
              style={{
                width: `${14 + stableUnit(`petal-${i}-W`) * 20}px`,
                height: `${14 + stableUnit(`petal-${i}-H`) * 20}px`,
              }}
              fill="currentColor"
            />
          </div>
        ))}
        {sparkles.map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute animate-sparkle"
            style={{
              left: `${10 + stableUnit(`sparkle-${i}-L`) * 80}%`,
              top: `${10 + stableUnit(`sparkle-${i}-T`) * 80}%`,
              animationDelay: `${stableUnit(`sparkle-${i}-D`) * 3}s`,
            }}
          >
            <Sparkles
              className="text-secondary/40"
              style={{
                width: `${16 + stableUnit(`sparkle-${i}-W`) * 12}px`,
                height: `${16 + stableUnit(`sparkle-${i}-H`) * 12}px`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Glowing Orbs - more vibrant */}
      <div className="absolute top-1/4 left-10 w-48 h-48 bg-secondary/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/3 right-10 w-60 h-60 bg-primary/25 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-[hsl(40,100%,70%)/0.3] rounded-full blur-2xl animate-pulse-soft" />
      <div className="absolute top-1/3 right-1/3 w-28 h-28 bg-[hsl(330,60%,70%)/0.2] rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-[hsl(20,100%,80%)/0.3] rounded-full blur-3xl animate-float-delayed" />

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-24 sm:pt-28 pb-12 sm:pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left min-w-0">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-8 sm:mb-10 -mt-6 sm:-mt-8 animate-fade-in-up tracking-tight">
            Aiswarya Vivaha Bureau
            </h2>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-sm border border-primary/20 shadow-soft mb-6 animate-fade-in-up hover-lift cursor-pointer group" style={{ animationDelay: "0.05s" }}>
              <Sparkles className="w-4 h-4 text-secondary animate-sparkle" />
              <span className="text-sm font-medium text-primary">India's Most Trusted Matrimony</span>
              <Heart className="w-4 h-4 text-primary fill-primary group-hover:animate-heart-beat" />
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight mb-4 sm:mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Find Your{" "}
              <span className="relative inline-block">
                <span className="text-gradient-primary">Forever</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C50 2 150 2 198 10" stroke="url(#gold-gradient)" strokeWidth="3" strokeLinecap="round" className="animate-pulse-soft" />
                  <defs>
                    <linearGradient id="gold-gradient" x1="0" y1="0" x2="200" y2="0">
                      <stop offset="0%" stopColor="hsl(40, 100%, 56%)" />
                      <stop offset="100%" stopColor="hsl(42, 100%, 68%)" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>{" "}
              Love
            </h1>

            <p className="text-base sm:text-lg text-black max-w-xl mb-6 sm:mb-8 animate-fade-in-up leading-relaxed font-bold" style={{ animationDelay: "0.2s" }}>
              Begin your beautiful journey towards a lifetime of love, trust, and togetherness. 
              Join millions who found their soulmate with Toqse Matrimony.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <Button variant="hero" size="xl" className="group w-full sm:w-auto" onClick={() => router.push("/auth")}>
                <Heart className="w-5 h-5 group-hover:animate-heart-beat" fill="currentColor" />
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="xl" className="group w-full sm:w-auto" onClick={() => router.push("/success-stories")}>
                <Sparkles className="w-5 h-5 group-hover:animate-sparkle" />
                View Success Stories
              </Button>
            </div>
          </div>

          {/* Right: Wedding Image */}
          <div className="hidden lg:flex flex-col items-center justify-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-secondary/30 via-[hsl(330,60%,70%)/0.2] to-primary/20 rounded-[2rem] blur-xl" />
              <img
                src="/images/image%20wedding.jpg"
                alt="Beautiful wedding couple"
                className="relative rounded-[2rem] w-[420px] h-[520px] object-cover shadow-elevated border-4 border-white/50"
              />
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-secondary/80 flex items-center justify-center shadow-gold animate-bounce-soft">
                <Heart className="w-8 h-8 text-white fill-white" />
              </div>
              <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-primary/80 flex items-center justify-center shadow-soft animate-float">
                <Star className="w-7 h-7 text-white fill-white" />
              </div>
            </div>
            <p className="mt-4 text-center font-serif text-xl sm:text-2xl font-semibold text-foreground">
              Start Your Journey to Forever
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
