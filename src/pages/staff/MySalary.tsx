import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchStaffPayroll } from "@/lib/admin-api/scoped";
import { IndianRupee, TrendingUp, Wallet, Calendar, Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-info text-info-foreground",
  paid: "bg-success text-success-foreground",
};

export default function MySalary() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["staff", "payroll", month],
    queryFn: () => fetchStaffPayroll({ month }),
  });

  const rows = data?.results ?? [];
  const ytdNet = rows.reduce((s, r) => s + Number(r.net), 0);
  const ytdGross = rows.reduce((s, r) => s + Number(r.gross), 0);

  const summaryCards = [
    { label: "YTD Gross Pay", value: `₹${ytdGross.toLocaleString()}`, icon: IndianRupee, color: "text-primary" },
    { label: "YTD Net Pay", value: `₹${ytdNet.toLocaleString()}`, icon: TrendingUp, color: "text-success" },
    { label: "Records", value: rows.length, icon: Calendar, color: "text-info" },
    { label: "Commission (col)", value: `₹${rows.reduce((s, r) => s + Number(r.commission), 0).toLocaleString()}`, icon: Wallet, color: "text-accent-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Salary</h1>
        <p className="text-muted-foreground text-sm mt-1">Salary records from payroll</p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-[180px]"
        />
      </div>

      {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}
      {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((k) => (
          <Card key={k.label} className="shadow-elegant border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className={`h-5 w-5 ${k.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 && !isLoading ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No data found for the selected month.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.month}</TableCell>
                    <TableCell>{r.branch}</TableCell>
                    <TableCell>₹{Number(r.gross).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(r.net).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[r.status] ?? ""}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
