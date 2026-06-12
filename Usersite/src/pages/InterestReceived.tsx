"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlassProfileCard from "@/components/GlassProfileCard";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import { Heart, Sparkles, Inbox, Filter, Check, Clock, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getReceivedInterests, respondInterest, type InterestCard } from "@/lib/interestsApi";
import { getDisplayErrorMessage } from "@/lib/apiErrors";
import type { Profile } from "@/components/FeaturedProfiles";
import type { InterestStatus } from "@/stores/interestStore";
import { useAuthStore } from "@/stores/authStore";

type FilterType = "all" | "pending" | "accepted" | "rejected";

const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face";

function cardToProfile(card: InterestCard): Profile {
  return {
    id: card.interest_id,
    name: card.name,
    age: card.age,
    profession: card.occupation,
    education: card.education,
    location: card.location,
    image: card.profile_photo || DEFAULT_IMG,
    isVerified: false,
    isPremium: false,
    compatibility: 0,
  };
}

const InterestReceived = () => {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [list, setList] = useState<InterestCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const limit = 20;

  const loadPage = useCallback(
    async (p: number, append: boolean) => {
      if (!accessToken) return;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await getReceivedInterests(p, limit);
        setTotal(res.data.total);
        setList((prev) => (append ? [...prev, ...res.data.results] : res.data.results));
      } catch (e) {
        toast.error(getDisplayErrorMessage(e));
        if (!append) setList([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      setList([]);
      return;
    }
    setPage(1);
    loadPage(1, false);
  }, [accessToken, loadPage]);

  const hasMore = list.length < total;

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadPage(next, true);
  };

  const filteredInterests = list.filter((interest) => {
    if (filter === "all") return true;
    return interest.status === filter;
  });

  const handleAccept = async (interestId: number, profileName: string) => {
    setBusyId(interestId);
    try {
      const res = await respondInterest(interestId, "accept");
      setList((prev) =>
        prev.map((i) => (i.interest_id === interestId ? { ...i, status: "accepted" as const } : i)),
      );
      toast.success(res.message || `You've accepted ${profileName}'s interest!`, {
        description: "You can start chatting when available from your dashboard.",
      });
    } catch (e) {
      toast.error(getDisplayErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (interestId: number, profileName: string) => {
    setBusyId(interestId);
    try {
      const res = await respondInterest(interestId, "reject");
      setList((prev) =>
        prev.map((i) => (i.interest_id === interestId ? { ...i, status: "rejected" as const } : i)),
      );
      toast.info(res.message || `Declined ${profileName}'s interest`);
    } catch (e) {
      toast.error(getDisplayErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const filters: { id: FilterType; label: string; icon: typeof Inbox }[] = [
    { id: "all", label: "All", icon: Inbox },
    { id: "pending", label: "Pending", icon: Clock },
    { id: "accepted", label: "Accepted", icon: Check },
    { id: "rejected", label: "Declined", icon: X },
  ];

  const counts = {
    all: list.length,
    pending: list.filter((i) => i.status === "pending").length,
    accepted: list.filter((i) => i.status === "accepted").length,
    rejected: list.filter((i) => i.status === "rejected").length,
  };

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20 text-center">
          <Heart className="w-16 h-16 mx-auto text-primary mb-4 opacity-80" />
          <h1 className="font-serif text-2xl font-bold mb-2">Sign in to view interests</h1>
          <p className="text-muted-foreground mb-6">Log in to see who is interested in you.</p>
          <Button onClick={() => router.push("/auth")}>Sign in</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-12 bg-gradient-romantic relative overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float-delayed" />
        {[...Array(5)].map((_, i) => (
          <Sparkles
            key={i}
            className="absolute text-secondary/30 animate-sparkle"
            style={{
              left: `${10 + i * 20}%`,
              top: `${30 + (i % 2) * 20}%`,
              width: `${20 + i * 4}px`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary/10 mb-4 shadow-soft">
              <Heart className="w-4 h-4 text-primary fill-primary animate-pulse-soft" />
              <span className="text-sm font-medium text-primary">Interests Received</span>
              {counts.pending > 0 && (
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  {counts.pending} new
                </span>
              )}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              People Interested in <span className="text-gradient-gold">You</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Review and respond to interests from members who want to connect with you
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-6 bg-white/50 backdrop-blur-sm sticky top-16 z-40 border-b border-primary/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            {filters.map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  filter === id
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-white/70 text-muted-foreground hover:bg-accent-rose/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${filter === id ? "bg-white/20" : "bg-primary/10"}`}
                >
                  {counts[id]}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : filteredInterests.length === 0 ? (
            <EmptyState
              icon={Heart}
              title={filter === "all" ? "No interests received yet" : `No ${filter} interests`}
              description={
                filter === "all"
                  ? "When someone shows interest in your profile, you'll see them here."
                  : `You don't have any ${filter} interests at the moment.`
              }
              actionLabel="Browse Profiles"
              actionPath="/search"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {filteredInterests.map((interest, index) => {
                  const profile = cardToProfile(interest);
                  const pending = interest.status === "pending";
                  const disabled = busyId === interest.interest_id;
                  const cardStatus: InterestStatus =
                    interest.status === "accepted"
                      ? "accepted"
                      : interest.status === "pending"
                        ? "pending"
                        : "rejected";
                  return (
                    <div key={interest.interest_id} className="flex flex-col h-full opacity-100">
                      <div className="flex-1 flex flex-col">
                        <GlassProfileCard
                          profile={profile}
                          index={index}
                          isFavorite={false}
                          interestStatus={cardStatus}
                          onAccept={
                            pending && !disabled
                              ? () => handleAccept(interest.interest_id, interest.name)
                              : undefined
                          }
                          onReject={
                            pending && !disabled
                              ? () => handleReject(interest.interest_id, interest.name)
                              : undefined
                          }
                          canChat={false}
                          onViewProfile={() =>
                            router.push(
                              `/dashboard/matches?open=${encodeURIComponent(interest.matri_id)}`,
                            )
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {hasMore && filter === "all" && (
                <div className="flex justify-center mt-10">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Loading…
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InterestReceived;
