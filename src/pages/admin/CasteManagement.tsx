import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CasteItem {
  id: number;
  name: string;
}

const initialData: CasteItem[] = [
  { id: 1, name: "Nair" },
  { id: 2, name: "Ezhava" },
  { id: 3, name: "Brahmin" },
  { id: 4, name: "Thiyya" },
  { id: 5, name: "Menon" },
  { id: 6, name: "Pillai" },
];

export default function CasteManagement() {
  const [items, setItems] = useState<CasteItem[]>(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CasteItem | null>(null);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const openAdd = () => { setEditItem(null); setName(""); setDialogOpen(true); };
  const openEdit = (item: CasteItem) => { setEditItem(item); setName(item.name); setDialogOpen(true); };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (editItem) {
      setItems(items.map(i => i.id === editItem.id ? { ...i, name: name.trim() } : i));
      toast.success("Caste updated successfully");
    } else {
      setItems([...items, { id: Date.now(), name: name.trim() }]);
      toast.success("Caste added successfully");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setItems(items.filter(i => i.id !== id));
    toast.success("Caste deleted successfully");
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Caste Management</h1>
          <p className="text-muted-foreground">Manage caste categories for profiles</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Caste</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Castes ({filtered.length})</CardTitle>
            <Input placeholder="Search caste..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Caste Name</TableHead>
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
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No castes found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Caste" : "Add Caste"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Enter caste name" value={name} onChange={e => setName(e.target.value)} />
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
