import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useRole } from "@/contexts/RoleContext";
import { profileHoroscopes as initialHoroscopes, horoscopeMatches, horoscopeAuditLog, type ProfileHoroscope } from "@/data/mockData";
import {
  Star, Eye, Edit, FileText, Download, RefreshCw, Search,
  CheckCircle, Clock, XCircle, AlertTriangle, Heart, Sparkles,
  Calendar, MapPin, Timer, Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const rasiOptions = [
  "Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Kataka (Cancer)",
  "Simha (Leo)", "Kanya (Virgo)", "Thulam (Libra)", "Vrischika (Scorpio)",
  "Dhanus (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"
];

const nakshatraOptions = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Thiruvathirai",
  "Punarvasu", "Pushya", "Ashlesha", "Makha", "Pooram", "Uthram",
  "Hastham", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshta",
  "Moolam", "Pooradam", "Uthradam", "Thiruvonam", "Avittam", "Sadayam",
  "Poorattathi", "Uthrattathi", "Revathi"
];

const jathagamStatusConfig: Record<string, { icon: any; color: string; label: string }> = {
  generated: { icon: CheckCircle, color: "bg-success/10 text-success", label: "Generated" },
  pending: { icon: Clock, color: "bg-warning/10 text-warning", label: "Pending" },
  failed: { icon: XCircle, color: "bg-destructive/10 text-destructive", label: "Failed" },
  "not-applicable": { icon: AlertTriangle, color: "bg-muted text-muted-foreground", label: "N/A" },
};

const matchResultColors: Record<string, string> = {
  Excellent: "bg-success text-success-foreground",
  Good: "bg-primary text-primary-foreground",
  Average: "bg-warning text-warning-foreground",
  Poor: "bg-destructive text-destructive-foreground",
};

