import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { fetchBranchList } from "@/lib/admin-api/branches";
import {
  createStaff,
  deleteStaff,
  downloadStaffReportPdf,
  fetchAdminStaffList,
  fetchBranchStaffList,
  fetchStaffDetail,
  toggleStaffStatus,
  updateStaff,
  type StaffListRow,
} from "@/lib/admin-api/staff";
import { useRole } from "@/contexts/RoleContext";
import {
  Plus,
  Edit,
  Search,
  User,
  Briefcase,
  MapPin,
  Landmark,
  Upload,
  Trash2,
  Eye,
  FileText,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StaffForm {
  name: string;
  empCode: string;
  mobile: string;
  email: string;
  profilePhoto: string;
  branchId: string;
  designation: string;
  role: "staff" | "branch_manager";
  department: string;
  joiningDate: string;
  salary: number;
  commissionRate: number;
  target: number;
  status: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  pfNumber: string;
  esiNumber: string;
}

const emptyForm = (): StaffForm => ({
  name: "",
  empCode: "",
  mobile: "",
  email: "",
  profilePhoto: "",
  branchId: "",
  designation: "",
  role: "staff",
  department: "",
  joiningDate: "",
  salary: 0,
  commissionRate: 0,
  target: 0,
  status: "active",
  address: "",
  city: "",
  state: "",
  pincode: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  upiId: "",
  pfNumber: "",
  esiNumber: "",
});

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function StaffManagement() {
  const { role } = useRole();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("20");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffListRow | null>(null);
  const [viewStaff, setViewStaff] = useState<StaffListRow | null>(null);
  const [viewDetail, setViewDetail] = useState<Record<string, unknown> | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("personal");
  const [form, setForm] = useState<StaffForm>(emptyForm());
  const { toast } = useToast();
  const qc = useQueryClient();

  const branchesQuery = useQuery({
    queryKey: ["admin", "branches", "dropdown"],
    queryFn: () => fetchBranchList({ page_size: 200 }),
  });
  const branchOptions = branchesQuery.data?.results ?? [];

  const listQuery = useQuery({
    queryKey: ["staff", "list", role, search, page, pageSize],
    queryFn: () =>
      role === "admin"
        ? fetchAdminStaffList({
            search: search.trim() || undefined,
            page,
            page_size: Number(pageSize),
          })
        : fetchBranchStaffList({
            search: search.trim() || undefined,
            page,
            page_size: Number(pageSize),
          }),
  });

  const staffRows = listQuery.data?.results ?? [];
  const total = listQuery.data?.count ?? 0;
  const canPrev = Boolean(listQuery.data?.previous) && page > 1;
  const canNext = Boolean(listQuery.data?.next);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["staff", "list"] });
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.mobile || !form.branchId || !form.designation) {
        throw new Error("Name, mobile, branch, and designation are required");
      }
      const branch = Number(form.branchId);
      if (editing) {
        const body: Record<string, unknown> = {
          name: form.name,
          mobile: form.mobile.replace(/\D/g, "").slice(0, 10),
          email: form.email || undefined,
          branch,
          designation: form.designation,
          department: form.department || undefined,
          joining_date: form.joiningDate || undefined,
          basic_salary: form.salary,
          commission_rate: form.commissionRate,
          monthly_target: form.target,
          pf_number: form.pfNumber || undefined,
          esi_number: form.esiNumber || undefined,
          street_address: form.address || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          pincode: form.pincode || undefined,
          bank_name: form.bankName || undefined,
          account_number: form.accountNumber || undefined,
          ifsc_code: form.ifsc || undefined,
          upi_id: form.upiId || undefined,
        };
        return updateStaff(editing.id, body);
      }
      const createRole: "staff" | "branch_manager" =
        role === "admin" ? form.role : "staff";
      return createStaff({
        name: form.name,
        mobile: form.mobile.replace(/\D/g, "").slice(0, 10),
        email: form.email || undefined,
        role: createRole,
        branch,
        designation: form.designation,
        department: form.department || undefined,
        joining_date: form.joiningDate || undefined,
        basic_salary: form.salary,
        commission_rate: form.commissionRate,
        monthly_target: form.target,
        pf_number: form.pfNumber || undefined,
        esi_number: form.esiNumber || undefined,
        street_address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        bank_name: form.bankName || undefined,
        account_number: form.accountNumber || undefined,
        ifsc_code: form.ifsc || undefined,
        upi_id: form.upiId || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: editing ? "Staff updated" : "Staff created" });
      setDialogOpen(false);
      invalidate();
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteStaff(id),
    onSuccess: () => {
      toast({ title: "Staff removed" });
      invalidate();
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => toggleStaffStatus(id),
    onSuccess: () => {
      toast({ title: "Status updated" });
      invalidate();
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const reportMut = useMutation({
    mutationFn: (id: number) => downloadStaffReportPdf(id),
    onError: (e: Error) =>
      toast({
        title: "Download failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setActiveTab("personal");
    setDialogOpen(true);
  };

  const openEdit = async (s: StaffListRow) => {
    setEditing(s);
    setActiveTab("personal");
    try {
      const d = (await fetchStaffDetail(s.id)) as Record<string, unknown>;
      const mobile = String(d.mobile ?? "")
        .replace(/\D/g, "")
        .slice(-10);
      setForm({
        ...emptyForm(),
        name: String(d.name ?? s.name),
        empCode: String(d.emp_code ?? s.emp_code),
        mobile,
        email: String(d.email ?? ""),
        branchId: String(d.branch ?? s.branch),
        designation: String(d.designation ?? s.designation),
        role:
          String(d.role ?? "staff") === "branch_manager"
            ? "branch_manager"
            : "staff",
        department: String(d.department ?? ""),
        joiningDate: String(d.joining_date ?? "").slice(0, 10),
        salary: Number(d.basic_salary ?? s.basic_salary) || 0,
        commissionRate: Number(d.commission_rate ?? s.commission_rate) || 0,
        target: Number(d.monthly_target ?? s.target_progress?.target) || 0,
        status: s.status,
        address: String(d.street_address ?? ""),
        city: String(d.city ?? ""),
        state: String(d.state ?? ""),
        pincode: String(d.pincode ?? ""),
        bankName: String(d.bank_name ?? ""),
        accountNumber: String(d.account_number ?? ""),
        ifsc: String(d.ifsc_code ?? ""),
        upiId: String(d.upi_id ?? ""),
        pfNumber: String(d.pf_number ?? ""),
        esiNumber: String(d.esi_number ?? ""),
      } as StaffForm);
    } catch {
      setForm({
        ...emptyForm(),
        name: s.name,
        empCode: s.emp_code,
        mobile: "",
        branchId: String(s.branch),
        designation: s.designation,
        salary: Number(s.basic_salary) || 0,
        commissionRate: Number(s.commission_rate) || 0,
        target: s.target_progress?.target ?? 0,
        status: s.status,
      });
    }
    setDialogOpen(true);
  };

  const openView = async (s: StaffListRow) => {
    setViewStaff(s);
    try {
      const d = await fetchStaffDetail(s.id);
      setViewDetail(d as Record<string, unknown>);
    } catch {
      setViewDetail(null);
    }
  };

  const update = (field: keyof StaffForm, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage consultants and their performance
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      {listQuery.error && (
        <p className="text-sm text-destructive">
          {(listQuery.error as Error).message}
        </p>
      )}

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm flex items-center gap-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="pl-9"
            />
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
            {listQuery.isLoading && (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            )}
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
                <TableHead>Status</TableHead>
                <TableHead>Report</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffRows.map((s) => {
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">
                      {s.emp_code}
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.branch_name}</TableCell>
                    <TableCell>{s.designation}</TableCell>
                    <TableCell>
                      ₹{Number(s.basic_salary).toLocaleString()}
                    </TableCell>
                    <TableCell>{s.commission_rate}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === "active" ? "default" : "secondary"
                        }
                        className={
                          s.status === "active"
                            ? "bg-success text-success-foreground"
                            : ""
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => reportMut.mutate(s.id)}
                        disabled={reportMut.isPending}
                        title="Download PDF"
                      >
                        <FileText className="h-4 w-4 text-primary" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openView(s)}
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(s)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteMut.mutate(s.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => toggleMut.mutate(s.id)}
                          disabled={toggleMut.isPending}
                        >
                          {s.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {staffRows.length} of {total} records
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-bold">
              {editing ? "Edit Staff Member" : "Add New Staff Member"}
            </DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1"
          >
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-4 h-11">
                <TabsTrigger value="personal" className="gap-1.5 text-xs">
                  <User className="h-3.5 w-3.5" /> Personal
                </TabsTrigger>
                <TabsTrigger value="employment" className="gap-1.5 text-xs">
                  <Briefcase className="h-3.5 w-3.5" /> Employment
                </TabsTrigger>
                <TabsTrigger value="address" className="gap-1.5 text-xs">
                  <MapPin className="h-3.5 w-3.5" /> Address
                </TabsTrigger>
                <TabsTrigger value="bank" className="gap-1.5 text-xs">
                  <Landmark className="h-3.5 w-3.5" /> Bank
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[52vh] px-6 py-4">
              <TabsContent value="personal" className="mt-0 space-y-5">
                <div className="flex items-center gap-6 pb-2">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                    <Upload className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <FormField label="Full Name" required>
                      <Input
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        placeholder="Enter full name"
                      />
                    </FormField>
                    <FormField label="Employee Code" required>
                      <Input
                        value={form.empCode}
                        onChange={(e) => update("empCode", e.target.value)}
                        placeholder="Auto on create"
                        disabled={!editing}
                      />
                    </FormField>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Mobile Number" required>
                    <Input
                      value={form.mobile}
                      onChange={(e) => update("mobile", e.target.value)}
                      placeholder="10-digit mobile"
                    />
                  </FormField>
                  <FormField label="Email Address">
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                    />
                  </FormField>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Branch" required>
                    <Select
                      value={form.branchId}
                      onValueChange={(v) => update("branchId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branchOptions.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Designation" required>
                    <Input
                      value={form.designation}
                      onChange={(e) => update("designation", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Role">
                    <Select
                      value={role === "admin" ? form.role : "staff"}
                      onValueChange={(v) =>
                        update("role", v as StaffForm["role"])
                      }
                      disabled={role !== "admin"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="branch_manager">
                          Branch Manager
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Department">
                    <Input
                      value={form.department}
                      onChange={(e) => update("department", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Joining Date">
                    <Input
                      type="date"
                      value={form.joiningDate}
                      onChange={(e) => update("joiningDate", e.target.value)}
                    />
                  </FormField>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Salary (₹)">
                    <Input
                      type="number"
                      value={form.salary || ""}
                      onChange={(e) => update("salary", +e.target.value)}
                    />
                  </FormField>
                  <FormField label="Commission %">
                    <Input
                      type="number"
                      value={form.commissionRate || ""}
                      onChange={(e) =>
                        update("commissionRate", +e.target.value)
                      }
                    />
                  </FormField>
                  <FormField label="Monthly Target">
                    <Input
                      type="number"
                      value={form.target || ""}
                      onChange={(e) => update("target", +e.target.value)}
                    />
                  </FormField>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="PF Number">
                    <Input
                      value={form.pfNumber}
                      onChange={(e) => update("pfNumber", e.target.value)}
                    />
                  </FormField>
                  <FormField label="ESI Number">
                    <Input
                      value={form.esiNumber}
                      onChange={(e) => update("esiNumber", e.target.value)}
                    />
                  </FormField>
                </div>
              </TabsContent>

              <TabsContent value="address" className="mt-0 space-y-4">
                <FormField label="Street Address">
                  <Input
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                  />
                </FormField>
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="City">
                    <Input
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                    />
                  </FormField>
                  <FormField label="State">
                    <Input
                      value={form.state}
                      onChange={(e) => update("state", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Pincode">
                    <Input
                      value={form.pincode}
                      onChange={(e) => update("pincode", e.target.value)}
                      maxLength={6}
                    />
                  </FormField>
                </div>
              </TabsContent>

              <TabsContent value="bank" className="mt-0 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Bank Name">
                    <Input
                      value={form.bankName}
                      onChange={(e) => update("bankName", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Account Number">
                    <Input
                      value={form.accountNumber}
                      onChange={(e) => update("accountNumber", e.target.value)}
                    />
                  </FormField>
                  <FormField label="IFSC Code">
                    <Input
                      value={form.ifsc}
                      onChange={(e) => update("ifsc", e.target.value)}
                    />
                  </FormField>
                  <FormField label="UPI ID">
                    <Input
                      value={form.upiId}
                      onChange={(e) => update("upiId", e.target.value)}
                    />
                  </FormField>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending}
              >
                {saveMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editing ? (
                  "Update Staff"
                ) : (
                  "Create Staff"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewStaff}
        onOpenChange={() => {
          setViewStaff(null);
          setViewDetail(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Staff Details
            </DialogTitle>
          </DialogHeader>
          {viewStaff && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-bold text-lg">{viewStaff.name}</p>
                <p className="text-muted-foreground">
                  {viewStaff.emp_code} · {viewStaff.designation} ·{" "}
                  {viewStaff.branch_name}
                </p>
              </div>

              {!viewDetail && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading
                  details...
                </div>
              )}

              {viewDetail && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Mobile</p>
                      <p className="font-medium">
                        {String(viewDetail.mobile ?? "—")}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium break-all">
                        {String(viewDetail.email ?? "—")}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">
                        Department
                      </p>
                      <p className="font-medium">
                        {String(viewDetail.department ?? "—")}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">
                        Joining Date
                      </p>
                      <p className="font-medium">
                        {String(viewDetail.joining_date ?? "—").slice(0, 10) ||
                          "—"}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">
                        Basic Salary
                      </p>
                      <p className="font-medium">
                        ₹{Number(viewDetail.basic_salary ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">
                        Commission Rate
                      </p>
                      <p className="font-medium">
                        {String(viewDetail.commission_rate ?? "0")}%
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">
                        Monthly Target
                      </p>
                      <p className="font-medium">
                        {String(viewDetail.monthly_target ?? "—")}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">
                        {String(viewDetail.status ?? viewStaff.status ?? "—")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Address
                    </p>
                    <p className="font-medium">
                      {[
                        viewDetail.street_address,
                        viewDetail.city,
                        viewDetail.state,
                        viewDetail.pincode,
                      ]
                        .filter(Boolean)
                        .map((v) => String(v))
                        .join(", ") || "—"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Bank Name</p>
                      <p className="font-medium">
                        {String(viewDetail.bank_name ?? "—")}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">
                        Account Number
                      </p>
                      <p className="font-medium">
                        {String(viewDetail.account_number ?? "—")}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">IFSC</p>
                      <p className="font-medium">
                        {String(viewDetail.ifsc_code ?? "—")}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">UPI ID</p>
                      <p className="font-medium">
                        {String(viewDetail.upi_id ?? "—")}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
