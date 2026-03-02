import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { profiles as initialProfiles } from "@/data/mockData";
import { Search, Eye, Edit, Trash2, Shield, ShieldOff, Merge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function ProfileAdmin() {
  const [profs, setProfs] = useState(initialProfiles);
  const [search, setSearch] = useState("");
  const [viewProfile, setViewProfile] = useState<typeof initialProfiles[0] | null>(null);
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
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
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewProfile(p)}><Eye className="h-4 w-4" /></Button>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Profile Dialog */}
      <Dialog open={!!viewProfile} onOpenChange={() => setViewProfile(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Profile Details — {viewProfile?.id}</DialogTitle></DialogHeader>
          {viewProfile && (
            <div className="grid gap-3 text-sm">
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
