import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { enquiries as initialEnquiries, staffMembers } from "@/data/mockData";
import {
  Search, UserPlus, Eye, AlertTriangle, MessageSquare, Globe, Footprints,
  Phone, Mail, ArrowRightLeft, Plus, Clock, CheckCircle, XCircle, Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const statusConfig: Record<string, { color: string; icon: any }> = {
  new: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Plus },
  contacted: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Phone },
  interested: { color: "bg-violet-100 text-violet-700 border-violet-200", icon: Eye },
  converted: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  lost: { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

const sourceIcons: Record<string, any> = {
  Website: Globe, "Walk-in": Footprints, Phone: Phone, WhatsApp: MessageSquare, Email: Mail,
};

const PIE_COLORS = ["hsl(210, 70%, 55%)", "hsl(150, 60%, 45%)", "hsl(40, 90%, 55%)", "hsl(280, 60%, 55%)", "hsl(0, 65%, 55%)"];

export default function BranchEnquiryOverview() {
  const branchStaff = staffMembers.filter(s => s.branch === "Chennai Central");
  const [enquiries, setEnquiries] = useState(initialEnquiries.filter(e => e.branch === "Chennai Central"));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reassignDialog, setReassignDialog] = useState<{ id: number; name: string; currentStaff: string } | null>(null);
  const [newStaff, setNewStaff] = useState("");
  const { toast } = useToast();

  const filtered = enquiries.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.assignedTo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    new: enquiries.filter(e => e.status === "new").length,
    contacted: enquiries.filter(e => e.status === "contacted").length,
    interested: enquiries.filter(e => e.status === "interested").length,
    converted: enquiries.filter(e => e.status === "converted").length,
    lost: enquiries.filter(e => e.status === "lost").length,
  };

  const sourceDist = Object.entries(
    enquiries.reduce((acc, e) => { acc[e.source] = (acc[e.source] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const handleReassign = () => {
    if (!reassignDialog || !newStaff) return;
    setEnquiries(prev => prev.map(e => e.id === reassignDialog.id ? { ...e, assignedTo: newStaff } : e));
    toast({ title: "Reassigned", description: `${reassignDialog.name} reassigned to ${newStaff}` });
    setReassignDialog(null);
    setNewStaff("");
  };

  const kpis = [
    { label: "Total Enquiries", value: enquiries.length, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Leads", value: statusCounts.new + statusCounts.contacted + statusCounts.interested, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Converted", value: statusCounts.converted, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Overdue Follow-ups", value: enquiries.filter(e => !["converted", "lost"].includes(e.status) && new Date(e.date) < new Date(Date.now() - 3 * 86400000)).length, icon: Clock, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Enquiry Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">All enquiries across branch with assignment controls</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0 hover:shadow-lg transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Pipeline + Source Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(statusCounts).map(([status, count]) => {
                const cfg = statusConfig[status];
                const Icon = cfg.icon;
                return (
                  <button key={status} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${statusFilter === status ? cfg.color + " ring-2 ring-offset-1" : "bg-card border-border hover:bg-muted/50"}`}>
                    <Icon className="h-4 w-4" />
                    <div className="text-left">
                      <p className="text-xs capitalize font-medium">{status}</p>
                      <p className="text-lg font-bold">{count}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={sourceDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                  {sourceDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {sourceDist.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enquiry Table */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold">All Branch Enquiries</CardTitle>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const SourceIcon = sourceIcons[e.source] || Globe;
                const isOverdue = !["converted", "lost"].includes(e.status) && new Date(e.date) < new Date(Date.now() - 3 * 86400000);
                const cfg = statusConfig[e.status];
                return (
                  <TableRow key={e.id} className={isOverdue ? "bg-destructive/5" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {e.name}
                        {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{e.phone}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <SourceIcon className="h-3.5 w-3.5 text-muted-foreground" /> {e.source}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs capitalize ${cfg.color}`}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{e.assignedTo}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.date}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{e.notes}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-blue-600 hover:bg-blue-50"
                          onClick={() => setReassignDialog({ id: e.id, name: e.name, currentStaff: e.assignedTo })}>
                          <ArrowRightLeft className="h-3 w-3" /> Reassign
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => toast({ title: "View Details", description: `Viewing ${e.name}` })}>
                          <Eye className="h-3.5 w-3.5 text-violet-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reassign Dialog */}
      <Dialog open={!!reassignDialog} onOpenChange={() => setReassignDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reassign Enquiry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm text-muted-foreground">Lead</Label>
              <p className="font-medium">{reassignDialog?.name}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Currently Assigned To</Label>
              <p className="font-medium">{reassignDialog?.currentStaff}</p>
            </div>
            <div>
              <Label>Reassign To</Label>
              <Select value={newStaff} onValueChange={setNewStaff}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {branchStaff.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name} — {s.designation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialog(null)}>Cancel</Button>
            <Button onClick={handleReassign} disabled={!newStaff}>Reassign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
