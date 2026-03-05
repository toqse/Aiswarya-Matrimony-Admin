import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, CheckCircle, Eye, Plus, Edit, Trash2, Heart, Calendar, MapPin, Star, ImageIcon, Search
} from "lucide-react";

interface Story {
  id: string;
  groomName: string;
  brideName: string;
  marriageDate: string;
  location: string;
  storyText: string;
  photo: string | null;
  status: "Published" | "Draft";
  featured: boolean;
  views: number;
  createdAt: string;
}

const initialStories: Story[] = [
  {
    id: "SS-001", groomName: "Ravi", brideName: "Priya", marriageDate: "2025-12-15",
    location: "Chennai", storyText: "We met through AVB Matrimony and instantly felt a connection. Our families were delighted when the horoscopes matched perfectly. After a beautiful engagement ceremony, we tied the knot in a grand wedding at Chennai. We are grateful to AVB for bringing us together and making our dream come true. The staff was incredibly supportive throughout the entire process.",
    photo: null, status: "Published", featured: true, views: 245, createdAt: "2026-01-10"
  },
  {
    id: "SS-002", groomName: "Karthik", brideName: "Anjali", marriageDate: "2025-11-20",
    location: "Coimbatore", storyText: "Our journey began when Anjali's profile caught my attention on AVB. The detailed horoscope matching gave our parents confidence. We spoke for a few months and realized we were meant for each other. Our wedding in Coimbatore was a celebration of love and tradition. Thank you AVB for this beautiful beginning to our lives together.",
    photo: null, status: "Published", featured: false, views: 312, createdAt: "2026-01-05"
  },
  {
    id: "SS-003", groomName: "Suresh", brideName: "Meera", marriageDate: "2026-03-10",
    location: "Madurai", storyText: "We are preparing for our wedding thanks to AVB Matrimony. The service has been exceptional from profile creation to match suggestions. Our families are thrilled and wedding preparations are in full swing. We look forward to starting our new life together.",
    photo: null, status: "Draft", featured: false, views: 0, createdAt: "2026-02-20"
  },
];

const emptyForm = (): Omit<Story, "id" | "views" | "createdAt"> => ({
  groomName: "", brideName: "", marriageDate: "", location: "", storyText: "",
  photo: null, status: "Draft", featured: false,
});

