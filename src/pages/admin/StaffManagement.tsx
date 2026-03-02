import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { staffMembers as initialStaff, branches } from "@/data/mockData";
import { Plus, Edit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StaffManagement() {
  const [staff, setStaff] = useState(initialStaff);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<typeof initialStaff[0] | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", empCode: "", branch: "", designation: "", salary: 0, commissionRate: 0, target: 0 });

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.branch.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm({ name: "", empCode: "", branch: "", designation: "", salary: 0, commissionRate: 0, target: 0 }); setDialogOpen(true); };
  const openEdit = (s: typeof initialStaff[0]) => { setEditing(s); setForm({ name: s.name, empCode: s.empCode, branch: s.branch, designation: s.designation, salary: s.salary, commissionRate: s.commissionRate, target: s.target }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.empCode || !form.branch) {
      toast({ title: "Validation Error", description: "Fill all required fields", variant: "destructive" });
      return;
    }
    if (editing) {
      setStaff((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...form } : s));
      toast({ title: "Staff Updated", description: `${form.name} updated` });
    } else {
      setStaff((prev) => [...prev, { ...form, id: Date.now(), achieved: 0, status: "active" as const }]);
      toast({ title: "Staff Added", description: `${form.name} has been added` });
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage consultants and their performance</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add Staff</Button>
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emp Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Commission %</TableHead>
                <TableHead>Target Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.empCode}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.branch}</TableCell>
                  <TableCell>{s.designation}</TableCell>
                  <TableCell>₹{s.salary.toLocaleString()}</TableCell>
                  <TableCell>{s.commissionRate}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={(s.achieved / s.target) * 100} className="h-2 w-20" />
                      <span className="text-xs text-muted-foreground">{s.achieved}/{s.target}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === "active" ? "default" : "secondary"} className={s.status === "active" ? "bg-success text-success-foreground" : ""}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Staff" : "Add Staff"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input className="col-span-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Emp Code</Label>
              <Input className="col-span-3" value={form.empCode} onChange={(e) => setForm({ ...form, empCode: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Branch</Label>
              <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Designation</Label>
              <Input className="col-span-3" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Salary</Label>
              <Input className="col-span-3" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: +e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Commission %</Label>
              <Input className="col-span-3" type="number" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: +e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Target</Label>
              <Input className="col-span-3" type="number" value={form.target} onChange={(e) => setForm({ ...form, target: +e.target.value })} />
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
