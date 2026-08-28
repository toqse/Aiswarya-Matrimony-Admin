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
  createCity,
  deleteCity,
  fetchAdminCities,
  fetchCityDistricts,
  fetchDistrictStates,
  fetchStateCountries,
  updateCity,
  type AdminCityItem,
} from "@/lib/admin-api/master";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CityManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminCityItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminCityItem | null>(null);
  const [name, setName] = useState("");
  const [formDistrictId, setFormDistrictId] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
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

  const districtsQuery = useQuery({
    enabled: !!effectiveState,
    queryKey: ["master", "cities", "districts", effectiveState],
    queryFn: () => fetchCityDistricts(Number(effectiveState)),
  });
  const districts = districtsQuery.data ?? [];
  const effectiveDistrict = districts.some((d) => String(d.id) === filterDistrict)
    ? filterDistrict
    : districts[0]
      ? String(districts[0].id)
      : "";

  useEffect(() => {
    if (districts[0] && !districts.some((d) => String(d.id) === filterDistrict)) {
      setFilterDistrict(String(districts[0].id));
      setPage(1);
    }
  }, [districts, filterDistrict]);

  const { data, isLoading, error } = useQuery({
    enabled: !!effectiveDistrict,
    queryKey: ["master", "cities", search, effectiveDistrict, page],
    queryFn: () =>
      fetchAdminCities({
        district_id: Number(effectiveDistrict),
        search: search.trim() || undefined,
        page,
        page_size: 20,
      }),
  });

  const items = data?.results ?? [];
  const total = data?.count ?? 0;
  const canPrev = Boolean(data?.previous) && page > 1;
  const canNext = Boolean(data?.next);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["master", "cities"] });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !formDistrictId) throw new Error("Name and district required");
      const body = { name: name.trim(), district: Number(formDistrictId) };
      if (editItem) return updateCity(editItem.id, body);
      return createCity(body);
    },
    onSuccess: () => {
      toast.success(editItem ? "Updated" : "Added");
      setDialogOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => deleteCity(id),
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
    setFormDistrictId(effectiveDistrict);
    setDialogOpen(true);
  };

  const openEdit = (item: AdminCityItem) => {
    setEditItem(item);
    setName(item.name);
    setFormDistrictId(item.district != null ? String(item.district) : "");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">City Management</h1>
        <p className="text-muted-foreground">Manage cities per district</p>
      </div>

      {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={filterCountry}
          onValueChange={(v) => {
            setPage(1);
            setFilterCountry(v);
            setFilterState("");
            setFilterDistrict("");
          }}
        >
          <SelectTrigger className="w-[200px]">
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
            setFilterDistrict("");
          }}
          disabled={!states.length}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {states.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={effectiveDistrict}
          onValueChange={(v) => {
            setPage(1);
            setFilterDistrict(v);
          }}
          disabled={!districts.length}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select district" />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name} ({d.city_count ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cities..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-10"
          />
        </div>
        <Button onClick={openAdd} disabled={!effectiveDistrict}>
          <Plus className="h-4 w-4 mr-1" /> Add City
        </Button>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell>{i.district_name ?? "—"}</TableCell>
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
            <DialogTitle>{editItem ? "Edit City" : "Add City"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={formDistrictId} onValueChange={setFormDistrictId}>
              <SelectTrigger>
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="City name" value={name} onChange={(e) => setName(e.target.value)} />
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
            <AlertDialogTitle>Delete city?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete "{deleteItem?.name}". This action cannot be undone.
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
