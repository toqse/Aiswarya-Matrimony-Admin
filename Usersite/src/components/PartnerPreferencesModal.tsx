import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Check, Settings, Home, Globe, CheckSquare } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { RELIGION_CASTE_MAP } from "@/data/religionCaste";

const HEIGHTS = [
  "4'6\"","4'7\"","4'8\"","4'9\"","4'10\"","4'11\"",
  "5'0\"","5'1\"","5'2\"","5'3\"","5'4\"","5'5\"","5'6\"","5'7\"","5'8\"","5'9\"","5'10\"","5'11\"",
  "6'0\"","6'1\"","6'2\"","6'3\"","6'4\"","6'5\"","6'6\"",
];
const EDUCATION_OPTIONS = ["Any","10th","12th","Diploma","Bachelor's","Master's","PhD","Professional"];
const INCOME_OPTIONS = ["Any","Below ₹2 Lakhs","₹2–5 Lakhs","₹5–8 Lakhs","₹8–12 Lakhs","₹12–20 Lakhs","₹20+ Lakhs"];
const MARITAL_OPTIONS = ["Never Married","Divorced","Widower","Any"];
const LOCATIONS = ["Any","Kerala","Tamil Nadu","Karnataka","Andhra Pradesh","Maharashtra","Delhi","Gujarat","Others"];

