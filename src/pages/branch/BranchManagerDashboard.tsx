import { useState } from "react";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { branchKPIs, revenueData, staffPerformance, enquiries, profiles } from "@/data/mockData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Progress } from "@/components/ui/progress";
import {
  Search, Upload, Mail, Trophy, Crown, Medal, ArrowRight, MessageSquare,
  UserPlus, Globe, Footprints, Phone, Clock, AlertTriangle, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const sourceIcons: Record<string, any> = {
  Website: Globe, "Walk-in": Footprints, Phone: Phone, WhatsApp: MessageSquare, Email: Mail,
};

export default function BranchManagerDashboard() {
  const { toast } = useToast();
  const [enquirySearch, setEnquirySearch] = useState("");

  const branchEnquiries = enquiries.filter(e => e.branch === "Chennai Central");
  const filteredEnquiries = branchEnquiries.filter(e =>
    e.name.toLowerCase().includes(enquirySearch.toLowerCase())
  );

  // Top performers sorted by revenue
  const topPerformers = [...staffPerformance].sort((a, b) => b.revenue - a.revenue);
  const trophyIcons = [Crown, Trophy, Medal];
  const trophyColors = ["text-amber-500", "text-slate-400", "text-amber-700"];

  const handleBulkUpload = () => toast({ title: "Bulk Upload", description: "Upload CSV/Excel file to import profiles" });
  const handleBulkUpdate = () => toast({ title: "Bulk Update", description: "Select profiles to update in batch" });
  const handleBulkEmail = () => toast({ title: "Bulk Email", description: "Compose email for selected profiles" });
  const handleReassign = (name: string, currentStaff: string) => {
    toast({ title: "Reassigned", description: `${name} reassigned from ${currentStaff}` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Branch Manager Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Chennai Central — Overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {branchKPIs.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Branch Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="branchRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(333, 60%, 34%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(333, 60%, 34%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(333, 60%, 34%)" fill="url(#branchRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Staff Performance Comparison */}
        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Staff Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={staffPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" />
                <Tooltip />
                <Bar dataKey="subscriptionsSold" name="Subscriptions" fill="hsl(333, 60%, 34%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="profilesCreated" name="Profiles" fill="hsl(40, 100%, 58%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Staff Target Progress */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Staff Target Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staffPerformance.map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.achieved}/{s.target} subscriptions</span>
                </div>
                <Progress value={(s.achieved / s.target) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers Widget */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" /> Top Performers — Revenue & Conversion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topPerformers.slice(0, 3).map((s, i) => {
              const Icon = trophyIcons[i] || Medal;
              const convRate = s.target > 0 ? ((s.achieved / s.target) * 100).toFixed(0) : "0";
              return (
                <Card key={s.name} className={`border ${i === 0 ? "border-amber-200 bg-amber-50/50" : "border-border/50"}`}>
                  <CardContent className="p-4 text-center space-y-2">
                    <Icon className={`h-8 w-8 mx-auto ${trophyColors[i]}`} />
                    <p className="font-bold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">₹{s.revenue.toLocaleString()} revenue</p>
                    <div className="flex justify-center gap-3 text-xs">
                      <span className="text-emerald-600 font-medium">{s.subscriptionsSold} subs</span>
                      <span className="text-blue-600 font-medium">{convRate}% conv.</span>
                    </div>
                    <Badge variant={i === 0 ? "default" : "outline"} className="text-xs">
                      #{i + 1} Rank
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enquiry Overview with Assignment Controls */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Enquiry Overview
            </CardTitle>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search enquiries..." value={enquirySearch} onChange={(e) => setEnquirySearch(e.target.value)} className="pl-9 h-8 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnquiries.map((e) => {
                const SourceIcon = sourceIcons[e.source] || Globe;
                const isOverdue = !["converted", "lost"].includes(e.status) && new Date(e.date) < new Date(Date.now() - 3 * 86400000);
                return (
                  <TableRow key={e.id} className={isOverdue ? "bg-destructive/5" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {e.name}
                        {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <SourceIcon className="h-3.5 w-3.5 text-muted-foreground" /> {e.source}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{e.assignedTo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleReassign(e.name, e.assignedTo)}>
                          <UserPlus className="h-3 w-3" /> Reassign
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => toast({ title: "Viewing", description: `Details for ${e.name}` })}>
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

      {/* Bulk Profile Operations */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Bulk Profile Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-dashed border-blue-300 bg-blue-50/30 hover:bg-blue-50 transition-colors cursor-pointer" onClick={handleBulkUpload}>
              <CardContent className="p-6 text-center space-y-2">
                <Upload className="h-10 w-10 mx-auto text-blue-500" />
                <p className="font-semibold text-sm">Bulk Upload</p>
                <p className="text-xs text-muted-foreground">Import profiles via CSV/Excel with horoscope fields</p>
              </CardContent>
            </Card>
            <Card className="border border-dashed border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50 transition-colors cursor-pointer" onClick={handleBulkUpdate}>
              <CardContent className="p-6 text-center space-y-2">
                <ArrowRight className="h-10 w-10 mx-auto text-emerald-500" />
                <p className="font-semibold text-sm">Bulk Update</p>
                <p className="text-xs text-muted-foreground">Select and update multiple profiles at once</p>
              </CardContent>
            </Card>
            <Card className="border border-dashed border-amber-300 bg-amber-50/30 hover:bg-amber-50 transition-colors cursor-pointer" onClick={handleBulkEmail}>
              <CardContent className="p-6 text-center space-y-2">
                <Mail className="h-10 w-10 mx-auto text-amber-500" />
                <p className="font-semibold text-sm">Bulk Email</p>
                <p className="text-xs text-muted-foreground">Send emails to multiple branch profiles</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
