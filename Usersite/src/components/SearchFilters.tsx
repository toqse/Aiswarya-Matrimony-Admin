import { useState } from "react";
import { Search, Calendar, Heart, Sparkles, ChevronDown, UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { RELIGION_CASTE_MAP } from "@/data/religionCaste";
import { toast } from "sonner";

const selectClass = "w-full px-3 py-3 rounded-xl border-2 border-primary/10 bg-white focus:border-primary focus:ring-0 transition-all appearance-none cursor-pointer text-sm";
const inputClass = "w-full px-3 py-3 rounded-xl border-2 border-primary/10 bg-white focus:border-primary focus:ring-0 transition-all text-sm";

const SearchFilters = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"register" | "search">("search");

  // Search state
  const [lookingFor, setLookingFor] = useState("Bride");
  const [ageFrom, setAgeFrom] = useState("18");
  const [ageTo, setAgeTo] = useState("33");
  const [height, setHeight] = useState("");
  const [religion, setReligion] = useState("");
  const [caste, setCaste] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regGender, setRegGender] = useState("Male");
  const [regDob, setRegDob] = useState("");
  const [regReligion, setRegReligion] = useState("");
  const [regCaste, setRegCaste] = useState("");

  const minAge = lookingFor === "Bride" ? 18 : 21;
  const maxAge = 60;
  const ages = Array.from({ length: maxAge - 18 + 1 }, (_, i) => (18 + i).toString());
  const fromAges = ages.filter(a => Number(a) >= minAge);
  const toAges = ages.filter(a => Number(a) >= Number(ageFrom));

  const heightOptions = ["", "140 - 150 cm", "150 - 160 cm", "160 - 170 cm", "170 - 180 cm", "180 cm & above"];
  const religionOptions = ["Hindu", "Christian", "Muslim", "Caste no bar", "Intercaste"];
  const castes = religion ? RELIGION_CASTE_MAP[religion] || [] : [];
  const regCastes = regReligion ? RELIGION_CASTE_MAP[regReligion] || [] : [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (lookingFor) params.set("gender", lookingFor);
    params.set("ageFrom", ageFrom);
    params.set("ageTo", ageTo);
    if (height) params.set("height", height);
    if (religion) params.set("religion", religion);
    if (caste) params.set("caste", caste);
    router.push(`/search?${params.toString()}`);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regMobile) {
      toast.error("Please fill Name and Mobile Number");
      return;
    }
    router.push("/auth");
  };

  return (
    <section id="search" className="py-12 sm:py-16 md:py-20 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-rose/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-gold/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-rose border border-primary/10 mb-4">
            <Search className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Find Your Match</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Discover Your <span className="text-gradient-primary">Perfect Partner</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Use our advanced search to find someone who truly understands you
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-elevated border border-primary/5 animate-scale-in">
            {/* Tabs */}
            <div className="flex justify-center gap-0 mb-8">
              <button
                onClick={() => setActiveTab("register")}
                className={`px-8 py-3 font-serif font-bold text-lg border-b-3 transition-all ${
                  activeTab === "register"
                    ? "border-b-2 border-primary text-primary"
                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Register
              </button>
              <button
                onClick={() => setActiveTab("search")}
                className={`px-8 py-3 font-serif font-bold text-lg border-b-3 transition-all ${
                  activeTab === "search"
                    ? "border-b-2 border-primary text-primary"
                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Search
              </button>
            </div>

            {activeTab === "search" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 items-end">
                  {/* Looking For */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">I am Looking for a</label>
                    <div className="relative">
                      <select value={lookingFor} onChange={e => { setLookingFor(e.target.value); setAgeFrom(e.target.value === "Groom" ? "21" : "18"); }} className={selectClass}>
                        <option>Bride</option>
                        <option>Groom</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Age Range - single box with two selects and divider */}
                  <div className="flex flex-col items-center">
                    <label className="block text-xs font-medium text-foreground mb-1.5">Age</label>
                    <div className="flex items-stretch rounded-xl border border-primary/10 bg-white shadow-sm overflow-hidden w-full max-w-[140px]">
                      <div className="relative flex-1 min-w-0">
                        <select
                          value={ageFrom}
                          onChange={e => setAgeFrom(e.target.value)}
                          className="w-full px-3 py-3 bg-transparent border-0 focus:ring-0 focus:outline-none appearance-none cursor-pointer text-sm font-semibold text-center [&>option]:font-normal"
                        >
                          {fromAges.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                      </div>
                      <div className="w-px bg-primary/15 shrink-0" aria-hidden />
                      <div className="relative flex-1 min-w-0">
                        <select
                          value={ageTo}
                          onChange={e => setAgeTo(e.target.value)}
                          className="w-full px-3 py-3 bg-transparent border-0 focus:ring-0 focus:outline-none appearance-none cursor-pointer text-sm font-semibold text-center [&>option]:font-normal"
                        >
                          {toAges.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Height</label>
                    <div className="relative">
                      <select value={height} onChange={e => setHeight(e.target.value)} className={selectClass}>
                        <option value="">Select</option>
                        {heightOptions.filter(Boolean).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Religion */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Religion</label>
                    <div className="relative">
                      <select value={religion} onChange={e => { setReligion(e.target.value); setCaste(""); }} className={selectClass}>
                        <option value="">Select</option>
                        {religionOptions.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Caste */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Caste</label>
                    <div className="relative">
                      <select value={caste} onChange={e => setCaste(e.target.value)} className={selectClass} disabled={!religion}>
                        <option value="">Select Caste</option>
                        {castes.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Search Button */}
                  <Button variant="default" size="lg" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-bold" onClick={handleSearch}>
                    <Search className="w-5 h-5 mr-1" />
                    Search
                  </Button>
                </div>
              </>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Name</label>
                    <input type="text" placeholder="Name" value={regName} onChange={e => setRegName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Mobile No.</label>
                    <input type="tel" placeholder="Mobile No" value={regMobile} onChange={e => setRegMobile(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Gender</label>
                    <div className="relative">
                      <select value={regGender} onChange={e => setRegGender(e.target.value)} className={selectClass}>
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Date of Birth</label>
                    <input type="date" value={regDob} onChange={e => setRegDob(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Religion</label>
                    <div className="relative">
                      <select value={regReligion} onChange={e => { setRegReligion(e.target.value); setRegCaste(""); }} className={selectClass}>
                        <option value="">Select</option>
                        {religionOptions.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Caste</label>
                    <div className="relative">
                      <select value={regCaste} onChange={e => setRegCaste(e.target.value)} className={selectClass} disabled={!regReligion}>
                        <option value="">Select</option>
                        {regCastes.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <Button type="submit" variant="default" size="lg" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-bold">
                    <UserPlus className="w-5 h-5 mr-1" />
                    Free Register
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchFilters;
