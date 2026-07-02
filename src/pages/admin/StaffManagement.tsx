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
import { PhoneInput } from "@/components/ui/phone-input";
import { formatPhoneForApi } from "@/lib/phone";
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
import { ApiError } from "@/lib/admin-api/http";
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
import { formatDate } from "@/lib/format-date";
import { API_BASE_URL } from "@/lib/config";

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

/** Tab that each form field lives on (for jumping to the first error). */
const FIELD_TAB: Partial<Record<keyof StaffForm, string>> = {
  name: "personal",
  empCode: "personal",
  mobile: "personal",
  email: "personal",
  branchId: "employment",
  designation: "employment",
  role: "employment",
  department: "employment",
  joiningDate: "employment",
  salary: "employment",
  commissionRate: "employment",
  target: "employment",
  address: "details",
  city: "details",
  state: "details",
  pincode: "details",
  bankName: "details",
  accountNumber: "details",
  ifsc: "details",
  upiId: "details",
  pfNumber: "details",
  esiNumber: "details",
};

/** Map backend (API) field names to the local form field keys for inline error display. */
const API_FIELD_TO_FORM: Record<string, keyof StaffForm> = {
  name: "name",
  mobile: "mobile",
  email: "email",
  branch: "branchId",
  designation: "designation",
  department: "department",
  joining_date: "joiningDate",
  basic_salary: "salary",
  commission_rate: "commissionRate",
  monthly_target: "target",
  pf_number: "pfNumber",
  esi_number: "esiNumber",
  street_address: "address",
  city: "city",
  state: "state",
  pincode: "pincode",
  bank_name: "bankName",
  account_number: "accountNumber",
  ifsc_code: "ifsc",
  upi_id: "upiId",
  role: "role",
};

/** Convert ApiError.details into inline field errors keyed by local form field. */
function mapApiDetailsToFieldErrors(
  details: Record<string, string[] | string>,
): Partial<Record<keyof StaffForm, string>> {
  const out: Partial<Record<keyof StaffForm, string>> = {};
  for (const [apiField, msg] of Object.entries(details)) {
    const formKey = API_FIELD_TO_FORM[apiField];
    if (!formKey) continue;
    out[formKey] = Array.isArray(msg) ? msg.join(" ") : String(msg);
  }
  return out;
}

function resolveMediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = API_BASE_URL.replace(/\/?$/, "/").replace(/\/api\/?$/, "/");
  return `${origin}${path.replace(/^\//, "")}`;
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
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ViewField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "");
  return (
    <div className={`rounded-lg border bg-card p-3 ${className ?? ""}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold break-words">
        {isEmpty ? "—" : value}
      </p>
    </div>
  );
}

function ViewSectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {children}
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
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof StaffForm, string>>
  >({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
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

  const buildPayload = (): Record<string, unknown> => {
    const branch = Number(form.branchId);
    const mobile = formatPhoneForApi(form.mobile);
    const payload: Record<string, unknown> = {
      name: form.name,
      mobile,
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
    if (role === "admin") {
      payload.role = form.role;
    } else if (!editing) {
      payload.role = "staff";
    }
    return payload;
  };

  const toRequestBody = (payload: Record<string, unknown>) => {
    if (!photoFile) return payload;
    const fd = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null && value !== "") {
        fd.append(key, String(value));
      }
    }
    fd.append("profile_photo", photoFile);
    return fd;
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.mobile || !form.branchId || !form.designation) {
        throw new Error("Name, mobile, branch, and designation are required");
      }
      const body = toRequestBody(buildPayload());
      if (editing) {
        return updateStaff(editing.id, body);
      }
      return createStaff(body as Parameters<typeof createStaff>[0]);
    },
    onSuccess: () => {
      toast({ title: editing ? "Staff updated" : "Staff created" });
      setDialogOpen(false);
      invalidate();
    },
    onError: (e: Error) => {
      if (e instanceof ApiError && e.details) {
        const mapped = mapApiDetailsToFieldErrors(e.details);
        const keys = Object.keys(mapped) as (keyof StaffForm)[];
        if (keys.length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...mapped }));
          const tab = FIELD_TAB[keys[0]];
          if (tab) setActiveTab(tab);
          toast({
            title: "Please fix the highlighted fields",
            description: mapped[keys[0]],
            variant: "destructive",
          });
          return;
        }
      }
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
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

  const resetPhotoState = () => {
    setPhotoFile(null);
    setPhotoPreview("");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFieldErrors({});
    resetPhotoState();
    setActiveTab("personal");
    setDialogOpen(true);
  };

  const openEdit = async (s: StaffListRow) => {
    setEditing(s);
    setFieldErrors({});
    resetPhotoState();
    setActiveTab("personal");
    try {
      const d = (await fetchStaffDetail(s.id)) as Record<string, unknown>;
      const mobile = String(d.mobile ?? "")
        .replace(/\D/g, "")
        .slice(-10);
      const targetProgress = d.target_progress as
        | { target?: number }
        | undefined;
      setForm({
        ...emptyForm(),
        name: String(d.name ?? s.name),
        empCode: String(d.emp_code ?? s.emp_code),
        mobile,
        email: String(d.email ?? ""),
        profilePhoto: resolveMediaUrl(String(d.profile_photo ?? "")),
        branchId: String(d.branch ?? s.branch),
        designation: String(d.designation ?? s.designation),
        role:
          String(d.account_role ?? d.role ?? "staff") === "branch_manager"
            ? "branch_manager"
            : "staff",
        department: String(d.department ?? ""),
        joiningDate: String(d.joining_date ?? "").slice(0, 10),
        salary: Number(d.basic_salary ?? s.basic_salary) || 0,
        commissionRate: Number(d.commission_rate ?? s.commission_rate) || 0,
        target: Number(d.monthly_target ?? targetProgress?.target) || 0,
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

  const update = (field: keyof StaffForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const todayISO = new Date().toLocaleDateString("en-CA");

  const validate = () => {
    const errs: Partial<Record<keyof StaffForm, string>> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (editing && !form.empCode.trim())
      errs.empCode = "Employee code is required";
    if (!form.mobile.trim()) errs.mobile = "Mobile number is required";
    else if (form.mobile.replace(/\D/g, "").length !== 10)
      errs.mobile = "Mobile number must be exactly 10 digits";
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    )
      errs.email = "Enter a valid email address";
    if (!form.branchId) errs.branchId = "Branch is required";
    if (!form.designation.trim()) errs.designation = "Designation is required";
    if (form.joiningDate && form.joiningDate > todayISO)
      errs.joiningDate = "Joining date cannot be in the future";
    if (!form.address.trim()) errs.address = "Street address is required";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.state.trim()) errs.state = "State is required";
    if (!form.pincode.trim()) errs.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(form.pincode.trim()))
      errs.pincode = "Pincode must be 6 digits";
    if (!form.bankName.trim()) errs.bankName = "Bank name is required";
    if (!form.accountNumber.trim())
      errs.accountNumber = "Account number is required";
    if (!form.ifsc.trim()) errs.ifsc = "IFSC code is required";
    if (!form.upiId.trim()) errs.upiId = "UPI ID is required";
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    setFieldErrors(errs);
    const keys = Object.keys(errs) as (keyof StaffForm)[];
    if (keys.length > 0) {
      const firstTab = FIELD_TAB[keys[0]];
      if (firstTab) setActiveTab(firstTab);
      return;
    }
    saveMut.mutate();
  };

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
            {listQuery.isLoading && (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
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
                    <TableCell>
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden border shrink-0">
                        {s.profile_photo ? (
                          <img
                            src={resolveMediaUrl(s.profile_photo)}
                            alt={s.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {s.name
                              .split(" ")
                              .map((p) => p[0])
                              .filter(Boolean)
                              .slice(0, 2)
                              .join("")
                              .toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                    </TableCell>
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
          className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
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
              <TabsList className="grid w-full grid-cols-3 h-11">
                <TabsTrigger value="personal" className="gap-1.5 text-xs">
                  <User className="h-3.5 w-3.5" /> Personal
                </TabsTrigger>
                <TabsTrigger value="employment" className="gap-1.5 text-xs">
                  <Briefcase className="h-3.5 w-3.5" /> Employment
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-1.5 text-xs">
                  <MapPin className="h-3.5 w-3.5" /> Address &amp; Bank
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[52vh] px-6 py-4">
              <TabsContent value="personal" className="mt-0 space-y-5">
                <div className="flex items-center gap-6 pb-2">
                  <label className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30 cursor-pointer overflow-hidden shrink-0 hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handlePhotoChange}
                    />
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : form.profilePhoto ? (
                      <img
                        src={form.profilePhoto}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground/50" />
                    )}
                  </label>
                  <div
                    className={`flex-1 grid gap-4 ${editing ? "grid-cols-2" : "grid-cols-1"}`}
                  >
                    <FormField
                      label="Full Name"
                      required
                      error={fieldErrors.name}
                    >
                      <Input
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        placeholder="Enter full name"
                        className={
                          fieldErrors.name
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        aria-invalid={Boolean(fieldErrors.name)}
                      />
                    </FormField>
                    {editing && (
                      <FormField
                        label="Employee Code"
                        required
                        error={fieldErrors.empCode}
                      >
                        <Input
                          value={form.empCode}
                          readOnly
                          tabIndex={-1}
                          className={`bg-muted cursor-not-allowed ${
                            fieldErrors.empCode
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }`}
                          aria-readonly
                          aria-invalid={Boolean(fieldErrors.empCode)}
                        />
                      </FormField>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Mobile Number"
                    required
                    error={fieldErrors.mobile}
                  >
                    <PhoneInput
                      value={form.mobile}
                      onChange={(v) => update("mobile", v)}
                      invalid={Boolean(fieldErrors.mobile)}
                    />
                  </FormField>
                  <FormField label="Email Address" error={fieldErrors.email}>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className={
                        fieldErrors.email
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                      aria-invalid={Boolean(fieldErrors.email)}
                    />
                  </FormField>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Branch"
                    required
                    error={fieldErrors.branchId}
                  >
                    <Select
                      value={form.branchId}
                      onValueChange={(v) => update("branchId", v)}
                    >
                      <SelectTrigger
                        className={
                          fieldErrors.branchId
                            ? "border-destructive focus:ring-destructive"
                            : ""
                        }
                        aria-invalid={Boolean(fieldErrors.branchId)}
                      >
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
                  <FormField
                    label="Designation"
                    required
                    error={fieldErrors.designation}
                  >
                    <Input
                      value={form.designation}
                      onChange={(e) => update("designation", e.target.value)}
                      className={
                        fieldErrors.designation
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                      aria-invalid={Boolean(fieldErrors.designation)}
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
                  <FormField
                    label="Joining Date"
                    error={fieldErrors.joiningDate}
                  >
                    <Input
                      type="date"
                      value={form.joiningDate}
                      max={todayISO}
                      onChange={(e) => update("joiningDate", e.target.value)}
                      className={
                        fieldErrors.joiningDate
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                      aria-invalid={Boolean(fieldErrors.joiningDate)}
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

              <TabsContent value="details" className="mt-0 space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> Address
                  </div>
                  <FormField
                    label="Street Address"
                    required
                    error={fieldErrors.address}
                  >
                    <Input
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      className={
                        fieldErrors.address
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                      aria-invalid={Boolean(fieldErrors.address)}
                    />
                  </FormField>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField label="City" required error={fieldErrors.city}>
                      <Input
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        className={
                          fieldErrors.city
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        aria-invalid={Boolean(fieldErrors.city)}
                      />
                    </FormField>
                    <FormField label="State" required error={fieldErrors.state}>
                      <Input
                        value={form.state}
                        onChange={(e) => update("state", e.target.value)}
                        className={
                          fieldErrors.state
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        aria-invalid={Boolean(fieldErrors.state)}
                      />
                    </FormField>
                    <FormField
                      label="Pincode"
                      required
                      error={fieldErrors.pincode}
                    >
                      <Input
                        value={form.pincode}
                        onChange={(e) =>
                          update(
                            "pincode",
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        inputMode="numeric"
                        maxLength={6}
                        className={
                          fieldErrors.pincode
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        aria-invalid={Boolean(fieldErrors.pincode)}
                      />
                    </FormField>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Landmark className="h-3.5 w-3.5" /> Bank Details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Bank Name"
                      required
                      error={fieldErrors.bankName}
                    >
                      <Input
                        value={form.bankName}
                        onChange={(e) => update("bankName", e.target.value)}
                        className={
                          fieldErrors.bankName
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        aria-invalid={Boolean(fieldErrors.bankName)}
                      />
                    </FormField>
                    <FormField
                      label="Account Number"
                      required
                      error={fieldErrors.accountNumber}
                    >
                      <Input
                        value={form.accountNumber}
                        onChange={(e) =>
                          update("accountNumber", e.target.value)
                        }
                        className={
                          fieldErrors.accountNumber
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        aria-invalid={Boolean(fieldErrors.accountNumber)}
                      />
                    </FormField>
                    <FormField
                      label="IFSC Code"
                      required
                      error={fieldErrors.ifsc}
                    >
                      <Input
                        value={form.ifsc}
                        onChange={(e) => update("ifsc", e.target.value)}
                        className={
                          fieldErrors.ifsc
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        aria-invalid={Boolean(fieldErrors.ifsc)}
                      />
                    </FormField>
                    <FormField
                      label="UPI ID"
                      required
                      error={fieldErrors.upiId}
                    >
                      <Input
                        value={form.upiId}
                        onChange={(e) => update("upiId", e.target.value)}
                        className={
                          fieldErrors.upiId
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        aria-invalid={Boolean(fieldErrors.upiId)}
                      />
                    </FormField>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saveMut.isPending}>
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
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-bold">
              Staff Details
            </DialogTitle>
          </DialogHeader>
          {viewStaff &&
            (() => {
              const mobileRaw = String(viewDetail?.mobile ?? "").replace(
                /\D/g,
                "",
              );
              const mobileDisplay = mobileRaw
                ? `+91 ${mobileRaw.slice(-10)}`
                : "—";
              const roleRaw = String(
                viewDetail?.account_role ?? viewDetail?.role ?? "",
              );
              const roleLabel =
                roleRaw === "branch_manager"
                  ? "Branch Manager"
                  : roleRaw === "staff"
                    ? "Staff"
                    : "—";
              const statusVal = String(
                viewDetail?.status ?? viewStaff.status ?? "",
              );
              const isActive = statusVal.toLowerCase() === "active";
              const photo = resolveMediaUrl(
                String(viewDetail?.profile_photo ?? ""),
              );
              const initials = viewStaff.name
                .split(" ")
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const addressLine = [
                viewDetail?.street_address,
                viewDetail?.city,
                viewDetail?.state,
                viewDetail?.pincode,
              ]
                .filter(Boolean)
                .map((v) => String(v))
                .join(", ");

              return (
                <div className="max-h-[72vh] overflow-y-auto px-6 py-5 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border shrink-0">
                      {photo ? (
                        <img
                          src={photo}
                          alt={viewStaff.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-muted-foreground">
                          {initials || "?"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xl font-bold truncate">
                        {viewStaff.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {viewStaff.emp_code} · {viewStaff.designation} ·{" "}
                        {viewStaff.branch_name}
                      </p>
                    </div>
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className={
                        isActive ? "bg-success text-success-foreground" : ""
                      }
                    >
                      {statusVal || "—"}
                    </Badge>
                  </div>

                  {!viewDetail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading
                      details...
                    </div>
                  )}

                  {viewDetail && (
                    <>
                      <div className="space-y-3">
                        <ViewSectionTitle icon={User}>
                          Personal & Contact
                        </ViewSectionTitle>
                        <div className="grid grid-cols-2 gap-3">
                          <ViewField label="Mobile" value={mobileDisplay} />
                          <ViewField
                            label="Email"
                            value={
                              viewDetail.email ? String(viewDetail.email) : null
                            }
                          />
                          <ViewField label="Role" value={roleLabel} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <ViewSectionTitle icon={Briefcase}>
                          Employment & Compensation
                        </ViewSectionTitle>
                        <div className="grid grid-cols-2 gap-3">
                          <ViewField
                            label="Branch"
                            value={viewStaff.branch_name}
                          />
                          <ViewField
                            label="Designation"
                            value={String(viewDetail.designation ?? "")}
                          />
                          <ViewField
                            label="Department"
                            value={String(viewDetail.department ?? "")}
                          />
                          <ViewField
                            label="Joining Date"
                            value={formatDate(viewDetail.joining_date)}
                          />
                          <ViewField
                            label="Basic Salary"
                            value={`₹${Number(
                              viewDetail.basic_salary ?? 0,
                            ).toLocaleString()}`}
                          />
                          <ViewField
                            label="Commission Rate"
                            value={`${String(viewDetail.commission_rate ?? "0")}%`}
                          />
                          <ViewField
                            label="Monthly Target"
                            value={String(viewDetail.monthly_target ?? "")}
                          />
                          <ViewField
                            label="PF Number"
                            value={String(viewDetail.pf_number ?? "")}
                          />
                          <ViewField
                            label="ESI Number"
                            value={String(viewDetail.esi_number ?? "")}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <ViewSectionTitle icon={MapPin}>
                          Address
                        </ViewSectionTitle>
                        <ViewField
                          label="Full Address"
                          value={addressLine || null}
                          className="col-span-2"
                        />
                      </div>

                      <div className="space-y-3">
                        <ViewSectionTitle icon={Landmark}>
                          Bank Details
                        </ViewSectionTitle>
                        <div className="grid grid-cols-2 gap-3">
                          <ViewField
                            label="Bank Name"
                            value={String(viewDetail.bank_name ?? "")}
                          />
                          <ViewField
                            label="Account Number"
                            value={String(viewDetail.account_number ?? "")}
                          />
                          <ViewField
                            label="IFSC"
                            value={String(viewDetail.ifsc_code ?? "")}
                          />
                          <ViewField
                            label="UPI ID"
                            value={String(viewDetail.upi_id ?? "")}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
