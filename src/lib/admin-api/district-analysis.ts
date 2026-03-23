import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export type DistrictAnalysisSortBy = "registrations" | "conversion_rate";

export interface DistrictAnalysisRow {
  district: string;
  district_id: number;
  state_id: number;
  registrations: number;
  paid_users: number;
  active_profiles: number;
  conversion_rate: number;
}

export interface DistrictAnalysisQuery {
  stateId?: number;
  sortBy?: DistrictAnalysisSortBy;
}

export interface DistrictAnalysisGeoJsonFeature {
  type: "Feature";
  geometry: unknown;
  properties: DistrictAnalysisRow;
}

export interface DistrictAnalysisGeoJson {
  type: "FeatureCollection";
  features: DistrictAnalysisGeoJsonFeature[];
}

function toQueryString(params: DistrictAnalysisQuery) {
  const q = new URLSearchParams();
  if (params.stateId != null) q.set("state_id", String(params.stateId));
  if (params.sortBy) q.set("sort_by", params.sortBy);
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchDistrictAnalysis(params: DistrictAnalysisQuery = {}) {
  const res = await adminRequest<DistrictAnalysisRow[]>(`v1/admin/district-analysis/${toQueryString(params)}`);
  return unwrap(res);
}

export async function fetchDistrictAnalysisGeoJson(params: Omit<DistrictAnalysisQuery, "sortBy"> = {}) {
  const res = await adminRequest<DistrictAnalysisGeoJson>(
    `v1/admin/district-analysis/geojson/${toQueryString({ stateId: params.stateId })}`,
  );
  return unwrap(res);
}
