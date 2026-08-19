import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format-date";
import {
  fetchBulkImportStatus,
  fetchBulkUploadHistory,
  fetchBulkTemplateColumns,
  importBulkUpload,
  validateBulkUpload,
  downloadBulkTemplate,
} from "@/lib/admin-api/bulk-upload";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [historyPage, setHistoryPage] = useState(1);
  const [currentJobStatus, setCurrentJobStatus] = useState<string | null>(null);
  const [templateColumns, setTemplateColumns] = useState<string[]>([]);
  const importInFlight =
    importing || currentJobStatus === "queued" || currentJobStatus === "processing";
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["admin", "bulk-upload", "history", historyStatus, historyPage],
    queryFn: () =>
      fetchBulkUploadHistory({
        page: historyPage,
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
  const historyRows = history?.results ?? [];
  const historyTotal = history?.count ?? 0;
  const historyCanPrev = Boolean(history?.previous) && historyPage > 1;
  const historyCanNext = Boolean(history?.next);

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

  const processUploadAndImport = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(10);
    try {
      const v = await validateBulkUpload(file);
      setValidation(v);
      setCurrentJobStatus("validated");
      setProgress(50);
      queryClient.invalidateQueries({
        queryKey: ["admin", "bulk-upload", "history"],
      });

      if (!v.validation_token || v.valid_rows === 0) {
        toast({
          title: "Validation complete",
          description:
            v.valid_rows === 0
              ? `${v.error_rows} error(s) — no valid rows to import`
              : `${v.valid_rows} valid, ${v.error_rows} errors (${v.total_rows} rows)`,
          variant: v.valid_rows === 0 ? "destructive" : "default",
        });
        setProgress(100);
        return;
      }

      toast({
        title: "Validation complete",
        description: `Importing ${v.valid_rows} valid row(s)...`,
      });
      await runImport(v.validation_token);
      setProgress(100);
    } catch (e) {
      toast({
        title: "Upload failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const runImport = async (token?: string) => {
    const validationToken = token ?? validation?.validation_token;
    if (!validationToken) {
      toast({ title: "Nothing to import", variant: "destructive" });
      return;
    }
    setImporting(true);
    try {
      const r = await importBulkUpload({
        validation_token: validationToken,
      });
      const isAsync = Boolean(r.async && r.task_id);
      if (isAsync && r.task_id) {
        setTaskId(r.task_id);
        setCurrentJobStatus("queued");
        toast({
          title: "Import started",
          description: "Your file is being imported. Please wait until it finishes.",
        });
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
      if (!isAsync) setImporting(false);
    } catch (e) {
      toast({
        title: "Import failed",
        description: (e as Error).message,
        variant: "destructive",
      });
      setImporting(false);
      return;
    }
  };

  useEffect(() => {
    fetchBulkTemplateColumns()
      .then(setTemplateColumns)
      .catch(() => setTemplateColumns([]));
  }, []);

  useEffect(() => {
    if (!taskId) return;
    const t = setInterval(async () => {
      try {
        const s = await fetchBulkImportStatus(taskId);
        if (s.job?.status) setCurrentJobStatus(s.job.status);
        if (s.state === "SUCCESS" || s.state === "FAILURE") {
          clearInterval(t);
          setTaskId(null);
          setImporting(false);
          const imported =
            typeof s.result?.imported === "number"
              ? s.result.imported
              : typeof s.job?.imported_count === "number"
                ? s.job.imported_count
                : 0;
          const failedCount = Array.isArray(s.result?.failed)
            ? s.result!.failed.length
            : typeof s.job?.error_rows === "number"
              ? s.job.error_rows
              : 0;
          toast({
            title: s.state === "SUCCESS" ? "Import finished" : "Import failed",
            description:
              s.state === "SUCCESS"
                ? `Imported ${imported} row(s)${failedCount ? ` • Failed ${failedCount} row(s)` : ""}`
                : (s.error || "The import job failed. Please check the upload history for details."),
            variant: s.state === "SUCCESS" ? "default" : "destructive",
          });
          queryClient.invalidateQueries({
            queryKey: ["admin", "bulk-upload", "history"],
          });
        }
      } catch {
        clearInterval(t);
        setImporting(false);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [taskId, toast, queryClient]);

  const downloadTemplate = async () => {
    try {
      await downloadBulkTemplate("csv");
      toast({ title: "Template downloaded" });
    } catch (e) {
      toast({
        title: "Download failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const errors = validation?.errors ?? [];
  const groupedErrors = useMemo(() => {
    // Group errors by normalized message (and field), keeping row lists unique and sorted.
    const byKey = new Map<
      string,
      { title: string; message: string; field: string; rows: number[] }
    >();

    const normalize = (field: string, message: string) => {
      const msg = message.trim().replace(/\s+/g, " ");
      const f = field.trim();

      // Friendly group titles for the common noisy cases.
      const isDuplicatePhone =
        (/\bmobile\b|\bphone\b/i.test(f) ||
          /\bmobile\b|\bphone\b/i.test(msg)) &&
        (/already exists/i.test(msg) ||
          /unique constraint failed/i.test(msg) ||
          /unique/i.test(msg));

      const isInvalidEmail =
        /\bemail\b/i.test(f) &&
        (/\binvalid\b/i.test(msg) ||
          /\bformat\b/i.test(msg) ||
          /\bnot a valid\b/i.test(msg));

      const title = isDuplicatePhone
        ? "Duplicate phone numbers"
        : isInvalidEmail
          ? "Invalid email format"
          : msg.length > 90
            ? `${msg.slice(0, 90)}…`
            : msg;

      // Key includes field to avoid merging totally unrelated errors with same message.
      const key = `${title}||${f}||${msg}`;
      return { key, title, msg, f };
    };

    for (const e of errors) {
      const row =
        typeof e.row === "number"
          ? e.row
          : typeof e.row === "string" && /^\d+$/.test(e.row)
            ? Number(e.row)
            : null;
      if (row == null) continue;

      const { key, title, msg, f } = normalize(
        e.field ?? "error",
        e.message ?? "",
      );
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, { title, message: msg, field: f, rows: [row] });
      } else if (existing.rows[existing.rows.length - 1] !== row) {
        existing.rows.push(row);
      }
    }

    const groups = Array.from(byKey.values()).map((g) => ({
      ...g,
      rows: Array.from(new Set(g.rows)).sort((a, b) => a - b),
    }));

    // Sort: highest impact first.
    groups.sort((a, b) => b.rows.length - a.rows.length);
    return groups;
  }, [errors]);

  const errorRowSet = useMemo(() => {
    const s = new Set<number>();
    for (const e of errors) {
      if (typeof e.row === "number") s.add(e.row);
      else if (typeof e.row === "string" && /^\d+$/.test(e.row))
        s.add(Number(e.row));
    }
    return s;
  }, [errors]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Bulk Upload</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload profiles via CSV/Excel files
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => downloadTemplate()}
          className="gap-2 w-full sm:w-auto shrink-0"
        >
          <Download className="h-4 w-4" /> Download Template
        </Button>
      </div>

      <Card className="shadow-elegant border-0">
        <CardContent className="pt-4 sm:pt-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-primary/30 rounded-xl p-6 sm:p-12 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
          >
            <Upload className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-primary/50 mb-3 sm:mb-4" />
            <p className="text-base sm:text-lg font-medium">Drop your CSV/Excel file here</p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse files
            </p>
            {file && (
              <p className="mt-3 text-sm font-medium text-primary break-all px-2">
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
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-center">
            <Button
              disabled={!file || uploading || importInFlight}
              onClick={processUploadAndImport}
              className="w-full sm:w-auto gap-2"
            >
              {uploading || importInFlight ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading || importInFlight
                ? "Uploading & importing..."
                : "Upload & Import"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template columns</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Use the downloaded template only. Column order and spelling must
            match exactly.
          </p>
          {templateColumns.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {templateColumns.map((column, index) => (
                <div
                  key={`${index}-${column}`}
                  className="flex items-start gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    {index + 1}.
                  </span>
                  <span className="font-medium break-words">{column}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Loading template columns...
            </p>
          )}
        </CardContent>
      </Card>

      {(taskId || currentJobStatus) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current import status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {importInFlight ? (
              <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-3">
                <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-primary" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    Import is in progress...
                  </p>
                  <p className="text-muted-foreground">
                    Please do not go back or close this page until the process is
                    completed.
                  </p>
                </div>
              </div>
            ) : null}
            {currentJobStatus && <Badge>{currentJobStatus}</Badge>}
          </CardContent>
        </Card>
      )}

      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validation summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Total {validation.total_rows} · Valid {validation.valid_rows} ·
              Errors {validation.error_rows}
            </p>

            {errors.length > 0 ? (
              <>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-sm font-medium"></p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {groupedErrors.slice(0, 8).map((g) => {
                      const maxRows = 30;
                      const shown = g.rows.slice(0, maxRows);
                      const extra = g.rows.length - shown.length;
                      const rowsText =
                        extra > 0
                          ? `${shown.join(", ")} (+${extra} more)`
                          : shown.join(", ");
                      return (
                        <li
                          key={`${g.title}-${g.field}-${g.message}`}
                          className="flex flex-col gap-1 sm:flex-row sm:gap-2"
                        >
                          <span className="sm:min-w-40 font-medium text-foreground">
                            {g.title}
                          </span>
                          <span className="sm:truncate break-words">Rows {rowsText}</span>
                        </li>
                      );
                    })}
                    {groupedErrors.length > 8 && (
                      <li className="text-xs">
                        + {groupedErrors.length - 8} more unique error type(s)
                      </li>
                    )}
                  </ul>
                </div>

                <Collapsible>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Detailed errors (grouped summary above)
                    </p>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        Show details
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="mt-3">
                    <div className="overflow-x-auto rounded-md border">
                    <ScrollArea className="h-[min(22rem,50vh)]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Row</TableHead>
                            <TableHead className="w-40">Field</TableHead>
                            <TableHead>Message</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {errors.slice(0, 300).map((e, i) => {
                            const rowNum =
                              typeof e.row === "number"
                                ? e.row
                                : typeof e.row === "string" &&
                                    /^\d+$/.test(e.row)
                                  ? Number(e.row)
                                  : null;
                            const hasRowError =
                              rowNum != null && errorRowSet.has(rowNum);
                            return (
                              <TableRow
                                key={i}
                                className={
                                  hasRowError ? "bg-destructive/10" : undefined
                                }
                              >
                                <TableCell className="align-top">
                                  {e.row}
                                </TableCell>
                                <TableCell className="align-top font-mono text-xs">
                                  {e.field}
                                </TableCell>
                                <TableCell className="align-top text-sm break-words">
                                  {e.message}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    </div>
                    {errors.length > 300 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Showing first 300 errors. Use the grouped summary to
                        review all issues quickly.
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No validation errors.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Upload history</CardTitle>
          <Select
            value={historyStatus}
            onValueChange={(v) => {
              setHistoryPage(1);
              setHistoryStatus(v);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <div className="overflow-x-auto -mx-1 px-1">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Imported</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRows.map((h) => (
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
                      {formatDateTime(h.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {h.status === "validated" && h.validation_token ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={importInFlight}
                          onClick={() => runImport(h.validation_token)}
                        >
                          {importInFlight ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Import
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              Showing {historyRows.length} of {historyTotal} records
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={!historyCanPrev}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {historyPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryPage((p) => p + 1)}
                disabled={!historyCanNext}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
