import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { staffMembers as initialStaff, branches } from "@/data/mockData";
import { Plus, Edit, Search, User, Briefcase, MapPin, Landmark, Upload, Trash2, Eye, FileText, BarChart3, MapPinned } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface StaffForm {
  name: string;
  empCode: string;
  mobile: string;
  email: string;
  profilePhoto: string;
  branch: string;
  designation: string;
  department: string;
  joiningDate: string;
  salary: number;
  commissionRate: number;
  target: number;
  username: string;
  password: string;
  role: string;
  status: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
}

const emptyForm: StaffForm = {
  name: "", empCode: "", mobile: "", email: "", profilePhoto: "",
  branch: "", designation: "", department: "", joiningDate: "",
  salary: 0, commissionRate: 0, target: 0,
  username: "", password: "", role: "staff", status: "active",
  address: "", city: "", state: "", pincode: "",
  bankName: "", accountNumber: "", ifsc: "", upiId: "",
};

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

// Staff report mock data
const staffReports: Record<number, { entryDate: string; entries: number; staffId: string }> = {
  1: { entryDate: "2026-03-10 09:15 AM", entries: 42, staffId: "STF-001" },
  2: { entryDate: "2026-03-10 10:30 AM", entries: 38, staffId: "STF-002" },
  3: { entryDate: "2026-03-09 11:00 AM", entries: 55, staffId: "STF-003" },
  4: { entryDate: "2026-03-09 02:45 PM", entries: 29, staffId: "STF-004" },
  5: { entryDate: "2026-03-08 08:30 AM", entries: 61, staffId: "STF-005" },
};

// District analytics data
const districtData = [
  { district: "Malappuram", registrations: 245, payments: 189000, activeProfiles: 198, pendingEnquiries: 32 },
  { district: "Kozhikode", registrations: 198, payments: 156000, activeProfiles: 165, pendingEnquiries: 24 },
  { district: "Thrissur", registrations: 176, payments: 142000, activeProfiles: 148, pendingEnquiries: 19 },
  { district: "Ernakulam", registrations: 210, payments: 178000, activeProfiles: 185, pendingEnquiries: 28 },
  { district: "Palakkad", registrations: 132, payments: 98000, activeProfiles: 110, pendingEnquiries: 15 },
  { district: "Kannur", registrations: 145, payments: 112000, activeProfiles: 120, pendingEnquiries: 18 },
  { district: "Thiruvananthapuram", registrations: 188, payments: 165000, activeProfiles: 160, pendingEnquiries: 22 },
  { district: "Kollam", registrations: 95, payments: 72000, activeProfiles: 78, pendingEnquiries: 11 },
];

const districtChartData = districtData.map(d => ({ name: d.district, registrations: d.registrations, payments: Math.round(d.payments / 1000) }));

