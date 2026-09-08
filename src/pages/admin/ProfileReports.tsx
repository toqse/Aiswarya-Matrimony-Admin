import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format-date";
import {
  fetchProfileReports,
  updateProfileReportStatus,
  type ProfileReportStatus,
} from "@/lib/admin-api/profile-reports";
import { Flag, Loader2, Search } from "lucide-react";

const PAGE_SIZE = 20;

function statusBadge(status: ProfileReportStatus) {
  if (status === "pending") {
    return <Badge variant="secondary">Pending</Badge>;
  }
  if (status === "reviewed") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        Reviewed
      </Badge>
    );
  }
  return <Badge variant="outline">Dismissed</Badge>;
}

export default function ProfileReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "profile-reports", search, statusFilter, page],
    queryFn: () =>
      fetchProfileReports({
        search: search.trim() || undefined,
        status: statusFilter as ProfileReportStatus | "all",
        page,
        page_size: PAGE_SIZE,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: ProfileReportStatus;
    }) => updateProfileReportStatus(id, status),
    onSuccess: () => {
      toast({ title: "Report updated" });
      void queryClient.invalidateQueries({ queryKey: ["admin", "profile-reports"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const rows = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Flag className="h-6 w-6 text-primary" />
            Profile reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Member reports submitted from the usersite. Review or dismiss each
            case.
          </p>
        </div>
        <Badge variant="outline">{total} total</Badge>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search matri ID, name, or message…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive py-6 text-center">
              {(error as Error).message || "Failed to load reports."}
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              No reports found.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reported</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead className="min-w-[220px]">Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const busy =
                      statusMutation.isPending &&
                      statusMutation.variables?.id === row.id;
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-medium">
                            {row.reported_name || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.reported_matri_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {row.reporter_name || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.reporter_matri_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm whitespace-pre-wrap max-w-md">
                            {row.message}
                          </p>
                        </TableCell>
                        <TableCell>{statusBadge(row.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {row.created_at
                            ? formatDateTime(row.created_at)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 flex-wrap">
                            {row.status !== "reviewed" ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={busy}
                                onClick={() =>
                                  statusMutation.mutate({
                                    id: row.id,
                                    status: "reviewed",
                                  })
                                }
                              >
                                Mark reviewed
                              </Button>
                            ) : null}
                            {row.status !== "dismissed" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  statusMutation.mutate({
                                    id: row.id,
                                    status: "dismissed",
                                  })
                                }
                              >
                                Dismiss
                              </Button>
                            ) : null}
                            {row.status !== "pending" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busy}
                                onClick={() =>
                                  statusMutation.mutate({
                                    id: row.id,
                                    status: "pending",
                                  })
                                }
                              >
                                Reopen
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoading && total > PAGE_SIZE ? (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
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
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
