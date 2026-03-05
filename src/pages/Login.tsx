import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRole, UserRole } from "@/contexts/RoleContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DEMO_ACCOUNTS: Record<UserRole, { mobile: string; otp: string; label: string }> = {
  admin: { mobile: "9876543210", otp: "1234", label: "Super Admin" },
  "branch-manager": { mobile: "9876543211", otp: "5678", label: "Branch Manager" },
  staff: { mobile: "9876543212", otp: "9012", label: "Staff" },
};

const ROLES: { value: UserRole; label: string; desc: string; emoji: string }[] = [
  { value: "admin", label: "Admin", desc: "Full system access", emoji: "👑" },
  { value: "branch-manager", label: "Branch\nManager", desc: "Branch-level management", emoji: "🏢" },
  { value: "staff", label: "Staff", desc: "Staff operations", emoji: "👨‍💼" },
];

const OTP_LENGTH = 4;
const OTP_VALIDITY = 120; // seconds

export default function Login() {
  const navigate = useNavigate();
  const { login } = useRole();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [mobile, setMobile] = useState("");
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(OTP_VALIDITY);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (step === "otp" && timer > 0) {
      timerRef.current = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(timerRef.current!);
    }
    if (timer === 0 && timerRef.current) clearInterval(timerRef.current);
  }, [step, timer]);

  const formatTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(v);
  };

  const handleSendOtp = async () => {
    if (!selectedRole) return toast({ title: "Select a role", variant: "destructive" });
    if (mobile.length !== 10) return toast({ title: "Enter valid 10-digit mobile", variant: "destructive" });

    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);

    const demo = DEMO_ACCOUNTS[selectedRole];
    toast({
      title: "🔐 OTP SENT!",
      description: `Demo Account:\nRole: ${demo.label}\nMobile: +91 ${demo.mobile}\nOTP: ${demo.otp}`,
    });

    setStep("otp");
    setTimer(OTP_VALIDITY);
    setOtp(Array(OTP_LENGTH).fill(""));
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleOtpChange = useCallback(
    (idx: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      const next = [...otp];
      next[idx] = value;
      setOtp(next);
      if (value && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
    },
    [otp],
  );

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((c, i) => (next[i] = c));
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    if (!selectedRole) return;
    const entered = otp.join("");
    if (entered.length !== OTP_LENGTH) return toast({ title: "Enter complete OTP", variant: "destructive" });
    if (timer <= 0) return toast({ title: "OTP expired. Resend OTP.", variant: "destructive" });

    const demo = DEMO_ACCOUNTS[selectedRole];
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 1000));
    setVerifying(false);

    if (entered !== demo.otp) return toast({ title: "Invalid OTP", variant: "destructive" });

    toast({ title: `✅ LOGIN SUCCESSFUL!\nWelcome ${demo.label}` });
    login(selectedRole);
    navigate("/", { replace: true });
  };

  const handleResend = () => {
    if (timer > 0) return;
    handleSendOtp();
  };

  const goBack = () => {
    setStep("mobile");
    setOtp(Array(OTP_LENGTH).fill(""));
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(15 80% 92%) 0%, hsl(30 90% 90%) 30%, hsl(8 100% 94%) 60%, hsl(340 40% 90%) 100%)" }}>
      {/* Floating circles matching reference */}
      <div className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, hsl(20 90% 75% / 0.5), hsl(30 100% 80% / 0.2))" }} />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, hsl(35 100% 70% / 0.35), hsl(40 100% 80% / 0.1))" }} />
      <div className="absolute top-1/4 right-10 w-[250px] h-[250px] rounded-full" style={{ background: "radial-gradient(circle, hsl(340 50% 80% / 0.4), hsl(350 40% 85% / 0.1))" }} />
      <div className="absolute bottom-1/4 left-1/4 w-[180px] h-[180px] rounded-full" style={{ background: "radial-gradient(circle, hsl(25 80% 80% / 0.3), transparent)" }} />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, hsl(333 60% 34%), hsl(333 50% 40%))" }}>
            <span className="text-3xl">💍</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">AIswarya Matrimony</h1>
          <p className="text-muted-foreground text-sm">Staff & Management Login</p>
        </div>

        <Card className="border-0 shadow-elegant backdrop-blur-sm bg-card/95 overflow-hidden rounded-2xl">
          <CardContent className="p-6 space-y-6 pt-6">
            {step === "mobile" ? (
              <>
                {/* Role Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground">Select Your Role</label>
                  <div className="grid grid-cols-3 gap-3">
                    {ROLES.map((r) => {
                      const active = selectedRole === r.value;
                      return (
                        <button
                          key={r.value}
                          onClick={() => setSelectedRole(r.value)}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group
                            ${active
                              ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                              : "border-border hover:border-primary/40 hover:bg-muted/50"
                            }`}
                        >
                          {active && (
                            <CheckCircle2 className="absolute top-1.5 right-1.5 h-4 w-4 text-primary" />
                          )}
                          <span className="text-3xl">{r.emoji}</span>
                          <span className={`text-xs font-semibold text-center whitespace-pre-line ${active ? "text-primary" : "text-foreground"}`}>{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-lg border border-input bg-muted text-sm font-medium text-muted-foreground shrink-0">
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="Enter 10-digit mobile"
                      value={mobile}
                      onChange={handleMobileChange}
                      maxLength={10}
                      className="text-base tracking-wider"
                    />
                  </div>
                  {mobile.length > 0 && mobile.length < 10 && (
                    <p className="text-xs text-destructive">Enter a valid 10-digit number</p>
                  )}
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={!selectedRole || mobile.length !== 10 || sending}
                  className="w-full h-12 text-base font-semibold gap-2 rounded-xl"
                  size="lg"
                  style={{ background: "linear-gradient(135deg, hsl(333 60% 34%), hsl(333 40% 55%))" }}
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>📱</span>}
                  {sending ? "Sending OTP..." : "Send OTP"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">Secure login with OTP verification</p>

                {/* Demo accounts hint */}
                <div className="rounded-lg bg-muted/60 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">Demo Accounts</p>
                  {ROLES.map((r) => {
                    const d = DEMO_ACCOUNTS[r.value];
                    return (
                      <p key={r.value} className="text-xs text-muted-foreground font-mono">
                        {r.label.replace('\n', ' ')}: {d.mobile} → OTP: {d.otp}
                      </p>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* OTP Step */}
                <button onClick={goBack} className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <ArrowLeft className="h-4 w-4" /> Change Mobile Number
                </button>

                <div className="text-center space-y-1">
                  <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Verify OTP</h2>
                  <p className="text-sm text-muted-foreground">
                    OTP sent to <span className="font-semibold text-foreground">+91 {mobile}</span>
                  </p>
                </div>

                {/* OTP Boxes */}
                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 border-input bg-background text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className="text-center">
                  {timer > 0 ? (
                    <p className={`text-sm font-mono font-semibold ${timer <= 30 ? "text-destructive" : "text-muted-foreground"}`}>
                      OTP valid for {formatTimer(timer)}
                    </p>
                  ) : (
                    <p className="text-sm text-destructive font-semibold">OTP Expired</p>
                  )}
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={otp.join("").length !== OTP_LENGTH || verifying || timer <= 0}
                  className="w-full h-12 text-base font-semibold gap-2"
                  size="lg"
                >
                  {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  {verifying ? "Verifying..." : "Verify & Login"}
                </Button>

                <div className="text-center">
                  <button
                    onClick={handleResend}
                    disabled={timer > 0}
                    className={`text-sm font-medium ${timer > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline cursor-pointer"}`}
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">© 2026 AIswarya Matrimony. All rights reserved.</p>
      </div>
    </div>
  );
}
