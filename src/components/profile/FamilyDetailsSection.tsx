import ProfileFormField, {
  fieldError,
  invalidInputClass,
  type ProfileFieldErrors,
} from "@/components/profile/ProfileFormField";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormSectionCard from "@/components/profile/FormSectionCard";
import { validateFamilyFieldErrors } from "@/lib/profile-validation";

export const FAMILY_TYPE_OPTIONS = [
  "Nuclear Family",
  "Joint Family",
  "Extended Family",
] as const;

export const FAMILY_STATUS_OPTIONS = [
  "Middle Class",
  "Upper Middle Class",
  "Rich / Affluent",
  "High Class",
] as const;

export const PARENT_STATUS_OPTIONS = ["Alive", "Deceased"] as const;

export interface FamilyFormFields {
  fatherName: string;
  fatherOccupation: string;
  fatherStatus: string;
  motherName: string;
  motherOccupation: string;
  motherStatus: string;
  brothersCount: string;
  marriedBrothersCount: string;
  sistersCount: string;
  marriedSistersCount: string;
  brotherOccupation: string;
  sisterOccupation: string;
  familyType: string;
  familyStatus: string;
  familyContact: string;
  familyContact2: string;
  aboutFamily: string;
}

export const EMPTY_FAMILY_FIELDS: FamilyFormFields = {
  fatherName: "",
  fatherOccupation: "",
  fatherStatus: "Alive",
  motherName: "",
  motherOccupation: "",
  motherStatus: "Alive",
  brothersCount: "",
  marriedBrothersCount: "",
  sistersCount: "",
  marriedSistersCount: "",
  brotherOccupation: "",
  sisterOccupation: "",
  familyType: "",
  familyStatus: "",
  familyContact: "",
  familyContact2: "",
  aboutFamily: "",
};

type FamilyFieldKey = keyof FamilyFormFields;

interface FamilyDetailsSectionProps {
  values: FamilyFormFields;
  onChange: <K extends FamilyFieldKey>(field: K, value: FamilyFormFields[K]) => void;
  errors?: ProfileFieldErrors;
}

/** @deprecated Use validateFamilyFieldErrors from @/lib/profile-validation */
export function validateFamilyFields(values: FamilyFormFields): string | null {
  const errs = validateFamilyFieldErrors(values);
  const first = Object.values(errs)[0];
  return first ?? null;
}

