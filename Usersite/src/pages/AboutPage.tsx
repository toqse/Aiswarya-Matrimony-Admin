"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Sparkles, Star, Users, Phone, Mail, Heart, MapPin, UserCheck, ShieldCheck, Infinity } from "lucide-react";

const features = [
  {
    title: "Genuine Profiles",
    description: "The most trusted wedding matrimony brand with 100% verified profiles",
    icon: UserCheck,
    ringClass: "from-emerald-200/60 via-emerald-100 to-emerald-50",
  },
  {
    title: "Most Trusted",
    description: "The most trusted wedding matrimony brand trusted by millions",
    icon: ShieldCheck,
    ringClass: "from-violet-200/70 via-violet-100 to-violet-50",
  },
  {
    title: "2000+ Weddings",
    description: "The most trusted wedding matrimony brand with thousands of success stories",
    icon: Infinity,
    ringClass: "from-pink-200/70 via-pink-100 to-pink-50",
  },
];

const stats = [
  { value: "2K", label: "COUPLES PAIRED", icon: Heart },
  { value: "4000+", label: "REGISTERED USERS", icon: Users },
  { value: "1600+", label: "MENS", icon: Users },
  { value: "2000+", label: "WOMENS", icon: Users },
];

const testimonials = [
  { name: "John Smith", role: "IT Professional", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", review: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The service is amazing!", rating: 5 },
  { name: "Julia Ann", role: "Teacher", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", review: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. Highly recommended!", rating: 5 },
  { name: "William Son", role: "Government Staff", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face", review: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. Excellent platform!", rating: 5 },
];

const teamContacts = [
  { label: "EZHAVA", phone: "8848862419, 7907612933" },
  { label: "CHRISTIAN", phone: "6282857276, 8075352944" },
  { label: "NAIR", phone: "8848290822" },
  { label: "VISWAKARMA", phone: "8075662656" },
  { label: "PATARYA, VILAKKATHALA", phone: "7012129596, 7907612933" },
  { label: "DHEEVARA, VELAN, MANNAN, PARAVAR", phone: "8078405206, 8848290822" },
  { label: "PULAYA", phone: "7907612933, 8848290822" },
  { label: "MUSLIM", phone: "6282857276, 7012129596" },
  { label: "OTHER CASTE", phone: "9037188286, 7907240062" },
];

const teamColors = [
  "bg-rose-50 border-rose-200",
  "bg-blue-50 border-blue-200",
  "bg-amber-50 border-amber-200",
  "bg-green-50 border-green-200",
  "bg-purple-50 border-purple-200",
  "bg-rose-50 border-rose-200",
  "bg-blue-50 border-blue-200",
  "bg-amber-50 border-amber-200",
];

