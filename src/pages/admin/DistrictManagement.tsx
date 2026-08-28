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
  createDistrict,
  deleteDistrict,
  fetchAdminDistricts,
  fetchDistrictStates,
  fetchStateCountries,
  toggleDistrictStatus,
  updateDistrict,
  type AdminDistrictItem,
} from "@/lib/admin-api/master";
import { MasterRowActions, MasterStatusBadge, MasterToggleDialog } from "@/components/master/MasterStatusControls";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DistrictManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminDistrictItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminDistrictItem | null>(null);
  const [toggleItem, setToggleItem] = useState<AdminDistrictItem | null>(null);
  const [name, setName] = useState("");
  const [formStateId, setFormStateId] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
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

  const statesQuery = useQuery({
    enabled: !!effectiveCountry,
    queryKey: ["master", "districts", "states", effectiveCountry],
    queryFn: () => fetchDistrictStates(Number(effectiveCountry)),
  });
  const states = statesQuery.data ?? [];
  const effectiveState = states.some((s) => String(s.id) === filterState)
    ? filterState
    : states[0]
      ? String(states[0].id)
      : "";

  useEffect(() => {
    if (states[0] && !states.some((s) => String(s.id) === filterState)) {
      setFilterState(String(states[0].id));
      setPage(1);
    }
  }, [states, filterState]);

  const { data, isLoading, error } = useQuery({
    enabled: !!effectiveState,
    queryKey: ["master", "districts", search, effectiveState, page],
    queryFn: () =>
      fetchAdminDistricts({
        state_id: Number(effectiveState),
        search: search.trim() || undefined,
        page,
        page_size: 20,
      }),
  });

  const items = data?.results ?? [];
  const total = data?.count ?? 0;
  const canPrev = Boolean(data?.previous) && page > 1;
  const canNext = Boolean(data?.next);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["master", "districts"] });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !formStateId) throw new Error("Name and state required");
      const body = { name: name.trim(), state: Number(formStateId) };
      if (editItem) return updateDistrict(editItem.id, body);
      return createDistrict(body);
    },
    onSuccess: () => {
      toast.success(editItem ? "Updated" : "Added");
      setDialogOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => deleteDistrict(id),
    onSuccess: () => {
      toast.success("Deleted");
      setDeleteItem(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed"),
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => toggleDistrictStatus(id),
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
    setFormStateId(effectiveState);
    setDialogOpen(true);
  };

  const openEdit = (item: AdminDistrictItem) => {
    setEditItem(item);
    setName(item.name);
    setFormStateId(item.state != null ? String(item.state) : "");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">District Management</h1>
        <p className="text-muted-foreground">Manage districts per state</p>
      </div>

      {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={filterCountry}
          onValueChange={(v) => {
            setPage(1);
            setFilterCountry(v);
            setFilterState("");
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={effectiveState}
          onValueChange={(v) => {
            setPage(1);
            setFilterState(v);
          }}
          disabled={!states.length}
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {states.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name} ({s.district_count ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search districts..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-10"
          />
        </div>
        <Button onClick={openAdd} disabled={!effectiveState}>
          <Plus className="h-4 w-4 mr-1" /> Add District
        </Button>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>District</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id} className={!i.is_active ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell>{i.state_name ?? "—"}</TableCell>
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
            <DialogTitle>{editItem ? "Edit District" : "Add District"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={formStateId} onValueChange={setFormStateId}>
              <SelectTrigger>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="District name" value={name} onChange={(e) => setName(e.target.value)} />
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
        label="district"
        extra="Nested cities will also be deactivated."
        pending={toggleMut.isPending}
        onConfirm={() => toggleItem && toggleMut.mutate(toggleItem.id)}
        onClose={() => setToggleItem(null)}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete district?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete "{deleteItem?.name}" and deactivate its cities.
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
