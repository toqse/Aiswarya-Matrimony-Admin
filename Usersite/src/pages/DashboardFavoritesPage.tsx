"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Eye, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ProfileViewDrawer from "@/components/ProfileViewDrawer";
import {
  getWishlist,
  getProfilePreview,
  getChatPermission,
  wishlistToggle,
  sendInterest as sendInterestApi,
  startChat as startChatApi,
  type MatchProfile,
  type ProfilePreviewData,
} from "@/lib/matchesApi";

const DEFAULT_LIMIT = 10;

const DashboardFavoritesPage = () => {
  const router = useRouter();
  const [profiles, setProfiles] = useState<MatchProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProfilePreviewData | null>(null);
  const [previewCanChat, setPreviewCanChat] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_LIMIT));

  const fetchFavorites = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWishlist({ page: nextPage, limit: DEFAULT_LIMIT });
      setProfiles(res.data.profiles);
      setTotal(res.data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wishlist");
      setProfiles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites(page);
  }, [fetchFavorites, page]);

  const handleViewDetails = useCallback(async (matriId: string) => {
    setActionLoading(matriId);
    try {
      const [profileRes, chatRes] = await Promise.all([
        getProfilePreview(matriId),
        getChatPermission(matriId).catch(() => ({ data: { can_chat: false } })),
      ]);
      setPreview(profileRes.data);
      setPreviewCanChat(!!chatRes.data.can_chat);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleRemoveWishlist = useCallback(
    async (matriId: string) => {
      setActionLoading(matriId);
      try {
        const res = await wishlistToggle(matriId);
        if (!res.data.is_wishlisted) {
          toast.success("Removed from favorites");
          setProfiles((prev) => prev.filter((p) => p.matri_id !== matriId));
          setTotal((prev) => Math.max(0, prev - 1));
          if (preview?.matri_id === matriId) {
            setPreview(null);
            setPreviewCanChat(false);
          }
        }
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to update wishlist",
        );
      } finally {
        setActionLoading(null);
      }
    },
    [preview?.matri_id],
  );

  const handleSendInterest = useCallback(
    async (matriId: string) => {
      setActionLoading(matriId);
      try {
        const res = await sendInterestApi(matriId);
        toast.success(res.message || "Interest sent successfully.");
        setProfiles((prev) =>
          prev.map((p) =>
            p.matri_id === matriId
              ? { ...p, interest_status: "sent", is_interest_sent: true }
              : p,
          ),
        );
        setPreview((prev) =>
          prev?.matri_id === matriId
            ? { ...prev, interest_status: "sent", is_interest_sent: true }
            : prev,
        );
      } catch (e) {
        const err = e as Error & { status?: number };
        const msg = err.message || "Failed to send interest";
        if (err.status === 403 || msg.toLowerCase().includes("plan")) {
          toast.error(msg);
          router.push("/dashboard/plan");
          return;
        }
        toast.error(msg);
      } finally {
        setActionLoading(null);
      }
    },
    [router],
  );

  const handleChat = useCallback(
    async (matriId: string) => {
      setActionLoading(matriId);
      try {
        const res = await startChatApi(matriId);
        const convoId = res.data.conversation_id;
        if (convoId) router.push(`/chat/${convoId}`);
        else router.push("/dashboard/chat-list");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to start chat");
      } finally {
        setActionLoading(null);
      }
    },
    [router],
  );

  const cards = useMemo(
    () =>
      profiles.map((p) => {
        const status = String(p.interest_status ?? "").toLowerCase();
        const isSent = status === "sent" || p.is_interest_sent;
        const isAccepted = status === "accepted";
        const canSend = status === "pending" && (p.can_send_interest ?? false);
        return { p, isSent, isAccepted, canSend };
      }),
    [profiles],
  );

  return (
    <>
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/10 bg-card/90 px-5 py-5 shadow-card"
        >
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-serif text-2xl font-bold text-secondary">
              Favorites
            </h1>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              {total} saved
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Wishlist profiles from `v1/wishlist/`
          </p>
        </motion.div>

        {error ? (
          <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading favorites...
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl border border-primary/10 bg-card p-10 text-center">
            <Heart className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
            <p className="font-semibold text-foreground">No favorites yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the heart icon in My Matches to add profiles.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map(({ p, isSent, isAccepted, canSend }) => {
              const busy = actionLoading === p.matri_id;
              return (
                <div
                  key={p.matri_id}
                  className="rounded-2xl border border-primary/10 bg-card p-4 shadow-card"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-3">
                      <img
                        src={
                          p.profile_photo ||
                          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=260&fit=crop"
                        }
                        alt=""
                        className="h-20 w-16 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-serif text-xl font-bold text-foreground">
                          {p.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {p.education ?? "—"} · {p.occupation ?? "—"} · {p.age}{" "}
                          yrs
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isAccepted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          aria-disabled="true"
                        >
                          <Heart className="mr-1 h-4 w-4 fill-secondary text-secondary" />
                          Interest Accepted
                        </Button>
                      ) : isSent ? (
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          aria-disabled="true"
                        >
                          <Heart className="mr-1 h-4 w-4 fill-secondary text-secondary" />
                          Interest Sent
                        </Button>
                      ) : canSend ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => handleSendInterest(p.matri_id)}
                        >
                          Send interest
                        </Button>
                      ) : null}

                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => handleViewDetails(p.matri_id)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        disabled={busy}
                        onClick={() => handleRemoveWishlist(p.matri_id)}
                      >
                        Remove
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          router.push(
                            `/dashboard/jathagam?profile=${encodeURIComponent(
                              p.matri_id,
                            )}`,
                          )
                        }
                      >
                        <Sparkles className="mr-1 h-4 w-4" />
                        Check Match
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && total > DEFAULT_LIMIT ? (
          <div className="flex items-center justify-end gap-2 border-t border-primary/10 pt-4">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <ProfileViewDrawer
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) {
            setPreview(null);
            setPreviewCanChat(false);
          }
        }}
        profile={null}
        preview={preview}
        onSendInterest={
          preview ? () => handleSendInterest(preview.matri_id) : undefined
        }
        canChat={previewCanChat}
        onChat={preview ? () => handleChat(preview.matri_id) : undefined}
      />
    </>
  );
};

export default DashboardFavoritesPage;
