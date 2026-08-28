import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  createEducationSubject,
  deleteEducationSubject,
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["master", "education-subjects", search, page],
    queryFn: () => fetchAdminEducationSubjects({ search: search.trim() || undefined, page, page_size: 20 }),
  });

  const items = data?.results ?? [];
  const total = data?.count ?? 0;
  const canPrev = Boolean(data?.previous) && page > 1;
  const canNext = Boolean(data?.next);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["master", "education-subjects"] });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name is required");
      if (editItem) return updateEducationSubject(editItem.id, { name: name.trim() });
      return createEducationSubject({ name: name.trim() });
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
        <Button
          onClick={() => {
            setEditItem(null);
            setName("");
            setDialogOpen(true);
          }}
        >
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id} className={!i.is_active ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell>
                    <MasterStatusBadge isActive={i.is_active} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MasterRowActions
                      isActive={i.is_active}
                      onEdit={() => {
                        setEditItem(i);
                        setName(i.name);
                        setDialogOpen(true);
                      }}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit" : "Add"} Education Subject</DialogTitle>
          </DialogHeader>
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
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
