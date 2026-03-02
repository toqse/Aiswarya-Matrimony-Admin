import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auditLogs } from "@/data/mockData";
import { Search, ClipboardList } from "lucide-react";

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const actions = [...new Set(auditLogs.map((l) => l.action))];

  const filtered = auditLogs.filter((l) => {
    const matchSearch = l.user.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Immutable system action log</p>
      </div>

      <Card className="shadow-elegant border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Action Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">{l.timestamp}</TableCell>
                  <TableCell className="font-medium">{l.user}</TableCell>
                  <TableCell><Badge variant="outline">{l.role}</Badge></TableCell>
                  <TableCell>{l.action}</TableCell>
                  <TableCell className="font-mono text-xs">{l.ip}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">{l.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
