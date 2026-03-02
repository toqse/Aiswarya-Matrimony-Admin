import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { profiles as initialProfiles, profileHoroscopes } from "@/data/mockData";
import { Search, Eye, Trash2, Shield, ShieldOff, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function ProfileAdmin() {
  const [profs, setProfs] = useState(initialProfiles);
  const [search, setSearch] = useState("");
  const [viewProfile, setViewProfile] = useState<typeof initialProfiles[0] | null>(null);
  const [viewTab, setViewTab] = useState("details");
  const { toast } = useToast();

  const filtered = profs.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
  );

  const toggleVerify = (id: string) => {
    setProfs((prev) => prev.map((p) => p.id === id ? { ...p, verified: !p.verified } : p));
    toast({ title: "Verification toggled" });
  };

  const deleteProfile = (id: string) => {
    setProfs((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Profile deleted" });
  };

  const getHoroscope = (profileId: string) => profileHoroscopes.find(h => h.profileId === profileId);

  // Horoscope chart grid (South Indian style)
  const renderHoroscopeChart = (horoscope: typeof profileHoroscopes[0]) => {
    const houses = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke", "La", "", ""];
    return (
      <div className="grid grid-cols-4 grid-rows-4 border-2 border-primary w-full max-w-[320px] mx-auto aspect-square">
        {/* South Indian horoscope chart layout */}
        {[
          { r: 0, c: 0, label: "12" }, { r: 0, c: 1, label: "1" }, { r: 0, c: 2, label: "2" }, { r: 0, c: 3, label: "3" },
          { r: 1, c: 0, label: "11" }, { r: 1, c: 1, label: "", span: true }, { r: 1, c: 2, label: "", span: true }, { r: 1, c: 3, label: "4" },
          { r: 2, c: 0, label: "10" }, { r: 2, c: 1, label: "", span: true }, { r: 2, c: 2, label: "", span: true }, { r: 2, c: 3, label: "5" },
          { r: 3, c: 0, label: "9" }, { r: 3, c: 1, label: "8" }, { r: 3, c: 2, label: "7" }, { r: 3, c: 3, label: "6" },
        ].map((cell, i) => {
          if (cell.span) return null;
          const planet = houses[i % houses.length];
          return (
            <div key={i} className="border border-primary/30 p-1 flex flex-col items-center justify-center text-xs relative">
              <span className="absolute top-0.5 left-1 text-[9px] text-muted-foreground">{cell.label}</span>
              <span className="font-semibold text-primary text-[11px]">{planet}</span>
            </div>
          );
        })}
        {/* Center area */}
        <div className="col-start-2 col-span-2 row-start-2 row-span-2 border border-primary/30 flex items-center justify-center bg-soft/30">
          <div className="text-center">
            <p className="font-bold text-primary text-sm">{horoscope.rasi}</p>
            <p className="text-[10px] text-muted-foreground">{horoscope.nakshatram}</p>
            <p className="text-[10px] text-accent font-semibold">{horoscope.lagnam}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile Administration</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage matrimony profiles across the platform</p>
        </div>
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                <TableHead>Religion</TableHead>
                <TableHead>Caste</TableHead>
                <TableHead>Marital Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Complete</TableHead>
                <TableHead>Horoscope</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const hasHoroscope = !!getHoroscope(p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.gender}</TableCell>
                    <TableCell>{p.age}</TableCell>
                    <TableCell>{p.religion}</TableCell>
                    <TableCell>{p.caste}</TableCell>
                    <TableCell>{p.maritalStatus}</TableCell>
                    <TableCell><Badge variant="outline">{p.subscription}</Badge></TableCell>
                    <TableCell>
                      {p.verified ? <Badge className="bg-success text-success-foreground">Verified</Badge> : <Badge variant="secondary">Unverified</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={p.completeness} className="h-2 w-14" />
                        <span className="text-xs">{p.completeness}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {hasHoroscope ? (
                        <Badge className="bg-accent/20 text-accent-foreground text-[10px] gap-1"><Star className="h-3 w-3" />Available</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setViewProfile(p); setViewTab("details"); }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleVerify(p.id)}>
                          {p.verified ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone. Profile {p.id} will be permanently deleted.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteProfile(p.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Profile Dialog with Horoscope */}
      <Dialog open={!!viewProfile} onOpenChange={() => setViewProfile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Profile Details — {viewProfile?.id}</DialogTitle></DialogHeader>
          {viewProfile && (
            <Tabs value={viewTab} onValueChange={setViewTab}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="details">Profile Details</TabsTrigger>
                <TabsTrigger value="horoscope" className="gap-1"><Star className="h-3 w-3" /> Horoscope</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <div className="grid gap-3 text-sm mt-3">
                  {Object.entries({
                    Name: viewProfile.name, Gender: viewProfile.gender, Age: viewProfile.age,
                    Religion: viewProfile.religion, Caste: viewProfile.caste, "Marital Status": viewProfile.maritalStatus,
                    Subscription: viewProfile.subscription, Verified: viewProfile.verified ? "Yes" : "No",
                    Completeness: `${viewProfile.completeness}%`
                  }).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-border/50 pb-1">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="horoscope">
                {(() => {
                  const horoscope = getHoroscope(viewProfile.id);
                  if (!horoscope) {
                    return <p className="text-center text-muted-foreground py-8">No horoscope data available for this profile.</p>;
                  }
                  return (
                    <div className="space-y-4 mt-3">
                      {/* Birth Details */}
                      <Card className="border">
                        <CardContent className="pt-4 pb-3">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div><p className="text-muted-foreground text-xs">Date of Birth</p><p className="font-semibold">{horoscope.birthDate}</p></div>
                            <div><p className="text-muted-foreground text-xs">Time of Birth</p><p className="font-semibold">{horoscope.birthTime}</p></div>
                            <div><p className="text-muted-foreground text-xs">Place of Birth</p><p className="font-semibold">{horoscope.birthPlace}</p></div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Horoscope Chart */}
                      <div className="flex justify-center">
                        {renderHoroscopeChart(horoscope)}
                      </div>

                      {/* Horoscope Details */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                          { label: "Rasi (Moon Sign)", value: horoscope.rasi },
                          { label: "Nakshatram (Star)", value: horoscope.nakshatram },
                          { label: "Lagnam (Ascendant)", value: horoscope.lagnam },
                          { label: "Dosham", value: horoscope.dosham },
                          { label: "Dasa (Current)", value: horoscope.dasa },
                        ].map((item) => (
                          <div key={item.label} className="p-3 rounded-lg border bg-card">
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                            <p className="font-semibold mt-0.5">{item.value}</p>
                          </div>
                        ))}
                        <div className="p-3 rounded-lg border bg-card">
                          <p className="text-xs text-muted-foreground">Dosham Status</p>
                          <Badge className={horoscope.dosham === "No Dosham" ? "bg-success/10 text-success mt-1" : "bg-warning/10 text-warning mt-1"}>
                            {horoscope.dosham}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}