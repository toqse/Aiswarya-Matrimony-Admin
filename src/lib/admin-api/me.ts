import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface AdminMe {
  id: number;
  name: string;
  email: string;
  mobile: string;
  mobile_display: string;
  role: string;
  role_display: string;
}

export async function fetchAdminMe() {
  const res = await adminRequest<AdminMe>("v1/admin/auth/me/");
  return unwrap(res);
}

export async function updateAdminMe(body: { name: string; email: string }) {
  const res = await adminRequest<AdminMe>("v1/admin/auth/me/", {
    method: "PATCH",
    body,
  });
  return unwrap(res);
}

export async function sendChangePhoneOtp(new_mobile: string) {
  const res = await adminRequest<{ new_mobile: string; otp?: string }>(
    "v1/admin/auth/me/change-phone/send-otp/",
    {
      method: "POST",
      body: { new_mobile },
    },
  );
  return unwrap(res);
}

export async function verifyChangePhoneOtp(body: { new_mobile: string; otp: string }) {
  const res = await adminRequest<AdminMe>("v1/admin/auth/me/change-phone/verify-otp/", {
    method: "POST",
    body,
  });
  return unwrap(res);
}
