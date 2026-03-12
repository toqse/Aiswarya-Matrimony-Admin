import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CasteItem {
  id: number;
  name: string;
  religionId: number;
}

interface Religion {
  id: number;
  name: string;
}

const religions: Religion[] = [
  { id: 1, name: "Hindu" },
  { id: 2, name: "Christian" },
  { id: 3, name: "Muslim" },
  { id: 4, name: "Caste No Bar" },
  { id: 5, name: "Inter-Caste" },
];

const initialCastes: CasteItem[] = [
  { id: 1, name: "Ambalavasi", religionId: 1 },
  { id: 2, name: "Arya", religionId: 1 },
  { id: 3, name: "Bharather", religionId: 1 },
  { id: 4, name: "Blacksmith", religionId: 1 },
  { id: 5, name: "Brahmin", religionId: 1 },
  { id: 6, name: "Carpenter", religionId: 1 },
  { id: 7, name: "Ezhava", religionId: 1 },
  { id: 8, name: "Nair", religionId: 1 },
  { id: 9, name: "Thiyya", religionId: 1 },
  { id: 10, name: "Menon", religionId: 1 },
  { id: 11, name: "Pillai", religionId: 1 },
  { id: 12, name: "Catholic", religionId: 2 },
  { id: 13, name: "Orthodox", religionId: 2 },
  { id: 14, name: "Pentecostal", religionId: 2 },
  { id: 15, name: "Marthoma", religionId: 2 },
  { id: 16, name: "Sunni", religionId: 3 },
  { id: 17, name: "Shia", religionId: 3 },
  { id: 18, name: "Mappila", religionId: 3 },
];

export default function CasteManagement() {
  const [items, setItems] = useState<CasteItem[]>(initialCastes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CasteItem | null>(null);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedReligion, setSelectedReligion] = useState<number>(1);

  const openAdd = () => { setEditItem(null); setName(""); setDialogOpen(true); };
  const openEdit = (item: CasteItem) => { setEditItem(item); setName(item.name); setDialogOpen(true); };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (editItem) {
      setItems(items.map(i => i.id === editItem.id ? { ...i, name: name.trim() } : i));
      toast.success("Caste updated successfully");
    } else {
      setItems([...items, { id: Date.now(), name: name.trim(), religionId: selectedReligion }]);
      toast.success("Caste added successfully");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setItems(items.filter(i => i.id !== id));
    toast.success("Caste deleted successfully");
  };

  const getCasteCount = (religionId: number) => items.filter(i => i.religionId === religionId).length;

  const selectedReligionName = religions.find(r => r.id === selectedReligion)?.name || "";

  const filtered = items
    .filter(i => i.religionId === selectedReligion)
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Caste Management</h1>
        <p className="text-muted-foreground">Manage caste categories under each religion</p>
      </div>

      {/* Religion Tabs */}
      <div className="flex flex-wrap gap-2">
        {religions.map(r => (
          <button
            key={r.id}
            onClick={() => { setSelectedReligion(r.id); setSearch(""); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              selectedReligion === r.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-accent"
            }`}
          >
            {r.name}
            <Badge variant={selectedReligion === r.id ? "secondary" : "outline"} className="ml-1 text-xs px-1.5 py-0">
              {getCasteCount(r.id)}
            </Badge>
          </button>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search in ${selectedReligionName} castes...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> Add Caste
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-16 text-primary font-semibold">#</TableHead>
                <TableHead className="text-primary font-semibold">CASTE NAME</TableHead>
                <TableHead className="text-right text-primary font-semibold">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, idx) => (
                <TableRow key={item.id} className="h-16">
                  <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
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
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No castes found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Caste" : `Add Caste to ${selectedReligionName}`}</DialogTitle>
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
