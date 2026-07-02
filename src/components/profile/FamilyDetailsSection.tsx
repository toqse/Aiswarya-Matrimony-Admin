import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormSectionCard from "@/components/profile/FormSectionCard";

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
}

export function validateFamilyFields(values: FamilyFormFields): string | null {
  if (values.aboutFamily.length > 500) {
    return "About My Family must be 500 characters or fewer.";
  }
  if (values.familyContact && values.familyContact.length !== 10) {
    return "Family Contact Number must be a 10-digit mobile number.";
  }
  if (values.familyContact2 && values.familyContact2.length !== 10) {
    return "Family Contact Number 2 must be a 10-digit mobile number.";
  }
  const countOrNull = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const brothers = countOrNull(values.brothersCount);
  const marriedBrothers = countOrNull(values.marriedBrothersCount);
  const sisters = countOrNull(values.sistersCount);
  const marriedSisters = countOrNull(values.marriedSistersCount);
  if (brothers != null && marriedBrothers != null && marriedBrothers > brothers) {
    return "Married brothers cannot exceed total brothers.";
  }
  if (sisters != null && marriedSisters != null && marriedSisters > sisters) {
    return "Married sisters cannot exceed total sisters.";
  }
  return null;
}

export default function FamilyDetailsSection({ values, onChange }: FamilyDetailsSectionProps) {
  const digitsOnly = (v: string) => v.replace(/\D/g, "");

  return (
    <FormSectionCard title="👨‍👩‍👧‍👦 Family Details">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label>Father&apos;s Name</Label>
          <Input
            value={values.fatherName}
            onChange={(e) => onChange("fatherName", e.target.value)}
            placeholder="Enter father's name"
          />
        </div>
        <div>
          <Label>Father&apos;s Occupation</Label>
          <Input
            value={values.fatherOccupation}
            onChange={(e) => onChange("fatherOccupation", e.target.value)}
            placeholder="Enter father's occupation"
          />
        </div>
        <div>
          <Label>Father&apos;s Status</Label>
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
        </div>
        <div>
          <Label>Mother&apos;s Name</Label>
          <Input
            value={values.motherName}
            onChange={(e) => onChange("motherName", e.target.value)}
            placeholder="Enter mother's name"
          />
        </div>
        <div>
          <Label>Mother&apos;s Occupation</Label>
          <Input
            value={values.motherOccupation}
            onChange={(e) => onChange("motherOccupation", e.target.value)}
            placeholder="Enter mother's occupation"
          />
        </div>
        <div>
          <Label>Mother&apos;s Status</Label>
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
        </div>
        <div>
          <Label>No. of Brothers</Label>
          <Input
            type="number"
            min={0}
            value={values.brothersCount}
            onChange={(e) => onChange("brothersCount", digitsOnly(e.target.value))}
          />
        </div>
        <div>
          <Label>No. of Married Brothers</Label>
          <Input
            type="number"
            min={0}
            value={values.marriedBrothersCount}
            onChange={(e) => onChange("marriedBrothersCount", digitsOnly(e.target.value))}
          />
        </div>
        <div>
          <Label>No. of Sisters</Label>
          <Input
            type="number"
            min={0}
            value={values.sistersCount}
            onChange={(e) => onChange("sistersCount", digitsOnly(e.target.value))}
          />
        </div>
        <div>
          <Label>No. of Married Sisters</Label>
          <Input
            type="number"
            min={0}
            value={values.marriedSistersCount}
            onChange={(e) => onChange("marriedSistersCount", digitsOnly(e.target.value))}
          />
        </div>
        <div>
          <Label>Family Type</Label>
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
        </div>
        <div>
          <Label>Family Status</Label>
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
        </div>
        <div>
          <Label>Family Contact Number (Optional)</Label>
          <PhoneInput
            value={values.familyContact}
            onChange={(v) => onChange("familyContact", v)}
          />
        </div>
        <div>
          <Label>Whatsapp Number (Optional)</Label>
          <PhoneInput
            value={values.familyContact2}
            onChange={(v) => onChange("familyContact2", v)}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Label>About My Family</Label>
          <Textarea
            value={values.aboutFamily}
            onChange={(e) => onChange("aboutFamily", e.target.value.slice(0, 500))}
            rows={4}
            placeholder="Tell us about your family (optional)"
          />
          <p className="mt-1 text-xs text-muted-foreground">{values.aboutFamily.length}/500 characters</p>
        </div>
      </div>
    </FormSectionCard>
  );
}
