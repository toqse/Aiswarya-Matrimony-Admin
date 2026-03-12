import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MotherTongueItem {
  id: number;
  name: string;
}

const initialData: MotherTongueItem[] = [
  { id: 1, name: "Malayalam" },
  { id: 2, name: "Tamil" },
  { id: 3, name: "Kannada" },
  { id: 4, name: "Telugu" },
  { id: 5, name: "Hindi" },
  { id: 6, name: "English" },
];

export default function MotherTongueManagement() {
  const [items, setItems] = useState<MotherTongueItem[]>(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MotherTongueItem | null>(null);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const openAdd = () => { setEditItem(null); setName(""); setDialogOpen(true); };
  const openEdit = (item: MotherTongueItem) => { setEditItem(item); setName(item.name); setDialogOpen(true); };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (editItem) {
      setItems(items.map(i => i.id === editItem.id ? { ...i, name: name.trim() } : i));
      toast.success("Mother Tongue updated successfully");
    } else {
      setItems([...items, { id: Date.now(), name: name.trim() }]);
      toast.success("Mother Tongue added successfully");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setItems(items.filter(i => i.id !== id));
    toast.success("Mother Tongue deleted successfully");
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mother Tongue Management</h1>
          <p className="text-muted-foreground">Manage mother tongue options for profiles</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Mother Tongue</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Mother Tongues ({filtered.length})</CardTitle>
            <Input placeholder="Search mother tongue..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Mother Tongue</TableHead>
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
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No mother tongues found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Mother Tongue" : "Add Mother Tongue"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Enter mother tongue" value={name} onChange={e => setName(e.target.value)} />
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
