"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Shield, Phone, Mail, MapPinned, Clock, X, Check, Crown,
  Building2, Cake, Ruler, Briefcase, Sun, Lock,
} from "lucide-react";
import { profilesData } from "@/components/FeaturedProfiles";
import { useInterestStore, InterestStatus } from "@/stores/interestStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import ChoosePlanModal from "@/components/ChoosePlanModal";

const StatusChip = ({ status }: { status: InterestStatus }) => {
  const config = {
    pending: { label: 'Pending', className: 'bg-secondary/20 text-secondary-dark border-secondary/30', icon: Clock },
    accepted: { label: 'Accepted', className: 'bg-green-500/20 text-green-700 border-green-500/30', icon: Check },
    rejected: { label: 'Declined', className: 'bg-red-500/20 text-red-700 border-red-500/30', icon: X },
  };
  const { label, className, icon: Icon } = config[status];
  return (
    <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${className}`}>
      <Icon className="w-4 h-4" /> {label}
    </motion.span>
  );
};

const ProfileDetail = () => {
  const params = useParams();
  const id = (params?.id as string | undefined) ?? undefined;
  const router = useRouter();
  const hasPaidPlan = useAuthStore((s) => s.hasPaidPlan());
  const { favorites, toggleFavorite, sendInterest, getSentInterestStatus, canChat } = useInterestStore();
  const profile = profilesData.find(p => p.id === Number(id));
  const isFavorite = profile ? favorites.includes(profile.id) : false;
  const interestStatus = profile ? getSentInterestStatus(profile.id) : null;
  const chatEnabled = profile ? canChat(profile.id) : false;
  const [planModalOpen, setPlanModalOpen] = useState(false);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold mb-4">Profile Not Found</h1>
          <Button onClick={() => router.push("/search")}>Browse Profiles</Button>
        </div>
      </div>
    );
  }

  const handleSendInterest = () => {
    setPlanModalOpen(true);
  };
  const handlePlanPaySuccess = () => {
    if (profile) {
      sendInterest(0, profile.id, "Hi! I'd love to connect with you.");
      toast.success("Interest sent successfully! 💕", { description: `${profile.name} will be notified.` });
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(profile.id);
    toast.success(isFavorite ? "Removed from favorites" : `Added ${profile.name} to favorites! ❤️`);
  };

  const handleMessage = () => {
    if (chatEnabled) router.push(`/chat/${profile.id}`);
    else toast.info("Chat unavailable", { description: "You can chat once your interest is accepted." });
  };

  const quickInfo = [
    { icon: Building2, label: "CITY", value: profile.location.split(",")[0] },
    { icon: Cake, label: "AGE", value: `${profile.age}` },
    { icon: Ruler, label: "HEIGHT", value: "5.7" },
    { icon: Briefcase, label: "JOB", value: profile.profession.split(" ")[0].toUpperCase() },
  ];

  // Demo horoscope data (in real app would come from profile/API)
  const horoscope = {
    rashi: "Meena (Pisces)",
    nakshatra: "Revati",
    manglikStatus: "Non-Manglik",
    birthTime: "10:30 AM",
    birthPlace: profile.location.split(",")[0],
  };

  const galleryImages = [
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=300&fit=crop",
  ];

  return (
    <div className="min-h-screen bg-slate-50/80">
      <Navbar />

      <section className="pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          {/* Back */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <button
              onClick={() => { if (window.history.length > 1) router.back(); else router.push("/search"); }}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium">Back to search</span>
            </button>
          </motion.div>

          {/* Hero card: image + name + badges + actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl shadow-primary/5 border border-primary/5 overflow-hidden mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 sm:p-8">
              <div className="relative shrink-0 mx-auto sm:mx-0">
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden ring-2 ring-white shadow-lg">
                  <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="absolute -top-1 -right-1 flex flex-col gap-1">
                  {profile.isPremium && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-0.5 shadow">
                      <Crown className="w-3 h-3" /> Premium
                    </span>
                  )}
                  {profile.isVerified && (
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center gap-0.5">
                      <Shield className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-1">{profile.name}</h1>
                <p className="text-muted-foreground text-sm mb-3">
                  {profile.age} yrs · {profile.location.split(",")[0]} · {profile.profession}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                  <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg">100 viewers</span>
                  <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-700 text-xs font-semibold rounded-lg">Online</span>
                  {interestStatus && <StatusChip status={interestStatus} />}
                </div>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5"
                    onClick={handleMessage}
                  >
                    Chat now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-2 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={interestStatus ? undefined : handleSendInterest}
                  >
                    {interestStatus ? interestStatus : "Send interest"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          <ChoosePlanModal
            open={planModalOpen}
            onOpenChange={setPlanModalOpen}
            onPaySuccess={handlePlanPaySuccess}
          />

          {/* Content grid: 2 cols on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* About - spans 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-white rounded-2xl border border-primary/5 shadow-lg shadow-primary/5 p-6"
            >
              <h2 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary" /> About
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                I am a {profile.profession} working in {profile.location}. I completed my {profile.education} and am passionate about my career. I believe in maintaining a balance between work and personal life.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text.
              </p>
            </motion.div>

            {/* Quick info - 1 col */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-primary/5 shadow-lg shadow-primary/5 p-6"
            >
              <h2 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary" /> Details
              </h2>
              <ul className="space-y-3">
                {quickInfo.map((info, i) => {
                  const Icon = info.icon;
                  return (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{info.label}</p>
                        <p className="text-sm font-semibold text-foreground">{info.value}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            {/* Horoscope - 1 col */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-primary/5 shadow-lg shadow-primary/5 p-6"
            >
              <h2 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" /> Horoscope
              </h2>
              {hasPaidPlan ? (
                <div className="space-y-3 text-sm">
                  <div><p className="text-xs text-muted-foreground uppercase font-semibold">Rashi</p><p className="font-medium text-foreground">{horoscope.rashi}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase font-semibold">Nakshatra</p><p className="font-medium text-foreground">{horoscope.nakshatra}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase font-semibold">Manglik</p><p className="font-medium text-foreground">{horoscope.manglikStatus}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase font-semibold">Birth time</p><p className="font-medium text-foreground">{horoscope.birthTime}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase font-semibold">Birth place</p><p className="font-medium text-foreground">{horoscope.birthPlace}</p></div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Lock className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-3">Unlock with a plan</p>
                  <Button size="sm" variant="hero" className="rounded-xl" onClick={() => setPlanModalOpen(true)}>View plans</Button>
                </div>
              )}
            </motion.div>

            {/* Photo gallery - spans 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-2 bg-white rounded-2xl border border-primary/5 shadow-lg shadow-primary/5 p-6"
            >
              <h2 className="font-serif text-lg font-bold text-foreground mb-4">Photo gallery</h2>
              <div className="grid grid-cols-3 gap-3">
                {galleryImages.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden bg-muted ring-1 ring-black/5 hover:ring-primary/20 transition-all"
                  >
                    <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Contact - 1 col */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-primary/5 shadow-lg shadow-primary/5 p-6"
            >
              <h2 className="font-serif text-lg font-bold text-foreground mb-4">Contact</h2>
              {hasPaidPlan ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Phone</p>
                      <p className="text-sm font-medium text-foreground truncate">+92 (8800) 68 - 8960</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Email</p>
                      <p className="text-sm font-medium text-foreground truncate">{profile.name.toLowerCase().replace(" ", "")}@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPinned className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Address</p>
                      <p className="text-sm font-medium text-foreground">28800 Orchard Lake Road, Suite 180, {profile.location}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Lock className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-3">Unlock contact details</p>
                  <Button size="sm" variant="hero" className="rounded-xl" onClick={() => setPlanModalOpen(true)}>View plans</Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProfileDetail;
