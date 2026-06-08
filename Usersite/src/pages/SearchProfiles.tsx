"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Heart, Briefcase, ChevronDown, MessageCircle, Send, Clock, Sparkles, Users, GraduationCap, Ruler } from "lucide-react";
import { profilesData, Profile } from "@/components/FeaturedProfiles";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ChoosePlanModal from "@/components/ChoosePlanModal";
import ProfileViewDrawer from "@/components/ProfileViewDrawer";
import { RELIGION_CASTE_MAP } from "@/data/religionCaste";

const allProfiles: Profile[] = [
  ...profilesData,
  { id: 7, name: "Riya Kapoor", age: 25, profession: "UI/UX Designer", education: "B.Des, NID Ahmedabad", location: "Bangalore, Karnataka", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop", isVerified: true, isPremium: false, compatibility: 89 },
  { id: 8, name: "Nisha Singh", age: 27, profession: "Lawyer", education: "LLB, NLU Delhi", location: "Lucknow, UP", image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop", isVerified: true, isPremium: true, compatibility: 91 },
  { id: 9, name: "Divya Nair", age: 24, profession: "Fashion Designer", education: "B.Des, Pearl Academy", location: "Mumbai, Maharashtra", image: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop", isVerified: true, isPremium: false, compatibility: 84 },
];

const maritalStatuses = ["Divorced", "Marriage Dropped", "Separated", "Single", "Waiting for Legal Divorce", "Widowed"];
const educationOptions = ["Aviation Degree", "B.A.", "B.A.M.S.", "B.Arch", "B.Com.", "B.Des", "B.E.", "B.Tech", "BBA", "BCA", "M.A.", "M.B.A.", "M.Com.", "M.D.", "M.E.", "M.Tech", "MBBS", "MCA", "Ph.D", "Other"];
const occupationOptions = ["Accounts/Finance Professional", "Administrative Professional", "Advertising / PR Professional", "Adviser", "Agriculture & Farming Professional", "Architect", "Business Owner", "Civil Services", "Doctor", "Engineer", "IT Professional", "Lawyer", "Teacher/Professor", "Other"];

const SearchProfiles = () => {
  const router = useRouter();
  const [likedProfiles, setLikedProfiles] = useState<number[]>([]);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [viewProfile, setViewProfile] = useState<Profile | null>(null);
  const [filters, setFilters] = useState({
    profileType: "all", onlyWithPhoto: false,
    ageFrom: "18", ageTo: "70",
    heightFrom: "120", heightTo: "200",
    maritalStatus: [] as string[], religion: [] as string[],
    caste: [] as string[], education: [] as string[],
    occupation: [] as string[],
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    age: true, height: true, maritalStatus: true, religion: true, caste: true, education: false, occupation: false,
  });

  const toggleLike = (id: number) => {
    setLikedProfiles(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFilterArray = (key: string, value: string) => {
    setFilters(prev => {
      const arr = (prev as any)[key] as string[];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const religions = Object.keys(RELIGION_CASTE_MAP);
  const castes = filters.religion.length > 0
    ? [...new Set(filters.religion.flatMap(r => RELIGION_CASTE_MAP[r] || []))]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="pt-24 sm:pt-28 pb-8 sm:pb-12 bg-gradient-romantic relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-primary/15 rounded-full blur-3xl animate-float-delayed" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2 animate-fade-in-up">
            Lakhs of <span className="text-gradient-gold">Happy Marriages</span>
          </h1>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button variant="hero" size="lg" className="mt-4 gap-2" onClick={() => router.push("/auth")}>
              Join now for Free 💍
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left Sidebar - Full Filter Panel */}
            <div className="lg:w-72 flex-shrink-0 w-full max-w-full">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl shadow-card p-4 border border-primary/5 lg:sticky lg:top-24 space-y-1 max-h-[80vh] overflow-y-auto">
                
                {/* Profile Type */}
                <div className="pb-3 border-b border-border">
                  <h4 className="font-serif font-bold text-foreground text-sm mb-2">Profile Type</h4>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={filters.onlyWithPhoto} onChange={() => setFilters(prev => ({ ...prev, onlyWithPhoto: !prev.onlyWithPhoto }))} className="accent-primary rounded" />
                    <span className="text-muted-foreground">Only With Photo</span>
                  </label>
                </div>

                {/* Age */}
                <FilterSection title="Age" icon={<Clock className="w-4 h-4" />} expanded={expandedSections.age} onToggle={() => toggleSection("age")}>
                  <div className="flex items-center gap-2">
                    <input type="range" min="18" max="70" value={filters.ageFrom} onChange={e => setFilters(prev => ({ ...prev, ageFrom: e.target.value }))} className="flex-1 accent-primary" />
                    <input type="range" min="18" max="70" value={filters.ageTo} onChange={e => setFilters(prev => ({ ...prev, ageTo: e.target.value }))} className="flex-1 accent-primary" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{filters.ageFrom}</span>
                    <span>{filters.ageTo}</span>
                  </div>
                </FilterSection>

                {/* Height */}
                <FilterSection title="Height" icon={<Ruler className="w-4 h-4" />} expanded={expandedSections.height} onToggle={() => toggleSection("height")}>
                  <div className="flex items-center gap-2">
                    <input type="range" min="120" max="200" value={filters.heightFrom} onChange={e => setFilters(prev => ({ ...prev, heightFrom: e.target.value }))} className="flex-1 accent-primary" />
                    <input type="range" min="120" max="200" value={filters.heightTo} onChange={e => setFilters(prev => ({ ...prev, heightTo: e.target.value }))} className="flex-1 accent-primary" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{filters.heightFrom}cm</span>
                    <span>{filters.heightTo}cm</span>
                  </div>
                </FilterSection>

                {/* Marital Status */}
                <FilterSection title="Marital Status" icon={<Heart className="w-4 h-4" />} expanded={expandedSections.maritalStatus} onToggle={() => toggleSection("maritalStatus")}>
                  <input type="text" placeholder="Search marital status.." className="w-full px-3 py-1.5 rounded-lg border border-primary/10 text-xs mb-2 bg-background" />
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {maritalStatuses.map(s => (
                      <label key={s} className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                        <input type="checkbox" checked={filters.maritalStatus.includes(s)} onChange={() => toggleFilterArray("maritalStatus", s)} className="accent-primary rounded" />
                        <span className="text-muted-foreground">{s}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                {/* Religion */}
                <FilterSection title="Religion" icon={<Sparkles className="w-4 h-4" />} expanded={expandedSections.religion} onToggle={() => toggleSection("religion")}>
                  <input type="text" placeholder="Search religion.." className="w-full px-3 py-1.5 rounded-lg border border-primary/10 text-xs mb-2 bg-background" />
                  {filters.religion.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {filters.religion.map(r => (
                        <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                          {r}
                          <button onClick={() => toggleFilterArray("religion", r)} className="hover:text-destructive">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {religions.map(r => (
                      <label key={r} className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                        <input type="checkbox" checked={filters.religion.includes(r)} onChange={() => toggleFilterArray("religion", r)} className="accent-primary rounded" />
                        <span className="text-muted-foreground">{r}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                {/* Caste */}
                <FilterSection title="Caste" icon={<Users className="w-4 h-4" />} expanded={expandedSections.caste} onToggle={() => toggleSection("caste")}>
                  <input type="text" placeholder="Search caste.." className="w-full px-3 py-1.5 rounded-lg border border-primary/10 text-xs mb-2 bg-background" />
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {castes.length > 0 ? castes.map(c => (
                      <label key={c} className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                        <input type="checkbox" checked={filters.caste.includes(c)} onChange={() => toggleFilterArray("caste", c)} className="accent-primary rounded" />
                        <span className="text-muted-foreground">{c}</span>
                      </label>
                    )) : <p className="text-xs text-muted-foreground italic">Select a religion first</p>}
                  </div>
                </FilterSection>

                {/* Education */}
                <FilterSection title="Education" icon={<GraduationCap className="w-4 h-4" />} expanded={expandedSections.education} onToggle={() => toggleSection("education")}>
                  <input type="text" placeholder="Search education.." className="w-full px-3 py-1.5 rounded-lg border border-primary/10 text-xs mb-2 bg-background" />
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {educationOptions.map(e => (
                      <label key={e} className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                        <input type="checkbox" checked={filters.education.includes(e)} onChange={() => toggleFilterArray("education", e)} className="accent-primary rounded" />
                        <span className="text-muted-foreground">{e}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                {/* Occupation */}
                <FilterSection title="Occupation" icon={<Briefcase className="w-4 h-4" />} expanded={expandedSections.occupation} onToggle={() => toggleSection("occupation")}>
                  <input type="text" placeholder="Search occupation.." className="w-full px-3 py-1.5 rounded-lg border border-primary/10 text-xs mb-2 bg-background" />
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {occupationOptions.map(o => (
                      <label key={o} className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                        <input type="checkbox" checked={filters.occupation.includes(o)} onChange={() => toggleFilterArray("occupation", o)} className="accent-primary rounded" />
                        <span className="text-muted-foreground">{o}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

              </motion.div>
            </div>

            {/* Right - Profiles */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                  Showing <span className="text-secondary">{allProfiles.length}</span> profiles
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground shrink-0">Sort by:</span>
                  <select className="flex-1 sm:flex-none min-w-0 px-3 py-2 rounded-lg border border-primary/10 text-sm bg-card">
                    <option>Most relative</option>
                    <option>Newest First</option>
                    <option>Best Match</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {allProfiles.map((profile, index) => (
                  <ListProfileCard key={profile.id} profile={profile} index={index} liked={likedProfiles.includes(profile.id)} onLike={() => toggleLike(profile.id)} onSendInterest={() => setPlanModalOpen(true)} onMoreDetails={() => setViewProfile(profile)} onImageClick={() => router.push("/auth")} />
                ))}
              </div>

              <div className="text-center mt-12">
                <Button variant="outline" size="lg" className="group">
                  Load More Profiles
                  <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ChoosePlanModal open={planModalOpen} onOpenChange={setPlanModalOpen} />
      <ProfileViewDrawer open={!!viewProfile} onOpenChange={(o) => !o && setViewProfile(null)} profile={viewProfile} onSendInterest={() => { setPlanModalOpen(true); setViewProfile(null); }} onOpenPlanModal={() => { setPlanModalOpen(true); setViewProfile(null); }} />

      <Footer />
    </div>
  );
};

/* Collapsible Filter Section */
const FilterSection = ({ title, icon, expanded, onToggle, children }: { title: string; icon: React.ReactNode; expanded: boolean; onToggle: () => void; children: React.ReactNode }) => (
  <div className="py-3 border-b border-border">
    <button onClick={onToggle} className="flex items-center justify-between w-full text-left">
      <div className="flex items-center gap-2 text-primary font-serif font-semibold text-sm">
        {icon} {title}
      </div>
      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
    </button>
    {expanded && <div className="mt-2">{children}</div>}
  </div>
);

const ListProfileCard = ({ profile, index, liked, onLike, onSendInterest, onMoreDetails, onImageClick }: { profile: Profile; index: number; liked: boolean; onLike: () => void; onSendInterest?: () => void; onMoreDetails?: () => void; onImageClick?: () => void }) => {
  const isOnline = index % 3 === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col md:flex-row md:items-start bg-card rounded-2xl overflow-hidden shadow-card border border-primary/5 hover-lift group"
    >
      <div className="w-full md:w-64 h-52 sm:h-56 md:h-64 flex-shrink-0 relative overflow-hidden bg-muted/30 cursor-pointer" onClick={() => onImageClick?.() ?? onMoreDetails?.()}>
        <div className={`absolute top-3 left-3 z-10 w-3.5 h-3.5 rounded-full border-2 border-card ${isOnline ? "bg-green-500" : "bg-muted-foreground/40"}`} />
        <img src={profile.image} alt={profile.name} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
        <div className={`absolute bottom-0 left-0 right-0 py-1.5 text-center text-xs font-medium text-primary-foreground ${isOnline ? "bg-green-600/90" : "bg-muted-foreground/70"}`}>
          {isOnline ? "Available Online" : "I'll be available on 10:00 AM"}
        </div>
      </div>
      <div className="p-3 sm:p-4 flex flex-col min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-primary group-hover:text-primary-dark transition-colors truncate min-w-0">{profile.name}</h3>
          <button type="button" onClick={(e) => { e.stopPropagation(); onLike(); }} className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
            <Heart className={`w-5 h-5 ${liked ? "fill-primary text-primary" : ""}`} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="px-2.5 py-0.5 bg-foreground text-primary-foreground text-xs font-medium rounded-md">{profile.education.split(",")[0]}</span>
          <span className="px-2.5 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-md">{profile.profession}</span>
          <span className="px-2.5 py-0.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-md">{profile.age} Years old</span>
          <span className="px-2.5 py-0.5 bg-accent text-accent-foreground text-xs font-medium rounded-md">Height: 155Cms</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-auto">
          <Button size="sm" variant="hero" className="gap-1 text-xs flex-1 sm:flex-initial min-w-[calc(50%-4px)] sm:min-w-0"><MessageCircle className="w-3.5 h-3.5 shrink-0" /> Chat now</Button>
          <Button size="sm" variant="outline" className="gap-1 text-xs flex-1 sm:flex-initial min-w-[calc(50%-4px)] sm:min-w-0">WhatsApp</Button>
          <Button size="sm" variant="outline" className="gap-1 text-xs flex-1 sm:flex-initial min-w-[calc(50%-4px)] sm:min-w-0" onClick={() => onSendInterest?.()}><Send className="w-3.5 h-3.5 shrink-0" /> Send interest</Button>
          <Button size="sm" variant="hero" className="gap-1 text-xs flex-1 sm:flex-initial min-w-[calc(50%-4px)] sm:min-w-0" onClick={() => onMoreDetails?.()}>More details</Button>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchProfiles;
