import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { formatPhoneDisplay, formatPhoneForApi } from "@/lib/phone";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  addBranchEnquiryNote,
  createBranchEnquiry,
  fetchBranchEnquiries,
  fetchBranchEnquirySummary,
  moveBranchEnquiry,
  type EnquirySource,
  type EnquiryStatus,
} from "@/lib/admin-api/enquiries";
import { MessageSquare, Users, CheckCircle, Clock, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusOptions: EnquiryStatus[] = ["new", "contacted", "interested", "converted", "lost"];

export default function BranchEnquiryOverview() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [noteText, setNoteText] = useState("");
  const [noteForId, setNoteForId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", phone: "", email: "", source: "website" as EnquirySource });
  const { toast } = useToast();
  const qc = useQueryClient();

  const summaryQ = useQuery({
    queryKey: ["branch", "enquiries", "summary"],
    queryFn: () => fetchBranchEnquirySummary(),
  });

  const listQ = useQuery({
    queryKey: ["branch", "enquiries", "list", search, status],
    queryFn: () =>
      fetchBranchEnquiries({
        search: search.trim() || undefined,
        status: status === "all" ? undefined : (status as EnquiryStatus),
        page_size: 100,
      }),
  });

  const moveMut = useMutation({
    mutationFn: ({ id, next }: { id: number; next: Exclude<EnquiryStatus, "new"> }) => moveBranchEnquiry(id, next),
    onSuccess: () => {
      toast({ title: "Status updated" });
      qc.invalidateQueries({ queryKey: ["branch", "enquiries"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const noteMut = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => addBranchEnquiryNote(id, text),
    onSuccess: () => {
      toast({ title: "Note added" });
      setNoteText("");
      setNoteForId(null);
      qc.invalidateQueries({ queryKey: ["branch", "enquiries"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createBranchEnquiry({
        name: createForm.name.trim(),
        phone: formatPhoneForApi(createForm.phone),
        email: createForm.email.trim() || undefined,
        source: createForm.source,
      }),
    onSuccess: () => {
      toast({ title: "Enquiry created" });
      setAddOpen(false);
      setCreateForm({ name: "", phone: "", email: "", source: "website" });
      qc.invalidateQueries({ queryKey: ["branch", "enquiries"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rows = listQ.data?.results ?? [];
  const cards = [
    { label: "Total Enquiries", value: summaryQ.data?.total_enquiries ?? "—", icon: MessageSquare },
    { label: "Active Leads", value: summaryQ.data?.active_leads ?? "—", icon: Users },
    { label: "Converted", value: summaryQ.data?.converted ?? "—", icon: CheckCircle },
    { label: "Overdue Follow-ups", value: summaryQ.data?.overdue_followups ?? "—", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Enquiry Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Branch-scoped enquiries from live API</p>
      </div>
      <div>
        <Button onClick={() => setAddOpen(true)}>Add Enquiry</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name/phone/email..." className="pl-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(listQ.isLoading || summaryQ.isLoading) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{formatPhoneDisplay(r.phone)}</TableCell>
                  <TableCell>{r.source}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.status}</Badge>
                  </TableCell>
                  <TableCell>{r.assigned_to_name ?? "Unassigned"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 items-center flex-wrap">
                      {(["contacted", "interested", "converted", "lost"] as const).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant="outline"
                          onClick={() => moveMut.mutate({ id: r.id, next: s })}
                          disabled={moveMut.isPending || r.status === s}
                        >
                          {s}
                        </Button>
                      ))}
                      <Input
                        value={noteForId === r.id ? noteText : ""}
                        onChange={(e) => {
                          setNoteForId(r.id);
                          setNoteText(e.target.value);
                        }}
                        placeholder="Add note..."
                        className="h-8 w-[180px]"
                      />
                      <Button
                        size="sm"
                        onClick={() => noteMut.mutate({ id: r.id, text: noteText })}
                        disabled={noteMut.isPending || noteForId !== r.id || !noteText.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Enquiry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Name"
            />
            <PhoneInput
              value={createForm.phone}
              onChange={(v) => setCreateForm((p) => ({ ...p, phone: v }))}
            />
            <Input
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email (optional)"
            />
            <Select value={createForm.source} onValueChange={(v: EnquirySource) => setCreateForm((p) => ({ ...p, source: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">website</SelectItem>
                <SelectItem value="walk-in">walk-in</SelectItem>
                <SelectItem value="phone">phone</SelectItem>
                <SelectItem value="whatsapp">whatsapp</SelectItem>
                <SelectItem value="email">email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !createForm.name.trim() || !createForm.phone.trim()}
            >
              {createMut.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
