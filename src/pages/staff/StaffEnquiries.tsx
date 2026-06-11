import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { formatPhoneDisplay, formatPhoneForApi } from "@/lib/phone";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, ArrowRight, Phone, Clock, AlertTriangle, MessageSquare,
  Globe, Footprints, Mail, CreditCard, TrendingUp, Users, Zap, Eye, Trash2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EnquiryRow, EnquirySource, EnquiryStatus } from "@/lib/admin-api/enquiries";
import {
  addStaffEnquiryNote,
  createStaffEnquiry,
  fetchStaffEnquiries,
  fetchStaffEnquirySummary,
  moveStaffEnquiry,
} from "@/lib/admin-api/staff-enquiries";

const stages: { key: EnquiryStatus; label: string; color: string; bg: string; gradient: string; iconBg: string }[] = [
  { key: "new", label: "New", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", gradient: "from-blue-500 to-blue-600", iconBg: "bg-blue-100" },
  { key: "contacted", label: "Contacted", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", gradient: "from-amber-500 to-amber-600", iconBg: "bg-amber-100" },
  { key: "interested", label: "Interested", color: "text-purple-600", bg: "bg-purple-50 border-purple-200", gradient: "from-purple-500 to-purple-600", iconBg: "bg-purple-100" },
  { key: "converted", label: "Converted", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", gradient: "from-emerald-500 to-emerald-600", iconBg: "bg-emerald-100" },
  { key: "lost", label: "Lost", color: "text-rose-600", bg: "bg-rose-50 border-rose-200", gradient: "from-rose-500 to-rose-600", iconBg: "bg-rose-100" },
];

const sourceIcons: Record<EnquirySource, LucideIcon> = {
  website: Globe,
  "walk-in": Footprints,
  phone: Phone,
  whatsapp: MessageSquare,
  email: Mail,
};

export default function StaffEnquiries() {
  const [showAddEnquiry, setShowAddEnquiry] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState<EnquiryRow | null>(null);
  const [showViewLead, setShowViewLead] = useState<EnquiryRow | null>(null);
  const [followUpNote, setFollowUpNote] = useState("");
  const [search, setSearch] = useState("");
  const [newEnquiry, setNewEnquiry] = useState<{
    name: string;
    phone: string;
    email: string;
    source: EnquirySource;
  }>({
    name: "",
    phone: "",
    email: "",
    source: "walk-in",
  });
  const { toast } = useToast();
  const qc = useQueryClient();

  const summaryQ = useQuery({
    queryKey: ["staff", "enquiries", "summary"],
    queryFn: () => fetchStaffEnquirySummary(),
  });

  const listQ = useQuery({
    queryKey: ["staff", "enquiries", "list", search],
    queryFn: () =>
      fetchStaffEnquiries({
        search: search.trim() || undefined,
        page_size: 100,
      }),
  });

  const fetchedEnquiries = listQ.data?.results;
  const enquiries = useMemo(() => fetchedEnquiries ?? [], [fetchedEnquiries]);

  const overdueEnquiries = useMemo(() => {
    const threshold = Date.now() - 3 * 86400000;
    return enquiries.filter((e) => {
      if (e.status === "converted" || e.status === "lost") return false;
      const ts = Date.parse(e.updated_at || e.created_at);
      return Number.isFinite(ts) && ts < threshold;
    });
  }, [enquiries]);

  const conversionRate = useMemo(() => {
    if (enquiries.length === 0) return "0";
    return ((enquiries.filter((e) => e.status === "converted").length / enquiries.length) * 100).toFixed(0);
  }, [enquiries]);

  const moveMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Exclude<EnquiryStatus, "new"> }) =>
      moveStaffEnquiry(id, status),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["staff", "enquiries", "summary"] }),
        qc.invalidateQueries({ queryKey: ["staff", "enquiries", "list"] }),
      ]);
    },
    onError: (e) => toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }),
  });

  const createMut = useMutation({
    mutationFn: (body: { name: string; phone: string; email?: string; source: EnquirySource }) =>
      createStaffEnquiry(body),
    onSuccess: async (created) => {
      toast({ title: "Enquiry Added", description: `New lead: ${created.name}` });
      setShowAddEnquiry(false);
      setNewEnquiry({ name: "", phone: "", email: "", source: "walk-in" });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["staff", "enquiries", "summary"] }),
        qc.invalidateQueries({ queryKey: ["staff", "enquiries", "list"] }),
      ]);
    },
    onError: (e) => toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }),
  });

  const noteMut = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => addStaffEnquiryNote(id, text),
    onSuccess: async () => {
      toast({ title: "Follow-up Logged", description: `Note added for ${showFollowUp?.name ?? "lead"}` });
      setShowFollowUp(null);
      setFollowUpNote("");
      await qc.invalidateQueries({ queryKey: ["staff", "enquiries", "list"] });
    },
    onError: (e) => toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }),
  });

  const moveStage = (id: number, newStatus: EnquiryStatus) => {
    if (newStatus === "new") return;
    moveMut.mutate({ id, status: newStatus });
    toast({ title: "Updating…", description: `Moving lead to ${newStatus}` });
  };

  const addEnquiry = () => {
    createMut.mutate({
      name: newEnquiry.name,
      phone: formatPhoneForApi(newEnquiry.phone),
      email: newEnquiry.email || undefined,
      source: newEnquiry.source,
    });
  };

  const addFollowUp = () => {
    if (!showFollowUp) return;
    noteMut.mutate({ id: showFollowUp.id, text: followUpNote });
  };

  const kpis = [
    { label: "Total Leads", value: summaryQ.data?.total ?? enquiries.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50", iconBg: "bg-blue-100" },
    { label: "Active Leads", value: enquiries.filter(e => !["converted", "lost"].includes(e.status)).length, icon: Zap, color: "text-amber-600", bg: "bg-amber-50", iconBg: "bg-amber-100" },
    { label: "Converted", value: summaryQ.data?.pipeline?.converted ?? enquiries.filter(e => e.status === "converted").length, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", iconBg: "bg-emerald-100" },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50", iconBg: "bg-purple-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enquiry & Lead Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Track, nurture, and convert leads</p>
        </div>
        <Button onClick={() => setShowAddEnquiry(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4" /> Add Enquiry
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0 hover:shadow-lg transition-all hover:-translate-y-0.5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-11 w-11 rounded-xl ${k.iconBg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overdue Alert */}
      {overdueEnquiries.length > 0 && (
        <Card className="border-l-4 border-l-destructive bg-destructive/5 shadow-elegant border-0 animate-fade-in">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-sm text-destructive">Overdue Follow-ups</p>
              <p className="text-xs text-muted-foreground">{overdueEnquiries.length} lead(s) have not been followed up in 3+ days</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kanban Board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 border-border/60 focus:border-primary" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {stages.map((stage) => {
              const stageEnquiries = enquiries.filter((e) => e.status === stage.key);
              return (
                <div key={stage.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${stage.gradient}`} />
                      <h3 className={`text-sm font-bold ${stage.color}`}>{stage.label}</h3>
                    </div>
                    <Badge variant="outline" className={`text-xs font-bold ${stage.color} border-current/30`}>{stageEnquiries.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {stageEnquiries.map((e) => {
                      const SourceIcon = sourceIcons[e.source] || Globe;
                      const isOverdue = e.status !== "converted" && e.status !== "lost" &&
                        Date.parse(e.updated_at || e.created_at) < Date.now() - 3 * 86400000;
                      return (
                        <Card key={e.id} className={`shadow-sm border ${stage.bg} hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer ${isOverdue ? "ring-2 ring-destructive/50 animate-pulse" : ""}`}>
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm truncate">{e.name}</p>
                              {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <div className={`h-5 w-5 rounded-md ${stage.iconBg} flex items-center justify-center`}>
                                <SourceIcon className="h-3 w-3" />
                              </div>
                              {e.source}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Last: {(e.updated_at || e.created_at).slice(0, 10)}
                            </p>
                            <div className="flex gap-1 flex-wrap">
                              {/* View button for all stages */}
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-blue-600 hover:bg-blue-50"
                                onClick={() => setShowViewLead(e)}>
                                <Eye className="h-3 w-3 mr-1" /> View
                              </Button>
                              {stage.key !== "converted" && stage.key !== "lost" && (
                                <>
                                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-amber-600 hover:bg-amber-50"
                                    onClick={() => setShowFollowUp(e)}>
                                    <Clock className="h-3 w-3 mr-1" /> Follow-up
                                  </Button>
                                  {stage.key !== "lost" && stage.key !== "converted" && (
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-violet-600 hover:bg-violet-50"
                                      onClick={() => moveStage(e.id, stages[stages.findIndex(s => s.key === stage.key) + 1]?.key || stage.key)}>
                                      <ArrowRight className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-rose-500 hover:bg-rose-50"
                                    onClick={() => moveStage(e.id, "lost")}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {/* Follow-up Timeline */}
          <Card className="shadow-elegant border-0 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Recent Follow-ups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {enquiries.slice(0, 4).map((e, idx) => {
                const stageColors = ["bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-emerald-500"];
                return (
                  <div key={e.id} className="flex items-start gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
                    <div className={`h-2.5 w-2.5 rounded-full ${stageColors[idx % stageColors.length]} mt-1.5 shrink-0 ring-2 ring-offset-2 ring-offset-background ${stageColors[idx % stageColors.length]}/30`} />
                    <div className="flex-1">
                      <p className="font-medium text-xs">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.notes}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {(e.updated_at || e.created_at).slice(0, 10)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Lead Dialog */}
      <Dialog open={!!showViewLead} onOpenChange={() => setShowViewLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Lead Details — {showViewLead?.name}</DialogTitle></DialogHeader>
          {showViewLead && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground">Phone</Label><p className="font-medium">{formatPhoneDisplay(showViewLead.phone)}</p></div>
                <div><Label className="text-muted-foreground">Source</Label><p className="font-medium">{showViewLead.source}</p></div>
                <div><Label className="text-muted-foreground">Status</Label><Badge className="mt-1">{showViewLead.status}</Badge></div>
                <div><Label className="text-muted-foreground">Assigned To</Label><p className="font-medium">{showViewLead.assignedTo}</p></div>
                <div><Label className="text-muted-foreground">Branch</Label><p className="font-medium">{showViewLead.branch}</p></div>
                <div><Label className="text-muted-foreground">Last Contact</Label><p className="font-medium">{showViewLead.date}</p></div>
              </div>
              <div><Label className="text-muted-foreground">Notes</Label><p className="bg-muted/50 rounded-lg p-3 mt-1">{showViewLead.notes}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Enquiry Dialog */}
      <Dialog open={showAddEnquiry} onOpenChange={setShowAddEnquiry}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Enquiry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={newEnquiry.name} onChange={(e) => setNewEnquiry({ ...newEnquiry, name: e.target.value })} placeholder="Lead name" /></div>
            <div><Label>Phone *</Label><PhoneInput value={newEnquiry.phone} onChange={(v) => setNewEnquiry({ ...newEnquiry, phone: v })} /></div>
            <div><Label>Email</Label><Input value={newEnquiry.email} onChange={(e) => setNewEnquiry({ ...newEnquiry, email: e.target.value })} placeholder="Email (optional)" /></div>
            <div>
              <Label>Source *</Label>
              <Select value={newEnquiry.source} onValueChange={(v) => setNewEnquiry({ ...newEnquiry, source: v as EnquirySource })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEnquiry(false)}>Cancel</Button>
            <Button onClick={addEnquiry} disabled={!newEnquiry.name || !newEnquiry.phone || createMut.isPending}>
              {createMut.isPending ? "Saving…" : "Add Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow-up Dialog */}
      <Dialog open={!!showFollowUp} onOpenChange={() => setShowFollowUp(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Follow-up — {showFollowUp?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="text-muted-foreground">Source:</span> {showFollowUp?.source}</p>
              <p><span className="text-muted-foreground">Phone:</span> {formatPhoneDisplay(showFollowUp?.phone)}</p>
              <p><span className="text-muted-foreground">Last Note:</span> {showFollowUp?.notes}</p>
            </div>
            <Label>Follow-up Note *</Label>
            <Textarea value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} placeholder="What happened in this follow-up..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFollowUp(null)}>Cancel</Button>
            <Button onClick={addFollowUp} disabled={!followUpNote}>Log Follow-up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
