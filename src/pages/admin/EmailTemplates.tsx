import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailTemplates as initialTemplates } from "@/data/mockData";
import { Edit, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const templateBodies: Record<string, string> = {
  "Registration Welcome": "Dear {{name}},\n\nWelcome to AIswarya Matrimony! Your profile ID is {{profile_id}}.\n\nWe wish you the best in finding your life partner.\n\nBest regards,\nAIswarya Matrimony Team",
  "Match Notification": "Dear {{name}},\n\nGreat news! We found a potential match for you.\n\nProfile: {{match_name}} ({{match_id}})\nAge: {{match_age}}\nLocation: {{match_location}}\n\nLogin to view the full profile.\n\nBest regards,\nAIswarya Matrimony",
  "Subscription Confirmation": "Dear {{name}},\n\nYour {{plan_name}} subscription is now active!\n\nStart Date: {{start_date}}\nExpiry: {{expiry_date}}\n\nEnjoy your premium features.\n\nBest regards,\nAIswarya Matrimony",
};

export default function EmailTemplates() {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editing, setEditing] = useState<typeof initialTemplates[0] | null>(null);
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const { toast } = useToast();

  const openEdit = (t: typeof initialTemplates[0]) => {
    setEditing(t);
    setSubject(t.subject);
    setBody(templateBodies[t.name] || "Dear {{name}},\n\n[Template content here]\n\nBest regards,\nAIswarya Matrimony");
  };

  const handleSave = () => {
    if (editing) {
      setTemplates((prev) => prev.map((t) => t.id === editing.id ? { ...t, subject, lastModified: new Date().toISOString().split("T")[0] } : t));
      toast({ title: "Template Updated", description: `${editing.name} saved` });
    }
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage automated email templates</p>
      </div>

      <Card className="shadow-elegant border-0">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell>{t.lastModified}</TableCell>
                  <TableCell><Badge className="bg-success text-success-foreground">{t.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Template — {editing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 min-h-[200px] font-mono text-sm" />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Available Variables:</p>
              <p>{"{{name}}, {{email}}, {{profile_id}}, {{plan_name}}, {{start_date}}, {{expiry_date}}, {{match_name}}, {{match_id}}"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
