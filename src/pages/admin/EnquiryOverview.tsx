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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  addAdminEnquiryNote,
  assignAdminEnquiry,
  createAdminEnquiry,
  EnquirySource,
  EnquiryStatus,
  fetchAdminEnquiries,
  fetchAdminEnquiryDetail,
  fetchAdminEnquiryOptions,
  moveAdminEnquiry,
} from "@/lib/admin-api/enquiries";
import { Search, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";

const statusColors: Record<string, string> = {
  new: "bg-info text-info-foreground",
  contacted: "bg-warning text-warning-foreground",
  interested: "bg-accent text-accent-foreground",
  converted: "bg-success text-success-foreground",
  lost: "bg-muted text-muted-foreground",
};

const enquiryStatuses = [
  "new",
  "contacted",
  "interested",
  "converted",
  "lost",
] as const;
const moveStatuses: Exclude<EnquiryStatus, "new">[] = [
  "contacted",
  "interested",
  "converted",
  "lost",
];
const sourceOptions: EnquirySource[] = [
  "website",
  "walk-in",
  "phone",
  "whatsapp",
  "email",
];

export default function EnquiryOverview() {
  const { role } = useRole();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [branchId, setBranchId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpenId, setAssignOpenId] = useState<number | null>(null);
  const [noteOpenId, setNoteOpenId] = useState<number | null>(null);
  const [assignStaffId, setAssignStaffId] = useState("");
  const [noteText, setNoteText] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: "website" as EnquirySource,
    branch: "",
    assigned_to: "",
  });
  const qc = useQueryClient();
  const { toast } = useToast();

  const listParams = {
    search: search.trim() || undefined,
    status: status === "all" ? undefined : (status as EnquiryStatus),
    source: source === "all" ? undefined : (source as EnquirySource),
    branch_id: branchId ? Number(branchId) : undefined,
    staff_id: staffId ? Number(staffId) : undefined,
    page,
    page_size: 20,
  };

  const {
    data: listData,
    isLoading: listLoading,
    error: listError,
  } = useQuery({
    queryKey: ["admin", "enquiries", "list", listParams],
    queryFn: () => fetchAdminEnquiries(listParams),
  });

  const { data: noteDetail } = useQuery({
    enabled: !!noteOpenId,
    queryKey: ["admin", "enquiries", "detail", noteOpenId],
    queryFn: () => fetchAdminEnquiryDetail(Number(noteOpenId)),
  });

  const { data: enquiryOptions, isLoading: optionsLoading } = useQuery({
    enabled: createOpen,
    queryKey: ["admin", "enquiries", "options", form.branch],
    queryFn: () =>
      fetchAdminEnquiryOptions(
        form.branch ? { branch_id: Number(form.branch) } : undefined,
      ),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "enquiries"] });
  };

  const createMut = useMutation({
    mutationFn: () =>
      createAdminEnquiry({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        source: form.source,
        branch: form.branch ? Number(form.branch) : undefined,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : undefined,
      }),
    onSuccess: () => {
      toast({ title: "Enquiry created" });
      setCreateOpen(false);
      setForm({
        name: "",
        phone: "",
        email: "",
        source: "website",
        branch: "",
        assigned_to: "",
      });
      invalidate();
    },
    onError: (e: Error) =>
      toast({
        title: "Create failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  const moveMut = useMutation({
    mutationFn: ({
      id,
      next,
    }: {
      id: number;
      next: Exclude<EnquiryStatus, "new">;
    }) => moveAdminEnquiry(id, next),
    onSuccess: () => {
      toast({ title: "Enquiry moved" });
      invalidate();
    },
    onError: (e: Error) =>
      toast({
        title: "Move failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  const assignMut = useMutation({
    mutationFn: ({ id, sid }: { id: number; sid: number }) =>
      assignAdminEnquiry(id, sid),
    onSuccess: () => {
      toast({ title: "Enquiry assigned" });
      setAssignOpenId(null);
      setAssignStaffId("");
      invalidate();
    },
    onError: (e: Error) =>
      toast({
        title: "Assign failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  const noteMut = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      addAdminEnquiryNote(id, text),
    onSuccess: () => {
      toast({ title: "Note added successfully." });
      setNoteText("");
      invalidate();
      if (noteOpenId)
        qc.invalidateQueries({
          queryKey: ["admin", "enquiries", "detail", noteOpenId],
        });
    },
    onError: (e: Error) =>
      toast({
        title: "Could not add note",
        description: e.message,
        variant: "destructive",
      }),
  });

  const listRows = listData?.results ?? [];
  const total = listData?.count ?? 0;
  const canPrev = Boolean(listData?.previous) && page > 1;
  const canNext = Boolean(listData?.next);
  const err = listError as Error | null;

  const canAssign = role === "admin" || role === "branch-manager";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enquiry Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Lead pipeline management
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button className="gap-1" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add Enquiry
          </Button>
        </div>
      </div>
      {err && <p className="text-sm text-destructive">{err.message}</p>}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search enquiries..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {enquiryStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={source}
          onValueChange={(v) => {
            setPage(1);
            setSource(v);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All source</SelectItem>
            {sourceOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="w-[140px]"
          placeholder="Branch ID"
          value={branchId}
          onChange={(e) => {
            setPage(1);
            setBranchId(e.target.value);
          }}
        />
        <Input
          className="w-[140px]"
          placeholder="Staff ID"
          value={staffId}
          onChange={(e) => {
            setPage(1);
            setStaffId(e.target.value);
          }}
        />
        {listLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      <Card className="shadow-elegant border-0">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listRows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{e.source}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[e.status]}>{e.status}</Badge>
                  </TableCell>
                  <TableCell>{e.assigned_to_name ?? "—"}</TableCell>
                  <TableCell>{e.branch_name ?? "—"}</TableCell>
                  <TableCell>{new Date(e.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Select
                        onValueChange={(v) =>
                          moveMut.mutate({
                            id: e.id,
                            next: v as Exclude<EnquiryStatus, "new">,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-[110px] text-xs">
                          <SelectValue placeholder="Move to..." />
                        </SelectTrigger>
                        <SelectContent>
                          {moveStatuses
                            .filter((s) => s !== e.status)
                            .map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {canAssign && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => setAssignOpenId(e.id)}
                        >
                          Assign
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setNoteOpenId(e.id)}
                      >
                        Note
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {listRows.length} of {total} records
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Enquiry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              placeholder="Phone (10 digits)"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
            />
            <Input
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
            <Select
              value={form.source}
              onValueChange={(v: EnquirySource) =>
                setForm((p) => ({ ...p, source: v }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={form.branch || undefined}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, branch: v, assigned_to: "" }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch (optional)" />
              </SelectTrigger>
              <SelectContent>
                {(enquiryOptions?.branches ?? []).map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canAssign && (
              <Select
                value={form.assigned_to || undefined}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, assigned_to: v }))
                }
                disabled={optionsLoading || (enquiryOptions?.staff ?? []).length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign staff (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {(enquiryOptions?.staff ?? []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {form.branch ? s.name : `${s.name} — ${s.branch_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending}
            >
              {createMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignOpenId} onOpenChange={() => setAssignOpenId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Enquiry</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Staff ID"
            value={assignStaffId}
            onChange={(e) => setAssignStaffId(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpenId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                assignOpenId &&
                assignStaffId &&
                assignMut.mutate({
                  id: assignOpenId,
                  sid: Number(assignStaffId),
                })
              }
              disabled={!assignStaffId || assignMut.isPending}
            >
              {assignMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Assign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!noteOpenId} onOpenChange={() => setNoteOpenId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enquiry Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="max-h-44 overflow-y-auto rounded border p-2 text-sm space-y-2">
              {(noteDetail?.enquiry_notes ?? []).length === 0 && (
                <p className="text-muted-foreground">No notes yet.</p>
              )}
              {(noteDetail?.enquiry_notes ?? []).map((n) => (
                <div key={n.id} className="border-b pb-1 last:border-b-0">
                  <p>{n.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add note..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpenId(null)}>
              Close
            </Button>
            <Button
              onClick={() =>
                noteOpenId &&
                noteText.trim() &&
                noteMut.mutate({ id: noteOpenId, text: noteText.trim() })
              }
              disabled={!noteText.trim() || noteMut.isPending}
            >
              {noteMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Note"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
