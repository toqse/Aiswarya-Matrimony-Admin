import { adminRequest, adminFetchBlob, downloadBlob } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export async function downloadBulkTemplate(format: "csv" | "xlsx" = "csv") {
  const { ok, blob, filename } = await adminFetchBlob(`v1/admin/bulk-upload/template/?format=${format}`);
  if (!ok) throw new Error("Failed to download template");
  downloadBlob(blob, filename || `bulk_upload_template.${format}`);
}

export interface ValidateBulkResult {
  job_id: number;
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  errors: { row: number; field: string; message: string }[];
  validation_token: string | null;
}

export async function validateBulkUpload(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await adminRequest<ValidateBulkResult>("v1/admin/bulk-upload/validate/", { method: "POST", body: fd });
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

export async function importBulkUpload(body: { validation_token: string; branch_id?: number }) {
  const res = await adminRequest<ImportBulkResult>("v1/admin/bulk-upload/import/", { method: "POST", body });
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
  const res = await adminRequest<BulkUploadHistoryData>(qs ? `v1/admin/bulk-upload/history/?${qs}` : "v1/admin/bulk-upload/history/");
  return unwrap(res);
}
