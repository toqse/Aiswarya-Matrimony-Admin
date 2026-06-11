import { adminRequest } from "@/lib/api-client";
import { unwrap } from "@/lib/admin-api/http";

export interface ProfileListRow {
  matri_id: string;
  name: string;
  gender: string;
  age: number;
  religion: string;
  caste: string;
  marital_status: string;
  plan?: string;
  subscription_plan?: string;
  assigned_staff: string;
  verified?: boolean;
  is_verified?: boolean;
  completion_percent?: number;
  completeness?: number;
  profile_status?: "complete" | "incomplete";
  is_wishlisted?: boolean;
  profile_photo?: string | null;
  quick_actions?: Record<string, string>;
  horoscope_available: boolean;
  is_active: boolean;
  is_blocked: boolean;
}

export interface ProfileListData {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProfileListRow[];
}

export interface BranchMyProfilesSummary {
  total_profiles: number;
  verified: number;
  unverified: number;
  subscribed: number;
  incomplete_count?: number;
  incomplete_message?: string;
}

export interface MatchRow {
  matri_id: string;
  name: string;
  age: number | null;
  gender: string;
  religion: string | null;
  caste: string | null;
  marital_status: string | null;
  match_percentage: number;
  admin_verified: boolean;
  profile_photo: string | null;
}

export interface StaffMyProfilesSummary {
  total_profiles: number;
  verified: number;
  unverified: number;
  subscribed: number;
  incomplete_count: number;
  incomplete_message: string | null;
}

export type ProfilesQuery = {
  search?: string;
  /** Explicit phone filter — sent alongside `search` for phone-like queries so backends that don't
   * cover phone in `search` still return matches. */
  phone?: string;
  filter?:
    | "all"
    | "incomplete"
    | "complete"
    | "subscribed"
    | "unsubscribed"
    | "verified"
    | "unverified";
  gender?: "M" | "F" | "O";
  religion_id?: number;
  plan?: string;
  verified?: boolean;
  staff_id?: number;
  page?: number;
  page_size?: number;
  show_inactive?: boolean;
};

function buildProfilesQuery(params?: ProfilesQuery): string {
  const q = new URLSearchParams();
  if (!params) return "";
  if (params.search) q.set("search", params.search);
  if (params.phone) {
    // Backends differ on field name — send the most common aliases so whichever the API
    // recognizes (e.g. `phone`, `mobile`, `mobile_number`, `phone_number`) will match.
    q.set("phone", params.phone);
    q.set("mobile", params.phone);
    q.set("mobile_number", params.phone);
    q.set("phone_number", params.phone);
  }
  if (params.filter) q.set("filter", params.filter);
  if (params.gender) q.set("gender", params.gender);
  if (params.religion_id != null)
    q.set("religion_id", String(params.religion_id));
  if (params.plan) q.set("plan", params.plan);
  if (params.verified != null) q.set("verified", String(params.verified));
  if (params.staff_id != null) q.set("staff_id", String(params.staff_id));
  if (params.page != null) q.set("page", String(params.page));
  if (params.page_size != null) q.set("page_size", String(params.page_size));
  if (params.show_inactive) q.set("show_inactive", "1");
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

/** True for inputs that look like a phone number (mostly digits, length >= 6). */
export function looksLikePhone(input: string): boolean {
  const cleaned = input.replace(/[\s\-()+]/g, "");
  if (cleaned.length < 6) return false;
  return /^\+?\d+$/.test(cleaned);
}

/** Returns a normalized phone string (digits only, with optional leading +) suitable for filtering. */
export function normalizePhoneQuery(input: string): string {
  const t = input.trim();
  if (!looksLikePhone(t)) return "";
  const cleaned = t.replace(/[\s\-()]/g, "");
  return cleaned.startsWith("+") ? cleaned : cleaned.replace(/^0+/, "");
}

export async function fetchAdminProfiles(params?: ProfilesQuery) {
  const res = await adminRequest<ProfileListData>(
    `v1/admin/profiles/${buildProfilesQuery(params)}`,
  );
  return unwrap(res);
}

export async function fetchStaffProfiles(params?: ProfilesQuery) {
  const res = await adminRequest<ProfileListData>(
    `v1/staff/profiles/${buildProfilesQuery(params)}`,
  );
  return unwrap(res);
}

export async function fetchStaffMyProfilesSummary() {
  const res = await adminRequest<StaffMyProfilesSummary>(
    "v1/staff/profiles/summary/",
  );
  return unwrap(res);
}

export async function fetchAdminProfileDetail(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/admin/profiles/${encodeURIComponent(matriId)}/`,
  );
  return unwrap(res);
}

export async function fetchStaffProfileDetail(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/staff/profiles/${encodeURIComponent(matriId)}/`,
  );
  return unwrap(res);
}

