"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import {
  Heart,
  Eye,
  Send,
  Star,
  IndianRupee,
  Lock,
  Sparkles,
  MapPin,
  ArrowRight,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import ChoosePlanModal from "@/components/ChoosePlanModal";
import ProfileViewDrawer from "@/components/ProfileViewDrawer";
import PartnerPreferencesModal from "@/components/PartnerPreferencesModal";
import { toast } from "sonner";
import {
  getDashboardSummary,
  getDashboardNewMatches,
  getDashboardSuggestions,
  getDashboardTodayPicks,
  type DashboardSummary,
  type DashboardProfile,
} from "@/lib/dashboardApi";
import {
  getProfilePreview,
  sendInterest,
  type ProfilePreviewData,
} from "@/lib/matchesApi";
import { BASE_URL } from "@/lib/config";
import { cn } from "@/lib/utils";

/** In-session cache so returning to /dashboard does not blank the whole UI while refetching. */
type DashboardSessionCache = {
  key: string;
  summary: DashboardSummary;
  newMatches: DashboardProfile[];
  suggestions: DashboardProfile[];
  todayPicks: DashboardProfile[];
  profileCompletion: number;
};

let dashboardSessionCache: DashboardSessionCache | null = null;

function dashboardCacheAuthKey(): string | null {
  const u = useAuthStore.getState().user;
  if (!u) return null;
  const id = u.matriId?.trim();
  if (id) return id;
  const phone = u.phone?.trim();
  if (phone) return `phone:${phone}`;
  const email = u.email?.trim();
  if (email) return `email:${email}`;
  return null;
}

function readDashboardSessionCache(): DashboardSessionCache | null {
  const key = dashboardCacheAuthKey();
  const c = dashboardSessionCache;
  if (!key || !c || c.key !== key) return null;
  return c;
}

function getMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  const base = BASE_URL.replace(/\/api\/?$/, "");
  return path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

