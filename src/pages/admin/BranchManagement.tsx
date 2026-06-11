import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { digitsOnlyMobile, formatPhoneDisplay, formatPhoneForApi, isValidIndianMobile } from "@/lib/phone";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createBranch,
  deleteBranch,
  fetchBranchList,
  toggleBranchStatus,
  updateBranch,
  type BranchRow,
} from "@/lib/admin-api/branches";
import { Plus, Edit, Building2, Users, IndianRupee, Search, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

function formatINR(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function BranchManagement() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("20");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BranchRow | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toggleBranch, setToggleBranch] = useState<BranchRow | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    code: "",
    city: "",
    address: "",
    phone: "",
    email: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setField = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => {
      if (!e[key]) return e;
      const { [key]: _omit, ...rest } = e;
      return rest;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Branch name is required";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    else if (!isValidIndianMobile(form.phone)) errs.phone = "Enter a valid 10-digit Indian mobile number";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email address";
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    saveMut.mutate();
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin", "branches", search, page, pageSize],
    queryFn: () =>
      fetchBranchList({
        search: search.trim() || undefined,
        page,
        page_size: Number(pageSize),
      }),
  });

  const summary = data?.summary;
  const filtered = Array.isArray(data?.results) ? data.results : [];
  const total = data?.count ?? 0;
  const canPrev = Boolean(data?.previous) && page > 1;
  const canNext = Boolean(data?.next);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "branches"] });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.city || !form.phone || !form.email) {
        throw new Error("Please fill name, city, phone, and email");
      }
      const phoneE164 = formatPhoneForApi(form.phone);
      if (!isValidIndianMobile(form.phone)) {
        throw new Error("Enter a valid 10-digit Indian mobile number");
      }
      if (editing) {
        return updateBranch(editing.id, {
          name: form.name,
          city: form.city,
          phone: phoneE164,
          email: form.email,
          address: form.address,
        });
      }
      return createBranch({
        name: form.name,
        city: form.city,
        phone: phoneE164,
        email: form.email,
        address: form.address || undefined,
      });
    },
    onSuccess: (branch) => {
      toast({
        title: editing ? "Branch updated" : "Branch created",
        description: branch?.name
          ? `${branch.name}${branch.code ? ` · ${branch.code}` : ""}`
          : undefined,
      });
      setDialogOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => toggleBranchStatus(id),
    onSuccess: () => {
      toast({ title: "Status updated" });
      setToggleBranch(null);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteBranch(id),
    onSuccess: () => {
      toast({ title: "Branch deleted" });
      setDeleteId(null);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", code: "", city: "", address: "", phone: "", email: "" });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (b: BranchRow) => {
    setEditing(b);
    setForm({
      name: b.name,
      code: b.code,
      city: b.city,
      address: b.address ?? "",
      phone: digitsOnlyMobile(b.phone),
      email: b.email,
    });
    setFieldErrors({});
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branch Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all branches across the organization</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Branch
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Branches", value: summary?.total_branches ?? "—", icon: Building2, color: "text-primary" },
          { label: "Total Staff", value: summary?.total_staff ?? "—", icon: Users, color: "text-accent" },
          { label: "Total Revenue", value: summary ? formatINR(summary.total_revenue) : "—", icon: IndianRupee, color: "text-success" },
        ].map((c) => (
          <Card key={c.label} className="shadow-elegant border-0">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search branches..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="pl-9"
              />
            </div>
            {(isLoading || isFetching) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Profiles</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b, i) => (
                <TableRow key={b.id != null ? `branch-${b.id}` : `branch-row-${i}`}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{b.code ?? "—"}</TableCell>
                  <TableCell>{b.city}</TableCell>
                  <TableCell>{formatPhoneDisplay(b.phone)}</TableCell>
                  <TableCell>{b.email}</TableCell>
                  <TableCell>{(b.profiles_count ?? 0).toLocaleString()}</TableCell>
                  <TableCell>{formatINR(b.revenue ?? 0)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={b.status === "active" ? "default" : "secondary"}
                      className={b.status === "active" ? "bg-success text-success-foreground" : ""}
                    >
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setToggleBranch(b)}
                        disabled={toggleMut.isPending}
                        className="text-xs"
                      >
                        {b.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(b.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {total} records
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={pageSize}
                onValueChange={(v) => {
                  setPage(1);
                  setPageSize(v);
                }}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Branch" : "Add New Branch"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2.5">Branch Name</Label>
              <div className="col-span-3">
                <Input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className={fieldErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                {fieldErrors.name && <p className="text-xs text-destructive mt-1">{fieldErrors.name}</p>}
              </div>
            </div>
            {editing && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Code</Label>
                <Input
                  readOnly
                  tabIndex={-1}
                  className="col-span-3 bg-muted cursor-not-allowed"
                  value={form.code}
                  aria-readonly
                />
              </div>
            )}
            {(
              [
                ["City", "city"],
                ["Address", "address"],
                ["Phone", "phone"],
                ["Email", "email"],
              ] as const
            ).map(([label, key]) => (
              <div key={key} className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2.5">{label}</Label>
                <div className="col-span-3">
                  {key === "phone" ? (
                    <PhoneInput
                      value={form.phone}
                      onChange={(v) => setField("phone", v)}
                      invalid={Boolean(fieldErrors.phone)}
                    />
                  ) : (
                    <Input
                      value={form[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      className={fieldErrors[key] ? "border-destructive focus-visible:ring-destructive" : ""}
                      aria-invalid={Boolean(fieldErrors[key])}
                    />
                  )}
                  {fieldErrors[key] && <p className="text-xs text-destructive mt-1">{fieldErrors[key]}</p>}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId != null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete branch?</AlertDialogTitle>
            <AlertDialogDescription>This may fail if the branch has active subscriptions.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId != null && deleteMut.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={toggleBranch != null} onOpenChange={(o) => !o && setToggleBranch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toggleBranch?.status === "active" ? "Deactivate branch?" : "Activate branch?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleBranch?.status === "active"
                ? `This will mark ${toggleBranch?.name ?? "this branch"} as inactive.`
                : `This will mark ${toggleBranch?.name ?? "this branch"} as active.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toggleBranch?.id != null && toggleMut.mutate(toggleBranch.id)}
              disabled={toggleMut.isPending}
            >
              {toggleMut.isPending ? "Please wait..." : toggleBranch?.status === "active" ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
