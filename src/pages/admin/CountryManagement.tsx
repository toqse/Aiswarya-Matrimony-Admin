import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import {
  createCountry,
  deleteCountry,
  fetchAdminCountries,
  updateCountry,
  type AdminCountryItem,
} from "@/lib/admin-api/master";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CountryManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminCountryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminCountryItem | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["master", "countries", search, page],
    queryFn: () => fetchAdminCountries({ search: search.trim() || undefined, page, page_size: 20 }),
  });

  const items = data?.results ?? [];
  const total = data?.count ?? 0;
  const canPrev = Boolean(data?.previous) && page > 1;
  const canNext = Boolean(data?.next);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["master", "countries"] });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name is required");
      const body = { name: name.trim(), code: code.trim() };
      if (editItem) return updateCountry(editItem.id, body);
      return createCountry(body);
    },
    onSuccess: () => {
      toast.success(editItem ? "Updated" : "Added");
      setDialogOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => deleteCountry(id),
    onSuccess: () => {
      toast.success("Deleted");
      setDeleteItem(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed"),
  });

  const openAdd = () => {
    setEditItem(null);
    setName("");
    setCode("");
    setDialogOpen(true);
  };

  const openEdit = (item: AdminCountryItem) => {
    setEditItem(item);
    setName(item.name);
    setCode(item.code ?? "");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Country Management</h1>
        <p className="text-muted-foreground">Manage countries used in profile locations</p>
      </div>

      {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search countries..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-10"
          />
        </div>
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> Add Country
        </Button>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-primary font-semibold">COUNTRY NAME</TableHead>
                <TableHead className="text-primary font-semibold">CODE</TableHead>
                <TableHead className="text-primary font-semibold">STATES</TableHead>
                <TableHead className="text-right text-primary font-semibold">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell>{i.code || "—"}</TableCell>
                  <TableCell>{i.state_count ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(i)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteItem(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Showing {items.length} of {total} records
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!canPrev}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!canNext}>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Country" : "Add Country"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Code (optional)" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete country?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete "{deleteItem?.name}" and deactivate its states, districts, and cities.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={delMut.isPending}
              onClick={() => deleteItem && delMut.mutate(deleteItem.id)}
            >
              {delMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
