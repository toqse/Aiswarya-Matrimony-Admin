import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface AppConfigData {
  android_version: string;
  ios_version: string;
  android_force_update: boolean;
  ios_force_update: boolean;
  updated_at: string;
}

export type AppConfigPatch = Partial<
  Pick<
    AppConfigData,
    "android_version" | "ios_version" | "android_force_update" | "ios_force_update"
  >
>;

export async function fetchAppConfig() {
  const res = await adminRequest<AppConfigData>("v1/admin/app-config/");
  return unwrap(res);
}

export async function updateAppConfig(body: AppConfigPatch) {
  const res = await adminRequest<AppConfigData>("v1/admin/app-config/", {
    method: "PATCH",
    body,
  });
  return unwrap(res);
}