export async function fetchStaffProfileMatches(matriId: string, limit = 20) {
  const res = await adminRequest<{ matches: MatchRow[] }>(
    `v1/staff/profiles/${encodeURIComponent(matriId)}/matches/?limit=${limit}`,
  );
  const data = unwrap(res);
  return data.matches ?? [];
}

export async function fetchStaffProfilePublicDetail(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/staff/profiles/${encodeURIComponent(matriId)}/public-detail/`,
  );
  return unwrap(res);
}

export async function patchAdminProfile(
  matriId: string,
  body: Record<string, unknown> | FormData,
) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/admin/profiles/${encodeURIComponent(matriId)}/`,
    {
      method: "PATCH",
      body,
    },
  );
  return unwrap(res);
}

/** Section-wise admin profile updates: `PATCH /api/v1/admin/profiles/{matri_id}/{section}/`. */
function adminProfileSectionPath(
  matriId: string,
  section:
    | "basic"
    | "location"
    | "religion"
    | "personal"
    | "education"
    | "about"
    | "photos",
) {
  return `v1/admin/profiles/${encodeURIComponent(matriId)}/${section}/`;
}

export async function patchAdminProfileBasic(
  matriId: string,
  body: Record<string, unknown>,
) {
  const res = await adminRequest<Record<string, unknown>>(
    adminProfileSectionPath(matriId, "basic"),
    {
      method: "PATCH",
      body,
    },
  );
  return unwrap(res);
}

export async function patchAdminProfileLocation(
  matriId: string,
  body: Record<string, unknown>,
) {
  const res = await adminRequest<Record<string, unknown>>(
    adminProfileSectionPath(matriId, "location"),
    {
      method: "PATCH",
      body,
    },
  );
  return unwrap(res);
}

export async function patchAdminProfileReligion(
  matriId: string,
  body: Record<string, unknown>,
) {
  const res = await adminRequest<Record<string, unknown>>(
    adminProfileSectionPath(matriId, "religion"),
    {
      method: "PATCH",
      body,
    },
  );
  return unwrap(res);
}

export async function patchAdminProfilePersonal(
  matriId: string,
  body: Record<string, unknown>,
) {
  const res = await adminRequest<Record<string, unknown>>(
    adminProfileSectionPath(matriId, "personal"),
    {
      method: "PATCH",
      body,
    },
  );
  return unwrap(res);
}

export async function patchAdminProfileEducation(
  matriId: string,
  body: Record<string, unknown>,
) {
  const res = await adminRequest<Record<string, unknown>>(
    adminProfileSectionPath(matriId, "education"),
    {
      method: "PATCH",
      body,
    },
  );
  return unwrap(res);
}

export async function patchAdminProfileAbout(
  matriId: string,
  body: Record<string, unknown>,
) {
  const res = await adminRequest<Record<string, unknown>>(
    adminProfileSectionPath(matriId, "about"),
    {
      method: "PATCH",
      body,
    },
  );
  return unwrap(res);
}

export async function patchAdminProfilePhotos(
  matriId: string,
  formData: FormData,
) {
  const res = await adminRequest<Record<string, unknown>>(
    adminProfileSectionPath(matriId, "photos"),
    {
      method: "PATCH",
      body: formData,
    },
  );
  return unwrap(res);
}

export async function patchStaffProfile(
  matriId: string,
  body: Record<string, unknown> | FormData,
) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/staff/profiles/${encodeURIComponent(matriId)}/`,
    {
      method: "PATCH",
      body,
    },
  );
  return unwrap(res);
}

export async function patchProfileVerify(matriId: string, verified?: boolean) {
  const body = verified == null ? {} : { verified };
  const res = await adminRequest<Record<string, unknown>>(
    `v1/admin/profiles/${encodeURIComponent(matriId)}/verify/`,
    {
      method: "PATCH",
      body,
    },
  );
  return unwrap(res);
}

export async function patchProfileAssignStaff(
  matriId: string,
  staffId: number,
) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/admin/profiles/${encodeURIComponent(matriId)}/assign-staff/`,
    {
      method: "PATCH",
      body: { staff_id: staffId },
    },
  );
  return unwrap(res);
}

