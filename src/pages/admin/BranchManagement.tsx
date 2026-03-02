import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { branches as initialBranches, Branch } from "@/data/mockData";
import { Plus, Edit, Building2, Users, IndianRupee, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", code: "", city: "", state: "Tamil Nadu", phone: "", email: "", status: "active" as "active" | "inactive" });

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) || b.city.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm({ name: "", code: "", city: "", state: "Tamil Nadu", phone: "", email: "", status: "active" }); setDialogOpen(true); };
  const openEdit = (b: Branch) => { setEditing(b); setForm({ name: b.name, code: b.code, city: b.city, state: b.state, phone: b.phone, email: b.email, status: b.status }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.code || !form.city || !form.email) {
      toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (editing) {
      setBranches((prev) => prev.map((b) => b.id === editing.id ? { ...b, ...form } : b));
      toast({ title: "Branch Updated", description: `${form.name} has been updated` });
    } else {
      setBranches((prev) => [...prev, { ...form, id: Date.now(), profiles: 0, revenue: 0, staff: 0 }]);
      toast({ title: "Branch Created", description: `${form.name} has been added` });
    }
    setDialogOpen(false);
  };

  const toggleStatus = (id: number) => {
    setBranches((prev) => prev.map((b) => b.id === id ? { ...b, status: b.status === "active" ? "inactive" as const : "active" as const } : b));
    toast({ title: "Status Updated" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branch Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all branches across the organization</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add Branch</Button>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Branches", value: branches.length, icon: Building2, color: "text-primary" },
          { label: "Total Staff", value: branches.reduce((s, b) => s + b.staff, 0), icon: Users, color: "text-accent" },
          { label: "Total Revenue", value: `₹${(branches.reduce((s, b) => s + b.revenue, 0) / 100000).toFixed(1)}L`, icon: IndianRupee, color: "text-success" },
        ].map((c) => (
          <Card key={c.label} className="shadow-elegant border-0">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Table */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search branches..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Profiles</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{b.code}</TableCell>
                  <TableCell>{b.city}</TableCell>
                  <TableCell>{b.phone}</TableCell>
                  <TableCell>{b.email}</TableCell>
                  <TableCell>{b.profiles.toLocaleString()}</TableCell>
                  <TableCell>₹{(b.revenue / 100000).toFixed(1)}L</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "active" ? "default" : "secondary"} className={b.status === "active" ? "bg-success text-success-foreground" : ""}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(b.id)} className="text-xs">
                        {b.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Branch" : "Add New Branch"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {[
              { label: "Branch Name", key: "name" },
              { label: "Code", key: "code" },
              { label: "City", key: "city" },
              { label: "State", key: "state" },
              { label: "Phone", key: "phone" },
              { label: "Email", key: "email" },
            ].map((f) => (
              <div key={f.key} className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{f.label}</Label>
                <Input className="col-span-3" value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
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
