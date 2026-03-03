import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enquiries as initialEnquiries, type Enquiry, type EnquiryStatus, type EnquirySource } from "@/data/mockData";
import {
  Plus, Search, ArrowRight, Phone, Clock, AlertTriangle, MessageSquare,
  UserPlus, Globe, Footprints, Mail, CreditCard
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";

const stages: { key: EnquiryStatus; label: string; color: string; bg: string }[] = [
  { key: "new", label: "New", color: "text-info", bg: "bg-info/10 border-info/30" },
  { key: "contacted", label: "Contacted", color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  { key: "interested", label: "Interested", color: "text-accent-foreground", bg: "bg-accent/20 border-accent/30" },
  { key: "converted", label: "Converted", color: "text-success", bg: "bg-success/10 border-success/30" },
  { key: "lost", label: "Lost", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
];

const sourceIcons: Record<string, any> = {
  Website: Globe, "Walk-in": Footprints, Phone: Phone, WhatsApp: MessageSquare, Email: Mail,
};

const COLORS = ["hsl(333, 60%, 34%)", "hsl(40, 100%, 58%)", "hsl(8, 100%, 85%)", "hsl(160, 60%, 45%)", "hsl(220, 60%, 50%)"];

export default function StaffEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(initialEnquiries);
  const [showAddEnquiry, setShowAddEnquiry] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState<Enquiry | null>(null);
  const [followUpNote, setFollowUpNote] = useState("");
  const [search, setSearch] = useState("");
  const [newEnquiry, setNewEnquiry] = useState<Partial<Enquiry>>({
    name: "", phone: "", source: "Walk-in", notes: "", status: "new",
  });
  const { toast } = useToast();

  const filtered = enquiries.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search)
  );

  const leadSourceData = ["Website", "Walk-in", "Phone", "WhatsApp", "Email"].map((s) => ({
    name: s, value: enquiries.filter((e) => e.source === s).length,
  }));

  const overdueEnquiries = enquiries.filter(
    (e) => e.status !== "converted" && e.status !== "lost" && new Date(e.date) < new Date(Date.now() - 3 * 86400000)
  );

  const moveStage = (id: number, newStatus: EnquiryStatus) => {
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: newStatus } : e));
    toast({ title: "Status Updated", description: `Lead moved to ${newStatus}` });
  };

  const convertToSubscription = (e: Enquiry) => {
    setEnquiries((prev) => prev.map((eq) => eq.id === e.id ? { ...eq, status: "converted" as EnquiryStatus } : eq));
    toast({ title: "Converted!", description: `${e.name} converted to subscription — redirecting to subscription creation` });
  };

  const addEnquiry = () => {
    const id = Math.max(...enquiries.map((e) => e.id)) + 1;
    setEnquiries([...enquiries, {
      id, name: newEnquiry.name!, phone: newEnquiry.phone!, source: newEnquiry.source as EnquirySource,
      status: "new" as const, assignedTo: "Anitha Lakshmi", branch: "Chennai Central",
      date: new Date().toISOString().split("T")[0], notes: newEnquiry.notes!,
    }]);
    setShowAddEnquiry(false);
    setNewEnquiry({ name: "", phone: "", source: "Walk-in", notes: "", status: "new" });
    toast({ title: "Enquiry Added", description: `New lead: ${newEnquiry.name}` });
  };

  const addFollowUp = () => {
    toast({ title: "Follow-up Logged", description: `Note added for ${showFollowUp?.name}` });
    setShowFollowUp(null);
    setFollowUpNote("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enquiry & Lead Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Track, nurture, and convert leads</p>
        </div>
        <Button onClick={() => setShowAddEnquiry(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg">
          <Plus className="h-4 w-4" /> Add Enquiry
        </Button>
      </div>

      {/* Overdue Alert */}
      {overdueEnquiries.length > 0 && (
        <Card className="border-l-4 border-l-destructive bg-destructive/5 shadow-elegant border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
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
            <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {stages.map((stage) => {
              const stageEnquiries = filtered.filter((e) => e.status === stage.key);
              return (
                <div key={stage.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold ${stage.color}`}>{stage.label}</h3>
                    <Badge variant="outline" className="text-xs">{stageEnquiries.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {stageEnquiries.map((e) => {
                      const SourceIcon = sourceIcons[e.source] || Globe;
                      const isOverdue = e.status !== "converted" && e.status !== "lost" &&
                        new Date(e.date) < new Date(Date.now() - 3 * 86400000);
                      return (
                        <Card key={e.id} className={`shadow-sm border ${stage.bg} hover:shadow-md transition-shadow cursor-pointer ${isOverdue ? "ring-2 ring-destructive/50" : ""}`}>
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm">{e.name}</p>
                              {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <SourceIcon className="h-3 w-3" /> {e.source}
                            </div>
                            <p className="text-xs text-muted-foreground">Last: {e.date}</p>
                            <div className="flex gap-1 flex-wrap">
                              {stage.key !== "converted" && stage.key !== "lost" && (
                                <>
                                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                                    onClick={() => setShowFollowUp(e)}>
                                    <Clock className="h-3 w-3 mr-1" /> Follow-up
                                  </Button>
                                  {stage.key === "interested" && (
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-success"
                                      onClick={() => convertToSubscription(e)}>
                                      <CreditCard className="h-3 w-3 mr-1" /> Convert
                                    </Button>
                                  )}
                                  {stage.key !== "interested" && (
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                                      onClick={() => moveStage(e.id, stages[stages.findIndex(s => s.key === stage.key) + 1]?.key || stage.key)}>
                                      <ArrowRight className="h-3 w-3" />
                                    </Button>
                                  )}
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

        {/* Lead Source Chart */}
        <div className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={leadSourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {leadSourceData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Follow-up Timeline */}
          <Card className="shadow-elegant border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Recent Follow-ups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {enquiries.slice(0, 4).map((e) => (
                <div key={e.id} className="flex items-start gap-2 text-sm border-b border-border/50 pb-2 last:border-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-xs">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.notes}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{e.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Enquiry Dialog */}
      <Dialog open={showAddEnquiry} onOpenChange={setShowAddEnquiry}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Enquiry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={newEnquiry.name} onChange={(e) => setNewEnquiry({ ...newEnquiry, name: e.target.value })} placeholder="Lead name" /></div>
            <div><Label>Phone *</Label><Input value={newEnquiry.phone} onChange={(e) => setNewEnquiry({ ...newEnquiry, phone: e.target.value })} placeholder="Phone number" /></div>
            <div>
              <Label>Source *</Label>
              <Select value={newEnquiry.source} onValueChange={(v) => setNewEnquiry({ ...newEnquiry, source: v as EnquirySource })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={newEnquiry.notes} onChange={(e) => setNewEnquiry({ ...newEnquiry, notes: e.target.value })} placeholder="Initial notes..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEnquiry(false)}>Cancel</Button>
            <Button onClick={addEnquiry} disabled={!newEnquiry.name || !newEnquiry.phone}>Add Lead</Button>
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
              <p><span className="text-muted-foreground">Phone:</span> {showFollowUp?.phone}</p>
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
