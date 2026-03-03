import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { salaryRecords as initialRecords, staffMembers } from "@/data/mockData";
import { Download, FileText, CheckSquare, IndianRupee, Users, TrendingUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-info text-info-foreground",
  paid: "bg-success text-success-foreground",
};

export default function SalaryPayroll() {
  const [records, setRecords] = useState(initialRecords);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [genMonth, setGenMonth] = useState("March");
  const [genYear, setGenYear] = useState("2026");
  const { toast } = useToast();

  const updateStatus = (id: number, status: "approved" | "paid") => {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status: status as any } : r));
    toast({ title: `Salary ${status}`, description: `Record ${status} successfully` });
  };

  const generateSalary = () => {
    // Generate new draft salary records for staff who don't have records for the selected month
    const existingStaffForMonth = records.filter(r => r.month === genMonth && r.year === parseInt(genYear)).map(r => r.staff);
    const newRecords = staffMembers
      .filter(s => s.status === "active" && !existingStaffForMonth.includes(s.name))
      .map((s, idx) => ({
        id: Math.max(...records.map(r => r.id), 0) + idx + 1,
        staff: s.name,
        branch: s.branch,
        month: genMonth,
        year: parseInt(genYear),
        basic: s.salary,
        commission: Math.round(s.achieved * s.commissionRate * 100),
        allowances: Math.round(s.salary * 0.15),
        deductions: Math.round(s.salary * 0.12),
        gross: 0,
        net: 0,
        status: "draft" as const,
      }))
      .map(r => ({
        ...r,
        gross: r.basic + r.commission + r.allowances,
        net: r.basic + r.commission + r.allowances - r.deductions,
      }));

    if (newRecords.length === 0) {
      toast({ title: "Already Generated", description: `${genMonth} ${genYear} salary records already exist for all active staff` });
    } else {
      setRecords(prev => [...prev, ...newRecords]);
      toast({ title: "Salary Records Generated", description: `${newRecords.length} draft records created for ${genMonth} ${genYear}` });
    }
    setShowGenerateDialog(false);
  };

  const downloadSlip = (staff: string, month: string, year: number) => {
    // Create a downloadable text file as salary slip
    const record = records.find(r => r.staff === staff && r.month === month && r.year === year);
    if (!record) return;

    const content = `
========================================
        SALARY SLIP - ${record.month} ${record.year}
========================================
Staff Name:    ${record.staff}
Branch:        ${record.branch}
Month/Year:    ${record.month} ${record.year}
Status:        ${record.status.toUpperCase()}
----------------------------------------
EARNINGS:
  Basic Salary:     ₹${record.basic.toLocaleString()}
  Commission:       ₹${record.commission.toLocaleString()}
  Allowances:       ₹${record.allowances.toLocaleString()}
                    ─────────────
  Gross Pay:        ₹${record.gross.toLocaleString()}
----------------------------------------
DEDUCTIONS:
  Total Deductions: ₹${record.deductions.toLocaleString()}
----------------------------------------
NET PAY:            ₹${record.net.toLocaleString()}
========================================
Generated on: ${new Date().toLocaleDateString()}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salary-slip-${staff.replace(/\s+/g, "-").toLowerCase()}-${month}-${year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: `Salary slip for ${staff}` });
  };

  const totalNet = records.reduce((sum, r) => sum + r.net, 0);
  const totalGross = records.reduce((sum, r) => sum + r.gross, 0);
  const draftCount = records.filter(r => r.status === "draft").length;
  const paidCount = records.filter(r => r.status === "paid").length;

  const kpis = [
    { label: "Total Net Payroll", value: `₹${totalNet.toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Gross", value: `₹${totalGross.toLocaleString()}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Staff Count", value: records.length, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Pending Drafts", value: draftCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Salary & Payroll</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage staff salary and payroll processing</p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all">
          <FileText className="h-4 w-4" /> Generate Monthly Salary
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0 hover:shadow-lg transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Basic</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.staff}</TableCell>
                  <TableCell>{r.branch}</TableCell>
                  <TableCell>{r.month} {r.year}</TableCell>
                  <TableCell>₹{r.basic.toLocaleString()}</TableCell>
                  <TableCell>₹{r.commission.toLocaleString()}</TableCell>
                  <TableCell>₹{r.allowances.toLocaleString()}</TableCell>
                  <TableCell className="text-destructive">-₹{r.deductions.toLocaleString()}</TableCell>
                  <TableCell>₹{r.gross.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">₹{r.net.toLocaleString()}</TableCell>
                  <TableCell><Badge className={statusColors[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status === "draft" && (
                        <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, "approved")} className="text-xs gap-1">
                          <CheckSquare className="h-3 w-3" /> Approve
                        </Button>
                      )}
                      {r.status === "approved" && (
                        <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, "paid")} className="text-xs gap-1 text-success">
                          Mark Paid
                        </Button>
                      )}
                      {r.status === "paid" && (
                        <span className="text-xs text-muted-foreground italic px-2">Completed</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50" onClick={() => downloadSlip(r.staff, r.month, r.year)}>
                      <Download className="h-4 w-4 text-blue-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generate Monthly Salary Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Generate Monthly Salary</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Month</Label>
              <Select value={genMonth} onValueChange={setGenMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year</Label>
              <Select value={genYear} onValueChange={setGenYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">This will create draft salary records for all active staff for the selected month. Existing records will not be overwritten.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
            <Button onClick={generateSalary}>Generate Records</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
