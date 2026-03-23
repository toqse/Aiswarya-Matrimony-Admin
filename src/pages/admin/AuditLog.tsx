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
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

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

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("20");

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      action: actionFilter === "all" ? undefined : actionFilter,
      role:
        roleFilter === "all"
          ? undefined
          : (roleFilter as "admin" | "branch_manager" | "staff"),
      start_date: toApiDate(startDate),
      end_date: toApiDate(endDate),
      page,
      page_size: Number(pageSize),
    }),
    [actionFilter, endDate, page, pageSize, roleFilter, search, startDate],
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

  const rows = logsData?.results ?? [];
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
                placeholder="Search actor/resource/details..."
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
                {(actionsData ?? []).map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setPage(1);
                setRoleFilter(value);
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Actor Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="branch_manager">Branch Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
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
                rows.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {l.timestamp}
                    </TableCell>
                    <TableCell className="font-medium">
                      {l.actor_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roleLabels[l.actor_role] ?? l.actor_role}
                      </Badge>
                    </TableCell>
                    <TableCell>{l.action_display || l.action}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.resource || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.ip_address || "-"}
                    </TableCell>
                    <TableCell
                      className="text-sm text-muted-foreground max-w-[340px] truncate"
                      title={l.details}
                    >
                      {l.details}
                    </TableCell>
                  </TableRow>
                ))
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
