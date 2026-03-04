import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Check, User, Baby, Heart, Users, UserPlus, Camera, Image, Contact, SmilePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  "Profile For",
  "Basic Info",
  "Location",
  "Religion",
  "Personal",
  "Education",
  "About Me",
  "Photos",
] as const;

const profileForOptions = [
  { label: "Myself", emoji: "👤" },
  { label: "Son", emoji: "👦" },
  { label: "Daughter", emoji: "👧" },
  { label: "Brother", emoji: "👨" },
  { label: "Sister", emoji: "👩" },
  { label: "Friend", emoji: "🤝" },
  { label: "Relative", emoji: "👨‍👩‍👦" },
];

const complexionOptions = ["Fair", "Wheatish", "Dusky", "Dark"];

interface AddProfileWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (profile: any) => void;
}

export default function AddProfileWizard({ open, onOpenChange, onComplete }: AddProfileWizardProps) {
  const [step, setStep] = useState(0);
  const { toast } = useToast();

  const [form, setForm] = useState({
    profileFor: "",
    // Basic Info
    fullName: "",
    mobile: "",
    otpSent: false,
    otpVerified: false,
    otp: "",
    email: "",
    dob: "",
    gender: "",
    termsAgreed: false,
    // Location
    country: "India",
    state: "",
    district: "",
    city: "",
    address: "",
    // Religion
    religion: "",
    motherTongue: "",
    // Personal
    maritalStatus: "",
    hasChildren: false,
    numberOfMarriages: 0,
    numberOfChildren: 0,
    height: "",
    weight: "",
    complexion: "",
    annualIncome: "",
    // Education
    highestEducation: "",
    educationSubject: "",
    employmentStatus: "",
    occupation: "",
    // About Me
    aboutMe: "",
    // Photos
    aadhaarNumber: "",
  });

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const completionPercent = Math.round(((step + 1) / STEPS.length) * 100);

  const canContinue = () => {
    switch (step) {
      case 0: return !!form.profileFor;
      case 1: return !!form.fullName && !!form.mobile && !!form.dob && !!form.gender && form.termsAgreed;
      case 2: return !!form.country && !!form.state;
      case 3: return !!form.religion && !!form.motherTongue;
      case 4: return !!form.maritalStatus && !!form.height;
      case 5: return !!form.highestEducation && !!form.employmentStatus;
      case 6: return true;
      case 7: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      onComplete({
        name: form.fullName,
        gender: form.gender,
        age: form.dob ? Math.floor((Date.now() - new Date(form.dob).getTime()) / 31557600000) : 25,
        religion: form.religion || "Hindu",
        caste: "",
        maritalStatus: form.maritalStatus || "Never Married",
        subscription: "None",
        verified: form.otpVerified,
        completeness: form.aboutMe ? 90 : 60,
      });
      setStep(0);
      resetForm();
    }
  };

  const resetForm = () => {
    setForm({
      profileFor: "", fullName: "", mobile: "", otpSent: false, otpVerified: false, otp: "", email: "", dob: "", gender: "", termsAgreed: false,
      country: "India", state: "", district: "", city: "", address: "",
      religion: "", motherTongue: "",
      maritalStatus: "", hasChildren: false, numberOfMarriages: 0, numberOfChildren: 0, height: "", weight: "", complexion: "", annualIncome: "",
      highestEducation: "", educationSubject: "", employmentStatus: "", occupation: "",
      aboutMe: "", aadhaarNumber: "",
    });
  };

  const sendOtp = () => {
    if (form.mobile.length >= 10) {
      update("otpSent", true);
      toast({ title: "OTP Sent", description: `OTP sent to +91 ${form.mobile}` });
    }
  };

  const verifyOtp = () => {
    if (form.otp.length === 6) {
      update("otpVerified", true);
      toast({ title: "Verified!", description: "Mobile number verified successfully" });
    }
  };

  const showChildrenPopup = ["Divorced", "Widowed", "Awaiting Divorce"].includes(form.maritalStatus);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setStep(0); resetForm(); } onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-0">
        <div className="flex min-h-[70vh]">
          {/* Sidebar */}
          <div className="w-56 shrink-0 gradient-primary text-primary-foreground p-6 flex flex-col gap-4 rounded-l-lg">
            <div>
              <h2 className="font-bold text-lg">Aiswarya Matrimony</h2>
              <p className="text-xs opacity-80">39 Years of Trust</p>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="opacity-80">Profile Completion</span>
                <span className="font-bold text-accent">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2 bg-primary-foreground/20" />
            </div>
            <nav className="mt-4 space-y-1">
              {STEPS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    i === step
                      ? "bg-primary-foreground/20 font-bold"
                      : i < step
                      ? "opacity-90 hover:bg-primary-foreground/10 cursor-pointer"
                      : "opacity-50 cursor-default"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i < step
                      ? "bg-success text-success-foreground"
                      : i === step
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary-foreground/20"
                  }`}>
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  {s}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 bg-secondary/30 flex flex-col">
            <div className="flex-1">
              {/* Step 0: Profile For */}
              {step === 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Who are you registering for?</h2>
                  <p className="text-muted-foreground text-sm mt-1 mb-6">Select who you're registering the profile for</p>
                  <div className="grid grid-cols-4 gap-4">
                    {profileForOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => update("profileFor", opt.label)}
                        className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                          form.profileFor === opt.label
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <span className="text-3xl">{opt.emoji}</span>
                        <span className="text-sm font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Basic Information</h2>
                  <p className="text-muted-foreground text-sm mt-1 mb-6">Tell us the basic details</p>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Full Name *</Label>
                      <Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Enter full name" className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Mobile Number *</Label>
                      <div className="flex gap-2 mt-1.5">
                        <div className="flex items-center px-3 bg-muted rounded-md text-sm font-medium">+91</div>
                        <Input value={form.mobile} onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Enter mobile" className="flex-1" />
                        <Button onClick={sendOtp} disabled={form.mobile.length < 10 || form.otpVerified} size="sm" className="bg-primary shrink-0">
                          {form.otpVerified ? "Verified ✓" : "Send OTP"}
                        </Button>
                      </div>
                    </div>
                    {form.otpSent && !form.otpVerified && (
                      <div className="col-span-2">
                        <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 bg-primary/5">
                          <Label className="text-xs font-bold text-muted-foreground">Enter 6-digit OTP (Auto-fill enabled)</Label>
                          <div className="flex gap-2 mt-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <Input
                                key={i}
                                maxLength={1}
                                value={form.otp[i] || ""}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "");
                                  const newOtp = form.otp.split("");
                                  newOtp[i] = val;
                                  update("otp", newOtp.join(""));
                                  if (val && e.target.nextElementSibling) (e.target.nextElementSibling as HTMLInputElement)?.focus();
                                }}
                                className="w-12 h-12 text-center text-lg font-bold"
                              />
                            ))}
                            <Button onClick={verifyOtp} size="sm" className="ml-2 self-center">Verify</Button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Email (Optional)</Label>
                      <Input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date of Birth *</Label>
                      <Input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} className="mt-1.5" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Gender *</Label>
                      <div className="flex gap-3 mt-2">
                        {["Male", "Female"].map((g) => (
                          <button
                            key={g}
                            onClick={() => update("gender", g)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full border-2 transition-all text-sm font-medium ${
                              form.gender === g
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <span>{g === "Male" ? "👨" : "👩"}</span> {g}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 bg-card rounded-xl p-4 border flex items-center gap-3">
                      <Checkbox checked={form.termsAgreed} onCheckedChange={(v) => update("termsAgreed", !!v)} />
                      <span className="text-sm">I agree to the Terms & Conditions and Privacy Policy</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Location</h2>
                  <p className="text-muted-foreground text-sm mt-1 mb-6">Where are you based?</p>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-destructive">Country *</Label>
                      <Select value={form.country} onValueChange={(v) => update("country", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="USA">USA</SelectItem>
                          <SelectItem value="UK">UK</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-destructive">State *</Label>
                      <Select value={form.state} onValueChange={(v) => update("state", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select State" /></SelectTrigger>
                        <SelectContent>
                          {["Kerala", "Tamil Nadu", "Karnataka", "Andhra Pradesh", "Maharashtra", "Gujarat", "Delhi", "Uttar Pradesh"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">District</Label>
                      <Input value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="Type or select district" className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">City / Town</Label>
                      <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City / Town" className="mt-1.5" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Address</Label>
                      <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Full address" className="mt-1.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Religion */}
              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Religion</h2>
                  <p className="text-muted-foreground text-sm mt-1 mb-6">Religious background helps us find better matches</p>
                  <div className="space-y-5">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-destructive">Religion *</Label>
                      <Select value={form.religion} onValueChange={(v) => update("religion", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select Religion" /></SelectTrigger>
                        <SelectContent>
                          {["Hindu", "Christian", "Muslim", "Jain", "Sikh", "Buddhist", "Parsi"].map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-destructive">Mother Tongue *</Label>
                      <Select value={form.motherTongue} onValueChange={(v) => update("motherTongue", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select Language" /></SelectTrigger>
                        <SelectContent>
                          {["Malayalam", "Tamil", "Telugu", "Kannada", "Hindi", "English", "Bengali", "Marathi", "Gujarati", "Urdu"].map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Personal */}
              {step === 4 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Personal</h2>
                  <p className="text-muted-foreground text-sm mt-1 mb-6">Physical and personal details</p>
                  <div className="space-y-5">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-destructive">Marital Status *</Label>
                      <Select value={form.maritalStatus} onValueChange={(v) => {
                        update("maritalStatus", v);
                        if (v === "Never Married") {
                          update("hasChildren", false);
                          update("numberOfMarriages", 0);
                          update("numberOfChildren", 0);
                        }
                      }}>
                        <SelectTrigger className="mt-1.5 max-w-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Never Married">Never Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                          <SelectItem value="Awaiting Divorce">Awaiting Divorce</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Children popup for Divorced/Widowed/Awaiting Divorce */}
                    {showChildrenPopup && (
                      <div className="bg-card rounded-xl border p-5 shadow-elegant space-y-4">
                        <p className="font-semibold text-foreground">Do you have children?</p>
                        <div className="flex gap-3">
                          {[true, false].map((val) => (
                            <button
                              key={String(val)}
                              onClick={() => {
                                update("hasChildren", val);
                                if (!val) { update("numberOfMarriages", 0); update("numberOfChildren", 0); }
                              }}
                              className={`px-6 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                                form.hasChildren === val
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              {val ? "Yes" : "No"}
                            </button>
                          ))}
                        </div>
                        {form.hasChildren && (
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">No. of Marriages</Label>
                              <Input type="number" min={0} value={form.numberOfMarriages} onChange={(e) => update("numberOfMarriages", parseInt(e.target.value) || 0)} className="mt-1.5" />
                            </div>
                            <div>
                              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">No. of Children</Label>
                              <Input type="number" min={0} value={form.numberOfChildren} onChange={(e) => update("numberOfChildren", parseInt(e.target.value) || 0)} className="mt-1.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wide text-destructive">Height (cm) *</Label>
                        <Input value={form.height} onChange={(e) => update("height", e.target.value)} placeholder="e.g. 165" className="mt-1.5" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Weight (kg) — Optional</Label>
                        <Input value={form.weight} onChange={(e) => update("weight", e.target.value)} placeholder="e.g. 58" className="mt-1.5" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Complexion</Label>
                      <div className="flex gap-3 mt-2">
                        {complexionOptions.map((c) => (
                          <button
                            key={c}
                            onClick={() => update("complexion", c)}
                            className={`px-5 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                              form.complexion === c
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Annual Income</Label>
                      <Select value={form.annualIncome} onValueChange={(v) => update("annualIncome", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select Income Range" /></SelectTrigger>
                        <SelectContent>
                          {["Below 2 Lakhs", "2-5 Lakhs", "5-10 Lakhs", "10-20 Lakhs", "20-50 Lakhs", "50 Lakhs - 1 Crore", "Above 1 Crore"].map((i) => (
                            <SelectItem key={i} value={i}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Education */}
              {step === 5 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Education</h2>
                  <p className="text-muted-foreground text-sm mt-1 mb-6">Education and career details</p>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-destructive">Highest Education *</Label>
                      <Select value={form.highestEducation} onValueChange={(v) => update("highestEducation", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select Education" /></SelectTrigger>
                        <SelectContent>
                          {["10th", "12th", "Diploma", "Bachelor's", "Master's", "PhD", "Professional Degree"].map((e) => (
                            <SelectItem key={e} value={e}>{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Education Subject</Label>
                      <Input value={form.educationSubject} onChange={(e) => update("educationSubject", e.target.value)} placeholder="e.g. Computer Science" className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-destructive">Employment Status *</Label>
                      <Select value={form.employmentStatus} onValueChange={(v) => update("employmentStatus", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select Status" /></SelectTrigger>
                        <SelectContent>
                          {["Employed", "Self-Employed", "Business", "Student", "Unemployed", "Retired"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Occupation</Label>
                      <Select value={form.occupation} onValueChange={(v) => update("occupation", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select Occupation" /></SelectTrigger>
                        <SelectContent>
                          {["Software Engineer", "Doctor", "Teacher", "Government Job", "Private Job", "Business Owner", "Lawyer", "Engineer", "Other"].map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Annual Income</Label>
                      <Select value={form.annualIncome} onValueChange={(v) => update("annualIncome", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select Income Range" /></SelectTrigger>
                        <SelectContent>
                          {["Below 2 Lakhs", "2-5 Lakhs", "5-10 Lakhs", "10-20 Lakhs", "20-50 Lakhs", "50 Lakhs - 1 Crore", "Above 1 Crore"].map((i) => (
                            <SelectItem key={i} value={i}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: About Me */}
              {step === 6 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">About Me</h2>
                  <p className="text-muted-foreground text-sm mt-1 mb-6">Write a short bio to help potential matches know you better</p>
                  <div className="space-y-3">
                    <div className="relative">
                      <Textarea
                        value={form.aboutMe}
                        onChange={(e) => update("aboutMe", e.target.value)}
                        placeholder="Write about yourself, interests, hobbies, values and what you are looking for in a partner..."
                        rows={6}
                        className="resize-none"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute bottom-3 right-3 bg-accent text-accent-foreground border-accent hover:bg-accent/80 text-xs font-bold gap-1"
                        onClick={() => toast({ title: "AI Assist", description: "AI bio generation coming soon!" })}
                      >
                        ✨ AI Help me write this
                      </Button>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Minimum 50 characters ({form.aboutMe.length} characters typed)</span>
                      <button className="text-primary hover:underline" onClick={() => toast({ title: "Need more?", description: "You can add more details in profile edit later." })}>
                        Need more content
                      </button>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleNext()} className="text-xs">
                      Skip for now
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 7: Photos */}
              {step === 7 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Add Photos</h2>
                  <p className="text-muted-foreground text-sm mt-1 mb-6">Photos greatly improve your match rate. All photos are auto-cropped to the required size.</p>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Full Photo (300×450)", sub: "300×450 px", icon: "🖼️" },
                      { label: "Passport Size (120×150)", sub: "120×150 px", icon: "🪪" },
                      { label: "Selfie", sub: "Square px", icon: "🤳" },
                      { label: "Family Photo (400×180)", sub: "400×180 px", icon: "👨‍👩‍👧" },
                    ].map((p) => (
                      <button
                        key={p.label}
                        onClick={() => toast({ title: "Upload", description: `${p.label} upload coming soon!` })}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all bg-card"
                      >
                        <span className="text-2xl">{p.icon}</span>
                        <span className="text-xs font-medium text-center">{p.label}</span>
                        <span className="text-[10px] text-muted-foreground">{p.sub}</span>
                      </button>
                    ))}
                  </div>

                  <div className="bg-card rounded-xl border p-5 shadow-elegant space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm">ID Verification (Aadhaar)</h3>
                      <Badge variant="outline" className="text-xs">OPTIONAL</Badge>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Aadhaar Number</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          value={form.aadhaarNumber}
                          onChange={(e) => update("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))}
                          placeholder="XXXX XXXX XXXX"
                          className="flex-1"
                        />
                        <Button
                          onClick={() => toast({ title: "Aadhaar Verification", description: "Verification service coming soon!" })}
                          className="bg-primary shrink-0"
                          disabled={form.aadhaarNumber.length < 12}
                        >
                          Verify Aadhaar
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-success" /> Verified badge shown on your profile. Stored securely in app memory.
                    </p>
                  </div>

                  <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={() => handleNext()}>
                    Skip / Complete Later
                  </Button>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex justify-between items-center pt-6 mt-6 border-t">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="border-primary text-primary hover:bg-primary/5">
                  ← Back
                </Button>
              ) : <div />}
              <Button
                onClick={handleNext}
                disabled={!canContinue()}
                className="bg-primary hover:bg-primary/90 px-8"
              >
                {step === STEPS.length - 1 ? "Complete Profile" : "Continue →"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
