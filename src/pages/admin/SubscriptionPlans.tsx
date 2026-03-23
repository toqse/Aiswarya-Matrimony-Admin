import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createPlan, fetchPlans, togglePlanStatus, updatePlan, type PlanRow } from "@/lib/admin-api/plans";
import { Plus, Edit, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionPlans() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [togglePlan, setTogglePlan] = useState<PlanRow | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    duration_days: 180,
    price: 0,
    interest_limit: 0,
    contact_view_limit: 0,
    chat_limit: 0,
    horoscope_match_limit: 0,
    profile_view_limit: 0,
    horoscope: false,
    highlighted: false,
    description: "",
  });

  const { data: plans = [], isLoading, error } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: fetchPlans,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "plans"] });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.duration_days) throw new Error("Name and duration required");
      const body = {
        name: form.name,
        price: form.price,
        duration_days: form.duration_days,
        interest_limit: form.interest_limit,
        contact_view_limit: form.contact_view_limit,
        chat_limit: form.chat_limit,
        horoscope_match_limit: form.horoscope ? Math.max(form.horoscope_match_limit, 1) : 0,
        profile_view_limit: form.profile_view_limit,
        description: form.description,
        is_highlighted: form.highlighted,
        is_active: true,
      };
      if (editing) return updatePlan(editing.id, body);
      return createPlan(body);
    },
    onSuccess: () => {
      toast({ title: editing ? "Plan updated" : "Plan created" });
      setDialogOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => togglePlanStatus(id),
    onSuccess: () => {
      toast({ title: "Plan status toggled" });
      setTogglePlan(null);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      duration_days: 180,
      price: 0,
      interest_limit: 0,
      contact_view_limit: 0,
      chat_limit: 0,
      horoscope_match_limit: 0,
      profile_view_limit: 0,
      horoscope: false,
      highlighted: false,
      description: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (p: PlanRow) => {
    setEditing(p);
    setForm({
      name: p.name,
      duration_days: p.duration_days,
      price: Number(p.price),
      interest_limit: p.interest_limit,
      contact_view_limit: p.contact_view_limit,
      chat_limit: p.chat_limit,
      horoscope_match_limit: p.horoscope_match_limit,
      profile_view_limit: p.profile_view_limit,
      horoscope: p.has_horoscope,
      highlighted: p.is_highlighted,
      description: p.description ?? "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage membership plans and features</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Plan
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}
      {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}

      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle className="text-base">Feature Comparison Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Duration (days)</TableHead>
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
                  <TableCell>{p.duration_days}</TableCell>
                  <TableCell>₹{Number(p.price).toLocaleString()}</TableCell>
                  <TableCell>{p.interest_limit}</TableCell>
                  <TableCell>{p.contact_view_limit}</TableCell>
                  <TableCell>{p.has_horoscope ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                  <TableCell>{p.is_highlighted ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? "default" : "secondary"} className={p.is_active ? "bg-success text-success-foreground" : ""}>
                      {p.is_active ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setTogglePlan(p)} className="text-xs" disabled={toggleMut.isPending}>
                        Toggle
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Plan" : "Add Plan"}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[72vh] overflow-y-auto pr-1">
            <div className="space-y-6 py-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Plan name</Label>
                  <Input
                    id="plan-name"
                    placeholder="e.g. Gold Plus"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-description">Description</Label>
                  <Input
                    id="plan-description"
                    placeholder="Short plan description"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(
                  [
                    ["Duration (days)", "duration_days"],
                    ["Price (₹)", "price"],
                    ["Interest limit", "interest_limit"],
                    ["Contact view limit", "contact_view_limit"],
                    ["Chat limit", "chat_limit"],
                    ["Profile view limit", "profile_view_limit"],
                    ["Horoscope match limit", "horoscope_match_limit"],
                  ] as const
                ).map(([label, key]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`plan-${key}`}>{label}</Label>
                    <Input
                      id={`plan-${key}`}
                      type="number"
                      min={0}
                      value={(form as never)[key] as number}
                      disabled={key === "horoscope_match_limit" && !form.horoscope}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          [key]: Number(e.target.value || 0),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md border p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Enable horoscope</p>
                    <p className="text-xs text-muted-foreground">Turns on horoscope matching for this plan.</p>
                  </div>
                  <Switch
                    checked={form.horoscope}
                    onCheckedChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        horoscope: v,
                        horoscope_match_limit: v ? Math.max(f.horoscope_match_limit, 1) : 0,
                      }))
                    }
                  />
                </div>
                <div className="rounded-md border p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Highlighted plan</p>
                    <p className="text-xs text-muted-foreground">Show this as a featured plan in listings.</p>
                  </div>
                  <Switch checked={form.highlighted} onCheckedChange={(v) => setForm((f) => ({ ...f, highlighted: v }))} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={togglePlan != null} onOpenChange={(o) => !o && setTogglePlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{togglePlan?.is_active ? "Deactivate plan?" : "Activate plan?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {togglePlan
                ? `This will mark "${togglePlan.name}" as ${togglePlan.is_active ? "inactive" : "active"}.`
                : "Are you sure you want to toggle this plan status?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => togglePlan?.id != null && toggleMut.mutate(togglePlan.id)}
              disabled={toggleMut.isPending}
            >
              {toggleMut.isPending ? "Please wait..." : togglePlan?.is_active ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
