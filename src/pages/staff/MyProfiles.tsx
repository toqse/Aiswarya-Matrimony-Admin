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
import { profiles as initialProfiles, subscriptionPlans } from "@/data/mockData";
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
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [renewTarget, setRenewTarget] = useState<typeof profiles[0] | null>(null);
  const [renewPlan, setRenewPlan] = useState("");
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [matchTarget, setMatchTarget] = useState<typeof profiles[0] | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTarget, setEmailTarget] = useState<typeof profiles[0] | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
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

  const handleRenew = () => {
    if (!renewTarget || !renewPlan) return;
    const plan = subscriptionPlans.find(p => p.name === renewPlan);
    setProfiles(profiles.map(p => p.id === renewTarget.id ? { ...p, subscription: renewPlan } : p));
    setShowRenewDialog(false);
    setRenewPlan("");
    toast({ title: "Subscription Renewed", description: `${renewTarget.name} upgraded to ${renewPlan} plan (₹${plan?.price || 0})` });
  };

  const getMatches = (profile: typeof profiles[0]) => {
    return profiles.filter(p =>
      p.id !== profile.id &&
      p.gender !== profile.gender &&
      p.religion === profile.religion
    );
  };

  const handleSendEmail = () => {
    if (!emailTarget || !emailSubject) return;
    toast({ title: "Email Sent", description: `Email "${emailSubject}" sent to ${emailTarget.name}` });
    setShowEmailDialog(false);
    setEmailSubject("");
    setEmailBody("");
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
                        onClick={() => { setRenewTarget(p); setRenewPlan(p.subscription !== "None" ? p.subscription : ""); setShowRenewDialog(true); }}>
                        <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-pink-500/10" title="View Matches"
                        onClick={() => { setMatchTarget(p); setShowMatchDialog(true); }}>
                        <Heart className="h-3.5 w-3.5 text-pink-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-amber-500/10" title="Send Email"
                        onClick={() => { setEmailTarget(p); setShowEmailDialog(true); }}>
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
                <div><Label className="text-muted-foreground">Subscription</Label>
                  <Badge variant={viewProfile.subscription === "None" ? "outline" : "default"}
                    className={viewProfile.subscription !== "None" ? "bg-accent text-accent-foreground" : ""}>
                    {viewProfile.subscription}
                  </Badge>
                </div>
                <div><Label className="text-muted-foreground">Verified</Label>
                  {viewProfile.verified ? (
                    <Badge className="bg-success text-success-foreground gap-1"><UserCheck className="h-3 w-3" /> Yes</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground gap-1"><UserX className="h-3 w-3" /> No</Badge>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Completeness</Label>
                <Progress value={viewProfile.completeness} className="mt-1" />
                <p className="text-xs text-right mt-1">{viewProfile.completeness}%</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => { setViewProfile(null); setEditProfile(viewProfile); setShowEditProfile(true); }}>
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setViewProfile(null); setRenewTarget(viewProfile); setShowRenewDialog(true); }}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Renew
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setViewProfile(null); setMatchTarget(viewProfile); setShowMatchDialog(true); }}>
                  <Heart className="h-3.5 w-3.5 mr-1" /> Matches
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Profile Wizard */}
      <AddProfileWizard open={showAddProfile} onOpenChange={setShowAddProfile} onComplete={addNewProfile} />

      {/* Edit Profile Dialog — Full Fields */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Profile — {editProfile?.id}</DialogTitle></DialogHeader>
          {editProfile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Full Name</Label>
                  <Input value={editProfile.name} onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={editProfile.gender} onValueChange={(v) => setEditProfile({ ...editProfile, gender: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Age</Label>
                  <Input type="number" value={editProfile.age} onChange={(e) => setEditProfile({ ...editProfile, age: parseInt(e.target.value) || 25 })} />
                </div>
                <div>
                  <Label>Religion</Label>
                  <Select value={editProfile.religion} onValueChange={(v) => setEditProfile({ ...editProfile, religion: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Hindu", "Christian", "Muslim", "Jain", "Sikh", "Buddhist", "Parsi"].map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Caste</Label>
                  <Input value={editProfile.caste} onChange={(e) => setEditProfile({ ...editProfile, caste: e.target.value })} />
                </div>
                <div>
                  <Label>Marital Status</Label>
                  <Select value={editProfile.maritalStatus} onValueChange={(v) => setEditProfile({ ...editProfile, maritalStatus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Never Married">Never Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                      <SelectItem value="Awaiting Divorce">Awaiting Divorce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subscription</Label>
                  <Select value={editProfile.subscription} onValueChange={(v) => setEditProfile({ ...editProfile, subscription: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      {subscriptionPlans.filter(p => p.status === "active").map(p => (
                        <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Verified</Label>
                  <Button size="sm" variant={editProfile.verified ? "default" : "outline"}
                    onClick={() => setEditProfile({ ...editProfile, verified: !editProfile.verified })}>
                    {editProfile.verified ? "✓ Verified" : "Mark Verified"}
                  </Button>
                </div>
                <div className="col-span-2">
                  <Label>Profile Completeness (%)</Label>
                  <Input type="number" min={0} max={100} value={editProfile.completeness}
                    onChange={(e) => setEditProfile({ ...editProfile, completeness: Math.min(100, parseInt(e.target.value) || 0) })} />
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

      {/* Renew Subscription Dialog */}
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Renew Subscription — {renewTarget?.name}</DialogTitle></DialogHeader>
          {renewTarget && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs">Current Plan</Label>
                <p className="font-semibold">{renewTarget.subscription === "None" ? "No active plan" : renewTarget.subscription}</p>
              </div>
              <div>
                <Label>Select New Plan</Label>
                <Select value={renewPlan} onValueChange={setRenewPlan}>
                  <SelectTrigger><SelectValue placeholder="Choose a plan" /></SelectTrigger>
                  <SelectContent>
                    {subscriptionPlans.filter(p => p.status === "active").map(p => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name} — ₹{p.price.toLocaleString()} ({p.duration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {renewPlan && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3 text-sm space-y-1">
                    {(() => {
                      const plan = subscriptionPlans.find(p => p.name === renewPlan);
                      return plan ? (
                        <>
                          <p><span className="text-muted-foreground">Plan:</span> <strong>{plan.name}</strong></p>
                          <p><span className="text-muted-foreground">Duration:</span> {plan.duration}</p>
                          <p><span className="text-muted-foreground">Price:</span> <strong>₹{plan.price.toLocaleString()}</strong></p>
                          <p><span className="text-muted-foreground">Interests:</span> {plan.interests === -1 ? "Unlimited" : plan.interests}</p>
                          <p><span className="text-muted-foreground">Contact Views:</span> {plan.contactViews === -1 ? "Unlimited" : plan.contactViews}</p>
                        </>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenewDialog(false)}>Cancel</Button>
            <Button onClick={handleRenew} disabled={!renewPlan} className="bg-emerald-600 hover:bg-emerald-700 text-white">Confirm Renewal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Match Viewer Dialog */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Matches for {matchTarget?.name}</DialogTitle></DialogHeader>
          {matchTarget && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Showing compatible profiles (opposite gender, same religion)</p>
              {getMatches(matchTarget).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No matches found for the current criteria.</p>
              ) : (
                getMatches(matchTarget).map(m => (
                  <Card key={m.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                          <Heart className="h-4 w-4 text-pink-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.age}y · {m.religion} / {m.caste} · {m.maritalStatus}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={m.verified ? "default" : "outline"} className={m.verified ? "bg-success text-success-foreground" : ""}>
                          {m.verified ? "Verified" : "Unverified"}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => { setShowMatchDialog(false); setViewProfile(m); }}>
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Send Email to {emailTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject *</Label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Enter email subject..." />
            </div>
            <div>
              <Label>Quick Templates</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  { label: "Profile Incomplete", subj: "Please Complete Your Profile", body: "Dear {name},\n\nWe noticed your profile is incomplete. Please log in and update your details to improve your match rate.\n\nBest Regards,\nAiswarya Matrimony" },
                  { label: "Subscription Reminder", subj: "Subscription Renewal Reminder", body: "Dear {name},\n\nYour subscription is expiring soon. Renew now to continue receiving match suggestions.\n\nBest Regards,\nAiswarya Matrimony" },
                  { label: "New Match", subj: "You Have a New Match!", body: "Dear {name},\n\nGreat news! We found a potential match for you. Log in to view the profile.\n\nBest Regards,\nAiswarya Matrimony" },
                ].map(t => (
                  <Button key={t.label} size="sm" variant="outline" className="text-xs"
                    onClick={() => { setEmailSubject(t.subj); setEmailBody(t.body.replace("{name}", emailTarget?.name || "")); }}>
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Type your message..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={!emailSubject} className="bg-amber-600 hover:bg-amber-700 text-white gap-1">
              <Mail className="h-3.5 w-3.5" /> Send Email
            </Button>
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