export default function HoroscopeManagement() {
  const { role } = useRole();
  const [horoscopes, setHoroscopes] = useState(initialHoroscopes);
  const [activeTab, setActiveTab] = useState("horoscopes");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewMatchDialog, setViewMatchDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<typeof horoscopeMatches[0] | null>(null);
  const [editingHoroscope, setEditingHoroscope] = useState<ProfileHoroscope | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    rasi: "", nakshatram: "", lagnam: "", dosham: "", dasa: "",
    mangalDosham: false, birthDate: "", birthTime: "", birthPlace: ""
  });

  const isAdmin = role === "admin";
  const isBranchManager = role === "branch-manager";

  // Filter based on role
  const filteredHoroscopes = horoscopes.filter(h => {
    const matchesSearch = search === "" ||
      h.profileId.toLowerCase().includes(search.toLowerCase()) ||
      h.profileName.toLowerCase().includes(search.toLowerCase()) ||
      h.rasi.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branchFilter === "all" || h.branch === branchFilter;
    // Staff sees only their branch (simulated as Chennai Central)
    const branchAccess = isAdmin || h.branch === "Chennai Central";
    return matchesSearch && matchesBranch && branchAccess;
  });

  const filteredMatches = horoscopeMatches.filter(m => {
    if (isAdmin) return true;
    return m.branch === "Chennai Central"; // Simulated branch restriction
  });

  const openEdit = (h: ProfileHoroscope) => {
    setEditingHoroscope(h);
    setForm({
      rasi: h.rasi, nakshatram: h.nakshatram, lagnam: h.lagnam,
      dosham: h.dosham, dasa: h.dasa, mangalDosham: h.mangalDosham,
      birthDate: h.birthDate, birthTime: h.birthTime, birthPlace: h.birthPlace
    });
    setEditDialogOpen(true);
  };

  const openCreate = () => {
    setEditingHoroscope(null);
    setForm({ rasi: "", nakshatram: "", lagnam: "", dosham: "", dasa: "", mangalDosham: false, birthDate: "", birthTime: "", birthPlace: "" });
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.birthDate || !form.birthTime || !form.birthPlace) {
      toast({ title: "Fill required fields", description: "DOB, Time of Birth, and Place of Birth are required", variant: "destructive" });
      return;
    }
    if (editingHoroscope) {
      setHoroscopes(prev => prev.map(h => h.profileId === editingHoroscope.profileId ? {
        ...h, ...form, lastEditedBy: isAdmin ? "Admin" : "Staff User", lastEditedAt: new Date().toLocaleString()
      } : h));
      toast({ title: "Horoscope Updated", description: `Updated horoscope for ${editingHoroscope.profileName}` });
    } else {
      toast({ title: "Horoscope Created", description: "New horoscope data saved. Jathagam generation queued." });
    }
    setEditDialogOpen(false);
  };

  const triggerJathagam = (profileId: string) => {
    setHoroscopes(prev => prev.map(h => h.profileId === profileId ? { ...h, jathagamStatus: "pending" as const } : h));
    toast({ title: "Jathagam Generation Queued", description: `PDF generation triggered for ${profileId}. Will be available shortly.` });
    // Simulate completion
    setTimeout(() => {
      setHoroscopes(prev => prev.map(h => h.profileId === profileId ? {
        ...h, jathagamStatus: "generated" as const, jathagamPdfUrl: `s3://jathagam/${profileId}.pdf`
      } : h));
      toast({ title: "Jathagam Ready", description: `PDF generated for ${profileId}` });
    }, 2000);
  };

  const renderHoroscopeChart = (rasi: string, nakshatram: string, lagnam: string) => {
    const houses = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke", "La", "", ""];
    const outerCells = [
      { label: "12" }, { label: "1" }, { label: "2" }, { label: "3" },
      { label: "11" }, { label: "4" },
      { label: "10" }, { label: "5" },
      { label: "9" }, { label: "8" }, { label: "7" }, { label: "6" },
    ];
    return (
      <div className="grid grid-cols-4 grid-rows-4 border-2 border-primary w-full max-w-[280px] mx-auto aspect-square">
        {[
          { r: 0, c: 0, label: "12" }, { r: 0, c: 1, label: "1" }, { r: 0, c: 2, label: "2" }, { r: 0, c: 3, label: "3" },
          { r: 1, c: 0, label: "11" }, { r: 1, c: 1, span: true }, { r: 1, c: 2, span: true }, { r: 1, c: 3, label: "4" },
          { r: 2, c: 0, label: "10" }, { r: 2, c: 1, span: true }, { r: 2, c: 2, span: true }, { r: 2, c: 3, label: "5" },
          { r: 3, c: 0, label: "9" }, { r: 3, c: 1, label: "8" }, { r: 3, c: 2, label: "7" }, { r: 3, c: 3, label: "6" },
        ].map((cell, i) => {
          if (cell.span) return null;
          const planet = houses[i % houses.length];
          return (
            <div key={i} className="border border-primary/30 p-0.5 flex flex-col items-center justify-center text-[10px] relative">
              <span className="absolute top-0 left-0.5 text-[8px] text-muted-foreground">{cell.label}</span>
              <span className="font-semibold text-primary">{planet}</span>
            </div>
          );
        })}
        <div className="col-start-2 col-span-2 row-start-2 row-span-2 border border-primary/30 flex items-center justify-center bg-soft/30">
          <div className="text-center px-1">
            <p className="font-bold text-primary text-[11px]">{rasi || "—"}</p>
            <p className="text-[9px] text-muted-foreground">{nakshatram || "—"}</p>
            <p className="text-[9px] text-accent font-semibold">{lagnam || "—"}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" /> Horoscope Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin ? "System-wide horoscope management — all branches" :
             isBranchManager ? "Branch horoscope management — your branch" :
             "Manage horoscopes for your branch profiles"}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Badge className="bg-primary/10 text-primary px-3 py-1">
              <Shield className="h-3 w-3 mr-1" /> Super Admin Access
            </Badge>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Horoscopes", value: horoscopes.filter(h => h.rasi).length, icon: Star, color: "text-accent" },
          { label: "Jathagam Generated", value: horoscopes.filter(h => h.jathagamStatus === "generated").length, icon: FileText, color: "text-success" },
          { label: "Pending Generation", value: horoscopes.filter(h => h.jathagamStatus === "pending").length, icon: Clock, color: "text-warning" },
          { label: "Match Calculations", value: horoscopeMatches.length, icon: Heart, color: "text-primary" },
          { label: "Mangal Dosham", value: horoscopes.filter(h => h.mangalDosham).length, icon: AlertTriangle, color: "text-destructive" },
        ].map((kpi) => (
          <Card key={kpi.label} className="shadow-elegant border-0">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-7 w-7 ${kpi.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-4" : "grid-cols-3"}`}>
          <TabsTrigger value="horoscopes" className="text-xs gap-1"><Star className="h-3 w-3" /> Horoscopes</TabsTrigger>
          <TabsTrigger value="matches" className="text-xs gap-1"><Heart className="h-3 w-3" /> Porutham Matches</TabsTrigger>
          <TabsTrigger value="jathagam" className="text-xs gap-1"><FileText className="h-3 w-3" /> Jathagam PDFs</TabsTrigger>
          {isAdmin && <TabsTrigger value="audit" className="text-xs gap-1"><Shield className="h-3 w-3" /> Audit Log</TabsTrigger>}
        </TabsList>

        {/* ══════ TAB 1: HOROSCOPE DATA ══════ */}
        <TabsContent value="horoscopes" className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Horoscope Records</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search profile, rasi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-56" />
                  </div>
                  {isAdmin && (
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                      <SelectTrigger className="w-44"><SelectValue placeholder="All Branches" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        <SelectItem value="Chennai Central">Chennai Central</SelectItem>
                        <SelectItem value="Coimbatore Main">Coimbatore Main</SelectItem>
                        <SelectItem value="Madurai Branch">Madurai Branch</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Religion</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Rasi</TableHead>
                    <TableHead>Nakshatram</TableHead>
                    <TableHead>Dosham</TableHead>
                    <TableHead>Mangal</TableHead>
                    <TableHead>Jathagam</TableHead>
                    <TableHead>Last Edited</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHoroscopes.map((h) => {
                    const jConfig = jathagamStatusConfig[h.jathagamStatus];
                    const JIcon = jConfig.icon;
                    return (
                      <TableRow key={h.profileId}>
                        <TableCell>
                          <span className="font-medium">{h.profileName}</span>
                          <br /><span className="text-xs text-muted-foreground font-mono">{h.profileId}</span>
                        </TableCell>
                        <TableCell className="text-sm">{h.branch}</TableCell>
                        <TableCell className="text-sm">{h.religion}</TableCell>
                        <TableCell className="text-sm">{h.birthDate}</TableCell>
                        <TableCell className="text-sm font-medium">{h.rasi || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-sm">{h.nakshatram || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          {h.dosham ? (
                            <Badge className={h.dosham === "No Dosham" ? "bg-success/10 text-success text-[10px]" : "bg-warning/10 text-warning text-[10px]"}>
                              {h.dosham}
                            </Badge>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell>
                          {h.mangalDosham ? (
                            <Badge variant="destructive" className="text-[10px]">Yes</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${jConfig.color} text-[10px] gap-1`}><JIcon className="h-3 w-3" /> {jConfig.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {h.lastEditedBy ? <>{h.lastEditedBy}<br/>{h.lastEditedAt}</> : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(h)} title="Edit"><Edit className="h-4 w-4" /></Button>
                            {h.religion === "Hindu" && h.rasi && (
                              <Button variant="ghost" size="icon" onClick={() => triggerJathagam(h.profileId)} title="Generate Jathagam">
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ TAB 2: PORUTHAM MATCHES ══════ */}
        <TabsContent value="matches" className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Porutham (Compatibility) Scores</CardTitle>
              <CardDescription>Horoscope compatibility calculated when two profiles show mutual interest. Score out of 10.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile 1</TableHead>
                    <TableHead>Profile 2</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Calculated At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <span className="font-medium">{m.profile1Name}</span>
                        <br /><span className="text-xs text-muted-foreground font-mono">{m.profile1Id}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{m.profile2Name}</span>
                        <br /><span className="text-xs text-muted-foreground font-mono">{m.profile2Id}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={m.totalScore * 10} className="h-2 w-16" />
                          <span className="font-bold text-sm">{m.totalScore}/10</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={matchResultColors[m.overallResult]}>{m.overallResult}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.calculatedAt}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedMatch(m); setViewMatchDialog(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ TAB 3: JATHAGAM PDFs ══════ */}
        <TabsContent value="jathagam" className="space-y-4">
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Jathagam PDF Management</CardTitle>
              <CardDescription>
                Auto-generated when Hindu profiles are created with DOB + Time + Place. Stored in S3.
                {isAdmin && " Admin can re-trigger generation or access S3 URLs."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Religion</TableHead>
                    <TableHead>Chart</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>S3 URL</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHoroscopes.filter(h => h.religion === "Hindu").map((h) => {
                    const jConfig = jathagamStatusConfig[h.jathagamStatus];
                    const JIcon = jConfig.icon;
                    return (
                      <TableRow key={h.profileId}>
                        <TableCell>
                          <span className="font-medium">{h.profileName}</span>
                          <br /><span className="text-xs text-muted-foreground font-mono">{h.profileId}</span>
                        </TableCell>
                        <TableCell className="text-sm">{h.branch}</TableCell>
                        <TableCell className="text-sm">{h.religion}</TableCell>
                        <TableCell>
                          {h.rasi ? renderHoroscopeChart(h.rasi, h.nakshatram, h.lagnam) : <span className="text-xs text-muted-foreground">No data</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${jConfig.color} text-[10px] gap-1`}><JIcon className="h-3 w-3" /> {jConfig.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono max-w-[120px] truncate">
                          {h.jathagamPdfUrl || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">{h.createdBy}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {h.jathagamPdfUrl && (
                              <Button variant="ghost" size="icon" title="Download PDF" onClick={() => toast({ title: "Download Started", description: `Downloading Jathagam PDF for ${h.profileId}` })}>
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" title="Re-generate" onClick={() => triggerJathagam(h.profileId)}>
                              <RefreshCw className="h-4 w-4" />
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
        </TabsContent>

        {/* ══════ TAB 4: AUDIT LOG (Admin only) ══════ */}
        {isAdmin && (
          <TabsContent value="audit" className="space-y-4">
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Horoscope Audit Log</CardTitle>
                <CardDescription>Immutable log of all horoscope-related changes across the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Profile ID</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {horoscopeAuditLog.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm font-mono">{log.timestamp}</TableCell>
                        <TableCell className="font-medium">{log.user}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{log.role}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{log.action}</TableCell>
                        <TableCell className="font-mono text-xs">{log.profileId}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[250px]">{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* ══════ EDIT HOROSCOPE DIALOG ══════ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              {editingHoroscope ? `Edit Horoscope — ${editingHoroscope.profileName}` : "Create Horoscope"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date of Birth *</Label>
                <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Time of Birth *</Label>
                <Input value={form.birthTime} onChange={(e) => setForm({ ...form, birthTime: e.target.value })} placeholder="e.g., 06:30 AM" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Place of Birth *</Label>
              <Input value={form.birthPlace} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} placeholder="e.g., Chennai" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Rasi (Moon Sign)</Label>
                <Select value={form.rasi} onValueChange={(v) => setForm({ ...form, rasi: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Rasi" /></SelectTrigger>
                  <SelectContent>
                    {rasiOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nakshatram (Star)</Label>
                <Select value={form.nakshatram} onValueChange={(v) => setForm({ ...form, nakshatram: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Nakshatra" /></SelectTrigger>
                  <SelectContent>
                    {nakshatraOptions.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Lagnam (Ascendant)</Label>
                <Select value={form.lagnam} onValueChange={(v) => setForm({ ...form, lagnam: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Lagnam" /></SelectTrigger>
                  <SelectContent>
                    {rasiOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Dasa (Current Period)</Label>
                <Input value={form.dasa} onChange={(e) => setForm({ ...form, dasa: e.target.value })} placeholder="e.g., Rahu Dasa" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dosham</Label>
              <Input value={form.dosham} onChange={(e) => setForm({ ...form, dosham: e.target.value })} placeholder="e.g., No Dosham, Sevvai Dosham" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.mangalDosham} onCheckedChange={(v) => setForm({ ...form, mangalDosham: v })} />
              <Label className="text-sm">Mangal Dosham (Sevvai Dosham)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingHoroscope ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ VIEW MATCH DETAIL DIALOG ══════ */}
      <Dialog open={viewMatchDialog} onOpenChange={setViewMatchDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" /> Porutham Details
            </DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div className="text-center">
                  <p className="font-bold">{selectedMatch.profile1Name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedMatch.profile1Id}</p>
                </div>
                <div className="text-center">
                  <Heart className="h-5 w-5 text-primary mx-auto" />
                  <p className="text-2xl font-bold text-primary">{selectedMatch.totalScore}/10</p>
                  <Badge className={matchResultColors[selectedMatch.overallResult]}>{selectedMatch.overallResult}</Badge>
                </div>
                <div className="text-center">
                  <p className="font-bold">{selectedMatch.profile2Name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedMatch.profile2Id}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">10 Poruthams:</p>
                {selectedMatch.poruthams.map((p) => (
                  <div key={p.name} className="flex items-center justify-between p-2 rounded border bg-card">
                    <div className="flex items-center gap-2">
                      {p.matched ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      <span className="text-sm">{p.name}</span>
                    </div>
                    <span className="text-sm font-bold">{p.score}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">Calculated: {selectedMatch.calculatedAt}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}