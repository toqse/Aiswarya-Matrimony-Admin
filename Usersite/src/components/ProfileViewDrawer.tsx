import { useState, useEffect, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  type LucideIcon,
  X,
  Heart,
  Sparkles,
  Lock,
  User,
  Briefcase,
  ClipboardList,
  Users,
  Moon,
  Phone,
  Eye,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Profile } from "@/components/FeaturedProfiles";
import { useAuthStore } from "@/stores/authStore";
import { useInterestStore } from "@/stores/interestStore";
import { toast } from "sonner";
import UseCreditDialog, {
  type CreditDialogVariant,
} from "@/components/UseCreditDialog";
import type { ProfilePreviewData } from "@/lib/matchesApi";
import { getProfilePreview, unlockContactDetails } from "@/lib/matchesApi";
import {
  mapFullProfileToDrawerDisplay,
  type FullProfileDrawerDisplay,
} from "@/lib/profileFullMapper";
import { useRouter } from "next/navigation";
import { cn, formatDateDdMmYyyy } from "@/lib/utils";

/** KYC / ID slots — omit from the profile gallery (API may still return URLs). */
function isHiddenProfilePhotoKey(key: string): boolean {
  const n = String(key).toLowerCase().replace(/-/g, "_");
  return (
    n === "aadhaar_front" ||
    n === "aadhaar_back" ||
    n === "aadhar_front" ||
    n === "aadhar_back"
  );
}

type FieldItem = { label: string; value: string; wide?: boolean };

function chunkLongToken(token: string, maxLen: number): string[] {
  if (token.length <= maxLen) return [token];
  const chunks: string[] = [];
  for (let i = 0; i < token.length; i += maxLen) {
    chunks.push(token.slice(i, i + maxLen));
  }
  return chunks;
}

function formatAddressForDisplay(raw: string, maxLen = 42): string {
  const text = String(raw ?? "").trim();
  if (!text || text === "—") return "—";

  const parts = text
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const tokens = parts.length ? parts : text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const token of tokens) {
    const normalizedToken = token.replace(/\s+/g, " ").trim();
    if (!normalizedToken) continue;
    const tokenVariants = chunkLongToken(normalizedToken, maxLen);

    for (const piece of tokenVariants) {
      if (!current) {
        current = piece;
        continue;
      }
      if (`${current}, ${piece}`.length <= maxLen) {
        current = `${current}, ${piece}`;
      } else {
        lines.push(current);
        current = piece;
      }
    }
  }

  if (current) lines.push(current);
  return lines.join("\n");
}

