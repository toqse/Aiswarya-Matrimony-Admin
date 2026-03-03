import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { profiles as initialProfiles } from "@/data/mockData";
import {
  Search, Plus, Eye, Edit, RefreshCw, Heart, Mail, StickyNote,
  UserCheck, UserX, AlertTriangle, Users, CreditCard, CheckCircle2, XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddProfileWizard from "@/components/profile/AddProfileWizard";

const statusFilters = ["All", "Incomplete", "Complete", "Subscribed", "Unsubscribed", "Verified", "Unverified"];

export default function MyProfiles() {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewProfile, setViewProfile] = useState<typeof profiles[0] | null>(null);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfile, setEditProfile] = useState<typeof profiles[0] | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteTarget, setNoteTarget] = useState<string>("");
  const [noteText, setNoteText] = useState("");
  const { toast } = useToast();

  const filtered = profiles.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    if (statusFilter === "All") return matchSearch;
    if (statusFilter === "Incomplete") return matchSearch && p.completeness < 80;
    if (statusFilter === "Complete") return matchSearch && p.completeness >= 80;
    if (statusFilter === "Subscribed") return matchSearch && p.subscription !== "None";
    if (statusFilter === "Unsubscribed") return matchSearch && p.subscription === "None";
    if (statusFilter === "Verified") return matchSearch && p.verified;
    if (statusFilter === "Unverified") return matchSearch && !p.verified;
    return matchSearch;
  });

  // Expiring within 7 days highlight
  const expiringProfiles = profiles.filter(p => p.subscription !== "None" && p.completeness < 80);

  const addNewProfile = (profileData: any) => {
    const id = `AMP${String(profiles.length + 1).padStart(3, "0")}`;
    setProfiles([...profiles, { id, ...profileData }]);
    setShowAddProfile(false);
    toast({ title: "Profile Created", description: `${profileData.name} added as ${id}` });
  };

  const saveEditProfile = () => {
    if (!editProfile) return;
    setProfiles(profiles.map(p => p.id === editProfile.id ? editProfile : p));
    setShowEditProfile(false);
    toast({ title: "Profile Updated", description: `${editProfile.name} saved successfully` });
  };

  const addNote = () => {
    toast({ title: "Note Added", description: `Note added to ${noteTarget}` });
    setShowNoteDialog(false);
    setNoteText("");
  };

  const sendEmail = (name: string) => {
    toast({ title: "Email Sent", description: `Email sent to ${name}` });
  };

  const kpis = [
    { label: "Total Profiles", value: profiles.length, icon: Users, color: "text-primary" },
    { label: "Verified", value: profiles.filter(p => p.verified).length, icon: CheckCircle2, color: "text-success" },
    { label: "Unverified", value: profiles.filter(p => !p.verified).length, icon: XCircle, color: "text-warning" },
    { label: "Subscribed", value: profiles.filter(p => p.subscription !== "None").length, icon: CreditCard, color: "text-info" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profiles</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage profiles created or assigned to you</p>
        </div>
        <Button onClick={() => setShowAddProfile(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4" /> Add New Profile
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
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

      {/* Subscription Alert */}
      {expiringProfiles.length > 0 && (
        <Card className="border-l-4 border-l-warning bg-warning/5 shadow-elegant border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="font-semibold text-sm text-warning">Subscription Alert</p>
              <p className="text-xs text-muted-foreground">{expiringProfiles.length} profile(s) with incomplete data need attention — highlighted below</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {statusFilters.map((f) => (
                <Button key={f} variant={statusFilter === f ? "default" : "outline"} size="sm"
                  onClick={() => setStatusFilter(f)} className="text-xs">
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profile ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Religion / Caste</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completeness</TableHead>
                <TableHead>Quick Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className={p.completeness < 50 ? "bg-warning/5" : ""}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.gender}</TableCell>
                  <TableCell>{p.age}</TableCell>
                  <TableCell className="text-sm">{p.religion} / {p.caste}</TableCell>
                  <TableCell>
                    <Badge variant={p.subscription === "None" ? "outline" : "default"}
                      className={p.subscription !== "None" ? "bg-accent text-accent-foreground" : ""}>
                      {p.subscription}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.verified ? (
                      <Badge className="bg-success text-success-foreground gap-1"><UserCheck className="h-3 w-3" /> Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground gap-1"><UserX className="h-3 w-3" /> Unverified</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress value={p.completeness} className="h-2 flex-1" />
                      <span className="text-xs font-medium text-muted-foreground">{p.completeness}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-500/10" title="Edit Profile"
                        onClick={() => { setEditProfile(p); setShowEditProfile(true); }}>
                        <Edit className="h-3.5 w-3.5 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-violet-500/10" title="View Profile"
                        onClick={() => setViewProfile(p)}>
                        <Eye className="h-3.5 w-3.5 text-violet-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-500/10" title="Renew Subscription"
                        onClick={() => toast({ title: "Renewal", description: `Renewal initiated for ${p.name}` })}>
                        <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-pink-500/10" title="View Matches"
                        onClick={() => toast({ title: "Matches", description: `Viewing matches for ${p.name}` })}>
                        <Heart className="h-3.5 w-3.5 text-pink-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-amber-500/10" title="Send Email"
                        onClick={() => sendEmail(p.name)}>
                        <Mail className="h-3.5 w-3.5 text-amber-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-teal-500/10" title="Add Note"
                        onClick={() => { setNoteTarget(p.name); setShowNoteDialog(true); }}>
                        <StickyNote className="h-3.5 w-3.5 text-teal-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Profile Dialog */}
      <Dialog open={!!viewProfile} onOpenChange={() => setViewProfile(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Profile Details — {viewProfile?.name}</DialogTitle></DialogHeader>
          {viewProfile && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground">Profile ID</Label><p className="font-mono">{viewProfile.id}</p></div>
                <div><Label className="text-muted-foreground">Gender</Label><p>{viewProfile.gender}</p></div>
                <div><Label className="text-muted-foreground">Age</Label><p>{viewProfile.age}</p></div>
                <div><Label className="text-muted-foreground">Religion</Label><p>{viewProfile.religion}</p></div>
                <div><Label className="text-muted-foreground">Caste</Label><p>{viewProfile.caste}</p></div>
                <div><Label className="text-muted-foreground">Marital Status</Label><p>{viewProfile.maritalStatus}</p></div>
                <div><Label className="text-muted-foreground">Subscription</Label><p>{viewProfile.subscription}</p></div>
                <div><Label className="text-muted-foreground">Verified</Label><p>{viewProfile.verified ? "Yes" : "No"}</p></div>
              </div>
              <div>
                <Label className="text-muted-foreground">Completeness</Label>
                <Progress value={viewProfile.completeness} className="mt-1" />
                <p className="text-xs text-right mt-1">{viewProfile.completeness}%</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Profile Wizard */}
      <AddProfileWizard open={showAddProfile} onOpenChange={setShowAddProfile} onComplete={addNewProfile} />

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Profile — {editProfile?.id}</DialogTitle></DialogHeader>
          {editProfile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Full Name</Label>
                  <Input value={editProfile.name} onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })} />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input type="number" value={editProfile.age} onChange={(e) => setEditProfile({ ...editProfile, age: parseInt(e.target.value) || 25 })} />
                </div>
                <div>
                  <Label>Caste</Label>
                  <Input value={editProfile.caste} onChange={(e) => setEditProfile({ ...editProfile, caste: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProfile(false)}>Cancel</Button>
            <Button onClick={saveEditProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Note — {noteTarget}</DialogTitle></DialogHeader>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Enter your note..." rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>Cancel</Button>
            <Button onClick={addNote} disabled={!noteText}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