export default function FamilyDetailsSection({ values, onChange, errors }: FamilyDetailsSectionProps) {
  const digitsOnly = (v: string) => v.replace(/\D/g, "");

  return (
    <FormSectionCard title="👨‍👩‍👧‍👦 Family Details">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProfileFormField label="Father's Name">
          <Input
            value={values.fatherName}
            onChange={(e) => onChange("fatherName", e.target.value)}
            placeholder="Enter father's name"
          />
        </ProfileFormField>
        <ProfileFormField label="Father's Occupation">
          <Input
            value={values.fatherOccupation}
            onChange={(e) => onChange("fatherOccupation", e.target.value)}
            placeholder="Enter father's occupation"
          />
        </ProfileFormField>
        <ProfileFormField label="Father's Status">
          <Select value={values.fatherStatus} onValueChange={(v) => onChange("fatherStatus", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {PARENT_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ProfileFormField>
        <ProfileFormField label="Mother's Name">
          <Input
            value={values.motherName}
            onChange={(e) => onChange("motherName", e.target.value)}
            placeholder="Enter mother's name"
          />
        </ProfileFormField>
        <ProfileFormField label="Mother's Occupation">
          <Input
            value={values.motherOccupation}
            onChange={(e) => onChange("motherOccupation", e.target.value)}
            placeholder="Enter mother's occupation"
          />
        </ProfileFormField>
        <ProfileFormField label="Mother's Status">
          <Select value={values.motherStatus} onValueChange={(v) => onChange("motherStatus", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {PARENT_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ProfileFormField>
        <ProfileFormField label="No. of Brothers">
          <Input
            type="number"
            min={0}
            value={values.brothersCount}
            onChange={(e) => onChange("brothersCount", digitsOnly(e.target.value))}
          />
        </ProfileFormField>
        <ProfileFormField
          label="No. of Married Brothers"
          error={fieldError(errors, "marriedBrothersCount")}
        >
          <Input
            type="number"
            min={0}
            value={values.marriedBrothersCount}
            onChange={(e) => onChange("marriedBrothersCount", digitsOnly(e.target.value))}
            className={invalidInputClass(fieldError(errors, "marriedBrothersCount"))}
            aria-invalid={Boolean(fieldError(errors, "marriedBrothersCount"))}
          />
        </ProfileFormField>
        <ProfileFormField label="No. of Sisters">
          <Input
            type="number"
            min={0}
            value={values.sistersCount}
            onChange={(e) => onChange("sistersCount", digitsOnly(e.target.value))}
          />
        </ProfileFormField>
        <ProfileFormField
          label="No. of Married Sisters"
          error={fieldError(errors, "marriedSistersCount")}
        >
          <Input
            type="number"
            min={0}
            value={values.marriedSistersCount}
            onChange={(e) => onChange("marriedSistersCount", digitsOnly(e.target.value))}
            className={invalidInputClass(fieldError(errors, "marriedSistersCount"))}
            aria-invalid={Boolean(fieldError(errors, "marriedSistersCount"))}
          />
        </ProfileFormField>
        <ProfileFormField label="Brother's Occupation">
          <Input
            value={values.brotherOccupation}
            onChange={(e) => onChange("brotherOccupation", e.target.value)}
            placeholder="e.g. Software Engineer"
          />
        </ProfileFormField>
        <ProfileFormField label="Sister's Occupation">
          <Input
            value={values.sisterOccupation}
            onChange={(e) => onChange("sisterOccupation", e.target.value)}
            placeholder="e.g. Teacher"
          />
        </ProfileFormField>
        <ProfileFormField label="Family Type">
          <Select value={values.familyType} onValueChange={(v) => onChange("familyType", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select family type" />
            </SelectTrigger>
            <SelectContent>
              {FAMILY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ProfileFormField>
        <ProfileFormField label="Family Status">
          <Select value={values.familyStatus} onValueChange={(v) => onChange("familyStatus", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select family status" />
            </SelectTrigger>
            <SelectContent>
              {FAMILY_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ProfileFormField>
        <ProfileFormField
          label="Family Contact Number (Optional)"
          error={fieldError(errors, "familyContact")}
        >
          <PhoneInput
            value={values.familyContact}
            onChange={(v) => onChange("familyContact", v)}
            invalid={Boolean(fieldError(errors, "familyContact"))}
          />
        </ProfileFormField>
        <ProfileFormField
          label="Whatsapp Number (Optional)"
          error={fieldError(errors, "familyContact2")}
        >
          <PhoneInput
            value={values.familyContact2}
            onChange={(v) => onChange("familyContact2", v)}
            invalid={Boolean(fieldError(errors, "familyContact2"))}
          />
        </ProfileFormField>
        <ProfileFormField
          label="About My Family"
          className="sm:col-span-2 lg:col-span-3"
          error={fieldError(errors, "aboutFamily")}
        >
          <Textarea
            value={values.aboutFamily}
            onChange={(e) => onChange("aboutFamily", e.target.value.slice(0, 500))}
            rows={4}
            placeholder="Tell us about your family (optional)"
            className={invalidInputClass(fieldError(errors, "aboutFamily"))}
            aria-invalid={Boolean(fieldError(errors, "aboutFamily"))}
          />
          <p className="mt-1 text-xs text-muted-foreground">{values.aboutFamily.length}/500 characters</p>
        </ProfileFormField>
      </div>
    </FormSectionCard>
  );
}
