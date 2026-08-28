import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  createTestimonial,
  deleteTestimonial,
  fetchAdminTestimonials,
  updateTestimonial,
} from "@/lib/admin-api/testimonials";
import {
  Quote,
  CheckCircle,
  Eye,
  Plus,
  Edit,
  Trash2,
  Star,
  ImageIcon,
  Search,
  Loader2,
  User,
} from "lucide-react";

interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  review: string;
  rating: number;
  avatar: string | null;
  status: "Published" | "Draft";
  sortOrder: number;
}

const emptyForm = (): Omit<TestimonialItem, "id"> => ({
  name: "",
  role: "",
  review: "",
  rating: 5,
  avatar: null,
  status: "Draft",
  sortOrder: 0,
});

export default function Testimonials() {
  const { toast } = useToast();
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState<TestimonialItem | null>(null);
  const [deleteModal, setDeleteModal] = useState<TestimonialItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const setField = <K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.role.trim()) errs.role = "Role is required";
    if (!form.review.trim()) errs.review = "Review is required";
    if (form.rating < 1 || form.rating > 5) errs.rating = "Rating must be 1–5";
    return errs;
  };
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "testimonials", search, statusFilter, page],
    queryFn: () =>
      fetchAdminTestimonials({
        search: search.trim() || undefined,
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as "draft" | "published"),
        page,
      }),
  });

  useEffect(() => {
    if (!data) return;
    setItems(
      data.results.map((row) => ({
        id: String(row.id),
        name: row.name,
        role: row.role,
        review: row.review,
        rating: row.rating,
        avatar: row.avatar,
        status: row.status === "published" ? "Published" : "Draft",
        sortOrder: row.sort_order,
      })),
    );
  }, [data]);

  const published =
    data?.summary?.published ??
    items.filter((s) => s.status === "Published").length;
  const drafts =
    data?.summary?.drafts ?? items.filter((s) => s.status === "Draft").length;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFieldErrors({});
    setPhotoPreview(null);
    setPhotoFile(null);
    setModalOpen(true);
  };
  const openEdit = (item: TestimonialItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      role: item.role,
      review: item.review,
      rating: item.rating,
      avatar: item.avatar,
      status: item.status,
      sortOrder: item.sortOrder,
    });
    setFieldErrors({});
    setPhotoPreview(item.avatar);
    setPhotoFile(null);
    setModalOpen(true);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Max 5MB",
        variant: "destructive",
      });
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPhotoPreview(url);
      setForm((f) => ({ ...f, avatar: url }));
    };
    reader.readAsDataURL(file);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        review: form.review.trim(),
        rating: form.rating,
        sort_order: form.sortOrder,
        status:
          form.status === "Published"
            ? "published"
            : ("draft" as "published" | "draft"),
        ...(photoFile ? { avatar: photoFile } : {}),
      };
      if (editingId) {
        return updateTestimonial(Number(editingId), payload);
      }
      return createTestimonial(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      toast({ title: editingId ? "Testimonial updated" : "Testimonial added" });
      setModalOpen(false);
      setPhotoFile(null);
    },
    onError: (e: Error) => {
      toast({
        title: "Save failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteTestimonial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      toast({ title: "Testimonial deleted" });
      setDeleteModal(null);
    },
    onError: (e: Error) => {
      toast({
        title: "Delete failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    saveMut.mutate();
  };

  const handleDelete = () => {
    if (!deleteModal) return;
    deleteMut.mutate(Number(deleteModal.id));
  };

  const kpis = [
    {
      label: "Total Testimonials",
      value: data?.summary?.total_testimonials ?? items.length,
      icon: Quote,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Published",
      value: published,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Drafts",
      value: drafts,
      icon: Edit,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Quote className="h-6 w-6 text-primary" /> Testimonials
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage customer testimonials shown on the About Us page
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Testimonial
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0">
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-xl ${k.bg} flex items-center justify-center`}
              >
                <k.icon className={`h-6 w-6 ${k.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, or review..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((item) => (
          <Card
            key={item.id}
            className="shadow-elegant border-0 overflow-hidden group hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="h-12 w-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary/60" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-foreground truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.role}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    item.status === "Published"
                      ? "bg-emerald-500 text-white border-0 shrink-0"
                      : "bg-amber-400 text-amber-900 border-0 shrink-0"
                  }
                >
                  {item.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(item.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 text-amber-500 fill-amber-500"
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  Order {item.sortOrder}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 italic">
                “{item.review}”
              </p>
              <div className="flex items-center justify-end pt-2 border-t border-border/50">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewModal(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => openEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteModal(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && items.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Quote className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No testimonials found</p>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-primary" />
              {editingId ? "Edit Testimonial" : "Add Testimonial"}
            </DialogTitle>
            <DialogDescription>
              Testimonials marked Published appear on the About Us page
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Customer name"
                  className={
                    fieldErrors.name
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive">{fieldErrors.name}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Role *</Label>
                <Input
                  value={form.role}
                  onChange={(e) => setField("role", e.target.value)}
                  placeholder="e.g. IT Professional"
                  className={
                    fieldErrors.role
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  aria-invalid={Boolean(fieldErrors.role)}
                />
                {fieldErrors.role && (
                  <p className="text-xs text-destructive">{fieldErrors.role}</p>
                )}
              </div>
            </div>
            <div>
              <Label>Photo (JPG/PNG/WEBP, max 5MB)</Label>
              <div
                className="mt-1.5 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById("testimonial-photo-upload")?.click()}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-24 w-24 mx-auto rounded-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground">
                    <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Click to upload photo</p>
                  </div>
                )}
                <input
                  id="testimonial-photo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhoto}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Review *</Label>
              <Textarea
                value={form.review}
                onChange={(e) => setField("review", e.target.value)}
                placeholder="Customer review..."
                rows={4}
                className={
                  fieldErrors.review
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                aria-invalid={Boolean(fieldErrors.review)}
              />
              {fieldErrors.review && (
                <p className="text-xs text-destructive">{fieldErrors.review}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Rating</Label>
                <Select
                  value={String(form.rating)}
                  onValueChange={(v) => setField("rating", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} star{n === 1 ? "" : "s"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setField("sortOrder", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v: "Draft" | "Published") =>
                    setForm((f) => ({ ...f, status: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saveMut.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="gap-2"
              disabled={saveMut.isPending}
            >
              {saveMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Quote className="h-4 w-4" />
              )}
              {editingId ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewModal} onOpenChange={() => setViewModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-primary" /> Preview
            </DialogTitle>
            <DialogDescription>How this testimonial will appear</DialogDescription>
          </DialogHeader>
          {viewModal && (
            <div className="space-y-4">
              <div className="flex items-center gap-1">
                {[...Array(viewModal.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-amber-500 fill-amber-500"
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                “{viewModal.review}”
              </p>
              <div className="flex items-center gap-3">
                {viewModal.avatar ? (
                  <img
                    src={viewModal.avatar}
                    alt={viewModal.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary/60" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-foreground">{viewModal.name}</h3>
                  <p className="text-xs text-muted-foreground">{viewModal.role}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                <Badge
                  className={
                    viewModal.status === "Published"
                      ? "bg-emerald-500 text-white border-0"
                      : "bg-amber-400 text-amber-900 border-0"
                  }
                >
                  {viewModal.status}
                </Badge>
                <span>Order {viewModal.sortOrder}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Testimonial?</DialogTitle>
            <DialogDescription>
              This will permanently remove “{deleteModal?.name}”. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModal(null)}
              disabled={deleteMut.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
