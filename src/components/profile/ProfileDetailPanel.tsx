import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatDate, formatTimeOfBirthDisplay } from "@/lib/format-date";
import { ProfileHoroscopeView } from "@/components/horoscope/ProfileHoroscopeView";

const PHOTO_ORDER: { key: string; label: string }[] = [
  { key: "full_photo", label: "Full Photo" },
  { key: "passport_photo", label: "Passport Photo" },
  { key: "profile_photo", label: "Profile Photo" },
  { key: "selfie_photo", label: "Selfie Photo" },
  { key: "family_photo", label: "Family Photo" },
  { key: "aadhaar_front", label: "Aadhaar Front" },
  { key: "aadhaar_back", label: "Aadhaar Back" },
];

export function displayOrDash(v: unknown): string {
  if (v == null || v === "") return "NA";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "NA";
  const s = String(v).trim();
  return s || "NA";
}

function formatPartnerCastePreferences(
  value: unknown,
  religion?: Record<string, unknown>,
): string {
  if (value == null || value === "") return "NA";
  if (typeof value === "string") return value.trim() || "NA";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "NA";
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return "NA";
    const idToName: Record<string, string> = {};
    if (religion?.religion_id != null && religion.religion != null) {
      idToName[String(religion.religion_id)] = String(religion.religion);
    }
    const ids = religion?.partner_religion_ids;
    const names = religion?.partner_religion_names;
    if (Array.isArray(ids) && Array.isArray(names)) {
      ids.forEach((id, index) => {
        const name = names[index];
        if (id != null && name != null && String(name).trim() !== "") {
          idToName[String(id)] = String(name);
        }
      });
    }
    return entries
      .map(([religionKey, castes]) => {
        const label = idToName[religionKey] ?? religionKey;
        const casteList = Array.isArray(castes)
          ? castes.map(String).filter(Boolean).join(", ")
          : displayOrDash(castes);
        return casteList && casteList !== "NA" ? `${label}: ${casteList}` : `${label}: All`;
      })
      .join(" · ");
  }
  return String(value);
}

function partnerPreferenceSummary(religion: Record<string, unknown>): string {
  const label = religion.partner_preference_type_label ?? religion.partner_preference_type;
  if (label != null && String(label).trim() !== "") return String(label);
  return displayOrDash(religion.partner_religion_preference);
}

function partnerReligionSummary(religion: Record<string, unknown>): string {
  const names = religion.partner_religion_names;
  if (Array.isArray(names) && names.length) {
    return names.map(String).filter(Boolean).join(", ");
  }
  return displayOrDash(religion.partner_religion_ids);
}

