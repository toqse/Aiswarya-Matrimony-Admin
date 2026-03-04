import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, FileText, Check, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockParsedRows = [
  { row: 1, name: "Arul Kumar", age: 28, gender: "Male", religion: "Hindu", phone: "9876543215", status: "valid" as const },
  { row: 2, name: "Lakshmi P", age: 25, gender: "Female", religion: "Hindu", phone: "9876543216", status: "valid" as const },
  { row: 3, name: "", age: 0, gender: "Male", religion: "Hindu", phone: "invalid", status: "error" as const },
  { row: 4, name: "Muthu S", age: 31, gender: "Male", religion: "Christian", phone: "9876543218", status: "valid" as const },
  { row: 5, name: "Geetha R", age: 27, gender: "Female", religion: "Hindu", phone: "9876543219", status: "warning" as const },
];

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsed, setParsed] = useState<typeof mockParsedRows | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (f: File) => {
    setFile(f);
    setParsed(null);
    setDone(false);
    setProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const processUpload = () => {
    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          setParsed(mockParsedRows);
          setDone(true);
          toast({ title: "Upload Complete", description: "5 rows processed — 3 valid, 1 error, 1 warning" });
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  const downloadTemplate = () => {
    // All fields from the Add New Profile wizard (Basic Info through About Me)
    const headers = [
      // Basic Info
      "Name", "Age", "Gender", "Date of Birth", "Mobile Number", "Email",
      // Location
      "Country", "State", "District", "City",
      // Religion
      "Religion", "Caste", "Mother Tongue", "Gothram",
      // Personal Details
      "Marital Status", "Height (cm)", "Weight (kg)", "Complexion",
      "No. of Children", "Children Living With",
      // Education & Career
      "Education", "Education Detail", "Occupation", "Company Name",
      "Annual Income", "Working Location",
      // About Me
      "About Me / Bio",
      // Family
      "Father Name", "Father Occupation", "Mother Name", "Mother Occupation",
      "No. of Brothers", "No. of Sisters", "Family Type", "Family Status",
      // Horoscope
      "Rasi", "Nakshatram", "Lagnam", "Dosham", "Birth Time", "Birth Place",
      // Photos
      "Photo URL",
    ];

    const csv = headers.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "profile_template.csv";
    a.click();
    toast({ title: "Template downloaded", description: `Template with ${headers.length} fields ready` });
  };

  const validCount = parsed?.filter((r) => r.status === "valid").length ?? 0;
  const errorCount = parsed?.filter((r) => r.status === "error").length ?? 0;
  const warningCount = parsed?.filter((r) => r.status === "warning").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bulk Upload</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload profiles via CSV/Excel files</p>
        </div>
        <Button variant="outline" onClick={downloadTemplate} className="gap-2"><Download className="h-4 w-4" /> Download Template</Button>
      </div>

      {/* Upload Area */}
      <Card className="shadow-elegant border-0">
        <CardContent className="pt-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
          >
            <Upload className="h-12 w-12 mx-auto text-primary/50 mb-4" />
            <p className="text-lg font-medium">Drop your CSV/Excel file here</p>
            <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
            {file && <p className="mt-3 text-sm font-medium text-primary">{file.name}</p>}
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {file && !done && (
            <div className="mt-6 space-y-4">
              {uploading && <Progress value={progress} className="h-3" />}
              {!uploading && (
                <Button onClick={processUpload} className="gap-2"><FileText className="h-4 w-4" /> Process Upload</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {done && parsed && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-elegant border-0"><CardContent className="p-4 flex items-center gap-3">
              <Check className="h-5 w-5 text-success" /><div><p className="text-sm text-muted-foreground">Valid</p><p className="text-xl font-bold text-success">{validCount}</p></div>
            </CardContent></Card>
            <Card className="shadow-elegant border-0"><CardContent className="p-4 flex items-center gap-3">
              <X className="h-5 w-5 text-destructive" /><div><p className="text-sm text-muted-foreground">Errors</p><p className="text-xl font-bold text-destructive">{errorCount}</p></div>
            </CardContent></Card>
            <Card className="shadow-elegant border-0"><CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" /><div><p className="text-sm text-muted-foreground">Warnings</p><p className="text-xl font-bold text-warning">{warningCount}</p></div>
            </CardContent></Card>
          </div>

          <Card className="shadow-elegant border-0">
            <CardHeader><CardTitle className="text-base">Upload Preview</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead><TableHead>Name</TableHead><TableHead>Age</TableHead><TableHead>Gender</TableHead><TableHead>Religion</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((r) => (
                    <TableRow key={r.row} className={r.status === "error" ? "bg-destructive/5" : r.status === "warning" ? "bg-warning/5" : ""}>
                      <TableCell>{r.row}</TableCell>
                      <TableCell className={r.name ? "font-medium" : "text-destructive italic"}>{r.name || "Missing"}</TableCell>
                      <TableCell>{r.age || "—"}</TableCell>
                      <TableCell>{r.gender}</TableCell>
                      <TableCell>{r.religion}</TableCell>
                      <TableCell className={r.status === "error" ? "text-destructive" : ""}>{r.phone}</TableCell>
                      <TableCell>
                        <Badge className={r.status === "valid" ? "bg-success text-success-foreground" : r.status === "error" ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