type CastePref = "own" | "open" | "specific";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PartnerPreferencesModal = ({ open, onOpenChange }: Props) => {
  const { user } = useAuthStore();
  const userReligion = user?.religion || "Hindu";

  const [ageRange, setAgeRange] = useState([22, 32]);
  const [minHeight, setMinHeight] = useState("4'10\"");
  const [maxHeight, setMaxHeight] = useState("5'8\"");
  const [minEducation, setMinEducation] = useState("Any");
  const [minIncome, setMinIncome] = useState("Any");
  const [maritalStatus, setMaritalStatus] = useState("Never Married");
  const [location, setLocation] = useState("Kerala");
  const [castePref, setCastePref] = useState<CastePref>("open");
  const [selectedCastes, setSelectedCastes] = useState<string[]>([]);
  const [horoscopeRequired, setHoroscopeRequired] = useState("Any");
  const [mangalDosha, setMangalDosha] = useState("Any");

  const castes = useMemo(() => RELIGION_CASTE_MAP[userReligion] || [], [userReligion]);

  const toggleCaste = (c: string) => {
    setSelectedCastes(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const handleSave = () => {
    toast.success("Partner preferences saved!");
    onOpenChange(false);
  };

  const castePreferenceOptions: { key: CastePref; icon: React.ReactNode; label: string; desc: string }[] = [
    { key: "own", icon: <Home className="w-6 h-6" />, label: "Own Caste Only", desc: "Same caste profiles only" },
    { key: "open", icon: <Globe className="w-6 h-6" />, label: "Open to All Castes", desc: "No restriction at all" },
    { key: "specific", icon: <CheckSquare className="w-6 h-6" />, label: "Specific Castes", desc: "I'll choose which ones" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl p-0 gap-0 border-0 shadow-elevated">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary p-6 text-primary-foreground relative sticky top-0 z-10">
          <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
            <X className="w-4 h-4" />
          </button>
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" /> Partner Preferences
          </h2>
          <p className="text-sm opacity-90 mt-1">Set what you're looking for — filters your match results</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Age Range */}
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">🎂 Age Range</h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs font-bold text-primary uppercase mb-1">MIN AGE</p>
                <Slider value={[ageRange[0]]} min={18} max={55} step={1} onValueChange={(v) => setAgeRange([v[0], ageRange[1]])} />
                <p className="text-right text-sm font-bold text-foreground mt-1">{ageRange[0]}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase mb-1">MAX AGE</p>
                <Slider value={[ageRange[1]]} min={20} max={60} step={1} onValueChange={(v) => setAgeRange([ageRange[0], v[0]])} />
                <p className="text-right text-sm font-bold text-foreground mt-1">{ageRange[1]}</p>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">Looking for partner aged <strong>{ageRange[0]} – {ageRange[1]} years</strong></p>
          </div>

          {/* Height Range */}
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">📏 Height Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-primary uppercase mb-1">MIN HEIGHT</p>
                <select value={minHeight} onChange={(e) => setMinHeight(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-primary/10 focus:border-primary bg-card">
                  {HEIGHTS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase mb-1">MAX HEIGHT</p>
                <select value={maxHeight} onChange={(e) => setMaxHeight(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-primary/10 focus:border-primary bg-card">
                  {HEIGHTS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Education & Income */}
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">🎓 Education & Income</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-primary uppercase mb-1">MIN EDUCATION</p>
                <select value={minEducation} onChange={(e) => setMinEducation(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-primary/10 focus:border-primary bg-card">
                  {EDUCATION_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase mb-1">MIN ANNUAL INCOME</p>
                <select value={minIncome} onChange={(e) => setMinIncome(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-primary/10 focus:border-primary bg-card">
                  {INCOME_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Marital Status & Location */}
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">💍 Marital Status & Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-primary uppercase mb-2">PREFERRED MARITAL STATUS</p>
                <div className="flex flex-wrap gap-2">
                  {MARITAL_OPTIONS.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMaritalStatus(m)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        maritalStatus === m
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-primary/10 text-foreground hover:border-primary/30"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase mb-1">PREFERRED LOCATION</p>
                <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-primary/10 focus:border-primary bg-card">
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Caste Preference */}
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground mb-2 flex items-center gap-2">🤝 Caste / Denomination Preference</h3>
            <p className="text-sm text-muted-foreground mb-4">Which {userReligion} groups are you open to?</p>
            <div className="grid grid-cols-3 gap-3">
              {castePreferenceOptions.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { setCastePref(opt.key); if (opt.key !== "specific") setSelectedCastes([]); }}
                  className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                    castePref === opt.key
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-primary/10 hover:border-primary/30 bg-card"
                  }`}
                >
                  <span className={castePref === opt.key ? "text-primary" : "text-muted-foreground"}>{opt.icon}</span>
                  <p className={`text-sm font-bold ${castePref === opt.key ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  {castePref === opt.key && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </div>

            {/* Specific castes multi-select */}
            {castePref === "specific" && castes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-4 rounded-xl border border-primary/10 bg-card"
              >
                <p className="text-sm font-bold text-foreground mb-2">Select castes / denominations you're open to:</p>
                <p className="text-xs text-muted-foreground mb-3">You can select multiple castes</p>
                <div className="flex flex-wrap gap-2">
                  {castes.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCaste(c)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedCastes.includes(c)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-primary/10"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Horoscope preferences */}
          <div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">🔮 Horoscope Preferences</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-primary uppercase mb-2">HOROSCOPE MATCH REQUIRED?</p>
                  <div className="flex gap-2">
                    {["Yes", "No", "Any"].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setHoroscopeRequired(v)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          horoscopeRequired === v ? "bg-primary text-primary-foreground" : "bg-card border border-primary/10 text-foreground"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary uppercase mb-2">MANGAL DOSHA</p>
                  <div className="flex gap-2">
                    {["Yes", "No", "Any"].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setMangalDosha(v)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          mangalDosha === v ? "bg-primary text-primary-foreground" : "bg-card border border-primary/10 text-foreground"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-accent-rose/10 border border-primary/10">
            <h4 className="font-serif font-bold text-foreground mb-3 flex items-center gap-2">📋 Your Preferences Summary</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <p><span className="text-muted-foreground">🎂 Age:</span> <strong>{ageRange[0]}–{ageRange[1]} yrs</strong></p>
              <p><span className="text-muted-foreground">📏 Height:</span> <strong>{minHeight}–{maxHeight}</strong></p>
              <p><span className="text-muted-foreground">🎓 Education:</span> <strong>{minEducation}</strong></p>
              <p><span className="text-muted-foreground">💰 Income:</span> <strong>{minIncome}</strong></p>
              <p><span className="text-muted-foreground">💍 Marital:</span> <strong>{maritalStatus}</strong></p>
              <p><span className="text-muted-foreground">📍 Location:</span> <strong>{location}</strong></p>
              <p><span className="text-muted-foreground">🤝 Caste:</span> <strong>{castePref === "own" ? "Own caste" : castePref === "open" ? "Open to all" : `${selectedCastes.length} selected`}</strong></p>
              <p><span className="text-muted-foreground">🔮 Horoscope:</span> <strong>{horoscopeRequired.toLowerCase()}</strong></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-primary/10 flex gap-3 sticky bottom-0 bg-background">
          <Button variant="hero" size="lg" className="flex-1 gap-2" onClick={handleSave}>
            <Check className="w-5 h-5" /> Save Preferences
          </Button>
          <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerPreferencesModal;
