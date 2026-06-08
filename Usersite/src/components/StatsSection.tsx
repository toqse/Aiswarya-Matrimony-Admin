import { Users, Heart, Shield, Crown } from "lucide-react";

const stats = [
  { value: "2M+", label: "Happy Members", icon: Users },
  { value: "1M+", label: "Successful Matches", icon: Heart },
  { value: "38+", label: "Years of Trust", icon: Shield },
  { value: "100%", label: "Privacy Secured", icon: Crown },
];

const StatsSection = () => {
  return (
    <section className="relative py-12 sm:py-16 overflow-hidden bg-gradient-romantic">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto animate-fade-in-up">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-7 md:p-10 border border-primary/10 shadow-card hover-lift group cursor-pointer"
            >
              <stat.icon className="w-10 h-10 md:w-12 md:h-12 text-secondary mx-auto mb-3 group-hover:animate-bounce-soft" />
              <div className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gradient-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
};

export default StatsSection;
