import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export type ProfileReportStatus = "pending" | "reviewed" | "dismissed";

export interface ProfileReportRow {
  id: number;
  reporter_matri_id: string;
  reporter_name: string;
  reported_matri_id: string;
  reported_name: string;
  message: string;
  status: ProfileReportStatus;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProfileReportsListData {
  total: number;
  page: number;
  page_size: number;
  results: ProfileReportRow[];
}

export async function fetchProfileReports(params?: {
  status?: ProfileReportStatus | "all";
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status && params.status !== "all") q.set("status", params.status);
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await adminRequest<ProfileReportsListData>(
    qs ? `v1/admin/profile-reports/?${qs}` : "v1/admin/profile-reports/",
  );
  return unwrap(res);
}

export async function updateProfileReportStatus(
  id: number,
  status: ProfileReportStatus,
) {
  const res = await adminRequest<ProfileReportRow>(
    `v1/admin/profile-reports/${id}/`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
  return unwrap(res);
}
