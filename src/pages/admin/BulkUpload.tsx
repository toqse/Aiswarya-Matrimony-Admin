import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Download, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import {
  validateBulkUpload,
  importBulkUpload,
  fetchBulkImportStatus,
  fetchBulkUploadHistory,
} from "@/lib/admin-api/bulk-upload";

const TEMPLATE_COLUMNS = [
  "Name",
  "Phone Number",
  "Email",
  "Date of Birth",
  "Gender",
  "Partner Preference",
  "Country",
  "State",
  "District",
  "City",
  "Address",
  "Religion",
  "Caste",
  "Mother Tongue",
  "Marital Status",
  "Has Children",
  "Number of Children",
  "Height (cm)",
  "Weight (kg)",
  "Complexion",
  "Highest Education",
  "Education Subject",
  "Employment",
  "Occupation",
  "Annual Income",
  "About Me",
  "Family Type",
  "Father's Name",
  "Father's Occupation",
  "Mother's Name",
  "Mother's Occupation",
  "Family Status",
  "Number of Brothers",
  "Number of Married Brothers",
  "Number of Sisters",
  "Number of Married Sisters",
  "About My Family",
] as const;

const TEMPLATE_EXAMPLE_ROW: Record<string, string> = {
  Name: "Arun Kumar",
  "Phone Number": "9876543210",
  Email: "arun@example.com",
  "Date of Birth": "15-08-1995",
  Gender: "M",
  "Partner Preference": "Age 23-28",
  Country: "India",
  State: "Tamil Nadu",
  District: "Chennai",
  City: "Chennai",
  Address: "Anna Nagar",
  Religion: "Hindu",
  Caste: "Gounder",
  "Mother Tongue": "Tamil",
  "Marital Status": "Never Married",
  "Has Children": "No",
  "Number of Children": "0",
  "Height (cm)": "172",
  "Weight (kg)": "68",
  Complexion: "Wheatish",
  "Highest Education": "B.E",
  "Education Subject": "Computer Science",
  Employment: "Private",
  Occupation: "Software Engineer",
  "Annual Income": "900000",
  "About Me": "Simple and family-oriented person.",
  "Family Type": "Nuclear",
  "Father's Name": "Kumar",
  "Father's Occupation": "Business",
  "Mother's Name": "Lakshmi",
  "Mother's Occupation": "Homemaker",
  "Family Status": "Middle Class",
  "Number of Brothers": "1",
  "Number of Married Brothers": "0",
  "Number of Sisters": "1",
  "Number of Married Sisters": "0",
  "About My Family": "Warm, supportive family values.",
};

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validation, setValidation] = useState<Awaited<
    ReturnType<typeof validateBulkUpload>
  > | null>(null);
  const [importing, setImporting] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [historyStatus, setHistoryStatus] = useState<string>("all");
  const [currentJobStatus, setCurrentJobStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["admin", "bulk-upload", "history", historyStatus],
    queryFn: () =>
      fetchBulkUploadHistory({
        page: 1,
        page_size: 10,
        status:
          historyStatus === "all"
            ? undefined
            : (historyStatus as
                | "validated"
                | "queued"
                | "processing"
                | "completed"
                | "failed"),
      }),
  });

  const handleFile = (f: File) => {
    const allowed = [".csv", ".xlsx"];
    const lower = f.name.toLowerCase();
    if (!allowed.some((ext) => lower.endsWith(ext))) {
      toast({
        title: "Invalid file type",
        description: "Only .csv and .xlsx files are accepted",
        variant: "destructive",
      });
      return;
    }
    setFile(f);
    setValidation(null);
    setTaskId(null);
    setProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const processUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(10);
    try {
      const v = await validateBulkUpload(file);
      setValidation(v);
      setCurrentJobStatus("validated");
      setProgress(100);
      toast({
        title: "Validation complete",
        description: `${v.valid_rows} valid, ${v.error_rows} errors (${v.total_rows} rows)`,
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "bulk-upload", "history"],
      });
    } catch (e) {
      toast({
        title: "Validation failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const runImport = async () => {
    if (!validation?.validation_token) {
      toast({ title: "Nothing to import", variant: "destructive" });
      return;
    }
    setImporting(true);
    try {
      const r = await importBulkUpload({
        validation_token: validation.validation_token,
      });
      if (r.async && r.task_id) {
        setTaskId(r.task_id);
        setCurrentJobStatus("queued");
        toast({ title: "Import queued", description: `Task ${r.task_id}` });
      } else {
        setCurrentJobStatus("completed");
        toast({
          title: "Import complete",
          description: `Imported ${r.imported ?? 0} rows`,
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "bulk-upload", "history"],
      });
    } catch (e) {
      toast({
        title: "Import failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (!taskId) return;
    const t = setInterval(async () => {
      try {
        const s = await fetchBulkImportStatus(taskId);
        if (s.job?.status) setCurrentJobStatus(s.job.status);
        if (s.state === "SUCCESS" || s.state === "FAILURE") {
          clearInterval(t);
          setTaskId(null);
          toast({
            title: s.state === "SUCCESS" ? "Import finished" : "Import failed",
            description: JSON.stringify(s.result ?? s),
          });
          queryClient.invalidateQueries({
            queryKey: ["admin", "bulk-upload", "history"],
          });
        }
      } catch {
        clearInterval(t);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [taskId, toast]);

  const triggerBrowserDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = async (format: "csv" | "xlsx" = "csv") => {
    try {
      if (format === "csv") {
        const csvRows = [
          TEMPLATE_COLUMNS.join(","),
          TEMPLATE_COLUMNS.map(
            (c) => `"${(TEMPLATE_EXAMPLE_ROW[c] ?? "").replace(/"/g, '""')}"`,
          ).join(","),
        ];
        triggerBrowserDownload(
          new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" }),
          "bulk_upload_template.csv",
        );
      } else {
        const worksheet = XLSX.utils.json_to_sheet([TEMPLATE_EXAMPLE_ROW], {
          header: [...TEMPLATE_COLUMNS],
        });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        const output = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        triggerBrowserDownload(
          new Blob([output], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
          "bulk_upload_template.xlsx",
        );
      }
      toast({ title: "Sample template downloaded" });
    } catch (e) {
      toast({
        title: "Download failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const errors = validation?.errors ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Bulk Upload</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload profiles via CSV/Excel files
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => downloadTemplate("csv")}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> CSV Template
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadTemplate("xlsx")}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> Excel Template
          </Button>
        </div>
      </div>

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
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse files
            </p>
            {file && (
              <p className="mt-3 text-sm font-medium text-primary">
                {file.name}
              </p>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
            />
          </div>
          {uploading && <Progress value={progress} className="mt-4 h-2" />}
          <div className="flex gap-2 mt-4 justify-center">
            <Button disabled={!file || uploading} onClick={processUpload}>
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Validate
            </Button>
            <Button
              variant="secondary"
              disabled={!validation?.validation_token || importing}
              onClick={runImport}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Import valid rows
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template columns</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the downloaded API template only. It includes all required
            fields, including the new family columns (`Family Type`,
            `Father&apos;s Name`, `Father&apos;s Occupation`, `Mother&apos;s
            Name`, `Mother&apos;s Occupation`, `Family Status`, `Number of
            Brothers`, `Number of Married Brothers`, `Number of Sisters`,
            `Number of Married Sisters`, `About My Family`) in the exact
            expected order.
          </p>
        </CardContent>
      </Card>

      {(taskId || currentJobStatus) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current import status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm flex items-center gap-3">
            {taskId && (
              <span className="text-muted-foreground">Task: {taskId}</span>
            )}
            {currentJobStatus && <Badge>{currentJobStatus}</Badge>}
          </CardContent>
        </Card>
      )}

      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validation summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              Total {validation.total_rows} · Valid {validation.valid_rows} ·
              Errors {validation.error_rows}
            </p>
            {errors.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.slice(0, 50).map((e, i) => (
                    <TableRow key={i}>
                      <TableCell>{e.row}</TableCell>
                      <TableCell>{e.field}</TableCell>
                      <TableCell>{e.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Upload history</CardTitle>
          <Select value={historyStatus} onValueChange={setHistoryStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="validated">Validated</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading history...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Imported</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(history?.results ?? []).map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.file_name}</TableCell>
                    <TableCell>
                      {h.valid_rows}/{h.total_rows}
                    </TableCell>
                    <TableCell>{h.imported_count}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{h.status}</Badge>
                    </TableCell>
                    <TableCell>{h.branch_name || "-"}</TableCell>
                    <TableCell>
                      {new Date(h.created_at).toLocaleString()}
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
