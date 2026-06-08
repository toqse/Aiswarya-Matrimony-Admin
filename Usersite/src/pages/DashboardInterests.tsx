"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  fetchAllInterestPages,
  getMyInterests,
  respondInterest,
  cancelInterest,
  type InterestCard,
} from "@/lib/interestsApi";
import { formatDateTimeDdMmYyyy } from "@/lib/utils";

type Tab = "received" | "sent";

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=260&fit=crop&crop=face";

const DashboardInterests = () => {
  const [activeTab, setActiveTab] = useState<Tab>("received");
  const router = useRouter();
  const [receivedInterests, setReceivedInterests] = useState<InterestCard[]>(
    [],
  );
  const [sentInterests, setSentInterests] = useState<InterestCard[]>([]);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [sentTotal, setSentTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use canonical list endpoints (/received/, /sent/). Some APIs return empty from /my/.
      const [recv, sent] = await Promise.all([
        fetchAllInterestPages("received"),
        fetchAllInterestPages("sent"),
      ]);
      let receivedResults = recv.results;
      let sentResults = sent.results;
      let receivedTotal = recv.total;
      let sentTotal = sent.total;

      // If both list endpoints are empty, fall back to /my/ (in case only that is populated)
      if (
        receivedResults.length === 0 &&
        sentResults.length === 0 &&
        receivedTotal === 0 &&
        sentTotal === 0
      ) {
        try {
          const my = await getMyInterests();
          receivedResults = my.data.received.results;
          sentResults = my.data.sent.results;
          receivedTotal = my.data.received.total;
          sentTotal = my.data.sent.total;
        } catch {
          /* keep zeros */
        }
      }

      setReceivedInterests(receivedResults);
      setSentInterests(sentResults);
      setReceivedTotal(receivedTotal);
      setSentTotal(sentTotal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load interests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "received", label: "Received" },
    { id: "sent", label: "Sent" },
  ];

  const summary = {
    receivedTotal,
    receivedPending: receivedInterests.filter((i) => i.status === "pending")
      .length,
    sentTotal,
    sentPending: sentInterests.filter((i) => i.status === "pending").length,
  };

  const filteredList =
    activeTab === "received"
      ? receivedInterests.map((i) => ({ interest: i, isReceived: true }))
      : sentInterests.map((i) => ({ interest: i, isReceived: false }));

  const handleAccept = async (id: number, name: string) => {
    setBusyId(id);
    try {
      const res = await respondInterest(id, "accept");
      setReceivedInterests((prev) =>
        prev.map((i) =>
          i.interest_id === id ? { ...i, status: "accepted" as const } : i,
        ),
      );
      toast.success(res.message || `Accepted ${name}'s interest!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to accept interest");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number, name: string) => {
    setBusyId(id);
    try {
      const res = await respondInterest(id, "reject");
      setReceivedInterests((prev) =>
        prev.map((i) =>
          i.interest_id === id ? { ...i, status: "rejected" as const } : i,
        ),
      );
      toast.info(res.message || `Declined ${name}'s interest`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reject interest");
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id: number) => {
    setBusyId(id);
    try {
      const res = await cancelInterest(id);
      setSentInterests((prev) =>
        prev.map((i) =>
          i.interest_id === id ? { ...i, status: "cancelled" as const } : i,
        ),
      );
      toast.success(res.message || "Interest cancelled.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel interest");
    } finally {
      setBusyId(null);
    }
  };

  const statusLabel = (s: InterestCard["status"]) => {
    const map: Record<string, string> = {
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Declined",
      cancelled: "Cancelled",
    };
    return map[s] ?? s;
  };

  return (
    <div className="space-y-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-secondary italic">
          Interest request
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 border border-primary/10 p-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Received
            </p>
            <p className="text-xl font-serif font-bold text-primary">
              {summary.receivedTotal}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Total interests
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-primary/10 p-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Pending
            </p>
            <p className="text-xl font-serif font-bold text-amber-700">
              {summary.receivedPending}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Awaiting your response
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 border border-primary/10 p-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Sent
            </p>
            <p className="text-xl font-serif font-bold text-sky-700">
              {summary.sentTotal}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              You have sent
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-primary/10 p-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Sent pending
            </p>
            <p className="text-xl font-serif font-bold text-emerald-700">
              {summary.sentPending}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Waiting for reply
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/10 text-destructive px-4 py-3 text-sm flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => load()}>
              Retry
            </Button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-card p-6"
        >
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-6 p-1 rounded-2xl bg-rose-50/80 border border-primary/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md border-2 border-primary"
                    : "bg-white/60 text-muted-foreground border-2 border-primary/10 hover:border-primary/20 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {loading && filteredList.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Loading interests…
              </p>
            ) : filteredList.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No {activeTab} interests at the moment.
              </p>
            ) : (
              filteredList.map(({ interest, isReceived }) => {
                const planBadge = "MEMBER";
                const badgeColor = "bg-primary text-primary-foreground";
                const showAcceptDeny =
                  isReceived && interest.status === "pending";
                const showCancel = !isReceived && interest.status === "pending";
                const disabled = busyId === interest.interest_id;

                return (
                  <motion.div
                    key={`${interest.interest_id}-${isReceived ? "r" : "s"}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-4 pb-6 border-b border-primary/5 last:border-0"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={interest.profile_photo || DEFAULT_PHOTO}
                        alt={interest.name}
                        className="w-24 h-28 rounded-xl object-cover"
                      />
                      <span
                        className={`absolute bottom-1 left-1 right-1 text-center text-[10px] font-bold px-1 py-0.5 rounded ${badgeColor}`}
                      >
                        {planBadge}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif font-bold text-foreground">
                          {interest.name}
                        </h3>
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {statusLabel(interest.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span>
                          • Location:{" "}
                          <strong className="text-foreground">
                            {interest.location}
                          </strong>
                        </span>
                        <span>
                          • Age:{" "}
                          <strong className="text-foreground">
                            {interest.age}
                          </strong>
                        </span>
                        <span>
                          • Education:{" "}
                          <strong className="text-foreground">
                            {interest.education}
                          </strong>
                        </span>
                        <span>
                          • Job:{" "}
                          <strong className="text-foreground">
                            {interest.occupation}
                          </strong>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        • Request on:{" "}
                        {formatDateTimeDdMmYyyy(interest.created_at)}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/dashboard/matches?open=${encodeURIComponent(interest.matri_id)}`,
                          )
                        }
                        className="mt-2 text-xs px-3 py-1.5 border border-primary/20 rounded-lg text-foreground hover:bg-accent-rose transition-colors"
                      >
                        View full profile
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {showAcceptDeny && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs rounded-full"
                            disabled={disabled}
                            onClick={() =>
                              handleAccept(interest.interest_id, interest.name)
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs rounded-full border-primary"
                            disabled={disabled}
                            onClick={() =>
                              handleReject(interest.interest_id, interest.name)
                            }
                          >
                            Deny
                          </Button>
                        </>
                      )}
                      {showCancel && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                          disabled={disabled}
                          onClick={() => handleCancel(interest.interest_id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
    </div>
  );
};

export default DashboardInterests;
