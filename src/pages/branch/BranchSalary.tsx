import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { salaryRecords as initialRecords } from "@/data/mockData";
import { Download, IndianRupee, Users, Clock, CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
};

export default function BranchSalary() {
  // Branch manager sees only their branch
  const branchRecords = initialRecords.filter(r => r.branch === "Chennai Central");
  const [records] = useState(branchRecords);
  const { toast } = useToast();

  const totalNet = records.reduce((s, r) => s + r.net, 0);
  const draftCount = records.filter(r => r.status === "draft").length;
  const paidCount = records.filter(r => r.status === "paid").length;

  const downloadSlip = (r: typeof records[0]) => {
    const content = `
========================================
      SALARY SLIP - ${r.month} ${r.year}
========================================
Staff Name:    ${r.staff}
Branch:        ${r.branch}
Month/Year:    ${r.month} ${r.year}
Status:        ${r.status.toUpperCase()}
----------------------------------------
EARNINGS:
  Basic Salary:     ₹${r.basic.toLocaleString()}
  Commission:       ₹${r.commission.toLocaleString()}
  Allowances:       ₹${r.allowances.toLocaleString()}
                    ─────────────
  Gross Pay:        ₹${r.gross.toLocaleString()}
----------------------------------------
DEDUCTIONS:
  Total Deductions: ₹${r.deductions.toLocaleString()}
----------------------------------------
NET PAY:            ₹${r.net.toLocaleString()}
========================================
    `.trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salary-slip-${r.staff.replace(/\s+/g, "-").toLowerCase()}-${r.month}-${r.year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: `Salary slip for ${r.staff}` });
  };

  const kpis = [
    { label: "Branch Net Payroll", value: `₹${totalNet.toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Staff Count", value: records.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending Drafts", value: draftCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Paid", value: paidCount, icon: CheckSquare, color: "text-violet-600", bg: "bg-violet-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Branch Salary Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Chennai Central — Staff salary records (view only)</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0">
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
                <TableHead>Month</TableHead>
                <TableHead>Basic</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.staff}</TableCell>
                  <TableCell>{r.month} {r.year}</TableCell>
                  <TableCell>₹{r.basic.toLocaleString()}</TableCell>
                  <TableCell>₹{r.commission.toLocaleString()}</TableCell>
                  <TableCell>₹{r.allowances.toLocaleString()}</TableCell>
                  <TableCell className="text-destructive">-₹{r.deductions.toLocaleString()}</TableCell>
                  <TableCell>₹{r.gross.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">₹{r.net.toLocaleString()}</TableCell>
                  <TableCell><Badge className={statusColors[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50" onClick={() => downloadSlip(r)}>
                      <Download className="h-4 w-4 text-blue-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
