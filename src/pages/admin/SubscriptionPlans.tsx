import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { subscriptionPlans as initialPlans } from "@/data/mockData";
import { Plus, Edit, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState(initialPlans);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<typeof initialPlans[0] | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", duration: "", price: 0, interests: 0, contactViews: 0, horoscope: false, highlighted: false });

  const openAdd = () => { setEditing(null); setForm({ name: "", duration: "", price: 0, interests: 0, contactViews: 0, horoscope: false, highlighted: false }); setDialogOpen(true); };
  const openEdit = (p: typeof initialPlans[0]) => { setEditing(p); setForm({ name: p.name, duration: p.duration, price: p.price, interests: p.interests, contactViews: p.contactViews, horoscope: p.horoscope, highlighted: p.highlighted }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.duration) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    if (editing) {
      setPlans((prev) => prev.map((p) => p.id === editing.id ? { ...p, ...form } : p));
      toast({ title: "Plan Updated" });
    } else {
      setPlans((prev) => [...prev, { ...form, id: Date.now(), status: "active" as const }]);
      toast({ title: "Plan Created" });
    }
    setDialogOpen(false);
  };

  const togglePlan = (id: number) => {
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, status: p.status === "active" ? "inactive" as const : "active" as const } : p));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage membership plans and features</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add Plan</Button>
      </div>

      {/* Feature Comparison */}
      <Card className="shadow-elegant border-0">
        <CardHeader><CardTitle className="text-base">Feature Comparison Matrix</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Interests</TableHead>
                <TableHead>Contact Views</TableHead>
                <TableHead>Horoscope</TableHead>
                <TableHead>Highlighted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold">{p.name}</TableCell>
                  <TableCell>{p.duration}</TableCell>
                  <TableCell>₹{p.price.toLocaleString()}</TableCell>
                  <TableCell>{p.interests === -1 ? "Unlimited" : p.interests}</TableCell>
                  <TableCell>{p.contactViews === -1 ? "Unlimited" : p.contactViews}</TableCell>
                  <TableCell>{p.horoscope ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                  <TableCell>{p.highlighted ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "active" ? "default" : "secondary"} className={p.status === "active" ? "bg-success text-success-foreground" : ""}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => togglePlan(p.id)} className="text-xs">{p.status === "active" ? "Deactivate" : "Activate"}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Plan" : "Add Plan"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input className="col-span-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Duration</Label>
              <Input className="col-span-3" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Price (₹)</Label>
              <Input className="col-span-3" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Interests</Label>
              <Input className="col-span-3" type="number" value={form.interests} onChange={(e) => setForm({ ...form, interests: +e.target.value })} placeholder="-1 for unlimited" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Contact Views</Label>
              <Input className="col-span-3" type="number" value={form.contactViews} onChange={(e) => setForm({ ...form, contactViews: +e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Horoscope</Label>
              <Switch checked={form.horoscope} onCheckedChange={(v) => setForm({ ...form, horoscope: v })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Highlighted</Label>
              <Switch checked={form.highlighted} onCheckedChange={(v) => setForm({ ...form, highlighted: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
