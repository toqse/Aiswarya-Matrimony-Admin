import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface MsgConfigData {
  development_mode: boolean;
  auth_key_set: boolean;
  auth_key_masked: string;
  using_env_fallback: boolean;
  integrated_number: string;
  namespace: string;
  updated_at: string;
}

export type MsgConfigPatch = {
  development_mode?: boolean;
  auth_key?: string;
  clear_auth_key?: boolean;
  integrated_number?: string;
  namespace?: string;
};

export async function fetchMsgConfig() {
  const res = await adminRequest<MsgConfigData>("v1/admin/msg-config/");
  return unwrap(res);
}

export async function updateMsgConfig(body: MsgConfigPatch) {
  const res = await adminRequest<MsgConfigData>("v1/admin/msg-config/", {
    method: "PATCH",
    body,
  });
  return unwrap(res);
}