export async function patchProfileBlock(matriId: string, blocked?: boolean) {
  const body = blocked == null ? {} : { blocked };
  const res = await adminRequest<Record<string, unknown>>(
    `v1/admin/profiles/${encodeURIComponent(matriId)}/block/`,
    {
      method: "PATCH",
      body,
    },
  );
  return unwrap(res);
}

export async function deleteAdminProfile(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/admin/profiles/${encodeURIComponent(matriId)}/`,
    {
      method: "DELETE",
    },
  );
  return unwrap(res);
}

export async function fetchBranchMyProfilesSummary() {
  const res = await adminRequest<BranchMyProfilesSummary>(
    "v1/branch/my-profiles/summary/",
  );
  return unwrap(res);
}

export async function fetchBranchMyProfiles(params?: ProfilesQuery) {
  const res = await adminRequest<ProfileListData>(
    `v1/branch/my-profiles/${buildProfilesQuery(params)}`,
  );
  return unwrap(res);
}

export async function fetchBranchMyProfileDetail(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/branch/my-profiles/${encodeURIComponent(matriId)}/`,
  );
  return unwrap(res);
}

export async function patchBranchMyProfile(
  matriId: string,
  body: Record<string, unknown> | FormData,
) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/branch/my-profiles/${encodeURIComponent(matriId)}/`,
    {
      method: "PATCH",
      body,
    },
  );
  return unwrap(res);
}

export async function patchBranchMyProfileVerify(
  matriId: string,
  verified?: boolean,
) {
  const body = verified == null ? {} : { verified };
  const res = await adminRequest<Record<string, unknown>>(
    `v1/branch/my-profiles/${encodeURIComponent(matriId)}/verify/`,
    {
      method: "PATCH",
      body,
    },
  );
  return unwrap(res);
}

export async function createBranchMyProfile(
  body: FormData | Record<string, unknown>,
) {
  const res = await adminRequest<Record<string, unknown>>(
    "v1/branch/my-profiles/create/",
    {
      method: "POST",
      body,
    },
  );
  return unwrap(res);
}

export async function refreshBranchMyProfile(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/branch/my-profiles/${encodeURIComponent(matriId)}/refresh/`,
    {
      method: "PATCH",
    },
  );
  return unwrap(res);
}

export async function toggleBranchMyProfileWishlist(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/branch/my-profiles/${encodeURIComponent(matriId)}/wishlist/`,
    {
      method: "POST",
    },
  );
  return unwrap(res);
}

export async function fetchBranchMyProfileDocuments(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/branch/my-profiles/${encodeURIComponent(matriId)}/documents/`,
  );
  return unwrap(res);
}

export async function sendBranchMyProfileEmail(
  matriId: string,
  body: { template_id: number },
) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/branch/my-profiles/${encodeURIComponent(matriId)}/send-email/`,
    {
      method: "POST",
      body,
    },
  );
  return unwrap(res);
}

export async function refreshStaffProfile(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/staff/profiles/${encodeURIComponent(matriId)}/refresh/`,
    {
      method: "PATCH",
    },
  );
  return unwrap(res);
}

export async function toggleStaffProfileWishlist(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/staff/profiles/${encodeURIComponent(matriId)}/wishlist/`,
    {
      method: "POST",
    },
  );
  return unwrap(res);
}

export async function sendStaffProfileEmail(
  matriId: string,
  body: { template_id: number },
) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/staff/profiles/${encodeURIComponent(matriId)}/send-email/`,
    {
      method: "POST",
      body,
    },
  );
  return unwrap(res);
}

export async function fetchStaffProfileDocuments(matriId: string) {
  const res = await adminRequest<Record<string, unknown>>(
    `v1/staff/profiles/${encodeURIComponent(matriId)}/documents/`,
  );
  return unwrap(res);
}

export async function createStaffProfile(
  body: Record<string, unknown> | FormData,
) {
  const res = await adminRequest<Record<string, unknown>>(
    "v1/staff/profiles/create/",
    {
      method: "POST",
      body,
    },
  );
  return unwrap(res);
}

export async function createAdminProfile(
  body: Record<string, unknown> | FormData,
) {
  const res = await adminRequest<Record<string, unknown>>(
    "v1/admin/profiles/create/",
    {
      method: "POST",
      body,
    },
  );
  return unwrap(res);
}