function NewMatchesStoriesStrip({
  profiles,
  onStoryClick,
}: {
  profiles: DashboardProfile[];
  onStoryClick: (matriId: string) => void;
}) {
  return (
    <div className="flex min-w-0 max-w-full gap-3 sm:gap-5 overflow-x-auto overscroll-x-contain pb-2 pt-1 snap-x snap-mandatory [scrollbar-width:thin] touch-pan-x">
      {profiles.map((profile) => {
        const photoUrl = getMediaUrl(profile.profile_photo);
        const initials = profile.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2);
        const firstName = profile.name.split(" ")[0] || profile.name;
        const ringGradient = profile.is_new
          ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600 p-[3px]"
          : "bg-gradient-to-tr from-primary/50 via-secondary/60 to-primary/40 p-[2.5px]";

        return (
          <button
            key={profile.matri_id}
            type="button"
            onClick={() => onStoryClick(profile.matri_id)}
            className="flex flex-col items-center gap-2 shrink-0 w-[78px] snap-center transition-transform active:scale-95 hover:opacity-95"
          >
            <div className={cn("rounded-full shadow-md", ringGradient)}>
              <div className="rounded-full bg-white p-[3px]">
                <div className="w-[68px] h-[68px] rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-primary/50">
                      {initials}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-foreground text-center truncate w-full max-w-[78px] leading-tight">
              {firstName}
            </span>
            {profile.is_new && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-rose-600 -mt-1">
                New
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---- Suggestion card (compact) ----
interface SuggestionCardProps {
  profile: DashboardProfile;
  index: number;
  onView: () => void;
  onInterest: () => void;
  sendingInterest: boolean;
  showHoroscopeBadge?: boolean;
}

const SuggestionCard = ({
  profile,
  index,
  onView,
  onInterest,
  sendingInterest,
  showHoroscopeBadge,
}: SuggestionCardProps) => {
  const photoUrl = getMediaUrl(profile.profile_photo);
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-card rounded-2xl shadow-card border border-primary/10 overflow-hidden hover:shadow-elevated transition-all group flex flex-col"
    >
      <div className="relative h-52 overflow-hidden bg-accent-rose/20 flex-shrink-0">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={profile.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl font-bold text-primary/40">
              {initials}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {(profile.match_percentage ?? 0) > 0 && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 rounded-full">
            <span className="text-xs font-bold text-primary">
              {profile.match_percentage}% Match
            </span>
          </div>
        )}
        {showHoroscopeBadge && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-primary/90 rounded-full text-primary-foreground text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Horoscope
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-serif text-base font-bold leading-tight truncate">
            {profile.name}
          </h3>
          <p className="text-xs opacity-90">
            {profile.age} yrs
            {profile.location ? ` · ${profile.location.split(",")[0]}` : ""}
          </p>
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div className="text-xs text-muted-foreground space-y-1">
          {profile.occupation && (
            <p className="flex items-center gap-1.5 truncate">
              <Users className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              {profile.occupation}
            </p>
          )}
          {profile.education && (
            <p className="flex items-center gap-1.5 truncate">
              <Star className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
              {profile.education}
            </p>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1 text-xs"
            onClick={onView}
          >
            <Eye className="w-3.5 h-3.5" /> View
          </Button>
          <Button
            variant="hero"
            size="sm"
            className="flex-1 gap-1 text-xs"
            onClick={onInterest}
            disabled={sendingInterest}
          >
            {sendingInterest ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Heart className="w-3.5 h-3.5" />
            )}
            Interest
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ---- Main page ----

const DashboardPage = () => {
  const {
    user,
    hasPaidPlan,
    getHoroscopeRemaining,
    getHoroscopeQuota,
  } = useAuthStore();
  const showHoroscope = () => hasPaidPlan();
  const horoscopeRemaining = getHoroscopeRemaining();
  const horoscopeQuota = getHoroscopeQuota();
  const router = useRouter();

  const initialCache = readDashboardSessionCache();
  const hasDashboardDataRef = useRef(initialCache != null);

  // Data state (hydrate from session cache when revisiting /dashboard for the same account)
  const [summary, setSummary] = useState<DashboardSummary | null>(
    () => initialCache?.summary ?? null,
  );
  const [newMatches, setNewMatches] = useState<DashboardProfile[]>(
    () => initialCache?.newMatches ?? [],
  );
  const [suggestions, setSuggestions] = useState<DashboardProfile[]>(
    () => initialCache?.suggestions ?? [],
  );
  const [todayPicks, setTodayPicks] = useState<DashboardProfile[]>(
    () => initialCache?.todayPicks ?? [],
  );
  const [profileCompletion, setProfileCompletion] = useState(
    () => initialCache?.profileCompletion ?? 0,
  );
  const [loading, setLoading] = useState(() => initialCache == null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // UI state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Profile preview drawer
  const [previewData, setPreviewData] = useState<ProfilePreviewData | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState(false);

  // Per-card interest sending state (matri_id)
  const [sendingInterest, setSendingInterest] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    const warm = readDashboardSessionCache() != null;
    if (!warm) setLoading(true);
    setLoadError(null);
    try {
      const [summaryRes, matchesRes, suggestionsRes, todayRes] =
        await Promise.all([
          getDashboardSummary(),
          getDashboardNewMatches(4),
          getDashboardSuggestions(8),
          getDashboardTodayPicks(),
        ]);
      const nextSummary = summaryRes.data;
      const nextMatches = Array.isArray(matchesRes.data) ? matchesRes.data : [];
      const nextSuggestions = Array.isArray(suggestionsRes.data)
        ? suggestionsRes.data
        : [];
      const nextToday = Array.isArray(todayRes.data) ? todayRes.data : [];
      const nextCompletion = nextSummary?.profile_completion ?? 0;

      setSummary(nextSummary);
      setNewMatches(nextMatches);
      setSuggestions(nextSuggestions);
      setTodayPicks(nextToday);
      setProfileCompletion(nextCompletion);

      const authKey = dashboardCacheAuthKey();
      if (authKey) {
        dashboardSessionCache = {
          key: authKey,
          summary: nextSummary,
          newMatches: nextMatches,
          suggestions: nextSuggestions,
          todayPicks: nextToday,
          profileCompletion: nextCompletion,
        };
      }
      hasDashboardDataRef.current = true;
    } catch (err) {
      console.error("Dashboard load error:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to load dashboard";
      if (hasDashboardDataRef.current) {
        toast.error(msg);
      } else {
        setLoadError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleViewProfile = async (matriId: string) => {
    setPreviewLoading(true);
    try {
      const res = await getProfilePreview(matriId);
      setPreviewData(res.data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not load profile",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendInterest = async (matriId: string) => {
    setSendingInterest(matriId);
    try {
      const res = await sendInterest(matriId);
      toast.success(res.message || "Interest sent!");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to send interest";
      if ((err as { status?: number }).status === 403) {
        toast.info("Please upgrade your plan to continue.");
        router.push("/dashboard/plan");
      } else {
        toast.error(msg);
      }
    } finally {
      setSendingInterest(null);
    }
  };

  const statsCards = [
    {
      icon: Eye,
      label: "Profile Views",
      value: summary?.profile_views ?? "—",
      color: "text-primary",
    },
    {
      icon: Heart,
      label: "Interests Received",
      value: summary?.interests_received ?? "—",
      color: "text-secondary",
    },
    {
      icon: Send,
      label: "Interests Sent",
      value: summary?.interests_sent ?? "—",
      color: "text-primary",
    },
    ...(showHoroscope()
      ? [
          {
            icon: Star,
            label: "Horoscope Active",
            value: "—",
            color: "text-secondary",
          },
        ]
      : []),
    {
      icon: IndianRupee,
      label: "Upgrade Plan",
      isAction: true as const,
      color: "text-secondary",
    },
  ];

  const displayLocation = summary?.location || user?.location || "";
  const displayMatriId = summary?.matri_id || user?.matriId || "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <p className="text-foreground font-semibold">
            Failed to load dashboard
          </p>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button variant="outline" onClick={loadDashboard}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full min-w-0 max-w-md space-y-5 sm:max-w-none sm:space-y-6">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary rounded-2xl shadow-card p-4 text-primary-foreground sm:p-6"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="min-w-0">
              <h1 className="font-serif text-xl font-bold sm:text-2xl md:text-3xl">
                Welcome back, {user?.name || "User"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs opacity-95 sm:text-sm sm:gap-3">
                <span>Profile: {profileCompletion}% Complete</span>
                {(displayMatriId || displayLocation) && (
                  <>
                    <span className="opacity-70">|</span>
                    <span className="min-w-0 break-words">
                      {[displayMatriId, displayLocation]
                        .filter(Boolean)
                        .join(" – ")}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
              <div className="min-w-0 rounded-xl bg-white/15 px-3 py-2.5 text-center sm:min-w-[120px] sm:px-4 sm:py-3">
                <p className="text-xl font-bold sm:text-2xl">
                  {summary?.interests_sent ?? 0}
                </p>
                <p className="text-[11px] opacity-90 sm:text-xs">Interests Sent</p>
              </div>
              <div className="min-w-0 rounded-xl bg-white/15 px-3 py-2.5 text-center sm:min-w-[120px] sm:px-4 sm:py-3">
                <p className="text-xl font-bold sm:text-2xl">
                  {summary?.new_matches ?? 0}
                </p>
                <p className="text-[11px] opacity-90 sm:text-xs">New Matches</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Horoscope / contact credit widget */}
        {hasPaidPlan() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-card p-3 shadow-card sm:p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Horoscope & contact views
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-primary">
                    {horoscopeRemaining}
                  </span>{" "}
                  of {horoscopeQuota} remaining this period
                </p>
              </div>
            </div>
            {horoscopeRemaining <= 2 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPlanModalOpen(true)}
              >
                Get more
              </Button>
            )}
          </motion.div>
        )}

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5"
        >
          {statsCards.map((stat, i) => (
            <div
              key={i}
              className={cn(
                "flex min-w-0 rounded-2xl bg-card p-3 shadow-card transition-shadow hover:shadow-elevated sm:p-4",
                "isAction" in stat && stat.isAction
                  ? "flex-row items-center gap-3"
                  : "flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 md:gap-4",
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-accent-rose flex items-center justify-center flex-shrink-0 relative">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                {"isAction" in stat && stat.isAction && (
                  <Lock className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-secondary" />
                )}
              </div>
              {"isAction" in stat && stat.isAction ? (
                <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground truncate">
                    {stat.label}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 px-3"
                    onClick={() => router.push("/dashboard/plan")}
                  >
                    Upgrade
                  </Button>
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  {"value" in stat && stat.value !== undefined && (
                    <p className="font-serif text-xl font-bold text-foreground truncate">
                      {stat.value}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Two-column layout */}
        <div className="grid min-w-0 gap-5 sm:gap-6 xl:grid-cols-12">
          {/* Left content */}
          <div className="min-w-0 space-y-5 sm:space-y-6 xl:col-span-8">
            {/* New Matches — stories strip + Love Stories–style grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-white via-rose-50/40 to-violet-50/50 shadow-card sm:rounded-[1.75rem] md:rounded-[2rem]"
            >
              <div className="p-4 sm:p-6 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-1">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-[1.65rem] font-bold text-foreground tracking-tight">
                      New matches
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tap someone to open their profile on My Matches
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard/matches")}
                    className="gap-1.5 rounded-full border-primary/20 shrink-0 w-full sm:w-auto justify-center"
                  >
                    See all <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {newMatches.length > 0 ? (
                <div className="min-w-0 px-4 pb-5 sm:px-6 sm:pb-6">
                  <NewMatchesStoriesStrip
                    profiles={newMatches}
                    onStoryClick={(matriId) => {
                      router.push(
                        `/dashboard/matches?open=${encodeURIComponent(matriId)}`,
                      );
                    }}
                  />
                </div>
              ) : (
                <div className="px-4 pb-8 text-center sm:px-6 sm:pb-10">
                  <div className="rounded-2xl bg-white/60 border border-dashed border-primary/15 py-12 px-4">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-primary/30" />
                    <p className="text-foreground font-medium">
                      No new matches yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                      Complete your profile and set preferences — we&apos;ll
                      surface fresh connections here.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Nearby / Location Based */}
            {displayLocation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h2 className="font-serif text-xl font-bold text-secondary mb-3">
                  Nearby Matches
                </h2>
                <p className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4 text-primary" />
                  Based on your location – {displayLocation}
                </p>
                <div className="rounded-2xl border border-primary/10 bg-primary/10 p-3 sm:p-4">
                  {suggestions.length > 0 ? (
                    <div className="grid min-w-0 max-w-full grid-cols-2 gap-2 sm:flex sm:gap-4 sm:overflow-x-auto sm:pb-2 md:gap-3">
                      {suggestions.slice(0, 4).map((profile) => {
                        const photoUrl = getMediaUrl(profile.profile_photo);
                        const initials = profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2);
                        return (
                          <div
                            key={profile.matri_id}
                            className="text-center min-w-0 sm:flex-shrink-0 sm:w-40"
                          >
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={profile.name}
                                className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-primary/20"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-accent-rose/30 flex items-center justify-center mx-auto mb-2 font-bold text-primary">
                                {initials}
                              </div>
                            )}
                            <p className="font-medium text-sm truncate">
                              {profile.name.split(" ")[0]}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {profile.location
                                ? profile.location.split(",")[0]
                                : "—"}
                            </p>
                            <Button
                              size="sm"
                              variant="hero"
                              className="mt-2 w-full text-xs"
                              onClick={() => handleViewProfile(profile.matri_id)}
                              disabled={previewLoading}
                            >
                              View Profile
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No nearby matches available right now.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="min-w-0 space-y-5 sm:space-y-6 xl:col-span-4">
            {/* Horoscope widget */}
            {showHoroscope() && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-secondary/20 bg-accent-gold/20 p-4 shadow-card sm:rounded-3xl sm:p-6"
              >
                <h3 className="font-serif text-lg font-bold text-secondary mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5 text-secondary" /> Horoscope Matching
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your birth details for Jathagam charts and Porutham-based
                  compatibility with your matches.
                </p>
                <Button
                  variant="hero"
                  className="w-full gap-2"
                  onClick={() => router.push("/dashboard/jathagam")}
                >
                  Set Up Horoscope <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* Today's Picks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-card p-4 shadow-card sm:rounded-3xl sm:p-6"
            >
              <h3 className="mb-3 font-serif text-base font-bold text-secondary sm:mb-4 sm:text-lg">
                Today&apos;s Picks
              </h3>
              {todayPicks.length > 0 ? (
                <div className="space-y-3">
                  {todayPicks.map((profile) => {
                    const photoUrl = getMediaUrl(profile.profile_photo);
                    const initials = profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2);
                    return (
                      <div
                        key={profile.matri_id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent-rose/20 transition-colors"
                      >
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={profile.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-primary/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-accent-rose/30 flex items-center justify-center font-bold text-sm text-primary flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {profile.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {profile.age ? `${profile.age} yrs` : ""}
                            {profile.occupation
                              ? ` · ${profile.occupation}`
                              : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewProfile(profile.matri_id)}
                          disabled={previewLoading}
                          className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors flex-shrink-0 disabled:opacity-50"
                        >
                          {previewLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No picks available today.
                </p>
              )}
            </motion.div>
          </aside>
        </div>
      </div>

      {/* Modals */}
      <ChoosePlanModal open={planModalOpen} onOpenChange={setPlanModalOpen} />
      <ProfileViewDrawer
        open={!!previewData}
        onOpenChange={(o) => !o && setPreviewData(null)}
        profile={null}
        preview={previewData}
        onSendInterest={() =>
          previewData && handleSendInterest(previewData.matri_id)
        }
        onOpenPlanModal={() => setPlanModalOpen(true)}
      />
      <PartnerPreferencesModal
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
    </>
  );
};

export default DashboardPage;