function partnerAgeRange(religion: Record<string, unknown>): string {
  const from = religion.partner_age_from;
  const to = religion.partner_age_to;
  const hasFrom = from != null && String(from).trim() !== "";
  const hasTo = to != null && String(to).trim() !== "";
  if (hasFrom && hasTo) return `${from} – ${to}`;
  if (hasFrom) return `From ${from}`;
  if (hasTo) return `Up to ${to}`;
  return "NA";
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function FieldGrid({ rows }: { rows: [string, unknown][] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {rows.map(([k, v]) => (
        <div key={k} className="rounded-md border bg-card p-3">
          <p className="text-xs text-muted-foreground">{k}</p>
          <p className="font-medium text-sm break-words">{displayOrDash(v)}</p>
        </div>
      ))}
    </div>
  );
}

export interface ProfileDetailPanelProps {
  detail: Record<string, unknown>;
  showAdmin?: boolean;
}

/** Read-only profile sections aligned with Add/Edit profile wizard fields. */
export function ProfileDetailPanel({ detail, showAdmin = true }: ProfileDetailPanelProps) {
  const basic = (detail.basic_details as Record<string, unknown> | undefined) ?? {};
  const photos = (detail.photos as Record<string, string | null> | undefined) ?? {};
  const religion = (detail.religion_details as Record<string, unknown> | undefined) ?? {};
  const personal = (detail.personal_details as Record<string, unknown> | undefined) ?? {};
  const location = (detail.location_details as Record<string, unknown> | undefined) ?? {};
  const education = (detail.education_details as Record<string, unknown> | undefined) ?? {};
  const family = (detail.family_details as Record<string, unknown> | undefined) ?? {};
  const horoscope = (detail.horoscope_details as Record<string, unknown> | undefined) ?? {};
  const admin = (detail.admin as Record<string, unknown> | undefined) ?? {};

  const hasHoroscope = Boolean(horoscope.has_horoscope ?? admin?.has_horoscope);
  const photoEntries = PHOTO_ORDER.map(({ key, label }) => ({ key, label, url: photos[key] })).filter(
    (p) => Boolean(p.url),
  );

  return (
    <div className="space-y-5 text-sm">
      <Section title="Record">
        <FieldGrid
          rows={[
            ["Matrimony ID", detail.matri_id],
            ["Reg No", detail.reg_no],
            ["Profile UUID", detail.id],
          ]}
        />
      </Section>

      <Separator />

      <Section title="Basic details">
        <FieldGrid
          rows={[
            ["Profile for", basic.profile_for ?? detail.profile_for],
            ["Name", basic.name],
            ["Mobile", formatPhoneDisplay(basic.phone)],
            ["Email", basic.email],
            ["Date of birth", formatDate(basic.dob)],
            ["Age", basic.age],
            ["Gender", basic.gender],
            ["Has horoscope", hasHoroscope],
          ]}
        />
      </Section>

      {hasHoroscope && (
        <>
          <Separator />
          <Section title="Horoscope profile">
            <FieldGrid
              rows={[
                ["Time of birth", formatTimeOfBirthDisplay(horoscope.time_of_birth) || horoscope.time_of_birth],
                ["Place of birth", horoscope.place_of_birth],
                ["Latitude", horoscope.birth_latitude],
                ["Longitude", horoscope.birth_longitude],
                ["Timezone", horoscope.birth_timezone],
              ]}
            />
            {detail.id != null && String(detail.id).trim() !== "" ? (
              <div className="mt-3">
                <ProfileHoroscopeView userUuid={String(detail.id)} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Profile UUID is missing, so the chart cannot be loaded here. Open Horoscope Management to view it.
              </p>
            )}
          </Section>
        </>
      )}

      <Separator />

      <Section title="Location">
        <FieldGrid
          rows={[
            ["Country", location.country ?? location.country_id],
            ["State", location.state ?? location.state_id],
            ["District", location.district ?? location.district_id],
            ["City", location.city ?? location.city_id],
            ["Address", location.address],
          ]}
        />
      </Section>

      <Separator />

      <Section title="Religion">
        <FieldGrid
          rows={[
            ["Religion", religion.religion ?? religion.religion_id],
            ["Caste", religion.caste ?? religion.caste_id],
            ["Mother tongue", religion.mother_tongue ?? religion.mother_tongue_id],
          ]}
        />
      </Section>

      <Separator />

      <Section title="Personal details">
        <FieldGrid
          rows={[
            ["Marital status", personal.marital_status ?? personal.marital_status_id],
            ...(String(personal.marital_status ?? "").toLowerCase() === "divorced"
              ? [["Reason for divorce", personal.reason_for_divorce] as const]
              : []),
            ["Has children", personal.has_children],
            [
              "Number of children",
              personal.children_count ?? personal.number_of_children,
            ],
            ["Height (cm)", personal.height_cm],
            ["Weight (kg)", personal.weight_kg],
            ["Complexion", personal.colour ?? personal.complexion],
            ["Blood group", personal.blood_group],
            ["Annual income", education.annual_income ?? education.annual_income_id],
          ]}
        />
      </Section>

      <Separator />

      <Section title="Education & career">
        <FieldGrid
          rows={[
            ["Highest education", education.highest_education ?? education.highest_education_id],
            ["Education subject", education.education_subject ?? education.education_subject_id],
            ["Employment status", education.employment_status],
            ["Occupation", education.occupation ?? education.occupation_id],
          ]}
        />
      </Section>

      <Separator />

      <Section title="Family details">
        <FieldGrid
          rows={[
            ["Father's name", family.father_name],
            ["Father's occupation", family.father_occupation],
            ["Father's status", family.father_status === "Deceased" ? "Late" : family.father_status],
            ["Mother's name", family.mother_name],
            ["Mother's occupation", family.mother_occupation],
            ["Mother's status", family.mother_status === "Deceased" ? "Late" : family.mother_status],
            ["Brothers", family.brothers],
            ["Married brothers", family.married_brothers],
            ["Sisters", family.sisters],
            ["Married sisters", family.married_sisters],
            ["Brother's occupation", family.brother_occupation],
            ["Sister's occupation", family.sister_occupation],
            ["Family type", family.family_type],
            ["Family status", family.family_status],
            ["Family contact", family.family_contact],
            ["Family contact 2", family.family_contact_2],
            ["About family", family.about_family],
          ]}
        />
      </Section>

      <Separator />

      <Section title="Partner preference">
        <FieldGrid
          rows={[
            ["Preference type", partnerPreferenceSummary(religion)],
            ["Partner religions", partnerReligionSummary(religion)],
            [
              "Partner caste preference",
              formatPartnerCastePreferences(
                religion.partner_caste_preferences ?? religion.partner_caste_preference,
                religion,
              ),
            ],
            ["Partner age range", partnerAgeRange(religion)],
          ]}
        />
      </Section>

      {detail.about_me != null && String(detail.about_me).trim() !== "" && (
        <>
          <Separator />
          <Section title="About me">
            <div className="rounded-md border bg-card p-3">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{String(detail.about_me)}</p>
            </div>
          </Section>
        </>
      )}

      <Separator />

      <Section title="Photos & documents">
        {photoEntries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photoEntries.map(({ key, label, url }) => (
              <div key={key} className="rounded-md border overflow-hidden bg-muted/30">
                <p className="text-xs text-muted-foreground px-2 pt-2">{label}</p>
                <a href={url!} target="_blank" rel="noopener noreferrer" className="block p-2">
                  <img src={url!} alt={label} className="w-full max-h-36 object-contain rounded" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No photos uploaded.</p>
        )}
      </Section>

      {showAdmin && Object.keys(admin).length > 0 && (
        <>
          <Separator />
          <Section title="Admin">
            <FieldGrid
              rows={[
                ["Profile status", admin.profile_status],
                ["Completion %", admin.profile_completion_percentage],
                ["Admin verified", admin.admin_verified],
                ["Horoscope available", admin.has_horoscope],
                ["Blocked", admin.is_blocked],
              ]}
            />
          </Section>
        </>
      )}
    </div>
  );
}