export default function SuccessStories() {
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState<Story | null>(null);
  const [deleteModal, setDeleteModal] = useState<Story | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const filtered = stories.filter(s => {
    const matchSearch = `${s.groomName} ${s.brideName} ${s.location}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const published = stories.filter(s => s.status === "Published").length;
  const drafts = stories.filter(s => s.status === "Draft").length;
  const totalViews = stories.reduce((a, s) => a + s.views, 0);

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setPhotoPreview(null); setModalOpen(true); };
  const openEdit = (s: Story) => {
    setEditingId(s.id);
    setForm({ groomName: s.groomName, brideName: s.brideName, marriageDate: s.marriageDate, location: s.location, storyText: s.storyText, photo: s.photo, status: s.status, featured: s.featured });
    setPhotoPreview(s.photo);
    setModalOpen(true);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", description: "Max 5MB", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = () => { const url = reader.result as string; setPhotoPreview(url); setForm(f => ({ ...f, photo: url })); };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.groomName || !form.brideName || !form.marriageDate || !form.storyText) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" }); return;
    }
    if (editingId) {
      setStories(prev => prev.map(s => s.id === editingId ? { ...s, ...form } : s));
      toast({ title: "Story updated" });
    } else {
      const newStory: Story = { ...form, id: `SS-${String(stories.length + 1).padStart(3, "0")}`, views: 0, createdAt: new Date().toISOString().split("T")[0] };
      setStories(prev => [newStory, ...prev]);
      toast({ title: "Story added" });
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteModal) return;
    setStories(prev => prev.filter(s => s.id !== deleteModal.id));
    toast({ title: "Story deleted" });
    setDeleteModal(null);
  };

  const kpis = [
    { label: "Total Stories", value: stories.length, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { label: "Published", value: published, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Drafts", value: drafts, icon: Edit, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total Views", value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews, icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Heart className="h-6 w-6 text-primary" /> Success Stories</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage couple success stories for the website</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add New Story</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="shadow-elegant border-0">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl ${k.bg} flex items-center justify-center`}>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by names or location..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(story => (
          <Card key={story.id} className="shadow-elegant border-0 overflow-hidden group hover:shadow-lg transition-all duration-300">
            {/* Photo area */}
            <div className="h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center relative">
              {story.photo ? (
                <img src={story.photo} alt="Couple" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-primary/60">
                  <Heart className="h-12 w-12" />
                  <span className="text-xs font-medium">Couple Photo</span>
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-1.5">
                <Badge className={story.status === "Published" ? "bg-emerald-500 text-white border-0" : "bg-amber-400 text-amber-900 border-0"}>
                  {story.status}
                </Badge>
                {story.featured && <Badge className="bg-primary text-primary-foreground border-0"><Star className="h-3 w-3 mr-1" />Featured</Badge>}
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">{story.groomName} & {story.brideName}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(story.marriageDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  {story.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{story.location}</span>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{story.storyText}</p>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" />{story.views} views</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setViewModal(story)}><Eye className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(story)}><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteModal(story)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No stories found</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary" />{editingId ? "Edit Story" : "Add New Success Story"}</DialogTitle>
            <DialogDescription>Fill in the couple's details and their success story</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Groom's Name *</Label><Input value={form.groomName} onChange={e => setForm(f => ({ ...f, groomName: e.target.value }))} placeholder="Enter groom's name" /></div>
              <div><Label>Bride's Name *</Label><Input value={form.brideName} onChange={e => setForm(f => ({ ...f, brideName: e.target.value }))} placeholder="Enter bride's name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Marriage Date *</Label><Input type="date" value={form.marriageDate} onChange={e => setForm(f => ({ ...f, marriageDate: e.target.value }))} /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City" /></div>
            </div>
            <div>
              <Label>Couple Photo (JPG/PNG/WEBP, max 5MB)</Label>
              <div className="mt-1.5 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => document.getElementById("photo-upload")?.click()}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-32 mx-auto rounded-lg object-cover" />
                ) : (
                  <div className="text-muted-foreground"><ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" /><p className="text-sm">Click or drag photo here</p></div>
                )}
                <input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhoto} />
              </div>
            </div>
            <div>
              <Label>Success Story *</Label>
              <Textarea value={form.storyText} onChange={e => setForm(f => ({ ...f, storyText: e.target.value }))} placeholder="Write the couple's success story..." rows={5} />
              <p className="text-xs text-muted-foreground mt-1">{form.storyText.length} characters · 150-300 words recommended</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: "Draft" | "Published") => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} />
                <Label className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-500" /> Featured Story</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="gap-2"><Heart className="h-4 w-4" />{editingId ? "Update Story" : "Save Success Story"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewModal} onOpenChange={() => setViewModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Story Preview</DialogTitle>
            <DialogDescription>Viewing success story details</DialogDescription>
          </DialogHeader>
          {viewModal && (
            <div className="space-y-4">
              <div className="h-48 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center overflow-hidden">
                {viewModal.photo ? <img src={viewModal.photo} alt="Couple" className="w-full h-full object-cover" /> : <Heart className="h-16 w-16 text-primary/40" />}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground">{viewModal.groomName} & {viewModal.brideName}</h3>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(viewModal.marriageDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                  {viewModal.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{viewModal.location}</span>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{viewModal.storyText}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                <Badge className={viewModal.status === "Published" ? "bg-emerald-500 text-white border-0" : "bg-amber-400 text-amber-900 border-0"}>{viewModal.status}</Badge>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{viewModal.views} views</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Story?</DialogTitle>
            <DialogDescription>This will permanently remove "{deleteModal?.groomName} & {deleteModal?.brideName}" story. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}