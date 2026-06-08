"use client";

import { memo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { fetchAndSyncMeProfile } from "@/lib/profileApi";
import {
  LayoutDashboard,
  User,
  Heart,
  MessageCircle,
  Crown,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Users,
  Receipt,
  Star,
} from "lucide-react";
import { cn, isUsableProfilePhotoUrl, withoutTrailingSlash } from "@/lib/utils";
import { stableUnit } from "@/lib/stableRandom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const baseSidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Matches", href: "/dashboard/matches", icon: Users },
  { name: "Favorites", href: "/dashboard/favorites", icon: Star },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Interests", href: "/dashboard/interests", icon: Heart },
  { name: "Chat List", href: "/dashboard/chat-list", icon: MessageCircle },
  { name: "Horoscope", href: "/dashboard/jathagam", icon: Sparkles },
  { name: "Plans and Pricing", href: "/dashboard/plan", icon: Crown },
  { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const FloatingHeart = ({
  delay,
  left,
  size,
}: {
  delay: number;
  left: string;
  size: number;
}) => {
  const seed = `${delay}-${left}-${size}`;
  const driftX = stableUnit(`${seed}-x`) * 40 - 20;
  const duration = 12 + stableUnit(`${seed}-dur`) * 8;
  return (
    <motion.div
      className="absolute pointer-events-none text-primary/10"
      style={{ left, top: "100%" }}
      animate={{
        y: [0, -800],
        x: [0, driftX],
        opacity: [0, 0.6, 0],
        rotate: [0, 360],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    >
      <Heart
        className={`w-${size} h-${size}`}
        style={{ width: size * 4, height: size * 4 }}
      />
    </motion.div>
  );
};

/** Isolated from layout body so pathname / auth churn does not re-run these animations. */
const DashboardAmbientBackground = memo(function DashboardAmbientBackground() {
  return (
    <>
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(330 60% 80%) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 right-10 w-96 h-96 rounded-full opacity-15 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(40 100% 80%) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.3, 1], x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.div
        className="absolute bottom-20 left-1/3 w-64 h-64 rounded-full opacity-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(330 55% 75%) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />
      <FloatingHeart delay={0} left="5%" size={3} />
      <FloatingHeart delay={3} left="85%" size={2} />
      <FloatingHeart delay={6} left="45%" size={4} />
      <FloatingHeart delay={9} left="70%" size={2} />
      <FloatingHeart delay={12} left="20%" size={3} />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(330 60% 34%) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
    </>
  );
});

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const sidebarLinks = baseSidebarLinks;
  const profileSyncedForTokenRef = useRef<string | null>(null);

  const normalizedPath = withoutTrailingSlash(pathname ?? "/dashboard");

  const pageTitle = (() => {
    if (normalizedPath === "/dashboard") return "Dashboard";
    const match = sidebarLinks.find(
      (l) => l.href !== "/dashboard" && normalizedPath.startsWith(l.href),
    );
    return match?.name ?? "Dashboard";
  })();

  /** My Matches: main is a flex column with fixed height; list scrolls inside the page. */
  const isMatchesPage = normalizedPath === "/dashboard/matches";

  useEffect(() => {
    if (!hasHydrated) return;
    const { accessToken: token, logout: doLogout, isProfileComplete } =
      useAuthStore.getState();
    if (!token) {
      doLogout();
      router.replace("/auth");
      return;
    }
    if (!isProfileComplete()) {
      router.replace("/auth");
    }
  }, [accessToken, hasHydrated, router]);

  useEffect(() => {
    if (!hasHydrated || !accessToken) {
      profileSyncedForTokenRef.current = null;
      return;
    }
    if (profileSyncedForTokenRef.current === accessToken) return;
    profileSyncedForTokenRef.current = accessToken;
    void fetchAndSyncMeProfile();
  }, [accessToken, hasHydrated]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    if (!sidebarOpen || !mq.matches) return;

    const html = document.documentElement;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    // Intentionally no body paddingRight: overlay scrollbars on phones report 0 gap
    // or a changing gap; padding the body shifts the whole UI ("pull" on the right).

    return () => {
      body.style.overflow = prevOverflow;
      html.style.overflow = prevHtmlOverflow;
    };
  }, [sidebarOpen]);

  // Close the mobile drawer when navigating between dashboard sections.
  useEffect(() => {
    setSidebarOpen(false);
  }, [normalizedPath]);

  // Warm every dashboard section chunk once the shell is up so sidebar navigation stays snappy.
  useEffect(() => {
    const paths = [
      ...baseSidebarLinks.map((l) => l.href),
      "/dashboard/family-details",
      "/dashboard/help",
    ];
    for (const href of paths) {
      router.prefetch(href);
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    setSidebarOpen(false);
    handleLogout();
  };

  return (
    <div
      className="min-h-screen relative max-lg:overflow-x-clip overflow-x-hidden lg:overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, hsl(340 60% 97%) 0%, hsl(0 0% 100%) 30%, hsl(45 100% 98%) 60%, hsl(340 60% 96%) 100%)",
      }}
    >
      <DashboardAmbientBackground />

      {/* Desktop: fixed-height container so only main content scrolls; sidebar stays fixed. Mobile: normal flow. */}
      <div className="relative z-10 flex w-full min-w-0 max-w-full flex-col px-3 pt-4 pb-8 min-h-screen max-lg:min-h-min sm:px-4 lg:h-screen lg:min-h-0 lg:overflow-hidden lg:px-10">
        {/* Mobile header: stay inside horizontal padding — negative mx caused sub-pixel overflow/jerk */}
        <div className="lg:hidden sticky top-0 z-40 py-3 mb-3 rounded-xl border border-primary/10 bg-background/95 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 bg-card rounded-full shadow-soft flex items-center justify-center shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-serif font-bold text-foreground truncate">
                {pageTitle}
              </p>
              {(user?.matriId || user?.location) && (
                <p className="text-xs text-muted-foreground truncate">
                  {[user.matriId, user.location].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: full-screen dim behind drawer (above page content, below drawer) */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="lg:hidden fixed inset-0 z-[100] touch-none overscroll-none bg-foreground/40 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex flex-1 gap-6 relative min-h-0 min-w-0 max-lg:flex-none max-lg:min-h-min lg:overflow-hidden">
          {/* Sidebar — desktop: in flow; mobile: full-height drawer above backdrop */}
          <aside
            className={cn(
              "w-72 flex-shrink-0 lg:block lg:h-full",
              sidebarOpen
                ? "fixed left-0 top-0 z-[110] h-dvh min-h-dvh w-[min(85vw,18rem)] max-w-[85vw] flex flex-col overscroll-contain lg:static lg:z-auto lg:h-full lg:w-72 lg:min-h-0 lg:max-w-none"
                : "hidden lg:block",
            )}
          >
            <div
              className={cn(
                "bg-card shadow-card flex flex-col flex-1 min-h-0 overflow-hidden",
                "lg:rounded-3xl lg:p-6 lg:shadow-card",
                "max-lg:h-full max-lg:min-h-dvh max-lg:rounded-none max-lg:border-r max-lg:border-primary/10 max-lg:p-4 max-lg:pt-[max(0.75rem,env(safe-area-inset-top))]",
              )}
            >
              <div className="lg:hidden flex items-center justify-between gap-2 pb-3 mb-2 border-b border-primary/10 shrink-0">
                <p className="font-serif font-semibold text-foreground text-sm truncate">
                  Menu
                </p>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="w-10 h-10 rounded-full bg-accent-rose/50 flex items-center justify-center text-foreground hover:bg-accent-rose transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User photo + name from GET v1/profile */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-rose/30 shadow-card ring-4 ring-primary/15">
                  {isUsableProfilePhotoUrl(user?.avatar) ? (
                    <img
                      src={user?.avatar?.trim() ?? ""}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User
                      className="h-16 w-16 text-primary/35"
                      strokeWidth={1.15}
                      aria-hidden
                    />
                  )}
                </div>
                {user?.name && (
                  <p className="mt-3 font-serif font-semibold text-center text-foreground truncate w-full px-1 text-sm">
                    {user.name}
                  </p>
                )}
                {(user?.matriId || user?.location) && (
                  <p className="text-xs text-muted-foreground text-center mt-0.5 truncate w-full px-1">
                    {[user.matriId, user.location].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>

              {/* Nav Links - flex-1 so sidebar fills height, overflow for long lists */}
              <nav className="space-y-1 flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:w-0">
                {sidebarLinks.map((link) => {
                  const isActive =
                    link.href === "/dashboard"
                      ? normalizedPath === "/dashboard"
                      : normalizedPath.startsWith(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      prefetch
                      scroll={false}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "text-secondary border-l-4 border-secondary bg-secondary/5"
                          : "text-foreground hover:bg-accent-rose/50",
                      )}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.name}
                    </Link>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(true)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent-rose/50 w-full transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Log out
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content — matches page locks height on lg so only the list column scrolls */}
          <main
            className={cn(
              "w-full min-w-0 min-h-0 flex-1 overflow-y-auto max-lg:flex-none max-lg:overflow-y-visible max-lg:overflow-x-clip",
              isMatchesPage && "lg:flex lg:flex-col lg:overflow-hidden",
            )}
          >
            {/* No route cross-fade: AnimatePresence + keyed motion blocked paint on section switches. */}
            <div
              className={cn(
                "min-w-0 w-full max-lg:overflow-x-clip",
                !isMatchesPage && "lg:min-h-full",
                isMatchesPage &&
                  "min-h-full lg:flex lg:h-full lg:min-h-0 lg:w-full lg:flex-1 lg:flex-col lg:overflow-hidden",
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You’ll be signed out of your account on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmLogout}>
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardLayout;
