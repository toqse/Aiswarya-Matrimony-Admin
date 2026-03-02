import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cashCollections } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, Banknote, CheckCircle, Clock } from "lucide-react";

const statusIcons: Record<string, any> = { settled: CheckCircle, shortage: AlertTriangle, pending: Clock };
const statusColors: Record<string, string> = { settled: "bg-success text-success-foreground", shortage: "bg-destructive text-destructive-foreground", pending: "bg-warning text-warning-foreground" };

const cashVsDigital = [
  { branch: "Chennai", cash: 45000, digital: 85000 },
  { branch: "Coimbatore", cash: 32000, digital: 68000 },
  { branch: "Madurai", cash: 18000, digital: 42000 },
  { branch: "Trichy", cash: 12000, digital: 35000 },
];

const anomalies = [
  { id: 1, type: "High Cash Ratio", branch: "Trichy Office", details: "Cash payments exceed 60% of total — unusual pattern", severity: "high" as const },
  { id: 2, type: "Receipt Gap", branch: "Coimbatore Main", details: "Missing receipts R045-R047 in Staff: Karthik sequence", severity: "medium" as const },
  { id: 3, type: "Delayed Deposit", branch: "Salem Center", details: "₹15,000 cash not deposited for 3 days", severity: "high" as const },
];

export default function CashPayments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cash Payment Control Center</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor cash collections, deposits, and discrepancies</p>
      </div>

      {/* Today's Cash Collections */}
      <Card className="shadow-elegant border-0">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Banknote className="h-4 w-4 text-primary" /> Today's Cash Collections</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead><TableHead>Expected (₹)</TableHead><TableHead>Physical (₹)</TableHead><TableHead>Deposited (₹)</TableHead><TableHead>Discrepancy</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashCollections.map((c) => {
                const Icon = statusIcons[c.status];
                return (
                  <TableRow key={c.branch}>
                    <TableCell className="font-medium">{c.branch}</TableCell>
                    <TableCell>₹{c.expected.toLocaleString()}</TableCell>
                    <TableCell>₹{c.physical.toLocaleString()}</TableCell>
                    <TableCell>₹{c.deposited.toLocaleString()}</TableCell>
                    <TableCell className={c.expected - c.physical !== 0 ? "text-destructive font-medium" : "text-success"}>
                      ₹{(c.expected - c.physical).toLocaleString()}
                    </TableCell>
                    <TableCell><Badge className={statusColors[c.status]}><Icon className="h-3 w-3 mr-1" /> {c.status}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash vs Digital */}
        <Card className="shadow-elegant border-0">
          <CardHeader><CardTitle className="text-base">Monthly Cash vs Digital Payments</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cashVsDigital}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
                <XAxis dataKey="branch" tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
                <Bar dataKey="cash" name="Cash" fill="hsl(40, 100%, 58%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="digital" name="Digital" fill="hsl(333, 60%, 34%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Anomaly Alerts */}
        <Card className="shadow-elegant border-0">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Anomaly Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.map((a) => (
                <div key={a.id} className={`p-3 rounded-lg border ${a.severity === "high" ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{a.type}</span>
                    <Badge variant={a.severity === "high" ? "destructive" : "secondary"} className="text-[10px]">{a.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.branch} — {a.details}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
