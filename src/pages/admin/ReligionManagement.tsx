import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ReligionItem {
  id: number;
  name: string;
}

const initialData: ReligionItem[] = [
  { id: 1, name: "Hindu" },
  { id: 2, name: "Muslim" },
  { id: 3, name: "Christian" },
  { id: 4, name: "Sikh" },
  { id: 5, name: "Buddhist" },
  { id: 6, name: "Jain" },
];

export default function ReligionManagement() {
  const [items, setItems] = useState<ReligionItem[]>(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ReligionItem | null>(null);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const openAdd = () => { setEditItem(null); setName(""); setDialogOpen(true); };
  const openEdit = (item: ReligionItem) => { setEditItem(item); setName(item.name); setDialogOpen(true); };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (editItem) {
      setItems(items.map(i => i.id === editItem.id ? { ...i, name: name.trim() } : i));
      toast.success("Religion updated successfully");
    } else {
      setItems([...items, { id: Date.now(), name: name.trim() }]);
      toast.success("Religion added successfully");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setItems(items.filter(i => i.id !== id));
    toast.success("Religion deleted successfully");
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Religion Management</h1>
          <p className="text-muted-foreground">Manage religion categories for profiles</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Religion</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Religions ({filtered.length})</CardTitle>
            <Input placeholder="Search religion..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Religion Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No religions found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Religion" : "Add Religion"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Enter religion name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editItem ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
