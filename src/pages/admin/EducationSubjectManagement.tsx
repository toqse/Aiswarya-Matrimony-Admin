import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  createEducationSubject,
  deleteEducationSubject,
  fetchAdminEducations,
  fetchAdminEducationSubjects,
  toggleEducationSubjectStatus,
  updateEducationSubject,
  type EducationSubjectItem,
} from "@/lib/admin-api/master";
import { MasterRowActions, MasterStatusBadge, MasterToggleDialog } from "@/components/master/MasterStatusControls";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EducationSubjectManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<EducationSubjectItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<EducationSubjectItem | null>(null);
  const [toggleItem, setToggleItem] = useState<EducationSubjectItem | null>(null);
  const [name, setName] = useState("");
  const [selectedEducationIds, setSelectedEducationIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["master", "education-subjects", search, page],
    queryFn: () => fetchAdminEducationSubjects({ search: search.trim() || undefined, page, page_size: 20 }),
  });

  const educationsQuery = useQuery({
    queryKey: ["master", "educations", "subject-mapping"],
    queryFn: () => fetchAdminEducations({ page: 1, page_size: 200 }),
  });

  const items = data?.results ?? [];
  const total = data?.count ?? 0;
  const canPrev = Boolean(data?.previous) && page > 1;
  const canNext = Boolean(data?.next);
  const educations = (educationsQuery.data?.results ?? []).filter((e) => e.is_active !== false);
  const educationNameById = new Map(
    (educationsQuery.data?.results ?? []).map((e) => [e.id, e.name]),
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["master", "education-subjects"] });
    qc.invalidateQueries({ queryKey: ["master", "educations"] });
  };

  const linkedEducationLabel = (item: EducationSubjectItem) => {
    const ids = item.education_ids ?? [];
    if (ids.length === 0) return null;
    const names = ids.map((id) => educationNameById.get(id) ?? `#${id}`);
    return names.join(", ");
  };

  const toggleEducationId = (id: number, checked: boolean) => {
    setSelectedEducationIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const openAdd = () => {
    setEditItem(null);
    setName("");
    setSelectedEducationIds([]);
    setDialogOpen(true);
  };

  const openEdit = (item: EducationSubjectItem) => {
    setEditItem(item);
    setName(item.name);
    setSelectedEducationIds(item.education_ids ?? []);
    setDialogOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name is required");
      if (selectedEducationIds.length === 0) {
        throw new Error("Select at least one highest education");
      }
      const body = { name: name.trim(), educations: selectedEducationIds };
      if (editItem) return updateEducationSubject(editItem.id, body);
      return createEducationSubject(body);
    },
    onSuccess: () => {
      toast.success(editItem ? "Updated" : "Added");
      setDialogOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => deleteEducationSubject(id),
    onSuccess: () => {
      toast.success("Deleted");
      setDeleteItem(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed"),
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => toggleEducationSubjectStatus(id),
    onSuccess: (data) => {
      toast.success(data.is_active ? "Activated" : "Deactivated");
      setToggleItem(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Status update failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Education Subject Management</h1>
          <p className="text-muted-foreground">Manage education subject options for profiles</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Education Subject
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="max-w-sm"
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Highest education</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => {
                const linked = linkedEducationLabel(i);
                return (
                  <TableRow key={i.id} className={!i.is_active ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell className="max-w-sm text-sm">
                      {linked ? (
                        <span className="text-muted-foreground">{linked}</span>
                      ) : (
                        <span className="text-destructive">Not linked — will not appear in profile forms</span>
                      )}
                    </TableCell>
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
                );
              })}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!canNext}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit" : "Add"} Education Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="education-subject-name">Name</Label>
              <Input
                id="education-subject-name"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Highest education</Label>
              <p className="text-xs text-muted-foreground">
                Select which highest education values this subject should appear under in profile forms.
              </p>
              <div className="max-h-56 overflow-y-auto rounded-md border p-3 space-y-2">
                {educationsQuery.isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading educations...
                  </div>
                )}
                {!educationsQuery.isLoading && educations.length === 0 && (
                  <p className="text-sm text-muted-foreground">No highest education options found.</p>
                )}
                {educations.map((edu) => {
                  const checked = selectedEducationIds.includes(edu.id);
                  return (
                    <label key={edu.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleEducationId(edu.id, value === true)}
                      />
                      <span>{edu.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
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
        label="education subject"
        pending={toggleMut.isPending}
        onConfirm={() => toggleItem && toggleMut.mutate(toggleItem.id)}
        onClose={() => setToggleItem(null)}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete education subject?</AlertDialogTitle>
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
