import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  createState,
  deleteState,
  fetchAdminStates,
  fetchStateCountries,
  toggleStateStatus,
  updateState,
  type AdminStateItem,
} from "@/lib/admin-api/master";
import { MasterRowActions, MasterStatusBadge, MasterToggleDialog } from "@/components/master/MasterStatusControls";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StateManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminStateItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminStateItem | null>(null);
  const [toggleItem, setToggleItem] = useState<AdminStateItem | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [formCountryId, setFormCountryId] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const countriesQuery = useQuery({
    queryKey: ["master", "states", "countries"],
    queryFn: () => fetchStateCountries(),
  });
  const countries = countriesQuery.data ?? [];
  const effectiveCountry = filterCountry || (countries[0] ? String(countries[0].id) : "");

  useEffect(() => {
    if (!filterCountry && countries[0]) setFilterCountry(String(countries[0].id));
  }, [filterCountry, countries]);

  const { data, isLoading, error } = useQuery({
    enabled: !!effectiveCountry,
    queryKey: ["master", "states", search, effectiveCountry, page],
    queryFn: () =>
      fetchAdminStates({
        country_id: Number(effectiveCountry),
        search: search.trim() || undefined,
        page,
        page_size: 20,
      }),
  });

  const items = data?.results ?? [];
  const total = data?.count ?? 0;
  const canPrev = Boolean(data?.previous) && page > 1;
  const canNext = Boolean(data?.next);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["master", "states"] });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !formCountryId) throw new Error("Name and country required");
      const body = { name: name.trim(), country: Number(formCountryId), code: code.trim() };
      if (editItem) return updateState(editItem.id, body);
      return createState(body);
    },
    onSuccess: () => {
      toast.success(editItem ? "Updated" : "Added");
      setDialogOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => deleteState(id),
    onSuccess: () => {
      toast.success("Deleted");
      setDeleteItem(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed"),
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => toggleStateStatus(id),
    onSuccess: (data) => {
      toast.success(data.is_active ? "Activated" : "Deactivated");
      setToggleItem(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Status update failed"),
  });

  const openAdd = () => {
    setEditItem(null);
    setName("");
    setCode("");
    setFormCountryId(effectiveCountry);
    setDialogOpen(true);
  };

  const openEdit = (item: AdminStateItem) => {
    setEditItem(item);
    setName(item.name);
    setCode(item.code ?? "");
    setFormCountryId(item.country != null ? String(item.country) : "");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">State Management</h1>
        <p className="text-muted-foreground">Manage states per country</p>
      </div>

      {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={filterCountry}
          onValueChange={(v) => {
            setPage(1);
            setFilterCountry(v);
          }}
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name} ({c.state_count ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search states..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-10"
          />
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add State
        </Button>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id} className={!i.is_active ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell>{i.code || "—"}</TableCell>
                  <TableCell>{i.country_name ?? "—"}</TableCell>
                  <TableCell>
                    <MasterStatusBadge isActive={i.is_active} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MasterRowActions
                      isActive={i.is_active}
                      onEdit={() => openEdit(i)}
                      onToggle={() => setToggleItem(i)}
                      onDelete={() => setDeleteItem(i)}
                      togglePending={toggleMut.isPending}
                    />
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
            <DialogTitle>{editItem ? "Edit State" : "Add State"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={formCountryId} onValueChange={setFormCountryId}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="State name" value={name} onChange={(e) => setName(e.target.value)} />
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

      <MasterToggleDialog
        item={toggleItem}
        label="state"
        extra="Nested districts and cities will also be deactivated."
        pending={toggleMut.isPending}
        onConfirm={() => toggleItem && toggleMut.mutate(toggleItem.id)}
        onClose={() => setToggleItem(null)}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete state?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete "{deleteItem?.name}" and deactivate its districts and cities.
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
