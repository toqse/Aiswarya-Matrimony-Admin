import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react";
import { toast } from "sonner";

interface ReligionItem {
  id: number;
  name: string;
  casteCount: number;
}

const initialData: ReligionItem[] = [
  { id: 1, name: "Hindu", casteCount: 56 },
  { id: 2, name: "Christian", casteCount: 17 },
  { id: 3, name: "Muslim", casteCount: 10 },
  { id: 4, name: "Caste No Bar", casteCount: 0 },
  { id: 5, name: "Inter-Caste", casteCount: 0 },
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
      setItems([...items, { id: Date.now(), name: name.trim(), casteCount: 0 }]);
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Religion Management</h1>
        <p className="text-muted-foreground">Manage religion categories for profiles</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search religions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> Add Religion
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-primary font-semibold">RELIGION NAME</TableHead>
                <TableHead className="text-primary font-semibold">CASTES</TableHead>
                <TableHead className="text-right text-primary font-semibold">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="h-16">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                      {item.casteCount} castes
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)} className="gap-1.5">
                        <Pencil className="h-3.5 w-3.5 text-amber-600" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
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