function ProfileFieldGrid({ items }: { items: FieldItem[] }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-border/60 bg-border/70 sm:grid-cols-2">
      {items.map((item, i) => (
        <div
          key={`${item.label}-${i}`}
          className={cn(
            "bg-background px-4 py-3.5",
            item.wide && "sm:col-span-2",
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1.5 whitespace-pre-line break-words text-sm font-medium leading-snug text-foreground">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5 border-b border-border/50 pb-2.5">
      <Icon className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
        {children}
      </h3>
    </div>
  );
}

function SubsectionTitle({ children }: { children: ReactNode }) {
  return (
    <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </h4>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  /** When from My Matches, pass API preview data; drawer shows this and Send Interest uses onSendInterest (API). */
  preview?: ProfilePreviewData | null;
  onSendInterest?: () => void;
  /** My Matches: whether chat is allowed for this profile (GET v1/matches can_chat). */
  canChat?: boolean;
  /** My Matches: start chat (e.g. POST v1/chat/start/). Omit to hide Chat in the footer. */
  onChat?: () => void;
  /** When credits are exhausted or user clicks Upgrade in credit dialog */
  onOpenPlanModal?: () => void;
}

const ProfileViewDrawer = ({
  open,
  onOpenChange,
  profile,
  preview,
  onSendInterest,
  canChat = false,
  onChat,
  onOpenPlanModal,
}: Props) => {
  const hasPaidPlan = useAuthStore((s) => s.hasPaidPlan);
  const sendInterest = useInterestStore((s) => s.sendInterest);
  const getHoroscopeRemaining = useAuthStore((s) => s.getHoroscopeRemaining);
  const getHoroscopeQuota = useAuthStore((s) => s.getHoroscopeQuota);
  const spendHoroscopeCredit = useAuthStore((s) => s.useHoroscopeCredit);
  const router = useRouter();

  const [contactRevealed, setContactRevealed] = useState(false);
  const [horoscopeRevealed, setHoroscopeRevealed] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditDialogVariant, setCreditDialogVariant] =
    useState<CreditDialogVariant>("contact");

  /** After GET /profiles/{id}/full/ */
  const [fullDisplay, setFullDisplay] =
    useState<FullProfileDrawerDisplay | null>(null);
  const [fullRawProfile, setFullRawProfile] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockedContact, setUnlockedContact] = useState<{
    phone: string;
    email: string;
  } | null>(null);
  const [livePreview, setLivePreview] = useState<ProfilePreviewData | null>(
    preview ?? null,
  );
  const [expandedFull, setExpandedFull] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const activePreview = livePreview ?? preview ?? null;
  const isPreviewMode = !!activePreview;
  const isViewedByMe = !!activePreview?.is_viewed_by_me;
  const interestStatus = String(activePreview?.interest_status ?? "")
    .trim()
    .toLowerCase();
  const isInterestSent = !!activePreview?.is_interest_sent;
  const showInterestAccepted = interestStatus === "accepted";
  const showInterestSent = interestStatus === "sent" || isInterestSent;
  const showSendInterestButton = ["pending", "rejected", "cancelled"].includes(
    interestStatus,
  );

  useEffect(() => {
    if (!open) {
      setContactRevealed(false);
      setHoroscopeRevealed(false);
      setFullDisplay(null);
      setFullRawProfile(null);
      setUnlockedContact(null);
      setUnlockLoading(false);
      setLivePreview(preview ?? null);
      setExpandedFull(false);
      setPhotoPreviewUrl(null);
    }
  }, [open, profile?.id, preview]);

  useEffect(() => {
    if (!open) return;
    setLivePreview(preview ?? null);
  }, [open, preview]);

  // If preview already grants access to full details (is_viewed_by_me),
  // hydrate drawer from the included nested `profile` object if present.
  useEffect(() => {
    if (!open) return;
    if (!isPreviewMode) return;
    if (!isViewedByMe) return;
    if (fullDisplay) return;

    const candidate =
      (activePreview as unknown as { profile?: unknown })?.profile ??
      (activePreview as unknown);
    const mapped = mapFullProfileToDrawerDisplay(candidate);
    if (mapped) {
      setFullDisplay(mapped);
      if (candidate && typeof candidate === "object") {
        setFullRawProfile(candidate as Record<string, unknown>);
      }
      setExpandedFull(true);
    }
  }, [open, isPreviewMode, isViewedByMe, fullDisplay, activePreview]);

  if (!profile && !preview) return null;

  const fd = fullDisplay;

  const displayName =
    (fd?.name && fd.name.trim()) || activePreview?.name || profile?.name || "";
  const displayAge =
    fd && fd.age > 0 ? fd.age : (activePreview?.age ?? profile?.age ?? 0);
  const displayLocationFull =
    (fd?.location && fd.location.trim()) ||
    (typeof activePreview?.location === "string"
      ? activePreview.location.trim()
      : "") ||
    (typeof profile?.location === "string" ? profile.location : "") ||
    "";
  const displayLocationFormatted = formatAddressForDisplay(displayLocationFull);
  const displayEducation =
    (fd?.education && fd.education.trim()) ||
    (activePreview?.education ?? profile?.education)?.split(",")[0] ||
    "";
  const displayOccupation =
    (fd?.occupation && fd.occupation.trim()) ||
    activePreview?.occupation ||
    profile?.profession ||
    "";
  const displayAboutRaw =
    (fd?.about_me && fd.about_me.trim()) ||
    (typeof activePreview?.about_me === "string"
      ? activePreview.about_me.trim()
      : "");
  /** Avoid inventing long copy that repeats structured fields below — API `about_me` only. */
  const displayAbout = displayAboutRaw || "";
  const displayFamily =
    (fd?.familyText && fd.familyText.trim()) ||
    activePreview?.family_background ||
    "No family details provided.";
  const displayReligion =
    fd?.religion?.trim() || activePreview?.religion || "Hindu";
  const displayCaste = fd?.caste?.trim() || activePreview?.caste || "Menon";
  const displayMaritalStatus =
    fd?.marital_status?.trim() ||
    activePreview?.marital_status ||
    "Never Married";
  const displayHeight = fd?.height?.trim() || activePreview?.height || "5'4\"";
  const displayMotherTongue =
    fd?.mother_tongue?.trim() || activePreview?.mother_tongue || "Malayalam";
  const displayAnnualIncome =
    fd?.annual_income?.trim() || activePreview?.annual_income || "₹5–8 Lakhs";
  const displayEmployment =
    (fd?.employment && fd.employment.trim() && fd.employment !== "—"
      ? fd.employment
      : null) || "Employed - Private";
  const displayField =
    displayOccupation && /engineer|it|software/i.test(displayOccupation)
      ? "Engineering / IT"
      : displayOccupation
        ? "Professional"
        : "—";

  const headerPhoto =
    fd?.profile_photo || activePreview?.profile_photo || profile?.image || null;

  const handleSendInterest = () => {
    if (isPreviewMode && onSendInterest) {
      onSendInterest();
      return;
    }
    if (hasPaidPlan() && profile) {
      sendInterest(0, profile.id, "Hi! I'd love to connect with you.");
      toast.success("Interest sent!", {
        description: `${profile.name} will be notified.`,
      });
      onOpenChange(false);
    } else {
      onSendInterest?.();
      onOpenChange(false);
    }
  };

  const handleCreditConfirm = () => {
    const used = spendHoroscopeCredit();
    if (used) {
      if (creditDialogVariant === "contact") setContactRevealed(true);
      else setHoroscopeRevealed(true);
      toast.success("1 credit used");
      const remaining = getHoroscopeRemaining();
      if (remaining <= 2 && remaining > 0) {
        toast.info(
          `Only ${remaining} horoscope match${remaining === 1 ? "" : "es"} remaining. Consider upgrading for more.`,
        );
      }
    }
  };

  const handleViewContactClick = () => {
    if (getHoroscopeRemaining() <= 0) {
      setCreditDialogVariant("contact");
      setCreditDialogOpen(true);
      return;
    }
    setCreditDialogVariant("contact");
    setCreditDialogOpen(true);
  };

  const handleCheckHoroscopeClick = () => {
    if (getHoroscopeRemaining() <= 0) {
      setCreditDialogVariant("horoscope");
      setCreditDialogOpen(true);
      return;
    }
    setCreditDialogVariant("horoscope");
    setCreditDialogOpen(true);
  };

  const handleUnlockContactApi = async () => {
    if (!activePreview?.matri_id) return;
    setUnlockLoading(true);
    try {
      const res = await unlockContactDetails(activePreview.matri_id);
      setUnlockedContact({
        phone: res.data.phone ?? "",
        email: res.data.email ?? "",
      });

      // Refresh preview after unlock so drawer reflects the latest server flags/data.
      try {
        const refreshed = await getProfilePreview(activePreview.matri_id);
        setLivePreview(refreshed.data);

        const candidate =
          (refreshed.data as unknown as { profile?: unknown })?.profile ??
          (refreshed.data as unknown);
        const mapped = mapFullProfileToDrawerDisplay(candidate);
        if (mapped) {
          setFullDisplay(mapped);
          if (candidate && typeof candidate === "object") {
            setFullRawProfile(candidate as Record<string, unknown>);
          }
          if (refreshed.data.is_viewed_by_me) setExpandedFull(true);
        }
      } catch {
        // Unlock response already has phone/email; keep UI usable even if preview refresh fails.
      }

      toast.success("Contact details unlocked");
    } catch (e) {
      const anyErr = e as unknown as {
        status?: number;
        data?: { error?: { message?: string } };
        response?: { status?: number; data?: { error?: { message?: string } } };
      };

      const status = anyErr?.status ?? anyErr?.response?.status;
      const apiMsg =
        anyErr?.data?.error?.message ?? anyErr?.response?.data?.error?.message;
      const msg =
        e instanceof Error
          ? e.message
          : typeof apiMsg === "string" && apiMsg.trim()
            ? apiMsg
            : "Could not unlock contact";

      // Any 403 here means plan is required / not allowed → take user to Plans & Pricing.
      if (status === 403) {
        toast.info(msg || "Upgrade your plan to view contact details.");
        onOpenChange(false);
        router.push("/dashboard/plan");
        return;
      }

      toast.error(msg);
      if (
        msg.toLowerCase().includes("plan") ||
        msg.toLowerCase().includes("upgrade")
      ) {
        onOpenPlanModal?.();
      }
    } finally {
      setUnlockLoading(false);
    }
  };

  const phoneShown =
    unlockedContact?.phone || (fd?.hasContactInProfile ? fd.phone : null) || "";
  const emailShown =
    unlockedContact?.email || (fd?.hasContactInProfile ? fd.email : null) || "";
  const contactVisiblePreview = !!(phoneShown.trim() || emailShown.trim());

  const bd =
    (fullRawProfile?.basic_details as Record<string, unknown> | undefined) ??
    undefined;
  const per =
    (fullRawProfile?.personal_details as Record<string, unknown> | undefined) ??
    undefined;
  const loc =
    (fullRawProfile?.location_details as Record<string, unknown> | undefined) ??
    undefined;
  const rel =
    (fullRawProfile?.religion_details as Record<string, unknown> | undefined) ??
    undefined;
  const edu =
    (fullRawProfile?.education_details as
      | Record<string, unknown>
      | undefined) ?? undefined;
  const photos =
    (fullRawProfile?.photos as Record<string, unknown> | undefined) ??
    undefined;
  const photoEntriesVisible =
    photos &&
    Object.entries(photos).filter(
      ([k, v]) =>
        !isHiddenProfilePhotoKey(k) &&
        typeof v === "string" &&
        String(v).trim(),
    );
  const fam =
    (fullRawProfile?.family_details as Record<string, unknown> | undefined) ??
    undefined;

  const aboutFamilyNarrative =
    fam?.about_family != null && String(fam.about_family).trim()
      ? String(fam.about_family).trim()
      : null;

  const stateStr = loc?.state != null ? String(loc.state).trim() : "";
  const districtStr = loc?.district != null ? String(loc.district).trim() : "";
  const locationFieldRows: { label: string; value: string }[] = [
    {
      label: "Country",
      value: loc?.country != null ? String(loc.country) : "—",
    },
    ...(stateStr && districtStr && stateStr === districtStr
      ? [{ label: "State & District", value: stateStr }]
      : [
          { label: "State", value: stateStr || "—" },
          { label: "District", value: districtStr || "—" },
        ]),
    { label: "City", value: loc?.city != null ? String(loc.city) : "—" },
  ];

  /** When full API profile is expanded, structured fields live in "Full Profile Details" only. */
  const hideSummaryGrids = !!(expandedFull && fullRawProfile);
  const hasFullFamilyGrid = !!(fam && Object.keys(fam).length);

  /** Header shows age + religion/caste chips; omit fields repeated in Basic Details & badges. */
  const basicDetailItems: FieldItem[] = [
    { label: "Location", value: displayLocationFormatted, wide: true },
    { label: "Education", value: displayEducation },
    { label: "Marital status", value: displayMaritalStatus },
    { label: "Height", value: displayHeight },
    { label: "Mother tongue", value: displayMotherTongue },
  ];

  const careerDetailItems: FieldItem[] = [
    { label: "Occupation", value: displayOccupation || "—" },
    { label: "Employment", value: displayEmployment },
    { label: "Annual income", value: displayAnnualIncome },
    { label: "Field", value: displayField },
  ];

  const horoscopeInfo = [
    { label: "RASI", value: "Chingam" },
    { label: "NAKSHATRA", value: "Atham" },
    { label: "PADA", value: "2" },
    { label: "MANGAL DOSHA", value: "No" },
  ];

  const horoscopeBlock =
    hasPaidPlan() ? (
      <div className={cn(hideSummaryGrids ? "mt-8" : "mt-6")}>
        <SectionTitle icon={Moon}>Horoscope</SectionTitle>
        {horoscopeRevealed ? (
          <ProfileFieldGrid
            items={horoscopeInfo.map((d) => ({
              label: d.label,
              value: d.value,
            }))}
          />
        ) : (
          <Button
            variant="outline"
            className="w-full gap-2 border-border/80"
            type="button"
            onClick={handleCheckHoroscopeClick}
          >
            <Sparkles className="h-4 w-4" /> View horoscope details
          </Button>
        )}
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="flex max-h-[min(92vh,1200px)] w-[min(96vw,1280px)] max-w-5xl flex-col gap-0 overflow-hidden rounded-xl border border-border/50 bg-card p-0 shadow-2xl"
      >
        <DialogTitle className="sr-only">{displayName}</DialogTitle>
        <DialogDescription className="sr-only">
          Profile preview and contact details
        </DialogDescription>

        {/* Header */}
        <div className="relative shrink-0 bg-gradient-to-br from-primary via-primary to-primary-dark px-6 py-6 text-primary-foreground md:px-8 md:py-7">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-md border border-white/25 bg-white/10 p-2 text-primary-foreground transition-colors hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-white/25 bg-white/10 shadow-lg md:h-[7.25rem] md:w-[7.25rem]">
              {headerPhoto ? (
                <img
                  src={headerPhoto}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-serif text-2xl font-semibold text-white/90">
                  {displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pr-10">
              <h2 className="font-serif text-2xl font-semibold tracking-tight md:text-3xl">
                {displayName}
              </h2>
              <p className="mt-1.5 text-sm text-white/85">
                {displayAge} yrs
                {displayOccupation ? ` · ${displayOccupation}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                  {displayReligion}
                </span>
                <span className="inline-flex items-center rounded-md border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                  {displayCaste}
                </span>
                {hasPaidPlan() && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                    <Sparkles className="h-3 w-3 opacity-90" />
                    Jathagam available
                  </span>
                )}
                {isPreviewMode && (fullDisplay || isViewedByMe) && (
                  <span className="inline-flex items-center rounded-md border border-emerald-400/50 bg-emerald-600/35 px-2.5 py-1 text-xs font-medium text-white">
                    Full profile loaded
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body — scrolls; footer stays visible */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className="space-y-8 px-6 py-6 md:px-8 md:py-8">
            {!hideSummaryGrids ? (
              <>
                <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
                  <div>
                    <SectionTitle icon={User}>About</SectionTitle>
                    <div className="rounded-lg border border-border/60 bg-muted/20 px-5 py-4">
                      <p className="text-sm leading-relaxed text-foreground/90 [overflow-wrap:anywhere]">
                        {displayAbout || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div>
                    <SectionTitle icon={Briefcase}>
                      Career & education
                    </SectionTitle>
                    <ProfileFieldGrid items={careerDetailItems} />
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
                  <div>
                    <SectionTitle icon={ClipboardList}>
                      Basic details
                    </SectionTitle>
                    <ProfileFieldGrid items={basicDetailItems} />
                  </div>

                  <div>
                    <SectionTitle icon={Phone}>Contact</SectionTitle>
                    <div className="rounded-lg border border-border/60 bg-muted/15 px-5 py-6">
                      {isPreviewMode ? (
                        <>
                          {!fullDisplay && !isViewedByMe && (
                            <div className="flex flex-col items-center justify-center gap-4 text-center">
                              <div className="blur-sm select-none pointer-events-none opacity-50">
                                <p className="text-sm text-foreground">
                                  +91 ••••• •••••
                                </p>
                                <p className="mt-1 text-sm text-foreground">
                                  ••••••••@••••.com
                                </p>
                              </div>
                              <p className="max-w-sm text-sm text-muted-foreground">
                                Phone and email may require unlocking based on
                                your plan quota.
                              </p>
                              <Button
                                type="button"
                                variant="hero"
                                className="gap-2"
                                disabled={unlockLoading}
                                onClick={handleUnlockContactApi}
                              >
                                {unlockLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />{" "}
                                    Unlocking…
                                  </>
                                ) : (
                                  <>
                                    <Phone className="h-4 w-4" /> View contact
                                    details
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          {fullDisplay && !contactVisiblePreview && (
                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                              <Lock className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                Phone and email are not included in this profile
                                view. Unlock contact details using your plan
                                quota.
                              </p>
                              <Button
                                type="button"
                                variant="hero"
                                className="gap-2"
                                disabled={unlockLoading}
                                onClick={handleUnlockContactApi}
                              >
                                {unlockLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />{" "}
                                    Unlocking…
                                  </>
                                ) : (
                                  <>
                                    <Phone className="h-4 w-4" /> View contact
                                    details
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          {contactVisiblePreview && (
                            <p className="text-center text-sm text-muted-foreground">
                              Phone and email are listed in the Contact section
                              below.
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-4 text-center">
                          {!hasPaidPlan() ? (
                            <p className="text-sm text-muted-foreground">
                              Upgrade your plan to view contact details. See the
                              Contact section below.
                            </p>
                          ) : !contactRevealed ? (
                            <Button
                              type="button"
                              variant="hero"
                              className="gap-2"
                              onClick={handleViewContactClick}
                            >
                              <Eye className="h-4 w-4" /> View contact details
                            </Button>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Contact details are shown in the section below.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {horoscopeBlock}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <SectionTitle icon={User}>About</SectionTitle>
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-5 py-4">
                    <p className="text-sm leading-relaxed text-foreground/90 [overflow-wrap:anywhere]">
                      {displayAbout || "No description provided."}
                    </p>
                  </div>
                </div>
                {horoscopeBlock}
              </>
            )}

            {/* Preview: unlock CTA lives in the column above; here only show phone/email once unlocked. */}
            {isPreviewMode && contactVisiblePreview ? (
              <div>
                <SectionTitle icon={Phone}>Contact details</SectionTitle>
                <div className="rounded-lg border border-border/60 bg-muted/15 px-5 py-4">
                  <div className="space-y-2">
                    {phoneShown ? (
                      <p className="text-sm font-medium text-foreground">
                        <span className="font-normal text-muted-foreground">
                          Phone:{" "}
                        </span>
                        {phoneShown}
                      </p>
                    ) : null}
                    {emailShown ? (
                      <p className="break-all text-sm font-medium text-foreground">
                        <span className="font-normal text-muted-foreground">
                          Email:{" "}
                        </span>
                        {emailShown}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {!isPreviewMode ? (
              <div>
                <SectionTitle icon={Phone}>Contact</SectionTitle>
                <div className="relative min-h-[100px] rounded-lg border border-border/60 bg-muted/15 px-5 py-4">
                  <div
                    className={
                      hasPaidPlan() && contactRevealed
                        ? ""
                        : "blur-sm select-none pointer-events-none"
                    }
                  >
                    <p className="text-sm text-foreground">+91 98765 43210</p>
                    <p className="text-sm text-foreground mt-1">
                      {displayName.toLowerCase().replace(/\s/g, "")}@gmail.com
                    </p>
                  </div>
                  {!hasPaidPlan() ? (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-[2px]">
                      <div className="flex items-center justify-center gap-2 px-2 text-center">
                        <Lock className="h-4 w-4 shrink-0 text-secondary" />
                        <p className="text-sm font-semibold text-secondary">
                          Upgrade to Gold or Diamond plan to view contact
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {hasPaidPlan() && !contactRevealed && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-[2px]">
                      <Button
                        variant="hero"
                        className="gap-2"
                        type="button"
                        onClick={handleViewContactClick}
                      >
                        <Eye className="h-4 w-4" /> View Contact
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {expandedFull && fullRawProfile ? (
              <div className="space-y-8 border-t border-border/50 pt-8">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
                  <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground">
                    Full profile
                  </h3>
                  {/* <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-border/80"
                    onClick={() => setExpandedFull(false)}
                  >
                    Collapse
                  </Button> */}
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <div>
                    <SubsectionTitle>Basic</SubsectionTitle>
                    <ProfileFieldGrid
                      items={[
                        {
                          label: "Matri ID",
                          value: String(fullRawProfile.matri_id ?? "—"),
                        },
                        { label: "Gender", value: String(bd?.gender ?? "—") },
                        {
                          label: "DOB",
                          value: bd?.dob
                            ? formatDateDdMmYyyy(bd.dob)
                            : "—",
                          wide: true,
                        },
                      ]}
                    />
                  </div>

                  <div>
                    <SubsectionTitle>Personal</SubsectionTitle>
                    <ProfileFieldGrid
                      items={[
                        {
                          label: "Marital status",
                          value: String(per?.marital_status ?? "—"),
                        },
                        {
                          label: "Children",
                          value: String(per?.children_count ?? "—"),
                        },
                        {
                          label: "Height",
                          value: String(per?.height_cm ?? "—"),
                        },
                        {
                          label: "Weight",
                          value: String(per?.weight_kg ?? "—"),
                        },
                        { label: "Colour", value: String(per?.colour ?? "—") },
                        {
                          label: "Blood group",
                          value: String(per?.blood_group ?? "—"),
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <div>
                    <SubsectionTitle>Location</SubsectionTitle>
                    <ProfileFieldGrid
                      items={[
                        ...locationFieldRows.map((d) => ({
                          label: d.label,
                          value: String(d.value),
                        })),
                        {
                          label: "Address",
                          value: formatAddressForDisplay(String(loc?.address ?? "—")),
                          wide: true,
                        },
                      ]}
                    />
                  </div>

                  <div>
                    <SubsectionTitle>Education & work</SubsectionTitle>
                    <ProfileFieldGrid
                      items={[
                        {
                          label: "Education",
                          value: String(edu?.highest_education ?? "—"),
                        },
                        {
                          label: "Subject",
                          value: String(edu?.education_subject ?? "—"),
                        },
                        {
                          label: "Employment",
                          value: String(edu?.employment_status ?? "—"),
                        },
                        {
                          label: "Occupation",
                          value: String(edu?.occupation ?? "—"),
                        },
                        {
                          label: "Annual income",
                          value: String(edu?.annual_income ?? "—"),
                          wide: true,
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <div>
                    <SubsectionTitle>Religion</SubsectionTitle>
                    <ProfileFieldGrid
                      items={[
                        {
                          label: "Religion",
                          value: String(rel?.religion ?? "—"),
                        },
                        { label: "Caste", value: String(rel?.caste ?? "—") },
                        {
                          label: "Mother tongue",
                          value: String(rel?.mother_tongue ?? "—"),
                          wide: true,
                        },
                      ]}
                    />
                  </div>

                  <div>
                    <SubsectionTitle>Family</SubsectionTitle>
                    <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-4">
                      {fam && Object.keys(fam).length ? (
                        <ProfileFieldGrid
                          items={Object.entries(fam).map(([k, v]) => ({
                            label: k.replace(/_/g, " "),
                            value: String(v ?? "—"),
                          }))}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No family details provided.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {photoEntriesVisible && photoEntriesVisible.length ? (
                  <div>
                    <SubsectionTitle>Photos</SubsectionTitle>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {photoEntriesVisible.map(([k, v]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setPhotoPreviewUrl(String(v))}
                          className="overflow-hidden rounded-lg border border-border/60 bg-card text-left transition-colors hover:border-primary/30 hover:shadow-md"
                        >
                          <div className="border-b border-border/50 px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                              {k.replace(/_/g, " ")}
                            </p>
                          </div>
                          <div className="aspect-[4/3] bg-muted">
                            <img
                              src={String(v)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <Dialog
          open={!!photoPreviewUrl}
          onOpenChange={(o) => !o && setPhotoPreviewUrl(null)}
        >
          <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden rounded-2xl border-0">
            <DialogTitle className="sr-only">Photo preview</DialogTitle>
            <DialogDescription className="sr-only">
              Preview photo
            </DialogDescription>
            <div className="relative bg-black">
              <button
                type="button"
                onClick={() => setPhotoPreviewUrl(null)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              {photoPreviewUrl ? (
                <img
                  src={photoPreviewUrl}
                  alt=""
                  className="w-full max-h-[80vh] object-contain"
                />
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        <UseCreditDialog
          open={creditDialogOpen}
          onOpenChange={setCreditDialogOpen}
          remaining={getHoroscopeRemaining()}
          quota={getHoroscopeQuota()}
          variant={creditDialogVariant}
          onConfirm={handleCreditConfirm}
          onUpgrade={() => onOpenPlanModal?.()}
        />

        <div className="flex shrink-0 flex-nowrap items-stretch gap-1.5 border-t border-border/60 bg-muted/15 px-3 py-3 sm:gap-2 sm:px-6 sm:py-4 md:px-8">
          {showInterestAccepted ? (
            <Button
              variant="outline"
              type="button"
              aria-disabled="true"
              title="Interest accepted"
              onClick={(e) => e.stopPropagation()}
              className="flex h-auto min-h-[2.75rem] min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 border-primary/25 px-1.5 py-1.5 text-[10px] font-semibold leading-tight text-foreground sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm md:min-h-[3rem] md:text-base"
            >
              <Heart className="h-4 w-4 shrink-0 fill-secondary text-secondary sm:h-5 sm:w-5" />
              <span className="line-clamp-2 text-center">Interest Accepted</span>
            </Button>
          ) : showInterestSent ? (
            <Button
              variant="outline"
              type="button"
              aria-disabled="true"
              title="Interest sent"
              onClick={(e) => e.stopPropagation()}
              className="flex h-auto min-h-[2.75rem] min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 border-primary/25 px-1.5 py-1.5 text-[10px] font-semibold leading-tight text-foreground sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm md:min-h-[3rem] md:text-base"
            >
              <Heart className="h-4 w-4 shrink-0 fill-secondary text-secondary sm:h-5 sm:w-5" />
              <span className="line-clamp-2 text-center">Interest Sent</span>
            </Button>
          ) : showSendInterestButton ? (
            <Button
              variant="hero"
              type="button"
              onClick={handleSendInterest}
              className="flex h-auto min-h-[2.75rem] min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 text-[10px] font-semibold leading-tight sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm md:min-h-[3rem] md:text-base"
            >
              <Heart className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <span className="line-clamp-2 text-center">Send interest</span>
            </Button>
          ) : null}
          {onChat ? (
            <Button
              variant="default"
              type="button"
              disabled={!canChat}
              title={
                !canChat ? "Not available on your current plan" : undefined
              }
              onClick={onChat}
              className="flex h-auto min-h-[2.75rem] min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 text-[10px] font-semibold leading-tight sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm md:min-h-[3rem] md:text-base"
            >
              <MessageCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <span className="text-center">
                <span className="sm:hidden">Chat</span>
                <span className="hidden sm:inline">Chat now</span>
              </span>
            </Button>
          ) : null}
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-auto min-h-[2.75rem] shrink-0 px-2.5 py-1.5 text-xs font-semibold sm:min-w-[4.5rem] sm:px-4 sm:text-sm md:min-h-[3rem]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileViewDrawer;
