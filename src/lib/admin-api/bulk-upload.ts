import { unwrap } from "@/lib/admin-api/http";
import { adminFetchBlob, adminRequest, downloadBlob } from "@/lib/api-client";

const LEGACY_TEMPLATE_CSV_FILENAME = "matrimony_import_template_with_reg_no.csv";

export async function fetchBulkTemplateColumns() {
  const res = await adminRequest<{ columns: string[] } | string[]>(
    "v1/admin/bulk-upload/template/?columns=1",
  );
  const data = await unwrap(res);
  if (Array.isArray(data)) {
    return data.filter((column): column is string => typeof column === "string");
  }
  return Array.isArray(data?.columns) ? data.columns : [];
}

export async function downloadBulkTemplate(format: "csv" | "xlsx" = "csv") {
  const { ok, blob, filename } = await adminFetchBlob(
    `v1/admin/bulk-upload/template/?file_format=${format}`,
  );
  if (ok) {
    downloadBlob(
      blob,
      filename ||
        (format === "xlsx"
          ? LEGACY_TEMPLATE_CSV_FILENAME.replace(".csv", ".xlsx")
          : LEGACY_TEMPLATE_CSV_FILENAME),
    );
    return;
  }

  throw new Error("Failed to download template");
}

export interface ValidateBulkResult {
  job_id: number;
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  errors: { row: number; field: string; message: string }[];
  validation_token: string | null;
}

/** Bulk upload validate/import can take minutes on large legacy CSVs. */
const BULK_UPLOAD_TIMEOUT_MS = 15 * 60 * 1000;

export async function validateBulkUpload(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await adminRequest<ValidateBulkResult>(
    "v1/admin/bulk-upload/validate/",
    { method: "POST", body: fd, timeoutMs: BULK_UPLOAD_TIMEOUT_MS },
  );
  return unwrap(res);
}

export interface ImportBulkResult {
  job_id: number;
  async?: boolean;
  imported?: number;
  failed?: { row: number; field: string; message: string }[];
  task_id?: string;
  queued_rows?: number;
}

export async function importBulkUpload(body: {
  validation_token: string;
  branch_id?: number;
}) {
  const res = await adminRequest<ImportBulkResult>(
    "v1/admin/bulk-upload/import/",
    { method: "POST", body, timeoutMs: BULK_UPLOAD_TIMEOUT_MS },
  );
  return unwrap(res);
}

export async function fetchBulkImportStatus(taskId: string) {
  const res = await adminRequest<{
    state: string;
    job?: {
      job_id: number;
      status: "queued" | "processing" | "completed" | "failed";
      imported_count: number;
      error_rows: number;
    };
    result?: { ok: boolean; imported: number; failed: unknown[] };
    error?: string;
  }>(`v1/admin/bulk-upload/status/${taskId}/`);
  return unwrap(res);
}

export interface BulkUploadHistoryRow {
  id: number;
  uploaded_by_name: string;
  branch_name: string;
  file_name: string;
  file_format: "csv" | "xlsx";
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  imported_count: number;
  status: "validated" | "queued" | "processing" | "completed" | "failed";
  validation_token: string;
  task_id: string;
  error_details: Array<{ row: number; field: string; message: string }>;
  created_at: string;
  completed_at: string | null;
}

export interface BulkUploadHistoryData {
  count: number;
  next: string | null;
  previous: string | null;
  results: BulkUploadHistoryRow[];
}

function normalizeHistoryPayload(payload: unknown): BulkUploadHistoryData {
  if (Array.isArray(payload)) {
    return {
      count: payload.length,
      next: null,
      previous: null,
      results: payload as BulkUploadHistoryRow[],
    };
  }
  const p =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const resultsRaw = Array.isArray(p.results)
    ? p.results
    : Array.isArray(p.data)
      ? p.data
      : [];
  return {
    count: typeof p.count === "number" ? p.count : resultsRaw.length,
    next: (p.next as string | null | undefined) ?? null,
    previous: (p.previous as string | null | undefined) ?? null,
    results: resultsRaw as BulkUploadHistoryRow[],
  };
}

export async function fetchBulkUploadHistory(params?: {
  page?: number;
  page_size?: number;
  status?: "validated" | "queued" | "processing" | "completed" | "failed";
}) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  const res = await adminRequest<BulkUploadHistoryData>(
    qs
      ? `v1/admin/bulk-upload/history/?${qs}`
      : "v1/admin/bulk-upload/history/",
  );
  return normalizeHistoryPayload(await unwrap(res));
}
