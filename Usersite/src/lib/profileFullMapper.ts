/**
 * Maps GET /api/v1/profiles/{matri_id}/full/ `data.profile` (same section shape as GET /profile/)
 * into fields used by ProfileViewDrawer.
 */
export type FullProfileDrawerDisplay = {
  name: string;
  age: number;
  location: string;
  about_me: string;
  familyText: string;
  religion: string;
  caste: string;
  education: string;
  occupation: string;
  annual_income: string;
  employment: string;
  marital_status: string;
  height: string;
  mother_tongue: string;
  profile_photo: string | null;
  phone: string | null;
  email: string | null;
  /** True if API included phone/email in basic_details */
  hasContactInProfile: boolean;
};

function ageFromDob(dob: unknown): number {
  if (dob == null || typeof dob !== "string") return 0;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  let age = new Date().getFullYear() - d.getFullYear();
  const m = new Date().getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && new Date().getDate() < d.getDate())) age--;
  return Math.max(0, age);
}

export function mapFullProfileToDrawerDisplay(
  profile: unknown,
): FullProfileDrawerDisplay | null {
  if (!profile || typeof profile !== "object") return null;
  const p = profile as Record<string, unknown>;

  const bd = (p.basic_details as Record<string, unknown>) ?? {};
  const loc = (p.location_details as Record<string, unknown>) ?? {};
  const rel = (p.religion_details as Record<string, unknown>) ?? {};
  const per = (p.personal_details as Record<string, unknown>) ?? {};
  const edu = (p.education_details as Record<string, unknown>) ?? {};
  const fam = (p.family_details as Record<string, unknown>) ?? {};
  const photos = (p.photos as Record<string, unknown>) ?? {};

  const phone =
    bd.phone != null && String(bd.phone).trim()
      ? String(bd.phone).trim()
      : null;
  const email =
    bd.email != null && String(bd.email).trim()
      ? String(bd.email).trim()
      : null;

  const city = loc.city != null ? String(loc.city) : "";
  const district = loc.district != null ? String(loc.district) : "";
  const state = loc.state != null ? String(loc.state) : "";
  const location =
    [city, district, state].filter(Boolean).join(", ") ||
    String(loc.address ?? "");

  const famLines: string[] = [];
  if (fam.father_name)
    famLines.push(
      `Father: ${fam.father_name}${fam.father_occupation ? ` (${fam.father_occupation})` : ""}`,
    );
  if (fam.mother_name)
    famLines.push(
      `Mother: ${fam.mother_name}${fam.mother_occupation ? ` (${fam.mother_occupation})` : ""}`,
    );
  const sib: string[] = [];
  if (fam.brothers != null)
    sib.push(
      `Brothers: ${fam.brothers} (married: ${fam.married_brothers ?? 0})`,
    );
  if (fam.sisters != null)
    sib.push(`Sisters: ${fam.sisters} (married: ${fam.married_sisters ?? 0})`);
  if (sib.length) famLines.push(sib.join(". "));
  const aboutFamily =
    fam.about_family != null ? String(fam.about_family).trim() : "";
  const familyText = aboutFamily || famLines.join(". ") || "";

  const heightRaw = per.height_cm;
  const height =
    heightRaw != null
      ? typeof heightRaw === "number"
        ? `${heightRaw} cm`
        : String(heightRaw)
      : "";

  return {
    name: bd.name != null ? String(bd.name) : "",
    age: ageFromDob(bd.dob) || 0,
    location,
    about_me: p.about_me != null ? String(p.about_me) : "",
    familyText,
    religion: rel.religion != null ? String(rel.religion) : "",
    caste: rel.caste != null ? String(rel.caste) : "",
    education:
      edu.highest_education != null ? String(edu.highest_education) : "",
    occupation: edu.occupation != null ? String(edu.occupation) : "",
    annual_income: edu.annual_income != null ? String(edu.annual_income) : "",
    employment:
      edu.employment_status != null ? String(edu.employment_status) : "",
    marital_status:
      per.marital_status != null ? String(per.marital_status) : "",
    height,
    mother_tongue: rel.mother_tongue != null ? String(rel.mother_tongue) : "",
    profile_photo:
      photos.profile_photo != null ? String(photos.profile_photo) : null,
    phone,
    email,
    hasContactInProfile: !!(phone || email),
  };
}
