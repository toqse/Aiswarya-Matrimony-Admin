import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { salaryRecords, commissions } from "@/data/mockData";
import {
  Download, IndianRupee, TrendingUp, Wallet, FileText, Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-info text-info-foreground",
  paid: "bg-success text-success-foreground",
};

export default function MySalary() {
  const staffName = "Anitha Lakshmi";
  const myRecords = salaryRecords.filter((r) => r.staff === staffName);
  const myCommissions = commissions.filter((c) => c.staff === staffName);
  const { toast } = useToast();

  // Current month preview
  const currentMonth = myRecords[0]; // latest
  const approvedCommissions = myCommissions.filter(c => c.status === "paid" || c.status === "approved")
    .reduce((s, c) => s + c.commission, 0);

  // YTD summary
  const ytdGross = myRecords.reduce((s, r) => s + r.gross, 0);
  const ytdCommission = myRecords.reduce((s, r) => s + r.commission, 0);
  const ytdNet = myRecords.reduce((s, r) => s + r.net, 0);

  const downloadSlip = (month: string, year: number) => {
    toast({ title: "Downloading", description: `Salary slip for ${month} ${year} (PDF)` });
  };

  const summaryCards = [
    { label: "YTD Gross Pay", value: `₹${ytdGross.toLocaleString()}`, icon: IndianRupee, color: "text-primary" },
    { label: "YTD Commission", value: `₹${ytdCommission.toLocaleString()}`, icon: Wallet, color: "text-accent-foreground" },
    { label: "YTD Net Pay", value: `₹${ytdNet.toLocaleString()}`, icon: TrendingUp, color: "text-success" },
    { label: "Records", value: myRecords.length, icon: Calendar, color: "text-info" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Salary</h1>
        <p className="text-muted-foreground text-sm mt-1">Salary slip history — read-only view</p>
      </div>

      {/* YTD Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Month Preview */}
      {currentMonth && (
        <Card className="shadow-elegant border-0 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Current Month Preview — {currentMonth.month} {currentMonth.year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
              <div><p className="text-muted-foreground text-xs">Basic</p><p className="font-bold">₹{currentMonth.basic.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground text-xs">Commission (Approved)</p><p className="font-bold text-accent-foreground">₹{approvedCommissions.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground text-xs">Allowances</p><p className="font-bold">₹{currentMonth.allowances.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground text-xs">Deductions</p><p className="font-bold text-destructive">-₹{currentMonth.deductions.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground text-xs">Gross</p><p className="font-bold">₹{currentMonth.gross.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground text-xs">Net Pay</p><p className="font-bold text-success text-lg">₹{currentMonth.net.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground text-xs">Status</p><Badge className={statusColors[currentMonth.status]}>{currentMonth.status}</Badge></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salary History Table */}
      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Salary History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Year</TableHead>
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
              {myRecords.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.month}</TableCell>
                  <TableCell>{r.year}</TableCell>
                  <TableCell>₹{r.basic.toLocaleString()}</TableCell>
                  <TableCell className="text-accent-foreground font-medium">₹{r.commission.toLocaleString()}</TableCell>
                  <TableCell>₹{r.allowances.toLocaleString()}</TableCell>
                  <TableCell className="text-destructive">-₹{r.deductions.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">₹{r.gross.toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-success">₹{r.net.toLocaleString()}</TableCell>
                  <TableCell><Badge className={statusColors[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                      onClick={() => downloadSlip(r.month, r.year)}>
                      <Download className="h-3 w-3" /> PDF
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
