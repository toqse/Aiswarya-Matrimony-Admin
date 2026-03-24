import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { useRole } from "@/contexts/RoleContext";
import { fetchBranchDashboardSummary } from "@/lib/admin-api/dashboard";
import { Loader2 } from "lucide-react";

export default function BranchManagerDashboard() {
  const { branch } = useRole();

  const summaryQ = useQuery({
    queryKey: ["branch", "dashboard", "summary"],
    queryFn: () => fetchBranchDashboardSummary(),
  });

  const kpis = [
    { label: "Branch subscriptions", value: String(summaryQ.data?.total_subscriptions ?? "—"), change: "—", trend: "neutral" as const, icon: "CreditCard" },
    { label: "Branch staff", value: String(summaryQ.data?.total_staff ?? "—"), change: "—", trend: "neutral" as const, icon: "Users" },
    { label: "Your branch", value: branch?.name ?? "—", change: "—", trend: "neutral" as const, icon: "UserCheck" },
    { label: "Branch profiles", value: String(summaryQ.data?.total_profiles ?? summaryQ.data?.active_enquiries ?? "—"), change: "—", trend: "neutral" as const, icon: "UserPlus" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Branch Manager Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{branch?.name ?? "Branch"} — Overview</p>
      </div>

      {summaryQ.isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {summaryQ.isError && (
        <p className="text-sm text-destructive">Could not load branch data. Check your session and API access.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>
    </div>
  );
}
