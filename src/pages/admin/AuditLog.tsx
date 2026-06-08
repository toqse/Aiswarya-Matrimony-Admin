import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAuditLogActions,
  fetchAuditLogs,
} from "@/lib/admin-api/audit-log";
import { fetchBranchList } from "@/lib/admin-api/branches";
import {
  actionToneClass,
  formatAuditDetailsLine,
  getAuditVerbTone,
  humanizeAuditAction,
  prettyTargetFromResource,
} from "@/lib/audit-log-display";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function toApiDate(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return undefined;
  return `${day}-${month}-${year}`;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  branch_manager: "Branch Manager",
  staff: "Staff",
};

function rowAccentClass(tone: ReturnType<typeof getAuditVerbTone>): string {
  switch (tone) {
    case "create":
      return "border-l-4 border-l-emerald-500";
    case "update":
      return "border-l-4 border-l-sky-500";
    case "delete":
      return "border-l-4 border-l-red-500";
    default:
      return "";
  }
}

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  // Default: hide admin logs (non-admin only)
  const [roleFilter, setRoleFilter] = useState<"non_admin" | "all" | "admin" | "branch_manager" | "staff">("non_admin");
  const [branchFilter, setBranchFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("20");

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      action: actionFilter === "all" ? undefined : actionFilter,
      role:
        roleFilter === "all" || roleFilter === "non_admin"
          ? undefined
          : (roleFilter as "admin" | "branch_manager" | "staff"),
      branch_id: branchFilter === "all" ? undefined : branchFilter,
      start_date: toApiDate(startDate),
      end_date: toApiDate(endDate),
      page,
      page_size: Number(pageSize),
    }),
    [actionFilter, branchFilter, endDate, page, pageSize, roleFilter, search, startDate],
  );

  const {
    data: logsData,
    isLoading: isLogsLoading,
    isFetching: isLogsFetching,
    error: logsError,
  } = useQuery({
    queryKey: ["admin", "audit-log", queryParams],
    queryFn: () => fetchAuditLogs(queryParams),
  });

  const { data: actionsData } = useQuery({
    queryKey: ["admin", "audit-log", "actions"],
    queryFn: fetchAuditLogActions,
  });

  const { data: branchListData } = useQuery({
    queryKey: ["admin", "branches", "audit-log-filter"],
    queryFn: () => fetchBranchList({ page_size: 500 }),
  });

  const apiRows = Array.isArray(logsData?.results) ? logsData.results : [];
  const rows =
    roleFilter === "non_admin"
      ? apiRows.filter((r) => String(r.actor_role).toLowerCase() !== "admin")
      : apiRows;
  const actionOptions = Array.isArray(actionsData) ? actionsData : [];
  const branchOptions = branchListData?.results ?? [];
  const total = logsData?.count ?? 0;
  const canPrev = page > 1;
  const canNext = Boolean(logsData?.next);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Immutable system audit trail for admin actions
        </p>
      </div>

      {logsError && (
        <p className="text-destructive text-sm">
          {(logsError as Error).message}
        </p>
      )}

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actor / resource / details…"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setPage(1);
                setActionFilter(value);
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionOptions.map((a, index) => (
                  <SelectItem key={`${a.value}-${a.label}-${index}`} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setPage(1);
                setRoleFilter(value as typeof roleFilter);
              }}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non_admin">Staff / Branch Manager</SelectItem>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="branch_manager">Branch Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={branchFilter}
              onValueChange={(value) => {
                setPage(1);
                setBranchFilter(value);
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branchOptions.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                    {b.code ? ` (${b.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-[170px]"
              value={startDate}
              onChange={(e) => {
                setPage(1);
                setStartDate(e.target.value);
              }}
            />
            <Input
              type="date"
              className="w-[170px]"
              value={endDate}
              onChange={(e) => {
                setPage(1);
                setEndDate(e.target.value);
              }}
            />
            <Select
              value={pageSize}
              onValueChange={(value) => {
                setPage(1);
                setPageSize(value);
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
            {isLogsFetching && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Staff name</TableHead>
                <TableHead>Target profile</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="min-w-[240px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLogsLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    No audit logs found for selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((l, index) => {
                  const humanAction = humanizeAuditAction(l.action, l.action_display);
                  const tone = getAuditVerbTone(humanAction, l.action);
                  const staffCell = (l.staff_name || l.actor_name || "—").trim() || "—";
                  const branchCell = (l.branch_name || "—").trim() || "—";
                  const targetCell =
                    (l.target_profile || prettyTargetFromResource(l.resource)).trim() || "—";
                  const detailsLine = formatAuditDetailsLine(
                    { ...l, target_profile: l.target_profile || prettyTargetFromResource(l.resource) },
                    humanAction,
                  );

                  return (
                    <TableRow
                      key={l.id ?? `${l.timestamp}-${l.action}-${index}`}
                      className={cn(rowAccentClass(tone))}
                    >
                      <TableCell className="font-mono text-xs whitespace-nowrap align-top">
                        {l.timestamp}
                      </TableCell>
                      <TableCell className="align-top text-sm max-w-[140px]">
                        <span className="line-clamp-2" title={branchCell}>
                          {branchCell}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium align-top text-sm max-w-[140px]">
                        <span className="line-clamp-2" title={staffCell}>
                          {staffCell}
                        </span>
                      </TableCell>
                      <TableCell className="align-top text-sm max-w-[160px]">
                        <span className="line-clamp-2" title={targetCell}>
                          {targetCell}
                        </span>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="outline">
                          {(roleLabels[String(l.actor_role).toLowerCase()] ?? l.actor_role) || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge
                          variant="outline"
                          className={cn("font-medium whitespace-normal text-left", actionToneClass(tone))}
                        >
                          {humanAction}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground align-top max-w-[min(420px,40vw)]"
                        title={detailsLine}
                      >
                        <span className="line-clamp-3">{detailsLine}</span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {rows.length} of {total} records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!canNext}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
