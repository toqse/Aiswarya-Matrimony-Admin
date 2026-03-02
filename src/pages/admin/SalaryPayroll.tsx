import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { salaryRecords as initialRecords } from "@/data/mockData";
import { Download, FileText, CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-info text-info-foreground",
  paid: "bg-success text-success-foreground",
};

export default function SalaryPayroll() {
  const [records, setRecords] = useState(initialRecords);
  const { toast } = useToast();

  const updateStatus = (id: number, status: "approved" | "paid") => {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status: status as any } : r));
    toast({ title: `Salary ${status}` });
  };

  const generateSalary = () => {
    toast({ title: "Monthly salary records generated", description: "March 2026 salary records created" });
  };

  const downloadSlip = (staff: string) => {
    toast({ title: "Downloading", description: `Salary slip for ${staff}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Salary & Payroll</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage staff salary and payroll processing</p>
        </div>
        <Button onClick={generateSalary} className="gap-2"><FileText className="h-4 w-4" /> Generate Monthly Salary</Button>
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
                        <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, "approved")} className="text-xs gap-1"><CheckSquare className="h-3 w-3" /> Approve</Button>
                      )}
                      {r.status === "approved" && (
                        <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, "paid")} className="text-xs gap-1 text-success">Mark Paid</Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => downloadSlip(r.staff)}><Download className="h-4 w-4" /></Button>
                    </div>
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
