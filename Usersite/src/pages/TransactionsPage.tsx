"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Crown,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Wallet,
  CalendarDays,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  getTransactionSummary,
  getTransactions,
  getTransactionCount,
  getTransactionDetail,
  type Transaction,
  type TransactionDetail,
  type TransactionType,
  type TransactionStatus,
} from "@/lib/transactionsApi";
import { formatDateDdMmYyyy } from "@/lib/utils";

// ---- Config maps ----

const statusConfig: Record<
  TransactionStatus,
  { label: string; icon: typeof CheckCircle; color: string }
> = {
  success: {
    label: "Success",
    icon: CheckCircle,
    color: "text-green-600 bg-green-50 border-green-200",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-600 bg-red-50 border-red-200",
  },
  refunded: {
    label: "Refunded",
    icon: RotateCcw,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
};

const typeConfig: Record<
  TransactionType,
  { icon: typeof Crown; label: string; isCredit: boolean }
> = {
  plan_purchase: { icon: Crown, label: "Plan Purchase", isCredit: false },
  profile_boost: {
    icon: ArrowUpRight,
    label: "Profile Boost",
    isCredit: false,
  },
  refund: { icon: ArrowDownLeft, label: "Refund", isCredit: true },
};

/** Display-only: no leading minus (API may send negative amounts for debits). */
function formatAmount(amount: number): string {
  const n = Math.abs(Number(amount) || 0);
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ---- Detail Modal ----

interface DetailModalProps {
  transactionId: string | null;
  onClose: () => void;
}

const DetailModal = ({ transactionId, onClose }: DetailModalProps) => {
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) return;
    setDetail(null);
    setError(null);
    setLoading(true);
    getTransactionDetail(transactionId)
      .then((res) => setDetail(res.data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load details"),
      )
      .finally(() => setLoading(false));
  }, [transactionId]);

  const st = detail
    ? (statusConfig[detail.status] ?? statusConfig.pending)
    : null;
  const StatusIcon = st?.icon ?? Clock;

  return (
    <Dialog open={!!transactionId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm w-[92vw] rounded-2xl p-0 gap-0 border-0 shadow-elevated overflow-hidden">
        <DialogTitle className="sr-only">Transaction Detail</DialogTitle>

        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary p-5 text-primary-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-base leading-tight">
                Transaction Detail
              </p>
              {detail && (
                <p className="text-xs opacity-80 mt-0.5">
                  {detail.transaction_id}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="text-center py-6 space-y-2">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
          {detail && !loading && (
            <div className="space-y-3">
              {[
                { icon: Crown, label: "Plan", value: detail.plan_name },
                {
                  icon: Wallet,
                  label: "Amount",
                  value: formatAmount(detail.amount),
                },
                {
                  icon: BadgeCheck,
                  label: "Payment Method",
                  value: detail.payment_method?.toUpperCase() ?? "—",
                },
                {
                  icon: CalendarDays,
                  label: "Date",
                  value: formatDateDdMmYyyy(detail.date),
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-primary/5"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {value}
                    </p>
                  </div>
                </div>
              ))}

              {/* Status */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-muted-foreground">Status</span>
                {st && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${st.color}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {st.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-primary/10">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---- Main page ----

const LIMIT = 10;

const TransactionsPage = () => {
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [totalSpent, setTotalSpent] = useState<number | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [nextRenewal, setNextRenewal] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const loadData = useCallback(async (currentPage: number) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [summaryRes, listRes, countRes] = await Promise.all([
        getTransactionSummary(),
        getTransactions(currentPage, LIMIT),
        getTransactionCount(),
      ]);
      setTotalSpent(summaryRes.data.total_spent);
      setActivePlan(summaryRes.data.active_plan);
      setNextRenewal(summaryRes.data.next_renewal);
      setTransactions(listRes.data.transactions ?? []);
      setTotalPages(Math.max(1, Math.ceil(listRes.data.total / LIMIT)));
      setTotalCount(countRes.data.total_transactions);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load transactions",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(page);
  }, [loadData, page]);

  const summaryCards = [
    {
      label: "Total Spent",
      value: totalSpent !== null ? formatAmount(totalSpent) : "—",
      color: "from-primary/10 to-accent-rose",
    },
    {
      label: "Active Plan",
      value: activePlan ?? "—",
      color: "from-secondary/10 to-accent-gold/30",
    },
    {
      label: "Next Renewal",
      value: nextRenewal ? formatDateDdMmYyyy(nextRenewal) : "—",
      color: "from-green-50 to-emerald-50",
    },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-secondary">
            Transactions
          </h1>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold/30 border border-secondary/20">
            <CreditCard className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-foreground">
              {totalCount !== null
                ? `${totalCount} Transaction${totalCount !== 1 ? "s" : ""}`
                : "…"}
            </span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 border border-primary/10`}
            >
              <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
              <p className="font-serif text-xl font-bold text-foreground">
                {loading && totalSpent === null ? (
                  <span className="inline-block w-24 h-5 bg-primary/10 rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Transaction list */}
        <div className="bg-card rounded-3xl shadow-card border border-primary/10 overflow-hidden">
          <div className="p-5 border-b border-primary/10 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-foreground">
              Transaction History
            </h2>
            {!loading && transactions.length > 0 && totalPages > 1 && (
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          {loading && (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && loadError && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <p className="text-sm text-muted-foreground">{loadError}</p>
              <Button variant="outline" onClick={() => loadData(page)}>
                Try again
              </Button>
            </div>
          )}

          {!loading && !loadError && transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CreditCard className="w-10 h-10 text-primary/30" />
              <p className="text-sm text-muted-foreground">
                No transactions found.
              </p>
            </div>
          )}

          {!loading && !loadError && transactions.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="divide-y divide-primary/5"
              >
                {transactions.map((txn, i) => {
                  const st = statusConfig[txn.status] ?? statusConfig.pending;
                  const tc = typeConfig[txn.type] ?? typeConfig.plan_purchase;
                  const StatusIcon = st.icon;
                  const TypeIcon = tc.icon;

                  return (
                    <motion.button
                      key={txn.transaction_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setDetailId(txn.transaction_id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-accent-rose/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.isCredit ? "bg-green-50" : "bg-primary/10"}`}
                        >
                          <TypeIcon
                            className={`w-5 h-5 ${tc.isCredit ? "text-green-600" : "text-primary"}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {txn.plan_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {txn.transaction_id} · {formatDateDdMmYyyy(txn.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span
                          className={`text-sm font-bold ${tc.isCredit ? "text-green-600" : "text-foreground"}`}
                        >
                          {tc.isCredit ? "+" : ""}
                          {formatAmount(txn.amount)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${st.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Pagination */}
          {!loading && !loadError && totalPages > 1 && (
            <div className="p-4 border-t border-primary/10 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      <DetailModal transactionId={detailId} onClose={() => setDetailId(null)} />
    </>
  );
};

export default TransactionsPage;