const teamIconColors = [
  "bg-rose-200 text-rose-600",
  "bg-blue-200 text-blue-600",
  "bg-amber-200 text-amber-600",
  "bg-green-200 text-green-600",
  "bg-purple-200 text-purple-600",
  "bg-rose-200 text-rose-600",
  "bg-blue-200 text-blue-600",
  "bg-amber-200 text-amber-600",
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner with wedding background */}
      <section className="pt-28 pb-20 relative overflow-hidden min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <img src={"/images/" + encodeURIComponent("image about.png")} alt="Wedding couple in traditional attire" className="w-full h-full object-cover object-[center_20%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
        </div>
        <div className="absolute top-10 left-10 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-float-delayed" />
        {[...Array(6)].map((_, i) => (
          <Sparkles key={i} className="absolute text-secondary/20 animate-sparkle"
            style={{ left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%`, width: `${16 + i * 3}px`, animationDelay: `${i * 0.3}s` }} />
        ))}
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-sm border border-primary/10 mb-4 shadow-soft animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-secondary animate-sparkle" />
            <span className="text-sm font-medium text-primary">#1 Matrimony</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in-up drop-shadow-[0_2px_12px_rgba(0,0,0,0.6),0_0_20px_rgba(0,0,0,0.3)]" style={{ animationDelay: "0.1s" }}>
            Our <span className="text-[#FCD34D] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">Story & Vision</span>
          </h1>
          <p className="text-white max-w-2xl mx-auto text-lg animate-fade-in-up drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" style={{ animationDelay: "0.2s" }}>
            Most Trusted and premium Matrimony Service in the World
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 -mt-16 relative z-20">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-card rounded-3xl p-8 shadow-card hover-lift text-center border border-primary/10"
              >
                <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-b ${f.ringClass} flex items-center justify-center mb-4 shadow-inner`}>
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-soft">
                    <f.icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Welcome Section - same images & layout as homepage WhyChooseUs */}
      <section className="py-16 bg-card relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative flex flex-col lg:block min-h-0 lg:min-h-[520px]"
            >
              <motion.div
                className="relative z-[2] w-full lg:w-[65%] rounded-2xl overflow-hidden shadow-elevated shrink-0"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <img
                  src="/images/christian.png"
                  alt="Wedding couple"
                  className="w-full h-[240px] sm:h-[280px] lg:h-[320px] object-cover object-[center_30%]"
                />
              </motion.div>
              <motion.div
                className="relative mt-4 lg:absolute lg:bottom-0 lg:left-[25%] lg:mt-0 w-full lg:w-[65%] z-[3] rounded-2xl overflow-hidden shadow-elevated border-4 lg:border-[6px] border-card"
                initial={{ opacity: 0, y: 40, x: 20 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.03 }}
              >
                <img
                  src="/images/Wedding%20day.jpg"
                  alt="Wedding rings and flowers"
                  className="w-full h-[200px] sm:h-[240px] lg:h-[300px] object-cover object-center"
                />
              </motion.div>
              <div className="absolute -bottom-4 right-[5%] w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-[4px] sm:border-[5px] border-accent-rose z-[1] hidden sm:block pointer-events-none" />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-2 uppercase tracking-wider" style={{ textDecoration: "underline", textDecorationColor: "hsl(var(--secondary))", textUnderlineOffset: "8px" }}>Welcome to</h2>
              <h3 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                <span className="text-gradient-primary italic">Toqse Matrimony</span>
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Toqse Bureau is a trusted matrimonial service with over 37 years of experience in connecting suitable brides and grooms. Located near Cherthala Private Bus Stand in Alappuzha District, Kerala, we serve families both within Kerala and outside the state.
              </p>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Our experienced team understands the preferences of families and helps them find the right life partner. Built on the values of trust, responsibility, and sincerity, we are committed to providing the best matrimonial connections at a reasonable cost.
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                For more than three decades, Aiswarya Vivaha Bureau has been helping people build happy and meaningful marriages.
              </p>
              <div className="flex flex-wrap gap-8 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-foreground/80 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Enquiry</p>
                    <span className="font-semibold text-foreground">7907240062, 6282857276</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-foreground/80 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Get Support</p>
                    <span className="font-semibold text-foreground">aiswarya@aiswaryamatrimonials.com</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-gradient-romantic relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="text-center border-r last:border-r-0 border-border/50">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-accent-gold flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-secondary-dark" />
                  </div>
                  <motion.span className="font-serif text-3xl md:text-4xl font-bold text-foreground" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }}>
                    {s.value}
                  </motion.span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gradient-romantic">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Customer <span className="text-gradient-gold">Testimonials</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="bg-card rounded-3xl p-6 shadow-card hover-lift">
                <div className="flex gap-1 mb-3">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 text-secondary fill-secondary" />)}
                  <span className="text-xs text-muted-foreground ml-2">(50 Reviews)</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4 italic">"{t.review}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-serif font-bold text-foreground text-sm">{t.name}</h4>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-secondary font-medium uppercase tracking-[0.3em] mb-2 font-serif">Our Professionals</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Meet Our <span className="text-gradient-gold">Team</span></h2>
            <div className="flex items-center justify-center gap-1 opacity-60">
              <div className="w-12 h-[1px] bg-secondary" />
              <span className="text-secondary text-lg">🌿🌸🌿</span>
              <div className="w-12 h-[1px] bg-secondary" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 max-w-6xl mx-auto">
            {teamContacts.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className={`rounded-2xl p-5 border shadow-card hover-lift text-center ${teamColors[i % teamColors.length]}`}>
                <div className={`w-14 h-14 mx-auto rounded-full ${teamIconColors[i % teamIconColors.length]} flex items-center justify-center mb-3 text-lg font-bold`}>
                  <Phone className="w-6 h-6 text-current" />
                </div>
                <h4 className="font-serif font-bold text-foreground text-sm mb-2 uppercase tracking-wide">{item.label}</h4>
                <div className="flex items-center justify-center gap-1.5 text-xs text-foreground flex-wrap">
                  <Phone className="w-3 h-3 text-primary flex-shrink-0" />
                  <span>{item.phone}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
