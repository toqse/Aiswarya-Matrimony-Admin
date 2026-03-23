import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { useRole } from "@/contexts/RoleContext";
import { fetchBranchSubscriptions } from "@/lib/admin-api/scoped";
import { fetchBranchStaffList } from "@/lib/admin-api/staff";
import { Loader2 } from "lucide-react";

export default function BranchManagerDashboard() {
  const { branch } = useRole();

  const subsQ = useQuery({
    queryKey: ["branch", "subscriptions", "dash"],
    queryFn: () => fetchBranchSubscriptions({ page_size: 1 }),
  });

  const staffQ = useQuery({
    queryKey: ["branch", "staff", "dash"],
    queryFn: () => fetchBranchStaffList({ page_size: 100 }),
  });

  const kpis = [
    { label: "Branch subscriptions", value: String(subsQ.data?.count ?? "—"), change: "—", trend: "neutral" as const, icon: "CreditCard" },
    { label: "Branch staff", value: String(staffQ.data?.count ?? "—"), change: "—", trend: "neutral" as const, icon: "Users" },
    { label: "Your branch", value: branch?.name ?? "—", change: "—", trend: "neutral" as const, icon: "UserCheck" },
    { label: "Active staff (page)", value: String(staffQ.data?.results?.filter((r) => r.is_active).length ?? "—"), change: "—", trend: "neutral" as const, icon: "UserPlus" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Branch Manager Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{branch?.name ?? "Branch"} — Overview</p>
      </div>

      {(subsQ.isLoading || staffQ.isLoading) && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {(subsQ.isError || staffQ.isError) && (
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
