import { motion } from "framer-motion";
import { UserPlus, Search, Heart, MessageCircle, Gem, PartyPopper, Sparkles } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Register", description: "Create your profile with detailed information about yourself and your preferences." },
  { icon: Search, title: "Find your Match", description: "Browse through verified profiles and find someone who matches your criteria." },
  { icon: Heart, title: "Send Interest", description: "Express your interest and wait for them to respond to your request." },
  { icon: MessageCircle, title: "Get Profile Info", description: "Once matched, view complete profile details and contact information." },
  { icon: Gem, title: "Start Meetups", description: "Connect through our chat system and plan your first meeting." },
  { icon: PartyPopper, title: "Getting Married", description: "Celebrate your love story — another successful match made!" },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-gradient-romantic relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-white" style={{ clipPath: "ellipse(70% 100% at 50% 0%)" }} />
      <div className="absolute top-20 left-10 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-float-delayed" />

      {[...Array(6)].map((_, i) => (
        <Sparkles key={i} className="absolute text-secondary/20 animate-sparkle"
          style={{ left: `${8 + i * 16}%`, top: `${20 + (i % 3) * 25}%`, width: `${16 + i * 2}px`, animationDelay: `${i * 0.3}s` }}
        />
      ))}

      <div className="container mx-auto px-4 relative z-10 pt-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary/10 mb-4 shadow-soft animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-secondary animate-sparkle" />
            <span className="text-sm font-medium text-primary">Moments</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            How It <span className="text-gradient-gold">Works</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-primary/10 shadow-card hover-lift group"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-soft">
                {index + 1}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-accent-gold flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <step.icon className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
