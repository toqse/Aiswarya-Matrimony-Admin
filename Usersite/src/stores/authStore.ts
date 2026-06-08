import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  authLogout,
  type VerifyMobileData,
  type VerifyMobileProfile,
} from "@/lib/authApi";

const MATRIMONY_STORAGE_KEY = "matrimony";
const PROFILE_STEPS_STORAGE_KEY = "matrimony_profile_steps";

function setMatrimonyTokens(accessToken: string | null, refreshToken: string | null) {
  try {
    if (accessToken && refreshToken) {
      localStorage.setItem(
        MATRIMONY_STORAGE_KEY,
        JSON.stringify([{ accessToken, refreshToken }])
      );
    } else {
      localStorage.removeItem(MATRIMONY_STORAGE_KEY);
    }
  } catch {
    // ignore localStorage errors
  }
}

function getProfileStepsFromStorage(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PROFILE_STEPS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function setProfileStepsToStorage(steps: Record<string, boolean> | null) {
  try {
    if (steps && Object.keys(steps).length > 0) {
      localStorage.setItem(PROFILE_STEPS_STORAGE_KEY, JSON.stringify(steps));
    } else {
      localStorage.removeItem(PROFILE_STEPS_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export interface User {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  plan: string;
  location: string;
  memberSince: string;
  /** Religion from registration (Step 4). Used for Horoscope visibility and post-payment redirect. */
  religion: string;
  /** Gender from v1/profile/basic_details.gender ("male" | "female"). */
  gender?: string;
  /** Matri ID from auth verify (e.g. AM100006). */
  matriId?: string;
}

const PROFILE_STEP_ORDER = ["location", "religion", "personal", "education", "about", "photos"] as const;
const PROFILE_STEP_TO_SIGNUP_INDEX: Record<string, number> = {
  location: 2,
  religion: 3,
  personal: 4,
  education: 5,
  about: 6,
  photos: 7,
};

interface AuthState {
  hasHydrated: boolean;
  isLoggedIn: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** When set, user has tokens but profile is incomplete; used to resume signup wizard. */
  profileSteps: Record<string, boolean> | null;
  profileNextStep: string | null;
  /** Profile from verify/mobile for pre-filling the signup form (cleared on logout). */
  profilePrefill: VerifyMobileProfile | null;
  /** Demo override: "Hindu" | "Christian" | "Muslim" | null. When set, isHindu() uses this instead of user.religion. */
  demoReligionOverride: string | null;
  login: (method: 'email' | 'phone', value: string) => void;
  /** Complete signup: set user with profile data including religion. */
  loginWithProfile: (profile: Partial<User> & { religion: string }) => void;
  /** Set auth state from verify/mobile API response. */
  setAuthFromVerify: (mobile: string, data: VerifyMobileData) => void;
  /** After POST v1/auth/token/refresh/ — updates JWTs only (same user session). */
  setTokensFromRefresh: (access_token: string, refresh_token: string) => void;
  /** Clear stored profile incomplete state (e.g. after user completes all steps). */
  clearProfileIncomplete: () => void;
  /** Mark a profile step as completed (persisted so "Complete Profile" resumes correctly). */
  markProfileStepComplete: (stepKey: string) => void;
  logout: () => void;
  /** True if profile is complete (or unknown); false if we know it's incomplete. */
  isProfileComplete: () => boolean;
  /** If profile is incomplete, returns signup step index (2–7); otherwise null. */
  getProfileIncompleteSignupStep: () => number | null;
  setDemoReligion: (religion: string | null) => void;
  /** Update user's plan after payment (e.g. "Gold", "Diamond", "Silver"). */
  setPlan: (plan: string) => void;
  /** True if user has a paid plan (Silver, Gold, Diamond) — unlocks contacts, send interest, chat, horoscope for Hindu. */
  hasPaidPlan: () => boolean;
  /** True if user religion is Hindu (Horoscope/Jathagam visible, post-pay redirect to Jathagam). */
  isHindu: () => boolean;
  /** Horoscope/contact view credits: used this period (resets on plan renewal). */
  horoscopeCreditsUsed: number;
  /** Quota per plan: Silver 6, Gold 15, Diamond 30, etc. */
  getHoroscopeQuota: () => number;
  getHoroscopeRemaining: () => number;
  /** Use 1 credit. Returns true if used, false if none left. */
  useHoroscopeCredit: () => boolean;
}

const HOROSCOPE_QUOTA: Record<string, number> = {
  silver: 6,
  gold: 15,
  diamond: 30,
  platinum: 60,
  premium: 70,
};

const defaultUser: User = {
  name: "Rahul",
  email: "rahul@gmail.com",
  phone: "+91 98765 43210",
  avatar: "",
  plan: "Premium",
  location: "Mumbai, India",
  memberSince: "January 2024",
  religion: "Hindu",
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      isLoggedIn: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      profileSteps: null,
      profileNextStep: null,
      profilePrefill: null,
      demoReligionOverride: null,
      horoscopeCreditsUsed: 0,
      login: () => {
        set({ isLoggedIn: true, user: { ...defaultUser } });
      },
      loginWithProfile: (profile) => {
        set({
          isLoggedIn: true,
          user: {
            ...defaultUser,
            name: profile.name ?? defaultUser.name,
            email: profile.email ?? defaultUser.email,
            phone: profile.phone ?? defaultUser.phone,
            location: profile.location ?? defaultUser.location,
            religion: profile.religion ?? "",
          },
        });
      },
      setAuthFromVerify: (mobile, data) => {
        const stepsFromApi = data.profile_steps ?? {};
        const trackedStepsComplete = PROFILE_STEP_ORDER.every((key) => stepsFromApi[key] === true);
        const completed =
          data.is_registration_profile_completed ||
          trackedStepsComplete;
        const steps = completed ? null : (stepsFromApi ?? null);
        set({
          isLoggedIn: true,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: {
            ...defaultUser,
            phone: mobile,
            name: data.matri_id,
            matriId: data.matri_id,
          },
          profileSteps: steps,
          profileNextStep: completed ? null : (data.next_step ?? null),
          profilePrefill: data.profile ?? null,
        });
        setMatrimonyTokens(data.access_token, data.refresh_token);
        setProfileStepsToStorage(steps);
      },
      setTokensFromRefresh: (access_token, refresh_token) => {
        set({
          isLoggedIn: true,
          accessToken: access_token,
          refreshToken: refresh_token,
        });
        setMatrimonyTokens(access_token, refresh_token);
      },
      clearProfileIncomplete: () => {
        setProfileStepsToStorage(null);
        set({ profileSteps: null, profileNextStep: null });
      },
      markProfileStepComplete: (stepKey) => {
        set((state) => {
          const next = { ...(state.profileSteps ?? {}), [stepKey]: true };
          setProfileStepsToStorage(next);
          return { profileSteps: next };
        });
      },
      logout: () => {
        const accessToken = get().accessToken;
        const refreshToken = get().refreshToken;
        if (accessToken) {
          void authLogout(accessToken, refreshToken).catch(() => {});
        }
        setMatrimonyTokens(null, null);
        setProfileStepsToStorage(null);
        set({
          hasHydrated: true,
          isLoggedIn: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          profileSteps: null,
          profileNextStep: null,
          profilePrefill: null,
          demoReligionOverride: null,
        });
      },
      isProfileComplete: () => {
        const fromStore = get().profileSteps ?? {};
        const fromStorage = getProfileStepsFromStorage();
        const steps = { ...fromStore, ...fromStorage };
        if (Object.keys(steps).length === 0) return true;
        return PROFILE_STEP_ORDER.every((key) => steps[key] === true);
      },
      getProfileIncompleteSignupStep: () => {
        const fromStore = get().profileSteps ?? {};
        const fromStorage = getProfileStepsFromStorage();
        const steps = { ...fromStore, ...fromStorage };
        if (Object.keys(steps).length === 0) return null;
        const nextStep = get().profileNextStep;
        if (nextStep && PROFILE_STEP_TO_SIGNUP_INDEX[nextStep] != null) {
          if (!steps[nextStep]) return PROFILE_STEP_TO_SIGNUP_INDEX[nextStep];
        }
        for (const key of PROFILE_STEP_ORDER) {
          if (!steps[key]) return PROFILE_STEP_TO_SIGNUP_INDEX[key] ?? null;
        }
        return null;
      },
      setDemoReligion: (religion) => {
        set({ demoReligionOverride: religion || null });
      },
      setPlan: (plan) => {
        const u = get().user;
        if (u) set({ user: { ...u, plan }, horoscopeCreditsUsed: 0 });
      },
      hasPaidPlan: () => {
        const p = (get().user?.plan ?? "").toLowerCase();
        return p === "silver" || p === "gold" || p === "diamond";
      },
      isHindu: () => {
        const override = get().demoReligionOverride?.trim().toLowerCase();
        if (override) {
          if (override === "christian" || override === "muslim") return false;
          if (override === "hindu") return true;
        }
        const r = (get().user?.religion ?? "").trim().toLowerCase();
        if (r === "christian" || r === "muslim") return false;
        return true;
      },
      getHoroscopeQuota: () => {
        const p = (get().user?.plan ?? "").toLowerCase();
        return HOROSCOPE_QUOTA[p] ?? (get().hasPaidPlan() ? 6 : 0);
      },
      getHoroscopeRemaining: () => {
        const quota = get().getHoroscopeQuota();
        return Math.max(0, quota - get().horoscopeCreditsUsed);
      },
      useHoroscopeCredit: () => {
        const remaining = get().getHoroscopeRemaining();
        if (remaining <= 0) return false;
        set({ horoscopeCreditsUsed: get().horoscopeCreditsUsed + 1 });
        return true;
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        profileSteps: state.profileSteps,
        profileNextStep: state.profileNextStep,
        profilePrefill: state.profilePrefill,
        horoscopeCreditsUsed: state.horoscopeCreditsUsed,
      }),
      onRehydrateStorage: () => (state) => {
        // `set` from create() is not in scope here; use the store's API after hydration.
        if (state?.accessToken && state?.refreshToken) {
          setMatrimonyTokens(state.accessToken, state.refreshToken);
          useAuthStore.setState({ hasHydrated: true });
          return;
        }
        // If tokens are missing after hydration, force a clean logout state.
        setMatrimonyTokens(null, null);
        setProfileStepsToStorage(null);
        useAuthStore.setState({
          hasHydrated: true,
          isLoggedIn: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          profileSteps: null,
          profileNextStep: null,
          profilePrefill: null,
          demoReligionOverride: null,
        });
      },
      merge: (persisted, current) => {
        const p = persisted as {
          isLoggedIn?: boolean;
          user?: User | null;
          horoscopeCreditsUsed?: number;
          profileSteps?: Record<string, boolean> | null;
          profileNextStep?: string | null;
          profilePrefill?: VerifyMobileProfile | null;
        };
        const user = p?.user ?? null;
        if (user?.name === "Anna Jaslin") {
          return {
            ...current,
            ...p,
            user: user ? { ...user, name: "Rahul", email: user.email === "anna.jaslin@gmail.com" ? "rahul@gmail.com" : user.email } : null,
          };
        }
        return { ...current, ...p, user: p?.user ?? current.user };
      },
    }
  )
);
