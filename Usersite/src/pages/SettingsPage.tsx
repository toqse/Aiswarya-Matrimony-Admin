"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, Check, AlertCircle, User } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getSettingsProfile,
  updateProfileVisibility,
  updateInterestPermission,
  type SettingsProfile,
  type ProfileVisibility,
  type InterestPermission,
} from "@/lib/settingsApi";
import { isUsableProfilePhotoUrl } from "@/lib/utils";

// ─── Small helpers ─────────────────────────────────────────────────────────────

function StatusBadge({
  status,
}: {
  status: "saving" | "saved" | "error" | null;
}) {
  if (!status) return null;
  return (
    <AnimatePresence>
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className={`text-xs flex items-center gap-1 ${
          status === "saving"
            ? "text-muted-foreground"
            : status === "saved"
              ? "text-green-600"
              : "text-red-500"
        }`}
      >
        {status === "saving" && <Loader2 className="w-3 h-3 animate-spin" />}
        {status === "saved" && <Check className="w-3 h-3" />}
        {status === "error" && <AlertCircle className="w-3 h-3" />}
        {status === "saving"
          ? "Saving…"
          : status === "saved"
            ? "Saved"
            : "Error"}
      </motion.span>
    </AnimatePresence>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const { user, logout, accessToken } = useAuthStore();
  const router = useRouter();

  // ── Server state ──
  const [settings, setSettings] = useState<SettingsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Local UI state (kept in sync after fetch) ──
  const [visibility, setVisibility] = useState<ProfileVisibility>("all_users");
  const [interestPerm, setInterestPerm] =
    useState<InterestPermission>("all_users");

  // ── Save-status indicators ──
  const [visibilityStatus, setVisibilityStatus] = useState<
    "saving" | "saved" | "error" | null
  >(null);
  const [interestStatus, setInterestStatus] = useState<
    "saving" | "saved" | "error" | null
  >(null);

  // ── Debounce timers ──
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clearSavedAfterDelay(setter: (v: null) => void) {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setter(null), 2500);
  }

  // ── Load settings on mount ──
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getSettingsProfile()
      .then((data) => {
        setSettings(data);
        setVisibility(data.profile_visibility);
        setInterestPerm(data.interest_permission);
        setFetchError(null);
      })
      .catch((err: Error) => {
        setFetchError(err.message);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  // ── Handlers ──

  const handleVisibilityChange = async (val: ProfileVisibility) => {
    setVisibility(val);
    setVisibilityStatus("saving");
    try {
      await updateProfileVisibility(val);
      setVisibilityStatus("saved");
      clearSavedAfterDelay(setVisibilityStatus);
    } catch {
      setVisibilityStatus("error");
    }
  };

  const handleInterestPermChange = async (val: InterestPermission) => {
    setInterestPerm(val);
    setInterestStatus("saving");
    try {
      await updateInterestPermission(val);
      setInterestStatus("saved");
      clearSavedAfterDelay(setInterestStatus);
    } catch {
      setInterestStatus("error");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // ── Derived display values ──
  const displayName = settings?.name || user?.name || "—";
  const displayPhotoRaw = (settings?.profile_photo || user?.avatar || "").trim();
  const displayPhoto = isUsableProfilePhotoUrl(displayPhotoRaw)
    ? displayPhotoRaw
    : null;
  const displayPlan = settings?.plan || user?.plan || "—";
  const displayLocation = settings?.location || user?.location || "—";

  const visibilityOptions: { value: ProfileVisibility; label: string }[] = [
    { value: "all_users", label: "All users" },
    { value: "premium_only", label: "Premium users only" },
    { value: "hidden", label: "Hidden" },
  ];

  const interestOptions: { value: InterestPermission; label: string }[] = [
    { value: "all_users", label: "All users" },
    { value: "premium_only", label: "Premium users only" },
  ];

  return (
    <div className="space-y-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-secondary italic">
          Profile settings
        </h1>

        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {fetchError}
          </div>
        )}

        {/* ── Profile card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-card p-6"
        >
          <h3 className="text-secondary font-medium mb-4">Profile</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {loading ? (
                <div className="w-14 h-14 rounded-full bg-gray-100 animate-pulse" />
              ) : displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt={displayName}
                  className="h-14 w-14 rounded-full border-2 border-primary/20 object-cover"
                />
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/20 bg-muted/40"
                  aria-hidden
                >
                  <User className="h-7 w-7 text-primary/40" strokeWidth={1.25} />
                </div>
              )}
              <div>
                {loading ? (
                  <div className="space-y-1">
                    <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <h4 className="font-serif font-bold text-foreground">
                      {displayName}
                    </h4>
                    <p className="text-xs text-secondary">
                      {displayPlan} user | {displayLocation}
                    </p>
                  </>
                )}
              </div>
            </div>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground rounded-full gap-1"
              onClick={handleLogout}
            >
              <LogOut className="w-3 h-3" /> Sign Out
            </Button>
          </div>
        </motion.div>

        {/* ── Visibility settings ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-card p-6 space-y-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-serif font-bold text-secondary">
                Profile visible
              </h3>
              <p className="text-xs text-muted-foreground">
                You can set-up who can able to view your profile.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={visibilityStatus} />
              <select
                value={visibility}
                onChange={(e) =>
                  handleVisibilityChange(e.target.value as ProfileVisibility)
                }
                disabled={loading}
                className="border border-primary/10 rounded-xl px-4 py-2 text-sm bg-white disabled:opacity-50 cursor-pointer"
              >
                {visibilityOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-primary/5" />

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-serif font-bold text-secondary">
                Who can send you Interest requests?
              </h3>
              <p className="text-xs text-muted-foreground">
                You can set-up who can able to make Interest request here.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={interestStatus} />
              <select
                value={interestPerm}
                onChange={(e) =>
                  handleInterestPermChange(e.target.value as InterestPermission)
                }
                disabled={loading}
                className="border border-primary/10 rounded-xl px-4 py-2 text-sm bg-white disabled:opacity-50 cursor-pointer"
              >
                {interestOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
    </div>
  );
};

export default SettingsPage;