export default function StaffManagement() {
  const [staff, setStaff] = useState(initialStaff);
  const [viewStaff, setViewStaff] = useState<typeof initialStaff[0] | null>(null);
  const [reportStaff, setReportStaff] = useState<typeof initialStaff[0] | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<typeof initialStaff[0] | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const { toast } = useToast();

  const [form, setForm] = useState<StaffForm>(emptyForm);

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.branch.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setActiveTab("personal");
    setDialogOpen(true);
  };

  const openEdit = (s: typeof initialStaff[0]) => {
    setEditing(s);
    setForm({
      ...emptyForm,
      name: s.name, empCode: s.empCode, branch: s.branch,
      designation: s.designation, salary: s.salary,
      commissionRate: s.commissionRate, target: s.target,
      status: s.status,
    });
    setActiveTab("personal");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.empCode || !form.branch || !form.mobile) {
      toast({ title: "Validation Error", description: "Fill all required fields (Name, Emp Code, Branch, Mobile)", variant: "destructive" });
      return;
    }
    if (editing) {
      setStaff((prev) => prev.map((s) => s.id === editing.id ? {
        ...s, name: form.name, empCode: form.empCode, branch: form.branch,
        designation: form.designation, salary: form.salary,
        commissionRate: form.commissionRate, target: form.target,
        status: form.status as "active" | "inactive",
      } : s));
      toast({ title: "Staff Updated", description: `${form.name} updated successfully` });
    } else {
      setStaff((prev) => [...prev, {
        name: form.name, empCode: form.empCode, branch: form.branch,
        designation: form.designation, salary: form.salary,
        commissionRate: form.commissionRate, target: form.target,
        id: Date.now(), achieved: 0, status: "active" as const,
      }]);
      toast({ title: "Staff Added", description: `${form.name} has been added successfully` });
    }
    setDialogOpen(false);
  };

  const handleDelete = (s: typeof initialStaff[0]) => {
    setStaff((prev) => prev.filter((item) => item.id !== s.id));
    toast({ title: "Staff Deleted", description: `${s.name} has been removed` });
  };

  const update = (field: keyof StaffForm, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage consultants and their performance</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add Staff</Button>
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emp Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Designation</TableHead>
                
                <TableHead>Salary</TableHead>
                <TableHead>Commission %</TableHead>
                <TableHead>Target Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const report = staffReports[s.id] || { entryDate: "N/A", entries: 0, staffId: `STF-${String(s.id).padStart(3, "0")}` };
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.empCode}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.branch}</TableCell>
                    <TableCell>{s.designation}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setReportStaff(s)} title="View Report">
                        <FileText className="h-4 w-4 text-primary" />
                      </Button>
                    </TableCell>
                    <TableCell>₹{s.salary.toLocaleString()}</TableCell>
                    <TableCell>{s.commissionRate}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={(s.achieved / s.target) * 100} className="h-2 w-20" />
                        <span className="text-xs text-muted-foreground">{s.achieved}/{s.target}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === "active" ? "default" : "secondary"} className={s.status === "active" ? "bg-success text-success-foreground" : ""}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewStaff(s)} title="View">
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)} title="Edit">
                          <Edit className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(s)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-bold">{editing ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-4 h-11">
                <TabsTrigger value="personal" className="gap-1.5 text-xs"><User className="h-3.5 w-3.5" /> Personal</TabsTrigger>
                <TabsTrigger value="employment" className="gap-1.5 text-xs"><Briefcase className="h-3.5 w-3.5" /> Employment</TabsTrigger>
                <TabsTrigger value="address" className="gap-1.5 text-xs"><MapPin className="h-3.5 w-3.5" /> Address</TabsTrigger>
                <TabsTrigger value="bank" className="gap-1.5 text-xs"><Landmark className="h-3.5 w-3.5" /> Bank & Login</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[52vh] px-6 py-4">
              {/* ── Personal Info ── */}
              <TabsContent value="personal" className="mt-0 space-y-5">
                <div className="flex items-center gap-6 pb-2">
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30 overflow-hidden">
                      {form.profilePhoto ? (
                        <img src={form.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-1">Profile Photo</p>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <FormField label="Full Name" required>
                      <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Enter full name" />
                    </FormField>
                    <FormField label="Employee Code" required>
                      <Input value={form.empCode} onChange={(e) => update("empCode", e.target.value)} placeholder="e.g. EMP007" />
                    </FormField>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Mobile Number" required>
                    <Input value={form.mobile} onChange={(e) => update("mobile", e.target.value)} placeholder="+91 9876543210" />
                  </FormField>
                  <FormField label="Email Address">
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="staff@aiswarya.com" />
                  </FormField>
                </div>
              </TabsContent>

              {/* ── Employment Details ── */}
              <TabsContent value="employment" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Branch" required>
                    <Select value={form.branch} onValueChange={(v) => update("branch", v)}>
                      <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Designation">
                    <Select value={form.designation} onValueChange={(v) => update("designation", v)}>
                      <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Senior Consultant">Senior Consultant</SelectItem>
                        <SelectItem value="Consultant">Consultant</SelectItem>
                        <SelectItem value="Junior Consultant">Junior Consultant</SelectItem>
                        <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                        <SelectItem value="Telecaller">Telecaller</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Department">
                    <Select value={form.department} onValueChange={(v) => update("department", v)}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Support">Support</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Joining Date">
                    <Input type="date" value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} />
                  </FormField>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Salary (₹)">
                    <Input type="number" value={form.salary || ""} onChange={(e) => update("salary", +e.target.value)} placeholder="0" />
                  </FormField>
                  <FormField label="Commission %">
                    <Input type="number" value={form.commissionRate || ""} onChange={(e) => update("commissionRate", +e.target.value)} placeholder="0" />
                  </FormField>
                  <FormField label="Monthly Target">
                    <Input type="number" value={form.target || ""} onChange={(e) => update("target", +e.target.value)} placeholder="0" />
                  </FormField>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Role">
                    <Select value={form.role} onValueChange={(v) => update("role", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="branch-manager">Branch Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Status">
                    <Select value={form.status} onValueChange={(v) => update("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </TabsContent>

              {/* ── Address ── */}
              <TabsContent value="address" className="mt-0 space-y-4">
                <FormField label="Street Address">
                  <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Door No, Street, Area" />
                </FormField>
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="City">
                    <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City" />
                  </FormField>
                  <FormField label="State">
                    <Input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="State" />
                  </FormField>
                  <FormField label="Pincode">
                    <Input value={form.pincode} onChange={(e) => update("pincode", e.target.value)} placeholder="600001" maxLength={6} />
                  </FormField>
                </div>
              </TabsContent>

              {/* ── Bank & Login ── */}
              <TabsContent value="bank" className="mt-0 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" /> Bank Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Bank Name">
                      <Input value={form.bankName} onChange={(e) => update("bankName", e.target.value)} placeholder="e.g. State Bank of India" />
                    </FormField>
                    <FormField label="Account Number">
                      <Input value={form.accountNumber} onChange={(e) => update("accountNumber", e.target.value)} placeholder="Account number" />
                    </FormField>
                    <FormField label="IFSC Code">
                      <Input value={form.ifsc} onChange={(e) => update("ifsc", e.target.value)} placeholder="e.g. SBIN0001234" />
                    </FormField>
                    <FormField label="UPI ID">
                      <Input value={form.upiId} onChange={(e) => update("upiId", e.target.value)} placeholder="name@upi" />
                    </FormField>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Login Credentials</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Username" required>
                      <Input value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="Login username" />
                    </FormField>
                    <FormField label="Password" required>
                      <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="••••••••" />
                    </FormField>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-1">
                {["personal", "employment", "address", "bank"].map((tab) => (
                  <div key={tab} className={`h-1.5 w-8 rounded-full transition-colors ${activeTab === tab ? "bg-primary" : "bg-muted-foreground/20"}`} />
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>{editing ? "Update Staff" : "Create Staff"}</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Staff Dialog */}
      <Dialog open={!!viewStaff} onOpenChange={() => setViewStaff(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Staff Details</DialogTitle>
          </DialogHeader>
          {viewStaff && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 pb-3 border-b border-border">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">{viewStaff.name}</p>
                  <p className="text-sm text-muted-foreground">{viewStaff.empCode} · {viewStaff.designation}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Branch</p><p className="font-medium">{viewStaff.branch}</p></div>
                <div><p className="text-muted-foreground text-xs">Salary</p><p className="font-medium">₹{viewStaff.salary.toLocaleString()}</p></div>
                <div><p className="text-muted-foreground text-xs">Commission</p><p className="font-medium">{viewStaff.commissionRate}%</p></div>
                <div><p className="text-muted-foreground text-xs">Target</p><p className="font-medium">{viewStaff.achieved}/{viewStaff.target}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p>
                  <Badge variant={viewStaff.status === "active" ? "default" : "secondary"} className={viewStaff.status === "active" ? "bg-success text-success-foreground" : ""}>
                    {viewStaff.status}
                  </Badge>
                </div>
                <div><p className="text-muted-foreground text-xs">Report</p>
                  <p className="font-medium text-xs">{(staffReports[viewStaff.id] || {}).entries || 0} entries</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={!!reportStaff} onOpenChange={() => setReportStaff(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Staff Activity Report
            </DialogTitle>
          </DialogHeader>
          {reportStaff && (() => {
            const report = staffReports[reportStaff.id] || { entryDate: "N/A", entries: 0, staffId: `STF-${String(reportStaff.id).padStart(3, "0")}` };
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">{reportStaff.name}</p>
                    <p className="text-xs text-muted-foreground">{reportStaff.empCode} · {reportStaff.branch}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Staff Identifier</span>
                    <span className="font-mono font-semibold text-sm">{report.staffId}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Entry Date/Time</span>
                    <span className="font-medium text-sm">{report.entryDate}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Number of Entries</span>
                    <span className="font-bold text-lg text-primary">{report.entries}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* District-wise Analytics Dashboard */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-primary" />
            District-wise Analytics Dashboard
          </CardTitle>
          <p className="text-xs text-muted-foreground">Front-view data organized by district — registrations, payments & activity metrics</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chart */}
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={districtChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" />
              <Tooltip />
              <Bar dataKey="registrations" name="Registrations" fill="hsl(333, 60%, 34%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="payments" name="Payments (₹K)" fill="hsl(40, 100%, 58%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Registrations</TableHead>
                <TableHead className="text-right">Payments (₹)</TableHead>
                <TableHead className="text-right">Active Profiles</TableHead>
                <TableHead className="text-right">Pending Enquiries</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {districtData.map((d) => (
                <TableRow key={d.district}>
                  <TableCell className="font-medium">{d.district}</TableCell>
                  <TableCell className="text-right">{d.registrations}</TableCell>
                  <TableCell className="text-right">₹{d.payments.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{d.activeProfiles}</TableCell>
                  <TableCell className="text-right">{d.pendingEnquiries}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{districtData.reduce((a, d) => a + d.registrations, 0)}</TableCell>
                <TableCell className="text-right">₹{districtData.reduce((a, d) => a + d.payments, 0).toLocaleString()}</TableCell>
                <TableCell className="text-right">{districtData.reduce((a, d) => a + d.activeProfiles, 0)}</TableCell>
                <TableCell className="text-right">{districtData.reduce((a, d) => a + d.pendingEnquiries, 0)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
