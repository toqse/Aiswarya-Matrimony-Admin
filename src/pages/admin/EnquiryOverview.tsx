import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { enquiries as initialEnquiries, staffMembers } from "@/data/mockData";
import { Search, Columns, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  new: "bg-info text-info-foreground",
  contacted: "bg-warning text-warning-foreground",
  interested: "bg-accent text-accent-foreground",
  converted: "bg-success text-success-foreground",
  lost: "bg-muted text-muted-foreground",
};

const kanbanStatuses = ["new", "contacted", "interested", "converted", "lost"] as const;

export default function EnquiryOverview() {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const filtered = enquiries.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const moveEnquiry = (id: number, newStatus: typeof kanbanStatuses[number]) => {
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: newStatus } : e));
    toast({ title: `Enquiry moved to ${newStatus}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enquiry Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Lead pipeline management</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "kanban" ? "default" : "outline"} size="sm" onClick={() => setView("kanban")} className="gap-1"><LayoutGrid className="h-4 w-4" /> Kanban</Button>
          <Button variant={view === "table" ? "default" : "outline"} size="sm" onClick={() => setView("table")} className="gap-1"><Columns className="h-4 w-4" /> Table</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search enquiries..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {kanbanStatuses.map((status) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={statusColors[status]}>{status}</Badge>
                <span className="text-xs text-muted-foreground">({filtered.filter((e) => e.status === status).length})</span>
              </div>
              {filtered.filter((e) => e.status === status).map((e) => (
                <Card key={e.id} className="shadow-sm border cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3 space-y-2">
                    <p className="font-medium text-sm">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.phone}</p>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px]">{e.source}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.notes}</p>
                    <div className="flex gap-1 flex-wrap">
                      {kanbanStatuses.filter((s) => s !== status).map((s) => (
                        <Button key={s} variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => moveEnquiry(e.id, s)}>{s}</Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <Card className="shadow-elegant border-0">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead><TableHead>Assigned To</TableHead><TableHead>Branch</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.phone}</TableCell>
                    <TableCell><Badge variant="outline">{e.source}</Badge></TableCell>
                    <TableCell><Badge className={statusColors[e.status]}>{e.status}</Badge></TableCell>
                    <TableCell>{e.assignedTo}</TableCell>
                    <TableCell>{e.branch}</TableCell>
                    <TableCell>{e.date}</TableCell>
                    <TableCell>
                      <Select onValueChange={(v) => moveEnquiry(e.id, v as any)}>
                        <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue placeholder="Move to..." /></SelectTrigger>
                        <SelectContent>
                          {kanbanStatuses.filter((s) => s !== e.status).map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
